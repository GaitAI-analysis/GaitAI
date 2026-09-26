import Link from "next/link";
import { experiments } from "@/data/experiments";
import { LAB_DISTINCTION, gaitLabs } from "@/data/labs";

/**
 * The two labs, side by side, on both of their pages.
 *
 * The site has a Movement Intelligence Lab and a GaitAI Labs, and the names
 * are close enough that a reader will blur them unless the difference is
 * stated exactly where they meet. So each page carries this strip: the
 * question each lab answers in the reader's own words, its purpose, and what
 * it includes — the last derived from `experiments` and `gaitLabs`, so the
 * strip can never list something the lab does not have.
 *
 * `current` marks the lab the reader is on; the other is the link.
 */
export function LabDistinction({ current }: { current: "movement-lab" | "labs" }) {
  const includes: Record<"movement-lab" | "labs", string[]> = {
    "movement-lab": [
      "Analyze a clip, in your browser",
      ...experiments.map((experiment) => experiment.name),
    ],
    labs: [...gaitLabs.map((lab) => lab.name), "Future gait-research experiments"],
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {LAB_DISTINCTION.map((lab) => {
        const here = lab.id === current;
        return (
          <div
            key={lab.id}
            className={`relative rounded-[1.25rem] border p-6 sm:p-7 ${
              here
                ? "border-cyan-300/30 bg-cyan-300/[0.04]"
                : "border-white/[0.08] bg-white/[0.02]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                {lab.name}
              </span>
              {here && (
                <span className="text-[10px] uppercase tracking-[0.18em] text-soft-mute">
                  You are here
                </span>
              )}
            </div>
            <p className="mt-4 font-display text-lg leading-snug text-soft-white sm:text-xl">
              &ldquo;{lab.question}&rdquo;
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-soft-gray">
              {lab.purpose}
            </p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {includes[lab.id].map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-white/[0.09] px-2.5 py-1 text-[11px] text-soft-mute"
                >
                  {item}
                </li>
              ))}
            </ul>
            {!here && (
              <Link
                href={lab.href}
                className="mt-5 inline-flex items-center gap-1 text-sm text-cyan-300 transition-colors hover:text-cyan-200"
              >
                Go to the {lab.name}
                <span aria-hidden="true">&rarr;</span>
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
