import { useEffect, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import {
  ArrowDown, ArrowUp, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, X,
  type LucideIcon,
} from 'lucide-react'

export { clsx }

/* ---------- Tonos reutilizables ---------- */
export type Tone = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray' | 'yellow' | 'pink' | 'teal' | 'navy'

export const toneBg: Record<Tone, string> = {
  blue: 'bg-brand-50 text-brand-600',
  green: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-orange-50 text-orange-500',
  red: 'bg-red-50 text-red-500',
  purple: 'bg-violet-50 text-violet-600',
  gray: 'bg-slate-100 text-slate-500',
  yellow: 'bg-amber-50 text-amber-500',
  pink: 'bg-pink-50 text-pink-500',
  teal: 'bg-teal-50 text-teal-600',
  navy: 'bg-navy-800 text-white',
}

export const toneHex: Record<Tone, string> = {
  blue: '#2f6bff', green: '#16a34a', orange: '#f59e0b', red: '#ef4444', purple: '#8b5cf6',
  gray: '#94a3b8', yellow: '#fbbf24', pink: '#ec4899', teal: '#14b8a6', navy: '#0c2463',
}

/* ---------- Iconos en círculo ---------- */
export function IconCircle({ icon: Icon, tone = 'blue', size = 'md', className }: {
  icon: LucideIcon; tone?: Tone; size?: 'sm' | 'md' | 'lg'; className?: string
}) {
  const s = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-11 w-11'
  const i = size === 'sm' ? 16 : size === 'lg' ? 26 : 21
  return (
    <span className={clsx('inline-flex shrink-0 items-center justify-center rounded-full', s, toneBg[tone], className)}>
      <Icon size={i} strokeWidth={2} />
    </span>
  )
}

/* ---------- Badges de estado ---------- */
export function Badge({ tone = 'green', children, dot = true, icon, className }: {
  tone?: Tone; children: ReactNode; dot?: boolean; icon?: boolean; className?: string
}) {
  const styles: Record<Tone, string> = {
    green: 'bg-emerald-50 text-emerald-700',
    orange: 'bg-orange-50 text-orange-600',
    yellow: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-brand-50 text-brand-700',
    purple: 'bg-violet-50 text-violet-700',
    gray: 'bg-slate-100 text-slate-600',
    pink: 'bg-pink-50 text-pink-600',
    teal: 'bg-teal-50 text-teal-700',
    navy: 'bg-navy-800 text-white',
  }
  return (
    <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-medium', styles[tone], className)}>
      {icon ? <CheckCircle2 size={13} className="shrink-0" /> : dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  )
}

/** Chip de modalidad (CT, MR, RX, US, MG…) */
const modalityTone: Record<string, string> = {
  CT: 'bg-brand-50 text-brand-700 border-brand-100', TC: 'bg-brand-50 text-brand-700 border-brand-100',
  MR: 'bg-violet-50 text-violet-700 border-violet-100', RM: 'bg-violet-50 text-violet-700 border-violet-100',
  RX: 'bg-red-50 text-red-600 border-red-100', XR: 'bg-slate-100 text-ink border-slate-200',
  US: 'bg-pink-50 text-pink-600 border-pink-100', MG: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
  PET: 'bg-amber-50 text-amber-600 border-amber-100', NM: 'bg-teal-50 text-teal-700 border-teal-100',
}
export function Modality({ m, className }: { m: string; className?: string }) {
  return (
    <span className={clsx('inline-flex min-w-[30px] items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold', modalityTone[m] ?? 'bg-slate-100 text-slate-600 border-slate-200', className)}>
      {m}
    </span>
  )
}

/* ---------- Tarjeta KPI (admin) ---------- */
export function Kpi({ icon, tone = 'blue', value, label, sub, trend, trendTone, className, children }: {
  icon: LucideIcon; tone?: Tone; value: ReactNode; label: ReactNode; sub?: ReactNode
  trend?: 'up' | 'down'; trendTone?: 'good' | 'bad'; className?: string; children?: ReactNode
}) {
  const good = trendTone ? trendTone === 'good' : true
  return (
    <div className={clsx('card flex min-w-0 items-center gap-3 px-4 py-3.5', className)}>
      <IconCircle icon={icon} tone={tone} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[22px] font-bold leading-tight text-ink">{value}</div>
        <div className="truncate text-[13px] text-ink/80">{label}</div>
        {sub && (
          <div className={clsx('mt-0.5 flex items-center gap-1 truncate text-[12px]',
            trend ? (good ? 'text-emerald-600' : 'text-red-500') : 'text-slate-500')}>
            {trend === 'up' && <ArrowUp size={13} />}
            {trend === 'down' && <ArrowDown size={13} />}
            {sub}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

/* ---------- Encabezado de página (admin) ---------- */
export function PageHeader({ icon: Icon, title, subtitle, actions, breadcrumb }: {
  icon: LucideIcon; title: string; subtitle: string; actions?: ReactNode; breadcrumb?: ReactNode
}) {
  return (
    <div className="mb-4">
      {breadcrumb && <div className="mb-1 text-[12px] text-slate-500">{breadcrumb}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30">
            <Icon size={26} />
          </span>
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold leading-tight text-ink sm:text-[27px]">{title}</h1>
            <p className="text-[13.5px] text-brand-800/80">{subtitle}</p>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/* ---------- Card con título ---------- */
export function Panel({ title, icon: Icon, action, children, className, bodyClass, subtitle }: {
  title?: ReactNode; icon?: LucideIcon; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string; subtitle?: ReactNode
}) {
  return (
    <section className={clsx('card flex min-w-0 flex-col', className)}>
      {(title || action) && (
        <div className="card-head">
          <div className="min-w-0">
            <h3 className="card-title">
              {Icon && <Icon size={18} className="shrink-0 text-brand-600" />}
              <span className="truncate">{title}</span>
            </h3>
            {subtitle && <p className="mt-0.5 text-[12px] text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={clsx('min-w-0 flex-1 px-4 pb-4', bodyClass)}>{children}</div>
    </section>
  )
}

export function MoreLink({ children = 'Ver más', onClick, boxed }: { children?: ReactNode; onClick?: () => void; boxed?: boolean }) {
  return (
    <button onClick={onClick} className={clsx('link-more', boxed && 'rounded-md border border-brand-200 px-2 py-1')}>
      {children} <ChevronRight size={13} />
    </button>
  )
}

/* ---------- Select simple ---------- */
export function Select({ value, options, onChange, icon: Icon, className, placeholder }: {
  value?: string; options: string[]; onChange?: (v: string) => void; icon?: LucideIcon; className?: string; placeholder?: string
}) {
  const [v, setV] = useState(value ?? options[0] ?? '')
  return (
    <label className={clsx('relative flex items-center', className)}>
      {Icon && <Icon size={16} className="pointer-events-none absolute left-3 text-brand-600" />}
      <select
        value={v}
        onChange={(e) => { setV(e.target.value); onChange?.(e.target.value) }}
        className={clsx('input appearance-none pr-8', Icon && 'pl-9', v === '' && 'text-slate-400')}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-2.5 text-slate-500" />
    </label>
  )
}

/* ---------- Checkbox / Toggle ---------- */
export function Checkbox({ checked, onChange, label, className }: {
  checked: boolean; onChange?: (v: boolean) => void; label?: ReactNode; className?: string
}) {
  return (
    <label className={clsx('inline-flex cursor-pointer select-none items-center gap-2 text-[12.5px] text-ink/90', className)}>
      <span
        onClick={(e) => { e.preventDefault(); onChange?.(!checked) }}
        className={clsx('flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded border transition',
          checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white')}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      {label && <span onClick={(e) => { e.preventDefault(); onChange?.(!checked) }}>{label}</span>}
    </label>
  )
}

export function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!on)}
      className={clsx('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-brand-600' : 'bg-slate-300')}
      aria-pressed={on}
    >
      <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

/* ---------- Tabs ---------- */
export function Tabs({ tabs, active, onChange, className, size = 'sm' }: {
  tabs: (string | { label: string; icon?: LucideIcon })[]; active: number; onChange: (i: number) => void; className?: string; size?: 'sm' | 'md'
}) {
  return (
    <div className={clsx('scroll-soft flex gap-1 overflow-x-auto border-b border-[#e6edf8]', className)}>
      {tabs.map((t, i) => {
        const label = typeof t === 'string' ? t : t.label
        const Icon = typeof t === 'string' ? undefined : t.icon
        return (
          <button
            key={label}
            onClick={() => onChange(i)}
            className={clsx('-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 font-medium transition',
              size === 'md' ? 'py-3 text-[13.5px]' : 'py-2 text-[12.5px]',
              i === active ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-brand-700')}
          >
            {Icon && <Icon size={17} />}
            {label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Paginación ---------- */
export function Pagination({ text, pages = [1, 2, 3, 4, 5], last, perPage = true }: {
  text: string; pages?: number[]; last?: number; perPage?: boolean
}) {
  const [p, setP] = useState(1)
  const btn = 'flex h-8 min-w-8 items-center justify-center rounded-md border border-[#d7e1f2] bg-white px-2 text-[12.5px] text-ink hover:border-brand-400'
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f8] px-4 py-3">
      <span className="text-[12.5px] text-brand-800/80">{text}</span>
      <div className="flex items-center gap-1.5">
        <button className={btn} onClick={() => setP(Math.max(1, p - 1))}><ChevronLeft size={15} /></button>
        {pages.map((n) => (
          <button key={n} onClick={() => setP(n)} className={clsx(btn, n === p && '!border-brand-600 !bg-brand-600 !text-white')}>{n}</button>
        ))}
        {last && <><span className={clsx(btn, 'pointer-events-none')}>…</span><button onClick={() => setP(last)} className={clsx(btn, last === p && '!border-brand-600 !bg-brand-600 !text-white')}>{last.toLocaleString('en-US')}</button></>}
        <button className={btn} onClick={() => setP(p + 1)}><ChevronRight size={15} /></button>
      </div>
      {perPage && <Select options={['10 por página', '25 por página', '50 por página']} className="w-[140px]" />}
    </div>
  )
}

export function DotsButton({ onClick }: { onClick?: () => void }) {
  return <button className="dots-btn" onClick={onClick} aria-label="Acciones"><MoreHorizontal size={16} /></button>
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, children, className, closeOnBackdrop = true, hideClose }: {
  open: boolean; onClose: () => void; children: ReactNode; className?: string; closeOnBackdrop?: boolean; hideClose?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !hideClose) onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, onClose, hideClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-navy-950/55 p-3 backdrop-blur-[3px] sm:items-center sm:p-6"
      onMouseDown={(e) => { if (closeOnBackdrop && e.target === e.currentTarget) onClose() }}>
      <div className={clsx('relative w-full overflow-hidden rounded-2xl bg-white shadow-2xl', className)}>
        {!hideClose && (
          <button onClick={onClose} className="absolute right-4 top-4 z-20 rounded-full p-1.5 text-ink hover:bg-slate-100" aria-label="Cerrar">
            <X size={24} />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

/* ---------- Avatar ---------- */
export function Avatar({ name, src, size = 32, tone = 'blue', className }: {
  name?: string; src?: string; size?: number; tone?: Tone; className?: string
}) {
  const initials = (name ?? '').replace(/^(Dr\.|Dra\.|Lic\.)\s*/, '').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  if (src) return <img src={src} alt={name} style={{ width: size, height: size }} className={clsx('shrink-0 rounded-full object-cover', className)} />
  const tones: Record<string, string> = { blue: 'bg-brand-100 text-brand-700', navy: 'bg-navy-800 text-white', gray: 'bg-slate-200 text-slate-600', purple: 'bg-violet-100 text-violet-700', green: 'bg-emerald-100 text-emerald-700' }
  return (
    <span style={{ width: size, height: size, fontSize: size * 0.38 }} className={clsx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', tones[tone] ?? tones.blue, className)}>
      {initials}
    </span>
  )
}

/** Silueta de usuario (como en las maquetas) */
export function UserSilhouette({ size = 120, className }: { size?: number; className?: string }) {
  return (
    <span style={{ width: size, height: size }} className={clsx('relative inline-flex shrink-0 items-end justify-center overflow-hidden rounded-full bg-brand-100', className)}>
      <svg viewBox="0 0 100 100" className="h-[78%] w-[78%]" aria-hidden>
        <circle cx="50" cy="32" r="18" fill="#0b57f0" />
        <path d="M14 92c0-20 16-34 36-34s36 14 36 34z" fill="#0b57f0" />
      </svg>
    </span>
  )
}

/* ---------- Pares etiqueta/valor ---------- */
export function InfoRow({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={clsx('grid grid-cols-[42%_1fr] gap-2 border-b border-[#eef2f8] py-1.5 text-[12.5px] last:border-0', className)}>
      <span className="text-brand-800/70">{label}</span>
      <span className="min-w-0 text-ink">{children}</span>
    </div>
  )
}

/* ---------- Estrellas ---------- */
export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)))
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
            <defs>
              <linearGradient id={`s${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="#f5a623" />
                <stop offset={`${fill * 100}%`} stopColor="#d6dbe5" />
              </linearGradient>
            </defs>
            <path fill={`url(#s${i}-${Math.round(fill * 100)})`} d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
          </svg>
        )
      })}
    </span>
  )
}

/* ---------- Barra horizontal de progreso ---------- */
export function Bar({ value, max = 100, color = '#2f6bff', className, height = 10 }: {
  value: number; max?: number; color?: string; className?: string; height?: number
}) {
  return (
    <div className={clsx('w-full overflow-hidden rounded-sm bg-[#e8eef8]', className)} style={{ height }}>
      <div className="h-full rounded-sm" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
    </div>
  )
}

/* ---------- Search input ---------- */
export function SearchInput({ placeholder, className }: { placeholder: string; className?: string }) {
  return (
    <label className={clsx('relative flex items-center', className)}>
      <svg className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input className="input pl-9" placeholder={placeholder} />
    </label>
  )
}

/** Tabla con scroll horizontal en pantallas pequeñas */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('scroll-soft w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  )
}
