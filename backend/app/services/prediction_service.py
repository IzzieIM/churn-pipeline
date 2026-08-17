import time
import pandas as pd
from app.core.config import settings
from app.services.model_loader import load_model, load_model_meta

def get_explanation(model, customer_df: pd.DataFrame) -> list[dict]:
    """
    For logistic regression, compute feature contributions using linear coefficients.
    Returns top 5 contributing features sorted by absolute contribution.
    """
    try:
        classifier = model.named_steps["classifier"]
        preprocessor = model.named_steps["preprocessor"]

        transformed = preprocessor.transform(customer_df)
        if hasattr(classifier, "coef_"):
            coef = classifier.coef_[0]
            contributions = transformed * coef

            feature_names = preprocessor.get_feature_names_out()
            contribution_df = pd.DataFrame(contributions, columns=feature_names)

            # Aggregate one-hot encoded columns back to original categorical feature names
            aggregated = {}
            for col in contribution_df.columns:
                original = col.split("__")[0] if "__" in col else col
                aggregated[original] = aggregated.get(original, 0) + contribution_df[col].iloc[0]

            sorted_items = sorted(aggregated.items(), key=lambda x: abs(x[1]), reverse=True)[:5]
            return [{"feature": k, "contribution": float(v)} for k, v in sorted_items]
    except Exception as e:
        # Fallback: no explanation
        return []

async def predict_one(customer_dict: dict) -> dict:
    model = load_model()
    meta = load_model_meta()
    feature_order = meta.get("features", list(customer_dict.keys()))

    # Reorder customer_dict to match training features
    ordered = {k: customer_dict.get(k) for k in feature_order}
    df = pd.DataFrame([ordered])

    start = time.perf_counter()
    proba = float(model.predict_proba(df)[0, 1])
    prediction = int(proba >= settings.threshold)
    latency_ms = (time.perf_counter() - start) * 1000

    explanation = get_explanation(model, df) if settings.enable_explanation else []

    return {
        "churn_probability": proba,
        "prediction": prediction,
        "model_version": meta.get("model_version", "unknown"),
        "dataset_version": meta.get("dataset_version", "unknown"),
        "explanation": explanation,
        "latency_ms": latency_ms,
    }