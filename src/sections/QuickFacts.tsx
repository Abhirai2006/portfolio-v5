import { PERSON, QUICK_FACTS } from "@/lib/facts";
import { cn } from "@/lib/utils";

/** Short factual answers to "who is Abhishek Rai A?" — the sentences search and AI answer engines quote. */
export function QuickFacts({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "paper";
}) {
  return (
    <div
      className={cn(
        "border-2 border-dashed p-4",
        tone === "ink" ? "border-grey-3 text-grey-4" : "border-ink text-ink",
        className,
      )}
    >
      <h3 className="font-hud text-[11px] normal-case tracking-[0.14em]">
        Quick facts: who is {PERSON.name}?
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
        {QUICK_FACTS.map((f) => (
          <li key={f} className="flex gap-2">
            <span aria-hidden="true">▸</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
