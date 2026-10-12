"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { WikiSearchEntry } from "@/data/wiki";
import { searchWiki, wikiSearchArea, wikiSearchExcerpt } from "@/lib/wiki-search";
import styles from "./wiki.module.css";

const topics = ["Architecture", "Android", "Authentication", "Storage", "Deployment"];
const areaNames: Record<string, string> = { web: "Web", android: "Android", backend: "Backend", foundation: "Foundation" };

function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.trim().split(/\s+/).filter(Boolean).map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!words.length) return <>{text}</>;
  return <>{text.split(new RegExp("(" + words.join("|") + ")", "gi")).map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : part)}</>;
}

export function WikiSearch({ entries }: { entries: WikiSearchEntry[] }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const hasQuery = Boolean(query.trim());
  const results = useMemo(() => searchWiki(entries, query), [entries, query]);
  const close = () => { input.current?.focus(); setQuery(""); setExpanded(false); };
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setExpanded(false); };
    window.addEventListener("pointerdown", outside);
    return () => window.removeEventListener("pointerdown", outside);
  }, []);
  return <div ref={container} className={styles.search} role="search" aria-label="Wiki search" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false); }} onKeyDown={(event) => {
    if (event.key === "Escape") { event.stopPropagation(); close(); }
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
    <Search className={styles.searchIcon} size={18} aria-hidden="true" />
    <input ref={input} id="wiki-search" type="search" autoComplete="off" spellCheck={false} placeholder="Search the documentation…" value={query} maxLength={160} onFocus={() => setExpanded(true)} onChange={(event) => { setQuery(event.target.value); setExpanded(true); }} aria-describedby="wiki-search-status" aria-controls={expanded ? "wiki-search-results" : undefined} />
    {query && <button className={styles.searchClear} type="button" aria-label="Clear Wiki search" onClick={() => { setQuery(""); input.current?.focus(); }}><X size={16} aria-hidden="true" /></button>}
    <span id="wiki-search-status" className={styles.srOnly} role="status">{hasQuery ? results.length + (results.length === 10 ? " top" : "") + " results. Use Tab or Down Arrow to browse; Enter to open; Escape to close." : "Search titles and article content across Web, Android and Backend."}</span>
    {expanded && <div id="wiki-search-results" className={styles.searchResults}>
      <div className={styles.resultLabel}><span>{hasQuery ? results.length ? (results.length === 10 ? "Top " : "") + results.length + " results" : "No matching pages" : "Explore the documentation"}</span><button type="button" onClick={close} aria-label="Close Wiki search results">Close <X size={16} aria-hidden="true" /></button></div>
      {!hasQuery && <div className={styles.searchIntro}><p>Find a guide, a technology or an architectural decision.</p><div className={styles.searchTopics}>{topics.map((topic) => <button type="button" key={topic} onClick={() => { setQuery(topic); input.current?.focus(); }}>{topic}</button>)}</div></div>}
      {hasQuery && !results.length && <div className={styles.searchIntro}><p>No results for <strong>“{query}”</strong>. Try a shorter phrase, a platform or a technology name.</p><div className={styles.searchTopics}>{topics.slice(1, 4).map((topic) => <button type="button" key={topic} onClick={() => { setQuery(topic); input.current?.focus(); }}>{topic}</button>)}</div></div>}
      {results.length > 0 && <ul ref={resultsRef}>{results.map((entry) => <li key={entry.href}><Link href={entry.href} onClick={() => { setQuery(""); setExpanded(false); }}><small>{entry.product}<span aria-hidden="true"> / </span>{areaNames[wikiSearchArea(entry)]}<span aria-hidden="true"> / </span>{entry.section}</small><strong><Highlight text={entry.title} query={query} /></strong><span><Highlight text={wikiSearchExcerpt(entry.text, query)} query={query} /></span></Link></li>)}</ul>}
      <div className={styles.searchHelp}><span>Web · Android · Shared backend · Foundation</span><span><kbd>↑</kbd><kbd>↓</kbd> Browse <kbd>↵</kbd> Open <kbd>Esc</kbd> Close</span></div>
    </div>}
  </div>;
}
