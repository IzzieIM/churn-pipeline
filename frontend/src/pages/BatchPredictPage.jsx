import React, { useState } from "react";
import Papa from "papaparse";
import { predictBatch } from "../api/client";

// Reusable form for single customer (used in Manual Entry mode)
function CustomerForm({ customer, onChange, onRemove }) {
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

  const handleFieldChange = (key, value) => {
    onChange({ ...customer, [key]: value });
  };

  return (
    <div className="customer-form">
      <div className="form-grid">
        {Object.keys(customer).map((key) => (
          <div key={key} className="form-field">
            <label>{key}</label>
            {categoricalOptions[key] ? (
              <select
                value={customer[key]}
                onChange={(e) => handleFieldChange(key, e.target.value)}
              >
                {categoricalOptions[key].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                step="any"
                value={customer[key]}
                onChange={(e) => handleFieldChange(key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <button type="button" className="remove-btn" onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

export default function BatchPredictPage() {
  const [mode, setMode] = useState("csv"); // "csv", "manual", "json"
  const [csvFile, setCsvFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [csvError, setCsvError] = useState("");
  const [manualCustomers, setManualCustomers] = useState([createEmptyCustomer()]);
  const [jsonInput, setJsonInput] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function createEmptyCustomer() {
    return {
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
  }

  // ---------- CSV Handling ----------
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    setCsvError("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // auto-convert numbers
      complete: (results) => {
        const requiredFields = [
          "gender", "SeniorCitizen", "Partner", "Dependents", "tenure",
          "PhoneService", "MultipleLines", "InternetService", "OnlineSecurity",
          "OnlineBackup", "DeviceProtection", "TechSupport", "StreamingTV",
          "StreamingMovies", "Contract", "PaperlessBilling", "PaymentMethod",
          "MonthlyCharges", "TotalCharges"
        ];
        const missingFields = requiredFields.filter(
          (field) => !results.meta.fields?.includes(field)
        );
        if (missingFields.length > 0) {
          setCsvError(`CSV is missing required columns: ${missingFields.join(", ")}`);
          setParsedData([]);
          return;
        }
        // Convert numeric fields explicitly
        const data = results.data.map((row) => ({
          ...row,
          SeniorCitizen: Number(row.SeniorCitizen) || 0,
          tenure: Number(row.tenure) || 0,
          MonthlyCharges: parseFloat(row.MonthlyCharges) || 0,
          TotalCharges: parseFloat(row.TotalCharges) || 0,
        }));
        setParsedData(data);
      },
      error: (err) => setCsvError(`CSV parsing failed: ${err.message}`),
    });
  };

  const handleCsvSubmit = async () => {
    if (parsedData.length === 0) {
      setError("No data to predict. Please upload a valid CSV file.");
      return;
    }
    await submitBatch(parsedData);
  };

  // ---------- Manual Entry Handling ----------
  const addCustomer = () => {
    setManualCustomers([...manualCustomers, createEmptyCustomer()]);
  };

  const updateCustomer = (index, updated) => {
    const newCustomers = [...manualCustomers];
    newCustomers[index] = updated;
    setManualCustomers(newCustomers);
  };

  const removeCustomer = (index) => {
    const newCustomers = manualCustomers.filter((_, i) => i !== index);
    setManualCustomers(newCustomers);
  };

  const handleManualSubmit = async () => {
    // Convert numeric fields to numbers and validate
    const cleaned = manualCustomers.map((c) => ({
      ...c,
      SeniorCitizen: Number(c.SeniorCitizen),
      tenure: Number(c.tenure),
      MonthlyCharges: parseFloat(c.MonthlyCharges),
      TotalCharges: parseFloat(c.TotalCharges),
    }));
    await submitBatch(cleaned);
  };

  // ---------- JSON Paste Handling ----------
  const handleJsonSubmit = async (e) => {
    e.preventDefault();
    try {
      const customers = JSON.parse(jsonInput);
      await submitBatch(customers);
    } catch (err) {
      setError("Invalid JSON format");
    }
  };

  // ---------- Common Submit ----------
  const submitBatch = async (customers) => {
    setLoading(true);
    setError(null);
    try {
      const response = await predictBatch(customers);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Batch prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Batch Prediction</h2>

      {/* Mode Selection */}
      <div className="mode-tabs">
        <button
          className={mode === "csv" ? "active" : ""}
          onClick={() => setMode("csv")}
        >
          CSV Upload
        </button>
        <button
          className={mode === "manual" ? "active" : ""}
          onClick={() => setMode("manual")}
        >
          Manual Entry
        </button>
        <button
          className={mode === "json" ? "active" : ""}
          onClick={() => setMode("json")}
        >
          JSON Paste
        </button>
      </div>

      {/* CSV Upload Mode */}
      {mode === "csv" && (
        <div className="csv-section">
          <p>Upload a CSV file with customer data (same columns as the Telco dataset).</p>
          <input type="file" accept=".csv" onChange={handleCsvUpload} />
          {csvError && <p className="error">{csvError}</p>}
          {parsedData.length > 0 && (
            <div>
              <p>Preview: {parsedData.length} rows loaded.</p>
              <table className="preview-table">
                <thead>
                  <tr>
                    {Object.keys(parsedData[0]).slice(0, 5).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                    <th>...</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      {Object.keys(row).slice(0, 5).map((col) => (
                        <td key={col}>{String(row[col])}</td>
                      ))}
                      <td>...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={handleCsvSubmit} disabled={loading}>
                {loading ? "Predicting..." : `Predict Batch (${parsedData.length} customers)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Mode */}
      {mode === "manual" && (
        <div className="manual-section">
          <p>Add customer details using the forms below.</p>
          {manualCustomers.map((customer, index) => (
            <CustomerForm
              key={index}
              customer={customer}
              onChange={(updated) => updateCustomer(index, updated)}
              onRemove={() => removeCustomer(index)}
            />
          ))}
          <div className="button-row">
            <button onClick={addCustomer}>Add Another Customer</button>
            <button onClick={handleManualSubmit} disabled={loading}>
              {loading ? "Predicting..." : `Predict Batch (${manualCustomers.length} customers)`}
            </button>
          </div>
        </div>
      )}

      {/* JSON Paste Mode */}
      {mode === "json" && (
        <div className="json-section">
          <p>Paste a JSON array of customer objects (advanced).</p>
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
        </div>
      )}

      {/* Error Display */}
      {error && <p className="error">{error}</p>}

      {/* Results Table */}
      {results && (
        <div className="results-section">
          <h3>Batch Results</h3>
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
        </div>
      )}
    </div>
  );
}