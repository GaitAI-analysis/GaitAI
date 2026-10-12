import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { wikiProducts, wikiProductHref, wikiAreasFor, wikiPageHref } from "@/data/wiki";
import styles from "@/components/wiki/wiki.module.css";

const title = "GaitAI Wiki — Technical Documentation";
const description = "Explore GaitAI product documentation: system architecture, data flows, engineering decisions and source-reviewed GaitAI Care guides.";
export const metadata: Metadata = {
  title: { absolute: title }, description, alternates: { canonical: "/insights/wiki/" },
  openGraph: { title, description, type: "website", url: "/insights/wiki/" }, twitter: { title, description, card: "summary_large_image" },
};

export default function WikiHome() {
  return <div className={styles.directory}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/insights/">Insights</Link><span aria-hidden="true">/</span><span aria-current="page">Wiki</span></nav>
    <header className={styles.hero}>
      <div><p className={styles.eyebrow}>THE GAITAI TECHNICAL LIBRARY</p>
        <h1>Understand the systems.<br /><span>Build on the evidence.</span></h1>
        <p className={styles.heroLead}>Architecture, data flows and engineering decisions. A considered guide to how GaitAI products are built.</p>
      </div>
      <div className={styles.libraryIndex}><p className={styles.eyebrow}>INSIDE THE LIBRARY</p><div><strong>{wikiProducts.reduce((n, p) => n + p.pages.length, 0)}</strong><span>technical guides<br />Web · Android · Infrastructure</span></div><p>Source reviewed <span>October 2026</span></p></div>
    </header>
    <section aria-labelledby="products-title" className={styles.productSection}>
      <div className={styles.sectionHead}><h2 id="products-title">Product documentation</h2><span>Select a product. Explore its systems.</span></div>
      <div className={styles.productGrid}>{wikiProducts.map((product, i) => <article key={product.slug} className={`${styles.productCard} ${product.status === "available" ? styles.featuredCard : ""}`}>
        <div className={styles.cardTop}><span className={styles.cardNumber}>0{i + 1}</span><span className={product.status === "available" ? styles.available : styles.comingSoon}>{product.status === "available" ? "Documentation available" : "Documentation coming soon"}</span></div>
        <h3>{product.name}</h3><p>{product.status === "available" ? product.description : "Technical material will be published after source review."}</p>
        {product.status === "available" && <><div className={styles.productAreaList}>{wikiAreasFor(product).map((area) => <Link key={area.slug} href={wikiPageHref(product.slug, area.slug)}><span>{area.name}</span><small>{product.pages.filter((page) => page.area === area.slug).length} guides</small><ArrowRight size={16} aria-hidden="true" /></Link>)}</div><Link className={styles.cardLink} href={wikiProductHref(product.slug)}>Explore {product.name} <ArrowRight size={18} aria-hidden="true" /></Link></>}
      </article>)}</div>
    </section>
    <div className={styles.editorialNote}><span className={styles.eyebrow}>BUILT FOR CLARITY</span><p>Implementation, deployment and future plans are different kinds of evidence. Each guide makes those boundaries explicit. This library publishes reviewed technical explanations, with private operational details kept out of public pages.</p></div>
  </div>;
}
