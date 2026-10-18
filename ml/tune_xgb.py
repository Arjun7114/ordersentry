"""
One honest XGBoost attempt, compared fairly against the tuned RandomForest.
Same features, same split, same AUC metric. Dataset is SYNTHETIC.
"""
import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    precision_recall_fscore_support,
)
from xgboost import XGBClassifier

# --- Load + same feature engineering ---
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

# scale_pos_weight handles imbalance in XGBoost (ratio of neg to pos).
neg = (y_train == 0).sum()
pos = (y_train == 1).sum()
scale_pos_weight = neg / pos
print(f"scale_pos_weight = {scale_pos_weight:.2f}")

model = Pipeline(
    steps=[
        ("preprocess", preprocessor),
        ("classifier", XGBClassifier(
            n_estimators=400,
            max_depth=5,
            learning_rate=0.1,
            subsample=0.9,
            colsample_bytree=0.9,
            scale_pos_weight=scale_pos_weight,
            eval_metric="auc",
            random_state=42,
            n_jobs=-1,
        )),
    ]
)

print("Training XGBoost...")
model.fit(X_train, y_train)

y_proba = model.predict_proba(X_test)[:, 1]
auc = roc_auc_score(y_test, y_proba)
print(f"\nXGBoost Test AUC: {auc:.4f}")
print("(RandomForest tuned was 0.8278 — compare honestly.)")

print("\n=== Threshold analysis (fraud class) ===")
print(f"{'thresh':>8} {'precision':>10} {'recall':>8} {'f1':>8} {'flagged':>8}")
for t in [0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.1]:
    y_pred_t = (y_proba >= t).astype(int)
    p, r, f1, _ = precision_recall_fscore_support(
        y_test, y_pred_t, labels=[1], average="binary", zero_division=0
    )
    print(f"{t:>8.2f} {p:>10.4f} {r:>8.4f} {f1:>8.4f} {int(y_pred_t.sum()):>8}")

print("\n=== Report @ 0.5 ===")
print(classification_report(y_test, model.predict(X_test), digits=4))

# Only overwrite model.pkl if XGBoost actually wins on AUC.
if auc > 0.8278:
    joblib.dump(model, "model.pkl")
    print(f"\nXGBoost won ({auc:.4f} > 0.8278) — saved as model.pkl")
else:
    print(f"\nXGBoost did NOT beat RandomForest — keeping existing model.pkl")