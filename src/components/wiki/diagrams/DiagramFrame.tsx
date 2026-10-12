"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, Minus, Plus, X } from "lucide-react";
import styles from "./diagrams.module.css";

const STYLE_PROPS = ["fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "font-family", "font-size", "font-weight", "font-style", "letter-spacing", "opacity", "text-anchor"] as const;

/** Clone the live SVG with its computed styles inlined so the file stands alone in the current theme. */
function standalone(svg: SVGSVGElement, suffix: string): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const source = svg.querySelectorAll<SVGElement>("*");
  const target = clone.querySelectorAll<SVGElement>("*");
  source.forEach((element, i) => {
    const computed = getComputedStyle(element);
    for (const prop of STYLE_PROPS) {
      const value = computed.getPropertyValue(prop);
      if (value) target[i].setAttribute(prop, value);
    }
    target[i].removeAttribute("class");
  });
  clone.removeAttribute("class");
  // The scroll region is transparent; use the figure's canvas token so saved
  // figures retain their light/dark background outside the website.
  const canvas = getComputedStyle(svg.closest("figure") ?? svg).getPropertyValue("--d-canvas").trim();
  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("width", "100%"); background.setAttribute("height", "100%"); background.setAttribute("fill", canvas || "#fff");
  clone.insertBefore(background, clone.firstChild);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("style", "font-family: Georama, system-ui, sans-serif");
  const serialized = clone.outerHTML.replace(/id="([^"]+)"/g, `id="$1${suffix}"`).replace(/url\(#([^)]+)\)/g, `url(#$1${suffix})`).replace(/aria-labelledby="([^"]+)"/g, (_, ids: string) => `aria-labelledby="${ids.split(" ").map((id) => id + suffix).join(" ")}"`);
  const parsed = new DOMParser().parseFromString(serialized, "image/svg+xml").documentElement as unknown as SVGSVGElement;
  return parsed;
}

/** Read on click, never during render: the server has no document. */
const themeName = () => document.documentElement.classList.contains("light") ? "light" : "dark";

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = name; link.rel = "noopener";
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function DiagramFrame({ id, title, kicker, minWidth, children, caption, alternative }: {
  id: string; title: string; kicker: ReactNode; minWidth: number; children: ReactNode; caption: ReactNode; alternative: ReactNode;
}) {
  const figure = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const zoomBody = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [nativeWidth, setNativeWidth] = useState(1000);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => setEnhanced(true), []);

  const live = () => figure.current?.querySelector<SVGSVGElement>(`[data-frame-svg] svg`) ?? null;
  const saveSvg = useCallback(() => {
    const svg = live(); if (!svg) return;
    const text = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(standalone(svg, "-export"))}`;
    download(`${id}-${themeName()}.svg`, new Blob([text], { type: "image/svg+xml;charset=utf-8" }));
    setStatus("SVG saved");
  }, [id]);

  const savePng = useCallback(async () => {
    const svg = live(); if (!svg) return;
    const [, , w, h] = (svg.getAttribute("viewBox") ?? "0 0 1000 600").split(/\s+/).map(Number);
    const text = new XMLSerializer().serializeToString(standalone(svg, "-png"));
    const scale = 2.5;
    const image = new Image();
    const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml;charset=utf-8" }));
    try {
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("render")); image.src = url; });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => { if (blob) { download(`${id}-${themeName()}.png`, blob); setStatus("PNG saved"); } else setStatus("PNG export unavailable"); }, "image/png");
    } catch { setStatus("PNG export unavailable here; the SVG download works"); } finally { URL.revokeObjectURL(url); }
  }, [id]);

  const open = useCallback(() => {
    const svg = live(); const body = zoomBody.current; const element = dialog.current;
    if (!svg || !body || !element) return;
    body.replaceChildren(standalone(svg, "-zoom"));
    setNativeWidth(svg.viewBox.baseVal.width);
    setZoom(1);
    body.scrollTo(0, 0);
    setIsOpen(true);
    element.showModal();
  }, []);

  useEffect(() => { if (zoomBody.current) zoomBody.current.style.setProperty("--zoom-width", `${Math.round(zoom * nativeWidth)}px`); }, [zoom, nativeWidth]);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; };
  }, [isOpen]);
  const fit = () => {
    const body = zoomBody.current;
    if (!body) return;
    const computed = getComputedStyle(body);
    setZoom(Math.min(1, (body.clientWidth - parseFloat(computed.paddingLeft) - parseFloat(computed.paddingRight)) / nativeWidth));
    body.scrollTo(0, 0);
  };

  return <figure ref={figure} className={styles.figure} id={id}>
    <div className={styles.head}>
      <span className={styles.kicker}>{kicker}</span>
      {enhanced && <div className={styles.tools} role="group" aria-label={`Tools for ${title}`}>
        <button type="button" onClick={open}><Maximize2 size={14} aria-hidden="true" />Enlarge</button>
        <button type="button" onClick={saveSvg} title="Download this figure as SVG">SVG</button>
        <button type="button" onClick={savePng} title="Download this figure as PNG">PNG</button>
        <span role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{status}</span>
      </div>}
    </div>
    <div className={styles.scroll} role="region" tabIndex={0} aria-label={`${title}. Scroll horizontally if the diagram is wider than the screen.`} data-frame-svg style={{ ["--d-min" as string]: `${minWidth}px` }}>{children}</div>
    <p className={styles.hint}>Scroll to explore · Enlarge for a readable full-size view</p>
    {caption}
    {alternative}
    <dialog ref={dialog} className={styles.dialog} aria-label={`${title}, enlarged`} onClose={() => setIsOpen(false)} onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }}>
      <div className={styles.dialogHead}>
        <h2>{title}</h2>
        <div className={styles.zoom} role="group" aria-label="Zoom">
          <button type="button" disabled={zoom <= 0.25} onClick={() => setZoom((z) => Math.max(0.25, Math.round((z - 0.25) * 4) / 4))} aria-label="Zoom out"><Minus size={16} aria-hidden="true" /></button>
          <span role="status" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button type="button" disabled={zoom >= 4} onClick={() => setZoom((z) => Math.min(4, Math.round((z + 0.25) * 4) / 4))} aria-label="Zoom in"><Plus size={16} aria-hidden="true" /></button>
          <button type="button" onClick={fit}>Fit</button>
          <button type="button" onClick={() => setZoom(1)} aria-label="Actual size, 100 percent">100%</button>
        </div>
        <button type="button" className={styles.close} onClick={() => dialog.current?.close()}><X size={16} aria-hidden="true" />Close</button>
      </div>
      <div ref={zoomBody} className={styles.dialogBody} tabIndex={0} role="region" aria-label="Enlarged diagram. Scroll or use arrow keys to explore." />
      <p className={styles.viewerHint}>Scroll to explore the figure. Fit shows the whole diagram; 100% restores the original reading size.</p>
    </dialog>
  </figure>;
}
