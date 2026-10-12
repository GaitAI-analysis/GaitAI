import styles from "./wiki.module.css";

const diagrams: Record<string, { title: string; description: string; nodes: string[] }> = {
  web: { title: "Web application architecture", description: "Firebase Hosting delivers static assets to the browser. The browser uses the shared API for profiles and records, documents and account email. Hosting is not the identity or data store.", nodes: ["Firebase Hosting", "Browser client", "Shared API", "Profiles & records", "Documents", "Account mail"] },
  android: { title: "Android application architecture", description: "Shared web source and mobile overlays form the packaged Capacitor WebView. The WebView uses the native bridge for Android services and the shared API for health records.", nodes: ["Shared web source", "Mobile overlays", "Capacitor WebView", "Native bridge", "Android services", "Shared API"] },
  system: { title: "GaitAI Care system architecture", description: "The web and Android clients share a Python API. The API accesses PostgreSQL, private file storage and an email relay. The relay passes account mail to the mail provider.", nodes: ["Web client", "Android client", "Python API", "PostgreSQL", "Private files", "Email relay", "Mail provider"] },
  ingestion: { title: "Document ingestion and review", description: "An authorized upload passes validation and protected storage, then extraction produces draft fields. A person reviews these before they become confirmed records.", nodes: ["Authorized upload", "Validate & store", "Text extraction", "Draft fields", "Human review", "Confirmed records"] },
  data: { title: "Conceptual record relationships", description: "An account owns profiles. Each profile connects documents, medical histories and daily observations. Documents produce reviewable extracted values. These are conceptual entities, not a physical database schema.", nodes: ["Account", "Health profiles", "Documents", "Medical histories", "Daily observations", "Extracted values"] },
  email: { title: "Account email sequence", description: "A user requests an account action. The API requests delivery through a relay. The mail provider delivers a link to the user. The API validates the resulting account action.", nodes: ["User", "API", "Email relay", "Mail provider"] },
};

export function StaticDiagram({ name }: { name: string }) {
  const diagram = diagrams[name];
  if (!diagram) throw new Error(`Unknown static Wiki diagram: ${name}`);
  const id = `wiki-diagram-${name}`;
  const box = (label: string, x: number, y: number, width = 170) => <g key={label}><rect x={x} y={y} width={width} height={52} rx={8} /><text x={x + width / 2} y={y + 31} textAnchor="middle">{label}</text></g>;
  const arrow = (d: string, key: string) => <path key={key} d={d} markerEnd={`url(#${id}-arrow)`} />;
  return <figure className={styles.diagram}>
    <div className={styles.diagramLabel}>ARCHITECTURE / {name === "email" ? "SEQUENCE" : "LOGICAL VIEW"}</div>
    <div className={styles.diagramScroll} tabIndex={0} role="region" aria-label={`${diagram.title}, scroll horizontally if needed`}>
      <svg viewBox={name === "email" ? "0 0 680 340" : "0 0 680 320"} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>{diagram.title}</title><desc id={`${id}-desc`}>{diagram.description}</desc>
        <defs><marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" className={styles.arrowHead} /></marker></defs>
        {name === "web" && <>
          {diagram.nodes.map((label, i) => box(label, 35 + (i % 3) * 220, i < 3 ? 35 : 225))}
          {arrow("M205 61 H254", "a")}{arrow("M425 61 H474", "b")}
          {arrow("M560 87 V161 H120 V224", "c")}{arrow("M560 161 H340 V224", "d")}{arrow("M560 161 V224", "e")}
        </>}
        {name === "android" && <>
          {box(diagram.nodes[0], 70, 15)}{box(diagram.nodes[1], 440, 15)}{box(diagram.nodes[2], 255, 115)}
          {box(diagram.nodes[3], 70, 220)}{box(diagram.nodes[5], 440, 220)}
          {arrow("M155 67 V90 H300 V114", "a")}{arrow("M525 67 V90 H380 V114", "b")}
          {arrow("M300 167 V195 H155 V219", "c")}{arrow("M380 167 V195 H525 V219", "d")}
          <text x="155" y="305" textAnchor="middle">↓ Android services</text>
        </>}
        {name === "system" && <>
          {box(diagram.nodes[0], 100, 15)}{box(diagram.nodes[1], 410, 15)}{box(diagram.nodes[2], 255, 116)}
          {box(diagram.nodes[3], 30, 220)}{box(diagram.nodes[4], 255, 220)}{box(diagram.nodes[5], 480, 220)}
          {arrow("M185 67 V92 H300 V115", "web")}{arrow("M495 67 V92 H380 V115", "mobile")}
          {arrow("M300 168 V194 H115 V219", "db")}{arrow("M340 168 V219", "files")}{arrow("M380 168 V194 H565 V219", "mail")}
          <text x="565" y="305" textAnchor="middle">↓ Mail provider</text>
        </>}
        {name === "ingestion" && <>
          {diagram.nodes.map((label, i) => box(label, 35 + (i % 3) * 220, i < 3 ? 45 : 215))}
          {arrow("M205 71 H254", "a")}{arrow("M425 71 H474", "b")}{arrow("M560 97 V152 H120 V214", "c")}
          {arrow("M205 241 H254", "d")}{arrow("M425 241 H474", "e")}
        </>}
        {name === "data" && <>
          {box(diagram.nodes[0], 35, 20)}{box(diagram.nodes[1], 255, 20)}
          {box(diagram.nodes[2], 35, 135)}{box(diagram.nodes[3], 255, 135)}{box(diagram.nodes[4], 475, 135)}{box(diagram.nodes[5], 35, 245)}
          {arrow("M205 46 H254", "a")}{arrow("M300 72 V105 H120 V134", "b")}{arrow("M340 72 V134", "c")}{arrow("M380 72 V105 H560 V134", "d")}{arrow("M120 187 V244", "e")}
        </>}
        {name === "email" && <>
          {diagram.nodes.map((label, i) => <g key={label}>{box(label, 15 + i * 168, 10, 145)}<path d={`M${87 + i * 168} 62 V320`} strokeDasharray="4 6" /></g>)}
          {[[87, 255, 105, "Request action"], [255, 423, 155, "Request delivery"], [423, 591, 205, "Send account mail"], [591, 87, 255, "Deliver verification or recovery link"], [87, 255, 310, "Confirm action"]].map(([a,b,y,label], i) => <g key={i}>{arrow(`M${a} ${y} H${b}`, `step-${i}`)}<text x={(Number(a) + Number(b)) / 2} y={Number(y) - 10} textAnchor="middle">{label}</text></g>)}
        </>}
      </svg>
    </div>
    <figcaption>{diagram.description}</figcaption>
  </figure>;
}
