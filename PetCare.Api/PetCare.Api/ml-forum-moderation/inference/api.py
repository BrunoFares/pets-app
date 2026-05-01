from __future__ import annotations

import argparse
import os
from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


DEFAULT_MODEL_PATH = "../models/baseline/forum_moderation_baseline.joblib"
VALID_LABELS = {"Safe", "Spam", "Abusive", "Suspicious"}

app = FastAPI(title="Forum Moderation Baseline Inference", version="0.1.0")
_model = None


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1)


class PredictResponse(BaseModel):
    predictedLabel: str
    confidence: float
    probabilities: dict[str, float] | None = None


def get_model_path() -> Path:
    return Path(os.environ.get("FORUM_MODERATION_MODEL_PATH", DEFAULT_MODEL_PATH))


def load_model():
    global _model
    if _model is not None:
        return _model

    model_path = get_model_path()
    if not model_path.exists():
        raise RuntimeError(f"Baseline moderation model not found: {model_path}")

    _model = joblib.load(model_path)
    return _model


@app.get("/health")
def health() -> dict:
    model_path = get_model_path()
    return {
        "status": "ok",
        "modelPath": str(model_path),
        "modelExists": model_path.exists(),
        "modelLoaded": _model is not None,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text must not be empty.")

    try:
        model = load_model()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    predicted_label = str(model.predict([text])[0])
    if predicted_label not in VALID_LABELS:
        raise HTTPException(status_code=500, detail=f"Model returned unsupported label: {predicted_label}")

    probabilities = None
    confidence = 1.0
    if hasattr(model, "predict_proba"):
        raw_probabilities = model.predict_proba([text])[0]
        classes = [str(value) for value in model.classes_]
        probabilities = {
            label: float(raw_probabilities[index])
            for index, label in enumerate(classes)
        }
        confidence = float(probabilities.get(predicted_label, max(probabilities.values())))

    return PredictResponse(
        predictedLabel=predicted_label,
        confidence=confidence,
        probabilities=probabilities,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the forum moderation baseline inference API.")
    parser.add_argument("--model-path", default=DEFAULT_MODEL_PATH)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8010)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    os.environ["FORUM_MODERATION_MODEL_PATH"] = args.model_path

    import uvicorn

    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
