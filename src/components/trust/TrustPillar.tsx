import Link from "next/link";
import styles from "./trust.module.css";

/**
 * One of the Trust Center's four pillars.
 *
 * A pillar is a claim plus its evidence rows plus where to verify it — never
 * a claim on its own. Every row's value is passed in from derived data or from
 * `trust.ts`, so the component holds no assertion of its own; it is layout.
 *
 * No icons, no badges, no shields. The index number and a hairline carry the
 * structure, which is the site's current direction and also the right register
 * for a page whose whole point is not overstating.
 */
export function TrustPillar({
  index,
  title,
  lead,
  rows,
  links,
}: {
  index: string;
  title: string;
  lead: string;
  rows: { label: string; value: string }[];
  links?: { href: string; label: string }[];
}) {
  return (
    <article className={styles.pillar}>
      <header className={styles.pillarHead}>
        <span aria-hidden="true" className={styles.pillarIndex}>
          {index}
        </span>
        <h2 className={styles.pillarTitle}>{title}</h2>
      </header>

      <p className={styles.pillarLead}>{lead}</p>

      <dl className={styles.pillarRows}>
        {rows.map((row) => (
          <div key={row.label} className={styles.pillarRow}>
            <dt className={styles.pillarRowLabel}>{row.label}</dt>
            <dd className={styles.pillarRowValue}>{row.value}</dd>
          </div>
        ))}
      </dl>

      {links && links.length > 0 && (
        <p className={styles.pillarLinks}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={styles.pillarLink}>
              {link.label} →
            </Link>
          ))}
        </p>
      )}
    </article>
  );
}
