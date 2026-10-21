import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { BRAND } from '../config/brand'

/** Logotipo oficial RNS — Red Nacional de Salud (archivo provisto por el cliente) */
export function Logo({ size = 'md', to = '/', className }: {
  size?: 'sm' | 'md' | 'lg'; subtitle?: string; dark?: boolean; to?: string | null; className?: string
}) {
  const h = size === 'sm' ? 'h-10' : size === 'lg' ? 'h-16' : 'h-12'
  const content = <img src="/img/logos/rns.png" alt="RNS — Red Nacional de Salud" className={clsx('w-auto shrink-0 object-contain', h, className)} />
  return to ? <Link to={to} aria-label={BRAND.domain} className="inline-flex shrink-0">{content}</Link> : content
}

/** Logo institucional RNS (imagen provista por el cliente) — usado en el panel de administración */
export function RnsLogo({ className }: { className?: string }) {
  return <img src="/img/logos/rns.png" alt="Red Nacional de Salud" className={clsx('object-contain', className)} />
}

/** Firma de desarrolladores HDCO × LINKDICOM */
export function PartnersMark({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className="flex items-center gap-1.5">
        <span className={clsx('flex h-9 w-9 items-center justify-center rounded-full', dark ? 'bg-white text-brand-700' : 'bg-brand-600 text-white')}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 12c3-6 13-6 16 0M4 12c3 6 13 6 16 0" /><circle cx="12" cy="12" r="2.5" fill="currentColor" /></svg>
        </span>
        <span className="leading-none">
          <span className={clsx('block text-[22px] font-extrabold tracking-tight', dark ? 'text-white' : 'text-navy-900')}>HDCO</span>
          <span className={clsx('block text-[6.5px] font-semibold tracking-wide', dark ? 'text-white/70' : 'text-navy-900/70')}>HEALTH DATA CONSULTING</span>
        </span>
      </div>
      <span className={clsx('text-xl font-light', dark ? 'text-white/70' : 'text-slate-500')}>×</span>
      <span className="leading-none">
        <span className="block text-[22px] font-extrabold tracking-tight">
          <span className={dark ? 'text-white' : 'text-slate-700'}>LINK</span><span className="text-accent-orange">DICOM</span>
        </span>
        <span className={clsx('block text-center text-[7px] font-semibold tracking-[0.35em]', dark ? 'text-white/70' : 'text-slate-600')}>CONECTA Y AVANZA</span>
      </span>
    </div>
  )
}
