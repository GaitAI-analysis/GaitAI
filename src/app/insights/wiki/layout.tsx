import Link from "next/link";
import { Georama } from "next/font/google";
import { WikiSearch } from "@/components/wiki/WikiSearch";
import { wikiSearchEntries } from "@/lib/wiki-content";
import styles from "@/components/wiki/wiki.module.css";

const georama = Georama({ subsets: ["latin"], variable: "--font-wiki", display: "swap" });

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${styles.portal} ${georama.variable}`}>
    <div className={styles.topbar}><div className={styles.topbarInner}><Link href="/insights/wiki/" className={styles.wordmark}>GaitAI <span>Wiki</span></Link><span className={styles.topbarNote}>Architecture. Systems. Decisions.</span><WikiSearch entries={wikiSearchEntries()} /></div></div>
    {children}
  </div>;
}
