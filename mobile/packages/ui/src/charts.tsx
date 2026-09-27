import React, { useMemo, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText, Rect, G } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { radius, space } from "@gaitai/design-system";
import { useTheme } from "./theme";
import { Text } from "./primitives";

export interface SeriesPoint { t: number; v: number; label?: string; sub?: string }

/**
 * Line chart drawn to scale with a touchable readout. Touch or tap a point
 * to see its label, value and change; colours come from the theme so both
 * schemes read. Bounds and ticks are computed from the data, never guessed.
 */
export function LineChart({ points, unit, height = 180, color, fill = true, xLabel, formatX, formatV }: { points: SeriesPoint[]; unit?: string; height?: number; color?: string; fill?: boolean; xLabel?: string; formatX?: (t: number) => string; formatV?: (v: number) => string }) {
  const t = useTheme(); const [w, setW] = useState(0); const [sel, setSel] = useState<number | null>(null);
  const c = color ?? t.series[0];
  const pad = { l: 40, r: 12, t: 12, b: 26 };
  const geo = useMemo(() => {
    if (!points.length || !w) return null;
    const xs = points.map((p) => p.t), vs = points.map((p) => p.v);
    const x0 = Math.min(...xs), x1 = Math.max(...xs) || 1, vmin = Math.min(...vs), vmax = Math.max(...vs);
    const span = vmax - vmin || 1; const lo = vmin - span * 0.1, hi = vmax + span * 0.1;
    const X = (x: number) => pad.l + ((x - x0) / (x1 - x0 || 1)) * (w - pad.l - pad.r);
    const Y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (height - pad.t - pad.b);
    const d = points.map((p, i) => `${i ? "L" : "M"}${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)}`).join(" ");
    const area = `${d} L${X(points[points.length - 1].t).toFixed(1)},${(height - pad.b).toFixed(1)} L${X(points[0].t).toFixed(1)},${(height - pad.b).toFixed(1)} Z`;
    const ticks = [lo + (hi - lo) * 0.1, (lo + hi) / 2, hi - (hi - lo) * 0.1];
    return { X, Y, d, area, ticks, x0, x1 };
  }, [points, w, height]);
  const fx = formatX ?? ((x: number) => `${x.toFixed(0)}s`);
  const fv = formatV ?? ((v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)));
  const pick = (x: number) => { if (!geo) return; let best = 0, bd = 1e9; points.forEach((p, i) => { const d = Math.abs(geo.X(p.t) - x); if (d < bd) { bd = d; best = i; } }); if (best !== sel) { Haptics.selectionAsync().catch(() => {}); setSel(best); } };
  const s = sel != null ? points[sel] : null; const prev = sel != null && sel > 0 ? points[sel - 1] : null;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={`Chart of ${points.length} points${unit ? ` in ${unit}` : ""}; range ${points.length ? fv(Math.min(...points.map((p) => p.v))) : ""} to ${points.length ? fv(Math.max(...points.map((p) => p.v))) : ""}`}>
      <View style={{ minHeight: 40, marginBottom: space.xs }}>
        {s ? <Text variant="small"><Text variant="bodyStrong">{fv(s.v)}{unit ? ` ${unit}` : ""}</Text>{"  "}{s.label ?? fx(s.t)}{prev ? `  ·  ${s.v - prev.v >= 0 ? "+" : ""}${fv(s.v - prev.v)} vs previous` : ""}{s.sub ? `  ·  ${s.sub}` : ""}</Text> : <Text variant="mute">Touch the chart to read a point</Text>}
      </View>
      {geo && w ? (
        <Pressable onPressIn={(e) => pick(e.nativeEvent.locationX)} onTouchMove={(e) => pick(e.nativeEvent.locationX)} accessibilityRole="adjustable">
          <Svg width={w} height={height}>
            {geo.ticks.map((v, i) => <G key={i}><Line x1={pad.l} x2={w - pad.r} y1={geo.Y(v)} y2={geo.Y(v)} stroke={t.line} strokeWidth={StyleSheet.hairlineWidth} /><SvgText x={pad.l - 6} y={geo.Y(v) + 4} fontSize={10} fill={t.mute} textAnchor="end">{fv(v)}</SvgText></G>)}
            {fill ? <Path d={geo.area} fill={c} opacity={0.12} /> : null}
            <Path d={geo.d} stroke={c} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {points.length ? <Circle cx={geo.X(points[points.length - 1].t)} cy={geo.Y(points[points.length - 1].v)} r={4} fill={c} /> : null}
            {s ? <G><Line x1={geo.X(s.t)} x2={geo.X(s.t)} y1={pad.t} y2={height - pad.b} stroke={t.lineStrong} strokeDasharray="3 3" /><Circle cx={geo.X(s.t)} cy={geo.Y(s.v)} r={6} fill={t.bg} stroke={c} strokeWidth={2} /></G> : null}
            <SvgText x={pad.l} y={height - 8} fontSize={10} fill={t.mute}>{fx(geo.x0)}</SvgText>
            <SvgText x={w - pad.r} y={height - 8} fontSize={10} fill={t.mute} textAnchor="end">{xLabel ?? fx(geo.x1)}</SvgText>
          </Svg>
        </Pressable>
      ) : <View style={{ height }} />}
    </View>
  );
}

export function Sparkline({ points, color, height = 36, width = 96 }: { points: { v: number }[]; color?: string; height?: number; width?: number }) {
  const t = useTheme(); const c = color ?? t.accent;
  if (points.length < 2) return <View style={{ width, height }} />;
  const vs = points.map((p) => p.v), lo = Math.min(...vs), hi = Math.max(...vs) || 1;
  const d = points.map((p, i) => `${i ? "L" : "M"}${(i / (points.length - 1)) * width},${height - 2 - ((p.v - lo) / (hi - lo || 1)) * (height - 4)}`).join(" ");
  return <Svg width={width} height={height} accessibilityElementsHidden><Path d={d} stroke={c} strokeWidth={1.75} fill="none" strokeLinecap="round" /></Svg>;
}

/** Foot-contact timeline: two rows of ticks (left/right) over time. */
export function ContactTimeline({ contacts, duration }: { contacts: { t: number; v: number }[]; duration: number }) {
  const t = useTheme(); const [w, setW] = useState(0); const h = 64;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={`${contacts.length} foot contacts over ${duration.toFixed(0)} seconds`}>
      {w ? <Svg width={w} height={h}>
        {[["L", 18], ["R", 46]].map(([lab, y]) => <G key={lab as string}><Line x1={24} x2={w} y1={y as number} y2={y as number} stroke={t.line} /><SvgText x={0} y={(y as number) + 4} fontSize={11} fill={t.mute}>{lab as string}</SvgText></G>)}
        {contacts.map((k, i) => <Rect key={i} x={24 + (k.t / (duration || 1)) * (w - 28)} y={(k.v === 1 ? 18 : 46) - 9} width={3} height={18} rx={1.5} fill={k.v === 1 ? t.series[0] : t.series[1]} />)}
      </Svg> : <View style={{ height: h }} />}
    </View>
  );
}

/** Horizontal bar with a dot: how far a value sits between two of the user's own values. Never a clinical range. */
export function CompareBar({ from, to, unit }: { from: number; to: number; unit?: string }) {
  const t = useTheme(); const up = to >= from;
  return <View style={{ gap: 4 }}><View style={{ height: 8, borderRadius: radius.pill, backgroundColor: t.surface2, overflow: "hidden" }}><View style={{ width: `${Math.min(100, Math.max(6, (Math.abs(to - from) / Math.max(Math.abs(from), 1)) * 100))}%`, height: 8, backgroundColor: up ? t.success : t.warning, borderRadius: radius.pill }} /></View><Text variant="mute">{from}{unit ? ` ${unit}` : ""} → {to}{unit ? ` ${unit}` : ""}</Text></View>;
}
