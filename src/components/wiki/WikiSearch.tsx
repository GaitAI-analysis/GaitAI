"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { WikiSearchEntry } from "@/data/wiki";
import styles from "./wiki.module.css";

export function WikiSearch({ entries }: { entries: WikiSearchEntry[] }) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
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
  return <div className={styles.search} role="search" aria-label="Wiki search" onKeyDown={(event) => {
    if (event.key === "Escape") { setQuery(""); input.current?.focus(); }
    if (event.key === "ArrowDown" && event.target === input.current) { event.preventDefault(); resultsRef.current?.querySelector("a")?.focus(); }
  }}>
    <label className={styles.srOnly} htmlFor="wiki-search">Search Wiki pages</label>
    <input ref={input} id="wiki-search" type="search" autoComplete="off" placeholder="Search the documentation…" value={query} maxLength={160} onChange={(event) => setQuery(event.target.value)} aria-describedby="wiki-search-status" />
    <span className={styles.searchHint} aria-hidden="true">WIKI SEARCH</span>
    <span id="wiki-search-status" className={styles.srOnly} role="status">{words.length ? `${results.length}${results.length === 10 ? " top" : ""} results. Use Tab or Down Arrow to browse.` : "Search titles and article content. Results stay on this website."}</span>
    {words.length > 0 && <div className={styles.searchResults}>
      <div className={styles.resultLabel}>{results.length ? `${results.length === 10 ? "Top " : ""}${results.length} results` : "No matching pages"}<button onClick={() => { setQuery(""); input.current?.focus(); }} aria-label="Close Wiki search results">Close</button></div>
      {!results.length && <p>Try a topic such as storage, Android, email or extraction.</p>}
      <ul ref={resultsRef}>{results.map((entry) => <li key={entry.href}><Link href={entry.href} onClick={() => setQuery("")}><small>{entry.product} / {entry.section}</small><strong>{entry.title}</strong><span>{entry.text.slice(0, 150)}{entry.text.length > 150 ? "…" : ""}</span></Link></li>)}</ul>
    </div>}
  </div>;
}
