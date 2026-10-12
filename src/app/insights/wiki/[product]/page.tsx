import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { availableWikiProducts, wikiAreasFor, wikiPageHref, wikiProductHref } from "@/data/wiki";
import styles from "@/components/wiki/wiki.module.css";

export const dynamicParams = false;
export function generateStaticParams() { return availableWikiProducts.map(({ slug }) => ({ product: slug })); }
export function generateMetadata({ params }: { params: { product: string } }): Metadata {
  const product = availableWikiProducts.find((p) => p.slug === params.product);
  if (!product) notFound();
  const title = `${product.name} Documentation`;
  return { title, description: product.description, alternates: { canonical: wikiProductHref(product.slug) }, openGraph: { title, description: product.description, type: "website", url: wikiProductHref(product.slug) }, twitter: { title, description: product.description } };
}

export default function ProductHome({ params }: { params: { product: string } }) {
  const product = availableWikiProducts.find((p) => p.slug === params.product);
  if (!product) notFound();
  const groups = [...new Set(product.pages.filter((p) => p.area === "overview").map((page) => page.section))];
  const wikiAreas = wikiAreasFor(product);
  return <div className={styles.productHome}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/insights/wiki/">Wiki</Link><span aria-hidden="true">/</span><span aria-current="page">{product.name}</span></nav>
    <header className={styles.productHeader}><p className={styles.eyebrow}>PRODUCT DOCUMENTATION</p><h1>{product.name}</h1><p>{product.description}</p><div className={styles.articleMeta}><span>{product.pages.length} guides</span><span>Source reviewed 12 October 2026</span></div><Link className={styles.primaryLink} href={wikiPageHref(product.slug, product.pages[0].slug)}>Start with the overview <span aria-hidden="true">→</span></Link></header>
    <aside className={styles.notice}><strong>How to read this documentation</strong><p>Source-verified means present in the reviewed code. Historical test reports describe earlier observations. Neither is a claim that every feature is currently enabled in production. Planned work is labeled separately.</p></aside>
    <section className={styles.guideGroup}><h2>Choose your documentation area</h2><div className={styles.guideGrid}>{wikiAreas.map((area) => <Link className={styles.guideLink} key={area.slug} href={wikiPageHref(product.slug, area.slug)}><span className={styles.eyebrow}>{product.pages.filter((p) => p.area === area.slug).length} pages</span><h3>{area.name}<span aria-hidden="true">?</span></h3><p>{area.description}</p></Link>)}</div></section>
    {groups.map((group) => <section key={group} className={styles.guideGroup}><h2>{group}</h2><div className={styles.guideGrid}>{product.pages.filter((page) => page.area === "overview" && page.section === group).map((page) => <Link key={page.slug} href={wikiPageHref(product.slug, page.slug)} className={styles.guideLink}><h3>{page.title}<span aria-hidden="true">↗</span></h3><p>{page.description}</p></Link>)}</div></section>)}
  </div>;
}
