from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from transformers import AutoModelForSequenceClassification, AutoTokenizer


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate a trained transformer moderation model.")
    parser.add_argument("--model-dir", default="models/transformer/best", help="Directory containing the saved transformer model.")
    parser.add_argument("--test-file", default="data/processed/test.csv", help="CSV file with content and label columns.")
    parser.add_argument("--label-map", help="Optional path to label_map.json. Defaults to model dir or its parent.")
    parser.add_argument("--output-dir", default="outputs/transformer-evaluation", help="Directory for evaluation outputs.")
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--max-length", type=int, default=256)
    parser.add_argument("--device", choices=["auto", "cpu", "cuda"], default="auto")
    return parser.parse_args()


def resolve_device(device_arg: str) -> torch.device:
    if device_arg == "cuda":
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA was requested but is not available.")
        return torch.device("cuda")
    if device_arg == "cpu":
        return torch.device("cpu")
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def find_label_map_path(model_dir: Path, explicit_path: str | None) -> Path | None:
    if explicit_path:
        return Path(explicit_path)

    candidates = [
        model_dir / "label_map.json",
        model_dir.parent / "label_map.json",
    ]
    return next((path for path in candidates if path.exists()), None)


def load_label_map(model_dir: Path, explicit_path: str | None, model) -> dict[str, int]:
    label_map_path = find_label_map_path(model_dir, explicit_path)
    if label_map_path:
        raw_map = json.loads(label_map_path.read_text(encoding="utf-8"))
        return {str(label): int(index) for label, index in raw_map.items()}

    id_to_label = getattr(model.config, "id2label", None)
    if not id_to_label:
        raise FileNotFoundError("Could not find label_map.json and model config has no id2label mapping.")

    label_map = {str(label): int(index) for index, label in id_to_label.items()}
    if any(label.startswith("LABEL_") for label in label_map):
        raise FileNotFoundError("Model config contains default LABEL_* names. Provide --label-map.")

    return label_map


def load_test_frame(test_file: Path, label_map: dict[str, int]) -> pd.DataFrame:
    frame = pd.read_csv(test_file)
    required = {"content", "label"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Test file is missing columns: {sorted(missing)}")

    frame = frame[["content", "label"]].dropna()
    frame["content"] = frame["content"].astype(str).str.strip()
    frame["label"] = frame["label"].astype(str).str.strip()
    frame = frame[frame["content"].str.len() > 0]

    unknown_labels = sorted(set(frame["label"]) - set(label_map))
    if unknown_labels:
        raise ValueError(f"Test file contains labels not present in label_map: {unknown_labels}")

    if frame.empty:
        raise ValueError("No valid test rows found.")

    return frame.reset_index(drop=True)


def predict_labels(
    texts: list[str],
    tokenizer,
    model,
    id_to_label: dict[int, str],
    device: torch.device,
    batch_size: int,
    max_length: int,
) -> tuple[list[str], list[dict[str, float]]]:
    predictions: list[str] = []
    probabilities_by_row: list[dict[str, float]] = []
    model.eval()

    for start in range(0, len(texts), batch_size):
        batch_texts = texts[start:start + batch_size]
        encoded = tokenizer(
            batch_texts,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="pt",
        )
        encoded = {key: value.to(device) for key, value in encoded.items()}

        with torch.no_grad():
            logits = model(**encoded).logits
            probabilities = torch.softmax(logits, dim=-1).cpu().numpy()
            batch_predictions = np.argmax(probabilities, axis=-1)

        for row_index, predicted_id in enumerate(batch_predictions):
            predictions.append(id_to_label[int(predicted_id)])
            probabilities_by_row.append({
                id_to_label[class_id]: float(score)
                for class_id, score in enumerate(probabilities[row_index])
            })

    return predictions, probabilities_by_row


def main() -> None:
    args = parse_args()
    model_dir = Path(args.model_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(model_dir)
    label_map = load_label_map(model_dir, args.label_map, model)
    id_to_label = {index: label for label, index in label_map.items()}

    device = resolve_device(args.device)
    model.to(device)

    frame = load_test_frame(Path(args.test_file), label_map)
    y_true = frame["label"].tolist()
    y_pred, probabilities = predict_labels(
        frame["content"].tolist(),
        tokenizer,
        model,
        id_to_label,
        device,
        args.batch_size,
        args.max_length,
    )

    labels = [label for label, _ in sorted(label_map.items(), key=lambda item: item[1])]
    report = classification_report(y_true, y_pred, labels=labels, output_dict=True, zero_division=0)
    matrix = confusion_matrix(y_true, y_pred, labels=labels).tolist()
    summary = {
        "accuracy": accuracy_score(y_true, y_pred),
        "macroPrecision": report["macro avg"]["precision"],
        "macroRecall": report["macro avg"]["recall"],
        "macroF1": report["macro avg"]["f1-score"],
        "weightedPrecision": report["weighted avg"]["precision"],
        "weightedRecall": report["weighted avg"]["recall"],
        "weightedF1": report["weighted avg"]["f1-score"],
        "rows": len(frame),
        "device": str(device),
    }

    predictions = frame.copy()
    predictions["predictedLabel"] = y_pred
    predictions["probabilities"] = [json.dumps(row, sort_keys=True) for row in probabilities]

    (output_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    (output_dir / "classification_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (output_dir / "confusion_matrix.json").write_text(
        json.dumps({"labels": labels, "matrix": matrix}, indent=2),
        encoding="utf-8",
    )
    predictions.to_csv(output_dir / "predictions.csv", index=False)

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
