import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { wikiPageHref, type WikiPage, type WikiProduct } from "@/data/wiki";
import styles from "./wiki.module.css";

export function WikiGuideCard({ product, page }: { product: string; page: WikiPage }) {
  return <Link href={wikiPageHref(product, page.slug)} className={styles.guideLink}>
    <div className={styles.guideHeading}><h3>{page.title}</h3><ArrowRight size={17} aria-hidden="true" /></div>
    <p>{page.description}</p>
  </Link>;
}

export function WikiAreaCard({ product, area, index }: {
  product: WikiProduct;
  area: { slug: string; name: string; description: string };
  index: number;
}) {
  const count = product.pages.filter((page) => page.area === area.slug).length;
  return <Link className={styles.areaCard} href={wikiPageHref(product.slug, area.slug)}>
    <div className={styles.areaCardTop}><span className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</span><span>{count} guides</span></div>
    <h3>{area.name}</h3><p>{area.description}</p>
    <div className={styles.areaCardFoot}><span>Explore documentation</span><ArrowRight size={18} aria-hidden="true" /></div>
  </Link>;
}
