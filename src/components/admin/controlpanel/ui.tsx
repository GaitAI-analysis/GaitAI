"use client";

/* Shared UI primitives for the control panel — kept tiny and consistent with
 * the site's design tokens (soft-white / soft-mute / cyan accents, card). */

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, Trash2, XCircle } from "lucide-react";

/* ------------------------------------------------------------- StatCard --- */

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "cyan",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "cyan" | "amber" | "violet" | "emerald";
}) {
  const tones: Record<string, string> = {
    cyan: "text-cyan-300 bg-cyan-300/[0.08] ring-cyan-300/25",
    amber: "text-amber-300 bg-amber-300/[0.08] ring-amber-300/25",
    violet: "text-violet-300 bg-violet-300/[0.08] ring-violet-300/25",
    emerald: "text-emerald-300 bg-emerald-300/[0.08] ring-emerald-300/25",
  };
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-soft-mute">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl text-soft-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-soft-mute">{hint}</p>}
        </div>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${tones[tone]}`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ EmptyState -- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] px-6 py-16 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.04] text-soft-mute ring-1 ring-white/10">
        {icon}
      </span>
      <p className="mt-4 font-display text-lg text-soft-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-soft-mute">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------- ConfirmDialog -- */

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] grid place-items-center bg-obsidian/80 px-5 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-md p-6"
          >
            <h4 className="font-display text-xl text-soft-white">{title}</h4>
            <p className="mt-2 text-sm text-soft-mute">{body}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-full border border-white/10 px-4 py-2 text-xs text-soft-mute hover:border-white/20 hover:text-soft-white"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-500/90 px-4 py-2 text-xs font-medium text-white hover:bg-red-500"
              >
                <Trash2 className="h-3 w-3" />
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ----------------------------------------------------------------- Toast -- */

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

const ToastCtx = createContext<(kind: ToastKind, text: string) => void>(
  () => {}
);

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      3800
    );
  }, []);

  const icons: Record<ToastKind, React.ReactNode> = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-300" />,
    error: <XCircle className="h-4 w-4 text-red-300" />,
    info: <Info className="h-4 w-4 text-cyan-300" />,
  };

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[80] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              className="card pointer-events-auto flex max-w-sm items-center gap-2.5 px-4 py-3 text-sm text-soft-white shadow-2xl"
            >
              {icons[t.kind]}
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* --------------------------------------------------------------- helpers -- */

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - +new Date(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}
