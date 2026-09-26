"use client";

import Link from "next/link";
import { useMemo } from "react";
import { answerConnections } from "@/lib/ask/connections";
import type { SourceLink } from "./use-assistant";
import styles from "./connections.module.css";

export function AnswerConnections({ sources, onNavigate }: {
  sources: SourceLink[];
  onNavigate: (href: string) => void;
}) {
  const connections = useMemo(() => answerConnections(sources), [sources]);
  if (!connections.products.length) return null;

  return (
    <div className={styles.connections}>
      <p className={`${styles.label} text-soft-gray`}>Explore these documented connections</p>
      {connections.context.length > 0 && <p className={`${styles.context} text-soft-mute`}>{connections.context.map((node) => node.title).join(" · ")}</p>}
      <ul className={styles.list}>
        {connections.products.map(({ product, href, inputs, signals, capabilities, evidence }) => (
          <li key={product.id} className={styles.item}>
            <div className={styles.path}>
              <span className={`${styles.input} text-soft-mute`}>{inputs.slice(0, 2).map((node) => node.title).join(" / ") || "Documented inputs"}</span>
              <span aria-hidden="true" className="text-soft-mute">→</span>
              <Link href={href} onClick={() => onNavigate(href)} className="font-semibold text-cyan-300">{product.short}</Link>
            </div>
            <details className={`${styles.details} text-soft-mute`}>
              <summary>Signals, capabilities & evidence</summary>
              {signals.length > 0 && <p>Signals: {signals.map((node) => node.title).join(" · ")}</p>}
              <p className="mt-2">Capabilities: {capabilities.map((node) => node.title).join(" · ")}</p>
              <p className="mt-2">{evidence.length > 0 ? `Research connection: ${evidence.map((area) => area.title).join(" · ")}. This informs capabilities; it does not validate this product.` : "Product documentation is available. A direct product-specific research validation is not established by these connections."}</p>
              <div className={`${styles.links} text-cyan-300`}>
                <Link href={`/gaitscape/?focus=${product.id}`} onClick={() => onNavigate(`/gaitscape/?focus=${product.id}`)}>View in GaitScape →</Link>
                <Link href="/research/evidence/" onClick={() => onNavigate("/research/evidence/")}>View evidence →</Link>
              </div>
            </details>
          </li>
        ))}
      </ul>
      <p className={`${styles.note} text-soft-mute`}>Connections describe the published product architecture. They are not claims of a deployed integration or a clinical conclusion.</p>
    </div>
  );
}
