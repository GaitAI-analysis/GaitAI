/**
 * Philosophy statement card — the GaitAI philosophy, styled as a premium
 * editorial card: navy gradient surface, thin border, a faint decorative
 * quote mark in the top-right, selective cyan emphasis, and a divider +
 * attribution at the bottom. Rendered inside AboutMission on /about and
 * the home page.
 */
export function AboutPhilosophy() {
  return (
    <figure className="philosophy-card mt-16">
      <blockquote className="philosophy-quote font-display">
        <span className="philosophy-accent">Walking</span> is more than{" "}
        <span className="philosophy-accent">motion</span>. It is a signature.
        It is a health indicator. It is a safety signal. It is a{" "}
        <span className="philosophy-accent">biometric identity</span>. It is a
        story of the human body.
      </blockquote>
      <div className="philosophy-divider" aria-hidden="true" />
      <figcaption className="philosophy-meta">GaitAI · Philosophy</figcaption>
    </figure>
  );
}
