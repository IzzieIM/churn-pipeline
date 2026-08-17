import React, { useState } from "react";
import { predictSingle } from "../api/client";

const initialForm = {
  gender: "Female",
  SeniorCitizen: 0,
  Partner: "No",
  Dependents: "No",
  tenure: 1,
  PhoneService: "No",
  MultipleLines: "No phone service",
  InternetService: "No",
  OnlineSecurity: "No internet service",
  OnlineBackup: "No internet service",
  DeviceProtection: "No internet service",
  TechSupport: "No internet service",
  StreamingTV: "No internet service",
  StreamingMovies: "No internet service",
  Contract: "Month-to-month",
  PaperlessBilling: "No",
  PaymentMethod: "Electronic check",
  MonthlyCharges: 29.85,
  TotalCharges: 29.85,
};

const categoricalOptions = {
  gender: ["Female", "Male"],
  Partner: ["Yes", "No"],
  Dependents: ["Yes", "No"],
  PhoneService: ["Yes", "No"],
  MultipleLines: ["Yes", "No", "No phone service"],
  InternetService: ["DSL", "Fiber optic", "No"],
  OnlineSecurity: ["Yes", "No", "No internet service"],
  OnlineBackup: ["Yes", "No", "No internet service"],
  DeviceProtection: ["Yes", "No", "No internet service"],
  TechSupport: ["Yes", "No", "No internet service"],
  StreamingTV: ["Yes", "No", "No internet service"],
  StreamingMovies: ["Yes", "No", "No internet service"],
  Contract: ["Month-to-month", "One year", "Two year"],
  PaperlessBilling: ["Yes", "No"],
  PaymentMethod: [
    "Electronic check",
    "Mailed check",
    "Bank transfer (automatic)",
    "Credit card (automatic)",
  ],
};

export default function PredictPage() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        SeniorCitizen: parseInt(form.SeniorCitizen),
        tenure: parseInt(form.tenure),
        MonthlyCharges: parseFloat(form.MonthlyCharges),
        TotalCharges: parseFloat(form.TotalCharges),
      };
      const response = await predictSingle(payload);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="predict-page">
      <h2>Single Customer Prediction</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        {Object.keys(initialForm).map((key) => (
          <div key={key} className="form-field">
            <label>{key}</label>
            {categoricalOptions[key] ? (
              <select
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
              >
                {categoricalOptions[key].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                step="any"
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            )}
          </div>
        ))}
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Predicting..." : "Predict Churn"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result-card">
          <h3>Churn Probability: {(result.churn_probability * 100).toFixed(2)}%</h3>
          <p>
            Prediction:{" "}
            <strong>{result.prediction ? "Will Churn" : "Will Not Churn"}</strong>
          </p>
          <p>
            Model Version: {result.model_version} | Dataset Version: {result.dataset_version}
          </p>
          <p>Latency: {result.latency_ms.toFixed(2)} ms</p>
          {result.explanation.length > 0 && (
            <>
              <h4>Top Feature Contributions</h4>
              <ul className="explanation-list">
                {result.explanation.map((exp) => (
                  <li key={exp.feature}>
                    {exp.feature}: {exp.contribution.toFixed(3)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}