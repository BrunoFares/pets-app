# Inference

This folder is for local inference helpers and future model packaging work.

## Baseline HTTP API

Run the baseline model API from the `ml-forum-moderation` folder:

```powershell
python inference/api.py --model-path models/baseline/forum_moderation_baseline.joblib --host 127.0.0.1 --port 8010
```

Health check:

```http
GET http://127.0.0.1:8010/health
```

Prediction:

```http
POST http://127.0.0.1:8010/predict
Content-Type: application/json

{ "text": "Message text to moderate" }
```

Response:

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
