import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Bell, ChevronDown, LogOut, Menu, User, X, type LucideIcon } from 'lucide-react'
import { Logo } from '../components/Logo'

export type PortalNavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

export type PortalConfig = {
  home: string
  topLinks: { to: string; label: string; end?: boolean }[]
  side: PortalNavItem[]
  user: { name: string; code: string }
  profilePath: string
  logoutPath: string
}

function SideNav({ items, onNavigate }: { items: PortalNavItem[]; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#1a4fd0] via-[#1446bd] to-[#0d3596] px-3 py-6">
      <nav className="space-y-1.5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => clsx(
              'flex items-center gap-3.5 rounded-lg px-4 py-3 text-[15px] transition',
              isActive ? 'bg-brand-600 font-semibold text-white shadow-lg shadow-navy-950/30 ring-1 ring-white/10' : 'text-white/90 hover:bg-white/10',
            )}
          >
            <Icon size={21} strokeWidth={1.8} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mx-2 mt-6 border-t border-white/20" />
    </div>
  )
}

export default function PortalLayout({ config, overlay }: { config: PortalConfig; overlay?: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [drawer, setDrawer] = useState(false)
  const [menu, setMenu] = useState(false)
  useEffect(() => { setDrawer(false); setMenu(false); window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="min-h-screen bg-[#f3f7fd]">
      <header className="fixed inset-x-0 top-0 z-40 flex h-[72px] items-center gap-2 sm:gap-4 border-b border-[#e3eaf6] bg-white px-3 sm:px-6">
        <button className="rounded-md p-1.5 lg:hidden" onClick={() => setDrawer(true)} aria-label="Abrir menú"><Menu size={22} /></button>
        <Logo size="sm" to={config.home} className="h-9 sm:h-11" />
        <nav className="ml-6 hidden items-center gap-1 xl:flex">
          {config.topLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => clsx('relative px-4 py-2 text-[15px] transition',
                isActive ? 'font-semibold text-ink after:absolute after:inset-x-4 after:-bottom-0.5 after:h-[2px] after:bg-brand-600' : 'text-ink/70 hover:text-ink')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <button className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e3eaf6] text-brand-600 hover:bg-brand-50" aria-label="Notificaciones">
            <Bell size={21} />
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-rd-red text-[10px] font-bold text-white">3</span>
          </button>
          <div className="relative">
            <button onClick={() => setMenu(!menu)} className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 hover:bg-slate-50">
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-brand-100">
                <svg viewBox="0 0 100 100" className="mt-2 h-9 w-9"><circle cx="50" cy="32" r="18" fill="#0b57f0" /><path d="M14 92c0-20 16-34 36-34s36 14 36 34z" fill="#0b57f0" /></svg>
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-[14.5px] font-semibold text-ink">{config.user.name}</span>
                <span className="block text-[12.5px] text-slate-500">{config.user.code}</span>
              </span>
              <ChevronDown size={17} className="hidden sm:block" />
            </button>
            {menu && (
              <div className="absolute right-0 top-14 z-50 w-52 overflow-hidden rounded-xl border border-[#e3eaf6] bg-white py-1 shadow-soft">
                <button onClick={() => navigate(config.profilePath)} className="flex w-full items-center gap-2 px-4 py-2.5 text-[13.5px] hover:bg-brand-50"><User size={16} /> Mi perfil</button>
                <button onClick={() => navigate(config.logoutPath)} className="flex w-full items-center gap-2 border-t border-[#eef2f8] px-4 py-2.5 text-[13.5px] text-red-600 hover:bg-red-50"><LogOut size={16} /> Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-[72px] z-30 hidden w-[238px] lg:block"><SideNav items={config.side} /></aside>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setDrawer(false)} />
          <aside className="absolute bottom-0 left-0 top-0 w-[260px]">
            <button className="absolute -right-11 top-3 rounded-full bg-white p-1.5" onClick={() => setDrawer(false)} aria-label="Cerrar menú"><X size={20} /></button>
            <SideNav items={config.side} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <main className="pt-[72px] lg:pl-[238px]">
        <div className="portal-compact mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5">
          <Outlet />
        </div>
      </main>
      {overlay}
    </div>
  )
}
