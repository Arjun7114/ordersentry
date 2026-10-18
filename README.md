# OrderSentry

A merchant order-risk platform: orders are ingested through a REST API, each order is scored for RTO (return-to-origin) and fraud risk by an ML service, and a React dashboard surfaces orders, risk scores, and status to the merchant.

**Status:** Phase 2 complete — NestJS + MongoDB API and a React + TypeScript dashboard (view + create orders, validated end to end). Phase 3 (ML risk scoring) next.

## Why this exists

Return-to-origin (orders that come back undelivered) and fraud are real cost centers for merchants. OrderSentry is a small, honest take on the problem: ingest orders, score their risk, and make that visible.

## Stack (target)

- **API:** NestJS + TypeScript
- **Data:** MongoDB (order documents)
- **Risk scoring:** Python ML service (scikit-learn)
- **Frontend:** React + TypeScript

> Layers are added one at a time. Anything listed here that isn't in the repo yet is planned, not done — see the status above.

## Structure

- `/api` — NestJS REST API (orders ingestion + serving)
- `/web` — React dashboard

## Build phases

- [x] Phase 0 — Repo, license, .gitignore, README
- [ ] Phase 1 — NestJS + TypeScript + MongoDB orders API (REST + validation + tests)
- [ ] Phase 2 — React dashboard wired to the API
- [ ] Phase 3 — ML risk-scoring service with an honest, reproducible eval

## API endpoints (Phase 1)

| Method | Route                  | Purpose                        |
| ------ | ---------------------- | ------------------------------ |
| POST   | `/orders`              | Create an order (validated)    |
| GET    | `/orders`              | List all orders, newest first  |
| GET    | `/orders/:id`          | Get a single order             |
| PATCH  | `/orders/:id/status`   | Update an order's status       |

Orders are stored in MongoDB Atlas via Mongoose. Input is validated with
class-validator DTOs; invalid payloads are rejected with HTTP 400. The
`riskScore` field is intentionally left `null` until the Phase 3 ML layer
populates it.

## Dashboard (Phase 2)

A React + TypeScript single-page app (Vite) that:

- lists orders from the API, newest first, with color-coded status
- ingests new orders through a form, with the backend's validation
  errors surfaced inline
- talks to the API over CORS, scoped to the dashboard origin

### Running the dashboard

```bash
cd web
npm install
npm run dev   # http://localhost:5173 (API must be running on :3000)
```

### Running locally

```bash
cd api
npm install
# add a .env with MONGODB_URI=... (see .env is gitignored)
npm run start:dev
npm test
```

## A note on metrics

Any accuracy or performance number in this repo is locally measured, single-run, and reproducible from a documented source. Where a claim can't be honestly measured, it's marked as a prototype, not a benchmark.