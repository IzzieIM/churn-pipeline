import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer
} from "recharts";
import { getMonitoringSummary, getDriftMetrics } from "../api/client";

export default function MonitoringPage() {
  const [summary, setSummary] = useState(null);
  const [drift, setDrift] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sumResp, driftResp] = await Promise.all([
          getMonitoringSummary(),
          getDriftMetrics(),
        ]);
        setSummary(sumResp.data);
        setDrift(driftResp.data);
      } catch (err) {
        setError("Failed to load monitoring data");
      }
    };
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <h2>Monitoring Dashboard</h2>

      {summary ? (
        <>
          <div className="chart-section">
            <h3>Prediction Volume Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={summary.volume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="minute" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <h4>Avg Latency</h4>
              <p>{summary.avg_latency_ms.toFixed(2)} ms</p>
            </div>
            <div className="stat-card">
              <h4>P95 Latency</h4>
              <p>{summary.p95_latency_ms.toFixed(2)} ms</p>
            </div>
          </div>

          <div className="chart-section">
            <h3>Confidence Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.confidence_histogram}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bin_start" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p>No prediction data yet.</p>
      )}

      {drift && drift.drift && (
        <div className="chart-section">
          <h3>Data Drift (PSI)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={drift.drift}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="feature" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="psi" fill="#ff7300" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}