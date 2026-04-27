from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate a trained baseline moderation model.")
    parser.add_argument("--model-path", required=True, help="Path to a joblib baseline model.")
    parser.add_argument("--test-file", default="data/processed/test.csv", help="CSV file with content and label columns.")
    parser.add_argument("--output-dir", default="outputs/evaluation", help="Directory for evaluation outputs.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    frame = pd.read_csv(args.test_file)
    required = {"content", "label"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Test file is missing columns: {sorted(missing)}")

    model = joblib.load(args.model_path)
    y_true = frame["label"].astype(str)
    y_pred = model.predict(frame["content"].fillna("").astype(str))

    report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
    labels = sorted(y_true.unique().tolist())
    matrix = confusion_matrix(y_true, y_pred, labels=labels).tolist()

    (output_dir / "classification_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (output_dir / "confusion_matrix.json").write_text(
        json.dumps({"labels": labels, "matrix": matrix}, indent=2),
        encoding="utf-8",
    )

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
