from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import pandas as pd
from sklearn.model_selection import train_test_split


LABELS = ["Safe", "Spam", "Abusive", "Suspicious"]
LABEL_ALIASES = {
    "safe": "Safe",
    "ok": "Safe",
    "clean": "Safe",
    "not harmful": "Safe",
    "spam": "Spam",
    "scam": "Spam",
    "promotional": "Spam",
    "abusive": "Abusive",
    "abuse": "Abusive",
    "harassment": "Abusive",
    "harassing": "Abusive",
    "toxic": "Abusive",
    "suspicious": "Suspicious",
    "questionable": "Suspicious",
    "needs review": "Suspicious",
    "inappropriatecontent": "Suspicious",
    "inappropriate content": "Suspicious",
}
EXPORT_COLUMNS = [
    "id",
    "source",
    "content",
    "isReply",
    "replyingToPostId",
    "createdAt",
    "updatedAt",
    "aiModerationLabel",
    "aiModerationConfidence",
    "finalModerationLabel",
    "moderationStatus",
    "moderatedAt",
    "reviewedAt",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare forum moderation training data from backend and synthetic data.")
    parser.add_argument("--input", required=True, help="Path to backend JSON export.")
    parser.add_argument(
        "--synthetic-csv",
        help="Optional supplemental CSV with text and label columns.",
    )
    parser.add_argument("--output-dir", default="data/processed", help="Directory for processed CSV outputs.")
    parser.add_argument("--test-size", type=float, default=0.15, help="Fraction for test split.")
    parser.add_argument("--validation-size", type=float, default=0.15, help="Fraction for validation split.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    parser.add_argument(
        "--allow-unlabeled",
        action="store_true",
        help="Keep rows without finalModerationLabel. By default they are removed.",
    )
    return parser.parse_args()


def load_export(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, dict) and isinstance(payload.get("items"), list):
        return payload["items"]
    if isinstance(payload, list):
        return payload
    raise ValueError("Expected a paginated export object with an items array or a raw JSON array.")


def normalize_label(value: Any) -> str | None:
    if value is None or pd.isna(value):
        return None

    key = str(value).strip()
    if not key:
        return None

    if key in LABELS:
        return key

    return LABEL_ALIASES.get(key.lower())


def normalize_backend_frame(rows: list[dict[str, Any]]) -> pd.DataFrame:
    frame = pd.DataFrame(rows)
    for column in EXPORT_COLUMNS:
        if column not in frame.columns:
            frame[column] = None

    frame = frame[EXPORT_COLUMNS].copy()
    frame["source"] = "backend"
    frame["content"] = frame["content"].fillna("").astype(str).str.strip()
    frame["label"] = frame["finalModerationLabel"].map(normalize_label)
    return frame


def normalize_synthetic_frame(path: Path) -> pd.DataFrame:
    frame = pd.read_csv(path)
    required = {"text", "label"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Synthetic CSV is missing columns: {sorted(missing)}")

    normalized = pd.DataFrame()
    normalized["id"] = [f"synthetic:{index + 1}" for index in range(len(frame))]
    normalized["source"] = "synthetic"
    normalized["content"] = frame["text"].fillna("").astype(str).str.strip()
    normalized["isReply"] = None
    normalized["replyingToPostId"] = None
    normalized["createdAt"] = None
    normalized["updatedAt"] = None
    normalized["aiModerationLabel"] = None
    normalized["aiModerationConfidence"] = None
    normalized["finalModerationLabel"] = frame["label"].map(normalize_label)
    normalized["moderationStatus"] = "Reviewed"
    normalized["moderatedAt"] = None
    normalized["reviewedAt"] = None
    normalized["label"] = normalized["finalModerationLabel"]
    return normalized


def clean_combined_frame(frame: pd.DataFrame, allow_unlabeled: bool) -> tuple[pd.DataFrame, dict[str, int]]:
    before = len(frame)
    frame = frame.copy()
    frame["content"] = frame["content"].fillna("").astype(str).str.strip()
    empty_text_count = int((frame["content"].str.len() == 0).sum())
    frame = frame[frame["content"].str.len() > 0]

    invalid_or_unlabeled_count = int((~frame["label"].isin(LABELS)).sum())
    if not allow_unlabeled:
        frame = frame[frame["label"].isin(LABELS)]

    frame = frame.drop_duplicates(subset=["source", "id"], keep="last")
    frame = frame.drop_duplicates(subset=["content", "label"], keep="first")
    dropped_count = before - len(frame)

    return frame.reset_index(drop=True), {
        "inputRows": before,
        "emptyTextRows": empty_text_count,
        "invalidOrUnlabeledRows": invalid_or_unlabeled_count,
        "droppedRows": dropped_count,
    }


def stratify_or_none(frame: pd.DataFrame, split_size: float) -> pd.Series | None:
    if "label" not in frame.columns or frame["label"].isna().any():
        return None
    label_counts = frame["label"].value_counts()
    label_count = len(label_counts)
    split_rows = int(round(len(frame) * split_size))
    remainder_rows = len(frame) - split_rows
    can_stratify = (
        label_count > 1 and
        label_counts.min() >= 2 and
        split_rows >= label_count and
        remainder_rows >= label_count
    )
    return frame["label"] if can_stratify else None


def split_dataset(
    frame: pd.DataFrame,
    test_size: float,
    validation_size: float,
    seed: int,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    if len(frame) < 3:
        raise ValueError("Need at least 3 labeled rows to create train, validation, and test splits.")

    train_validation, test = train_test_split(
        frame,
        test_size=test_size,
        random_state=seed,
        stratify=stratify_or_none(frame, test_size),
    )

    validation_fraction = validation_size / (1.0 - test_size)
    train, validation = train_test_split(
        train_validation,
        test_size=validation_fraction,
        random_state=seed,
        stratify=stratify_or_none(train_validation, validation_fraction),
    )

    return train.reset_index(drop=True), validation.reset_index(drop=True), test.reset_index(drop=True)


def write_outputs(output_dir: Path, train: pd.DataFrame, validation: pd.DataFrame, test: pd.DataFrame) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    train.to_csv(output_dir / "train.csv", index=False)
    validation.to_csv(output_dir / "validation.csv", index=False)
    test.to_csv(output_dir / "test.csv", index=False)

    label_map = {label: index for index, label in enumerate(LABELS)}
    (output_dir / "label_map.json").write_text(json.dumps(label_map, indent=2), encoding="utf-8")


def print_class_counts(name: str, frame: pd.DataFrame) -> None:
    counts = frame["label"].value_counts().reindex(LABELS, fill_value=0)
    formatted = ", ".join(f"{label}={count}" for label, count in counts.items())
    print(f"{name}: {len(frame)} rows ({formatted})")


def main() -> None:
    args = parse_args()
    frames = [normalize_backend_frame(load_export(Path(args.input)))]
    if args.synthetic_csv:
        frames.append(normalize_synthetic_frame(Path(args.synthetic_csv)))

    frame, clean_stats = clean_combined_frame(
        pd.concat(frames, ignore_index=True),
        allow_unlabeled=args.allow_unlabeled,
    )
    train, validation, test = split_dataset(frame, args.test_size, args.validation_size, args.seed)
    write_outputs(Path(args.output_dir), train, validation, test)

    print(f"Prepared {len(frame)} rows from {clean_stats['inputRows']} input rows")
    print(
        "Dropped rows: "
        f"emptyText={clean_stats['emptyTextRows']} "
        f"invalidOrUnlabeled={clean_stats['invalidOrUnlabeledRows']} "
        f"totalDropped={clean_stats['droppedRows']}"
    )
    print_class_counts("all", frame)
    print_class_counts("train", train)
    print_class_counts("validation", validation)
    print_class_counts("test", test)


if __name__ == "__main__":
    main()
