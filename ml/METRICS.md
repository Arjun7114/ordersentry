# OrderSentry risk model — metrics

**Dataset:** public *synthetic* e-commerce fraud dataset (Kaggle, MIT
license). Metrics reflect synthetic patterns, not real-world fraud.

- Rows: 23,634 | Fraud rate: 5.17%
- 80/20 stratified split, single run, random_state=42

## Model selection (honest comparison)

| Model | Test ROC-AUC |
| ----- | ------------ |
| RandomForest (baseline) | 0.7968 |
| RandomForest (tuned, grid search) | **0.8278** |
| XGBoost (tuned) | 0.7795 |

RandomForest (tuned) was selected — it had the best AUC. XGBoost was
tried and did not beat it on this data, so it was not used.

> Note: XGBoost was tried with a single hand-tuned config, not a full grid
> search like RandomForest received, so the comparison isn't perfectly fair —
> a tuned XGBoost could plausibly close the gap. RandomForest was selected as
> the best *measured* model; further tuning was deprioritized in favor of
> shipping a working end-to-end system.

## Why not accuracy?

With ~5% fraud, a "never fraud" model scores ~95% accuracy while catching
zero fraud. So accuracy is misleading here; the model is evaluated on
ROC-AUC and the precision/recall tradeoff instead.

## Threshold

The default 0.5 cutoff is arbitrary for imbalanced fraud. Lowering it
trades precision for recall (catching more fraud at the cost of more
false alarms). Example points from the tuned RandomForest:

| Threshold | Precision | Recall |
| --------- | --------- | ------ |
| 0.50 | 0.19 | 0.61 |
| 0.30 | 0.12 | 0.84 |

The scoring service returns the model's probability (0–1); the threshold
for flagging can be set to match the business goal.

Reproduce: `python train.py` (baseline) / `python tune.py` (tuned).