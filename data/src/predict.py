# src/predict.py
import joblib
import pandas as pd
import json

def load_model(model_path="models/promoted_model.pkl"):
    return joblib.load(model_path)

def load_metadata(meta_path="models/model_meta.json"):
    with open(meta_path) as f:
        return json.load(f)

def predict(customer_dict: dict, model=None, threshold=0.5):
    if model is None:
        model = load_model()
    df = pd.DataFrame([customer_dict])
    proba = float(model.predict_proba(df)[0, 1])
    prediction = int(proba >= threshold)
    return proba, prediction

if __name__ == "__main__":
    # Example customer (all fields required)
    sample_customer = {
        "gender": "Female",
        "SeniorCitizen": 0,
        "Partner": "Yes",
        "Dependents": "No",
        "tenure": 1,
        "PhoneService": "No",
        "MultipleLines": "No phone service",
        "InternetService": "DSL",
        "OnlineSecurity": "No",
        "OnlineBackup": "Yes",
        "DeviceProtection": "No",
        "TechSupport": "No",
        "StreamingTV": "No",
        "StreamingMovies": "No",
        "Contract": "Month-to-month",
        "PaperlessBilling": "Yes",
        "PaymentMethod": "Electronic check",
        "MonthlyCharges": 29.85,
        "TotalCharges": 29.85,
    }

    proba, pred = predict(sample_customer)
    meta = load_metadata()
    print(f"Churn probability: {proba:.4f}")
    print(f"Prediction: {'Yes' if pred else 'No'}")
    print(f"Model version: {meta['model_version']}")
    print(f"Dataset version: {meta['dataset_version']}")