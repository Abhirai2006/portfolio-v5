import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/art/primitives";
import { explain, normalizeCustomer, predictProba } from "@/lib/churn/model";
import { metricsAt } from "@/lib/churn/metrics";
import { testRows } from "@/lib/churn/data";
import { BUDGET, MOVES, play, startGame, type GameState } from "@/lib/churn/game";
import type { Column, Customer, ModelJson, TestRow, TestSetJson } from "@/lib/churn/types";
import { cn } from "@/lib/utils";

type Data = { model: ModelJson; rows: TestRow[] };

function useChurnData() {
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    Promise.all([import("@/data/churn/model.json"), import("@/data/churn/test-set.json")])
      .then(([m, t]) => {
        if (!live) return;
        setData({
          model: (m.default ?? m) as unknown as ModelJson,
          rows: testRows((t.default ?? t) as unknown as TestSetJson),
        });
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);
  return { data, failed };
}

const LABEL: Record<Column, string> = {
  gender: "Gender",
  SeniorCitizen: "Senior citizen",
  Partner: "Has partner",
  Dependents: "Has dependents",
  tenure: "Tenure (months)",
  PhoneService: "Phone service",
  MultipleLines: "Multiple lines",
  InternetService: "Internet",
  OnlineSecurity: "Online security",
  OnlineBackup: "Online backup",
  DeviceProtection: "Device protection",
  TechSupport: "Tech support",
  StreamingTV: "Streaming TV",
  StreamingMovies: "Streaming movies",
  Contract: "Contract",
  PaperlessBilling: "Paperless billing",
  PaymentMethod: "Payment method",
  MonthlyCharges: "Monthly charges ($)",
  TotalCharges: "Total charges ($)",
};

const pct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;
const usd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

/** Test customer closest to the median tenure and monthly charge: a typical starting point. */
function typicalCustomer(rows: TestRow[]): Customer {
  const med = (k: "tenure" | "MonthlyCharges") => {
    const v = rows.map((r) => r.x[k]).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  };
  const mt = med("tenure");
  const mm = med("MonthlyCharges");
  let best = rows[0];
  let bestD = Infinity;
  for (const r of rows) {
    const d = Math.abs(r.x.tenure - mt) / 72 + Math.abs(r.x.MonthlyCharges - mm) / 100;
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return { ...best.x };
}

function RiskMeter({ p, threshold }: { p: number; threshold: number }) {
  const atRisk = p >= threshold;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-display text-5xl font-extrabold tabular-nums" aria-live="polite">
          {pct(p)}
        </div>
        <span
          className={cn(
            "rounded-full border-2 border-line px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest",
            atRisk ? "bg-destructive text-destructive-foreground" : "bg-[var(--stay)] text-[var(--stay-fg)]",
          )}
        >
          {atRisk ? "At risk" : "Likely to stay"}
        </span>
      </div>
      <div className="relative mt-3 h-3 rounded-full border-2 border-line bg-muted">
        <div
          className={cn("h-full rounded-full", atRisk ? "bg-destructive" : "bg-[var(--stay)]")}
          style={{ width: pct(p, 2) }}
        />
        <div
          className="absolute -top-2 h-6 w-0.5 bg-foreground"
          style={{ left: pct(threshold, 2) }}
          aria-hidden="true"
        />
      </div>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
        churn probability · the line is Abhishek's alert threshold ({threshold.toFixed(3)})
      </p>
    </div>
  );
}

function Reasons({ model, customer }: { model: ModelJson; customer: Customer }) {
  const { parts } = useMemo(() => explain(model, customer), [model, customer]);
  const top = parts.slice(0, 5);
  const max = Math.max(...top.map((t) => Math.abs(t.value)), 0.0001);
  return (
    <div>
      <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Why (SHAP, top 5)
      </h4>
      <ul className="mt-2 space-y-2">
        {top.map(({ column, value }) => (
          <li
            key={column}
            className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-2 text-sm"
          >
            <span className="truncate">
              {LABEL[column]}: <span className="font-mono text-xs">{String(customer[column])}</span>
            </span>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2.5 rounded-full",
                  value > 0 ? "bg-destructive" : "bg-[var(--stay)]",
                )}
                style={{ width: `${(Math.abs(value) / max) * 100}%`, minWidth: 4 }}
              />
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                {value > 0 ? "→ churn" : "→ stay"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs">
      <span className="font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border-2 border-line bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function ScoreTab({ data }: { data: Data }) {
  const { model, rows } = data;
  const [customer, setCustomer] = useState<Customer>(() =>
    normalizeCustomer(typicalCustomer(rows)),
  );
  const p = useMemo(() => predictProba(model, customer), [model, customer]);
  const cats = useMemo(
    () => new Map(model.categorical.map((c) => [c.name, c.categories])),
    [model],
  );

  const set = (patch: Partial<Customer>) =>
    setCustomer((c) => {
      const next = normalizeCustomer({ ...c, ...patch });
      // Same rule the notebook uses for missing totals: monthly charge times tenure.
      next.TotalCharges = Math.round(next.MonthlyCharges * next.tenure * 100) / 100;
      return next;
    });

  const select = (k: Column) => (
    <Field key={k} label={LABEL[k]}>
      <select
        className={inputCls}
        value={String(customer[k])}
        onChange={(e) => set({ [k]: e.target.value })}
      >
        {(cats.get(k) ?? []).map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </Field>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={`${LABEL.tenure}: ${customer.tenure}`}>
            <input
              type="range"
              min={0}
              max={72}
              value={customer.tenure}
              onChange={(e) => set({ tenure: Number(e.target.value) })}
              className="w-full accent-[var(--primary)]"
            />
          </Field>
          <Field label={`${LABEL.MonthlyCharges}: ${customer.MonthlyCharges.toFixed(0)}`}>
            <input
              type="range"
              min={18}
              max={120}
              value={customer.MonthlyCharges}
              onChange={(e) => set({ MonthlyCharges: Number(e.target.value) })}
              className="w-full accent-[var(--primary)]"
            />
          </Field>
          {(
            [
              "Contract",
              "PaymentMethod",
              "InternetService",
              "TechSupport",
              "OnlineSecurity",
              "PaperlessBilling",
            ] as Column[]
          ).map(select)}
        </div>
        <details className="rounded-lg border-2 border-dashed border-border p-3">
          <summary className="cursor-pointer font-mono text-xs uppercase tracking-widest text-muted-foreground">
            More columns (all 19 go into the model)
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                "gender",
                "Partner",
                "Dependents",
                "PhoneService",
                "MultipleLines",
                "OnlineBackup",
                "DeviceProtection",
                "StreamingTV",
                "StreamingMovies",
              ] as Column[]
            ).map(select)}
            <Field label={LABEL.SeniorCitizen}>
              <select
                className={inputCls}
                value={customer.SeniorCitizen}
                onChange={(e) => set({ SeniorCitizen: Number(e.target.value) })}
              >
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </Field>
          </div>
        </details>
      </div>
      {/* On phones the result comes first, so changing a control visibly changes it. */}
      <div className="order-first space-y-6 lg:order-none">
        <RiskMeter p={p} threshold={model.threshold} />
        <Reasons model={model} customer={customer} />
      </div>
    </div>
  );
}

function SaveTab({ data }: { data: Data }) {
  const { model, rows } = data;
  const [seed, setSeed] = useState(7);
  const [state, setState] = useState<GameState>(() => startGame(rows, model.threshold, 7));
  const p = useMemo(() => predictProba(model, state.customer), [model, state.customer]);
  const c = state.customer;

  const restart = () => {
    const next = seed + 1;
    setSeed(next);
    setState(startGame(rows, model.threshold, next));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        <div className="speech-bubble text-sm">
          <p className="font-semibold">A customer from the test set</p>
          <p className="mt-1 text-muted-foreground">
            {c.tenure} months in · {c.Contract} · {c.InternetService} internet · $
            {c.MonthlyCharges.toFixed(2)}/month · {c.PaymentMethod}
          </p>
        </div>
        <RiskMeter p={p} threshold={model.threshold} />
        <p className="font-mono text-xs text-muted-foreground">
          Started at {pct(state.startP)} · budget left ${BUDGET - state.spent} of ${BUDGET}{" "}
          (illustrative prices)
        </p>
      </div>
      <div className="space-y-3">
        <ul className="grid gap-2">
          {MOVES.map((m) => {
            const done = state.played.includes(m.id);
            const disabled = done || !m.applies(c) || state.spent + m.cost > BUDGET;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setState((s) => play(s, m.id))}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border-2 border-line px-4 py-3 text-left text-sm transition",
                    done ? "bg-[var(--stay)] text-[var(--stay-fg)]" : "bg-background hover:-translate-y-0.5",
                    disabled && !done && "opacity-40",
                  )}
                >
                  <span>
                    <span className="mr-2 font-mono font-bold">{m.notation}</span>
                    {m.label}
                  </span>
                  <span className="font-mono text-xs">{done ? "played" : `$${m.cost}`}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={restart}
          className="font-mono text-xs uppercase tracking-widest text-primary underline-offset-4 hover:underline"
        >
          New customer →
        </button>
        <p className="rounded-lg border-2 border-line bg-muted p-3 text-sm">
          ⓘ These are the model's predictions, not proven causes. A real retention team would A/B
          test an offer before rolling it out.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-line bg-background p-4">
      <div className="font-display text-3xl font-extrabold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ThresholdTab({ data }: { data: Data }) {
  const { model, rows } = data;
  const scored = useMemo(
    () => rows.map((r) => ({ y: r.y, p: r.p, monthly: r.x.MonthlyCharges })),
    [rows],
  );
  const [t, setT] = useState(model.threshold);
  const m = useMemo(() => metricsAt(scored, t), [scored, t]);
  const cells = [
    { k: "Caught churners", v: m.tp, cls: "bg-[var(--stay)] text-[var(--stay-fg)]" },
    { k: "False alarms", v: m.fp, cls: "bg-wash-origin text-ink" },
    { k: "Missed churners", v: m.fn, cls: "bg-destructive text-destructive-foreground" },
    { k: "Correctly left alone", v: m.tn, cls: "bg-muted" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <label
          className="block font-mono text-xs uppercase tracking-widest text-muted-foreground"
          htmlFor="thr"
        >
          Alert threshold: {t.toFixed(3)}
        </label>
        <input
          id="thr"
          type="range"
          min={0.05}
          max={0.95}
          step={0.01}
          value={t}
          onChange={(e) => setT(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--primary)]"
        />
        <button
          type="button"
          onClick={() => setT(model.threshold)}
          className="mt-1 font-mono text-xs text-primary underline-offset-4 hover:underline"
        >
          Reset to Abhishek's choice ({model.threshold.toFixed(3)}, picked from the precision-recall
          curve)
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3" aria-live="polite">
        <Stat label="Churners caught (recall)" value={pct(m.recall)} />
        <Stat label="Alerts that are real (precision)" value={pct(m.precision)} />
        <Stat label="Alerts per 100 customers" value={m.alertsPer100.toFixed(0)} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cells.map((c) => (
          <div key={c.k} className={cn("rounded-xl border-2 border-line p-3", c.cls)}>
            <div className="font-display text-2xl font-extrabold tabular-nums">{c.v}</div>
            <div className="text-xs">{c.k}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Monthly revenue on flagged customers:{" "}
        <b className="text-foreground">{usd(m.monthlyAtRisk)}</b>. If a retention offer saves{" "}
        <b>35%</b> of them{" "}
        <span className="font-mono text-xs">(an assumption, not a measurement)</span>, that is{" "}
        <b className="text-foreground">{usd(m.recoverableMonthly)}/month</b>, about{" "}
        {usd(m.recoverableMonthly * 12)}/year on these 1,409 customers.
      </p>
    </div>
  );
}

const TABS = [
  { id: "score", label: "Score a customer" },
  { id: "save", label: "Save the customer" },
  { id: "threshold", label: "Pick the threshold" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function ChurnLab() {
  const { data, failed } = useChurnData();
  const [tab, setTab] = useState<TabId>("score");

  return (
    <Panel chapter="lab" tone="wash" className="p-4 sm:p-6">
      <div role="tablist" aria-label="Churn Lab" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`lab-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`lab-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full border-2 border-line px-4 py-1.5 text-sm font-semibold transition",
              tab === t.id
                ? "bg-foreground text-background"
                : "bg-background hover:-translate-y-0.5",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`lab-panel-${tab}`}
        aria-labelledby={`lab-tab-${tab}`}
        className="mt-6"
      >
        {failed ? (
          <p className="text-sm text-muted-foreground">
            The model didn't load. Refresh to try again.
          </p>
        ) : !data ? (
          <p className="font-mono text-sm text-muted-foreground">
            loading the model (150 trees, ~40 KB)…
          </p>
        ) : tab === "score" ? (
          <ScoreTab data={data} />
        ) : tab === "save" ? (
          <SaveTab data={data} />
        ) : (
          <ThresholdTab data={data} />
        )}
      </div>

    </Panel>
  );
}

export default ChurnLab;
