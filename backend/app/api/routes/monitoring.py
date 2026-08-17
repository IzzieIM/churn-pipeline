import pandas as pd
import numpy as np
import sqlite3
import json
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

def psi(expected: pd.Series, actual: pd.Series, bins: int = 10) -> float:
    """Population Stability Index"""
    if len(expected) == 0 or len(actual) == 0:
        return 0.0
    breakpoints = np.percentile(expected, np.linspace(0, 100, bins + 1))
    expected_bins = np.histogram(expected, bins=breakpoints)[0] / len(expected)
    actual_bins = np.histogram(actual, bins=breakpoints)[0] / len(actual)

    # Avoid division by zero
    expected_bins = np.clip(expected_bins, 1e-6, None)
    actual_bins = np.clip(actual_bins, 1e-6, None)

    return float(np.sum((actual_bins - expected_bins) * np.log(actual_bins / expected_bins)))

@router.get("/summary")
async def monitoring_summary():
    """Return prediction volume, latency, and confidence distribution."""
    conn = sqlite3.connect("predictions.db")
    df = pd.read_sql_query(
        "SELECT timestamp, churn_probability, latency_ms, prediction FROM predictions",
        conn
    )
    conn.close()

    if df.empty:
        return {
            "volume": [],
            "avg_latency_ms": 0,
            "p95_latency_ms": 0,
            "confidence_histogram": []
        }

    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["minute"] = df["timestamp"].dt.floor("min")
    volume = df.groupby("minute").size().reset_index(name="count")

    hist, bin_edges = np.histogram(df["churn_probability"], bins=10, range=(0, 1))
    confidence_histogram = [
        {"bin_start": round(bin_edges[i], 2), "count": int(hist[i])}
        for i in range(len(hist))
    ]

    return {
        "volume": volume.to_dict(orient="records"),
        "avg_latency_ms": float(df["latency_ms"].mean()),
        "p95_latency_ms": float(df["latency_ms"].quantile(0.95)),
        "confidence_histogram": confidence_histogram
    }

@router.get("/drift")
async def drift_metrics():
    """Compute PSI for numeric features comparing training reference vs recent predictions."""
    reference_path = settings.reference_data_path
    try:
        reference = pd.read_parquet(reference_path)
    except Exception:
        return {"error": "Reference data not available"}

    conn = sqlite3.connect("predictions.db")
    recent = pd.read_sql_query(
        "SELECT customer_features FROM predictions ORDER BY id DESC LIMIT 500",
        conn
    )
    conn.close()

    if recent.empty:
        return {"drift": []}

    recent_df = pd.DataFrame([json.loads(x) for x in recent["customer_features"]])
    drift_results = []

    numeric_cols = ["tenure", "MonthlyCharges", "TotalCharges", "SeniorCitizen"]
    for col in numeric_cols:
        if col in reference.columns and col in recent_df.columns:
            # Convert to numeric, coerce errors
            ref_vals = pd.to_numeric(reference[col], errors='coerce').dropna()
            rec_vals = pd.to_numeric(recent_df[col], errors='coerce').dropna()
            if len(ref_vals) > 0 and len(rec_vals) > 0:
                score = psi(ref_vals, rec_vals)
                drift_results.append({
                    "feature": col,
                    "psi": score,
                    "drift_flag": score > 0.2,
                })

    return {"drift": drift_results}