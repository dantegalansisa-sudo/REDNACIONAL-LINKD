import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  Activity, Bell, Building2, CalendarCheck, ChevronDown, CircleHelp, ClipboardList, FileBarChart, FileText,
  Headset, Home, Images, LineChart, LogOut, Megaphone, Menu, Network, Search, Settings, ShieldCheck,
  SlidersHorizontal, Stethoscope, User, UserRound, Users, X, type LucideIcon,
} from 'lucide-react'
import { RnsLogo } from '../components/Logo'
import { BRAND } from '../config/brand'
import { HelpModal } from '../pages/admin/HelpModal'
import { RequiereSesion, useSesion } from '../lib/session'
import { cerrarSesion, supabaseConfigurado } from '../lib/api'

export const ADMIN_NAV: { to: string; label: string; icon: LucideIcon; search: string }[] = [
  { to: '/admin', label: 'Dashboard', icon: Home, search: 'Buscar paciente por RUH, cédula, nombre o teléfono...' },
  { to: '/admin/hospitales', label: 'Hospitales', icon: Building2, search: 'Buscar hospital por nombre, provincia, municipio o código...' },
  { to: '/admin/linkconnect', label: 'LINKConnect', icon: Network, search: 'Buscar hospital por nombre, provincia, municipio o código...' },
  { to: '/admin/radiologos', label: 'Radiólogos', icon: UserRound, search: 'Buscar radiólogo por nombre, exequátur, cédula, especialidad, región...' },
  { to: '/admin/convocatorias', label: 'Convocatoria Radiólogos', icon: Megaphone, search: 'Buscar convocatoria por hospital, título, especialidad, región...' },
  { to: '/admin/asignaciones', label: 'Asignaciones', icon: CalendarCheck, search: 'Buscar asignación por radiólogo, hospital o modalidad...' },
  { to: '/admin/estudios', label: 'Estudios', icon: Images, search: 'Buscar por paciente, estudio, hospital, radiólogo, número de acceso...' },
  { to: '/admin/informes', label: 'Informes', icon: FileText, search: 'Buscar por paciente, estudio, hospital, radiólogo, número de acceso...' },
  { to: '/admin/pacientes', label: 'Pacientes', icon: Users, search: 'Buscar por paciente, estudio, hospital, radiólogo, número de acceso...' },
  { to: '/admin/referidores', label: 'Médicos referidores', icon: Stethoscope, search: 'Buscar por paciente, estudio, hospital, radiólogo, número de acceso...' },
  { to: '/admin/analitica', label: 'Analítica', icon: LineChart, search: 'Buscar por paciente, estudio, hospital, radiólogo, número de acceso...' },
  { to: '/admin/operaciones', label: 'Centro de Operaciones', icon: Activity, search: 'Buscar por paciente, estudio, hospital, radiólogo, número de acceso...' },
  { to: '/admin/seguridad', label: 'Seguridad', icon: ShieldCheck, search: 'Buscar por paciente, estudio, hospital, radiólogo, número de acceso...' },
  { to: '/admin/administracion', label: 'Administración', icon: SlidersHorizontal, search: 'Buscar por paciente, estudio, hospital, radiólogo, número de acceso...' },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings, search: 'Buscar por paciente, estudio, hospital, radiólogo, número de acceso...' },
  { to: '/admin/auditoria', label: 'Auditoría', icon: ClipboardList, search: 'Buscar por paciente, estudio, hospital, radiólogo, número de acceso...' },
  { to: '/admin/reportes', label: 'Reportes', icon: FileBarChart, search: 'Buscar por paciente, estudio, hospital, radiólogo, número de acceso...' },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-navy-900 via-navy-900 to-navy-950">
      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {ADMIN_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            onClick={onNavigate}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 rounded-lg px-3 py-[9px] text-[13.5px] transition',
              isActive ? 'bg-brand-600 font-semibold text-white shadow-lg shadow-brand-900/40' : 'text-white/85 hover:bg-white/10 hover:text-white',
            )}
          >
            <Icon size={19} strokeWidth={1.8} className="shrink-0" />
            <span className={clsx('truncate', label.length > 20 && 'text-[11.5px] tracking-[-0.01em]')}>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="m-2.5 rounded-xl bg-white/[0.07] p-3 text-white">
        <div className="flex items-start gap-2.5">
          <Headset size={22} className="mt-0.5 shrink-0" />
          <div className="min-w-0 text-[12.5px] leading-snug">
            <div className="font-semibold">Soporte Técnico</div>
            <div className="text-[15px] font-semibold">24/7</div>
            <div className="mt-1 text-white/85">{BRAND.supportPhone}</div>
            <div className="truncate text-white/85">{BRAND.supportEmail}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminShell() {
  const { sesion } = useSesion()
  const nombre = sesion?.nombre || 'Juan Pérez'
  const rolNombre = sesion ? ({ admin: 'Administrador', coordinador: 'Coordinador', operador: 'Operador' } as Record<string, string>)[sesion.rol ?? ''] ?? '' : 'Administrador SNS'
  const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [drawer, setDrawer] = useState(false)
  const [help, setHelp] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const current = [...ADMIN_NAV].reverse().find((n) => pathname === n.to || pathname.startsWith(n.to + '/')) ?? ADMIN_NAV[0]

  useEffect(() => { setDrawer(false); setUserMenu(false); window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="admin-scale min-h-screen-z bg-[#f2f6fc] text-ink">
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-[60px] items-center gap-3 border-b border-[#e3eaf6] bg-white pr-3 sm:pr-4">
        <div className="flex h-full w-auto shrink-0 items-center gap-2 pl-3 lg:w-[200px] lg:pl-4">
          <button className="rounded-md p-1.5 text-ink hover:bg-slate-100 lg:hidden" onClick={() => setDrawer(true)} aria-label="Abrir menú"><Menu size={22} /></button>
          <button onClick={() => navigate('/admin')} className="h-[44px]"><RnsLogo className="h-full w-auto" /></button>
        </div>
        <label className="relative hidden max-w-[540px] flex-1 items-center md:flex">
          <Search size={17} className="pointer-events-none absolute left-3.5 text-slate-400" />
          <input className="input h-[38px] pl-10" placeholder={current.search} />
        </label>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button className="hidden items-center gap-2 rounded-lg border border-[#e3eaf6] px-3 py-1.5 text-left xl:flex">
            <Building2 size={20} className="text-brand-600" />
            <span className="leading-tight">
              <span className="block text-[12.5px] font-semibold text-ink">Sistema Nacional de Salud (SNS)</span>
              <span className="block text-[11px] text-slate-500">Administrador Nacional</span>
            </span>
            <ChevronDown size={15} className="text-ink" />
          </button>
          <button className="relative rounded-full p-2 text-ink hover:bg-slate-100" aria-label="Notificaciones">
            <Bell size={21} />
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rd-red px-1 text-[9px] font-bold text-white">3</span>
          </button>
          <div className="relative">
            <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-slate-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-[13px] font-semibold text-white">{iniciales}</span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-[13px] font-semibold text-ink">{nombre}</span>
                <span className="block text-[11px] text-slate-500">{rolNombre}</span>
              </span>
              <ChevronDown size={15} className="hidden sm:block" />
            </button>
            {userMenu && (
              <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-xl border border-[#e3eaf6] bg-white py-1 shadow-soft">
                <button onClick={() => navigate('/admin/administracion')} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] hover:bg-brand-50"><User size={16} /> Mi perfil</button>
                <button onClick={() => navigate('/admin/configuracion')} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] hover:bg-brand-50"><Settings size={16} /> Configuración</button>
                <button onClick={async () => { if (supabaseConfigurado) await cerrarSesion(); navigate('/admin/login') }} className="flex w-full items-center gap-2 border-t border-[#eef2f8] px-4 py-2 text-[13px] text-red-600 hover:bg-red-50"><LogOut size={16} /> Cerrar sesión</button>
              </div>
            )}
          </div>
          <button onClick={() => setHelp(true)} className="flex items-center gap-1.5 rounded-lg border border-[#e3eaf6] px-2 py-1.5 text-[12.5px] font-semibold text-brand-700 hover:bg-brand-50">
            <CircleHelp size={22} className="fill-brand-600 text-white" /> <span className="hidden sm:inline">Ayuda</span>
          </button>
        </div>
      </header>

      {/* Sidebar desktop */}
      <aside className="h-sidebar-z fixed left-0 top-[60px] z-30 hidden w-[200px] lg:block"><Sidebar /></aside>

      {/* Drawer móvil */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setDrawer(false)} />
          <aside className="absolute bottom-0 left-0 top-0 w-[250px] shadow-2xl">
            <button className="absolute -right-11 top-3 rounded-full bg-white p-1.5" onClick={() => setDrawer(false)} aria-label="Cerrar menú"><X size={20} /></button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <main className="min-h-screen-z bg-gradient-to-br from-[#f4f8fe] via-[#eef4fd] to-[#e8f0fc] pt-[60px] lg:pl-[200px]">
        <div className="mx-auto w-full max-w-[1720px] px-3 py-4 sm:px-4 lg:px-5">
          <Outlet />
        </div>
      </main>

      <HelpModal open={help} onClose={() => setHelp(false)} />
    </div>
  )
}

export default function AdminLayout() {
  return (
    <RequiereSesion roles={['admin', 'coordinador', 'operador']} login="/admin/login">
      <AdminShell />
    </RequiereSesion>
  )
}
