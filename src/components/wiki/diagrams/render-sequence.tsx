import { textWidth } from "./geometry";
import { FONT, layoutSequence, SEQ } from "./layout";
import { Defs, Legend } from "./parts";
import type { SequenceSpec } from "./types";
import styles from "./diagrams.module.css";

export function SequenceSvg({ spec, idPrefix }: { spec: SequenceSpec; idPrefix: string }) {
  const layout = layoutSequence(spec);
  const { MARGIN, HEADER_H, TOP } = SEQ;
  const legendHeight = spec.legend ? 30 : 0;
  const bottom = layout.height;
  return <svg viewBox={`0 0 ${layout.width} ${bottom + legendHeight}`} role="img" aria-labelledby={`${idPrefix}-title ${idPrefix}-desc`} data-diagram={spec.id}>
    <title id={`${idPrefix}-title`}>{spec.title}</title>
    <desc id={`${idPrefix}-desc`}>{spec.description}</desc>
    <Defs id={idPrefix} />
    {layout.fragments.map((fragment, i) => <g key={i} className={styles.fragment}>
      <rect x={fragment.x1} y={fragment.y1} width={fragment.x2 - fragment.x1} height={fragment.y2 - fragment.y1} rx={4} />
      <path d={`M${fragment.x1} ${fragment.y1 + 20} H${fragment.x1 + 34} L${fragment.x1 + 40} ${fragment.y1 + 14} V${fragment.y1}`} className={styles.fragmentTab} />
      <text x={fragment.x1 + 8} y={fragment.y1 + 14} className={styles.fragmentKind}>{fragment.kind}</text>
      <text x={fragment.x1 + 48} y={fragment.y1 + 14} className={`${styles.fragmentLabel} ${styles.textHalo}`}>[{fragment.label}]</text>
      {fragment.dividers.map((divider, j) => <g key={j}>
        <path d={`M${fragment.x1} ${divider.y} H${fragment.x2}`} className={styles.fragmentDivider} />
        <text x={fragment.x1 + 10} y={divider.y + 14} className={`${styles.fragmentLabel} ${styles.textHalo}`}>[{divider.label}]</text>
      </g>)}
    </g>)}
    {layout.columns.map(({ participant, x, w, cx }) => <g key={participant.id} className={`${styles.participant} ${styles[`participant-${participant.kind ?? "system"}`]}`} data-participant={participant.id}>
      <path d={`M${cx} ${layout.lifelineTop} V${bottom - 8}`} className={styles.lifeline} />
      {participant.kind === "actor" ? <>
        <circle cx={cx} cy={TOP + 10} r={7} className={styles.shape} />
        <path d={`M${cx - 13} ${TOP + 32} C${cx - 13} ${TOP + 21} ${cx + 13} ${TOP + 21} ${cx + 13} ${TOP + 32}`} className={styles.shape} />
        <text x={cx} y={TOP + 45} textAnchor="middle" className={styles.nodeTitle}>{participant.label}</text>
      </> : <>
        <rect x={x} y={TOP} width={w} height={HEADER_H} rx={6} className={`${styles.shape} ${participant.kind === "external" ? styles.shapeExternal : ""}`} />
        <text x={cx} y={TOP + (participant.sublabel ? 20 : 28)} textAnchor="middle" className={styles.nodeTitle}>{participant.label}</text>
        {participant.sublabel && <text x={cx} y={TOP + 35} textAnchor="middle" className={styles.nodeSubtitle}>{participant.sublabel}</text>}
      </>}
    </g>)}
    {layout.activations.map((activation, i) => <rect key={i} x={activation.x - 5} y={activation.y1} width={10} height={Math.max(8, activation.y2 - activation.y1)} className={styles.activation} />)}
    {layout.dividers.map((divider, i) => {
      const w = textWidth(divider.label, FONT.group) + 20;
      return <g key={i} className={styles.divider}>
        <path d={`M${MARGIN} ${divider.y + 6} H${layout.width - MARGIN}`} />
        <rect x={layout.width / 2 - w / 2} y={divider.y - 3} width={w} height={18} rx={3} className={styles.halo} />
        <text x={layout.width / 2} y={divider.y + 10} textAnchor="middle">{divider.label.toUpperCase()}</text>
      </g>;
    })}
    {layout.messages.map((message, i) => {
      const open = message.style !== "call";
      const marker = `url(#${idPrefix}-arrow-default${open ? "-open" : ""})`;
      return <g key={i} className={`${styles.message} ${styles[`message-${message.style}`]}`} data-message={i}>
        <path d={`M${message.x1} ${message.y} H${message.x2}`} markerEnd={marker} />
        <text x={(message.x1 + message.x2) / 2} y={message.y - 7} textAnchor="middle" className={`${styles.labelText} ${styles.textHalo}`}>{message.label}</text>
        {message.detail && <text x={(message.x1 + message.x2) / 2} y={message.y + 13} textAnchor="middle" className={`${styles.sublabelText} ${styles.textHalo}`}>{message.detail}</text>}
      </g>;
    })}
    {layout.selfs.map((self, i) => <g key={i} className={`${styles.message} ${styles["message-call"]}`}>
      <path d={`M${self.x} ${self.y} H${self.x + 26} V${self.y + 22} H${self.x + 1}`} markerEnd={`url(#${idPrefix}-arrow-default)`} />
      <text x={self.x + 34} y={self.y + 10} className={`${styles.labelText} ${styles.textHalo}`}>{self.label}</text>
      {self.detail && <text x={self.x + 34} y={self.y + 25} className={`${styles.sublabelText} ${styles.textHalo}`}>{self.detail}</text>}
    </g>)}
    {layout.notes.map((note, i) => <g key={i} className={styles.seqNote}>
      <path d={`M${note.x1} ${note.y} H${note.x2 - 8} L${note.x2} ${note.y + 8} V${note.y + note.text.length * 14 + 10} H${note.x1} Z`} />
      {note.text.map((line, j) => <text key={j} x={note.x1 + 10} y={note.y + 16 + j * 14}>{line}</text>)}
    </g>)}
    {spec.legend && <Legend items={spec.legend} x={MARGIN} y={bottom + 14} width={layout.width - MARGIN * 2} />}
  </svg>;
}
