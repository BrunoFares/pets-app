from __future__ import annotations

import argparse
import inspect
import json
from pathlib import Path

import numpy as np
import pandas as pd
from datasets import Dataset
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a starter transformer forum moderation classifier.")
    parser.add_argument("--data-dir", default="data/processed", help="Directory containing train.csv and validation.csv.")
    parser.add_argument("--output-dir", default="models/transformer", help="Directory for transformer outputs.")
    parser.add_argument("--model-name", default="distilbert-base-uncased", help="Hugging Face model name.")
    parser.add_argument("--epochs", type=float, default=3.0)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=2e-5)
    parser.add_argument("--max-length", type=int, default=256)
    return parser.parse_args()


def load_label_map(data_dir: Path) -> dict[str, int]:
    path = data_dir / "label_map.json"
    if not path.exists():
        raise FileNotFoundError("Run prepare_dataset.py first; label_map.json is missing.")
    return json.loads(path.read_text(encoding="utf-8"))


def load_split(data_dir: Path, split: str, label_map: dict[str, int]) -> Dataset:
    frame = pd.read_csv(data_dir / f"{split}.csv")
    frame = frame[["content", "label"]].dropna()
    frame["text"] = frame["content"].astype(str)
    frame["labels"] = frame["label"].map(label_map)
    frame = frame.dropna(subset=["labels"])
    frame["labels"] = frame["labels"].astype(int)
    return Dataset.from_pandas(frame[["text", "labels"]], preserve_index=False)


def evaluation_strategy_arg(value: str) -> dict[str, str]:
    parameters = inspect.signature(TrainingArguments.__init__).parameters
    if "evaluation_strategy" in parameters:
        return {"evaluation_strategy": value}
    if "eval_strategy" in parameters:
        return {"eval_strategy": value}
    raise RuntimeError("Installed transformers TrainingArguments does not support evaluation strategy configuration.")


def main() -> None:
    args = parse_args()
    data_dir = Path(args.data_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    label_map = load_label_map(data_dir)
    id_to_label = {value: key for key, value in label_map.items()}

    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.model_name,
        num_labels=len(label_map),
        id2label=id_to_label,
        label2id=label_map,
    )

    def tokenize(batch):
        return tokenizer(batch["text"], truncation=True, max_length=args.max_length)

    train_dataset = load_split(data_dir, "train", label_map).map(tokenize, batched=True)
    validation_dataset = load_split(data_dir, "validation", label_map).map(tokenize, batched=True)
    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    def compute_metrics(eval_prediction):
        logits, labels = eval_prediction
        predictions = np.argmax(logits, axis=-1)
        precision, recall, f1, _ = precision_recall_fscore_support(
            labels,
            predictions,
            average="weighted",
            zero_division=0,
        )
        return {
            "accuracy": accuracy_score(labels, predictions),
            "precision": precision,
            "recall": recall,
            "f1": f1,
        }

    training_args = TrainingArguments(
        output_dir=str(output_dir),
        learning_rate=args.learning_rate,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        num_train_epochs=args.epochs,
        **evaluation_strategy_arg("epoch"),
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        report_to=[],
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=validation_dataset,
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )

    trainer.train()
    trainer.save_model(str(output_dir / "best"))
    tokenizer.save_pretrained(str(output_dir / "best"))
    (output_dir / "label_map.json").write_text(json.dumps(label_map, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
