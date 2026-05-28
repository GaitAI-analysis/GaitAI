"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Calendar,
  ExternalLink,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { Post } from "@/lib/posts";
import { Logo } from "@/components/ui/Logo";
import { CategoryBadge } from "@/components/posts/CategoryBadge";
import { PostEditor } from "./PostEditor";

type Mode = { view: "list" } | { view: "editor"; post?: Post };

function formatDate(iso: string) {
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

export function AdminDashboard({ initialPosts }: { initialPosts: Post[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [mode, setMode] = useState<Mode>({ view: "list" });
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.toLowerCase();
    return posts.filter((p) =>
      `${p.title} ${p.summary} ${p.category} ${p.tags.join(" ")}`
        .toLowerCase()
        .includes(q)
    );
  }, [posts, query]);

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.refresh();
  };

  const handleSaved = (saved: Post) => {
    setPosts((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx === -1) return [saved, ...prev];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
    setMode({ view: "list" });
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  return (
    <section className="relative min-h-screen w-full pt-28">
      {/* Admin top bar */}
      <div className="container-wide flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300 ring-1 ring-cyan-300/30">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/publications"
            className="hidden items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-soft-white ring-1 ring-white/10 transition-all hover:bg-white/[0.08] sm:inline-flex"
          >
            View site
            <ArrowUpRight className="h-3 w-3" />
          </Link>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-soft-white ring-1 ring-white/10 transition-all hover:bg-white/[0.08]"
          >
            <LogOut className="h-3 w-3" />
            Sign out
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode.view === "editor" ? (
          <PostEditor
            key="editor"
            initial={mode.post}
            onCancel={() => setMode({ view: "list" })}
            onSaved={handleSaved}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35 }}
            className="container-wide pb-20"
          >
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-display text-3xl text-soft-white sm:text-4xl">
                  Publications
                </h1>
                <p className="mt-1 text-sm text-soft-mute">
                  Create, edit and remove everything shown on the public
                  publications page.
                </p>
              </div>
              <button
                onClick={() => setMode({ view: "editor" })}
                className="btn-primary self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                New publication
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative inline-flex w-full max-w-sm items-center">
                <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-soft-mute" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search publications…"
                  className="w-full rounded-full border border-white/10 bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
                />
              </label>
              <div className="text-xs text-soft-mute">
                {filtered.length} of {posts.length} publications
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-white/8">
              {filtered.length === 0 ? (
                <div className="grid place-items-center px-6 py-20 text-center">
                  <p className="font-display text-xl text-soft-white">
                    Nothing here yet
                  </p>
                  <p className="mt-1 text-sm text-soft-mute">
                    Click <span className="text-soft-white">New publication</span> to
                    publish your first one.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {filtered.map((p) => (
                    <li
                      key={p.id}
                      className="group grid grid-cols-1 gap-3 bg-white/[0.01] p-4 transition-colors hover:bg-white/[0.03] sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6 sm:px-6 sm:py-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CategoryBadge category={p.category} />
                          {p.featured && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/[0.08] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-300 ring-1 ring-amber-300/30">
                              <Star className="h-2.5 w-2.5" />
                              Featured
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] text-soft-mute">
                            <Calendar className="h-3 w-3" />
                            {formatDate(p.publishedAt)}
                          </span>
                          <span className="text-[11px] text-soft-mute">·</span>
                          <span className="text-[11px] text-soft-mute">
                            {p.author}
                          </span>
                        </div>
                        <h3 className="mt-2 truncate font-display text-lg text-soft-white">
                          {p.title}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-sm text-soft-mute">
                          {p.summary}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-soft-mute">
                        <Link
                          href={`/publications/${p.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1.5 hover:border-white/20 hover:text-soft-white"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMode({ view: "editor", post: p })}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-soft-white hover:border-cyan-300/40 hover:text-cyan-300"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete(p.id)}
                          disabled={deleting === p.id}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-soft-white hover:border-red-300/40 hover:text-red-300 disabled:opacity-50"
                        >
                          {deleting === p.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-obsidian/80 px-5 backdrop-blur-md"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="card relative w-full max-w-md overflow-hidden p-6"
            >
              <h4 className="font-display text-xl text-soft-white">
                Delete this publication?
              </h4>
              <p className="mt-2 text-sm text-soft-mute">
                This will remove it from the public site immediately. This
                action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs text-soft-mute hover:border-white/20 hover:text-soft-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDelete && handleDelete(confirmDelete)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-500/90 px-4 py-2 text-xs font-medium text-white hover:bg-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete publication
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
