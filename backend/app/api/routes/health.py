from fastapi import APIRouter
from app.services.model_loader import load_model

router = APIRouter()

@router.get("")
async def health():
    try:
        load_model()
        return {"status": "ok", "model_loaded": True}
    except Exception:
        return {"status": "degraded", "model_loaded": False}