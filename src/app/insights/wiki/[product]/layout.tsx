import { notFound } from "next/navigation";
import { availableWikiProducts } from "@/data/wiki";
import { WikiSidebar } from "@/components/wiki/WikiSidebar";
import styles from "@/components/wiki/wiki.module.css";

export default function ProductLayout({ children, params }: { children: React.ReactNode; params: { product: string } }) {
  const product = availableWikiProducts.find((entry) => entry.slug === params.product);
  if (!product) notFound();
  return <div className={styles.docsLayout}><WikiSidebar product={product} /><div className={styles.docBody}>{children}</div></div>;
}
