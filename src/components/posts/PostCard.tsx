"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, FileText, Calendar, Paperclip } from "lucide-react";
import { Post } from "@/lib/posts";
import { CategoryBadge, categoryGradient } from "./CategoryBadge";

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

export function PostCard({
  post,
  index = 0,
  featured = false,
}: {
  post: Post;
  index?: number;
  featured?: boolean;
}) {
  if (featured) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="card-glow group relative overflow-hidden p-0"
      >
        <Link
          href={`/publications/${post.slug}`}
          className="grid items-stretch md:grid-cols-[1.05fr_1fr]"
        >
          <div
            className="relative min-h-[260px] overflow-hidden md:min-h-[420px]"
            style={{ backgroundImage: categoryGradient[post.category] }}
          >
            <div className="ring-grid absolute inset-0 opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-tr from-obsidian/70 via-transparent to-transparent" />
            <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              Featured
            </div>
            {post.attachmentUrl && (
              <div className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[11px] text-soft-white backdrop-blur-md">
                <Paperclip className="h-3 w-3" />
                PDF
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between gap-8 p-8 sm:p-10">
            <div>
              <div className="flex items-center gap-3">
                <CategoryBadge category={post.category} size="md" />
                <span className="inline-flex items-center gap-1.5 text-xs text-soft-mute">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.publishedAt)}
                </span>
              </div>
              <h3 className="mt-5 font-display text-display-md text-soft-white">
                {post.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-soft-gray">
                {post.summary}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-soft-mute">{post.author}</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-300 transition-transform group-hover:translate-x-1">
                Read publication <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.6,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="card-glow group relative flex h-full flex-col overflow-hidden p-0"
    >
      <Link href={`/publications/${post.slug}`} className="flex h-full flex-col">
        <div
          className="relative h-44 overflow-hidden"
          style={{ backgroundImage: categoryGradient[post.category] }}
        >
          <div className="ring-grid absolute inset-0 opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 to-transparent" />
          <div className="absolute left-4 top-4">
            <CategoryBadge category={post.category} />
          </div>
          {post.attachmentUrl && (
            <div className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-soft-white backdrop-blur-md">
              <FileText className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="font-display text-lg leading-snug text-soft-white transition-colors group-hover:text-cyan-300">
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-soft-mute">
            {post.summary}
          </p>
          <div className="mt-6 flex items-center justify-between text-xs text-soft-mute">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-1 text-cyan-300 transition-transform group-hover:translate-x-1">
              Read <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
