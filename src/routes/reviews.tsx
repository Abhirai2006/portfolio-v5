import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageNav, Footer } from "@/components/comic/Chrome";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";

import { SITE } from "@/lib/site";
type Review = {
  id: string;
  display_name: string | null;
  role: string | null;
  rating: number;
  message: string;
  created_at: string;
};

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews | Abhishek Rai A" },
      {
        name: "description",
        content:
          "Read feedback on Abhishek Rai A's work and leave an anonymous review without signing in.",
      },
      { property: "og:title", content: "Reviews | Abhishek Rai A" },
      {
        property: "og:description",
        content: "Read feedback and leave an anonymous review for Abhishek Rai A's portfolio.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/reviews` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${SITE}/reviews` }],
  }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("reviews")
      .select("id, display_name, role, rating, message, created_at")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("The review wall is taking a moment to load. Please refresh and try again.");
    } else {
      setReviews((data ?? []) as Review[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("display_name") ?? "").trim();
    const role = String(form.get("role") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();

    if (message.length < 10) {
      setError("Your review needs at least 10 characters.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("reviews").insert({
      display_name: displayName || null,
      role: role || null,
      rating,
      message,
      published: true,
    });

    if (insertError) {
      setError("That review could not be published yet. Please try again.");
      setSubmitting(false);
      return;
    }

    track("cta_click", "review_submitted");
    await navigate({ to: "/thank-you" });
  }

  return (
    <div className="page">
      <PageNav />
      <main className="page-wrap">
        <p className="page-kicker">A small guestbook</p>
        <h1 className="page-title">Leave a note. Keep it real.</h1>
        <p className="page-lede">
          No account. No email. Just your honest take on the work, the projects, or the experience
          of reading this comic.
        </p>
        <div className="grid-2" style={{ alignItems: "start" }}>
          <section className="ink-box" aria-labelledby="review-form-title">
            <h2 id="review-form-title">What did you think?</h2>
            <form onSubmit={submitReview}>
              <div className="form-row">
                <label htmlFor="display_name">Name (optional)</label>
                <input
                  id="display_name"
                  name="display_name"
                  maxLength={80}
                  placeholder="How should I credit you?"
                />
              </div>
              <div className="form-row">
                <label htmlFor="role">Role or context (optional)</label>
                <input
                  id="role"
                  name="role"
                  maxLength={100}
                  placeholder="Recruiter, classmate, visitor…"
                />
              </div>
              <fieldset className="form-row" style={{ border: 0, padding: 0 }}>
                <legend
                  style={{
                    font: "700 12px var(--ui)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Rating
                </legend>
                <div className="filters" style={{ margin: 0 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={rating === n}
                      onClick={() => setRating(n)}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    >
                      {"★".repeat(n)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="form-row">
                <label htmlFor="message">Your review</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  minLength={10}
                  maxLength={1200}
                  rows={5}
                  placeholder="What stood out?"
                />
              </div>
              {error && (
                <p role="alert" style={{ color: "#b00020" }}>
                  {error}
                </p>
              )}
              <button type="submit" className="btn-ink primary" disabled={submitting}>
                {submitting ? "Publishing…" : "Publish review"}
              </button>
            </form>
          </section>
          <section aria-labelledby="wall-title">
            <h2 id="wall-title" style={{ font: "800 28px var(--display)", margin: "0 0 16px" }}>
              The review wall
            </h2>
            {loading ? (
              <p>Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p>No reviews yet. Be the first, Abhishek would love to hear from you.</p>
            ) : (
              reviews.map((r) => (
                <article key={r.id} className="review">
                  <p aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}</p>
                  <p>{r.message}</p>
                  <footer>
                    {r.display_name || "Anonymous"}
                    {r.role ? ` · ${r.role}` : ""} ·{" "}
                    {new Date(r.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </footer>
                </article>
              ))
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
