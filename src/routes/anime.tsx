import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { shelf, allGenres, totalEpisodes, totalMinutes } from "@/data/anime";
import {
  addRecommendation,
  listRecommendations,
  moodSearch,
  searchCatalogue,
  voteRecommendation,
  type CatalogueHit,
  type Recommendation,
} from "@/lib/anime.functions";
import { nf, minutesToSpan } from "@/lib/format";
import { markVoted, votedIds, voterKey } from "@/lib/voter";
import { PageNav, Footer } from "@/components/site/Chrome";
import { SITE } from "@/lib/site";

const OG_IMAGE = `${SITE}/anime-og-cover.jpg`;
const TITLE = "Abhi's Anime Shelf | 3,600+ Episodes Watched";
const DESC =
  "Every anime Abhi has watched, as a manga-shelf of covers: 3,600+ episodes, a mood curator, and an open slot for your recommendation.";

export const Route = createFileRoute("/anime")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      {
        name: "keywords",
        content:
          "anime shelf, anime collection, watched anime list, anime tracker, anime recommendations, 3D anime gallery",
      },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Abhi's Anime Shelf" },
      { property: "og:url", content: `${SITE}/anime` },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "The anime shelf" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${SITE}/anime` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: TITLE,
          description: DESC,
          url: `${SITE}/anime`,
          image: OG_IMAGE,
          inLanguage: "en",
          author: {
            "@type": "Person",
            name: "Abhishek Rai A",
            url: SITE,
          },
          about: { "@type": "Thing", name: "Anime" },
          mainEntity: {
            "@type": "ItemList",
            name: "Anime watched by Abhishek Rai A",
            numberOfItems: shelf.length,
            itemListElement: shelf.slice(0, 20).map((a, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "TVSeries",
                name: a.title,
                ...(a.cover ? { image: a.cover } : {}),
              },
            })),
          },
        }),
      },
    ],
  }),
  component: ShelfPage,
});

type Filter = { genre: string | null; format: "all" | "tv" | "movie" };

function ShelfPage() {
  const [filter, setFilter] = useState<Filter>({ genre: null, format: "all" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [mood, setMood] = useState("");
  const [moodIds, setMoodIds] = useState<string[] | null>(null);
  const [moodLine, setMoodLine] = useState("");
  const [moodBusy, setMoodBusy] = useState(false);
  const [moodError, setMoodError] = useState<string | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [mine, setMine] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<CatalogueHit[]>([]);
  const [pickHit, setPickHit] = useState<CatalogueHit | null>(null);
  const [recName, setRecName] = useState("");
  const [recNote, setRecNote] = useState("");
  const [recMsg, setRecMsg] = useState("");

  const askMood = useServerFn(moodSearch);
  const fetchRecs = useServerFn(listRecommendations);
  const castVote = useServerFn(voteRecommendation);
  const search = useServerFn(searchCatalogue);
  const add = useServerFn(addRecommendation);

  const loadRecs = useCallback(() => {
    fetchRecs({})
      .then(setRecs)
      .catch(() => setRecs([]));
  }, [fetchRecs]);

  useEffect(() => {
    loadRecs();
    setMine(votedIds());
  }, [loadRecs]);

  const vote = useCallback(
    async (id: string) => {
      if (mine.includes(id)) return;
      setMine((m) => [...m, id]);
      markVoted(id);
      setRecs((rs) => rs.map((r) => (r.id === id ? { ...r, votes: r.votes + 1 } : r)));
      try {
        await castVote({ data: { id, voterKey: voterKey() } });
      } catch {
        /* the local tally still reads right for this visitor */
      }
    },
    [castVote, mine],
  );

  const visible = useMemo(() => {
    const set = moodIds ? new Set(moodIds) : null;
    return shelf.filter((a) => {
      if (set) return set.has(a.id);
      if (filter.genre && !a.genres.includes(filter.genre)) return false;
      if (filter.format !== "all" && a.format !== filter.format) return false;
      return true;
    });
  }, [filter, moodIds]);

  const span = minutesToSpan(totalMinutes);
  const open = shelf.find((a) => a.id === openId) ?? null;

  async function runMood(e: React.FormEvent) {
    e.preventDefault();
    if (mood.trim().length < 2) return;
    setMoodBusy(true);
    setMoodError(null);
    try {
      const res = await askMood({ data: { mood: mood.trim() } });
      if (res.error) {
        setMoodError(res.error);
        setMoodIds(null);
      } else {
        setMoodIds(res.ids);
        setMoodLine(res.line);
      }
    } catch {
      setMoodError("The curator could not answer just now.");
    } finally {
      setMoodBusy(false);
    }
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setHits(await search({ data: { q: q.trim() } }).catch(() => []));
  }

  async function submitRec(e: React.FormEvent) {
    e.preventDefault();
    if (!pickHit) return;
    const res = await add({
      data: {
        catalogueId: pickHit.catalogueId,
        title: pickHit.title,
        romaji: pickHit.romaji,
        cover: pickHit.cover,
        year: pickHit.year,
        episodes: pickHit.episodes,
        synopsis: pickHit.synopsis,
        recommender: recName.trim() || "Anonymous",
        note: recNote.trim() || null,
      },
    }).catch(() => ({ ok: false as const, reason: "Could not save that right now." }));
    if (res.ok) {
      setRecMsg("Added to the shelf. Thank you!");
      setPickHit(null);
      setHits([]);
      setQ("");
      loadRecs();
    } else setRecMsg(res.reason);
  }

  return (
    <div className="page">
      <PageNav />
      <main className="page-wrap">
        <p className="page-kicker">Side quest · the anime shelf</p>
        <h1 className="page-title">Abhi's anime shelf</h1>
        <p className="page-lede">
          {shelf.length} series and films, {nf.format(totalEpisodes)} episodes, about{" "}
          {nf.format(span.days)} days of watching. One Piece is the all-time favourite.
        </p>

        <form
          onSubmit={runMood}
          className="ink-box"
          style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end", marginBottom: 16 }}
        >
          <div className="form-row" style={{ flex: "1 1 260px", margin: 0 }}>
            <label htmlFor="mood">Ask the curator for a mood</label>
            <input
              id="mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="Something that makes me cry, but in a good way"
              maxLength={160}
            />
          </div>
          <button className="btn-ink primary" type="submit" disabled={moodBusy}>
            {moodBusy ? "Thinking…" : "Curate"}
          </button>
          {moodIds && (
            <button type="button" className="btn-ink" onClick={() => setMoodIds(null)}>
              Clear
            </button>
          )}
          {moodLine && moodIds && (
            <p style={{ flexBasis: "100%", margin: 0, font: "italic 400 20px var(--swash)" }}>
              {moodLine}
            </p>
          )}
          {moodError && (
            <p role="alert" style={{ flexBasis: "100%", margin: 0 }}>
              {moodError}
            </p>
          )}
        </form>

        <div className="filters" role="group" aria-label="Filter">
          {(["all", "tv", "movie"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter.format === f}
              onClick={() => setFilter((x) => ({ ...x, format: f }))}
            >
              {f === "all" ? "All" : f === "tv" ? "Series" : "Films"}
            </button>
          ))}
          <span style={{ width: 12 }} />
          {allGenres.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={filter.genre === g}
              onClick={() => setFilter((x) => ({ ...x, genre: x.genre === g ? null : g }))}
            >
              {g}
            </button>
          ))}
        </div>

        {open && (
          <section
            className="ink-box"
            aria-live="polite"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 160px) 1fr",
              gap: 18,
              marginBottom: 22,
            }}
          >
            {open.cover ? (
              <img
                src={open.cover}
                alt={`${open.title} cover`}
                style={{ width: "100%", border: "2px solid var(--ink)" }}
              />
            ) : (
              <span />
            )}
            <div>
              <p className="page-kicker">
                {open.studio}
                {open.year ? ` · ${open.year}` : ""} ·{" "}
                {open.status === "watching" ? "Watching now" : "Completed"}
              </p>
              <h2>{open.title}</h2>
              <p>{open.synopsis}</p>
              <p>
                <b>{nf.format(open.episodesWatched)}</b> episodes watched · {open.genres.join(", ")}
              </p>
              <button type="button" className="btn-ink" onClick={() => setOpenId(null)}>
                Close
              </button>
            </div>
          </section>
        )}

        <ul className="anime-grid" aria-label="The shelf">
          {visible.map((a) => (
            <li key={a.id} className="anime-card">
              <button
                type="button"
                onClick={() => setOpenId(a.id)}
                style={{ all: "unset", cursor: "pointer", display: "block" }}
                aria-label={`Open ${a.title}`}
              >
                {a.cover ? (
                  <img
                    src={a.cover}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={300}
                    height={450}
                  />
                ) : (
                  <span
                    style={{ display: "block", aspectRatio: "2/3", background: "var(--paper-2)" }}
                  />
                )}
                <p>
                  {a.title}
                  <small>
                    {a.format === "movie" ? "Film" : `${a.episodesWatched} ep`}
                    {a.status === "watching" ? " · watching" : ""}
                  </small>
                </p>
              </button>
            </li>
          ))}
        </ul>

        <div className="grid-2" style={{ marginTop: 40, alignItems: "start" }}>
          <section className="ink-box" aria-labelledby="rec-h">
            <h2 id="rec-h">Recommend one</h2>
            <form onSubmit={runSearch} style={{ display: "flex", gap: 8 }}>
              <label htmlFor="rq" className="sr-only">
                Search the catalogue
              </label>
              <input
                id="rq"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search an anime…"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "1.5px solid var(--ink)",
                  padding: "10px 12px",
                }}
              />
              <button className="btn-ink" type="submit">
                Search
              </button>
            </form>
            {hits.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, maxHeight: 220, overflow: "auto" }}>
                {hits.map((h) => (
                  <li key={h.catalogueId}>
                    <button
                      type="button"
                      className="btn-ink"
                      style={{
                        width: "100%",
                        justifyContent: "flex-start",
                        marginTop: 6,
                        boxShadow: "none",
                      }}
                      aria-pressed={pickHit?.catalogueId === h.catalogueId}
                      onClick={() => setPickHit(h)}
                    >
                      {h.title} {h.year ? `(${h.year})` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {pickHit && (
              <form onSubmit={submitRec} style={{ marginTop: 12 }}>
                <p>
                  Recommending <b>{pickHit.title}</b>
                </p>
                <div className="form-row">
                  <label htmlFor="rn">Your name</label>
                  <input
                    id="rn"
                    value={recName}
                    onChange={(e) => setRecName(e.target.value)}
                    maxLength={60}
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="rnote">Why he should watch it (optional)</label>
                  <textarea
                    id="rnote"
                    value={recNote}
                    onChange={(e) => setRecNote(e.target.value)}
                    maxLength={400}
                    rows={3}
                  />
                </div>
                <button type="submit" className="btn-ink primary">
                  Put it on the shelf
                </button>
              </form>
            )}
            {recMsg && <p role="status">{recMsg}</p>}
          </section>
          <section aria-labelledby="recs-h">
            <h2 id="recs-h" style={{ font: "800 28px var(--display)", margin: "0 0 12px" }}>
              Recommended by readers
            </h2>
            {recs.length === 0 ? (
              <p>No recommendations yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
                {[...recs]
                  .sort((a, b) => b.votes - a.votes)
                  .map((r) => (
                    <li
                      key={r.id}
                      className="ink-box"
                      style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}
                    >
                      {r.cover && (
                        <img
                          src={r.cover}
                          alt=""
                          width={48}
                          height={72}
                          style={{ border: "1.5px solid var(--ink)" }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <b>{r.title}</b>
                        <br />
                        <small>
                          from {r.recommender}
                          {r.note ? `: "${r.note}"` : ""}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="btn-ink"
                        onClick={() => vote(r.id)}
                        disabled={mine.includes(r.id)}
                        aria-label={`Vote for ${r.title}`}
                      >
                        ▲ {r.votes}
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
