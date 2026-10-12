"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { WikiSearchEntry } from "@/data/wiki";
import styles from "./wiki.module.css";

export function WikiSearch({ entries }: { entries: WikiSearchEntry[] }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return entries.map((entry) => {
      const title = `${entry.title} ${entry.product}`.toLowerCase();
      const text = `${title} ${entry.text}`.toLowerCase();
      return { entry, score: terms.every((term) => text.includes(term)) ? terms.reduce((n, term) => n + (title.includes(term) ? 4 : 1), 0) : 0 };
    }).filter((r) => r.score).sort((a, b) => b.score - a.score).slice(0, 10).map((r) => r.entry);
  }, [entries, query]);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setExpanded(false); };
    window.addEventListener("pointerdown", outside);
    return () => { window.removeEventListener("pointerdown", outside); };
  }, []);
  return <div ref={container} className={styles.search} role="search" aria-label="Wiki search" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false); }} onKeyDown={(event) => {
    if (event.key === "Escape") { event.stopPropagation(); setQuery(""); setExpanded(false); input.current?.focus(); }
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      const links = Array.from(resultsRef.current?.querySelectorAll("a") ?? []);
      if (!links.length) return;
      event.preventDefault();
      const current = links.indexOf(document.activeElement as HTMLAnchorElement);
      const next = event.key === "ArrowDown" ? current + 1 : current - 1;
      if (next < 0) input.current?.focus(); else links[Math.min(next, links.length - 1)]?.focus();
    }
  }}>
    <label className={styles.srOnly} htmlFor="wiki-search">Search Wiki pages</label>
    <Search className={styles.searchIcon} size={16} aria-hidden="true" />
    <input ref={input} id="wiki-search" type="search" autoComplete="off" placeholder="Search the documentation…" value={query} maxLength={160} onFocus={() => setExpanded(true)} onChange={(event) => { setQuery(event.target.value); setExpanded(true); }} aria-describedby="wiki-search-status" aria-controls={words.length > 0 && expanded ? "wiki-search-results" : undefined} />
    <span id="wiki-search-status" className={styles.srOnly} role="status">{words.length ? `${results.length}${results.length === 10 ? " top" : ""} results. Use Tab or Down Arrow to browse.` : "Search titles and article content. Results stay on this website."}</span>
    {words.length > 0 && expanded && <div id="wiki-search-results" className={styles.searchResults}>
      <div className={styles.resultLabel}>{results.length ? `${results.length === 10 ? "Top " : ""}${results.length} results` : "No matching pages"}<button onClick={() => { setQuery(""); input.current?.focus(); }} aria-label="Close Wiki search results">Close <X size={14} aria-hidden="true" /></button></div>
      {!results.length && <p>Try a topic such as storage, Android, email or extraction.</p>}
      <ul ref={resultsRef}>{results.map((entry) => <li key={entry.href}><Link href={entry.href} onClick={() => { setQuery(""); setExpanded(false); }}><small>{entry.product} / {entry.href.includes("/android/") ? "Android" : entry.href.includes("/web/") ? "Web" : entry.href.includes("/backend/") ? "Backend" : "Foundation"} / {entry.section}</small><strong>{entry.title}</strong><span>{entry.text.slice(0, 150)}{entry.text.length > 150 ? "…" : ""}</span></Link></li>)}</ul>
    </div>}
  </div>;
}
