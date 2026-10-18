"""Quick exploration of the dataset — see what we're actually working with."""
import pandas as pd

df = pd.read_csv("data/transactions.csv")

print("=" * 60)
print(f"Shape: {df.shape[0]} rows, {df.shape[1]} columns")
print("=" * 60)

print("\nColumns and data types:")
print(df.dtypes)

print("\nFirst 3 rows:")
print(df.head(3).to_string())

print("\nMissing values per column:")
print(df.isnull().sum())

# The fraud label — find the column that looks like the target.
print("\nColumns that might be the fraud label:")
for col in df.columns:
    if "fraud" in col.lower() or "is_" in col.lower() or "label" in col.lower():
        print(f"\n  '{col}' value counts:")
        print(df[col].value_counts())
        print(f"  fraud rate: {df[col].mean():.4f}" if df[col].dtype != object else "")