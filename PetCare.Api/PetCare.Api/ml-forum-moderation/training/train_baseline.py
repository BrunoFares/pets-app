from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.pipeline import Pipeline


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a baseline forum moderation classifier.")
    parser.add_argument("--data-dir", default="data/processed", help="Directory containing train.csv and validation.csv.")
    parser.add_argument("--output-dir", default="models/baseline", help="Directory for model and metrics outputs.")
    parser.add_argument("--max-features", type=int, default=50000, help="Maximum TF-IDF vocabulary size.")
    return parser.parse_args()


def load_split(data_dir: Path, name: str) -> pd.DataFrame:
    path = data_dir / f"{name}.csv"
    if not path.exists():
        raise FileNotFoundError(f"Missing dataset split: {path}")
    frame = pd.read_csv(path)
    required = {"content", "label"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"{path} is missing columns: {sorted(missing)}")
    return frame


def main() -> None:
    args = parse_args()
    data_dir = Path(args.data_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    train = load_split(data_dir, "train")
    validation = load_split(data_dir, "validation")

    model = Pipeline(
        steps=[
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    min_df=2,
                    max_features=args.max_features,
                ),
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1000,
                    class_weight="balanced",
                    n_jobs=None,
                ),
            ),
        ]
    )

    model.fit(train["content"].astype(str), train["label"].astype(str))
    predictions = model.predict(validation["content"].astype(str))
    report = classification_report(validation["label"].astype(str), predictions, output_dict=True, zero_division=0)

    model_path = output_dir / "forum_moderation_baseline.joblib"
    metrics_path = output_dir / "validation_metrics.json"
    joblib.dump(model, model_path)
    metrics_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"Saved model: {model_path}")
    print(f"Saved metrics: {metrics_path}")


if __name__ == "__main__":
    main()
