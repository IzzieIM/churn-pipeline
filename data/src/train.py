# src/train.py
import json
import joblib
import mlflow
import mlflow.sklearn
import pandas as pd
from pathlib import Path

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, classification_report

from data_ingestion import save_versioned_dataset

NUMERIC_FEATURES = ["tenure", "MonthlyCharges", "TotalCharges", "SeniorCitizen"]
CATEGORICAL_FEATURES = [
    "gender", "Partner", "Dependents", "PhoneService", "MultipleLines",
    "InternetService", "OnlineSecurity", "OnlineBackup", "DeviceProtection",
    "TechSupport", "StreamingTV", "StreamingMovies", "Contract",
    "PaperlessBilling", "PaymentMethod"
]
TARGET = "Churn"

def build_pipeline():
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )
    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ]
    )
    return pipeline

def train(raw_csv_path: str, processed_dir: str, model_dir: str):
    # 1. Ingest + version dataset
    df = pd.read_csv(raw_csv_path)
    manifest = save_versioned_dataset(df, raw_csv_path, processed_dir)
    df_clean = pd.read_parquet(manifest["file"])

    X = df_clean.drop(columns=[TARGET])
    y = df_clean[TARGET].map({"Yes": 1, "No": 0})

    # 2. Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 3. Build and train model
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    # 4. Evaluate
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    metrics = {
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1": f1_score(y_test, y_pred),
        "auc": roc_auc_score(y_test, y_proba),
    }
    print("Classification Report:")
    print(classification_report(y_test, y_pred))
    print("Metrics:", metrics)

    # 5. Log to MLflow (optional; comment out if not needed)
    mlflow.set_experiment("churn-pipeline")
    with mlflow.start_run() as run:
        mlflow.log_params({
            "model_type": "logistic_regression",
            "max_iter": 1000,
            "class_weight": "balanced",
        })
        mlflow.log_metrics(metrics)
        mlflow.sklearn.log_model(pipeline, "model")

        # Save model artifact + metadata
        Path(model_dir).mkdir(parents=True, exist_ok=True)
        model_path = Path(model_dir) / "promoted_model.pkl"
        joblib.dump(pipeline, model_path)

        meta = {
            "model_version": run.info.run_id,
            "dataset_version": manifest["dataset_version"],
            "metrics": metrics,
            "trained_at": run.info.start_time,
            "model_path": str(model_path),
            "features": NUMERIC_FEATURES + CATEGORICAL_FEATURES,
        }
        meta_path = Path(model_dir) / "model_meta.json"
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)

        print(f"Saved model to {model_path}")
        print(f"Saved metadata to {meta_path}")

    return pipeline, meta

if __name__ == "__main__":
    train(
        raw_csv_path="data/raw/telco_customer_churn.csv",
        processed_dir="data/processed",
        model_dir="models",
    )