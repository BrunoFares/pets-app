from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run local predictions with the baseline moderation model.")
    parser.add_argument("--model-path", required=True, help="Path to a joblib baseline model.")
    parser.add_argument("--text", help="Single text value to classify.")
    parser.add_argument("--input-csv", help="CSV with a content column to classify.")
    parser.add_argument("--output-json", help="Optional path for JSON predictions.")
    return parser.parse_args()


def predict_texts(model, texts: list[str]) -> list[dict]:
    labels = model.predict(texts)
    probabilities = model.predict_proba(texts) if hasattr(model, "predict_proba") else None
    classes = list(model.classes_) if hasattr(model, "classes_") else []

    results: list[dict] = []
    for index, label in enumerate(labels):
        result = {"content": texts[index], "predictedLabel": str(label)}
        if probabilities is not None:
            result["probabilities"] = {
                str(classes[class_index]): float(score)
                for class_index, score in enumerate(probabilities[index])
            }
        results.append(result)

    return results


def main() -> None:
    args = parse_args()
    if not args.text and not args.input_csv:
        raise SystemExit("Provide either --text or --input-csv.")

    model = joblib.load(args.model_path)
    if args.text:
        texts = [args.text]
    else:
        frame = pd.read_csv(args.input_csv)
        if "content" not in frame.columns:
            raise SystemExit("Input CSV must contain a content column.")
        texts = frame["content"].fillna("").astype(str).tolist()

    results = predict_texts(model, texts)
    output = json.dumps(results, indent=2)

    if args.output_json:
        Path(args.output_json).parent.mkdir(parents=True, exist_ok=True)
        Path(args.output_json).write_text(output, encoding="utf-8")
    else:
        print(output)


if __name__ == "__main__":
    main()
