# Forum Moderation ML

This is a separate Python project for training a real text classifier for forum moderation.
It does not integrate inference into the .NET backend yet.

## Labels

The current moderation labels are:

- `Safe`
- `Spam`
- `Abusive`
- `Suspicious`

The backend stores both AI predictions and final human-reviewed labels. For supervised training, use `finalModerationLabel` as the ground-truth label.

## Project Layout

```text
ml-forum-moderation/
  data/
    raw/          # JSON exports from the backend admin endpoint
    processed/    # train/validation/test CSV files
  inference/      # local inference helpers and future packaging work
  models/         # local trained model artifacts, ignored by git
  training/
    prepare_dataset.py
    train_baseline.py
    train_transformer.py
    evaluate.py
    evaluate_transformer.py
  requirements.txt
```

## Setup

From this folder:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 1. Export Reviewed Data

Use the backend admin endpoint and save the paginated JSON response under `data/raw/`.

Example endpoint:

```http
GET /api/admin/forum-posts/moderation-training-data?hasFinalModerationLabel=true&page=1&pageSize=500
```

If there are multiple pages, combine the `items` arrays into one JSON file or keep separate files and prepare them one at a time.

Expected item fields include:

- `id`
- `content`
- `isReply`
- `createdAt`
- `aiModerationLabel`
- `aiModerationConfidence`
- `finalModerationLabel`
- `moderationStatus`
- `reviewedAt`

## 2. Add Supplemental Synthetic Data

You can optionally add a supplemental CSV with these columns:

- `text`
- `label`

Labels are normalized to:

- `Safe`
- `Spam`
- `Abusive`
- `Suspicious`

A small starter file is included at:

```text
data/raw/synthetic_forum_moderation_examples.csv
```

Expand this file or create your own larger supplemental CSV. The preparation script drops empty text and invalid labels.

## 3. Prepare The Dataset

```powershell
python training/prepare_dataset.py --input data/raw/forum_moderation_export.json --output-dir data/processed
```

With supplemental synthetic examples:

```powershell
python training/prepare_dataset.py --input data/raw/forum_moderation_export.json --synthetic-csv data/raw/synthetic_forum_moderation_examples.csv --output-dir data/processed
```

This writes:

- `data/processed/train.csv`
- `data/processed/validation.csv`
- `data/processed/test.csv`
- `data/processed/label_map.json`

The script prints overall and per-split class counts so you can quickly see whether the dataset is badly imbalanced.

The output CSV files keep the training columns expected by the model scripts:

- `content`
- `label`

They also keep useful metadata such as `source`, `id`, `isReply`, `aiModerationLabel`, and `finalModerationLabel` for analysis.

## 4. Train A Baseline

Start with the baseline before using a transformer. It is fast, easy to debug, and gives a useful reference score.

```powershell
python training/train_baseline.py --data-dir data/processed --output-dir models/baseline
```

## 5. Evaluate

```powershell
python training/evaluate.py --model-path models/baseline/forum_moderation_baseline.joblib --test-file data/processed/test.csv
```

## 6. Train A Transformer Later

The transformer script is a starter, not a final production recipe.

```powershell
python training/train_transformer.py --data-dir data/processed --output-dir models/transformer --model-name distilbert-base-uncased
```

## 7. Evaluate A Transformer

After transformer training saves `models/transformer/best`, evaluate it on the test split:

```powershell
python training/evaluate_transformer.py --model-dir models/transformer/best --test-file data/processed/test.csv --output-dir outputs/transformer-evaluation
```

This writes:

- `outputs/transformer-evaluation/summary.json`
- `outputs/transformer-evaluation/classification_report.json`
- `outputs/transformer-evaluation/confusion_matrix.json`
- `outputs/transformer-evaluation/predictions.csv`

## 8. Run Baseline Inference API

After training the baseline model, run the local HTTP API:

```powershell
python inference/api.py --model-path models/baseline/forum_moderation_baseline.joblib --host 127.0.0.1 --port 8010
```

The .NET backend expects this local URL by default:

```text
http://127.0.0.1:8010
```

The backend calls:

```http
POST /predict
Content-Type: application/json

{ "text": "forum post text" }
```

and expects:

```json
{
  "predictedLabel": "Safe",
  "confidence": 0.98,
  "probabilities": {
    "Safe": 0.98,
    "Spam": 0.01,
    "Abusive": 0.0,
    "Suspicious": 0.01
  }
}
```

## Notes

- Do not commit exported user content or trained model files.
- Synthetic examples are only a supplement; human-reviewed backend labels should remain the trusted target.
- Keep `finalModerationLabel` separate from `aiModerationLabel`; the final label is the human-reviewed target.
- Re-run dataset preparation whenever admin labels change materially.
- Add more review examples before trusting any automated moderation behavior.
