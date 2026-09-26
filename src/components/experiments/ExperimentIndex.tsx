import Link from "next/link";
import {
  EXPERIMENTS_BOUNDARY,
  LAB_BASIS_LABEL,
  experiments,
  type ExperimentRecord,
} from "@/data/experiments";
import { ExperimentActionRow } from "./ExperimentActionRow";

/**
 * The experiments, as a numbered editorial column.
 *
 * This list used to be the body of /labs. It moved here, unchanged in design,
 * when /labs became the home of the gait research assets: the experiments are
 * ways of poking at the movement-intelligence pipeline, so they belong at the
 * foot of the Movement Intelligence Lab, after the reader has seen the
 * pipeline run. There is one list and one record (`data/experiments.ts`);
 * the search palette and the assistant's corpus read the same record.
 *
 * WHY IT IS A LIST AND NOT A GRID OF CARDS. A numbered editorial column reads
 * faster than a grid of boxes, states the numbering as typography rather than
 * chrome, and keeps this page from gaining a fifth card grid — which matters
 * more as the list grows. The rows wash and their arrow slides — `.row-link`,
 * the shared compact-row behaviour — so they do not lift one by one.
 *
 * ONE ROW IS A BUTTON. The Atlas (01) is an overlay with no route, so its
 * record is `kind: "action"` and it renders through `ExperimentActionRow` —
 * the same class list and the same body as the link rows, in a `<button>`
 * that opens the existing overlay in place. Every other row is a `Link`. The
 * two share `ExperimentRowBody` so there is one row design, not two that
 * happen to match.
 *
 * THE NUMBER IS THE POSITION. 01, 02, … come from the record's place in the
 * array, so reordering `experiments` reorders the list and nothing else has
 * to be renumbered.
 *
 * "ON THIS PAGE". Several experiments are instruments inside /movement-lab
 * itself, and their record says so in `home`. Rendered on that very page, the
 * honest label is "On this page" — derived from the href, so no record has to
 * know where it is being rendered.
 */

const ROW_CLASS =
  "row-link group grid gap-x-6 gap-y-3 border-b border-white/[0.06] py-7 sm:grid-cols-[4rem_1fr_auto] sm:items-baseline sm:px-2";

function homeLabel(experiment: ExperimentRecord, onPagePrefix: string) {
  if (experiment.kind === "route" && experiment.href.startsWith(onPagePrefix)) {
    return "On this page";
  }
  return experiment.home;
}

/** The inside of a row — number, copy, arrow — whichever element wraps it. */
function ExperimentRowBody({
  experiment,
  position,
  onPagePrefix,
}: {
  experiment: ExperimentRecord;
  position: number;
  onPagePrefix: string;
}) {
  const home = homeLabel(experiment, onPagePrefix);
  return (
    <>
      {/* The index as type, which is the whole ornament. */}
      <span
        aria-hidden="true"
        className="font-display text-2xl leading-none text-soft-mute transition-colors group-hover:text-cyan-300"
      >
        {String(position + 1).padStart(2, "0")}
      </span>

      <span className="min-w-0">
        <span className="block font-display text-xl text-soft-white">
          {experiment.name}
        </span>
        {/* Plain `text-cyan-300`, never `/90`: the light theme remaps the bare
            utility to #0e7490, and an opacity modifier generates a class that
            remap does not cover — which left this line pale cyan on white. */}
        <span className="mt-1 block text-sm text-cyan-300">
          {experiment.strap}
        </span>
        <span className="mt-3 block max-w-xl text-[14.5px] leading-relaxed text-soft-gray">
          {experiment.body}
        </span>

        <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.14em] text-soft-mute">
          <span>{LAB_BASIS_LABEL[experiment.basis]}</span>
          {home && (
            <>
              <span aria-hidden="true">·</span>
              <span>{home}</span>
            </>
          )}
        </span>
      </span>

      <span
        aria-hidden="true"
        className="row-link-arrow text-soft-mute sm:self-center"
      >
        &rarr;
      </span>
    </>
  );
}

export function ExperimentIndex({
  /** The route this list is rendered on; anchors under it read "On this page". */
  onPagePrefix = "/movement-lab/",
}: {
  onPagePrefix?: string;
}) {
  return (
    <>
      {/* Said once, here, rather than repeated under every entry — and
          specific about which part is illustrative, because the analyzer on
          this page does run a real model. */}
      <p className="max-w-xl text-[13px] leading-relaxed text-soft-mute">
        {EXPERIMENTS_BOUNDARY}
      </p>

      <ol className="mt-8 border-t border-white/[0.06]">
        {experiments.map((experiment, position) => (
          <li key={experiment.id}>
            {experiment.kind === "action" ? (
              <ExperimentActionRow
                action={experiment.action}
                label={`Open ${experiment.name}: ${experiment.strap}`}
                className={ROW_CLASS}
              >
                <ExperimentRowBody
                  experiment={experiment}
                  position={position}
                  onPagePrefix={onPagePrefix}
                />
              </ExperimentActionRow>
            ) : (
              <Link
                href={experiment.href}
                aria-label={`${experiment.name}: ${experiment.strap}`}
                className={ROW_CLASS}
              >
                <ExperimentRowBody
                  experiment={experiment}
                  position={position}
                  onPagePrefix={onPagePrefix}
                />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
