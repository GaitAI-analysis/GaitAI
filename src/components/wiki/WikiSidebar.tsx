"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WIKI_ROOT, wikiAreasFor, wikiPageHref, wikiProductHref, type WikiProduct } from "@/data/wiki";
import styles from "./wiki.module.css";

export function WikiSidebar({ product }: { product: WikiProduct }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname().replace(/\/$/, "");
  const wikiAreas = wikiAreasFor(product);
  const area = wikiAreas.find((a) => pathname === `${wikiProductHref(product.slug)}${a.slug}` || pathname.startsWith(`${wikiProductHref(product.slug)}${a.slug}/`));
  const pages = product.pages.filter((p) => p.area === (area?.slug ?? "overview"));
  const groups = [...new Set(pages.map((page) => page.section))];
  return <aside className={styles.sidebar}>
    <button className={styles.mobileToggle} aria-expanded={open} aria-controls="wiki-navigation" onClick={() => setOpen(!open)}>Documentation navigation <span aria-hidden="true">{open ? "−" : "+"}</span></button>
    <nav id="wiki-navigation" aria-label={`${product.name} documentation`} className={`${styles.sideNav} ${open ? styles.sideNavOpen : ""}`}>
      <Link className={styles.backLink} href={`${WIKI_ROOT}/`}>← All products</Link>
      <Link className={styles.sideTitle} href={wikiProductHref(product.slug)} onClick={() => setOpen(false)} aria-current={pathname === wikiProductHref(product.slug).replace(/\/$/, "") ? "page" : undefined}>{product.name}</Link>
      <div className={styles.areaSwitch} aria-label="Documentation areas"><Link href={wikiProductHref(product.slug)} aria-current={!area ? "true" : undefined}>Product overview</Link>{wikiAreas.map((entry) => <Link key={entry.slug} href={wikiPageHref(product.slug, entry.slug)} onClick={() => setOpen(false)} aria-current={area?.slug === entry.slug ? "true" : undefined}>{entry.name}</Link>)}</div>
      {groups.map((group) => <details key={group} open className={styles.navGroup}><summary>{group}</summary><ul>{pages.filter((page) => page.section === group).map((page) => {
        const href = wikiPageHref(product.slug, page.slug);
        return <li key={page.slug}><Link href={href} aria-current={pathname === href.replace(/\/$/, "") ? "page" : undefined} onClick={() => setOpen(false)}>{page.title}</Link></li>;
      })}</ul></details>)}
      <p className={styles.sideFoot}>Public technical documentation<br />Reviewed 12 October 2026</p>
    </nav>
  </aside>;
}
