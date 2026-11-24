/**
 * The interactions (DESIGN.md §4): draw the neural net + hold to enter, the hold ring, the
 * cursor-following action bubble, the status window and the Ask Abhishek speech-bubble chat.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { holdStep, neuronHits, NEURONS_NEEDED, type P2 } from "@/engine/core";
import { SKILLS } from "@/story/story";
import type { GithubResult } from "@/lib/github-shape";

/* ------------------------------------------------------------------ hold ring */

export function HoldRing({
  label,
  duration = 1.2,
  onProgress,
  onDone,
  className = "",
  style,
  onSkip,
  autoFocus,
  initial = 0,
}: {
  initial?: number;
  label: string;
  duration?: number;
  onProgress?: (p: number) => void;
  onDone: () => void;
  className?: string;
  style?: React.CSSProperties;
  onSkip?: () => void;
  autoFocus?: boolean;
}) {
  const [p, setP] = useState(initial);
  const holding = useRef(false);
  const state = useRef({ p: initial, done: false });
  const ref = useRef<HTMLButtonElement>(null);
  const cb = useRef({ onProgress, onDone });
  cb.current = { onProgress, onDone };

  useEffect(() => {
    if (initial > 0) cb.current.onProgress?.(initial);
    let raf = 0;
    let last = performance.now();
    // a look-dev preview (initial > 0) holds still instead of draining
    if (initial > 0) return;
    const tick = (now: number) => {
      // real elapsed time, so a hold takes the same time at any frame rate
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const before = state.current;
      const next = holdStep(before, dt, holding.current, duration);
      if (next.p !== before.p || next.done !== before.done) {
        state.current = next;
        setP(next.p);
        cb.current.onProgress?.(next.p);
        if (next.done && !before.done) {
          holding.current = false;
          cb.current.onDone();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    holding.current = true;
  };
  const up = () => (holding.current = false);
  const C = 2 * Math.PI * 46;
  return (
    <div className={`hold ${className}`} style={style}>
      <button
        ref={ref}
        type="button"
        className="hold-btn"
        aria-label={`${label}: press and hold`}
        onPointerDown={down}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            holding.current = true;
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") holding.current = false;
        }}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" className="hold-track" />
          <circle
            cx="50"
            cy="50"
            r="46"
            className="hold-fill"
            style={{ strokeDasharray: C, strokeDashoffset: C * (1 - p) }}
          />
        </svg>
        <span className="hold-label">{label}</span>
      </button>
      {onSkip && (
        <button type="button" className="hold-skip" onClick={onSkip}>
          Skip
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ action bubble */

export function ActionBubble({
  text,
  x,
  y,
  visible,
}: {
  text: string;
  x: number;
  y: number;
  visible: boolean;
}) {
  return (
    <div
      className="action-bubble"
      aria-hidden="true"
      style={{ transform: `translate3d(${x}px, ${y}px, 0)`, opacity: visible ? 1 : 0 }}
    >
      <span>{text}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ the gate */

const NET: [number, number][] = [
  [0.08, 0.3],
  [0.08, 0.72],
  [0.5, 0.12],
  [0.5, 0.5],
  [0.5, 0.88],
  [0.92, 0.32],
  [0.92, 0.7],
];
const EDGES: [number, number][] = [
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [2, 6],
  [3, 5],
  [3, 6],
  [4, 5],
  [4, 6],
];

export function Gate({
  onEnter,
  onSkip,
  onSfx,
}: {
  onEnter: () => void;
  onSkip: () => void;
  onSfx?: (s: "connect" | "burst") => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [hits, setHits] = useState<number[]>([]);
  const [fired, setFired] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const stroke = useRef<P2[]>([]);
  const drawing = useRef(false);
  const fireAt = useRef(0);
  const holdP = useRef(0);
  const hitsRef = useRef<number[]>([]);
  hitsRef.current = hits;

  const neuronsPx = useCallback(() => {
    const el = box.current!;
    const r = el.getBoundingClientRect();
    return NET.map(([u, v]) => ({ x: r.left + u * r.width, y: r.top + v * r.height }));
  }, []);

  const addHits = useCallback(
    (list: number[]) => {
      const cur = hitsRef.current;
      const next = [...cur];
      for (const i of list) if (!next.includes(i)) next.push(i);
      if (next.length !== cur.length) {
        onSfx?.("connect");
        setHits(next);
        if (next.length >= NEURONS_NEEDED && !fired) {
          setFired(true);
          fireAt.current = performance.now();
        }
      }
    },
    [fired, onSfx],
  );

  // draw loop
  useEffect(() => {
    const c = canvas.current!;
    const g = c.getContext("2d")!;
    let raf = 0;
    const draw = (now: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (c.width !== Math.round(innerWidth * dpr)) {
        c.width = Math.round(innerWidth * dpr);
        c.height = Math.round(innerHeight * dpr);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, innerWidth, innerHeight);
      if (!box.current) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const N = neuronsPx();
      const h = hitsRef.current;
      const fireT = fired ? (now - fireAt.current) / 1000 : 0;
      // faint full network
      g.lineCap = "round";
      for (const [a, b] of EDGES) {
        g.strokeStyle = "rgba(242,239,232,0.08)";
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(N[a].x, N[a].y);
        g.lineTo(N[b].x, N[b].y);
        g.stroke();
        if (fired) {
          // signals run along every edge once the net fires
          const k = (fireT * 1.6 + (a + b) * 0.07) % 1;
          g.fillStyle = "#62AEFF";
          g.shadowColor = "#62AEFF";
          g.shadowBlur = 16;
          g.beginPath();
          g.arc(
            N[a].x + (N[b].x - N[a].x) * k,
            N[a].y + (N[b].y - N[a].y) * k,
            3.4,
            0,
            Math.PI * 2,
          );
          g.fill();
          g.shadowBlur = 0;
        }
      }
      // the visitor's free stroke
      const s = stroke.current;
      if (s.length > 1) {
        g.strokeStyle = "rgba(98,174,255,0.35)";
        g.lineWidth = 10;
        g.shadowColor = "#1F6BFF";
        g.shadowBlur = 18;
        g.beginPath();
        g.moveTo(s[0].x, s[0].y);
        for (const p of s) g.lineTo(p.x, p.y);
        g.stroke();
        g.shadowBlur = 0;
      }
      // connected path as a glowing tube
      if (h.length > 1) {
        for (const [w, col, blur] of [
          [16, "rgba(31,107,255,0.9)", 26],
          [6, "#BFE0FF", 0],
        ] as const) {
          g.strokeStyle = col;
          g.lineWidth = w;
          g.shadowColor = "#1F6BFF";
          g.shadowBlur = blur;
          g.beginPath();
          g.moveTo(N[h[0]].x, N[h[0]].y);
          for (const i of h.slice(1)) g.lineTo(N[i].x, N[i].y);
          g.stroke();
        }
        g.shadowBlur = 0;
      }
      // neurons
      N.forEach((n, i) => {
        const on = h.includes(i);
        const pulse = 1 + Math.sin(now / 300 + i) * 0.08;
        g.beginPath();
        g.arc(n.x, n.y, (on ? 14 : 11) * pulse, 0, Math.PI * 2);
        g.fillStyle = on ? "#1F6BFF" : "#141417";
        g.shadowColor = "#1F6BFF";
        g.shadowBlur = on ? 30 : 10;
        g.fill();
        g.shadowBlur = 0;
        g.lineWidth = 2.5;
        g.strokeStyle = on ? "#BFE0FF" : "#62AEFF";
        g.stroke();
        if (on) {
          g.beginPath();
          g.arc(n.x, n.y, 4, 0, Math.PI * 2);
          g.fillStyle = "#FFFFFF";
          g.fill();
        }
      });
      // burst while holding
      if (holdP.current > 0 && h.length) {
        const n = N[h[h.length - 1]];
        const r = 40 + holdP.current * Math.max(innerWidth, innerHeight) * (leaving ? 1.4 : 0.08);
        const grd = g.createRadialGradient(n.x, n.y, 0, n.x, n.y, r);
        grd.addColorStop(0, `rgba(191,224,255,${0.5 * holdP.current})`);
        grd.addColorStop(1, "rgba(31,107,255,0)");
        g.fillStyle = grd;
        g.fillRect(0, 0, innerWidth, innerHeight);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [fired, leaving, neuronsPx]);

  const pos = (e: React.PointerEvent) => ({ x: e.clientX, y: e.clientY });
  const onDown = (e: React.PointerEvent) => {
    if (fired) return;
    drawing.current = true;
    stroke.current = [pos(e)];
    addHits(neuronHits(stroke.current, neuronsPx(), 34));
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current || fired) return;
    stroke.current.push(pos(e));
    if (stroke.current.length > 400) stroke.current.shift();
    addHits(neuronHits(stroke.current.slice(-3), neuronsPx(), 34));
  };
  const onUp = () => {
    drawing.current = false;
    stroke.current = [];
  };

  const last = hits[hits.length - 1];
  const lastPos = last !== undefined ? NET[last] : null;

  return (
    <div
      className={`gate ${leaving ? "gate-leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-q"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <canvas ref={canvas} className="gate-canvas" aria-hidden="true" />
      <p className="gate-type gate-top" id="gate-q">
        READY TO ENTER
      </p>
      <p className="gate-cue">
        {fired
          ? "THE NETWORK IS LIVE"
          : `CONNECT THE NEURONS · ${Math.min(hits.length, NEURONS_NEEDED)}/${NEURONS_NEEDED}`}
      </p>
      <div className="gate-net" ref={box}>
        {NET.map(([u, v], i) => (
          <button
            key={i}
            type="button"
            className="neuron-key"
            style={{ left: `${u * 100}%`, top: `${v * 100}%` }}
            aria-label={`Neuron ${i + 1}${hits.includes(i) ? ", connected" : ""}`}
            aria-pressed={hits.includes(i)}
            onClick={() => addHits([i])}
            tabIndex={fired ? -1 : 0}
          />
        ))}
        {fired && lastPos && (
          <HoldRing
            className="gate-hold"
            style={{ left: `${lastPos[0] * 100}%`, top: `${lastPos[1] * 100}%` }}
            label="HOLD TO ENTER"
            duration={1.2}
            autoFocus
            onProgress={(p) => (holdP.current = p)}
            onDone={() => {
              onSfx?.("burst");
              setLeaving(true);
              setTimeout(onEnter, 650);
            }}
          />
        )}
      </div>
      <p className="gate-type gate-bottom">MY WORLD?</p>
      <p className="gate-note">Sound starts when you enter.</p>
      <button type="button" className="gate-skip" onClick={onSkip}>
        Skip intro
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ status window */

const TIER_FILL = { S: 0.94, A: 0.7, B: 0.42 };

export function StatusWindow({ github }: { github: GithubResult | null }) {
  return (
    <div className="status-window" role="region" aria-label="Power levels">
      <p className="sw-title">
        <span>STATUS</span>
        <span className="sw-name">ABHISHEK RAI A · LV. B.E. AI &amp; ML</span>
      </p>
      {SKILLS.map((s) => (
        <div key={s.tier} className={`sw-tier tier-${s.tier}`}>
          <p className="sw-tier-h">
            <b>{s.tier}</b> {s.label}
            <span className="sw-bar" aria-hidden="true">
              <i style={{ transform: `scaleX(${TIER_FILL[s.tier]})` }} />
            </span>
          </p>
          <p className="sw-items">{s.items.join(" · ")}</p>
        </div>
      ))}
      <div className="sw-log">
        <p className="sw-log-h">TRAINING LOG · live from GitHub</p>
        {github?.ok ? (
          <>
            <p className="sw-log-totals">
              {github.totals.repos} public repos ·{" "}
              {github.languages
                .slice(0, 3)
                .map((l) => l.name)
                .join(", ")}
            </p>
            <ul>
              {github.top.slice(0, 4).map((r) => (
                <li key={r.name}>
                  <a href={r.url} target="_blank" rel="noopener">
                    {r.name}
                  </a>
                  {r.language && <span> · {r.language}</span>}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="sw-log-totals">
            {github ? "GitHub is resting. Open the profile instead." : "Syncing…"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Ask Abhishek */

type Msg = { role: "user" | "assistant"; content: string };
const SUGGESTED = [
  "What's his strongest project?",
  "Is he available for internships?",
  "How did he get into ML?",
];

export function AskChat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Ask me anything. I answer from my résumé and my projects, nothing else.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1), animeMode: false }),
      });
      if (!res.ok || !res.body) {
        let msg = "Sorry, something went wrong.";
        try {
          const err = (await res.json()) as { error?: string };
          if (err.error) msg = err.error;
        } catch {
          /* not JSON */
        }
        setMessages((m) => [...m, { role: "assistant", content: msg }]);
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const data = t.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const delta =
              (JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]
                ?.delta?.content ?? "";
            if (delta)
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: copy[copy.length - 1].content + delta,
                };
                return copy;
              });
          } catch {
            /* partial chunk */
          }
        }
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I couldn't reach the server. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ask" role="region" aria-label="Ask Abhishek">
      <p className="ask-title">ASK ABHISHEK</p>
      <div className="ask-log" ref={log} aria-live="polite">
        {messages.map((m, i) => (
          <p key={i} className={`bubble ${m.role === "user" ? "bubble-you" : "bubble-me"}`}>
            {m.content || "…"}
          </p>
        ))}
        {loading && messages[messages.length - 1]?.role === "user" && (
          <p className="bubble bubble-me">…</p>
        )}
      </div>
      <div className="ask-suggest">
        {SUGGESTED.map((s) => (
          <button key={s} type="button" onClick={() => send(s)} disabled={loading}>
            {s}
          </button>
        ))}
      </div>
      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="ask-input" className="sr-only">
          Your question
        </label>
        <input
          id="ask-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a question…"
          maxLength={400}
          autoComplete="off"
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
