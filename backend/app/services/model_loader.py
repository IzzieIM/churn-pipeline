import json
import joblib
from pathlib import Path
from functools import lru_cache

from app.core.config import settings

@lru_cache(maxsize=1)
def load_model():
    """Load the ML model from disk (cached)."""
    model_path = Path(settings.model_path)
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found at {model_path}")
    return joblib.load(model_path)

@lru_cache(maxsize=1)
def load_model_meta() -> dict:
    """Load model metadata (version, dataset hash, metrics)."""
    meta_path = Path(settings.model_meta_path)
    if not meta_path.exists():
        raise FileNotFoundError(f"Model metadata not found at {meta_path}")
    with open(meta_path) as f:
        return json.load(f)