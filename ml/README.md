# Churn model export

`src/data/churn/*.json` is generated from Abhishek's public capstone repo,
[telco-churn-intelligence-system](https://github.com/Abhirai2006/telco-churn-intelligence-system), by `export_churn.py`.
The Churn Lab on the homepage runs these exported LightGBM trees in the browser.

```bash
python -m venv .venv
.venv/bin/pip install -r ml/requirements.txt
git clone --depth 1 https://github.com/Abhirai2006/telco-churn-intelligence-system ../telco-churn-intelligence-system
.venv/bin/python -I ml/export_churn.py --repo ../telco-churn-intelligence-system --out src/data/churn
```

The script reproduces the notebook's cleaning and `train_test_split(test_size=0.2, stratify=y, random_state=42)`,
then refuses to write anything unless the published test numbers come out exactly (ROC-AUC 0.8468, recall 0.8182,
precision 0.5285, 579 of 1,409 flagged at threshold 0.4848). `scikit-learn` is pinned to 1.8.0, the version the
model was saved with.

Files:
- `model.json`: scaler means/scales, one-hot categories, feature names and the 150 trees (with node counts for TreeSHAP).
- `test-set.json`: the 1,409 held-out customers as `[values, churned, python_probability]` rows.
- `parity.json`: 50 customers with LightGBM's raw score and `pred_contrib` (TreeSHAP) values, used by the TypeScript tests.
