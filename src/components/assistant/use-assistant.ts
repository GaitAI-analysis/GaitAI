"use client";

/**
 * THE CONVERSATION
 * =============================================================================
 * State, streaming and session memory for Ask GaitAI.
 *
 * MEMORY IS DELIBERATELY SHORT. The last few turns live in `sessionStorage`, so
 * a follow-up ("which one works with just video?") resolves against what was
 * being discussed and a page navigation does not wipe the thread — and so that
 * closing the tab ends it. Nothing is written to a server, nothing is kept
 * across sessions, and the window sent back is capped at four exchanges.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ASK_ENDPOINT, MAX_MESSAGE_LENGTH } from "./config";
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
  /** Set when the backend could not answer — the panel renders a recovery. */
  failed?: "upstream" | "rate_limited" | "network" | "declined" | "timeout";
  retryAfter?: number;
}

const STORAGE_KEY = "gaitai:ask:thread";
/** Exchanges kept in the browser and sent back as context. */
const MEMORY_TURNS = 8;

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function readStored(): Turn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Turn[]).slice(-MEMORY_TURNS) : [];
  } catch {
    return [];
  }
}

function persist(turns: Turn[]) {
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(turns.slice(-MEMORY_TURNS)),
    );
  } catch {
    /* Private mode, or storage full. The thread still works in memory. */
  }
}

export interface AssistantState {
  turns: Turn[];
  pending: boolean;
  /** True once the first token has arrived — the indicator gives way to text. */
  streaming: boolean;
  ask: (question: string) => void;
  retry: () => void;
  reset: () => void;
}

export function useAssistant(page: PageContext): AssistantState {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [streaming, setStreaming] = useState(false);
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
      if (!question || pending || !ASK_ENDPOINT) return;

      lastQuestion.current = question;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const answerId = newId();
      /* Both turns are appended up front: the question must appear instantly,
         and the empty assistant turn is what the indicator attaches to. */
      const history = turns
        .filter((turn) => !turn.failed && turn.text)
        .slice(-MEMORY_TURNS)
        .map((turn) => ({ role: turn.role, content: turn.text }));

      setTurns((previous) => [
        ...previous,
        { id: newId(), role: "user", text: question },
        { id: answerId, role: "assistant", text: "" },
      ]);
      setPending(true);
      setStreaming(false);

      const patch = (changes: Partial<Turn>) =>
        finish((previous) =>
          previous.map((turn) =>
            turn.id === answerId ? { ...turn, ...changes } : turn,
          ),
        );

      const append = (text: string) =>
        setTurns((previous) =>
          previous.map((turn) =>
            turn.id === answerId ? { ...turn, text: turn.text + text } : turn,
          ),
        );

      void (async () => {
        try {
          const response = await fetch(ASK_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              message: question,
              pathname: pageRef.current.pathname,
              pageTitle: pageRef.current.title,
              history,
            }),
          });

          if (!response.ok || !response.body) {
            const retryAfter = Number(response.headers.get("Retry-After")) || 0;
            patch({
              failed: response.status === 429 ? "rate_limited" : "upstream",
              retryAfter,
            });
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          /* Minimal SSE reader. `event:` then `data:` then a blank line; the
             buffer holds whatever a chunk boundary split in half. */
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let boundary = buffer.indexOf("\n\n");
            while (boundary !== -1) {
              const frame = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);
              boundary = buffer.indexOf("\n\n");

              const eventLine = frame.match(/^event:\s*(.+)$/m)?.[1]?.trim();
              const dataLine = frame.match(/^data:\s*([\s\S]+)$/m)?.[1];
              if (!eventLine || !dataLine) continue;

              let payload: unknown;
              try {
                payload = JSON.parse(dataLine);
              } catch {
                continue;
              }

              switch (eventLine) {
                case "delta":
                  setStreaming(true);
                  append((payload as { text: string }).text);
                  break;
                case "replace":
                  /* The server found and removed a link that was not a real
                     GaitAI route; take its corrected text over what streamed. */
                  patch({ text: (payload as { text: string }).text });
                  break;
                case "sources":
                  patch({ sources: payload as SourceLink[] });
                  break;
                case "suggestions":
                  patch({ suggestions: payload as string[] });
                  break;
                case "cta":
                  patch({ cta: payload as { label: string; href: string } });
                  break;
                case "error":
                  patch({
                    failed: ((payload as { code?: string }).code ??
                      "upstream") as Turn["failed"],
                  });
                  break;
                default:
                  break;
              }
            }
          }

          /* A stream that closed without producing anything is a failure, not
             an empty answer. */
          setTurns((previous) => {
            const next = previous.map((turn) =>
              turn.id === answerId && !turn.text && !turn.failed
                ? { ...turn, failed: "upstream" as const }
                : turn,
            );
            persist(next);
            return next;
          });
        } catch (error) {
          if ((error as Error)?.name === "AbortError") return;
          patch({ failed: "network" });
        } finally {
          setPending(false);
          setStreaming(false);
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
    setStreaming(false);
    setTurns([]);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clear */
    }
  }, []);

  return { turns, pending, streaming, ask, retry, reset };
}
