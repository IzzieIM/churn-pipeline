import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
});

export const predictSingle = (customer) => api.post("/predict", customer);
export const predictBatch = (customers) => api.post("/predict/batch", { customers });
export const getHealth = () => api.get("/health");
export const getModelInfo = () => api.get("/model/info");
export const getMonitoringSummary = () => api.get("/monitoring/summary");
export const getDriftMetrics = () => api.get("/monitoring/drift");