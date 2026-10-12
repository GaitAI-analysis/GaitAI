import Link from "next/link";
import type { Metadata } from "next";
import { wikiProducts, wikiProductHref } from "@/data/wiki";
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
      <p className={styles.eyebrow}>THE TECHNICAL LIBRARY</p>
      <h1>Understand the systems.<br /><span>Build on the evidence.</span></h1>
      <p className={styles.heroLead}>Architecture, data flows and engineering decisions.<br className={styles.desktopBreak} /> A considered guide to how GaitAI products are built.</p>
      <div className={styles.heroMeta}><span>{String(wikiProducts.filter((p) => p.status === "available").length).padStart(2, "0")} documented product{wikiProducts.filter((p) => p.status === "available").length !== 1 ? "s" : ""}</span><span>{wikiProducts.reduce((n, p) => n + p.pages.length, 0)} technical guides</span><span>Source reviewed · October 2026</span></div>
    </header>
    <section aria-labelledby="products-title" className={styles.productSection}>
      <div className={styles.sectionHead}><h2 id="products-title">Product documentation</h2><span>SELECT A PRODUCT TO BEGIN</span></div>
      <div className={styles.productGrid}>{wikiProducts.map((product, i) => <article key={product.slug} className={`${styles.productCard} ${product.status === "available" ? styles.featuredCard : ""}`}>
        <div className={styles.cardTop}><span className={styles.cardNumber}>0{i + 1}</span><span className={product.status === "available" ? styles.available : styles.comingSoon}>{product.status === "available" ? "Documentation available" : "Documentation coming soon"}</span></div>
        <h3>{product.name}</h3><p>{product.description}</p>
        {product.status === "available" ? <Link className={styles.cardLink} href={wikiProductHref(product.slug)}>Explore documentation <span aria-hidden="true">↗</span><small>{product.pages.length} guides</small></Link> : <div className={styles.cardPending}>Awaiting reviewed technical documentation</div>}
      </article>)}</div>
    </section>
    <div className={styles.editorialNote}><span className={styles.eyebrow}>BUILT FOR CLARITY</span><p>Implementation, deployment and future plans are different kinds of evidence. Each guide makes those boundaries explicit. This library publishes reviewed technical explanations, with private operational details kept out of public pages.</p></div>
  </div>;
}
