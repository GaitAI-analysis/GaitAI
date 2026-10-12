import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { availableWikiProducts, wikiAreasFor, wikiPageHref, wikiProductHref } from "@/data/wiki";
import { readWikiPage } from "@/lib/wiki-content";
import { WikiMarkdown } from "@/components/wiki/WikiMarkdown";
import { WikiGuideCard } from "@/components/wiki/WikiCards";
import { WikiToc } from "@/components/wiki/WikiToc";
import styles from "@/components/wiki/wiki.module.css";

type Params = { product: string; page: string[] };
export const dynamicParams = false;
export function generateStaticParams() { return availableWikiProducts.flatMap((product) => product.pages.map((page) => ({ product: product.slug, page: page.slug.split("/") }))); }
function resolve(params: Params) {
  const product = availableWikiProducts.find((p) => p.slug === params.product);
  const page = product?.pages.find((p) => p.slug === params.page.join("/"));
  if (!product || !page) notFound();
  return { product, page };
}
export function generateMetadata({ params }: { params: Params }): Metadata {
  const { product, page } = resolve(params);
  const title = `${page.title} — ${product.name}`;
  const url = wikiPageHref(product.slug, page.slug);
  return { title, description: page.description, alternates: { canonical: url }, openGraph: { title, description: page.description, type: "article", url }, twitter: { title, description: page.description } };
}

export default function DocumentationPage({ params }: { params: Params }) {
  const { product, page } = resolve(params);
  const { markdown, headings, minutes } = readWikiPage(product, page);
  const area = wikiAreasFor(product).find((a) => a.slug === page.area);
  const siblings = product.pages.filter((p) => p.area === page.area);
  const index = siblings.indexOf(page);
  const previous = siblings[index - 1];
  const next = siblings[index + 1];
  return <div className={styles.readingLayout}>
    <article className={styles.article}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/insights/wiki/">Wiki</Link><span aria-hidden="true">/</span><Link href={wikiProductHref(product.slug)}>{product.name}</Link><span aria-hidden="true">/</span>{area && page.slug !== area.slug && <><Link href={wikiPageHref(product.slug, area.slug)}>{area.name}</Link><span aria-hidden="true">/</span></>}<span aria-current="page">{page.title}</span></nav>
      <header className={styles.articleHeader}><p className={styles.eyebrow}>{page.section}</p><h1>{page.title}</h1><p className={styles.articleDeck}>{page.description}</p><div className={styles.articleMeta}><span>Reviewed 12 October 2026</span><span>{minutes} min read</span><span>{String(index + 1).padStart(2, "0")} / {siblings.length} guides</span></div></header>
      <details className={styles.mobileToc}><summary>On this page</summary><ul>{headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`}>{heading.title}</a></li>)}</ul></details>
      <WikiMarkdown markdown={markdown} />
      {area && page.slug === area.slug && <section className={styles.guideGroup} aria-label={`${area.name} guides`}><div className={styles.sectionHead}><div><p className={styles.eyebrow}>CONTINUE EXPLORING</p><h2>Explore this documentation</h2></div></div><div className={styles.guideGrid}>{siblings.filter((p) => p.slug !== page.slug).map((entry) => <WikiGuideCard key={entry.slug} product={product.slug} page={entry} />)}</div></section>}
      <div className={styles.reviewNote}>Reviewed against the latest available Care source on 12 October 2026 and the supplied architecture bundle. Source review does not establish live service health or clinical validation.</div>
      <nav className={styles.pagination} aria-label="Documentation pages">
        {previous ? <Link href={wikiPageHref(product.slug, previous.slug)} rel="prev"><span><ArrowLeft size={15} aria-hidden="true" /> Previous</span><strong>{previous.title}</strong></Link> : <Link href={wikiProductHref(product.slug)}><span><ArrowLeft size={15} aria-hidden="true" /> Documentation home</span><strong>{product.name}</strong></Link>}
        {next ? <Link href={wikiPageHref(product.slug, next.slug)} rel="next"><span>Next <ArrowRight size={15} aria-hidden="true" /></span><strong>{next.title}</strong></Link> : <Link href={wikiProductHref(product.slug)}><span>Return to index <ArrowRight size={15} aria-hidden="true" /></span><strong>All {product.pages.length} guides</strong></Link>}
      </nav>
    </article>
    <WikiToc headings={headings} productHref={wikiProductHref(product.slug)} productName={product.name} />
  </div>;
}
