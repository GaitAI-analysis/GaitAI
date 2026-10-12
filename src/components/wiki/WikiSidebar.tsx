"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, ChevronDown, PanelLeft } from "lucide-react";
import { WIKI_ROOT, wikiAreasFor, wikiPageHref, wikiProductHref, type WikiProduct } from "@/data/wiki";
import styles from "./wiki.module.css";

export function WikiSidebar({ product }: { product: WikiProduct }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const pathname = usePathname().replace(/\/$/, "");
  const areas = wikiAreasFor(product);
  const activeArea = areas.find((area) => pathname === `${wikiProductHref(product.slug)}${area.slug}` || pathname.startsWith(`${wikiProductHref(product.slug)}${area.slug}/`))?.slug ?? "overview";
  const navigation = [{ slug: "overview", name: "Foundation" }, ...areas];
  return <aside className={styles.sidebar} onKeyDown={(event) => { if (open && event.key === "Escape") { event.stopPropagation(); setOpen(false); toggle.current?.focus(); } }}>
    <button ref={toggle} className={styles.mobileToggle} aria-expanded={open} aria-controls="wiki-navigation" onClick={() => setOpen(!open)}><PanelLeft size={17} aria-hidden="true" /><span>Documentation navigation</span><ChevronDown size={17} aria-hidden="true" /></button>
    <nav id="wiki-navigation" aria-label={`${product.name} documentation`} className={`${styles.sideNav} ${open ? styles.sideNavOpen : ""}`}>
      <Link className={styles.backLink} href={`${WIKI_ROOT}/`}><ArrowLeft size={14} aria-hidden="true" /> All products</Link>
      <Link className={styles.sideTitle} href={wikiProductHref(product.slug)} onClick={() => setOpen(false)}>{product.name}<span>Documentation</span></Link>
      <Link className={styles.sideOverview} href={wikiProductHref(product.slug)} onClick={() => setOpen(false)} aria-current={pathname === wikiProductHref(product.slug).replace(/\/$/, "") ? "page" : undefined}>Documentation home</Link>
      {navigation.map((area) => {
        const pages = product.pages.filter((page) => page.area === area.slug);
        const groups = [...new Set(pages.map((page) => page.section))];
        return <details key={`${area.slug}-${activeArea}`} open={activeArea === area.slug} className={styles.navGroup}>
          <summary><span>{area.name}</span><small>{pages.length}</small><ChevronDown size={14} aria-hidden="true" /></summary>
          <div className={styles.navGroupContent}>{groups.map((group) => <div key={group}>
            {groups.length > 1 && <p className={styles.navSection}>{group}</p>}
            <ul>{pages.filter((page) => page.section === group).map((page) => {
              const href = wikiPageHref(product.slug, page.slug);
              return <li key={page.slug}><Link href={href} aria-current={pathname === href.replace(/\/$/, "") ? "page" : undefined} onClick={() => setOpen(false)}>{page.title}</Link></li>;
            })}</ul>
          </div>)}</div>
        </details>;
      })}
      <p className={styles.sideFoot}>Source-reviewed documentation<br /><time dateTime="2026-10-12">12 October 2026</time></p>
    </nav>
  </aside>;
}
