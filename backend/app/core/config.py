from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Churn Prediction API"
    model_path: str = "../models/promoted_model.pkl"
    reference_data_path: str = "data/processed/reference.parquet"
    model_meta_path: str = "models/model_meta.json"
    sqlite_url: str = "sqlite:///./predictions.db"
    threshold: float = 0.5
    enable_explanation: bool = True

    class Config:
        env_file = ".env"

settings = Settings()