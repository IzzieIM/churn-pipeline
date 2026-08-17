import React, { useEffect, useState } from "react";
import { getModelInfo } from "../api/client";

export default function ModelInfoPage() {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getModelInfo()
      .then((res) => setInfo(res.data))
      .catch((err) => setError("Failed to load model info"));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!info) return <div>Loading...</div>;

  return (
    <div>
      <h2>Model Information</h2>
      <div className="info-card">
        <p><strong>Model Version:</strong> {info.model_version}</p>
        <p><strong>Dataset Version:</strong> {info.dataset_version}</p>
        <p><strong>Trained At:</strong> {info.trained_at}</p>
        <h3>Metrics</h3>
        <ul>
          <li>Precision: {info.metrics?.precision.toFixed(4)}</li>
          <li>Recall: {info.metrics?.recall.toFixed(4)}</li>
          <li>F1: {info.metrics?.f1.toFixed(4)}</li>
          <li>AUC: {info.metrics?.auc.toFixed(4)}</li>
        </ul>
        <h3>Features</h3>
        <p>{info.features?.join(", ")}</p>
      </div>
    </div>
  );
}