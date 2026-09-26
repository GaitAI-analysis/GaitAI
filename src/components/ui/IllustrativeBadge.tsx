import { cn } from "@/lib/utils";

/**
 * Marks a visual whose numbers are examples rather than measurements.
 *
 * Several product surfaces render convincing dashboards — a report for
 * "Patient #1042", a mobility score of 82, a "+18% improvement" trend, an
 * operations console feed. None of those come from a real assessment, a real
 * camera or a real customer, and without a label a reader can reasonably take
 * them for measured results. This badge says so, quietly.
 *
 * ON THE WORDING. One label, `DEMO_LABEL`, is used everywhere so the site
 * speaks with one voice: "Illustrative demo". Shorter, context-specific
 * variants ("Example values", "Example output") are available for captions
 * where the surrounding copy already establishes that this is a demonstration.
 * The label must stay concrete enough that no reader mistakes an example for a
 * validated measurement — dropping the disclosure is never the shorter option.
 *
 * Typography only — no icon, per the site's current direction — and sized to
 * read as a caption rather than a warning. It must never be applied to a
 * genuine published research figure.
 *
 * `variant`:
 *   "inline"  — sits in normal flow above or below the visual
 *   "overlay" — absolutely positioned inside a media surface (video, hero)
 */

/** The site-wide disclosure label. Every surface with example values uses it. */
export const DEMO_LABEL = "Illustrative demo";
/** For captions under a single figure, where "demo" is already established. */
export const EXAMPLE_VALUES_LABEL = "Example values";

export function IllustrativeBadge({
  label = DEMO_LABEL,
  variant = "inline",
  className,
}: {
  label?: string;
  variant?: "inline" | "overlay";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.16em]",
        variant === "overlay"
          ? "border-white/12 bg-obsidian/70 text-soft-mute backdrop-blur-sm"
          : "border-white/10 bg-white/[0.03] text-soft-mute",
        className
      )}
    >
      {label}
    </span>
  );
}
