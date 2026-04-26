from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import soundfile as sf
import torch
import torch.nn as nn
import torchaudio

SAMPLE_RATE = 16000
CLIP_DURATION = 2.0
NUM_SAMPLES = int(SAMPLE_RATE * CLIP_DURATION)
CLASS_NAMES = ["cat", "dog", "neither"]
DEVICE = torch.device("cpu")


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

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.classifier(x)
        return x


mel_transform = torchaudio.transforms.MelSpectrogram(
    sample_rate=SAMPLE_RATE,
    n_fft=1024,
    hop_length=512,
    n_mels=64,
)
db_transform = torchaudio.transforms.AmplitudeToDB()


def preprocess_audio(file_path: Path) -> torch.Tensor:
    waveform, sample_rate = load_audio(file_path)

    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)

    if sample_rate != SAMPLE_RATE:
        waveform = torchaudio.transforms.Resample(sample_rate, SAMPLE_RATE)(waveform)

    if waveform.shape[1] < NUM_SAMPLES:
        waveform = nn.functional.pad(waveform, (0, NUM_SAMPLES - waveform.shape[1]))
    else:
        waveform = waveform[:, :NUM_SAMPLES]

    mel = mel_transform(waveform)
    mel_db = db_transform(mel)

    mean = mel_db.mean()
    std = mel_db.std() + 1e-6
    mel_db = (mel_db - mean) / std

    return mel_db.unsqueeze(0)


def load_audio(file_path: Path) -> tuple[torch.Tensor, int]:
    try:
        waveform_np, sample_rate = sf.read(file_path, dtype="float32", always_2d=True)
        waveform = torch.from_numpy(waveform_np.T)
        return waveform, sample_rate
    except Exception:
        try:
            return torchaudio.load(str(file_path))
        except Exception as exc:
            raise RuntimeError(
                "The audio file could not be decoded. WAV files should work without extra system "
                "dependencies. Compressed formats such as M4A and WEBM may require FFmpeg."
            ) from exc


def analyze_audio(audio_path: Path, model_path: Path, minimum_confidence: float) -> dict[str, object]:
    model = SimpleAudioCNN(num_classes=len(CLASS_NAMES)).to(DEVICE)
    state_dict = torch.load(model_path, map_location=DEVICE)
    model.load_state_dict(state_dict)
    model.eval()

    x = preprocess_audio(audio_path).to(DEVICE)

    with torch.inference_mode():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)[0].cpu()
        pred_idx = int(torch.argmax(probs).item())

    raw_label = CLASS_NAMES[pred_idx]
    confidence = float(probs[pred_idx].item())
    final_label = raw_label

    if raw_label in {"cat", "dog"} and confidence < minimum_confidence:
        final_label = "neither"

    probabilities = {
        label: round(float(probs[index].item()), 6)
        for index, label in enumerate(CLASS_NAMES)
    }

    return {
        "label": final_label,
        "rawLabel": raw_label,
        "confidence": round(confidence, 6),
        "probabilities": probabilities,
    }


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
        print(
            "Audio inference failed. If this recording is in M4A or WEBM format, "
            "make sure torchaudio has the required decoder support installed. "
            f"Details: {exc}",
            file=sys.stderr,
        )
        return 1

    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
