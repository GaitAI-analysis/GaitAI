import type { ReactNode } from "react";
import styles from "./context-limitations.module.css";

/** Use documented, product-specific context; this component invents no defaults. */
export function ContextLimitations({
  title = "Context & limitations",
  context = [],
  children,
}: {
  title?: string;
  context?: readonly string[];
  children?: ReactNode;
}) {
  if (!context.length && !children) return null;
  return (
    <details className={styles.wrap}>
      <summary className={styles.trigger}>{title}</summary>
      <div className={styles.body}>
        {context.length > 0 && <ul>{context.map((item) => <li key={item}>{item}</li>)}</ul>}
        {children}
      </div>
    </details>
  );
}
