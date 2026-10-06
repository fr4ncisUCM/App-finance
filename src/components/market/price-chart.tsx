"use client";

import { useEffect, useId, useRef, useState } from "react";

type Point = { t: number; c: number };

const fmtNum = (v: number) =>
  new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: Math.abs(v) < 1 ? 4 : 2 }).format(v);

function fmtTime(t: number, intraday: boolean, long: boolean) {
  const opts: Intl.DateTimeFormatOptions = intraday
    ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
    : long
      ? { month: "short", year: "numeric" }
      : { day: "numeric", month: "short", year: "2-digit" };
  return new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", ...opts }).format(t);
}

/** Gráfico de precio interactivo: pasa el ratón para ver el precio de cada momento. */
export function PriceChart({ points, base, range }: { points: Point[]; base: number | null; range: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId();
  const height = 320;
  const pad = { top: 16, right: 64, bottom: 28, left: 8 };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (points.length < 2) {
    return <div className="flex h-80 items-center justify-center text-sm text-muted">No hay datos para este periodo.</div>;
  }

  const intraday = range === "1D" || range === "5D" || range === "1M";
  const long = range === "5A" || range === "MAX";
  const ref = base ?? points[0].c;
  const values = points.map((p) => p.c);
  const min = Math.min(...values, base ?? Infinity);
  const max = Math.max(...values, base ?? -Infinity);
  const span = max - min || 1;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  // En gráficos intradía se reparte por número de punto para no dejar huecos de noches y fines de semana.
  const x = (i: number) => pad.left + (i / (points.length - 1)) * innerW;
  const y = (v: number) => pad.top + (1 - (v - min) / span) * innerH;

  const last = points[points.length - 1].c;
  const up = last >= ref;
  const color = up ? "var(--up)" : "var(--down)";
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.c).toFixed(1)}`).join("");
  const area = `${line}L${x(points.length - 1)},${pad.top + innerH}L${x(0)},${pad.top + innerH}Z`;

  const yTicks = Array.from({ length: 5 }, (_, i) => min + (span * i) / 4);
  const xTicks = Array.from({ length: 5 }, (_, i) => Math.round((i / 4) * (points.length - 1)));

  const h = hover != null ? points[hover] : null;
  const hChange = h ? ((h.c - ref) / ref) * 100 : null;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const i = Math.round(((px - pad.left) / innerW) * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, i)));
  }

  return (
    <div ref={wrapRef} className="relative w-full select-none">
      <div className="mb-2 h-10 text-sm">
        {h ? (
          <>
            <span className="tabular text-base font-semibold">{fmtNum(h.c)}</span>
            <span className={`tabular ml-2 font-semibold ${hChange! >= 0 ? "text-up" : "text-down"}`}>
              {hChange! >= 0 ? "+" : "−"}
              {fmtNum(Math.abs(hChange!))} %
            </span>
            <span className="ml-2 text-muted">{fmtTime(h.t, intraday, false)}</span>
            <p className="text-xs text-muted">Variación respecto al {base != null ? "cierre anterior" : "inicio del periodo"}</p>
          </>
        ) : (
          <p className="pt-2 text-xs text-muted">Pasa el ratón por el gráfico para ver el precio en cada momento.</p>
        )}
      </div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        className="touch-none"
        role="img"
        aria-label="Gráfico de precio"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={pad.left} x2={pad.left + innerW} y1={y(v)} y2={y(v)} stroke="var(--grid)" strokeWidth={1} />
            <text x={width - pad.right + 8} y={y(v) + 4} fontSize={11} fill="var(--muted)" className="tabular">
              {fmtNum(v)}
            </text>
          </g>
        ))}
        {xTicks.map((i, k) => (
          <text
            key={k}
            x={x(i)}
            y={height - 8}
            fontSize={11}
            fill="var(--muted)"
            textAnchor={k === 0 ? "start" : k === xTicks.length - 1 ? "end" : "middle"}
          >
            {fmtTime(points[i].t, range === "1D", long)}
          </text>
        ))}
        {base != null && (
          <line x1={pad.left} x2={pad.left + innerW} y1={y(base)} y2={y(base)} stroke="var(--muted)" strokeDasharray="4 4" strokeWidth={1} opacity={0.6} />
        )}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        {h && hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="var(--muted)" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(h.c)} r={4.5} fill={color} stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>
    </div>
  );
}
