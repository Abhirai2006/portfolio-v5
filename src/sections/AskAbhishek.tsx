/**
 * Ask Abhishek as a manga conversation (DESIGN §4.7): visitor questions in plain bubbles on the right,
 * the assistant's replies in brush-lettered bubbles on the left. Same endpoint and streaming as before
 * (/api/chat: same-origin, rate-limited, grounded only in his résumé, projects and notes).
 */
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTED = [
  "What's his strongest project?",
  "Is he available for internships?",
  "Explain O(patience) in one line.",
  "What's his GPA and coursework?",
];

export function AskAbhishek() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm the assistant for Abhishek's portfolio. I only know what's on his resume and in his projects. Ask me about his background, his projects, or whether he's available.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [animeMode, setAnimeMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
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
        body: JSON.stringify({ messages: next, animeMode }),
      });
      if (!res.ok || !res.body) {
        let msg = "Sorry, something went wrong.";
        try {
          const err = (await res.json()) as { error?: string };
          if (err.error) msg = err.error;
        } catch {
          /* non-JSON error body */
        }
        setMessages((m) => [...m, { role: "assistant", content: msg }]);
        return;
      }

      // Stream Server-Sent Events and append each delta to the last message.
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let got = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const payload = t.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const ev = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
            const delta = ev.choices?.[0]?.delta?.content;
            if (delta) {
              got = true;
              setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant")
                  copy[copy.length - 1] = { ...last, content: last.content + delta };
                return copy;
              });
            }
          } catch {
            /* partial frame, ignore */
          }
        }
      }
      if (!got) {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant" && !last.content)
            copy[copy.length - 1] = {
              ...last,
              content: "Sorry, no reply came through. Try again.",
            };
          return copy;
        });
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b-2 border-grey-2 px-5 py-3 font-hud text-[11px] text-grey-4">
        <span>
          <span className={animeMode ? "text-orange-fire" : "text-blue-core"}>●</span>{" "}
          ABHI&apos;S.AI · {animeMode ? "anime mode" : "online"}
        </span>
        <span>Powered by AI</span>
      </div>
      <div
        ref={scrollRef}
        className="screentone-soft h-[420px] space-y-7 overflow-y-auto px-5 py-6"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`bubble max-w-[85%] text-sm leading-relaxed ${m.role === "user" ? "bubble-right bg-grey-4" : "ask-reply"}`}
            >
              <div className="ask-md">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bubble font-brush text-base">…thinking</div>
          </div>
        )}
      </div>
      <div className="space-y-3 border-t-2 border-grey-2 px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="grid gap-2 sm:grid-cols-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={loading}
                className="border border-grey-2 px-3 py-1.5 text-left text-xs text-grey-4 transition-colors hover:border-paper hover:text-paper disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAnimeMode((v) => !v)}
            aria-pressed={animeMode}
            title="Toggle Anime Mode (easter egg)"
            className={`shrink-0 border px-3 py-1.5 font-hud text-[10px] transition-colors ${animeMode ? "border-orange-fire text-orange-core" : "border-grey-2 text-grey-4 hover:border-paper hover:text-paper"}`}
          >
            Anime {animeMode ? "ON" : "OFF"}
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <label htmlFor="ask-input" className="sr-only">
            Your question for Abhishek's assistant
          </label>
          <input
            id="ask-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              animeMode
                ? "Ask away, but expect the occasional anime detour…"
                : "Ask about Abhishek's projects, skills, availability…"
            }
            className="flex-1 border-2 border-grey-2 bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-blue-fire"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="ink-btn disabled:opacity-40"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
