"""
Fraud-risk scoring service.

Loads the trained model and exposes POST /score. The NestJS API calls
this over HTTP when an order is created, to get a risk score (0–1).

Dataset is synthetic — the score reflects synthetic fraud patterns.
"""
import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="OrderSentry Risk Scorer")

# Load the trained pipeline once at startup.
model = joblib.load("model.pkl")

# What the API sends us to score. These mirror the model's features.
class OrderFeatures(BaseModel):
    transactionAmount: float
    quantity: int
    customerAge: int
    accountAgeDays: int
    transactionHour: int
    addressMismatch: int  # 1 if shipping != billing, else 0
    paymentMethod: str
    productCategory: str
    deviceUsed: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/score")
def score(order: OrderFeatures):
    # Build a one-row DataFrame with the exact column names the model
    # was trained on.
    row = pd.DataFrame([{
        "Transaction Amount": order.transactionAmount,
        "Quantity": order.quantity,
        "Customer Age": order.customerAge,
        "Account Age Days": order.accountAgeDays,
        "Transaction Hour": order.transactionHour,
        "address_mismatch": order.addressMismatch,
        "Payment Method": order.paymentMethod,
        "Product Category": order.productCategory,
        "Device Used": order.deviceUsed,
    }])

    # predict_proba returns [[P(not fraud), P(fraud)]]; we want P(fraud).
    risk = float(model.predict_proba(row)[0][1])
    return {"riskScore": round(risk, 4)}