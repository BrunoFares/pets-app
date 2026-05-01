from __future__ import annotations

import argparse
import json
import sys
import wave
from dataclasses import dataclass
from pathlib import Path

import numpy as np

SAMPLE_RATE = 16000
CLIP_DURATION = 2.0
NUM_SAMPLES = int(SAMPLE_RATE * CLIP_DURATION)
WINDOW_HOP_SECONDS = 0.5
WINDOW_HOP_SAMPLES = int(SAMPLE_RATE * WINDOW_HOP_SECONDS)
CLIP_AGGREGATION_TOP_K = 2
REFERENCE_CLASS_NAMES = ["cat", "dog", "neither"]
DEFAULT_TORCH_CLASS_NAMES = ["cat", "dog", "others"]


@dataclass(frozen=True)
class ReferenceCentroidModel:
    class_names: list[str]
    feature_order: list[str]
    centroids: dict[str, np.ndarray]
    feature_scales: np.ndarray
    silence_rms_threshold: float
    temperature: float


def normalize_prediction_label(label: str, label_aliases: dict[str, str] | None = None) -> str:
    normalized = label.strip().lower().replace("-", "_") if label else ""

    if label_aliases:
        alias_map = {
            key.strip().lower().replace("-", "_"): value.strip().lower().replace("-", "_")
            for key, value in label_aliases.items()
            if key and value
        }
        visited: set[str] = set()
        while normalized in alias_map and normalized not in visited:
            visited.add(normalized)
            normalized = alias_map[normalized]

    return {
        "cat_meow": "cat",
        "dog_bark": "dog",
        "none": "neither",
        "others": "neither",
    }.get(normalized, normalized)


def load_torch_model_metadata(model_path: Path) -> dict[str, object]:
    metadata_path = model_path.with_suffix(".metadata.json")
    if not metadata_path.exists():
        return {
            "modelType": "simple_audio_cnn_v1",
            "classNames": DEFAULT_TORCH_CLASS_NAMES,
            "labelAliases": {},
            "clipAggregationTopK": CLIP_AGGREGATION_TOP_K,
        }

    payload = json.loads(metadata_path.read_text(encoding="utf-8"))
    payload["metadataPath"] = str(metadata_path)
    payload.setdefault("modelType", "simple_audio_cnn_v1")
    payload.setdefault("classNames", DEFAULT_TORCH_CLASS_NAMES)
    payload.setdefault("clipAggregationTopK", CLIP_AGGREGATION_TOP_K)
    if "labelAliases" not in payload or not isinstance(payload["labelAliases"], dict):
        payload["labelAliases"] = {}
    return payload


def read_pcm_wave(file_path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(file_path), "rb") as audio_file:
        channel_count = audio_file.getnchannels()
        sample_width = audio_file.getsampwidth()
        sample_rate = audio_file.getframerate()
        frame_count = audio_file.getnframes()
        raw_frames = audio_file.readframes(frame_count)

    if sample_width == 1:
        data = np.frombuffer(raw_frames, dtype=np.uint8).astype(np.float32)
        data = (data - 128.0) / 128.0
    elif sample_width == 2:
        data = np.frombuffer(raw_frames, dtype="<i2").astype(np.float32) / 32768.0
    elif sample_width == 3:
        raw = np.frombuffer(raw_frames, dtype=np.uint8).reshape(-1, 3)
        data = (
            raw[:, 0].astype(np.int32)
            | (raw[:, 1].astype(np.int32) << 8)
            | (raw[:, 2].astype(np.int32) << 16)
        )
        data = np.where(data & 0x800000, data - 0x1000000, data).astype(np.float32) / 8388608.0
    elif sample_width == 4:
        data = np.frombuffer(raw_frames, dtype="<i4").astype(np.float32) / 2147483648.0
    else:
        raise RuntimeError(
            f"Unsupported WAV sample width ({sample_width * 8} bits). "
            "Use 8-bit, 16-bit, 24-bit, or 32-bit PCM WAV."
        )

    if channel_count <= 0:
        raise RuntimeError("The WAV file has no audio channels.")

    if data.size % channel_count != 0:
        raise RuntimeError("The WAV file contains incomplete PCM frame data.")

    waveform = data.reshape(-1, channel_count).T
    return waveform.astype(np.float32, copy=False), sample_rate


def load_audio(file_path: Path) -> tuple[np.ndarray, int]:
    if file_path.suffix.lower() in {".wav", ".wave"}:
        return read_pcm_wave(file_path)

    try:
        import soundfile as sf

        waveform_np, sample_rate = sf.read(file_path, dtype="float32", always_2d=True)
        return waveform_np.T.astype(np.float32, copy=False), int(sample_rate)
    except Exception:
        pass

    try:
        import torchaudio

        waveform, sample_rate = torchaudio.load(str(file_path))
        return waveform.cpu().numpy().astype(np.float32, copy=False), int(sample_rate)
    except Exception as exc:
        raise RuntimeError(
            "The audio file could not be decoded. WAV files work without extra dependencies. "
            "Compressed formats such as M4A and WEBM may require FFmpeg or torchaudio decoder support."
        ) from exc


def load_mono_resampled_audio(file_path: Path) -> tuple[np.ndarray, dict[str, object]]:
    waveform, sample_rate = load_audio(file_path)
    original_channel_count = int(waveform.shape[0]) if waveform.ndim > 1 else 1
    original_sample_count = int(waveform.shape[-1])

    if waveform.ndim == 1:
        mono = waveform
    elif waveform.shape[0] == 1:
        mono = waveform[0]
    else:
        mono = waveform.mean(axis=0)

    mono = mono.astype(np.float32, copy=False)

    if sample_rate != SAMPLE_RATE:
        mono = resample_audio(mono, sample_rate, SAMPLE_RATE)

    mono = mono.astype(np.float32, copy=False)
    audio_debug = {
        "originalChannelCount": original_channel_count,
        "originalSampleRate": int(sample_rate),
        "originalSampleCount": original_sample_count,
        "sourceDurationSeconds": round(original_sample_count / max(sample_rate, 1), 6),
        "targetSampleRate": SAMPLE_RATE,
        "targetSampleCount": int(mono.shape[0]),
        "targetDurationSeconds": round(mono.shape[0] / SAMPLE_RATE, 6),
        "fullAudioRms": round(float(np.sqrt(np.mean(np.square(mono)) + 1e-12)), 6),
        "fullAudioPeakAbs": round(float(np.max(np.abs(mono))) if mono.size else 0.0, 6),
        "analysisWindowSeconds": CLIP_DURATION,
        "windowHopSeconds": WINDOW_HOP_SECONDS,
    }
    return mono, audio_debug


def pad_or_trim_clip(samples: np.ndarray) -> np.ndarray:
    if samples.shape[0] < NUM_SAMPLES:
        return np.pad(samples, (0, NUM_SAMPLES - samples.shape[0])).astype(np.float32, copy=False)

    return samples[:NUM_SAMPLES].astype(np.float32, copy=False)


def to_mono_resampled_clip(file_path: Path) -> tuple[np.ndarray, dict[str, object]]:
    full_audio, audio_debug = load_mono_resampled_audio(file_path)
    clip = pad_or_trim_clip(full_audio)
    clip_debug = {
        **audio_debug,
        "windowIndex": 0,
        "windowCount": 1,
        "windowStartSeconds": 0.0,
        "windowEndSeconds": round(min(audio_debug["targetDurationSeconds"], CLIP_DURATION), 6),
        "sourceWindowDurationSeconds": round(min(audio_debug["targetDurationSeconds"], CLIP_DURATION), 6),
        "paddedSamples": max(0, NUM_SAMPLES - int(full_audio.shape[0])),
        "clipRms": round(float(np.sqrt(np.mean(np.square(clip)) + 1e-12)), 6),
        "clipPeakAbs": round(float(np.max(np.abs(clip))) if clip.size else 0.0, 6),
    }
    return clip, clip_debug


def build_sliding_windows(samples: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, object]]]:
    sample_count = int(samples.shape[0])

    if sample_count <= NUM_SAMPLES:
        window = pad_or_trim_clip(samples)
        return [window], [
            {
                "windowIndex": 0,
                "windowStartSeconds": 0.0,
                "windowEndSeconds": round(sample_count / SAMPLE_RATE, 6),
                "sourceWindowDurationSeconds": round(sample_count / SAMPLE_RATE, 6),
                "paddedSamples": max(0, NUM_SAMPLES - sample_count),
                "clipRms": round(float(np.sqrt(np.mean(np.square(window)) + 1e-12)), 6),
                "clipPeakAbs": round(float(np.max(np.abs(window))) if window.size else 0.0, 6),
            }
        ]

    starts = list(range(0, sample_count - NUM_SAMPLES + 1, WINDOW_HOP_SAMPLES))
    last_start = sample_count - NUM_SAMPLES
    if starts[-1] != last_start:
        starts.append(last_start)

    windows: list[np.ndarray] = []
    window_debugs: list[dict[str, object]] = []

    for index, start in enumerate(starts):
        source_end = min(start + NUM_SAMPLES, sample_count)
        raw_window = samples[start:source_end]
        window = pad_or_trim_clip(raw_window)
        windows.append(window)
        window_debugs.append(
            {
                "windowIndex": index,
                "windowStartSeconds": round(start / SAMPLE_RATE, 6),
                "windowEndSeconds": round(source_end / SAMPLE_RATE, 6),
                "sourceWindowDurationSeconds": round((source_end - start) / SAMPLE_RATE, 6),
                "paddedSamples": max(0, NUM_SAMPLES - (source_end - start)),
                "clipRms": round(float(np.sqrt(np.mean(np.square(window)) + 1e-12)), 6),
                "clipPeakAbs": round(float(np.max(np.abs(window))) if window.size else 0.0, 6),
            }
        )

    return windows, window_debugs


def resample_audio(samples: np.ndarray, input_rate: int, output_rate: int) -> np.ndarray:
    if input_rate == output_rate or samples.size == 0:
        return samples.astype(np.float32, copy=False)

    target_length = max(1, int(round(samples.shape[0] * (output_rate / input_rate))))
    source_positions = np.arange(samples.shape[0], dtype=np.float32)
    target_positions = np.linspace(0, samples.shape[0] - 1, num=target_length, dtype=np.float32)
    return np.interp(target_positions, source_positions, samples).astype(np.float32, copy=False)


def extract_reference_features(samples: np.ndarray) -> dict[str, float]:
    samples = samples.astype(np.float32, copy=False)
    rms = float(np.sqrt(np.mean(np.square(samples)) + 1e-12))

    if samples.size < 2:
        return {
            "rms": rms,
            "zero_crossing_rate": 0.0,
            "spectral_centroid": 0.0,
            "spectral_rolloff": 0.0,
            "low_frequency_ratio": 1.0,
        }

    zero_crossing_rate = float(np.mean(np.not_equal(samples[1:] >= 0, samples[:-1] >= 0)))

    window = np.hanning(samples.shape[0]).astype(np.float32)
    magnitudes = np.abs(np.fft.rfft(samples * window)).astype(np.float64)
    freqs = np.fft.rfftfreq(samples.shape[0], d=1.0 / SAMPLE_RATE)
    total_magnitude = float(magnitudes.sum())

    if total_magnitude <= 1e-9:
        spectral_centroid = 0.0
        spectral_rolloff = 0.0
        low_frequency_ratio = 1.0
    else:
        nyquist = SAMPLE_RATE / 2.0
        spectral_centroid = float((freqs * magnitudes).sum() / total_magnitude / nyquist)
        cumulative = np.cumsum(magnitudes)
        rolloff_index = int(np.searchsorted(cumulative, cumulative[-1] * 0.85, side="left"))
        rolloff_index = min(rolloff_index, freqs.shape[0] - 1)
        spectral_rolloff = float(freqs[rolloff_index] / nyquist)
        low_frequency_ratio = float(magnitudes[freqs <= 1000.0].sum() / total_magnitude)

    return {
        "rms": clamp_feature(rms),
        "zero_crossing_rate": clamp_feature(zero_crossing_rate),
        "spectral_centroid": clamp_feature(spectral_centroid),
        "spectral_rolloff": clamp_feature(spectral_rolloff),
        "low_frequency_ratio": clamp_feature(low_frequency_ratio),
    }


def clamp_feature(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def load_reference_model(model_path: Path) -> ReferenceCentroidModel:
    payload = json.loads(model_path.read_text(encoding="utf-8"))

    if payload.get("modelType") != "centroid_classifier_v1":
        raise RuntimeError(f"Unsupported reference model format: {payload.get('modelType')!r}")

    class_names = [str(name) for name in payload.get("classNames", REFERENCE_CLASS_NAMES)]
    feature_order = [str(name) for name in payload["featureOrder"]]

    feature_scales = np.array(
        [float(payload["featureScales"][feature_name]) for feature_name in feature_order],
        dtype=np.float32,
    )

    if np.any(feature_scales <= 0):
        raise RuntimeError("Reference model feature scales must be greater than zero.")

    centroids = {
        label: np.array(
            [float(payload["classCentroids"][label][feature_name]) for feature_name in feature_order],
            dtype=np.float32,
        )
        for label in class_names
    }

    return ReferenceCentroidModel(
        class_names=class_names,
        feature_order=feature_order,
        centroids=centroids,
        feature_scales=feature_scales,
        silence_rms_threshold=float(payload.get("silenceRmsThreshold", 0.015)),
        temperature=float(payload.get("temperature", 0.4)),
    )


def analyze_with_reference_model(
    audio_path: Path,
    model_path: Path,
    minimum_confidence: float,
) -> dict[str, object]:
    model = load_reference_model(model_path)
    clip, clip_debug = to_mono_resampled_clip(audio_path)
    features = extract_reference_features(clip)

    if features["rms"] < model.silence_rms_threshold:
        probabilities = {"cat": 0.03, "dog": 0.03, "neither": 0.94}
        return {
            "label": "neither",
            "rawLabel": "neither",
            "confidence": 0.94,
            "probabilities": probabilities,
            "debug": {
                "modelType": "reference_centroid",
                "minimumConfidence": minimum_confidence,
                "thresholdApplied": False,
                "clip": clip_debug,
                "features": {name: round(value, 6) for name, value in features.items()},
            },
        }

    feature_vector = np.array([features[name] for name in model.feature_order], dtype=np.float32)
    distances = np.array(
        [
            np.mean(np.square((feature_vector - model.centroids[label]) / model.feature_scales))
            for label in model.class_names
        ],
        dtype=np.float64,
    )
    logits = -distances / max(model.temperature, 1e-6)
    logits -= logits.max()
    probabilities_vector = np.exp(logits)
    probabilities_vector /= probabilities_vector.sum()

    probabilities = {
        label: round(float(probabilities_vector[index]), 6)
        for index, label in enumerate(model.class_names)
    }

    predicted_index = int(np.argmax(probabilities_vector))
    raw_label = model.class_names[predicted_index]
    confidence = float(probabilities_vector[predicted_index])
    final_label = raw_label

    if raw_label in {"cat", "dog"} and confidence < minimum_confidence:
        final_label = "neither"

    return {
        "label": final_label,
        "rawLabel": raw_label,
        "confidence": round(confidence, 6),
        "probabilities": probabilities,
        "debug": {
            "modelType": "reference_centroid",
            "minimumConfidence": minimum_confidence,
            "thresholdApplied": final_label != raw_label,
            "clip": clip_debug,
            "features": {name: round(value, 6) for name, value in features.items()},
            "distances": {
                label: round(float(distances[index]), 6)
                for index, label in enumerate(model.class_names)
            },
        },
    }


def analyze_with_torch_model(
    audio_path: Path,
    model_path: Path,
    minimum_confidence: float,
) -> dict[str, object]:
    try:
        import torch
        import torch.nn as nn
        import torchaudio
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "A Torch checkpoint was selected, but torch and torchaudio are not installed in this Python environment."
        ) from exc

    device = torch.device("cpu")

    class SimpleAudioCNN(nn.Module):
        def __init__(self, num_classes: int = 3):
            super().__init__()

            self.features = nn.Sequential(
                nn.Conv2d(1, 16, kernel_size=3, padding=1),
                nn.BatchNorm2d(16),
                nn.ReLU(),
                nn.MaxPool2d(2),
                nn.Conv2d(16, 32, kernel_size=3, padding=1),
                nn.BatchNorm2d(32),
                nn.ReLU(),
                nn.MaxPool2d(2),
                nn.Conv2d(32, 64, kernel_size=3, padding=1),
                nn.BatchNorm2d(64),
                nn.ReLU(),
                nn.MaxPool2d(2),
            )

            self.classifier = nn.Sequential(
                nn.AdaptiveAvgPool2d((1, 1)),
                nn.Flatten(),
                nn.Linear(64, 32),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(32, num_classes),
            )

        def forward(self, x: "torch.Tensor") -> "torch.Tensor":
            x = self.features(x)
            return self.classifier(x)

    class BiggerAudioCNN(nn.Module):
        def __init__(self, num_classes: int = 3):
            super().__init__()

            self.features = nn.Sequential(
                nn.Conv2d(1, 32, kernel_size=3, padding=1),
                nn.BatchNorm2d(32),
                nn.ReLU(),
                nn.Conv2d(32, 32, kernel_size=3, padding=1),
                nn.BatchNorm2d(32),
                nn.ReLU(),
                nn.MaxPool2d(2),
                nn.Conv2d(32, 64, kernel_size=3, padding=1),
                nn.BatchNorm2d(64),
                nn.ReLU(),
                nn.Conv2d(64, 64, kernel_size=3, padding=1),
                nn.BatchNorm2d(64),
                nn.ReLU(),
                nn.MaxPool2d(2),
                nn.Conv2d(64, 128, kernel_size=3, padding=1),
                nn.BatchNorm2d(128),
                nn.ReLU(),
                nn.Conv2d(128, 128, kernel_size=3, padding=1),
                nn.BatchNorm2d(128),
                nn.ReLU(),
                nn.MaxPool2d(2),
                nn.Conv2d(128, 128, kernel_size=3, padding=1),
                nn.BatchNorm2d(128),
                nn.ReLU(),
                nn.MaxPool2d(2),
            )

            self.classifier = nn.Sequential(
                nn.AdaptiveAvgPool2d((1, 1)),
                nn.Flatten(),
                nn.Linear(128, 64),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(64, num_classes),
            )

        def forward(self, x: "torch.Tensor") -> "torch.Tensor":
            x = self.features(x)
            return self.classifier(x)

    def create_model(model_type: str, num_classes: int) -> "nn.Module":
        if model_type == "simple_audio_cnn_v1":
            return SimpleAudioCNN(num_classes=num_classes)

        if model_type == "bigger_audio_cnn_v1":
            return BiggerAudioCNN(num_classes=num_classes)

        raise RuntimeError(f"Unsupported Torch model architecture: {model_type!r}")

    def aggregate_window_probabilities(
        probabilities_tensor: "torch.Tensor",
        top_k: int,
    ) -> tuple["torch.Tensor", int]:
        top_k = min(int(top_k), int(probabilities_tensor.shape[0]))
        aggregated_scores = probabilities_tensor.topk(top_k, dim=0).values.mean(dim=0)
        aggregated_scores = aggregated_scores / aggregated_scores.sum().clamp_min(1e-8)
        predicted_index = int(torch.argmax(aggregated_scores).item())
        return aggregated_scores, predicted_index

    mel_transform = torchaudio.transforms.MelSpectrogram(
        sample_rate=SAMPLE_RATE,
        n_fft=1024,
        hop_length=512,
        n_mels=64,
    )
    db_transform = torchaudio.transforms.AmplitudeToDB()

    def preprocess_torch_clip(clip: np.ndarray) -> tuple["torch.Tensor", dict[str, object]]:
        waveform = torch.from_numpy(clip).unsqueeze(0)
        mel = mel_transform(waveform)
        mel_db = db_transform(mel)
        raw_mel_mean = float(mel_db.mean().item())
        raw_mel_std = float(mel_db.std().item())

        mean = mel_db.mean()
        std = mel_db.std() + 1e-6
        mel_db = (mel_db - mean) / std

        return mel_db.unsqueeze(0), {
            "melShape": [int(value) for value in mel_db.shape],
            "melDbMeanBeforeNormalization": round(raw_mel_mean, 6),
            "melDbStdBeforeNormalization": round(raw_mel_std, 6),
            "melDbMeanAfterNormalization": round(float(mel_db.mean().item()), 6),
            "melDbStdAfterNormalization": round(float(mel_db.std().item()), 6),
        }

    model_metadata = load_torch_model_metadata(model_path)
    model_type = str(model_metadata.get("modelType", "simple_audio_cnn_v1"))
    class_names = [str(name) for name in model_metadata.get("classNames", DEFAULT_TORCH_CLASS_NAMES)]
    label_aliases = {
        str(key): str(value)
        for key, value in dict(model_metadata.get("labelAliases", {})).items()
    }
    aggregation_top_k = int(model_metadata.get("clipAggregationTopK", CLIP_AGGREGATION_TOP_K))
    normalized_class_names = [normalize_prediction_label(name, label_aliases) for name in class_names]
    animal_class_indices = [
        index for index, label in enumerate(normalized_class_names) if label in {"cat", "dog"}
    ]

    if len(class_names) == 0:
        raise RuntimeError("Torch model metadata does not define any classes.")

    if len(animal_class_indices) == 0:
        raise RuntimeError("Torch model metadata does not define any cat/dog classes.")

    model = create_model(model_type, num_classes=len(class_names)).to(device)
    state_dict = torch.load(model_path, map_location=device)
    model.load_state_dict(state_dict)
    model.eval()

    full_audio, audio_debug = load_mono_resampled_audio(audio_path)
    windows, window_debugs = build_sliding_windows(full_audio)

    encoded_windows: list["torch.Tensor"] = []
    preprocess_debugs: list[dict[str, object]] = []
    for window in windows:
        encoded_window, preprocess_debug = preprocess_torch_clip(window)
        encoded_windows.append(encoded_window)
        preprocess_debugs.append(preprocess_debug)

    x = torch.cat(encoded_windows, dim=0).to(device)

    with torch.inference_mode():
        logits = model(x)
        probabilities_tensor = torch.softmax(logits, dim=1).cpu()
        aggregated_scores, aggregated_predicted_index = aggregate_window_probabilities(
            probabilities_tensor,
            aggregation_top_k,
        )
        best_window_scores_by_class, best_window_indices_by_class = torch.max(
            probabilities_tensor,
            dim=0,
        )

    animal_scores = aggregated_scores[animal_class_indices]
    animal_offset_index = int(torch.argmax(animal_scores).item())
    animal_class_index = animal_class_indices[animal_offset_index]
    animal_confidence = float(aggregated_scores[animal_class_index].item())

    animal_best_window_scores = best_window_scores_by_class[animal_class_indices]
    animal_best_window_offset_index = int(torch.argmax(animal_best_window_scores).item())
    animal_best_window_class_index = animal_class_indices[animal_best_window_offset_index]
    animal_best_window_confidence = float(best_window_scores_by_class[animal_best_window_class_index].item())
    animal_best_window_index = int(best_window_indices_by_class[animal_best_window_class_index].item())

    if animal_best_window_confidence >= minimum_confidence:
        predicted_index = animal_best_window_class_index
        selected_window_index = animal_best_window_index
        selected_probabilities_tensor = probabilities_tensor[selected_window_index]
        selection_reason = "max_window_animal_score_met_minimum_confidence"
        selected_probabilities_source = "selected_window"
    elif animal_confidence >= minimum_confidence:
        predicted_index = animal_class_index
        selected_window_index = int(best_window_indices_by_class[predicted_index].item())
        selected_probabilities_tensor = aggregated_scores
        selection_reason = "top_k_animal_score_met_minimum_confidence"
        selected_probabilities_source = "top_k_aggregated"
    else:
        predicted_index = aggregated_predicted_index
        selected_window_index = int(best_window_indices_by_class[predicted_index].item())
        selected_probabilities_tensor = aggregated_scores
        selection_reason = "top_k_aggregated_scores"
        selected_probabilities_source = "top_k_aggregated"
    raw_model_label = class_names[predicted_index]
    raw_label = normalized_class_names[predicted_index]
    confidence = float(selected_probabilities_tensor[predicted_index].item())
    final_label = raw_label

    if raw_label in {"cat", "dog"} and confidence < minimum_confidence:
        final_label = "neither"

    probabilities: dict[str, float] = {}
    raw_probabilities: dict[str, float] = {}
    for index, label in enumerate(class_names):
        score = round(float(selected_probabilities_tensor[index].item()), 6)
        raw_probabilities[label] = score
        normalized_label = normalized_class_names[index]
        probabilities[normalized_label] = round(probabilities.get(normalized_label, 0.0) + score, 6)
    logits_list = [round(float(value), 6) for value in logits[selected_window_index].cpu().tolist()]

    window_summaries: list[dict[str, object]] = []
    for index, (window_debug, preprocess_debug) in enumerate(zip(window_debugs, preprocess_debugs)):
        window_probabilities_tensor = probabilities_tensor[index]
        window_raw_probabilities = {
            label: round(float(window_probabilities_tensor[class_index].item()), 6)
            for class_index, label in enumerate(class_names)
        }
        window_probabilities: dict[str, float] = {}
        for class_index, label in enumerate(class_names):
            normalized_label = normalized_class_names[class_index]
            score = round(float(window_probabilities_tensor[class_index].item()), 6)
            window_probabilities[normalized_label] = round(window_probabilities.get(normalized_label, 0.0) + score, 6)
        window_logits = [round(float(value), 6) for value in logits[index].cpu().tolist()]
        top_class_index = int(torch.argmax(window_probabilities_tensor).item())

        window_summaries.append(
            {
                **window_debug,
                **preprocess_debug,
                "topLabel": class_names[top_class_index],
                "topNormalizedLabel": normalized_class_names[top_class_index],
                "topConfidence": round(float(window_probabilities_tensor[top_class_index].item()), 6),
                "probabilities": window_probabilities,
                "rawProbabilities": window_raw_probabilities,
                "logits": window_logits,
            }
        )

    best_scores_by_class: dict[str, dict[str, object]] = {}
    for class_index, label in enumerate(class_names):
        normalized_label = normalized_class_names[class_index]
        best_window_index = int(best_window_indices_by_class[class_index].item())
        candidate = {
            "windowIndex": best_window_index,
            "confidence": round(float(best_window_scores_by_class[class_index].item()), 6),
            "startSeconds": window_debugs[best_window_index]["windowStartSeconds"],
            "endSeconds": window_debugs[best_window_index]["windowEndSeconds"],
            "rawModelLabel": label,
        }
        existing = best_scores_by_class.get(normalized_label)
        if existing is None or float(candidate["confidence"]) > float(existing["confidence"]):
            best_scores_by_class[normalized_label] = candidate

    return {
        "label": final_label,
        "rawLabel": raw_label,
        "confidence": round(confidence, 6),
        "probabilities": probabilities,
        "debug": {
            "modelType": "torch_checkpoint",
            "minimumConfidence": minimum_confidence,
            "thresholdApplied": final_label != raw_label,
            "classNames": class_names,
            "normalizedClassNames": normalized_class_names,
            "clipAggregationTopK": aggregation_top_k,
            "metadata": model_metadata,
            "rawModelLabel": raw_model_label,
            "selectionReason": selection_reason,
            "selectedProbabilitiesSource": selected_probabilities_source,
            "windowCount": len(windows),
            "selectedWindowIndex": selected_window_index,
            "selectedWindow": window_summaries[selected_window_index],
            "bestScoresByClass": best_scores_by_class,
            "aggregatedScoresByClass": {
                class_names[index]: round(float(aggregated_scores[index].item()), 6)
                for index in range(len(class_names))
            },
            "peakScoresByClass": {
                class_names[index]: round(float(best_window_scores_by_class[index].item()), 6)
                for index in range(len(class_names))
            },
            "audio": audio_debug,
            "windowSummaries": window_summaries,
            "logits": logits_list,
            "rawProbabilities": raw_probabilities,
            "preprocess": window_summaries[selected_window_index],
        },
    }


def analyze_audio(audio_path: Path, model_path: Path, minimum_confidence: float) -> dict[str, object]:
    if model_path.suffix.lower() == ".json":
        return analyze_with_reference_model(audio_path, model_path, minimum_confidence)

    return analyze_with_torch_model(audio_path, model_path, minimum_confidence)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--minimum-confidence", type=float, default=0.55)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    audio_path = Path(args.audio).expanduser().resolve()
    model_path = Path(args.model).expanduser().resolve()

    if not audio_path.exists():
        print(f"Audio file not found: {audio_path}", file=sys.stderr)
        return 1

    if not model_path.exists():
        print(f"Model file not found: {model_path}", file=sys.stderr)
        return 1

    try:
        result = analyze_audio(audio_path, model_path, args.minimum_confidence)
    except Exception as exc:
        print(f"Audio inference failed. Details: {exc}", file=sys.stderr)
        return 1

    debug_payload = {
        "audioPath": str(audio_path),
        "audioSizeBytes": audio_path.stat().st_size,
        "modelPath": str(model_path),
        "modelSuffix": model_path.suffix.lower(),
        "finalLabel": result.get("label"),
        "rawLabel": result.get("rawLabel"),
        "confidence": result.get("confidence"),
        "probabilities": result.get("probabilities"),
        "debug": result.get("debug"),
    }
    print(f"PET_TRANSLATOR_DEBUG {json.dumps(debug_payload, sort_keys=True)}", file=sys.stderr)

    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
