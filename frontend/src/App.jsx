import { Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout";
import PredictPage from "./pages/PredictPage";
import BatchPredictPage from "./pages/BatchPredictPage";
import MonitoringPage from "./pages/MonitoringPage";
import ModelInfoPage from "./pages/ModelInfoPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PredictPage />} />
        <Route path="/batch" element={<BatchPredictPage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="/model-info" element={<ModelInfoPage />} />
      </Routes>
    </Layout>
  );
}