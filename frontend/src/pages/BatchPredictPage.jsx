import React, { useState } from "react";
import { predictBatch } from "../api/client";

export default function BatchPredictPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleJsonSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const customers = JSON.parse(jsonInput);
      const response = await predictBatch(customers);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid JSON or prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const customers = text
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => JSON.parse(line));
        const response = await predictBatch(customers);
        setResults(response.data);
      } catch (err) {
        setError("Failed to parse file or prediction failed");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h2>Batch Prediction</h2>
      <p>Paste a JSON array of customers or upload a JSON Lines file.</p>
      <form onSubmit={handleJsonSubmit}>
        <textarea
          rows="10"
          cols="60"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='[{"gender":"Female", "SeniorCitizen":0, ...}]'
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Predicting..." : "Submit Batch"}
        </button>
      </form>
      <div className="file-upload">
        <label>Or upload JSON Lines file:</label>
        <input type="file" accept=".json,.jsonl,.txt" onChange={handleFileUpload} />
      </div>

      {error && <p className="error">{error}</p>}

      {results && (
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Churn Probability</th>
              <th>Prediction</th>
              <th>Latency (ms)</th>
            </tr>
          </thead>
          <tbody>
            {results.map((res, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{(res.churn_probability * 100).toFixed(2)}%</td>
                <td>{res.prediction ? "Churn" : "No Churn"}</td>
                <td>{res.latency_ms.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}