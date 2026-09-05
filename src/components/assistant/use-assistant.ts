"use client";

/**
 * THE CONVERSATION
 * =============================================================================
 * State and session memory for Ask GaitAI.
 *
 * MEMORY IS DELIBERATELY SHORT. The last few turns live in `sessionStorage`, so
 * a follow-up ("which one works with just video?") resolves against what was
 * being discussed and a page navigation does not wipe the thread — and so that
 * closing the tab ends it. Nothing is kept across sessions, and the window sent
 * back as context is capped at HISTORY_TURNS.
 *
 * WHAT IS SENT, AND WHERE. When a hosted endpoint is configured, a question,
 * the route, the page title, that short window and the ids of the records
 * retrieval chose go to the Ask GaitAI Worker (worker/), which calls a hosted
 * model on the visitor's behalf. Nothing about the visitor travels with it —
 * no identifier, no storage, no DOM — and the Worker keeps no transcript. The
 * panel's footer says so, and asks people not to type sensitive personal or
 * patient information for exactly this reason. With no endpoint configured,
 * nothing leaves the tab.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { HISTORY_TURNS, MAX_MESSAGE_LENGTH } from "./config";
import { ask as askEngine, warmCorpus } from "@/lib/ask/engine";
import type { PageContext } from "./page-context";

export interface SourceLink {
  title: string;
  url: string;
  kind: string;
}

export interface Turn {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: SourceLink[];
  suggestions?: string[];
  cta?: { label: string; href: string };
  /** Which layer wrote the prose: the hosted model, or the records themselves. */
  mode?: "model" | "retrieval";
  /** Set when nothing could answer — the panel renders a recovery. */
  failed?: "upstream" | "rate_limited" | "network" | "declined" | "timeout";
  retryAfter?: number;
}

const STORAGE_KEY = "gaitai:ask:thread";

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function readStored(): Turn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Turn[]).slice(-HISTORY_TURNS) : [];
  } catch {
    return [];
  }
}

function persist(turns: Turn[]) {
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(turns.slice(-HISTORY_TURNS)),
    );
  } catch {
    /* Private mode, or storage full. The thread still works in memory. */
  }
}

export interface AssistantState {
  turns: Turn[];
  pending: boolean;
  ask: (question: string) => void;
  retry: () => void;
  reset: () => void;
}

export function useAssistant(page: PageContext): AssistantState {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastQuestion = useRef("");
  /* The page context is read at send time, not at render time, so a question
     asked after navigating carries the route the visitor is actually on. */
  const pageRef = useRef(page);
  pageRef.current = page;

  useEffect(() => {
    setTurns(readStored());
    return () => abortRef.current?.abort();
  }, []);

  const finish = useCallback((updater: (previous: Turn[]) => Turn[]) => {
    setTurns((previous) => {
      const next = updater(previous);
      persist(next);
      return next;
    });
  }, []);

  const ask = useCallback(
    (rawQuestion: string) => {
      const question = rawQuestion.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!question || pending) return;

      lastQuestion.current = question;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const answerId = newId();
      /* Both turns are appended up front: the question must appear instantly,
         and the empty assistant turn is what the indicator attaches to. */
      const history = turns
        .filter((turn) => !turn.failed && turn.text)
        .slice(-HISTORY_TURNS)
        .map((turn) => ({ role: turn.role, content: turn.text }));

      setTurns((previous) => [
        ...previous,
        { id: newId(), role: "user", text: question },
        { id: answerId, role: "assistant", text: "" },
      ]);
      setPending(true);

      const patch = (changes: Partial<Turn>) =>
        finish((previous) =>
          previous.map((turn) =>
            turn.id === answerId ? { ...turn, ...changes } : turn,
          ),
        );

      void (async () => {
        try {
          /* The corpus is normally already warm — the panel fetches it on
             open — but a question can beat that, so this is awaited rather
             than assumed. */
          await warmCorpus();

          const answer = await askEngine({
            question,
            pathname: pageRef.current.pathname,
            pageTitle: pageRef.current.title,
            turnIndex: turns.filter((t) => t.role === "user").length,
            history,
            signal: controller.signal,
          });

          if (controller.signal.aborted) return;

          /* One patch, not a stream of deltas: the answer arrives whole from
             the function, and a fake typewriter over a complete string would
             be a decoration pretending to be a stream. */
          patch({
            text: answer.text,
            sources: answer.sources,
            suggestions: answer.suggestions,
            cta: answer.cta,
            mode: answer.mode,
          });
        } catch (error) {
          if ((error as Error)?.name === "AbortError") return;
          /* The engine falls back to records internally, so reaching here
             means retrieval itself failed — the corpus did not load. */
          patch({ failed: "network" });
        } finally {
          setPending(false);
        }
      })();
    },
    [finish, pending, turns],
  );

  const retry = useCallback(() => {
    if (!lastQuestion.current) return;
    /* Drop the failed exchange rather than stacking a second copy of the
       question under the first. */
    setTurns((previous) => previous.slice(0, -2));
    const question = lastQuestion.current;
    window.setTimeout(() => ask(question), 0);
  }, [ask]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    lastQuestion.current = "";
    setPending(false);
    setTurns([]);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clear */
    }
  }, []);

  return { turns, pending, ask, retry, reset };
}
