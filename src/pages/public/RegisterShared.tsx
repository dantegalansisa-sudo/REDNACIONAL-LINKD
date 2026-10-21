import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Check, ChevronDown, type LucideIcon } from 'lucide-react'

/** Stepper horizontal de los modales de registro */
export function RegStepper({ steps, current, className }: { steps: { title: string; sub: ReactNode }[]; current: number; className?: string }) {
  return (
    <ol className={clsx('grid gap-2', className)} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s.title} className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold',
                done ? 'bg-emerald-500 text-white' : active ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'bg-slate-200 text-slate-600')}>
                {done ? <Check size={18} strokeWidth={3} /> : i + 1}
              </span>
              <span className="relative h-[3px] flex-1 overflow-hidden rounded bg-slate-200">
                <span className={clsx('absolute inset-y-0 left-0 rounded', done ? 'w-full bg-emerald-500' : active ? 'w-1/2 bg-brand-600' : 'w-0')} />
              </span>
            </div>
            <div className="mt-1.5 pl-1 leading-tight sm:pl-11">
              <div className={clsx('text-[13px] font-semibold sm:text-[14px]', active || done ? 'text-ink' : 'text-slate-500')}>{s.title}</div>
              <div className={clsx('text-[11.5px] sm:text-[13px]', active ? 'text-brand-600' : 'text-slate-500')}>{s.sub}</div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Encabezado de bloque (icono + título + subtítulo) con franja azul clara */
export function BlockHead({ icon: Icon, title, sub, extra }: { icon: LucideIcon; title: ReactNode; sub?: ReactNode; extra?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-t-xl bg-[#eef4fd] px-4 py-2.5">
      <Icon size={24} className="mt-0.5 shrink-0 text-brand-600" fill="currentColor" fillOpacity={0.12} />
      <div className="min-w-0 flex-1">
        <h3 className="text-[16px] font-bold text-ink">{title} {extra}</h3>
        {sub && <p className="text-[12.5px] text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}

export function Field({ label, req, children, error, className }: { label: ReactNode; req?: boolean; children: ReactNode; error?: string; className?: string }) {
  return (
    <label className={clsx('block min-w-0', className)}>
      <span className="label">{label} {req && <span className="req">*</span>}</span>
      {children}
      {error && <span className="mt-0.5 block text-[11px] text-red-600">{error}</span>}
    </label>
  )
}

export function IconInput({ icon: Icon, iconClass, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon; iconClass?: string }) {
  return (
    <span className="relative flex items-center">
      <Icon size={17} className={clsx('pointer-events-none absolute left-3', iconClass ?? 'text-brand-600')} />
      <input {...props} className={clsx('input pl-10', className)} />
    </span>
  )
}

export function NativeSelect({ value, onChange, options, placeholder, disabled, invalid }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; disabled?: boolean; invalid?: boolean
}) {
  return (
    <span className="relative flex items-center">
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className={clsx('input appearance-none pr-8', disabled && 'bg-[#eef2f9] text-slate-500', !value && 'text-slate-400', invalid && '!border-red-400')}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-2.5 text-ink" />
    </span>
  )
}

/** Íconos SVG simples para WhatsApp */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.3-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.5-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" />
    </svg>
  )
}
