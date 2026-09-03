"use client";

/**
 * GaitAI Admin Control Panel — /admin-controlpanel
 *
 * Single place to manage everything shown on the public Journal and
 * Publications pages: content (posts / blogs) and community moderation
 * (comments: hide / delete, plus reader reports).
 *
 * Access is gated by Google sign-in against the moderator allowlist
 * (AdminAuthGate). Data is live Firestore via src/lib/admin/panel-store.ts.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  FileText,
  LayoutDashboard,
  MessageSquareText,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import {
  getAdapter,
  type CommentDoc,
  type Post,
  type ReportDoc,
} from "@/lib/admin/panel-store";
import { ToastProvider, useToast } from "./ui";
import { AdminAuthGate } from "./AdminAuthGate";
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
      sub: "Journal & publications",
    },
    {
      id: "comments",
      label: "Comments",
      icon: <MessageSquareText className="h-4 w-4" />,
      sub: "Hide & delete",
    },
  ];

export function ControlPanel() {
  return (
    <ToastProvider>
      <AdminAuthGate>
        {() => <PanelInner />}
      </AdminAuthGate>
    </ToastProvider>
  );
}

function PanelInner() {
  const toast = useToast();
  const adapter = useMemo(() => getAdapter(), []);

  const [tab, setTab] = useState<PanelTab>("overview");
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [reports, setReports] = useState<ReportDoc[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [p, c, rep] = await Promise.all([
        adapter.loadPosts(),
        adapter.loadComments(),
        adapter.loadReports(),
      ]);
      setPosts(p);
      setComments(c);
      setReports(rep);
    } catch {
      toast("error", "Couldn't reach Firestore. Check your connection & rules.");
    } finally {
      setHydrated(true);
    }
  }, [adapter, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /* ---- actions ---------------------------------------------------------- */

  const savePost = async (post: Post) => {
    try {
      setPosts(await adapter.savePost(post));
      toast(
        "success",
        post.publicationStatus === "verified"
          ? "Post saved and verified for public display."
          : "Draft saved to Firestore.",
      );
      return true;
    } catch {
      toast("error", "Save failed. Are you still signed in as an admin?");
      return false;
    }
  };

  const deletePost = async (id: string) => {
    try {
      setPosts(await adapter.deletePost(id));
      toast("info", "Post deleted.");
    } catch {
      toast("error", "Delete failed.");
    }
  };

  const toggleHidden = async (id: string, hidden: boolean) => {
    try {
      setComments(await adapter.setCommentHidden(id, hidden));
      toast(
        hidden ? "info" : "success",
        hidden
          ? "Comment hidden from the site."
          : "Comment restored — visible again.",
      );
    } catch {
      toast("error", hidden ? "Hide failed." : "Restore failed.");
    }
  };

  const deleteComment = async (id: string) => {
    try {
      setComments(await adapter.deleteComment(id));
      toast("info", "Comment deleted permanently.");
    } catch {
      toast("error", "Delete failed.");
    }
  };

  const resolveReport = async (id: string) => {
    try {
      setReports(await adapter.resolveReport(id));
      toast("success", "Report resolved.");
    } catch {
      toast("error", "Resolve failed.");
    }
  };

  return (
    <div className="site-viewport-section relative w-full">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(34,211,238,0.07),transparent_70%)]"
      />

      <div className="site-admin-intro container-wide relative pb-24">
        {/* ---- Top bar ------------------------------------------------------ */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="sr-only">GaitAI Control Panel</h1>
          <div className="flex items-center gap-3">
            <Logo />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300 ring-1 ring-cyan-300/30">
              Control Panel
            </span>
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 ring-1 ring-emerald-400/25 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live · Firestore
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/insights"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-soft-white ring-1 ring-white/10 transition-all hover:bg-white/[0.08]"
            >
              View site
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </header>

        {/* ---- Shell: sidebar + active view --------------------------------- */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
          {/* Sidebar */}
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1.5">
            {NAV.map((item) => {
              const active = tab === item.id;
              // Only surface things that actually need attention.
              const badge = item.id === "comments" ? reports.length : 0;
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
                    comments={comments}
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
                    comments={comments}
                    reports={reports}
                    onToggleHidden={toggleHidden}
                    onDelete={deleteComment}
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
