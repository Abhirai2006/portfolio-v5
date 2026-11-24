/**
 * Shared chrome: the AR emblem, the finale ("Let's build something" + contact) and the footer
 * (Anime shelf, Reviews, "To be continued… Vol. 02"). Server-rendered on every page that uses them.
 */
import { Link } from "@tanstack/react-router";
import { PERSON } from "@/lib/facts";
import { mailto, CONTACT_EMAIL } from "@/lib/contact";

/** Original monogram: an A and an R inked inside a ring, with circuit traces. */
export function Emblem({
  size = 40,
  draw = false,
  progress = 1,
  className = "",
}: {
  size?: number;
  draw?: boolean;
  progress?: number;
  className?: string;
}) {
  const len = 400;
  const dash = draw ? { strokeDasharray: len, strokeDashoffset: len * (1 - progress) } : undefined;
  return (
    <svg
      className={`emblem ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="50" cy="50" r="44" strokeWidth="3" style={dash} />
      <circle cx="50" cy="50" r="37" strokeWidth="1" opacity="0.5" style={dash} />
      <path d="M26 72 L40 28 L54 72 M31 57 H49" strokeWidth="5" style={dash} />
      <path d="M58 72 V30 H68 C78 30 80 50 68 50 H58 M68 50 L78 72" strokeWidth="5" style={dash} />
      <path d="M50 6 V16 M50 84 V94 M6 50 H14 M86 50 H94" strokeWidth="2" style={dash} />
      <circle cx="50" cy="16" r="2.6" fill="var(--blue)" stroke="none" />
      <circle cx="86" cy="50" r="2.6" fill="var(--blue)" stroke="none" />
    </svg>
  );
}

export function Finale() {
  return (
    <section id="contact" className="finale" aria-labelledby="finale-h">
      <div className="finale-inner">
        <p className="finale-kicker">Chapter end · {PERSON.name}</p>
        <h2 id="finale-h" className="finale-type" aria-label="Let's build something">
          <span>LET'S BUILD</span>
          <span>SOMETHING</span>
        </h2>
        <figure className="finale-portrait">
          <img
            src="/art/static/portrait.webp"
            alt="Abhishek in ink and screentone, looking straight at the reader."
            width={480}
            height={600}
            loading="lazy"
            decoding="async"
          />
          <figcaption className="speech">
            "Building cool stuff, one algorithm at a time."
          </figcaption>
        </figure>
        <div className="finale-cols">
          <p>
            <b>Looking for</b>
            <br />
            ML internships
          </p>
          <p>
            <b>Based in</b>
            <br />
            {PERSON.city}, India
          </p>
          <p>
            <b>Speaks</b>
            <br />
            {PERSON.languages.join(", ")}
          </p>
        </div>
        <div className="contact-panel" role="group" aria-label="Contact">
          <a className="btn-ink primary" href={mailto("internship")}>
            Email about an internship
          </a>
          <a className="btn-ink" href={PERSON.linkedin} rel="me noopener" target="_blank">
            LinkedIn
          </a>
          <a className="btn-ink" href={PERSON.github} rel="me noopener" target="_blank">
            GitHub
          </a>
          <Link className="btn-ink" to="/resume">
            Résumé
          </Link>
        </div>
        <p className="finale-mail">
          or write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="teaser">
        <Link to="/anime" className="teaser-side">
          Anime
          <br />
          shelf
        </Link>
        <p className="teaser-type">
          TO BE CONTINUED…
          <br />
          VOL. 02
        </p>
        <Link to="/reviews" className="teaser-side">
          Reader
          <br />
          reviews
        </Link>
      </div>
      <div className="footer-base">
        <div className="footer-brand">
          <Emblem size={44} />
          <span>ABHISHEK'S WORLD</span>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/">Story</Link>
          <Link to="/resume">Résumé</Link>
          <Link to="/anime">Anime shelf</Link>
          <Link to="/reviews">Reviews</Link>
          <a href={PERSON.github} rel="me noopener" target="_blank">
            GitHub
          </a>
          <a href={PERSON.linkedin} rel="me noopener" target="_blank">
            LinkedIn
          </a>
          <a href={PERSON.instagram} rel="me noopener" target="_blank">
            Instagram
          </a>
        </nav>
        <p className="honesty">
          The ML and algorithm work is his. The web layer of this site was built with AI as a
          copilot, and he says so. The art and the sound are original to this site.
        </p>
      </div>
    </footer>
  );
}

/** Small header used on the sub-pages. */
export function PageNav() {
  return (
    <header className="page-nav">
      <Link to="/" className="hud-brand" aria-label="Abhishek's World: back to the story">
        <Emblem size={34} />
        <span>ABHISHEK'S WORLD</span>
      </Link>
      <nav aria-label="Main">
        <Link to="/" activeOptions={{ exact: true }}>
          Story
        </Link>
        <Link to="/resume">Résumé</Link>
        <Link to="/anime">Anime</Link>
        <Link to="/reviews">Reviews</Link>
        <a href="/#contact">Contact</a>
      </nav>
    </header>
  );
}
