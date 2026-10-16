# OrderSentry

A merchant order-risk platform: orders are ingested through a REST API, each order is scored for RTO (return-to-origin) and fraud risk by an ML service, and a React dashboard surfaces orders, risk scores, and status to the merchant.

**Status:** Phase 0 — scaffolding. Building in phases; each phase is shipped working before the next begins.

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

## A note on metrics

Any accuracy or performance number in this repo is locally measured, single-run, and reproducible from a documented source. Where a claim can't be honestly measured, it's marked as a prototype, not a benchmark.