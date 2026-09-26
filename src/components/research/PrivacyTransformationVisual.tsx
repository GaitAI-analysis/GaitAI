import { SequenceFrame, sequenceFrames, SEQUENCE_CAPTION } from "@/components/visuals/SequenceFrame";
import { smoothPath } from "./PoseFrame";
import type { Pt } from "@/components/visuals/gait-phases";
import styles from "./labs.module.css";

// The approved four-stage composition, with a signal from the actual source
// sequence. No invented stride is inferred from a single photograph.
const STAGES = [
  { label: "CAPTURED FRAME", note: "RECORDED DEMO", view: "source" },
  { label: "APPEARANCE REDUCED", note: "SEGMENTATION MASK", view: "mask" },
  { label: "POSE SKELETON", note: "ESTIMATED KEYPOINTS", view: "pose" },
  { label: "MOVEMENT SIGNAL", note: "SEQUENCE · ANKLE HEIGHT", view: null },
] as const;

export function PrivacyTransformationVisual() {
  const xs = [86, 258, 430, 602];
  const values = sequenceFrames.map(f => -f.landmarks[28].y);
  const lo = Math.min(...values), span = Math.max(...values) - lo || 1;
  const trace = smoothPath(values.map((v,i):Pt => [550+i*26,170-(v-lo)/span*85]));
  return <figure>
    <svg role="img" aria-label="One recorded input frame, its extracted foreground mask and estimated skeleton, followed by ankle position across the same five-frame sequence. Appearance reduction does not guarantee anonymity." viewBox="0 0 760 300" className={styles.scene}>
      <line className={styles.sFloor} x1={24} y1={206} x2={736} y2={206}/>
      {STAGES.map((stage,i) => <g key={stage.label}>
        <text className={styles.sLabel} x={xs[i]-52} y={22}>{`0${i+1}`}</text>
        <text className={styles.pStageLabel} x={xs[i]-52} y={38}>{stage.label}</text>
        <rect className={styles.pPlate} x={xs[i]-52} y={50} width={104} height={156} rx={3}/>
        {stage.view ? <g className={styles.sPose}><SequenceFrame index={0} x={xs[i]-52} y={50} width={104} height={156} view={stage.view}/></g> : <path className={styles.pTrail} d={trace} fill="none"/>}
        <text className={styles.sDim} x={xs[i]-52} y={222}>{stage.note}</text>
        {i>0 && <g className={styles.pStrip}><line x1={xs[i]-96} y1={128} x2={xs[i]-70} y2={128}/><polyline points={`${xs[i]-76},124 ${xs[i]-70},128 ${xs[i]-76},132`}/></g>}
      </g>)}
      <text className={styles.sLabel} x={24} y={260}>TASK-RELEVANT REPRESENTATIONS</text>
      <text className={styles.pClosing} x={736} y={282} textAnchor="end">PRIVACY-AWARE DOES NOT MEAN ANONYMOUS</text>
      <line className={styles.sAxis} x1={24} y1={292} x2={736} y2={292}/>
    </svg>
    <figcaption className="mt-3 text-xs leading-relaxed text-soft-mute">{SEQUENCE_CAPTION}</figcaption>
  </figure>;
}
