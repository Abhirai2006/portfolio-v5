import { expect, test } from "bun:test";
import testSet from "@/data/churn/test-set.json";
import { metricsAt, rocAuc } from "@/lib/churn/metrics";
import { testRows } from "@/lib/churn/data";

const rows = testRows(testSet as never).map((r) => ({
  y: r.y,
  p: r.p,
  monthly: r.x.MonthlyCharges,
}));
const THRESHOLD = 0.48477971204830717;

test("at the published threshold: 579 flagged, recall 0.8182, precision 0.5285", () => {
  const m = metricsAt(rows, THRESHOLD);
  expect(m.flagged).toBe(579);
  expect(m.tp + m.fp).toBe(579);
  expect(m.tp + m.fp + m.fn + m.tn).toBe(1409);
  expect(m.recall.toFixed(4)).toBe("0.8182");
  expect(m.precision.toFixed(4)).toBe("0.5285");
  expect(m.alertsPer100).toBeCloseTo((579 / 1409) * 100, 6);
});

test("money follows the notebook: monthly at risk = sum of flagged MonthlyCharges, recoverable = 35% of it", () => {
  const m = metricsAt(rows, THRESHOLD);
  const expected = rows.filter((r) => r.p >= THRESHOLD).reduce((s, r) => s + r.monthly, 0);
  expect(m.monthlyAtRisk).toBeCloseTo(expected, 6);
  expect(m.recoverableMonthly).toBeCloseTo(expected * 0.35, 6);
  expect(Math.round(m.monthlyAtRisk / 100) * 100).toBe(42700);
});

test("test ROC-AUC rounds to 0.8468", () => {
  expect(rocAuc(rows).toFixed(4)).toBe("0.8468");
});

test("threshold 0 flags everyone; threshold above 1 flags no one", () => {
  expect(metricsAt(rows, 0).flagged).toBe(1409);
  const none = metricsAt(rows, 1.01);
  expect(none.flagged).toBe(0);
  expect(none.precision).toBe(0);
});
