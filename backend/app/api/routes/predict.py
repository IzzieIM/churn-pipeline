import time
from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.schemas.customer import CustomerData, BatchCustomerData
from app.schemas.prediction import PredictionResponse
from app.services.prediction_service import predict_one
from app.services.logger import log_prediction

router = APIRouter()

@router.post("", response_model=PredictionResponse)
async def predict_single(customer: CustomerData, background_tasks: BackgroundTasks):
    try:
        result = await predict_one(customer.model_dump())
        background_tasks.add_task(log_prediction, customer.model_dump(), result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.post("/batch", response_model=list[PredictionResponse])
async def predict_batch(batch: BatchCustomerData, background_tasks: BackgroundTasks):
    results = []
    for customer in batch.customers:
        result = await predict_one(customer.model_dump())
        results.append(result)
        background_tasks.add_task(log_prediction, customer.model_dump(), result)
    return results