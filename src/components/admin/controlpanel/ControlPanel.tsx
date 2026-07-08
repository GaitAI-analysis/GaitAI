"use client";

/**
 * GaitAI Admin Control Panel — /admin-controlpanel
 *
 * Single place to manage everything shown on the public Insights and
 * Publications pages: content (posts / blogs) and community moderation
 * (pending comments + reports).
 *
 * Auth is intentionally disabled for now (see the "Open access" chip).
 * Data flows through src/lib/admin/panel-store.ts — the single seam where
 * Firebase gets wired in later.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Database,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  RefreshCcw,
  ShieldOff,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import {
  getAdapter,
  resetLocalData,
  type CommentDoc,
  type Post,
  type ReportDoc,
} from "@/lib/admin/panel-store";
import { ToastProvider, useToast } from "./ui";
import { OverviewView } from "./OverviewView";
import { ContentView } from "./ContentView";
import { CommentsView } from "./CommentsView";

export type PanelTab = "overview" | "content" | "comments";

const NAV: { id: PanelTab; label: string; icon: React.ReactNode; sub: string }[] =
  [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboard className="h-4 w-4" />,
      sub: "Pulse of the site",
    },
    {
      id: "content",
      label: "Content Studio",
      icon: <FileText className="h-4 w-4" />,
      sub: "Insights & publications",
    },
    {
      id: "comments",
      label: "Comments",
      icon: <MessageSquareText className="h-4 w-4" />,
      sub: "Moderation queue",
    },
  ];

export function ControlPanel() {
  return (
    <ToastProvider>
      <PanelInner />
    </ToastProvider>
  );
}

function PanelInner() {
  const toast = useToast();
  const adapter = useMemo(() => getAdapter(), []);

  const [tab, setTab] = useState<PanelTab>("overview");
  const [posts, setPosts] = useState<Post[]>([]);
  const [pending, setPending] = useState<CommentDoc[]>([]);
  const [reports, setReports] = useState<ReportDoc[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from the adapter on the client only (localStorage-backed today).
  useEffect(() => {
    setPosts(adapter.loadPosts());
    setPending(adapter.loadPending());
    setReports(adapter.loadReports());
    setHydrated(true);
  }, [adapter]);

  /* ---- actions (thin pass-throughs to the adapter) ---------------------- */

  const savePost = (post: Post) => {
    setPosts(adapter.savePost(post));
    toast("success", "Post saved — live on the local dataset.");
  };

  const deletePost = (id: string) => {
    setPosts(adapter.deletePost(id));
    toast("info", "Post deleted.");
  };

  const approveComment = (id: string) => {
    setPending(adapter.approveComment(id).pending);
    toast("success", "Comment approved.");
  };

  const rejectComment = (id: string) => {
    setPending(adapter.rejectComment(id).pending);
    toast("info", "Comment rejected.");
  };

  const resolveReport = (id: string) => {
    setReports(adapter.resolveReport(id));
    toast("success", "Report resolved.");
  };

  const resetData = () => {
    resetLocalData();
    setPosts(adapter.loadPosts());
    setPending(adapter.loadPending());
    setReports(adapter.loadReports());
    toast("info", "Local sample data reset.");
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Ambient background glow, matching the site's hero treatment */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(34,211,238,0.07),transparent_70%)]"
      />

      <div className="container-wide relative pb-24 pt-24 lg:pt-28">
        {/* ---- Top bar ------------------------------------------------------ */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300 ring-1 ring-cyan-300/30">
              Control Panel
            </span>
            <span
              title="Authentication is temporarily disabled on this route."
              className="hidden items-center gap-1.5 rounded-full bg-amber-300/[0.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300 ring-1 ring-amber-300/25 sm:inline-flex"
            >
              <ShieldOff className="h-3 w-3" />
              Open access
            </span>
          </div>
          <div className="flex items-center gap-2">
            {adapter.isLocal && (
              <button
                onClick={resetData}
                title="Reset the local sample dataset"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-soft-mute ring-1 ring-white/10 transition-all hover:bg-white/[0.08] hover:text-soft-white"
              >
                <RefreshCcw className="h-3 w-3" />
                Reset data
              </button>
            )}
            <Link
              href="/insights"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-soft-white ring-1 ring-white/10 transition-all hover:bg-white/[0.08]"
            >
              View site
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </header>

        {/* ---- Local-data notice -------------------------------------------- */}
        {adapter.isLocal && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] px-4 py-3 text-xs leading-relaxed text-soft-gray">
            <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
            <span>
              Running on <span className="text-soft-white">local sample data</span>{" "}
              — changes persist in this browser only. Once Firebase is wired into{" "}
              <code className="rounded bg-white/[0.06] px-1 py-0.5 text-[11px]">
                panel-store.ts
              </code>
              , everything here drives the live Insights &amp; Publications pages.
            </span>
          </div>
        )}

        {/* ---- Shell: sidebar + active view --------------------------------- */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
          {/* Sidebar */}
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1.5">
            {NAV.map((item) => {
              const active = tab === item.id;
              const badge =
                item.id === "comments" ? pending.length + reports.length : 0;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`group relative flex min-w-[170px] items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all lg:min-w-0 ${
                    active
                      ? "border-cyan-300/30 bg-cyan-300/[0.06]"
                      : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 transition-colors ${
                      active
                        ? "bg-cyan-300/10 text-cyan-300 ring-cyan-300/30"
                        : "bg-white/[0.04] text-soft-mute ring-white/10 group-hover:text-soft-white"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-medium ${
                        active ? "text-soft-white" : "text-soft-gray"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="block truncate text-[11px] text-soft-mute">
                      {item.sub}
                    </span>
                  </span>
                  {badge > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-300/15 px-1.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-300/30">
                      {badge}
                    </span>
                  )}
                  {active && (
                    <motion.span
                      layoutId="cp-active"
                      className="absolute inset-y-2 left-0 hidden w-[3px] rounded-full bg-cyan-300 lg:block"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Active view */}
          <main className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {!hydrated ? (
                  <PanelSkeleton />
                ) : tab === "overview" ? (
                  <OverviewView
                    posts={posts}
                    pending={pending}
                    reports={reports}
                    onNavigate={setTab}
                  />
                ) : tab === "content" ? (
                  <ContentView
                    posts={posts}
                    onSave={savePost}
                    onDelete={deletePost}
                  />
                ) : (
                  <CommentsView
                    pending={pending}
                    reports={reports}
                    onApprove={approveComment}
                    onReject={rejectComment}
                    onResolve={resolveReport}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-28 animate-pulse bg-white/[0.02]" />
        ))}
      </div>
      <div className="card h-72 animate-pulse bg-white/[0.02]" />
    </div>
  );
}
