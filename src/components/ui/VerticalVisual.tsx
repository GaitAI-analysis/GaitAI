"use client";

import { useEffect, useRef } from "react";

/* Radar pulse — for Secure */
export function RadarPulse() {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="relative h-72 w-72">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border border-cyan-300/30"
            style={{
              animation: `radar-pulse 4s ease-out ${i * 1.3}s infinite`,
            }}
          />
        ))}
        <div className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_20px_#4FD1FF]" />
        <svg
          className="absolute inset-0 m-auto h-full w-full animate-spin-slow text-royal-400/60"
          viewBox="0 0 200 200"
        >
          <defs>
            <linearGradient id="radar-sweep" x1="100" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4FD1FF" stopOpacity="0" />
              <stop offset="1" stopColor="#4FD1FF" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path d="M 100 100 L 100 6 A 94 94 0 0 1 187 130 Z" fill="url(#radar-sweep)" opacity="0.35" />
        </svg>
        <style jsx>{`
          @keyframes radar-pulse {
            0% { transform: scale(0.4); opacity: 0.9; }
            80% { opacity: 0.05; }
            100% { transform: scale(1.4); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}

/* Heartbeat / gait waveform — for Care */
export function GaitWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let start = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const t = (performance.now() - start) / 1000;
      const midY = height / 2;

      // Soft grid
      ctx.strokeStyle = "rgba(148,163,184,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Main gait waveform (two overlapping curves: left + right leg)
      const drawCurve = (
        color: string,
        amplitude: number,
        phase: number,
        opacity: number,
        lineWidth: number
      ) => {
        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.globalAlpha = opacity;
        for (let x = 0; x <= width; x += 2) {
          const k = x / width;
          const phaseT = k * Math.PI * 4 + t * 1.5 + phase;
          // Compound wave reminiscent of gait cycle
          const y =
            midY +
            Math.sin(phaseT) * amplitude * 0.5 +
            Math.sin(phaseT * 2) * amplitude * 0.25 +
            Math.sin(phaseT * 0.5) * amplitude * 0.15;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      // Soft glow under curves
      ctx.shadowColor = "#7C3AED";
      ctx.shadowBlur = 24;
      drawCurve("#7C3AED", 38, 0, 0.85, 1.8);
      ctx.shadowColor = "#4FD1FF";
      drawCurve("#4FD1FF", 28, Math.PI / 1.5, 0.7, 1.4);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Cursor dot at right edge
      const cursorX = width - 6;
      const cursorPhase = 1 * Math.PI * 4 + t * 1.5;
      const cursorY =
        midY +
        Math.sin(cursorPhase) * 38 * 0.5 +
        Math.sin(cursorPhase * 2) * 38 * 0.25;
      const grad = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, 14);
      grad.addColorStop(0, "rgba(124,58,237,0.9)");
      grad.addColorStop(1, "rgba(124,58,237,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
