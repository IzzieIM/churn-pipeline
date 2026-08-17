import sqlite3
import json
import datetime

DATABASE = "predictions.db"

def init_db():
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            customer_features JSON,
            churn_probability REAL,
            prediction INTEGER,
            model_version TEXT,
            dataset_version TEXT,
            latency_ms REAL,
            explanation JSON
        )
        """
    )
    conn.commit()
    conn.close()

def log_prediction(customer: dict, result: dict):
    """Insert a prediction record into SQLite."""
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO predictions (timestamp, customer_features, churn_probability, "
        "prediction, model_version, dataset_version, latency_ms, explanation) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (
            datetime.datetime.utcnow().isoformat(),
            json.dumps(customer),
            result["churn_probability"],
            result["prediction"],
            result["model_version"],
            result["dataset_version"],
            result["latency_ms"],
            json.dumps(result["explanation"]),
        ),
    )
    conn.commit()
    conn.close()