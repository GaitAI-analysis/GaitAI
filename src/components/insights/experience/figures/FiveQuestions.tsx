"use client";

import { useId, useState } from "react";
import { InteractiveFigure } from "../InteractiveFigure";
import type { FigureProps } from "../registry";
import fig from "../figures.module.css";
import ui from "../experience.module.css";

/**
 * FIVE QUESTIONS TO PUT TO A MULTIMODAL RESULT — an interactive checklist.
 *
 * Each question opens into a tiny diagram, one short explanation, and one
 * thing to do: shrink the headroom, remove an input, corrupt an input, swap
 * the inputs under an explanation, add seeds and the right evaluation unit.
 * Not an accordion of text: the interaction is the point of each row.
 */

const QUESTIONS = [
  { id: "benchmark", n: "01", q: "Is the benchmark too easy?", line: "If a well-tuned simple baseline already sits near the ceiling, the remaining headroom is inside run-to-run noise, and a small gain says nothing about the architecture." },
  { id: "missing", n: "02", q: "What happens if a modality disappears?", line: "Full-input evaluation is the best case. A system that collapses when one stream is absent has chained its modalities, not fused them." },
  { id: "corrupt", n: "03", q: "What happens if a modality silently corrupts?", line: "Known absence is a routing problem. Silent corruption is a detection problem: the model must estimate the reliability of evidence it has already accepted." },
  { id: "faithful", n: "04", q: "Are the explanations faithful?", line: "An attribution that does not change when the inputs change is describing something other than this model. Plausible is not faithful." },
  { id: "meaningful", n: "05", q: "Does the improvement matter operationally?", line: "One run on one split is a starting point. Seeds, confidence intervals and the right independent unit — subjects, not frames — decide whether the gain is real." },
] as const;

const DESCRIPTION = `Five questions, each with a small interaction.
01 Is the benchmark too easy? A control raises the baseline's strength; the headroom left for any new method shrinks until a gain sits inside noise.
02 What happens if a modality disappears? Removing an input shows whether the result degrades gracefully (fused) or collapses (chained).
03 What happens if a modality silently corrupts? Corrupting an input leaves the result the same size, with nothing announcing the damage.
04 Are the explanations faithful? Swapping the input set changes a faithful attribution and leaves a merely plausible one unchanged.
05 Does the improvement matter operationally? Adding seeds draws an interval around a point estimate; evaluating per subject instead of per frame widens it further.`;

export function FiveQuestions({ articleSlug, presentation }: FigureProps) {
  const [open, setOpen] = useState<number | null>(() =>
    typeof presentation?.open === "number" ? presentation.open : null,
  );
  const [baseline, setBaseline] = useState(0.55);
  const [removed, setRemoved] = useState(false);
  const [fused, setFused] = useState(true);
  const [corrupted, setCorrupted] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [seeds, setSeeds] = useState(false);
  const [perSubject, setPerSubject] = useState(false);
  const id = useId();

  const body = (
    <ol className="divide-y divide-white/[0.07]">
      {QUESTIONS.map((item, i) => {
        const on = open === i;
        return (
          <li key={item.id}>
            <button
              type="button"
              aria-expanded={on}
              aria-controls={`${id}-${item.id}`}
              onClick={() => setOpen(on ? null : i)}
              className="flex w-full items-baseline gap-4 py-3.5 text-left transition-colors hover:text-soft-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              <span className="font-mono text-[10px] tracking-[0.18em] text-cyan-300">{item.n}</span>
              <span className={`flex-1 font-display text-[1.05rem] leading-snug ${on ? "text-soft-white" : "text-soft-gray"}`}>{item.q}</span>
              <span aria-hidden="true" className={`text-soft-mute transition-transform ${on ? "rotate-45" : ""}`}>+</span>
            </button>
            {on && (
              <div id={`${id}-${item.id}`} className={`${ui.storyMoment} grid gap-4 pb-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`}>
                <div className="rounded-xl border border-white/[0.07] p-3">
                  {i === 0 && <Benchmark baseline={baseline} />}
                  {i === 1 && <Missing removed={removed} fused={fused} />}
                  {i === 2 && <Corrupt corrupted={corrupted} />}
                  {i === 3 && <Faithful swapped={swapped} />}
                  {i === 4 && <Meaningful seeds={seeds} perSubject={perSubject} />}
                </div>
                <div>
                  <p className="text-[0.9rem] leading-relaxed text-soft-gray">{item.line}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {i === 0 && (
                      <label className="flex w-full items-center gap-3 text-[11px] text-soft-mute">
                        <span className="font-mono uppercase tracking-[0.16em]">Baseline strength</span>
                        <input
                          type="range"
                          min={0.2}
                          max={0.96}
                          step={0.01}
                          value={baseline}
                          onChange={(event) => setBaseline(Number(event.target.value))}
                          aria-label="Baseline strength"
                          className="flex-1 accent-cyan-300"
                        />
                      </label>
                    )}
                    {i === 1 && (
                      <>
                        <button type="button" aria-pressed={removed} onClick={() => setRemoved((v) => !v)} className={`${ui.chip} ${removed ? ui.chipOn : ""}`}>
                          {removed ? "Restore IMU" : "Remove IMU"}
                        </button>
                        <div className={ui.segment} role="radiogroup" aria-label="Model">
                          <button type="button" role="radio" aria-checked={fused} onClick={() => setFused(true)} className={`${ui.segmentBtn} ${fused ? ui.segmentOn : ""}`}>Fused</button>
                          <button type="button" role="radio" aria-checked={!fused} onClick={() => setFused(false)} className={`${ui.segmentBtn} ${!fused ? ui.segmentOn : ""}`}>Chained</button>
                        </div>
                      </>
                    )}
                    {i === 2 && (
                      <button type="button" aria-pressed={corrupted} onClick={() => setCorrupted((v) => !v)} className={`${ui.chip} ${ui.chipWarn} ${corrupted ? ui.chipOn : ""}`}>
                        {corrupted ? "Repair pose" : "Corrupt pose"}
                      </button>
                    )}
                    {i === 3 && (
                      <button type="button" aria-pressed={swapped} onClick={() => setSwapped((v) => !v)} className={`${ui.chip} ${swapped ? ui.chipOn : ""}`}>
                        {swapped ? "Original inputs" : "Swap the inputs"}
                      </button>
                    )}
                    {i === 4 && (
                      <>
                        <button type="button" aria-pressed={seeds} onClick={() => setSeeds((v) => !v)} className={`${ui.chip} ${seeds ? ui.chipOn : ""}`}>
                          {seeds ? "Five seeds" : "One run"}
                        </button>
                        <button type="button" aria-pressed={perSubject} onClick={() => setPerSubject((v) => !v)} className={`${ui.chip} ${perSubject ? ui.chipOn : ""}`}>
                          {perSubject ? "Per subject" : "Per frame"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );

  return (
    <InteractiveFigure
      id="five-questions"
      articleSlug={articleSlug}
      eyebrow="Interactive checklist"
      title="Five questions to put to any multimodal result"
      status="conceptual"
      wide
      minHeight="360px"
      description={DESCRIPTION}
      caption="Every diagram is a conceptual demonstration with no values on any axis. Use them to feel the shape of each question, then read the section that asks it."
    >
      {body}
    </InteractiveFigure>
  );
}

/* ── the five tiny diagrams ─────────────────────────────────────────────── */

function Benchmark({ baseline }: { baseline: number }) {
  const w = 220;
  const x0 = 20;
  const base = x0 + baseline * w;
  const gain = Math.min(x0 + w, base + 18);
  const noiseW = 22;
  const inside = gain - base <= noiseW;
  return (
    <svg viewBox="0 0 280 96" className={fig.svg} aria-hidden="true">
      <text className={`${fig.label} ${fig.labelSmall}`} x={x0} y={16}>headroom</text>
      <line className={fig.hair} x1={x0} y1={40} x2={x0 + w} y2={40} />
      <rect className={fig.nodeMute} x={x0} y={36} width={base - x0} height={8} rx={1} />
      <rect className={inside ? fig.nodeWarn : fig.nodeFill} x={base} y={36} width={gain - base} height={8} rx={1} />
      <rect className={fig.band} x={base - noiseW / 2} y={30} width={noiseW} height={20} rx={2} />
      <line className={fig.dash} x1={x0 + w} y1={26} x2={x0 + w} y2={56} />
      <text className={`${fig.label} ${fig.labelSmall}`} x={x0} y={70}>simple baseline</text>
      <text className={`${fig.label} ${fig.labelSmall} ${inside ? fig.labelWarn : fig.labelAccent}`} x={x0 + w} y={70} textAnchor="end">
        {inside ? "gain inside seed noise" : "gain exceeds noise"}
      </text>
      <text className={`${fig.label} ${fig.labelSmall}`} x={x0} y={88}>ceiling →</text>
    </svg>
  );
}

function Missing({ removed, fused }: { removed: boolean; fused: boolean }) {
  const names = ["RGB", "Pose", "IMU", "Audio"];
  const collapse = removed && !fused;
  return (
    <svg viewBox="0 0 280 96" className={fig.svg} aria-hidden="true">
      {names.map((n, i) => {
        const gone = removed && n === "IMU";
        return (
          <g key={n} style={{ opacity: gone ? 0.4 : 1 }}>
            <text className={`${fig.label} ${fig.labelSmall}`} x={16} y={20 + i * 20}>{n}</text>
            {gone ? (
              <line className={fig.dash} x1={56} y1={17 + i * 20} x2={150} y2={17 + i * 20} />
            ) : (
              <path className={`${fig.trace} ${fig.traceSoft}`} d={`M56 ${17 + i * 20} C110 ${17 + i * 20} 120 50 150 50`} />
            )}
          </g>
        );
      })}
      <circle className={fig.node} cx={158} cy={50} r={8} />
      <line className={fig.trace} x1={168} y1={50} x2={190} y2={50} />
      <rect className={`${fig.plate} ${collapse ? "" : fig.plateLit}`} x={192} y={22} width={76} height={56} rx={4} />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          className={collapse ? fig.nodeMute : fig.nodeFill}
          x={202}
          y={32 + i * 14}
          width={collapse ? 10 : removed ? 44 - i * 8 : 56 - i * 8}
          height={6}
          rx={1}
        />
      ))}
      <text className={`${fig.label} ${fig.labelSmall} ${collapse ? fig.labelWarn : removed ? fig.labelTeal : ""}`} x={192} y={90}>
        {collapse ? "collapses · chained" : removed ? "degrades · gap known" : "best case"}
      </text>
    </svg>
  );
}

function Corrupt({ corrupted }: { corrupted: boolean }) {
  return (
    <svg viewBox="0 0 280 96" className={fig.svg} aria-hidden="true">
      <defs>
        <filter id="fq-noise" x="-5%" y="-40%" width="110%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      {["RGB", "Pose", "IMU"].map((n, i) => {
        const bad = corrupted && n === "Pose";
        return (
          <g key={n}>
            <text className={`${fig.label} ${fig.labelSmall} ${bad ? fig.labelWarn : ""}`} x={16} y={24 + i * 22}>{n}</text>
            <path
              className={`${fig.trace} ${bad ? fig.traceWarn : fig.traceSoft}`}
              d={`M56 ${21 + i * 22} C110 ${21 + i * 22} 120 46 150 46`}
              style={bad ? { filter: "url(#fq-noise)" } : undefined}
            />
          </g>
        );
      })}
      <circle className={fig.node} cx={158} cy={46} r={8} />
      <line className={fig.trace} x1={168} y1={46} x2={190} y2={46} />
      <rect className={`${fig.plate} ${fig.plateLit}`} x={192} y={18} width={76} height={56} rx={4} />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          className={corrupted && i === 1 ? fig.nodeWarn : fig.nodeFill}
          x={202}
          y={28 + i * 14}
          width={56 - i * 8}
          height={6}
          rx={1}
          style={corrupted && i === 1 ? { filter: "url(#fq-noise)" } : undefined}
        />
      ))}
      <text className={`${fig.label} ${fig.labelSmall} ${corrupted ? fig.labelWarn : ""}`} x={192} y={90}>
        {corrupted ? "same size · nothing flagged" : "sound"}
      </text>
    </svg>
  );
}

function Faithful({ swapped }: { swapped: boolean }) {
  const faithful = swapped ? [0.2, 0.9, 0.5, 0.35] : [0.9, 0.3, 0.6, 0.2];
  const plausible = [0.85, 0.35, 0.55, 0.25];
  const cells = (row: number[], y: number, cls: string) =>
    row.map((v, i) => (
      <rect key={i} x={90 + i * 40} y={y} width={34} height={16} rx={2} className={cls} style={{ opacity: 0.2 + v * 0.8, transition: "opacity 0.4s" }} />
    ));
  return (
    <svg viewBox="0 0 280 96" className={fig.svg} aria-hidden="true">
      {["RGB", "Pose", "IMU", "Audio"].map((n, i) => (
        <text key={n} className={`${fig.label} ${fig.labelSmall}`} x={107 + i * 40} y={14} textAnchor="middle">{n}</text>
      ))}
      <text className={`${fig.label} ${fig.labelSmall} ${fig.labelTeal}`} x={12} y={36}>faithful</text>
      {cells(faithful, 24, fig.nodeTeal)}
      <text className={`${fig.label} ${fig.labelSmall} ${fig.labelWarn}`} x={12} y={66}>plausible only</text>
      {cells(plausible, 54, fig.nodeWarn)}
      <text className={`${fig.label} ${fig.labelSmall}`} x={12} y={90}>
        {swapped ? "inputs changed → one map moved, one did not" : "attribution over the original inputs"}
      </text>
    </svg>
  );
}

function Meaningful({ seeds, perSubject }: { seeds: boolean; perSubject: boolean }) {
  const cx = 150;
  const half = seeds ? (perSubject ? 58 : 28) : 0;
  const base = 96;
  return (
    <svg viewBox="0 0 280 96" className={fig.svg} aria-hidden="true">
      <line className={fig.hair} x1={20} y1={50} x2={260} y2={50} />
      <line className={fig.dash} x1={base} y1={30} x2={base} y2={70} />
      <text className={`${fig.label} ${fig.labelSmall}`} x={base} y={24} textAnchor="middle">baseline</text>
      {seeds && <line className={`${fig.trace} ${perSubject ? fig.traceWarn : fig.traceTeal}`} x1={cx - half} y1={50} x2={cx + half} y2={50} style={{ transition: "all 0.4s" }} />}
      {seeds && [-1, 1].map((d) => <line key={d} className={`${fig.trace} ${perSubject ? fig.traceWarn : fig.traceTeal}`} x1={cx + d * half} y1={44} x2={cx + d * half} y2={56} />)}
      <circle className={fig.nodeFill} cx={cx} cy={50} r={4} />
      <text className={`${fig.label} ${fig.labelSmall}`} x={20} y={88}>
        {!seeds
          ? "one run · a point, no interval"
          : perSubject
            ? "per subject · interval crosses the baseline"
            : "five seeds · interval clears the baseline"}
      </text>
    </svg>
  );
}
