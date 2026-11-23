/**
 * The Churn Lab, restyled as a manga control room (DESIGN §4.7). Logic is the verified engine, unchanged:
 * src/lib/churn/* (LightGBM in TypeScript + TreeSHAP, parity with Python within 1e-6).
 * Probability = an ink dial with a needle and Abhishek's threshold tick; SHAP reasons = speed-line bars.
 */
import { useEffect, useMemo, useState } from "react";
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

/** Ink dial: a half-circle gauge, needle at p, a tick at the threshold. */
function RiskMeter({ p, threshold }: { p: number; threshold: number }) {
  const atRisk = p >= threshold;
  const angle = (v: number) => Math.PI * (1 - v); // 0 → left, 1 → right
  const pt = (v: number, r: number) => [100 + Math.cos(angle(v)) * r, 100 - Math.sin(angle(v)) * r];
  const [nx, ny] = pt(p, 74);
  const [t1x, t1y] = pt(threshold, 60);
  const [t2x, t2y] = pt(threshold, 96);
  return (
    <div>
      <div className="relative mx-auto max-w-[22rem]">
        <svg viewBox="0 0 200 112" className="w-full" aria-hidden="true">
          <defs>
            <pattern id="lab-tone" width="5" height="5" patternUnits="userSpaceOnUse">
              <circle cx="2.5" cy="2.5" r="1" fill="#f2eee6" />
            </pattern>
          </defs>
          <path d="M12 100 A88 88 0 0 1 188 100" fill="none" stroke="#3a3a3e" strokeWidth="14" />
          <path
            d={`M12 100 A88 88 0 0 1 ${pt(p, 88)[0]} ${pt(p, 88)[1]}`}
            fill="none"
            stroke={atRisk ? "#ff2e2e" : "#3d7bff"}
            strokeWidth="14"
          />
          <path d="M12 100 A88 88 0 0 1 188 100" fill="none" stroke="#f2eee6" strokeWidth="2" />
          {Array.from({ length: 11 }, (_, i) => {
            const [a, b] = pt(i / 10, 80);
            const [c, d] = pt(i / 10, i % 5 === 0 ? 70 : 75);
            return <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#f2eee6" strokeWidth="1.5" />;
          })}
          <line x1={t1x} y1={t1y} x2={t2x} y2={t2y} stroke="#ffc34d" strokeWidth="3" />
          <path d="M40 100 A60 60 0 0 1 160 100 Z" fill="url(#lab-tone)" opacity="0.18" />
          <line
            x1="100"
            y1="100"
            x2={nx}
            y2={ny}
            stroke="#f2eee6"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ transition: "all 400ms cubic-bezier(0.16,1,0.3,1)" }}
          />
          <circle cx="100" cy="100" r="7" fill="#0b0b0c" stroke="#f2eee6" strokeWidth="3" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <div className="font-display text-6xl tabular-nums leading-none" aria-live="polite">
            {pct(p)}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <span
          className={cn(
            "border-2 px-3 py-1 font-hud text-[11px]",
            atRisk
              ? "border-red-fire bg-red-fire text-paper"
              : "border-blue-core bg-blue-core text-ink",
          )}
        >
          {atRisk ? "At risk" : "Likely to stay"}
        </span>
      </div>
      <p className="mt-2 text-center font-hud text-[10px] normal-case tracking-[0.08em] text-grey-4">
        churn probability · the gold tick is Abhishek's alert threshold ({threshold.toFixed(3)})
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
      <h4 className="font-hud text-[11px] text-grey-4">Why (SHAP, top 5)</h4>
      <ul className="mt-3 space-y-2.5">
        {top.map(({ column, value }) => (
          <li
            key={column}
            className="grid grid-cols-[minmax(0,9.5rem)_1fr] items-center gap-3 text-sm"
          >
            <span className="truncate">
              {LABEL[column]}:{" "}
              <span className="font-hud text-[11px] normal-case tracking-normal">
                {String(customer[column])}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span
                className="lab-bar h-3"
                data-dir={value > 0 ? "churn" : "stay"}
                style={{ width: `${(Math.abs(value) / max) * 100}%`, minWidth: 6 }}
              />
              <span className="shrink-0 font-hud text-[10px] text-grey-4">
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
      <span className="font-hud text-[10px] text-grey-4">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full border-2 border-grey-2 bg-ink px-2 py-1.5 text-sm text-paper focus:border-blue-fire focus:outline-none";

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
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={`${LABEL.tenure}: ${customer.tenure}`}>
            <input
              type="range"
              min={0}
              max={72}
              value={customer.tenure}
              onChange={(e) => set({ tenure: Number(e.target.value) })}
              className="ink-range w-full"
            />
          </Field>
          <Field label={`${LABEL.MonthlyCharges}: ${customer.MonthlyCharges.toFixed(0)}`}>
            <input
              type="range"
              min={18}
              max={120}
              value={customer.MonthlyCharges}
              onChange={(e) => set({ MonthlyCharges: Number(e.target.value) })}
              className="ink-range w-full"
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
        <details className="border-2 border-dashed border-grey-2 p-3">
          <summary className="cursor-pointer font-hud text-[11px] text-grey-4">
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
      <div className="order-first space-y-8 lg:order-none">
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
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-5">
        <div className="bubble text-sm">
          <p className="font-semibold">A customer from the test set</p>
          <p className="mt-1 opacity-75">
            {c.tenure} months in · {c.Contract} · {c.InternetService} internet · $
            {c.MonthlyCharges.toFixed(2)}/month · {c.PaymentMethod}
          </p>
        </div>
        <RiskMeter p={p} threshold={model.threshold} />
        <p className="font-hud text-[10px] normal-case tracking-[0.08em] text-grey-4">
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
                    "flex w-full items-center justify-between gap-3 border-2 px-4 py-3 text-left text-sm transition",
                    done
                      ? "border-blue-core bg-blue-core text-ink"
                      : "border-paper bg-ink hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--blue-fire)]",
                    disabled && !done && "opacity-40",
                  )}
                >
                  <span>
                    <span className="mr-2 font-hud">{m.notation}</span>
                    {m.label}
                  </span>
                  <span className="font-hud text-[11px]">{done ? "played" : `$${m.cost}`}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" onClick={restart} className="hud-link text-paper">
          New customer →
        </button>
        <p className="border-2 border-grey-2 bg-grey-1 p-3 text-sm">
          ⓘ These are the model's predictions, not proven causes. A real retention team would A/B
          test an offer before rolling it out.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-paper bg-ink p-4 shadow-[4px_4px_0_var(--grey-2)]">
      <div className="font-display text-4xl tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-grey-4">{label}</div>
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
    { k: "Caught churners", v: m.tp, cls: "border-blue-core bg-blue-core text-ink" },
    { k: "False alarms", v: m.fp, cls: "border-grey-4 bg-grey-4 text-ink" },
    { k: "Missed churners", v: m.fn, cls: "border-red-fire bg-red-fire text-paper" },
    { k: "Correctly left alone", v: m.tn, cls: "border-grey-2 bg-grey-1" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <label className="block font-hud text-[11px] text-grey-4" htmlFor="thr">
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
          className="ink-range mt-2 w-full"
        />
        <button
          type="button"
          onClick={() => setT(model.threshold)}
          className="hud-link mt-2 normal-case tracking-[0.06em] text-paper"
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
          <div key={c.k} className={cn("border-2 p-3", c.cls)}>
            <div className="font-display text-3xl tabular-nums">{c.v}</div>
            <div className="text-xs">{c.k}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-grey-4">
        Monthly revenue on flagged customers: <b className="text-paper">{usd(m.monthlyAtRisk)}</b>.
        If a retention offer saves <b>35%</b> of them{" "}
        <span className="font-hud text-[10px] normal-case tracking-normal">
          (an assumption, not a measurement)
        </span>
        , that is <b className="text-paper">{usd(m.recoverableMonthly)}/month</b>, about{" "}
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
    <div className="panel p-4 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-grey-2 pb-4">
        <p className="font-hud text-[11px] text-grey-4">
          <span className="text-blue-core">●</span> CHURN LAB · CONTROL ROOM · LIGHTGBM 150 TREES
        </p>
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
                "border-2 px-3 py-1.5 font-hud text-[11px] transition",
                tab === t.id
                  ? "border-paper bg-paper text-ink"
                  : "border-grey-2 hover:border-paper",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id={`lab-panel-${tab}`} aria-labelledby={`lab-tab-${tab}`}>
        {failed ? (
          <p className="text-sm text-grey-4">The model didn't load. Refresh to try again.</p>
        ) : !data ? (
          <p className="font-hud text-[11px] text-grey-4">loading the model (150 trees, ~40 KB)…</p>
        ) : tab === "score" ? (
          <ScoreTab data={data} />
        ) : tab === "save" ? (
          <SaveTab data={data} />
        ) : (
          <ThresholdTab data={data} />
        )}
      </div>
    </div>
  );
}

export default ChurnLab;
