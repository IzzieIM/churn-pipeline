from fastapi import APIRouter
from app.services.model_loader import load_model_meta

router = APIRouter()

@router.get("/info")
async def model_info():
    meta = load_model_meta()
    return {
        "model_version": meta.get("model_version"),
        "dataset_version": meta.get("dataset_version"),
        "metrics": meta.get("metrics"),
        "trained_at": meta.get("trained_at"),
        "features": meta.get("features"),
    }