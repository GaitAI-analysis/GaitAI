"use client";

/**
 * THE CONVERSATION
 * =============================================================================
 * State, streaming and session memory for Ask GaitAI.
 *
 * MEMORY IS DELIBERATELY SHORT. The last few turns live in `sessionStorage`, so
 * a follow-up ("which one works with just video?") resolves against what was
 * being discussed and a page navigation does not wipe the thread — and so that
 * closing the tab ends it. Nothing is kept across sessions, and the window fed
 * back into retrieval is capped at four exchanges.
 *
 * NOTHING IS WRITTEN TO A SERVER, AND NOW NOTHING IS SENT TO ONE EITHER.
 * This used to POST the question to a Cloud Function which called a hosted
 * model. Retrieval and generation both run in this tab now — see
 * `lib/ask/engine.ts` — so a question never leaves the browser. That is why
 * the panel is allowed to say so.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_MESSAGE_LENGTH } from "./config";
import { ask as askEngine, warmCorpus } from "@/lib/ask/engine";
import {
  DEFAULT_MODEL,
  MODELS,
  detectWebGPU,
  loadModel,
  modelReady,
  type ModelStatus,
} from "@/lib/ask/model";
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
  /** Which layer wrote the prose: the local model, or the records themselves. */
  mode?: "model" | "retrieval";
  /** Set when nothing could answer — the panel renders a recovery. */
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
  /** The local model's state, for the panel's preparation strip. */
  model: ModelStatus;
  /** The model's download size in bytes, so the offer can state it. */
  modelBytes: number;
  /** Begin the download. Nothing happens until the visitor asks for it. */
  enableModel: () => void;
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

  /* ── The local model ──────────────────────────────────────────────────────
     Not downloaded on open. The weights are ~1.1 GiB (measured: see
     lib/ask/model.ts), which is a decision a visitor makes, not a side effect
     of pressing a launcher. Until they make it, retrieval answers on its own
     and `modelExpected` tells the composer not to promise a better answer
     that is not coming. */
  const [model, setModel] = useState<ModelStatus>({
    stage: "idle",
    progress: null,
    detail: "",
    device: null,
  });
  const modelExpectedRef = useRef(false);

  /* Probe WebGPU once. A browser without it can still run the model on the
     WASM backend, so this only changes what the offer says — never whether
     the offer exists. */
  useEffect(() => {
    let alive = true;
    void detectWebGPU().then((supported) => {
      if (!alive || modelReady()) return;
      setModel((current) =>
        current.stage === "idle"
          ? { ...current, device: supported ? "webgpu" : "wasm" }
          : current,
      );
    });
    return () => {
      alive = false;
    };
  }, []);

  const enableModel = useCallback(() => {
    if (modelReady() || modelExpectedRef.current) return;
    modelExpectedRef.current = true;
    void loadModel(DEFAULT_MODEL, setModel).catch(() => {
      /* loadModel has already reported "failed" through setModel, and the
         engine answers from records regardless. Nothing else to do. */
      modelExpectedRef.current = false;
    });
  }, []);

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
          /* The corpus is normally already warm — the panel fetches it on
             open — but a question can beat that, so this is awaited rather
             than assumed. */
          await warmCorpus();

          const answer = await askEngine({
            question,
            pathname: pageRef.current.pathname,
            pageTitle: pageRef.current.title,
            turnIndex: turns.filter((t) => t.role === "user").length,
            history: history.map((h) => h.content),
            modelExpected: modelExpectedRef.current,
            signal: controller.signal,
          });

          if (controller.signal.aborted) return;

          /* One patch, not a stream of deltas.
             Generation is local: there is no network latency to mask, and a
             fake typewriter over an already-complete string would be a
             decoration pretending to be a stream. The pending indicator does
             the waiting, and on the model path that wait is real. */
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

  return {
    turns,
    pending,
    streaming,
    ask,
    retry,
    reset,
    model,
    modelBytes: MODELS[DEFAULT_MODEL].bytes,
    enableModel,
  };
}
