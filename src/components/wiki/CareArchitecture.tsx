import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import styles from "./wiki.module.css";

/** Public topology already documented in the source-reviewed architecture guides. */
export function CareArchitecture() {
  return <section className={styles.architectureSection} aria-labelledby="care-architecture-title">
    <div className={styles.sectionHead}><div><p className={styles.eyebrow}>SYSTEM AT A GLANCE</p><h2 id="care-architecture-title">Two clients. One shared foundation.</h2></div><Link href="/insights/wiki/gaitai-care/backend/architecture/">Full architecture <ArrowRight size={16} aria-hidden="true" /></Link></div>
    <figure className={styles.architectureMap}>
      <div className={styles.architectureClients}>
        <Link href="/insights/wiki/gaitai-care/web/architecture/"><span className={styles.eyebrow}>WEB CLIENT</span><strong>Browser application</strong><span>HTML, JavaScript &amp; CSS</span><small>Delivered through Firebase Hosting</small></Link>
        <Link href="/insights/wiki/gaitai-care/android/architecture/"><span className={styles.eyebrow}>ANDROID CLIENT</span><strong>Packaged mobile experience</strong><span>Capacitor 8 &amp; Android WebView</span><small>Shared interface, native capabilities</small></Link>
      </div>
      <div className={styles.architectureConnector}><ArrowDown size={18} aria-hidden="true" /><span>HTTPS · Shared account and record operations</span></div>
      <Link className={styles.architectureApi} href="/insights/wiki/gaitai-care/backend/api/"><div><span className={styles.eyebrow}>APPLICATION LAYER</span><strong>Python · FastAPI</strong></div><span>Shared API <span aria-hidden="true">/</span> Reported hosting: Render</span><ArrowRight size={18} aria-hidden="true" /></Link>
      <div className={styles.architectureConnector}><ArrowDown size={18} aria-hidden="true" /><span>Data, documents and account email</span></div>
      <div className={styles.architectureServices}>
        <Link href="/insights/wiki/gaitai-care/backend/data-model/"><strong>PostgreSQL</strong><span>Supabase · Relational records</span></Link>
        <Link href="/insights/wiki/gaitai-care/backend/storage/"><strong>Private storage</strong><span>Supabase · Medical documents</span></Link>
        <Link href="/insights/wiki/gaitai-care/backend/email/"><strong>Account email</strong><span>Edge Functions · Hostinger SMTP</span></Link>
      </div>
      <figcaption>Logical architecture from the reviewed source and deployment reports. The guides distinguish implemented capabilities, reported deployments and planned work.</figcaption>
    </figure>
  </section>;
}
