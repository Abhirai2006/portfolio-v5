import { describe, expect, test } from "bun:test";
import modelJson from "@/data/churn/model.json";
import testSet from "@/data/churn/test-set.json";
import parity from "@/data/churn/parity.json";
import { encode, explain, normalizeCustomer, predictProba, predictRaw } from "@/lib/churn/model";
import { testRows } from "@/lib/churn/data";
import type { Customer, ModelJson } from "@/lib/churn/types";

const model = modelJson as unknown as ModelJson;
const rows = testRows(testSet as never);

describe("parity with Python (LightGBM + scikit-learn 1.8.0)", () => {
  test("all 1,409 test customers: probability within 1e-6", () => {
    expect(rows.length).toBe(1409);
    let worst = 0;
    for (const r of rows) worst = Math.max(worst, Math.abs(predictProba(model, r.x) - r.p));
    expect(worst).toBeLessThan(1e-6);
  });

  test("50 parity customers: raw score within 1e-6", () => {
    for (const r of parity.rows) {
      expect(Math.abs(predictRaw(model, r.x as Customer) - r.raw)).toBeLessThan(1e-6);
    }
  });

  test("TreeSHAP per column matches LightGBM pred_contrib, and base + parts = raw", () => {
    const colOf = (i: number) => {
      const name = model.featureNames[i];
      return name
        .replace(/^num__/, "")
        .replace(/^cat__/, "")
        .split("_")[0];
    };
    for (const r of parity.rows) {
      const x = r.x as Customer;
      const { base, parts } = explain(model, x);
      expect(Math.abs(base - r.contrib[45])).toBeLessThan(1e-6);
      const expected = new Map<string, number>();
      r.contrib
        .slice(0, 45)
        .forEach((v, i) => expected.set(colOf(i), (expected.get(colOf(i)) ?? 0) + v));
      for (const { column, value } of parts) {
        expect(Math.abs(value - (expected.get(column) ?? 0))).toBeLessThan(1e-6);
      }
      const total = base + parts.reduce((s, p) => s + p.value, 0);
      expect(Math.abs(total - predictRaw(model, x))).toBeLessThan(1e-6);
    }
  });

  test("encode produces 45 features", () => {
    expect(encode(model, rows[0].x).length).toBe(45);
  });
});

describe("normalizeCustomer", () => {
  const base = rows[0].x;

  test("no internet service forces the six add-ons", () => {
    const c = normalizeCustomer({
      ...base,
      InternetService: "No",
      TechSupport: "Yes",
      StreamingTV: "Yes",
    });
    expect(c.TechSupport).toBe("No internet service");
    expect(c.StreamingTV).toBe("No internet service");
    expect(c.OnlineSecurity).toBe("No internet service");
  });

  test("no phone service forces MultipleLines", () => {
    expect(
      normalizeCustomer({ ...base, PhoneService: "No", MultipleLines: "Yes" }).MultipleLines,
    ).toBe("No phone service");
  });

  test("brand-new customer with zero charges scores to a finite probability", () => {
    const c = normalizeCustomer({ ...base, tenure: 0, TotalCharges: 0 });
    const p = predictProba(model, c);
    expect(Number.isFinite(p)).toBe(true);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });

  test("clamps out-of-range numbers", () => {
    const c = normalizeCustomer({ ...base, tenure: 500, MonthlyCharges: -5, TotalCharges: -1 });
    expect(c.tenure).toBe(72);
    expect(c.MonthlyCharges).toBe(18);
    expect(c.TotalCharges).toBe(0);
  });
});
