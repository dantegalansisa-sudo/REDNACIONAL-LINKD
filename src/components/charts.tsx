import { useState, type ReactNode } from 'react'

export type Slice = { label: string; value: number; color: string }

/** Gráfico de dona con etiqueta central */
export function Donut({ data, size = 150, thickness = 26, center, gap = 0 }: {
  data: Slice[]; size?: number; thickness?: number; center?: ReactNode; gap?: number
}) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f8" strokeWidth={thickness} />
        {data.map((d, i) => {
          const len = (d.value / total) * c
          const el = (
            <circle
              key={d.label}
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={d.color}
              strokeWidth={hover === i ? thickness + 4 : thickness}
              strokeDasharray={`${Math.max(0, len - gap)} ${c - Math.max(0, len - gap)}`}
              strokeDashoffset={-offset}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ transition: 'stroke-width .15s' }}
            >
              <title>{`${d.label}: ${d.value.toLocaleString('en-US')}`}</title>
            </circle>
          )
          offset += len
          return el
        })}
      </svg>
      {center && <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>}
    </div>
  )
}

/** Leyenda para donas: label · valor · % */
export function Legend({ data, showPct = true, className = '' }: { data: Slice[]; showPct?: boolean; className?: string }) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1
  return (
    <ul className={`min-w-0 flex-1 space-y-1.5 text-[12.5px] ${className}`}>
      {data.map((d) => (
        <li key={d.label} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
          <span className="min-w-0 flex-1 truncate text-ink/90">{d.label}</span>
          <span className="tabular-nums text-ink">{d.value.toLocaleString('en-US')}</span>
          {showPct && <span className="w-12 text-right tabular-nums text-slate-500">{((d.value / total) * 100).toFixed(1)}%</span>}
        </li>
      ))}
    </ul>
  )
}

/** Barras verticales (una o varias series) */
export function Bars({ labels, series, height = 150, max, yTicks = 4, showValues = false, barWidth = 0.6 }: {
  labels: string[]
  series: { name: string; color: string; values: number[] }[]
  height?: number; max?: number; yTicks?: number; showValues?: boolean; barWidth?: number
}) {
  const W = 600
  const H = height
  const padL = 34, padB = 20, padT = showValues ? 16 : 6
  const m = max ?? Math.max(...series.flatMap((s) => s.values)) * 1.1
  const plotW = W - padL - 4
  const plotH = H - padB - padT
  const slot = plotW / labels.length
  const bw = (slot * barWidth) / series.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="none" style={{ maxHeight: height + 20 }}>
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = (m / yTicks) * i
        const y = padT + plotH - (v / m) * plotH
        return (
          <g key={i}>
            <line x1={padL} x2={W} y1={y} y2={y} stroke="#eef2f8" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#64748b">{Math.round(v) >= 1000 ? Math.round(v).toLocaleString('en-US') : Math.round(v)}</text>
          </g>
        )
      })}
      {labels.map((l, i) => (
        <g key={l + i}>
          {series.map((s, j) => {
            const v = s.values[i] ?? 0
            const h = (v / m) * plotH
            const x = padL + i * slot + (slot - bw * series.length) / 2 + j * bw
            return (
              <g key={s.name}>
                <rect x={x} y={padT + plotH - h} width={Math.max(1, bw - 1.5)} height={h} rx={2} fill={s.color}>
                  <title>{`${l} · ${s.name}: ${v.toLocaleString('en-US')}`}</title>
                </rect>
                {showValues && <text x={x + bw / 2} y={padT + plotH - h - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0a1f5c">{v}</text>}
              </g>
            )
          })}
          <text x={padL + i * slot + slot / 2} y={H - 5} textAnchor="middle" fontSize="10" fill="#475569">{l}</text>
        </g>
      ))}
    </svg>
  )
}

/** Líneas/áreas multi-serie */
export function Lines({ labels, series, height = 170, max, area = true, yTicks = 4 }: {
  labels: string[]; series: { name: string; color: string; values: number[] }[]; height?: number; max?: number; area?: boolean; yTicks?: number
}) {
  const W = 600, H = height, padL = 36, padB = 20, padT = 6
  const m = max ?? Math.max(...series.flatMap((s) => s.values)) * 1.1
  const plotW = W - padL - 6, plotH = H - padB - padT
  const n = series[0]?.values.length ?? 1
  const x = (i: number) => padL + (i / (n - 1)) * plotW
  const y = (v: number) => padT + plotH - (v / m) * plotH
  const step = Math.max(1, Math.round((n - 1) / (labels.length - 1)))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="none">
      <defs>
        {series.map((s, i) => (
          <linearGradient key={i} id={`lg-${s.name}-${i}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={s.color} stopOpacity=".28" />
            <stop offset="1" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = (m / yTicks) * i
        return (
          <g key={i}>
            <line x1={padL} x2={W} y1={y(v)} y2={y(v)} stroke="#eef2f8" />
            <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#64748b">{Math.round(v).toLocaleString('en-US')}</text>
          </g>
        )
      })}
      {series.map((s, si) => {
        const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
        return (
          <g key={s.name}>
            {area && si === 0 && <path d={`${d} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#lg-${s.name}-${si})`} />}
            <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
          </g>
        )
      })}
      {labels.map((l, i) => (
        <text key={l} x={x(Math.min(n - 1, i * step))} y={H - 5} textAnchor="middle" fontSize="10" fill="#475569">{l}</text>
      ))}
    </svg>
  )
}

/** Medidor circular (CPU/RAM/Disco) */
export function Gauge({ value, label, color = '#2f6bff', size = 70 }: { value: number; label: string; color?: string; size?: number }) {
  const r = size / 2 - 6, c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8eef8" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
        <span className="text-[9px] font-semibold text-slate-500">{label}</span>
        <span className="text-[14px] font-bold text-ink">{value}%</span>
      </div>
    </div>
  )
}

/** Sparkline mini (para tarjetas) */
export function Spark({ values, color = '#2f6bff', w = 90, h = 28 }: { values: number[]; color?: string; w?: number; h?: number }) {
  const m = Math.max(...values), mi = Math.min(...values)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${(i / (values.length - 1)) * w},${h - ((v - mi) / (m - mi || 1)) * (h - 2) - 1}`).join(' ')
  return <svg width={w} height={h}><path d={d} fill="none" stroke={color} strokeWidth={1.8} /></svg>
}
