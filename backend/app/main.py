from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, predict, model
from app.services.logger import init_db
from app.api.routes import health, predict, model, monitoring

app = FastAPI(title="Churn Prediction API", version="1.0.0")

# CORS (allow all for development; restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(predict.router, prefix="/predict", tags=["predict"])
app.include_router(model.router, prefix="/model", tags=["model"])

@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/")
async def root():
    return {"message": "Churn Prediction API is running"}