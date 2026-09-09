import Link from "next/link";
import { EVIDENCE_REVIEWED_AT, evidenceTotals } from "@/data/evidence-status";
import { allProducts } from "@/data/products";
import { BenchmarkPanel } from "./BenchmarkPanel";
import styles from "./trust.module.css";

const rows = [
  { area: "Research provenance", status: "Published sources linked", detail: "Research connections identify the methods they inform.", href: "/research/evidence/" },
  { area: "Product validation", status: "Not yet published", detail: "Product-specific validation and pilot evidence are separate from research.", href: "#module-evidence" },
  { area: "Privacy design", status: "Documented by context", detail: "Browser video stays local; hosted text and website services are disclosed.", href: "/legal/privacy/" },
  { area: "Human oversight", status: "Required in intended workflows", detail: "Clinical and operational decisions remain with qualified people.", href: "/legal/responsible-ai/" },
  { area: "Explainability", status: "Interactive examples available", detail: "Inspect supporting movement signals; illustrative outputs are labelled.", href: "/movement-lab/" },
  { area: "Security", status: "Controls documented", detail: "Deployment controls are architectural intent; no certification is claimed.", href: "/legal/security/" },
  { area: "Regulatory claims", status: "No clearance claimed", detail: "Applicability must be established for the actual use and jurisdiction.", href: "#not-claimed" },
];

export function TrustMatrix() {
  return (
    <div className={styles.matrixWrap}>
      <h2 className="font-display text-2xl text-soft-white">Trust at a glance</h2>
      <p className={styles.matrixIntro}>A reviewable status for each area. Inventory reviewed <time dateTime={EVIDENCE_REVIEWED_AT}>{EVIDENCE_REVIEWED_AT}</time>.</p>
      <table className={styles.matrix}>
        <caption className="sr-only">GaitAI trust status and supporting documentation</caption>
        <thead><tr><th scope="col">Area</th><th scope="col">Status and context</th></tr></thead>
        <tbody>{rows.map((row) => (
          <tr key={row.area}>
            <th scope="row">{row.area}</th>
            <td><Link className={styles.matrixLink} href={row.href}>{row.status}<span className="sr-only"> — {row.area} documentation</span></Link><p>{row.detail}</p></td>
          </tr>
        ))}</tbody>
      </table>
      <details id="module-evidence" className={styles.inventory}>
        <summary>Evidence Index · all {evidenceTotals.modules} modules</summary>
        <p>Each module separates research, specification, prototype, implementation, benchmark, pilot, clinical and regulatory evidence.</p>
        <ul className={styles.moduleLinks}>{allProducts.map((product) => (
          <li key={product.id}><Link href={`/${product.vertical}/${product.id}/#evidence-status`}>{product.short}<span>{product.vertical === "mobilitycare" ? "MobilityCare" : "SecureVision"}</span></Link></li>
        ))}</ul>
      </details>
      <details className={styles.inventory}>
        <summary>Benchmark reporting standard</summary>
        <BenchmarkPanel />
      </details>
    </div>
  );
}
