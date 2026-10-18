"""
Train a fraud-risk classifier on the e-commerce transactions dataset.

NOTE: the dataset is SYNTHETIC (clearly stated on its Kaggle page).
Metrics below reflect performance on synthetic patterns, not real-world
fraud. This trains the pipeline and reports honest, measured numbers on
a held-out test split.
"""
import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    confusion_matrix,
)

# ---------------------------------------------------------------
# 1. Load the data
# ---------------------------------------------------------------
df = pd.read_csv("data/transactions.csv")
print(f"Loaded {len(df)} rows")

# ---------------------------------------------------------------
# 2. Feature engineering
#    Derive a classic fraud signal: does shipping == billing?
# ---------------------------------------------------------------
df["address_mismatch"] = (
    df["Shipping Address"] != df["Billing Address"]
).astype(int)

# ---------------------------------------------------------------
# 3. Choose features and target.
#    We DROP identifiers (Transaction ID, Customer ID, IP Address)
#    and raw address text — they leak / overfit and carry no
#    generalizable signal.
# ---------------------------------------------------------------
numeric_features = [
    "Transaction Amount",
    "Quantity",
    "Customer Age",
    "Account Age Days",
    "Transaction Hour",
    "address_mismatch",
]
categorical_features = [
    "Payment Method",
    "Product Category",
    "Device Used",
]

X = df[numeric_features + categorical_features]
y = df["Is Fraudulent"]

# ---------------------------------------------------------------
# 4. Preprocessing: scale numbers, one-hot encode categories.
# ---------------------------------------------------------------
preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
    ]
)

# ---------------------------------------------------------------
# 5. The model. class_weight="balanced" is KEY: with only ~5%
#    fraud, this tells the model to weight the rare fraud class
#    so it doesn't just predict "never fraud".
# ---------------------------------------------------------------
model = Pipeline(
    steps=[
        ("preprocess", preprocessor),
        (
            "classifier",
            RandomForestClassifier(
                n_estimators=200,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
            ),
        ),
    ]
)

# ---------------------------------------------------------------
# 6. Train/test split — stratified so the 5% fraud rate is
#    preserved in both sets. We evaluate ONLY on the held-out
#    test set the model never saw.
# ---------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

print("Training...")
model.fit(X_train, y_train)

# ---------------------------------------------------------------
# 7. Evaluate. With imbalanced classes, accuracy is misleading,
#    so we report precision / recall / F1 / AUC.
# ---------------------------------------------------------------
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

report = classification_report(y_test, y_pred, digits=4)
auc = roc_auc_score(y_test, y_proba)
cm = confusion_matrix(y_test, y_pred)

print("\n=== Classification report (held-out test set) ===")
print(report)
print(f"ROC-AUC: {auc:.4f}")
print(f"\nConfusion matrix:\n{cm}")

# ---------------------------------------------------------------
# 8. Save the trained model for the scoring service to load.
# ---------------------------------------------------------------
joblib.dump(model, "model.pkl")
print("\nSaved model -> model.pkl")

# ---------------------------------------------------------------
# 9. Write honest metrics to METRICS.md
# ---------------------------------------------------------------
with open("METRICS.md", "w") as f:
    f.write("# OrderSentry risk model — metrics\n\n")
    f.write("**Dataset:** public *synthetic* e-commerce fraud dataset ")
    f.write("(Kaggle, MIT license). Metrics reflect synthetic patterns, ")
    f.write("not real-world fraud.\n\n")
    f.write(f"- Rows: {len(df)}  |  Fraud rate: {y.mean():.4f}\n")
    f.write("- Model: RandomForest (class_weight=balanced), 80/20 ")
    f.write("stratified split, single run, random_state=42\n")
    f.write(f"- ROC-AUC (test): {auc:.4f}\n\n")
    f.write("```\n")
    f.write(report)
    f.write("```\n\n")
    f.write("Reproduce: `python train.py`\n")

print("Wrote METRICS.md")