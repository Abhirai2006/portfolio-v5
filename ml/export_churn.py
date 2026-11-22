"""Export Abhishek's churn model (telco-churn-intelligence-system) to JSON for the in-browser Churn Lab.

Reproduces the notebook's data prep and split exactly, checks the published test numbers, and only then
writes model.json, test-set.json and parity.json. Run with the pinned versions in ml/requirements.txt:

    python -I ml/export_churn.py --repo <path to telco-churn-intelligence-system> --out src/data/churn
"""

import argparse
import json
import math
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split

DATA_URL = "https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv"


def load_split(csv: str):
    df = pd.read_csv(csv)
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    df["TotalCharges"] = df["TotalCharges"].fillna(df["MonthlyCharges"] * df["tenure"])
    df = df.drop(columns=["customerID"])
    df["Churn"] = df["Churn"].map({"Yes": 1, "No": 0})
    X, y = df.drop(columns=["Churn"]), df["Churn"]
    return train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)


def convert_node(node: dict) -> dict:
    if "leaf_value" in node:
        return {"v": node["leaf_value"], "c": node["leaf_count"]}
    assert node["decision_type"] == "<=", node["decision_type"]
    return {
        "f": node["split_feature"],
        "t": node["threshold"],
        "dl": bool(node["default_left"]),
        "c": node["internal_count"],
        "l": convert_node(node["left_child"]),
        "r": convert_node(node["right_child"]),
    }


def plain(v):
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return float(v)
    return v


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--csv", default=DATA_URL)
    a = ap.parse_args()

    pipe = joblib.load(Path(a.repo) / "app" / "churn_model.pkl")
    threshold = float(joblib.load(Path(a.repo) / "app" / "model_meta.pkl")["threshold"])
    pre, clf = pipe.named_steps["pre"], pipe.named_steps["clf"]
    booster = clf.booster_

    _, X_test, _, y_test = load_split(a.csv)
    p = pipe.predict_proba(X_test)[:, 1]
    pred = (p >= threshold).astype(int)
    checks = {
        "test rows == 1409": len(y_test) == 1409,
        "test ROC-AUC 0.8468": round(roc_auc_score(y_test, p), 4) == 0.8468,
        "recall 0.8182": round(recall_score(y_test, pred), 4) == 0.8182,
        "precision 0.5285": round(precision_score(y_test, pred), 4) == 0.5285,
        "flagged 579": int(pred.sum()) == 579,
        "150 trees": booster.num_trees() == 150,
    }
    for name, ok in checks.items():
        print(("OK   " if ok else "FAIL ") + name)
    if not all(checks.values()):
        raise SystemExit("Published numbers did not reproduce. Nothing written.")

    num_name, scaler, num_cols = pre.transformers_[0]
    cat_name, encoder, cat_cols = pre.transformers_[1]
    assert (num_name, cat_name) == ("num", "cat")
    feature_names = [str(n) for n in pre.get_feature_names_out()]
    assert len(feature_names) == booster.num_feature() == 45

    dump = booster.dump_model()
    model = {
        "threshold": threshold,
        "numeric": [
            {"name": c, "mean": float(m), "scale": float(s)}
            for c, m, s in zip(num_cols, scaler.mean_, scaler.scale_)
        ],
        "categorical": [
            {"name": c, "categories": [str(v) for v in cats]} for c, cats in zip(cat_cols, encoder.categories_)
        ],
        "featureNames": feature_names,
        "trees": [convert_node(t["tree_structure"]) for t in dump["tree_info"]],
    }

    columns = list(X_test.columns)
    # Compact rows: [values in `columns` order, y, p]. ~2.5x smaller than objects.
    rows = [
        [[plain(r[c]) for c in columns], int(t), float(pp)]
        for (_, r), t, pp in zip(X_test.iterrows(), y_test, p)
    ]

    sample = X_test.iloc[:50]
    enc = pre.transform(sample)
    enc = enc.toarray() if hasattr(enc, "toarray") else enc
    raw = booster.predict(enc, raw_score=True)
    contrib = booster.predict(enc, pred_contrib=True)
    parity = [
        {"x": {c: plain(r[c]) for c in columns}, "raw": float(rs), "contrib": [float(v) for v in cb]}
        for (_, r), rs, cb in zip(sample.iterrows(), raw, contrib)
    ]
    for row, rs in zip(parity, raw):
        assert abs(1 / (1 + math.exp(-rs)) - rows[parity.index(row)][2]) < 1e-9

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "model.json").write_text(json.dumps(model, separators=(",", ":")))
    (out / "test-set.json").write_text(json.dumps({"columns": columns, "rows": rows}, separators=(",", ":")))
    (out / "parity.json").write_text(json.dumps({"rows": parity}, separators=(",", ":")))
    for f in ("model.json", "test-set.json", "parity.json"):
        print(f"wrote {out / f} ({(out / f).stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
