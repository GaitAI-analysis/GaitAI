"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { WikiHeading } from "@/lib/wiki-content";
import styles from "./wiki.module.css";

export function WikiToc({ headings, productHref, productName }: { headings: WikiHeading[]; productHref: string; productName: string }) {
  const [active, setActive] = useState(headings[0]?.id);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const current = headings.filter((heading) => (document.getElementById(heading.id)?.getBoundingClientRect().top ?? Infinity) <= 160).at(-1);
      setActive(current?.id ?? headings[0]?.id);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, [headings]);
  return <aside className={styles.toc}><nav aria-label="On this page"><p>On this page</p><ul>{headings.map((heading) => <li key={heading.id} className={heading.depth === 3 ? styles.tocNested : undefined}><a href={`#${heading.id}`} aria-current={active === heading.id ? "location" : undefined}>{heading.title}</a></li>)}</ul></nav><Link href={productHref} className={styles.tocBack}><ArrowLeft size={14} aria-hidden="true" />{productName} overview</Link></aside>;
}
