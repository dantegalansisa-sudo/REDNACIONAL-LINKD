import { fechaConEdad, formatoCedula, useSesion } from '../../lib/session'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Building2, Calendar, CheckCircle2, ChevronRight, Clock, Eye, FileText, IdCard, Image as ImageIcon,
  Laptop, MapPin, Megaphone, Monitor, Phone, SquarePen, Smartphone, Tablet, User, X, type LucideIcon,
} from 'lucide-react'
import { Modality, Table, UserSilhouette, clsx } from '../../components/ui'
import { ReportModal, STUDIES, ViewerModal, lsGet, lsSet, type Study } from './PatientPortal'

const KPIS: { icon: LucideIcon; value: string; label: string; bg: string; fg: string; to: string }[] = [
  { icon: FileText, value: '8', label: 'Estudios realizados', bg: 'bg-brand-50', fg: 'text-brand-600', to: '/paciente/estudios' },
  { icon: Building2, value: '3', label: 'Hospitales visitados', bg: 'bg-teal-50', fg: 'text-teal-600', to: '/paciente/hospitales' },
  { icon: Monitor, value: '12', label: 'Accesos al portal', bg: 'bg-brand-50', fg: 'text-brand-600', to: '/paciente/perfil' },
  { icon: User, value: '1', label: 'Médico referidor', bg: 'bg-violet-100', fg: 'text-violet-600', to: '/paciente/medicos' },
]

const HOSPITALS = [
  { name: 'Hospital Hugo Mendoza', city: 'Santo Domingo, Distrito Nacional', last: '15/03/2025' },
  { name: 'Hospital General', city: 'Santo Domingo, Distrito Nacional', last: '02/03/2025' },
  { name: 'Hospital Dr. Francisco A. Gonzalvo', city: 'Santiago de los Caballeros', last: '28/01/2025' },
]

const ACTIVITY: { date: string; device: string; dIcon: LucideIcon; browser: string; b: 'chrome' | 'edge' | 'safari'; ip: string }[] = [
  { date: '14/03/2025 08:32 a. m.', device: 'Celular', dIcon: Smartphone, browser: 'Chrome / Android', b: 'chrome', ip: '186.21.45.78' },
  { date: '10/03/2025 07:15 p. m.', device: 'PC', dIcon: Laptop, browser: 'Edge / Windows', b: 'edge', ip: '201.200.15.33' },
  { date: '28/02/2025 09:41 a. m.', device: 'Tablet', dIcon: Tablet, browser: 'Safari / iPadOS', b: 'safari', ip: '190.118.22.11' },
]

function BrowserIcon({ b }: { b: 'chrome' | 'edge' | 'safari' }) {
  if (b === 'chrome') return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0">
      <circle cx="12" cy="12" r="11" fill="#db4437" />
      <path d="M12 12 L22.5 12 A10.5 10.5 0 0 1 6.75 21.1 Z" fill="#0f9d58" />
      <path d="M12 12 L6.75 21.1 A10.5 10.5 0 0 1 1.5 12 A10.5 10.5 0 0 1 3 6.7 Z" fill="#0f9d58" />
      <path d="M12 12 L22.5 12 A10.5 10.5 0 0 0 12 1.5 Z" fill="#ffcd40" />
      <circle cx="12" cy="12" r="5" fill="#fff" /><circle cx="12" cy="12" r="3.8" fill="#4285f4" />
    </svg>
  )
  if (b === 'edge') return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0">
      <defs><linearGradient id="edg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#35c1f1" /><stop offset="1" stopColor="#0c59a4" /></linearGradient></defs>
      <circle cx="12" cy="12" r="11" fill="url(#edg)" />
      <path d="M6 14c0-4 3-6.5 6.5-6.5S19 9.5 19 12.5H9.5c.3 2.5 3 3.8 6.5 2.8" fill="none" stroke="#fff" strokeWidth="2" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0">
      <circle cx="12" cy="12" r="11" fill="#1e8cf0" /><circle cx="12" cy="12" r="8.5" fill="#fff" />
      <path d="M12 12 16.5 7.5 13.2 13.2Z" fill="#ef4444" /><path d="M12 12 7.5 16.5 10.8 10.8Z" fill="#94a3b8" />
    </svg>
  )
}

export default function Resumen() {
  const pac = useSesion().sesion?.paciente
  const navigate = useNavigate()
  const [banner, setBanner] = useState(() => lsGet('rns-paciente-banner') !== 'off')
  const [report, setReport] = useState<Study | null>(null)
  const [viewer, setViewer] = useState<Study | null>(null)
  const latest = STUDIES.slice(0, 2)

  return (
    <div className="space-y-4">
      {banner && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-[#fff6dc] px-4 py-3 sm:flex-nowrap sm:px-5">
          <Megaphone size={34} className="shrink-0 -scale-x-100 fill-amber-400 text-amber-500" />
          <p className="min-w-0 flex-1 text-[14px] text-ink sm:text-[15px]">
            <b className="mr-2 text-[16px] text-[#c2410c] sm:text-[18px]">¡Recuerda!</b>
            Si cambias tu número de teléfono o WhatsApp, actualiza tu <b>perfil con el nuevo número.</b>
          </p>
          <button onClick={() => navigate('/paciente/perfil')} className="btn-primary h-11 px-6 text-[14.5px]"><SquarePen size={18} /> Ir a mis datos</button>
          <button onClick={() => { setBanner(false); lsSet('rns-paciente-banner', 'off') }} className="rounded-full p-1.5 text-slate-500 hover:bg-amber-100" aria-label="Cerrar aviso"><X size={22} /></button>
        </div>
      )}

      {/* Bienvenida */}
      <section className="relative overflow-hidden rounded-2xl border border-[#e6edf8] bg-white shadow-card">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] md:block">
          <img src="/img/banner-hospital.webp" alt="" className="h-full w-full object-cover blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-white/10" />
        </div>
        <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <UserSilhouette size={136} className="mx-auto sm:mx-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] font-extrabold leading-tight text-navy-800 sm:text-[34px]">¡Bienvenido, {pac?.nombres?.split(' ')[0] ?? 'Juan'}!</h1>
            <p className="text-[16px] text-brand-700 sm:text-[19px]">Tu información de salud, organizada en un solo lugar.</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2">
              <div>
                <p className="text-[19px] font-bold text-navy-800">{pac?.nombre_completo ?? 'Juan Pérez Gómez'}</p>
                <p className="text-[18px] font-semibold text-brand-700">{pac?.codigo ?? 'HN-00012345'}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[14px] font-medium text-emerald-700">
                <CheckCircle2 size={18} className="fill-emerald-600 text-white" /> Cuenta activa
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-7 gap-y-1.5 text-[13.5px] text-slate-600">
              <span className="inline-flex items-center gap-2"><IdCard size={17} className="text-brand-700" /> {pac?.tipo_documento === 'pasaporte' ? 'Pasaporte' : 'Cédula'}: {pac ? formatoCedula(pac.documento) : '001-1567890-1'}</span>
              <span className="inline-flex items-center gap-2"><Phone size={16} className="text-brand-700" /> Teléfono: {pac ? pac.telefono ?? '—' : '809-555-1234'}</span>
              <span className="inline-flex items-center gap-2"><Calendar size={16} className="text-brand-700" /> Fecha de nacimiento: {pac ? fechaConEdad(pac.fecha_nacimiento) : '12/05/1980 (45 años)'}</span>
              <span className="inline-flex items-center gap-2"><span className="text-[17px] leading-none text-brand-700">♂</span> Sexo: {pac ? pac.sexo ?? '—' : 'Masculino'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Link key={k.label} to={k.to} className="card group flex items-center gap-4 px-4 py-4 transition hover:border-brand-200 hover:shadow-soft">
            <span className={clsx('flex h-16 w-16 shrink-0 items-center justify-center rounded-full', k.bg, k.fg)}>
              <k.icon size={30} className={k.icon === User ? 'fill-current' : ''} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[28px] font-bold leading-none text-navy-800">{k.value}</span>
              <span className="mt-1 block truncate text-[15px] text-brand-800/85">{k.label}</span>
            </span>
            <ChevronRight size={22} className="text-brand-700 transition group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Últimos estudios */}
        <section className="card min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-[#eef2f8] px-4 py-3">
            <h2 className="flex items-center gap-2.5 text-[18px] font-bold text-navy-800"><FileText size={22} className="fill-brand-600 text-white" /> Últimos estudios</h2>
            <Link to="/paciente/estudios" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-brand-700 hover:text-brand-900">Ver todos los estudios <ArrowRight size={16} /></Link>
          </div>
          <div className="divide-y divide-[#eef2f8] px-4">
            {latest.map((s) => (
              <div key={s.id} className="flex flex-col gap-3 py-3 sm:flex-row">
                <img src={s.img} alt={s.name} className="h-[96px] w-full shrink-0 rounded-md bg-black object-cover sm:w-[102px]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <p className="text-[15px] font-bold text-navy-800">{s.name}</p>
                      <Modality m={s.mod} className="!px-2.5 !py-1" />
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-[13px] text-emerald-700">
                      <CheckCircle2 size={17} className="fill-emerald-600 text-white" /> {s.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                    <div className="space-y-1 text-[13.5px] text-slate-600">
                      <p className="flex items-center gap-2"><Calendar size={15} className="text-brand-700" /> {s.date} {s.time}</p>
                      <p className="flex items-center gap-2"><MapPin size={15} className="text-brand-700" /> {s.hospital}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setReport(s)} className="inline-flex items-center gap-2 rounded-md border border-brand-300 px-3.5 py-1.5 text-[13px] font-medium text-brand-700 hover:bg-brand-50"><FileText size={16} /> Ver informe</button>
                      <button onClick={() => setViewer(s)} className="inline-flex items-center gap-2 rounded-md border border-brand-300 px-3.5 py-1.5 text-[13px] font-medium text-brand-700 hover:bg-brand-50"><ImageIcon size={16} /> Ver imágenes</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mis hospitales */}
        <section className="card min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-[#eef2f8] px-4 py-3">
            <h2 className="flex items-center gap-2.5 text-[18px] font-bold text-navy-800"><Building2 size={22} className="text-brand-600" /> Mis hospitales</h2>
            <Link to="/paciente/hospitales" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-brand-700 hover:text-brand-900">Ver todos los hospitales <ArrowRight size={16} /></Link>
          </div>
          <div className="divide-y divide-[#eef2f8]">
            {HOSPITALS.map((h) => (
              <Link key={h.name} to="/paciente/hospitales" className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50/40">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Building2 size={24} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-navy-800">{h.name}</p>
                  <p className="flex items-center gap-1.5 truncate text-[13px] text-slate-600"><MapPin size={14} className="shrink-0 text-brand-700" /> {h.city}</p>
                </div>
                <div className="hidden shrink-0 border-l border-[#e6edf8] pl-4 sm:block">
                  <p className="text-[12.5px] text-slate-500">Última visita</p>
                  <p className="flex items-center gap-1.5 text-[14px] text-ink"><Calendar size={15} className="text-brand-700" /> {h.last}</p>
                </div>
                <ChevronRight size={20} className="shrink-0 text-brand-700" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Actividad reciente */}
      <section className="card min-w-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h2 className="flex items-center gap-2.5 text-[18px] font-bold text-navy-800"><Clock size={23} className="text-brand-600" /> Actividad reciente</h2>
          <Link to="/paciente/perfil" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-brand-700 hover:text-brand-900">Ver todos los accesos <ArrowRight size={16} /></Link>
        </div>
        <div className="px-4 pb-3">
          <Table>
            <thead className="bg-[#f3f7fd]">
              <tr>
                {['Fecha / Hora', 'Dispositivo', 'Navegador / SO', 'IP aproximada', 'Acción'].map((h) => <th key={h} className="th !text-[13px]">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {ACTIVITY.map((a) => (
                <tr key={a.date} className="tr">
                  <td className="td !text-[13px]"><span className="flex items-center gap-2 whitespace-nowrap"><Calendar size={16} className="text-brand-700" /> {a.date}</span></td>
                  <td className="td !text-[13px]"><span className="flex items-center gap-2"><a.dIcon size={17} className="text-brand-700" /> {a.device}</span></td>
                  <td className="td !text-[13px]"><span className="flex items-center gap-2 whitespace-nowrap"><BrowserIcon b={a.b} /> {a.browser}</span></td>
                  <td className="td !text-[13px]">{a.ip}</td>
                  <td className="td !text-[13px]"><button className="inline-flex items-center gap-2 whitespace-nowrap font-medium text-brand-700 hover:text-brand-900"><Eye size={17} /> Ver actividad</button></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>

      <ReportModal study={report} onClose={() => setReport(null)} />
      <ViewerModal study={viewer} onClose={() => setViewer(null)} />
    </div>
  )
}
