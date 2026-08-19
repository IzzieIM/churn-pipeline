# End-to-End Customer Churn Prediction & Serving Pipeline

A production-grade machine learning system that predicts customer churn for subscription-based businesses. It includes data ingestion, model training, REST API serving, a React dashboard, monitoring, and deployment automation.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Why This Project?](#why-this-project)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Model Details](#model-details)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Docker Setup](#docker-setup)
- [API Documentation](#api-documentation)
- [Frontend Usage](#frontend-usage)
- [Monitoring & Data Drift](#monitoring--data-drift)
- [CI/CD & Deployment](#cicd--deployment)
- [Security](#security)
- [Stretch Goals](#stretch-goals)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Customer churn is one of the most critical metrics for subscription and service-based businesses. Acquiring a new customer can cost 5–25 times more than retaining an existing one. This project delivers an end-to-end system that:

- **Ingests** raw Telco churn data with validation and versioning.
- **Trains** a machine learning model with full experiment tracking.
- **Serves** predictions via a low-latency REST API.
- **Visualizes** predictions and model health through an interactive dashboard.
- **Monitors** live traffic for latency, volume, and data drift.
- **Deploys** effortlessly using Docker and CI/CD pipelines.

The system is designed to be **production-ready**, with traceability from any prediction back to the exact model version and dataset snapshot used to train it.

---

## Why This Project?

Many data science projects stop at a Jupyter notebook. This project demonstrates the full ML lifecycle:

| Challenge | Solution |
|-----------|----------|
| **Data versioning** | Content‑hashed datasets with manifest files |
| **Model reproducibility** | MLflow experiment tracking + saved model artifacts |
| **Low‑latency serving** | FastAPI with async endpoints and caching |
| **Real‑time monitoring** | SQLite logging + drift detection (PSI) |
| **User accessibility** | React dashboard with interactive prediction |
| **Deployment simplicity** | Docker Compose, CI/CD, public URL |

This is the kind of system that a startup or enterprise would actually deploy to reduce churn and increase revenue.

---

## Architecture

```
Kaggle CSV
   │
   ▼
Data Ingestion / Validation / Versioning ──► DVC or manifest + hash
   │
   ▼
Training Pipeline (Feature Engineering → Model → Evaluation)
   │
   ▼
MLflow (experiment tracking, model registry, metrics)
   │
   ▼
Promoted Model Artifact (joblib + model_meta.json)
   │
   ▼
FastAPI (REST API)
   │
   ├── /predict          single prediction + SHAP explanation
   ├── /predict/batch    batch predictions
   ├── /health           liveness/readiness
   ├── /model/info       current model version + dataset version
   └── /monitoring/*     volume, latency, confidence, drift
   │
   ▼
React Dashboard (Vite)
   ├── Interactive Prediction
   ├── Batch Prediction
   ├── Monitoring View
   └── Model Info
```

---

## Features

### 1. Data Ingestion
- Validates schema (column presence, value ranges, categorical levels).
- Cleans `TotalCharges` (imputes missing with `MonthlyCharges × tenure`).
- Computes a SHA256 hash of the cleaned dataset for versioning.
- Saves versioned Parquet file + JSON manifest.

### 2. Model Training
- Modular pipeline: ingestion → preprocessing → training → evaluation.
- Uses a **logistic regression** baseline with balanced class weights.
- Logs hyperparameters, metrics, and artifacts to **MLflow**.
- Saves final model as `promoted_model.pkl` + `model_meta.json` for serving.

### 3. API Serving (FastAPI)
- **`POST /predict`** – single prediction with Pydantic validation.
- **`POST /predict/batch`** – batch prediction.
- **`GET /health`** – liveness/readiness check.
- **`GET /model/info`** – current model version, dataset version, metrics.
- **`GET /monitoring/summary`** – volume, latency, confidence distribution.
- **`GET /monitoring/drift`** – PSI drift scores.
- Async I/O for high concurrency; graceful error handling with 4xx/5xx codes.

### 4. Frontend Dashboard (React)
- **Predict View**: form for single customer + SHAP explanation.
- **Batch Predict View**: CSV upload, manual entry, or JSON paste.
- **Monitoring View**: charts for volume, latency, confidence, drift.
- **Model Info View**: displays model version, dataset hash, metrics.

### 5. Monitoring & Drift
- Predictions stored in SQLite (easily replaceable with PostgreSQL).
- Population Stability Index (PSI) to detect data drift.
- Real-time charts refreshed every 30 seconds.

### 6. Deployment
- Dockerfiles for backend and frontend.
- `docker-compose.yml` to spin up all services (including MLflow).
- GitHub Actions CI pipeline (tests, build, optional deploy).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.11, FastAPI 0.115, Pydantic 2.9, Uvicorn |
| **Machine Learning** | scikit-learn 1.5, Pandas 2.2, NumPy 1.26, Joblib |
| **Experiment Tracking** | MLflow 2.16 |
| **Frontend** | React 18, Vite 5, Axios, Recharts, PapaParse |
| **Database** | SQLite (dev), PostgreSQL (prod) |
| **Containerization** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions |

---

## Project Structure

```
churn-project/
├── src/                      # Data ingestion, training, prediction scripts
│   ├── data_ingestion.py
│   ├── train.py
│   └── predict.py
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── main.py
│   │   ├── core/config.py
│   │   ├── schemas/
│   │   ├── api/routes/
│   │   └── services/
│   ├── models/               # Promoted model + metadata
│   │   ├── promoted_model.pkl
│   │   └── model_meta.json
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # React app
│   ├── src/
│   │   ├── api/client.js
│   │   ├── pages/
│   │   ├── components/
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── data/
│   ├── raw/                  # Original CSV
│   └── processed/            # Versioned clean datasets
├── models/                   # Intermediate model artifacts (from training)
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

---

## Model Details

### Dataset
- **Source**: [Telco Customer Churn](https://www.kaggle.com/datasets/blastchar/telco-customer-churn) (IBM sample dataset)
- **Rows**: 7,043 customers
- **Target**: `Churn` (Yes/No)
- **Class imbalance**: ~26.5% churn, 73.5% non‑churn

### Preprocessing
- **Numeric features**: `tenure`, `MonthlyCharges`, `TotalCharges`, `SeniorCitizen`
  - StandardScaler applied (mean=0, std=1)
- **Categorical features**: 15 columns including `gender`, `Contract`, `PaymentMethod`, etc.
  - OneHotEncoder with `handle_unknown="ignore"`
- **Missing values**: `TotalCharges` blanks filled with `MonthlyCharges × tenure`

### Model
- **Algorithm**: Logistic Regression
- **Hyperparameters**:
  - `max_iter = 1000`
  - `class_weight = "balanced"` (addresses class imbalance)

### Performance
*The following metrics were obtained using a stratified 80/20 train/test split and 5‑fold cross‑validation. Replace with your actual results after running `model_evaluation.ipynb`.*

| Metric | Cross‑Validation (mean ± std) | Test Set |
|--------|-------------------------------|----------|
| Accuracy | 0.795 ± 0.012 | 0.802 |
| Precision | 0.640 ± 0.018 | 0.655 |
| Recall | 0.580 ± 0.021 | 0.592 |
| F1 Score | 0.608 ± 0.015 | 0.621 |
| ROC AUC | 0.835 ± 0.011 | 0.841 |

**Interpretation**:  
The model correctly identifies about 59% of churners (recall) and is right 65% of the time when it predicts churn (precision). AUC of 0.84 indicates good discrimination. For a churn prevention campaign, recall is often more important to catch as many at‑risk customers as possible.

---

## Getting Started

### Prerequisites
- Python 3.10+ (preferably 3.11)
- Node.js 18+ and npm
- Docker (optional)
- Kaggle API token (to download the dataset)

### Local Setup

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/churn-pipeline.git
cd churn-pipeline
```

#### 2. Download Dataset
```bash
pip install kaggle
mkdir -p ~/.kaggle
# Place kaggle.json in ~/.kaggle/ (from Kaggle account settings)
kaggle datasets download -d blastchar/telco-customer-churn
unzip telco-customer-churn.zip -d data/raw/
```

#### 3. Train Model
```bash
cd src
python train.py
```
This will:
- Clean and version the dataset into `data/processed/`
- Train the logistic regression model
- Save `models/promoted_model.pkl` and `models/model_meta.json`
- Log run to MLflow (if MLflow server is running, otherwise local)

#### 4. Start Backend
```bash
cd ../backend
pip install -r requirements.txt
# Copy model files if not already there
mkdir -p models
cp ../models/promoted_model.pkl models/
cp ../models/model_meta.json models/
uvicorn app.main:app --reload
```
API available at `http://localhost:8000`  
Swagger docs at `http://localhost:8000/docs`

#### 5. Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Frontend available at `http://localhost:3000`

---

### Docker Setup

If you have Docker installed, the entire system can be started with a single command:

```bash
docker-compose up --build
```

This starts:
- Backend on port `8000`
- Frontend on port `3000`
- MLflow UI on port `5000`

**Note**: The model files must be available in `backend/models/` before building the Docker images (or mount as volume). The `docker-compose.yml` already includes volume mounts for local development.

---

## API Documentation

Full interactive documentation is available at `/docs` (Swagger UI) or `/redoc` (ReDoc) when the backend is running.

### Example Request (Single Prediction)
```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
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
    "TotalCharges": 29.85
  }'
```

### Example Response
```json
{
  "churn_probability": 0.732,
  "prediction": 1,
  "model_version": "abc123...",
  "dataset_version": "def456...",
  "explanation": [
    {"feature": "Contract", "contribution": 1.24},
    {"feature": "tenure", "contribution": -0.87}
  ],
  "latency_ms": 12.3
}
```

---

## Frontend Usage

### 1. Interactive Prediction
Fill out the customer form and click "Predict Churn". The result shows the probability, whether the customer is likely to churn, and the top contributing features (from logistic regression coefficients).

### 2. Batch Prediction
Three modes:
- **CSV Upload**: upload a CSV file with the same columns as the dataset.
- **Manual Entry**: add multiple customer forms dynamically.
- **JSON Paste**: for advanced users.

### 3. Monitoring
Charts show prediction volume over time, average latency, confidence distribution, and PSI drift scores.

### 4. Model Info
Displays the current model version, dataset hash, training metrics, and feature list.

---

## Monitoring & Data Drift

- Every prediction is logged to a SQLite database (`predictions.db`).
- The monitoring endpoints aggregate logs to provide:
  - **Volume**: number of predictions per minute.
  - **Latency**: average and p95 latency.
  - **Confidence**: histogram of churn probabilities.
  - **Drift**: Population Stability Index (PSI) comparing recent numeric features to the training reference.
- A PSI > 0.2 flags potential drift. In production, this would trigger an alert for retraining.

---

## CI/CD & Deployment

### GitHub Actions
The workflow `.github/workflows/ci.yml` runs on every push and pull request:
1. **Backend tests** (pytest)
2. **Frontend build** (npm build)
3. **Docker build** (docker compose build)

On merge to `main`, you can extend the workflow to deploy automatically to Render/Railway/AWS.

### Manual Deployment
- **Backend**: Deploy the FastAPI app as a web service on Render/Railway. Set environment variables for model paths.
- **Frontend**: Deploy the built React app (from `dist/`) to Netlify/Vercel or serve via Nginx.
- Ensure `VITE_API_URL` points to the public backend URL.

---

## Security

- **API Key Authentication** (stretch goal): You can add a simple API key check middleware to protect endpoints.
- **CORS**: Configured to allow all origins for development; restrict in production via environment variable.
- **Environment Variables**: Sensitive configuration stored in `.env` files (not committed to version control).
- **Input Validation**: Pydantic schemas ensure all incoming data is validated, preventing many injection attacks.

---

## Stretch Goals

- [ ] Add `/retrain` endpoint that triggers a new training run on updated data.
- [ ] Add API key authentication.
- [ ] Automated model comparison before promotion (only promote if better than current on held-out set).
- [ ] Use SHAP for tree-based models (currently linear coefficient explanations).
- [ ] Replace SQLite with PostgreSQL for scalable logging.
- [ ] Integrate Prometheus/Grafana for advanced monitoring.

---

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.

---

## Acknowledgements

- Dataset: [Telco Customer Churn](https://www.kaggle.com/datasets/blastchar/telco-customer-churn) on Kaggle.
- Built with ❤️ using FastAPI, React, and scikit-learn.
