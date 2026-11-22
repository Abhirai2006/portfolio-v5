import { PERSON, QUICK_FACTS } from "@/lib/facts";
import { cn } from "@/lib/utils";

/** Short factual answers to "who is Abhishek Rai A?", the sentences search and AI answer engines quote. */
export function QuickFacts({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border-2 border-dashed border-line p-4", className)}>
      <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Quick facts: who is {PERSON.name}?
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {QUICK_FACTS.map((f) => (
          <li key={f} className="flex gap-2">
            <span aria-hidden="true" className="text-primary">
              ▸
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
