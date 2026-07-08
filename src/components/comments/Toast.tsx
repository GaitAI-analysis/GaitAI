"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info";
export interface ToastMessage {
  id: number;
  tone: ToastTone;
  text: string;
}

let counter = 0;

/** Tiny self-contained toast stack — no provider needed. */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((tone: ToastTone, text: string) => {
    const id = ++counter;
    setToasts((t) => [...t, { id, tone, text }]);
    return id;
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return { toasts, notify, dismiss };
}

const toneMeta: Record<
  ToastTone,
  { icon: typeof CheckCircle2; cls: string }
> = {
  success: {
    icon: CheckCircle2,
    cls: "text-emerald-300 ring-emerald-300/30 bg-emerald-300/[0.08]",
  },
  error: {
    icon: AlertTriangle,
    cls: "text-rose-300 ring-rose-300/30 bg-rose-300/[0.08]",
  },
  info: { icon: Info, cls: "text-cyan-300 ring-cyan-300/30 bg-cyan-300/[0.08]" },
};

export function ToastViewport({
  toasts,
  dismiss,
}: {
  toasts: ToastMessage[];
  dismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} dismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({
  toast,
  dismiss,
}: {
  toast: ToastMessage;
  dismiss: (id: number) => void;
}) {
  const { icon: Icon, cls } = toneMeta[toast.tone];

  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), 4200);
    return () => clearTimeout(t);
  }, [toast.id, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="card pointer-events-auto flex max-w-sm items-start gap-3 px-4 py-3 shadow-card"
    >
      <span
        className={cn(
          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1",
          cls
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="flex-1 text-sm leading-relaxed text-soft-gray">
        {toast.text}
      </p>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="text-soft-mute transition-colors hover:text-soft-white"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
