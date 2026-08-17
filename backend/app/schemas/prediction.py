from pydantic import BaseModel
from typing import Optional

class FeatureContribution(BaseModel):
    feature: str
    contribution: float

class PredictionResponse(BaseModel):
    churn_probability: float
    prediction: int
    model_version: str
    dataset_version: str
    explanation: list[FeatureContribution] = []
    latency_ms: float = 0.0