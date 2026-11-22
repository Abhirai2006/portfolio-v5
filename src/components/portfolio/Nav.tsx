import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "./ThemeToggle";
import { mailto } from "@/lib/contact";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all print:hidden ${
        scrolled ? "backdrop-blur-md bg-background/80 border-b-2 border-line" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-sm tracking-widest">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          <span className="font-display font-extrabold tracking-wide">ABHISHEK RAI A</span>
          <span className="hidden text-muted-foreground sm:inline">· ML PORTFOLIO</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/reviews"
            className="hidden sm:inline text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            Reviews
          </Link>
          <Link
            to="/resume"
            className="hidden sm:inline text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            Résumé
          </Link>
          <ThemeToggle compact />
          <a
            href={mailto("internship")}
            aria-label="Email Abhishek about an internship"
            className="rounded-full border-2 border-line bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-[3px_3px_0_var(--panel-shadow)] transition hover:-translate-y-0.5"
          >
            Hire me →
          </a>
        </div>
      </div>
    </header>
  );
}
