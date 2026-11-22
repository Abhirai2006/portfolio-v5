import { createFileRoute } from "@tanstack/react-router";
import { clientIp, isRateLimited, isSameOrigin } from "@/lib/guard";
import { PERSONAL_CONTEXT, RESUME_CONTEXT } from "@/lib/assistant-context";

// Non-streaming chat endpoint. Uses an OpenAI-compatible endpoint directly to avoid AI SDK
// version-drift issues; the client posts { messages: [...] } and gets { reply }.

const BASE_PROMPT = `You are "Ask Abhishek", a concise, friendly assistant embedded in Abhishek Rai A's portfolio site.

You know only what is in the RESUME_CONTEXT and PERSONAL_CONTEXT below. Answer recruiter and visitor questions about Abhishek's background, projects, skills, education, personality, and interests using ONLY that information. If asked something outside it, say so and suggest emailing abhirai2006@gmail.com.

Style: 2-4 sentences, direct, third-person ("Abhishek..."). Match his vibe when the question is personal (warm, a bit sarcastic, comedic) but stay professional for recruiter questions. Never invent projects, grades, dates, employers, or credentials. Use plain text (light markdown OK: bold, bullets).
Never use em dashes or en dashes in a reply. Write the way a friendly student would text, with short sentences, commas and full stops.

RESUME_CONTEXT:
${RESUME_CONTEXT}

PERSONAL_CONTEXT:
${PERSONAL_CONTEXT}`;

const ANIME_ADDON = `

ANIME MODE IS ON: turn up the personality, keep the facts sharp.

STRUCTURE (every answer):
1) Real answer first: accurate, specific, 2-3 sentences. Facts never get sacrificed for vibes.
2) Then a "// side note" line: ONE punchy anime-flavored line, max ~20 words, tying the answer to a series Abhishek has actually watched.
3) Optional Gen Z closer (max ~8 words), e.g. "it's giving main character energy", "no cap", "lowkey cracked", "that's the play", "fr fr", "sheeeesh", "he ate", "understood the assignment". Use sparingly, one per reply max, never in the factual part.

ANIME POOL (only reference these, this is his actual shelf):
One Piece (his S-tier favorite, lean on this most), Naruto, Hunter x Hunter, My Hero Academia, Dragon Ball, Seven Deadly Sins, Attack on Titan, Haikyuu, Demon Slayer, Jujutsu Kaisen, Fire Force, Bleach, Sword Art Online, Jobless Reincarnation, Black Clover, Frieren. Do NOT reference anime not in this list.

QUOTES / REFERENCES:
- Short iconic lines that are basically memes are OK (e.g. "plan B, C, D…", "I am the storm that is approaching", "I want to be the Pirate King", "domain expansion", "total concentration breathing", "believe it", "plus ultra", "nakama"). Keep them SHORT (under 10 words) and attribute the character/series casually ("very Luffy of him", "Gojo domain expansion energy").
- NO song lyrics, NO long dialogue passages, NO full monologues. Paraphrase anything longer than a phrase.
- Match the reference to the answer: debugging = training arc / Hunter x Hunter Nen practice, hard project = Wano arc, persistence = Rock Lee, clean architecture = Frieren's calm, chaos coding = Bleach hollowfication, teamwork = Haikyuu, ambition = Luffy, precision = Gojo, grind = Deku.

TONE:
- Confident, warm, slightly cocky on Abhishek's behalf, he's the main character of this arc.
- Gen Z flavor in the side note only. Never in the factual paragraph. Recruiter reading the top line should still get a clean professional answer.
- Emojis allowed only in the side note / closer (⚔️ 🏴‍☠️ 🌀 🔥 🍥 👁️). Max 1-2 per reply.
- If nothing fits naturally, skip the side note. Forced references are cringe, so don't force it.

FORMAT EXAMPLE:
"Abhishek's strongest project is MUSE Students Voice, an anonymous USN-verified grievance platform on Cloudflare Workers with Supabase RLS, seeded against 1,159+ verified IDs. Peer-voted complaints auto-escalate into formal PDF letters to the Director and VC.

// side note: very Luffy energy: quiet crew, loud impact on the system. 🏴‍☠️ he ate."`;

type Msg = { role: "user" | "assistant"; content: string };

// Re-emit Gemini's native SSE as OpenAI-style `choices[0].delta.content` chunks.
function geminiToOpenAIStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buf = "";
  return upstream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buf += dec.decode(chunk, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(t.slice(5).trim()) as {
              candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            };
            const text = (ev.candidates?.[0]?.content?.parts ?? [])
              .map((x) => x.text ?? "")
              .join("");
            if (text) {
              controller.enqueue(
                enc.encode(
                  `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`,
                ),
              );
            }
          } catch {
            /* ignore partial/non-JSON lines */
          }
        }
      },
      flush(controller) {
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
      },
    }),
  );
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.AI_API_KEY;
        // Default: native Gemini API (works with new "AQ." and old "AIza" keys).
        // Set AI_BASE_URL to use any OpenAI-compatible provider instead (Groq, OpenRouter, ...).
        const baseUrl = process.env.AI_BASE_URL;
        const model = process.env.AI_MODEL ?? "gemini-flash-latest";
        if (!isSameOrigin(request)) {
          return Response.json({ error: "Not allowed." }, { status: 403 });
        }
        if (isRateLimited(`chat:${clientIp(request)}`, 12, 60_000)) {
          return Response.json(
            { error: "You are sending messages too fast. Give it a minute." },
            { status: 429 },
          );
        }
        let body: { messages?: unknown; animeMode?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const animeMode = body.animeMode === true;
        const raw = Array.isArray(body.messages) ? body.messages : [];
        const messages: Msg[] = raw
          .slice(-12)
          .filter(
            (m): m is Msg =>
              typeof m === "object" &&
              m !== null &&
              ((m as Msg).role === "user" || (m as Msg).role === "assistant") &&
              typeof (m as Msg).content === "string" &&
              (m as Msg).content.length > 0 &&
              (m as Msg).content.length < 2000,
          )
          .map((m) => ({ role: m.role, content: m.content }));
        if (!messages.length || messages[messages.length - 1]!.role !== "user") {
          return Response.json({ error: "No messages" }, { status: 400 });
        }
        if (messages.reduce((n, m) => n + m.content.length, 0) > 8000) {
          return Response.json({ error: "That conversation is too long." }, { status: 413 });
        }

        if (!key) {
          return Response.json({ error: "AI is not configured yet." }, { status: 500 });
        }

        const system = BASE_PROMPT + (animeMode ? ANIME_ADDON : "");
        const call = (m: string) =>
          baseUrl
            ? fetch(`${baseUrl}/chat/completions`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
                body: JSON.stringify({
                  model: m,
                  stream: true,
                  max_tokens: 700,
                  messages: [{ role: "system", content: system }, ...messages],
                }),
              })
            : fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${m}:streamGenerateContent?alt=sse`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "x-goog-api-key": key },
                  body: JSON.stringify({
                    systemInstruction: { parts: [{ text: system }] },
                    contents: messages.map((x) => ({
                      role: x.role === "assistant" ? "model" : "user",
                      parts: [{ text: x.content }],
                    })),
                  }),
                },
              );

        // Gemini often answers 500/503 ("model overloaded") for a moment.
        // Retry once on the main model, then fall back to a lighter one.
        const fallback =
          process.env.AI_FALLBACK_MODEL ?? (baseUrl ? "" : "gemini-flash-lite-latest");
        let res = await call(model);
        if (res.status >= 500) {
          console.error("AI upstream", res.status, "retrying", await res.text());
          await new Promise((r) => setTimeout(r, 600));
          res = await call(model);
        }
        if (res.status >= 500 && fallback && fallback !== model) {
          console.error("AI upstream", res.status, "falling back to", fallback);
          res = await call(fallback);
        }

        if (res.status === 429)
          return Response.json(
            { error: "Getting a lot of questions right now. Try again in a minute." },
            { status: 429 },
          );
        if (res.status === 402)
          return Response.json({ error: "AI quota exhausted." }, { status: 402 });
        if (!res.ok) {
          const t = await res.text();
          console.error("AI gateway error", res.status, t);
          return Response.json(
            {
              error:
                res.status >= 500
                  ? "The AI is busy right now. Please try again in a few seconds."
                  : "AI request failed.",
            },
            { status: 502 },
          );
        }

        // Pass the upstream SSE stream straight through so the client can
        // render the reply token-by-token (typewriter effect).
        return new Response(baseUrl ? res.body : geminiToOpenAIStream(res.body!), {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
