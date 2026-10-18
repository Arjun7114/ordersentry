# OrderSentry

A merchant order-risk platform: orders are ingested through a REST API, each
order is scored for fraud/RTO (return-to-origin) risk by a Python ML service,
and a React dashboard surfaces orders, status, and risk scores to the merchant.

**Status:** Complete (v1) — NestJS + MongoDB API, React dashboard, and a Python
ML risk scorer, wired end to end. Built in phases; each phase shipped working
before the next began.

## Why this exists

Return-to-origin (orders that come back undelivered) and fraud are real cost
centers for merchants. OrderSentry is a small, honest take on the problem:
ingest orders, score their risk, and make that visible.

## Architecture

Three services:

- **`api/`** — NestJS + TypeScript REST API. Ingests and serves orders,
  validates input (class-validator DTOs), and persists to MongoDB Atlas. On
  order creation it calls the ML service for a risk score — **non-blocking**:
  if the ML service is down, the order is still saved with no score.
- **`web/`** — React + TypeScript dashboard (Vite). Lists orders newest-first
  with color-coded status, and ingests new orders through a validated form
  that surfaces the backend's validation errors inline.
- **`ml/`** — Python fraud-risk scorer. A RandomForest trained on a public
  **synthetic** e-commerce fraud dataset, served via FastAPI. Returns a 0–1
  risk probability. See [`ml/METRICS.md`](ml/METRICS.md) for measured metrics
  and model-selection notes.

React (web, :5173)
│ HTTP / CORS
▼
NestJS API (api, :3000) ───────────► MongoDB Atlas
│ (orders)
│ HTTP (best-effort, 3s timeout)
▼
FastAPI ML scorer (ml, :8001)
│
▼
RandomForest model (model.pkl)


## Order lifecycle

1. A merchant submits an order in the dashboard (or via `POST /orders`).
2. The API validates it — bad phone / pincode / amount is rejected with HTTP 400.
3. The API asks the ML service to score it; the score (0–1) is stored with the order.
4. The dashboard shows the order with its status and risk score.

## API endpoints

| Method | Route                | Purpose                       |
| ------ | -------------------- | ----------------------------- |
| POST   | `/orders`            | Create an order (validated)   |
| GET    | `/orders`            | List all orders, newest first |
| GET    | `/orders/:id`        | Get a single order            |
| PATCH  | `/orders/:id/status` | Update an order's status      |

## ML model — measured results

Trained on a public **synthetic** e-commerce fraud dataset (Kaggle, MIT
license; ~23.6k rows, 5.17% fraud). Because fraud is rare, accuracy is
misleading — a "never fraud" model scores ~95% while catching nothing — so the
model is evaluated on **ROC-AUC** and the precision/recall tradeoff.

| Model                             | Test ROC-AUC |
| --------------------------------- | ------------ |
| RandomForest (baseline)           | 0.7968       |
| **RandomForest (tuned)**          | **0.8278**   |
| XGBoost (tuned once)              | 0.7795       |

RandomForest (tuned, via grid search) was selected as the best measured model.
Metrics are single-run, on a held-out 20% stratified split, reproducible via
`python train.py` / `python tune.py`. Full details in [`ml/METRICS.md`](ml/METRICS.md).

## Running locally

Three terminals.

```bash
# 1. ML scorer
cd ml
python -m venv .venv
.venv\Scripts\activate            # Windows (use source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
# download the dataset to ml/data/transactions.csv (see ml/METRICS.md for the source)
python train.py                   # trains the model -> model.pkl
uvicorn serve:app --port 8001

# 2. API
cd api
npm install
# create api/.env with:
#   MONGODB_URI=<your MongoDB Atlas connection string>
#   PORT=3000
#   RISK_SERVICE_URL=http://localhost:8001
npm run start:dev                 # http://localhost:3000

# 3. Dashboard
cd web
npm install
npm run dev                       # http://localhost:5173
```

## Testing

```bash
cd api && npm test                # OrdersService unit tests (mocked Mongoose model)
```

## Honest limitations

- The ML model is trained on **synthetic** data, so metrics reflect synthetic
  patterns, not real-world fraud.
- XGBoost was tried with a single hand-tuned config (not a full grid search
  like RandomForest), so that comparison isn't perfectly fair; a tuned XGBoost
  could plausibly close the gap. RandomForest was kept as the best *measured* model.
- The order form collects a subset of the model's features; the rest use
  neutral defaults at scoring time. Extending the form would improve score fidelity.
- Risk scoring is best-effort and non-blocking by design.

## Build phases

- [x] Phase 0 — Repo, license, .gitignore, README
- [x] Phase 1 — NestJS + TypeScript + MongoDB orders API (REST + validation + tests)
- [x] Phase 2 — React dashboard wired to the API
- [x] Phase 3 — ML risk-scoring service, wired in non-blocking

## A note on metrics

Any number in this repo is locally measured, single-run, and reproducible from
a documented source. Where a claim can't be honestly measured, it's marked.