/** Minigráfico del día. Verde si va por encima del cierre anterior, rojo si por debajo. */
export function Sparkline({ values, base, width = 96, height = 30 }: { values: number[]; base?: number | null; width?: number; height?: number }) {
  if (values.length < 2) return <svg width={width} height={height} aria-hidden />;
  const all = base != null ? [...values, base] : values;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * width;
  const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const last = values[values.length - 1];
  const up = last >= (base ?? values[0]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="overflow-visible">
      {base != null && <line x1={0} x2={width} y1={y(base)} y2={y(base)} stroke="var(--grid)" strokeDasharray="2 3" strokeWidth={1} />}
      <path d={d} fill="none" stroke={up ? "var(--up)" : "var(--down)"} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
