"use client";

import { useId, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { EnvironmentScene } from "@/components/visuals/EnvironmentScenes";
import { industryUseCases, type Vertical } from "@/data/products";
import { useCaseDetails } from "@/data/usecase-details";

/**
 * ONE FAMILY'S ENVIRONMENTS, five at a time.
 * =============================================================================
 * The column opens on five rows and keeps the rest behind its own control:
 * "Show 6 more" on MobilityCare, "Show 2 more" on SecureVision. Both columns
 * therefore start the same height, which is the point — eleven rows against
 * seven left the section lopsided and pushed the SecureVision rail into empty
 * space long before the MobilityCare one ended.
 *
 * EVERY ROW IS IN THE HTML, OPEN OR NOT. The rest of the list is rendered and
 * collapsed, never dropped, so a crawler and a reader without JavaScript both
 * get the full breadth of the family; closed, the rows are `visibility:
 * hidden`, which keeps them out of the tab order and the accessibility tree.
 * This is the same collapse the workflow section uses.
 *
 * THE COUNT BESIDE THE HEADING SAYS WHICH STATE YOU ARE IN — "5 of 11
 * environments" closed, "11 environments" open — so the control is never the
 * only thing telling you there is more.
 *
 * WHY THIS IS A CLIENT COMPONENT and the section around it is not: the open
 * state is the only interactive thing on the page here. Keeping the branch
 * separate leaves the heading, the hub and the section frame server-rendered.
 */

/** How many rows a column opens with. */
const VISIBLE = 5;

const hrefFor = (caseId: string, vertical: Vertical) => {
  /* An environment that is one product (Defence & Armed Forces → DefenceMotion)
     lands on that product; the /use-cases explorer still links its page. */
  const landing = industryUseCases.find((u) => u.id === caseId)?.landing;
  if (landing) return landing;
  const detail = useCaseDetails.find((d) => d.caseId === caseId);
  return detail ? `/use-cases/${detail.slug}/` : `/${vertical}/`;
};

/** Full class names, written out — Tailwind drops @layer rules it can't find. */
const COLUMN_CLASS = {
  care: "env-column env-column--care",
  secure: "env-column env-column--secure",
} as const;

const BRANCH_CLASS = {
  care: "env-branch env-branch--care",
  secure: "env-branch env-branch--secure",
} as const;

type Entry = (typeof industryUseCases)[number];

export function EnvironmentBranch({
  vertical,
  label,
  accent,
}: {
  vertical: Vertical;
  label: string;
  accent: "care" | "secure";
}) {
  const entries = industryUseCases.filter((u) => u.vertical === vertical);
  const first = entries.slice(0, VISIBLE);
  const rest = entries.slice(VISIBLE);

  const [open, setOpen] = useState(false);
  /* Clipping is what makes the collapse work and what would shave the glow off
     the rail nodes once it has finished. Released on the way open, taken back
     the moment it starts closing. */
  const [settled, setSettled] = useState(false);
  const restId = useId();

  /* `--env-i` drives each node's pulse delay, so the hidden rows continue the
     column's rhythm rather than restarting it. */
  const row = (entry: Entry, i: number) => (
    <li key={entry.id} className="env-item" style={{ "--env-i": i } as CSSProperties}>
      <Link href={hrefFor(entry.id, entry.vertical)} className="env-panel">
        <span aria-hidden="true" className="env-scene">
          <EnvironmentScene id={entry.id} />
        </span>
        <span className="env-copy">
          <span className="env-name">{entry.industry}</span>
          <span className="env-outcome">{entry.outcome}</span>
        </span>
        <ArrowUpRight aria-hidden="true" className="env-arrow" />
      </Link>
    </li>
  );

  return (
    <div className={COLUMN_CLASS[accent]}>
      <div className="env-column-head">
        <span aria-hidden="true" className="env-column-node" />
        <h3 className="env-column-title">{label}</h3>
        <span className="env-column-count">
          {open || rest.length === 0
            ? `${entries.length} environments`
            : `${VISIBLE} of ${entries.length} environments`}
        </span>
      </div>

      <div className={BRANCH_CLASS[accent]}>
        <ul className="env-list">{first.map((entry, i) => row(entry, i))}</ul>

        {rest.length > 0 && (
          <>
            <div
              id={restId}
              data-open={open}
              data-settled={settled}
              className="env-more"
              onTransitionEnd={(event) => {
                if (event.propertyName === "grid-template-rows") setSettled(open);
              }}
            >
              <div className="env-more-inner">
                <ul className="env-list">
                  {rest.map((entry, i) => row(entry, i + VISIBLE))}
                </ul>
              </div>
            </div>

            <div className="env-more-control">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={restId}
                onClick={() => {
                  if (open) setSettled(false);
                  setOpen(!open);
                }}
                className="env-more-button"
              >
                {open ? "Show less" : `Show ${rest.length} more`}
                <ChevronDown aria-hidden="true" className="env-more-chevron" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
