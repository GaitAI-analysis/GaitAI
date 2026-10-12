import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { availableWikiProducts, wikiAreasFor, wikiPageHref, wikiProductHref } from "@/data/wiki";
import { WikiAreaCard, WikiGuideCard } from "@/components/wiki/WikiCards";
import { CareArchitecture } from "@/components/wiki/CareArchitecture";
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
    <header className={styles.productHeader}>
      <div><p className={styles.eyebrow}>PRODUCT DOCUMENTATION</p><h1>{product.name}</h1><p className={styles.productLead}>{product.description}</p>
        <div className={styles.headerActions}><Link className={styles.primaryLink} href={wikiPageHref(product.slug, product.pages[0].slug)}>Start with the overview <ArrowRight size={17} aria-hidden="true" /></Link>{product.slug === "gaitai-care" && <Link className={styles.textLink} href={wikiPageHref(product.slug, "comparison")}>Compare the platforms <ArrowRight size={16} aria-hidden="true" /></Link>}</div>
      </div>
      <div className={styles.productEdition}><span className={styles.editionNumber}>{product.pages.length}</span><span>technical guides</span><div>{wikiAreas.length} documentation areas<br />Source reviewed<br /><time dateTime="2026-10-12">12 October 2026</time></div></div>
    </header>
    <section className={styles.areaSection} aria-labelledby="areas-title"><div className={styles.sectionHead}><div><p className={styles.eyebrow}>FIND YOUR STARTING POINT</p><h2 id="areas-title">Explore by platform</h2></div><span>Distinct clients. Connected systems.</span></div><div className={styles.areaGrid}>{wikiAreas.map((area, index) => <WikiAreaCard key={area.slug} product={product} area={area} index={index} />)}</div></section>
    {product.slug === "gaitai-care" && <CareArchitecture />}
    {groups.map((group) => <section key={group} className={styles.guideGroup}><div className={styles.sectionHead}><div><p className={styles.eyebrow}>CONTEXT &amp; REFERENCE</p><h2>{group}</h2></div><span>The decisions behind the system</span></div><div className={styles.guideGrid}>{product.pages.filter((page) => page.area === "overview" && page.section === group).map((page) => <WikiGuideCard key={page.slug} product={product.slug} page={page} />)}</div></section>)}
    <aside className={styles.notice}><strong>How to read this documentation</strong><p>Source-verified means present in the reviewed code. Historical test reports describe earlier observations. Neither is a claim that every feature is currently enabled in production. Planned work is labeled separately.</p></aside>
  </div>;
}
