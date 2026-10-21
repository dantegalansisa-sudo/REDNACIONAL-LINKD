import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowRight, ChevronDown, Menu, Search, User, X } from 'lucide-react'
import { Logo, PartnersMark } from '../components/Logo'
import { BRAND } from '../config/brand'

const NAV = [
  { to: '/', label: 'Inicio' },
  { to: '/sobre-el-proyecto', label: 'Sobre el Proyecto' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/estadisticas', label: 'Estadísticas' },
  { to: '/#enlaces', label: 'Enlaces de Interés' },
  { to: '/contacto', label: 'Contacto' },
]

function LoginMenu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const items = [
    { img: '/img/doctor-movil.webp', title: 'Médico', sub: 'Radiólogo o Referidor', to: '/medico/login' },
    { img: '/img/paciente-senora.webp', title: 'Paciente', sub: 'Acceso al portal de pacientes', to: '/paciente/login' },
  ]
  return (
    <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[280px] rounded-2xl border border-[#e3eaf6] bg-white p-2 shadow-soft">
      {items.map((it) => (
        <button key={it.title} onClick={() => { onClose(); navigate(it.to) }}
          className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-brand-50">
          <img src={it.img} alt="" className="h-14 w-14 rounded-lg object-cover" />
          <span className="flex-1">
            <span className="block font-serif text-[17px] font-bold text-ink">{it.title}</span>
            <span className="block text-[12px] leading-tight text-slate-500">{it.sub}</span>
          </span>
          <ArrowRight size={17} className="text-ink" />
        </button>
      ))}
      <Link to="/admin/login" onClick={onClose} className="mt-1 block border-t border-[#eef2f8] px-3 pt-2 pb-1 text-[12px] text-slate-500 hover:text-brand-700">
        Acceso administrativo →
      </Link>
    </div>
  )
}

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [search, setSearch] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  useEffect(() => { setMobile(false); setOpen(false) }, [pathname, hash])

  const isActive = (to: string) => (to === '/' ? pathname === '/' && !hash : to.startsWith('/#') ? hash === to.slice(1) : pathname.startsWith(to))

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8eef8] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo size="sm" className="h-10 sm:h-12" />
        <nav className="ml-auto hidden items-center gap-1 xl:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to}
              className={clsx('relative px-3 py-2 text-[14px] transition', isActive(n.to)
                ? 'font-medium text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:bg-ink'
                : 'text-ink/80 hover:text-ink')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3 xl:ml-4">
          <div className="relative hidden sm:block">
            <button onClick={() => setSearch(!search)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfe7f5] text-ink hover:bg-brand-50" aria-label="Buscar"><Search size={19} /></button>
            {search && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-72 rounded-xl border border-[#e3eaf6] bg-white p-2 shadow-soft">
                <input autoFocus className="input" placeholder="Buscar en el sitio…" />
              </div>
            )}
          </div>
          <div className="relative" ref={ref}>
            <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full bg-brand-600 px-3 py-2.5 text-[14.5px] sm:px-5 sm:py-3 font-semibold text-white shadow-md shadow-brand-600/30 hover:bg-brand-700">
              <User size={18} /> <span className="hidden sm:inline">Iniciar Sesión</span> <ChevronDown size={16} className={clsx('hidden transition sm:block', open && 'rotate-180')} />
            </button>
            {open && <LoginMenu onClose={() => setOpen(false)} />}
          </div>
          <button className="rounded-md p-1.5 xl:hidden" onClick={() => setMobile(!mobile)} aria-label="Menú">{mobile ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
      </div>
      {mobile && (
        <nav className="border-t border-[#eef2f8] bg-white px-4 py-2 xl:hidden">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={clsx('block rounded-lg px-3 py-2.5 text-[15px]', isActive(n.to) ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink')}>{n.label}</NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}

const FOOT = [
  { title: 'Proyecto', links: [['Sobre el proyecto', '/sobre-el-proyecto'], ['Objetivos', '/sobre-el-proyecto#objetivos'], ['Alcance', '/sobre-el-proyecto#alcance'], ['Beneficios', '/#beneficios']] },
  { title: 'Servicios', links: [['Para Radiólogos', '/registro/medico'], ['Para Referidores', '/registro/medico'], ['Para Pacientes', '/registro/paciente'], ['Hospitales', '/servicios']] },
  { title: 'Recursos', links: [['Documentación', '/servicios'], ['Enlaces de Interés', '/#enlaces'], ['Preguntas Frecuentes', '/contacto#faq'], ['Contacto', '/contacto']] },
]

function Social({ d, label }: { d: ReactNode; label: string }) {
  return <a href="#" aria-label={label} className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-navy-900 hover:bg-brand-100"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">{d}</svg></a>
}

export function PublicFooter({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <footer className="relative overflow-hidden bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <span className="inline-flex rounded-xl bg-white px-3 py-2"><Logo size="sm" to="/" className="h-9" /></span>
          <span className="hidden h-12 w-px bg-white/25 sm:block" />
          <span className="text-[16px] text-white/90">Desarrollado por empresas dominicanas</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent" />
      </footer>
    )
  }
  return (
    <footer className="bg-gradient-to-b from-navy-900 to-navy-950 text-white">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.5fr] lg:px-10">
        <div>
          <span className="inline-flex rounded-xl bg-white px-3 py-2"><Logo size="sm" to="/" className="h-9" /></span>
          <p className="mt-4 max-w-[300px] text-[13px] leading-relaxed text-white/80">
            Una red nacional de información diagnóstica al servicio de una salud más conectada, eficiente y accesible para todos los dominicanos.
          </p>
        </div>
        {FOOT.map((c) => (
          <div key={c.title}>
            <h4 className="mb-2 text-[13px] font-semibold text-white">{c.title}</h4>
            <ul className="space-y-1.5">
              {c.links.map(([l, to]) => <li key={l}><Link to={to} className="text-[12.5px] text-white/75 hover:text-white">{l}</Link></li>)}
            </ul>
          </div>
        ))}
        <div>
          <h4 className="mb-4 text-[13px] text-white/90">Desarrollado con tecnología dominicana por:</h4>
          <PartnersMark dark />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-6 py-4 text-[12px] text-white/70 sm:flex-row lg:px-10">
          <span>© {BRAND.year} {BRAND.domain}. Todos los derechos reservados.</span>
          <div className="flex items-center gap-5">
            <Link to="/contacto#terminos" className="hover:text-white">Términos de Uso</Link>
            <span className="h-3 w-px bg-white/30" />
            <Link to="/contacto#privacidad" className="hover:text-white">Política de Privacidad</Link>
            <div className="ml-4 flex gap-2.5">
              <Social label="YouTube" d={<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .6 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.8 31 31 0 0 0-.4-4.8zM9.7 15V9l5.8 3z" />} />
              <Social label="LinkedIn" d={<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z" />} />
              <Social label="Instagram" d={<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM12 2.2c-2.7 0-3 0-4 .1-4 .2-5.6 1.8-5.8 5.8-.1 1-.1 1.3-.1 4s0 3 .1 4c.2 4 1.8 5.6 5.8 5.8 1 .1 1.3.1 4 .1s3 0 4-.1c4-.2 5.6-1.8 5.8-5.8.1-1 .1-1.3.1-4s0-3-.1-4c-.2-4-1.8-5.6-5.8-5.8-1-.1-1.3-.1-4-.1z" />} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

/** Layout para páginas públicas internas (Sobre el proyecto, Servicios, etc.) */
export default function PublicLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}

/** Cabecera de sección interna con imagen de fondo */
export function PageHero({ eyebrow, title, text, image }: { eyebrow: string; title: string; text: string; image: string }) {
  return (
    <section className="relative overflow-hidden bg-navy-900">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover object-right opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-900/90 to-navy-900/10" />
      <div className="relative mx-auto max-w-[1280px] px-6 py-12 lg:px-10 lg:py-14">
        <p className="text-[12px] font-semibold tracking-[0.3em] text-white/80">{eyebrow}</p>
        <h1 className="mt-3 max-w-[640px] font-serif text-[32px] font-bold leading-[1.05] text-white sm:text-[40px]">{title}</h1>
        <p className="mt-3 max-w-[540px] text-[15px] leading-relaxed text-white/85">{text}</p>
      </div>
    </section>
  )
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h2 className="font-serif text-[26px] font-bold leading-tight text-ink sm:text-[28px]">{children}</h2>
      <div className="mt-2 flex h-[3px] w-16"><span className="flex-1 bg-brand-700" /><span className="flex-1 bg-rd-red" /></div>
    </div>
  )
}
