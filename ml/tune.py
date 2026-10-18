"""
Honest tuning pass for the fraud-risk model.

Does two things:
  1. A small grid search over RandomForest settings (cross-validated,
     scored on ROC-AUC) to find a modestly better model.
  2. A threshold analysis — the default 0.5 cutoff is arbitrary for an
     imbalanced problem. We show precision/recall at several thresholds
     so the cutoff can be chosen for the business goal (catch more fraud).

Dataset is SYNTHETIC — all numbers reflect synthetic patterns.
"""
import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    precision_recall_fscore_support,
)

# --- Load + feature engineering (same as train.py) ---
df = pd.read_csv("data/transactions.csv")
df["address_mismatch"] = (
    df["Shipping Address"] != df["Billing Address"]
).astype(int)

numeric_features = [
    "Transaction Amount", "Quantity", "Customer Age",
    "Account Age Days", "Transaction Hour", "address_mismatch",
]
categorical_features = ["Payment Method", "Product Category", "Device Used"]

X = df[numeric_features + categorical_features]
y = df["Is Fraudulent"]

preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
    ]
)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# --- 1. Grid search (cross-validated, scored on AUC) ---
pipe = Pipeline(
    steps=[
        ("preprocess", preprocessor),
        ("classifier", RandomForestClassifier(
            class_weight="balanced", random_state=42, n_jobs=-1)),
    ]
)

param_grid = {
    "classifier__n_estimators": [200, 400],
    "classifier__max_depth": [None, 10, 20],
    "classifier__min_samples_leaf": [1, 5],
}

print("Running grid search (this takes a minute or two)...")
grid = GridSearchCV(
    pipe, param_grid, scoring="roc_auc", cv=3, n_jobs=-1, verbose=1
)
grid.fit(X_train, y_train)

print(f"\nBest params: {grid.best_params_}")
print(f"Best CV AUC: {grid.best_score_:.4f}")

best = grid.best_estimator_
y_proba = best.predict_proba(X_test)[:, 1]
test_auc = roc_auc_score(y_test, y_proba)
print(f"Test AUC (tuned): {test_auc:.4f}")

# --- 2. Threshold analysis ---
# Default is 0.5. For fraud, catching more (recall) often matters more
# than avoiding false alarms (precision). Show the tradeoff.
print("\n=== Threshold analysis (fraud class) ===")
print(f"{'thresh':>8} {'precision':>10} {'recall':>8} {'f1':>8} {'flagged':>8}")
for t in [0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.1]:
    y_pred_t = (y_proba >= t).astype(int)
    p, r, f1, _ = precision_recall_fscore_support(
        y_test, y_pred_t, labels=[1], average="binary", zero_division=0
    )
    flagged = int(y_pred_t.sum())
    print(f"{t:>8.2f} {p:>10.4f} {r:>8.4f} {f1:>8.4f} {flagged:>8}")

# Save the tuned model
joblib.dump(best, "model.pkl")
print("\nSaved tuned model -> model.pkl")

# Report at default threshold for the record
print("\n=== Full report @ threshold 0.5 (tuned model) ===")
print(classification_report(y_test, best.predict(X_test), digits=4))