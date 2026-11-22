export type ScoredRow = { y: 0 | 1; p: number; monthly: number };

/**
 * What a retention team would see at a given threshold on the held-out test set.
 * Money follows the capstone notebook: monthly revenue at risk is the MonthlyCharges of every flagged
 * customer; recoverable assumes `retention` (35% by default, an assumption, not a measurement) are saved.
 */
export function metricsAt(rows: ScoredRow[], threshold: number, retention = 0.35) {
  let tp = 0, fp = 0, fn = 0, tn = 0, monthlyAtRisk = 0;
  for (const r of rows) {
    const flag = r.p >= threshold;
    if (flag) monthlyAtRisk += r.monthly;
    if (flag && r.y === 1) tp++;
    else if (flag) fp++;
    else if (r.y === 1) fn++;
    else tn++;
  }
  const flagged = tp + fp;
  return {
    tp,
    fp,
    fn,
    tn,
    flagged,
    recall: tp + fn ? tp / (tp + fn) : 0,
    precision: flagged ? tp / flagged : 0,
    alertsPer100: rows.length ? (flagged / rows.length) * 100 : 0,
    monthlyAtRisk,
    recoverableMonthly: monthlyAtRisk * retention,
  };
}

/** ROC-AUC via the rank-sum (Mann–Whitney) formula, ties averaged like scikit-learn. */
export function rocAuc(rows: { y: 0 | 1; p: number }[]): number {
  const sorted = rows.map((r, i) => ({ ...r, i })).sort((a, b) => a.p - b.p);
  const ranks = new Array<number>(sorted.length);
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1].p === sorted[i].p) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[k] = avg;
    i = j + 1;
  }
  let pos = 0, rankSum = 0;
  sorted.forEach((r, k) => {
    if (r.y === 1) {
      pos++;
      rankSum += ranks[k];
    }
  });
  const neg = rows.length - pos;
  return (rankSum - (pos * (pos + 1)) / 2) / (pos * neg);
}
