# src/data_ingestion.py
import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone

import pandas as pd
import numpy as np

RAW_COLUMNS = [
    "customerID", "gender", "SeniorCitizen", "Partner", "Dependents",
    "tenure", "PhoneService", "MultipleLines", "InternetService",
    "OnlineSecurity", "OnlineBackup", "DeviceProtection", "TechSupport",
    "StreamingTV", "StreamingMovies", "Contract", "PaperlessBilling",
    "PaymentMethod", "MonthlyCharges", "TotalCharges", "Churn"
]

CATEGORICAL_LEVELS = {
    "gender": ["Female", "Male"],
    "Partner": ["Yes", "No"],
    "Dependents": ["Yes", "No"],
    "PhoneService": ["Yes", "No"],
    "MultipleLines": ["Yes", "No", "No phone service"],
    "InternetService": ["DSL", "Fiber optic", "No"],
    "OnlineSecurity": ["Yes", "No", "No internet service"],
    "OnlineBackup": ["Yes", "No", "No internet service"],
    "DeviceProtection": ["Yes", "No", "No internet service"],
    "TechSupport": ["Yes", "No", "No internet service"],
    "StreamingTV": ["Yes", "No", "No internet service"],
    "StreamingMovies": ["Yes", "No", "No internet service"],
    "Contract": ["Month-to-month", "One year", "Two year"],
    "PaperlessBilling": ["Yes", "No"],
    "PaymentMethod": [
        "Electronic check", "Mailed check",
        "Bank transfer (automatic)", "Credit card (automatic)"
    ],
    "Churn": ["Yes", "No"],
}

def validate_schema(df: pd.DataFrame) -> pd.DataFrame:
    """Check required columns and value ranges."""
    missing = set(RAW_COLUMNS) - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    if (df["tenure"] < 0).any():
        raise ValueError("Negative tenure found")
    if (df["MonthlyCharges"] < 0).any():
        raise ValueError("Negative MonthlyCharges found")
    if (df["TotalCharges"].astype(str).str.strip() == "").any():
        # There are some empty strings in TotalCharges; we'll handle in cleaning
        pass

    for col, levels in CATEGORICAL_LEVELS.items():
        invalid = set(df[col].dropna().unique()) - set(levels)
        if invalid:
            raise ValueError(f"Invalid levels in {col}: {invalid}")

    return df

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Perform validation and basic cleaning."""
    df = validate_schema(df.copy())

    # Convert TotalCharges to numeric, filling blanks with MonthlyCharges * tenure
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    df["TotalCharges"] = df["TotalCharges"].fillna(df["MonthlyCharges"] * df["tenure"])

    # Drop customerID (not used for modeling)
    df = df.drop(columns=["customerID"])
    return df

def hash_dataframe(df: pd.DataFrame) -> str:
    """Generate a SHA256 hash of the dataframe content."""
    h = hashlib.sha256()
    h.update(pd.util.hash_pandas_object(df, index=True).to_numpy().tobytes())
    return h.hexdigest()

def save_versioned_dataset(df: pd.DataFrame, raw_path: str, processed_dir: str) -> dict:
    """Clean, hash, save versioned dataset, and create a manifest."""
    df_clean = clean_data(df)
    dataset_hash = hash_dataframe(df_clean)
    timestamp = datetime.now(timezone.utc).isoformat()

    processed_dir = Path(processed_dir)
    processed_dir.mkdir(parents=True, exist_ok=True)

    out_path = processed_dir / f"dataset-{dataset_hash}.parquet"
    df_clean.to_parquet(out_path, index=False)

    manifest = {
        "dataset_version": dataset_hash,
        "created_at": timestamp,
        "rows": len(df_clean),
        "columns": list(df_clean.columns),
        "raw_source": str(raw_path),
        "file": str(out_path),
    }
    manifest_path = processed_dir / f"manifest-{dataset_hash}.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"Saved versioned dataset to {out_path}")
    print(f"Dataset hash: {dataset_hash}")
    return manifest

if __name__ == "__main__":
    raw_csv = "data/raw/telco_customer_churn.csv"
    df = pd.read_csv(raw_csv)
    manifest = save_versioned_dataset(df, raw_csv, "data/processed")
    print(json.dumps(manifest, indent=2))