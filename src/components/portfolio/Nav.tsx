/**
 * Sub-page header in the HUD language of the homepage: `ABHISHEK'S WORLD — PLATE xx` on the left, the side
 * rooms and the internship mail button on the right. Fixed, ink, prints away.
 */
import { Link } from "@tanstack/react-router";
import { mailto } from "@/lib/contact";

export function Nav({ plate = "EXTRA" }: { plate?: string }) {
  return (
    <header className="no-print fixed inset-x-0 top-0 z-50 border-b border-grey-2 bg-ink/90 backdrop-blur-sm print:hidden">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-[var(--gutter)] py-3 font-hud text-[11px]">
        <Link to="/" className="text-paper">
          ABHISHEK&apos;S WORLD <span className="text-grey-3">— {plate}</span>
        </Link>
        <nav aria-label="Pages" className="flex items-center gap-4 sm:gap-6">
          <Link to="/" hash="map" className="hidden text-grey-4 hover:text-paper sm:inline">
            The board
          </Link>
          <Link to="/anime" className="hidden text-grey-4 hover:text-paper md:inline">
            Anime
          </Link>
          <Link to="/reviews" className="hidden text-grey-4 hover:text-paper sm:inline">
            Reviews
          </Link>
          <Link to="/resume" className="text-grey-4 hover:text-paper">
            Résumé
          </Link>
          <a
            href={mailto("internship")}
            aria-label="Email Abhishek about an internship"
            className="ink-btn !px-3 !py-1.5"
          >
            Hire me →
          </a>
        </nav>
      </div>
    </header>
  );
}
