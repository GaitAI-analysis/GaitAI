"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import disclosure from "@/components/ui/disclosure.module.css";
import styles from "./cardstories.module.css";

/**
 * THE TWO CARDS, AND THE CHAPTERS BEHIND THEM.
 * =============================================================================
 * Mission, Motion DNA and Vision are three peers on one row, and all three
 * stay exactly as they were drawn. Neither card collapses: both statements are
 * permanently readable, which is the whole point of putting them at the top of
 * the page.
 *
 * What each card gains is a way down. Two sections that used to stand on their
 * own further down the home page are now the chapters these cards open:
 *
 *   MISSION  →  "One movement. Many meanings." — the same walk read five ways
 *   VISION   →  "AI as a silent guardian" and the philosophy quote
 *
 * That pairing is not decoration. Mission says GaitAI turns movement into
 * intelligence, and the chapter behind it is the demonstration: one signal,
 * five readings, the purpose deciding which. Vision says movement intelligence
 * should become a trusted layer of decision-making, and the chapter behind it
 * is the argument for why. Each card is the claim; each chapter is the case.
 *
 * ONE AT A TIME. Both chapters are section-sized. Open together they would put
 * roughly two screens of writing between the row and the rest of the page, so
 * the state here is a single `StoryId | null` rather than two booleans:
 * opening one closes the other, and clicking the open one closes it. This is a
 * pair of linked disclosures, not two independent accordions that happen to
 * sit next to each other.
 *
 * WHY THREE PIECES RATHER THAN ONE COMPONENT. Each control belongs under its
 * own card, inside the row's container; both chapters belong under the whole
 * row, full width, because they are section-sized pieces of writing and would
 * be strangled inside a card column. Those are different places in the tree,
 * so the state lives in a provider that spans all of them.
 *
 * The chapters are passed in from the page, not imported here. This file is
 * shared with the ambient (/about) variant of the section, which has no
 * chapters — and a shared section reaching into home-page sections for content
 * would be the wrong direction of dependency.
 *
 * ACCESSIBILITY (identical for both sides)
 *   · a real <button>, so Enter and Space work with no key handler of our own
 *   · aria-expanded on the trigger, aria-controls pointing at its panel
 *   · each panel is a role="region" labelled back by its trigger
 *   · closed, a panel is `visibility: hidden` — out of the tab order and out
 *     of the accessibility tree — which `hidden` cannot do while still
 *     allowing the close transition to play
 *   · the focus ring is the card's own accent, drawn rather than defaulted
 *   · prefers-reduced-motion collapses the transition; see the stylesheet
 */

export type StoryId = "mission" | "vision";

type CardStoriesContextValue = {
  open: StoryId | null;
  toggle: (story: StoryId) => void;
  idFor: (story: StoryId, part: "trigger" | "panel") => string;
};

const CardStoriesContext = createContext<CardStoriesContextValue | null>(null);

function useCardStories(part: string) {
  const value = useContext(CardStoriesContext);
  if (!value) {
    throw new Error(`<${part}> must be rendered inside <CardStories>.`);
  }
  return value;
}

/** Holds which chapter is open. The triggers and the panels are not siblings. */
export function CardStories({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<StoryId | null>(null);
  const base = useId();

  return (
    <CardStoriesContext.Provider
      value={{
        open,
        /* Selecting the open one closes it; selecting the other one swaps. */
        toggle: (story) => setOpen((current) => (current === story ? null : story)),
        idFor: (story, part) => `${base}-${story}-story-${part}`,
      }}
    >
      {children}
    </CardStoriesContext.Provider>
  );
}

/**
 * The control, under its card. Deliberately not button-shaped: it is the
 * section's own small-caps voice with a chevron after it, the same weight as
 * the "Mission" / "Vision" label on the card above, so it reads as that card's
 * own footnote rather than as a widget that landed next to it.
 *
 * Both sides are the same control in every respect but one — the accent that
 * appears on hover, focus and open is the accent of the card it belongs to,
 * cyan on the left and violet on the right. That is what makes the pair
 * symmetrical rather than merely identical: each half speaks in its own half
 * of the section's two-colour language.
 */
export function CardStoryTrigger({ story }: { story: StoryId }) {
  const { open, toggle, idFor } = useCardStories("CardStoryTrigger");
  const isOpen = open === story;

  return (
    <button
      id={idFor(story, "trigger")}
      type="button"
      aria-expanded={isOpen}
      aria-controls={idFor(story, "panel")}
      data-open={isOpen}
      data-story={story}
      onClick={() => toggle(story)}
      className={`${disclosure.control} ${styles.trigger}`}
    >
      <span aria-hidden="true" className={disclosure.dot} />
      <span className={disclosure.label}>
        {isOpen ? `Close ${story}` : `Explore our ${story}`}
      </span>
      <span aria-hidden="true" className={disclosure.mark} />
    </button>
  );
}

/**
 * A chapter, under the entire row. Grid-rows 0fr → 1fr because it is the one
 * height transition that needs no measured pixel value and so cannot go stale
 * when the content inside it reflows.
 */
export function CardStoryPanel({
  story,
  children,
}: {
  story: StoryId;
  children: ReactNode;
}) {
  const { open, idFor } = useCardStories("CardStoryPanel");

  return (
    <div className={styles.panel} data-open={open === story}>
      <div
        id={idFor(story, "panel")}
        role="region"
        aria-labelledby={idFor(story, "trigger")}
        className={styles.panelInner}
      >
        {children}
      </div>
    </div>
  );
}
