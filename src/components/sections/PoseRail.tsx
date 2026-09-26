"use client";

import { useEffect, useRef } from "react";
import { POSE_RAIL } from "@/data/home-hero";
import { HERO_GAIT } from "@/data/hero-walk";
import { subscribeGait, type GaitTick } from "@/lib/gaitBus";
import styles from "./poserail.module.css";

/**
 * THE POSE-ANALYSIS RAIL — what the third panel shows instead of a card.
 * =============================================================================
 * SecureVision and MobilityCare are products, and open full cards. Pose
 * analysis is the shared analysis layer under both, and its subject is the
 * digital human in the third panel — so it does not open another white
 * rectangle over that figure. It lights a slim, translucent rail beside him.
 *
 * THE READINGS HOLD STILL; THE GAIT IS LIVE. The seven headline readings are
 * fixed text (founder). Everything that moves is the walker's own cycle,
 * published frame by frame by HeroWalker (lib/gaitBus) and looked up in
 * HERO_GAIT, the phases, stance, angles and events measured on the rendered
 * body (scripts/hero-walker/gait.py). Nothing here is animated on its own
 * clock or invented:
 *
 *   gait speed    the pelvis's vertical oscillation, scrolling, heel strikes
 *                 marked
 *   cadence       a left and a right tick that light on each heel strike
 *   symmetry      a bar per leg, up while that foot is on the floor
 *   balance       a level line tilted by the pelvic obliquity
 *   range         a needle on the near knee's flexion
 *   GAIT CYCLE    per foot, where it is in the cycle (stance / swing, the
 *                 phase by name), one cursor at "now"; the live signals and
 *                 the eight-phase list when the rail is open; the waveform
 *                 with L / R under each heel strike
 *
 * At rest the rail shows its title, three readings and the gait cycle; the
 * dot, the introduction or a hover opens the rest. It is decoration to
 * assistive technology beyond the readings themselves.
 */

type Phase = (typeof HERO_GAIT.phases)[number];
const N = HERO_GAIT.phase.length;
const SHORT: Record<Phase, string> = {
  "Initial contact": "Initial contact",
  "Loading response": "Loading response",
  "Mid stance": "Mid stance",
  "Terminal stance": "Terminal stance",
  "Pre-swing": "Pre-swing",
  "Initial swing": "Initial swing",
  "Mid swing": "Mid swing",
  "Terminal swing": "Terminal swing",
};

/** The eight phases, short enough for two columns of the rail. */
const PHASE_LABEL: Record<Phase, string> = {
  "Initial contact": "Initial contact",
  "Loading response": "Loading resp.",
  "Mid stance": "Mid stance",
  "Terminal stance": "Terminal stance",
  "Pre-swing": "Pre-swing",
  "Initial swing": "Initial swing",
  "Mid swing": "Mid swing",
  "Terminal swing": "Terminal swing",
};

/** Stance runs of one foot across the stride (frame 0 = right heel strike), as [from, to) fractions. */
function runs(k: 0 | 1) {
  const out: [number, number][] = [];
  let start = -1;
  for (let i = 0; i <= N; i++) {
    const on = i < N && HERO_GAIT.stance[i][k] === 1;
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      out.push([start / N, i / N]);
      start = -1;
    }
  }
  return out;
}
const STANCE = { L: runs(0), R: runs(1) };

/** Which limb leads now: the one alone on the floor, or in double support the one that just landed. */
function active(i: number): "Left" | "Right" {
  const [sl, sr] = HERO_GAIT.stance[i];
  if (sl && !sr) return "Left";
  if (sr && !sl) return "Right";
  const [pl, pr] = HERO_GAIT.phase[i];
  return pl <= 1 ? "Left" : pr <= 1 ? "Right" : pl < pr ? "Left" : "Right";
}

function Instrument({ kind }: { kind: (typeof POSE_RAIL.rows)[number]["instrument"] }) {
  switch (kind) {
    case "wave":
      return <canvas className={styles.wave} data-g="wave-mini" aria-hidden="true" />;
    case "steps":
      return (
        <span className={styles.steps} aria-hidden="true">
          <span data-g="tick-l" />
          <span data-g="tick-r" />
        </span>
      );
    case "symmetry":
      return (
        <span className={styles.symmetry} aria-hidden="true">
          <span data-g="bar-l" />
          <span data-g="bar-r" />
        </span>
      );
    case "level":
      return (
        <span className={styles.level} aria-hidden="true">
          <span data-g="level" />
        </span>
      );
    case "gauge":
      return (
        <svg className={styles.gauge} viewBox="0 0 24 13" aria-hidden="true" focusable="false">
          <path className={styles.gaugeArc} d="M2 12 A10 10 0 0 1 22 12" vectorEffect="non-scaling-stroke" />
          <line className={styles.gaugeNeedle} data-g="needle" x1="12" y1="12" x2="12" y2="4" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    default:
      return null;
  }
}

/** The pelvis's vertical oscillation over the last two strides, now at the right edge, heel strikes marked. */
function drawWave(c: HTMLCanvasElement, f: number, labels: boolean) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(c.clientWidth * dpr));
  const h = Math.max(1, Math.round(c.clientHeight * dpr));
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const cs = getComputedStyle(c);
  const line = cs.getPropertyValue("--rail-slate").trim() || "#7f8ba3";
  const gold = cs.getPropertyValue("--rail-gold").trim() || "#c4a468";
  const Y = HERO_GAIT.pelvisY;
  const lo = Math.min(...Y), hi = Math.max(...Y);
  const span = N * 2;
  const top = 1.5 * dpr, bottom = h - (labels ? 9 : 1.5) * dpr;
  const xAt = (q: number) => w - 3 * dpr - ((f - q) / span) * (w - 6 * dpr);
  const yAt = (q: number) => {
    const a = ((Math.floor(q) % N) + N) % N, b = (a + 1) % N, u = q - Math.floor(q);
    const v = Y[a] + (Y[b] - Y[a]) * u;
    return bottom - ((v - lo) / (hi - lo || 1)) * (bottom - top);
  };
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 1.2 * dpr;
  ctx.strokeStyle = line;
  ctx.beginPath();
  for (let q = f - span; q <= f; q += 0.5) {
    const x = xAt(q), y = yAt(q);
    if (q === f - span) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Heel strikes, L and R, where they happened.
  ctx.font = `600 ${7 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  for (const [s, e] of [["L", HERO_GAIT.ic.l], ["R", HERO_GAIT.ic.r]] as const) {
    for (let q = Math.floor((f - e) / N) * N + e; q > f - span; q -= N) {
      const x = xAt(q), y = yAt(q);
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.arc(x, y, 1.9 * dpr, 0, Math.PI * 2);
      ctx.fill();
      if (labels) {
        ctx.globalAlpha = 0.9;
        ctx.fillText(s, x, h - 1 * dpr);
        ctx.globalAlpha = 1;
      }
    }
  }
  // Now.
  ctx.fillStyle = gold;
  ctx.fillRect(w - 3 * dpr, top, 1 * dpr, bottom - top);
}

export function PoseRail({ titleId }: { titleId: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = <T extends Element>(k: string) => el.querySelector<T>(`[data-g="${k}"]`);
    const text: Record<string, string> = {};
    const setText = (k: string, v: string) => {
      if (text[k] === v) return;
      text[k] = v;
      const n = q<HTMLElement>(k);
      if (n) n.textContent = v;
    };
    const attr: Record<string, string> = {};
    const setAttr = (node: Element | null, key: string, name: string, v: string) => {
      if (!node || attr[key] === v) return;
      attr[key] = v;
      node.setAttribute(name, v);
    };
    const cursor = q<HTMLElement>("cursor");
    const rowsL = el.querySelectorAll<HTMLElement>("[data-phase-row]");
    const tickL = q("tick-l"), tickR = q("tick-r"), barL = q<HTMLElement>("bar-l"), barR = q<HTMLElement>("bar-r");
    const level = q<HTMLElement>("level"), needle = q<SVGElement>("needle");
    const waves = [q<HTMLCanvasElement>("wave-mini"), q<HTMLCanvasElement>("wave")];

    const onTick = ({ i, f }: GaitTick) => {
      const [pl, pr] = HERO_GAIT.phase[i];
      const [sl, sr] = HERO_GAIT.stance[i];
      const lead = active(i);
      const pct = Math.floor((f / N) * 100);
      setText("phase-l", SHORT[HERO_GAIT.phases[pl]]);
      setText("phase-r", SHORT[HERO_GAIT.phases[pr]]);
      setText("stride", `${pct}%`);
      setText("sig-phase", HERO_GAIT.phases[lead === "Left" ? pl : pr]);
      setText("sig-limb", lead);
      setText("sig-contact", sl && sr ? "Double support" : "Single support");
      setText("sig-stride", `${pct}%`);
      if (cursor) cursor.style.left = `${((f / N) * 100).toFixed(2)}%`;
      rowsL.forEach((row, k) => {
        setAttr(row, `row${k}l`, "data-l", String(k === pl));
        setAttr(row, `row${k}r`, "data-r", String(k === pr));
      });
      setAttr(tickL, "tl", "data-hit", String(pl === 0 || (pl === 1 && HERO_GAIT.phase[(i + N - 2) % N][0] === 0)));
      setAttr(tickR, "tr", "data-hit", String(pr === 0 || (pr === 1 && HERO_GAIT.phase[(i + N - 2) % N][1] === 0)));
      setAttr(barL, "bl", "data-on", String(sl === 1));
      setAttr(barR, "br", "data-on", String(sr === 1));
      if (level) level.style.transform = `rotate(${(-HERO_GAIT.obliq[i]).toFixed(1)}deg)`;
      if (needle) needle.style.transform = `rotate(${(-40 + (HERO_GAIT.angles[i][4] / 70) * 80).toFixed(1)}deg)`;
      for (const c of waves) if (c && c.clientWidth) drawWave(c, f, c.dataset.g === "wave");
    };
    return subscribeGait(onTick);
  }, []);

  /* THE RAIL FITS THE FRAME. The hero is at most one screen tall, so the
     open rail (a fixed height in rem) would run past its foot, and under
     the Ask launcher, on shorter screens. From 1024px it stands at 29% of
     the picture where there is room; where there is not it rises toward
     its pill, and if that is still not enough the least essential open
     detail steps out: first the eight-phase list and the legend
     (`data-fit="compact"`), then the live signals (`"min"`), and last the rows
     tighten and the waveform goes (`"dense"`). The heights
     are measured on an invisible open copy, so they follow the type. The
     quiet and open rail share one position, so opening never moves it. */
  useEffect(() => {
    const inner = root.current;
    const wrap = inner?.parentElement;
    const stage = wrap?.offsetParent as HTMLElement | null | undefined;
    const frame = stage?.parentElement; // the hero, which clips the picture
    if (!wrap || !stage || !frame) return;
    const wide = window.matchMedia("(min-width: 1024px)");
    const TIERS = ["full", "compact", "min", "dense"] as const;
    const GAP = 14;
    let raf = 0;

    const fit = () => {
      raf = 0;
      if (!wide.matches) {
        wrap.style.removeProperty("top");
        wrap.style.removeProperty("max-height");
        delete wrap.dataset.fit;
        return;
      }
      const probe = wrap.cloneNode(true) as HTMLElement;
      probe.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      probe.removeAttribute("id");
      probe.removeAttribute("data-hero-option");
      probe.removeAttribute("data-closing");
      probe.setAttribute("aria-hidden", "true");
      probe.dataset.open = "true";
      probe.dataset.probe = "";
      probe.style.removeProperty("max-height");
      stage.appendChild(probe);
      const need = TIERS.map((t) => {
        probe.dataset.fit = t;
        return probe.offsetHeight;
      });
      probe.remove();

      const s = stage.getBoundingClientRect();
      const f = frame.getBoundingClientRect();
      const w = wrap.getBoundingClientRect();
      let bottom = f.bottom - s.top - GAP;
      const ask = document.querySelector<HTMLElement>('button[aria-label^="Ask GaitAI"]');
      if (ask && ask.dataset.hidden !== "true") {
        const a = ask.getBoundingClientRect();
        if (a.width && a.left < w.right && a.right > w.left) bottom = Math.min(bottom, a.top - s.top - 10);
      }
      const natural = stage.clientHeight * 0.29;
      const pill = document.querySelector<HTMLElement>(`[aria-controls="${wrap.id}"]`);
      const cy = pill ? (parseFloat(pill.style.getPropertyValue("--pill-cy")) / 100) * stage.clientHeight : NaN;
      const floor = Math.max(f.top - s.top + GAP, Number.isFinite(cy) ? cy + (pill?.offsetHeight ?? 0) / 2 + 12 : 0);

      let k = TIERS.findIndex((_, n) => bottom - need[n] >= floor);
      const squeezed = k < 0;
      if (squeezed) k = TIERS.length - 1;
      const top = squeezed ? floor : Math.max(floor, Math.min(natural, bottom - need[k]));
      wrap.dataset.fit = TIERS[k];
      wrap.style.top = `${top.toFixed(1)}px`;
      if (squeezed) wrap.style.maxHeight = `${Math.max(0, bottom - floor).toFixed(1)}px`;
      else wrap.style.removeProperty("max-height");
    };
    const later = () => {
      if (!raf) raf = requestAnimationFrame(fit);
    };

    const ro = new ResizeObserver(later);
    ro.observe(frame);
    ro.observe(stage);
    wide.addEventListener("change", later);
    document.fonts?.ready.then(later, () => undefined);
    // The Ask launcher mounts after hydration; measure again once it is in.
    const settle = window.setTimeout(later, 1500);
    later();
    return () => {
      window.clearTimeout(settle);
      ro.disconnect();
      wide.removeEventListener("change", later);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={root} className={styles.inner}>
      <p id={titleId} className={styles.title}>
        {POSE_RAIL.title}
        <span className={styles.liveDot} aria-hidden="true" />
      </p>
      <dl className={styles.rows}>
        {POSE_RAIL.rows.map((row, i) => (
          <div key={row.label} className={styles.row} style={{ ["--i" as string]: i }}>
            <dt className={styles.label}>{row.label}</dt>
            <dd className={styles.value}>
              <span>{row.value}</span>
              {row.instrument ? <Instrument kind={row.instrument} /> : null}
            </dd>
          </div>
        ))}
      </dl>
      <p className={styles.privacy}>{POSE_RAIL.privacy}</p>

      <div className={styles.gait} aria-hidden="true">
        <p className={styles.gaitTitle}>
          Gait cycle <span data-g="stride">0%</span>
        </p>
        <div className={styles.timeline}>
          {(["L", "R"] as const).map((s) => (
            <div key={s} className={styles.lane}>
              <span className={styles.laneSide}>{s}</span>
              <span className={styles.track}>
                {STANCE[s].map(([a, b]) => (
                  <span
                    key={a}
                    className={styles.stance}
                    style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%` }}
                  />
                ))}
              </span>
              <span className={styles.lanePhase} data-g={`phase-${s.toLowerCase()}`} />
            </div>
          ))}
          <span className={styles.cursor} data-g="cursor" />
          <span className={styles.legend}>
            <span className={styles.legendStance}>Stance</span>
            <span className={styles.legendSwing}>Swing</span>
          </span>
        </div>
        <canvas className={styles.signal} data-g="wave" />

        <dl className={styles.signals}>
          <div>
            <dt>Current phase</dt>
            <dd data-g="sig-phase" />
          </div>
          <div>
            <dt>Active limb</dt>
            <dd data-g="sig-limb" />
          </div>
          <div>
            <dt>Foot contact</dt>
            <dd data-g="sig-contact" />
          </div>
          <div>
            <dt>Stride phase</dt>
            <dd data-g="sig-stride" />
          </div>
        </dl>
        <ol className={styles.phases}>
          {HERO_GAIT.phases.map((p) => (
            <li key={p} data-phase-row="">
              <span>{PHASE_LABEL[p]}</span>
              <i data-side="l">L</i>
              <i data-side="r">R</i>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
