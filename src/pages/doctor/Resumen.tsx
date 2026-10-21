import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Building2, Calendar, CheckCircle2, ChevronRight, ClipboardList, Clock, FilePlus2, FileText, Hourglass, MapPin,
  Megaphone, TrendingUp, Users, type LucideIcon,
} from 'lucide-react'
import { Badge, Modality, Table, UserSilhouette, clsx, type Tone } from '../../components/ui'
import { Bars } from '../../components/charts'
import { ReportModal, STUDIES, type Study } from '../patient/PatientPortal'
import { RoleSwitcher, useDoctorInfo, useDoctorRole } from './DoctorPortal'
import { PRIORITY_TONE, ReportEditor, WORKLIST, type WorkItem } from './Worklist'

function Welcome({ name, photo, subtitle, code, extra }: { name: string; photo: string | null; subtitle: string; code: string; extra: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#e6edf8] bg-white shadow-card">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] md:block">
        <img src="/img/radiologo-monitor.webp" alt="" className="h-full w-full object-cover blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/75 to-white/10" />
      </div>
      <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        {photo ? <img src={photo} alt={name} className="mx-auto h-[130px] w-[130px] shrink-0 rounded-full border-4 border-brand-100 object-cover sm:mx-0" /> : <UserSilhouette size={130} className="mx-auto sm:mx-0" />}
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-extrabold leading-tight text-navy-800 sm:text-[32px]">¡Bienvenido, {name}!</h1>
          <p className="text-[15px] text-brand-700 sm:text-[18px]">{subtitle}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="text-[16px] font-semibold text-brand-700">{code}</p>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[13.5px] font-medium text-emerald-700">
              <CheckCircle2 size={17} className="fill-emerald-600 text-white" /> Cuenta verificada
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-slate-600">{extra}</div>
        </div>
      </div>
    </section>
  )
}

function KpiCard({ icon: Icon, value, label, bg, fg, to }: { icon: LucideIcon; value: string; label: string; bg: string; fg: string; to: string }) {
  return (
    <Link to={to} className="card group flex items-center gap-4 px-4 py-4 transition hover:border-brand-200 hover:shadow-soft">
      <span className={clsx('flex h-14 w-14 shrink-0 items-center justify-center rounded-full', bg, fg)}><Icon size={26} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[26px] font-bold leading-none text-navy-800">{value}</span>
        <span className="mt-1 block truncate text-[14px] text-brand-800/85">{label}</span>
      </span>
      <ChevronRight size={20} className="text-brand-700 transition group-hover:translate-x-0.5" />
    </Link>
  )
}

function Box({ icon: Icon, title, to, linkText, children, className }: { icon: LucideIcon; title: string; to?: string; linkText?: string; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('card min-w-0', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-[#eef2f8] px-4 py-3">
        <h2 className="flex items-center gap-2.5 text-[17px] font-bold text-navy-800"><Icon size={21} className="text-brand-600" /> {title}</h2>
        {to && <Link to={to} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 hover:text-brand-900">{linkText} <ArrowRight size={15} /></Link>}
      </div>
      {children}
    </section>
  )
}

/* ================= Radiólogo ================= */
const RAD_HOSPITALS = [
  { name: 'Hospital Hugo Mendoza', city: 'Santo Domingo, Distrito Nacional', pending: 3 },
  { name: 'Hospital General', city: 'Santo Domingo, Distrito Nacional', pending: 3 },
  { name: 'Hospital Dr. Francisco A. Gonzalvo', city: 'Santiago de los Caballeros', pending: 2 },
]
const RAD_CALLS = [
  { title: 'Cobertura nocturna de tomografía', hospital: 'Hospital Regional Taiwán', region: 'Azua · Región Valdesia', close: '30/10/2026', match: 96 },
  { title: 'Lectura de mamografías de tamizaje', hospital: 'Hospital Dr. Marcelino Vélez', region: 'Santo Domingo Oeste', close: '05/11/2026', match: 88 },
]

function RadiologoResumen() {
  const d = useDoctorInfo()
  const [open, setOpen] = useState<WorkItem | null>(null)
  const top = WORKLIST.filter((w) => w.priority !== 'Normal').slice(0, 5)
  return (
    <div className="space-y-4">
      <Welcome name={`${d.name.split(' ')[0]} ${d.first}`} photo={d.photo} subtitle="Tu lista de lectura y rendimiento, en tiempo real." code={`${d.code} · Exequátur ${d.exequatur}`}
        extra={<>
          <span className="inline-flex items-center gap-1.5"><FileText size={15} className="text-brand-700" /> {d.specialty}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-brand-700" /> Región Ozama · Cibao Norte</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={15} className="text-brand-700" /> Turno: 7:00 a. m. – 3:00 p. m.</span>
        </>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ClipboardList} value="42" label="Estudios asignados" bg="bg-brand-50" fg="text-brand-600" to="/medico/lista-de-trabajo" />
        <KpiCard icon={Hourglass} value={String(WORKLIST.length)} label="Pendientes de lectura" bg="bg-orange-50" fg="text-orange-500" to="/medico/lista-de-trabajo" />
        <KpiCard icon={CheckCircle2} value="14" label="Informes emitidos hoy" bg="bg-emerald-50" fg="text-emerald-600" to="/medico/informes" />
        <KpiCard icon={Clock} value="38 min" label="Tiempo promedio" bg="bg-violet-100" fg="text-violet-600" to="/medico/informes" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Box icon={ClipboardList} title="Estudios prioritarios" to="/medico/lista-de-trabajo" linkText="Ver lista de trabajo">
          <div className="px-2 pb-2">
            <Table>
              <thead><tr>{['Prioridad', 'Paciente', 'Estudio', 'Hospital', 'Tiempo restante', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {top.map((w) => (
                  <tr key={w.id} className="tr">
                    <td className="td"><Badge tone={PRIORITY_TONE[w.priority]}>{w.priority}</Badge></td>
                    <td className="td whitespace-nowrap font-semibold text-ink">{w.patient}</td>
                    <td className="td"><span className="flex items-center gap-2 whitespace-nowrap"><Modality m={w.mod} /> {w.study}</span></td>
                    <td className="td whitespace-nowrap">{w.hospital}</td>
                    <td className={clsx('td whitespace-nowrap font-semibold', w.priority === 'Urgente' ? 'text-red-600' : 'text-orange-500')}>{w.remaining}</td>
                    <td className="td"><button onClick={() => setOpen(w)} className="btn-primary whitespace-nowrap !px-3 !py-1 !text-[12px]">Leer estudio</button></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Box>
        <Box icon={TrendingUp} title="Rendimiento semanal" to="/medico/informes" linkText="Ver informes">
          <div className="p-4">
            <div className="mb-2 flex flex-wrap gap-4 text-[12px]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Informes emitidos</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#93c5fd]" /> Meta diaria</span>
            </div>
            <Bars labels={['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']} height={190}
              series={[{ name: 'Informes', color: '#0b57f0', values: [22, 28, 25, 31, 27, 12, 14] }, { name: 'Meta', color: '#93c5fd', values: [25, 25, 25, 25, 25, 12, 12] }]} />
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[['159', 'Informes / semana'], ['98.6%', 'Dentro de SLA'], ['4.9', 'Calificación']].map(([v, l]) => (
                <div key={l} className="rounded-lg bg-[#f7faff] py-2"><p className="text-[17px] font-bold text-navy-800">{v}</p><p className="text-[11.5px] text-slate-500">{l}</p></div>
              ))}
            </div>
          </div>
        </Box>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Box icon={Building2} title="Hospitales asignados" to="/medico/hospitales" linkText="Ver hospitales">
          <div className="divide-y divide-[#eef2f8]">
            {RAD_HOSPITALS.map((h) => (
              <Link key={h.name} to="/medico/hospitales" className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50/40">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Building2 size={22} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-bold text-navy-800">{h.name}</p>
                  <p className="flex items-center gap-1.5 truncate text-[12.5px] text-slate-600"><MapPin size={13} /> {h.city}</p>
                </div>
                <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[12px] font-semibold text-orange-600">{h.pending} pendientes</span>
                <ChevronRight size={18} className="text-brand-700" />
              </Link>
            ))}
          </div>
        </Box>
        <Box icon={Megaphone} title="Convocatorias abiertas para ti" to="/medico/convocatorias" linkText="Ver convocatorias">
          <div className="divide-y divide-[#eef2f8]">
            {RAD_CALLS.map((c) => (
              <div key={c.title} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-bold text-navy-800">{c.title}</p>
                  <p className="text-[12.5px] text-slate-600">{c.hospital} · {c.region}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-500"><Calendar size={13} /> Cierra: {c.close}</p>
                </div>
                <Badge tone="green">{c.match}% compatible</Badge>
                <Link to="/medico/convocatorias" className="btn-outline !px-3 !py-1 !text-[12px]">Ver</Link>
              </div>
            ))}
          </div>
        </Box>
      </div>

      <ReportEditor item={open} onClose={() => setOpen(null)} />
    </div>
  )
}

/* ================= Referidor ================= */
const REFS: { patient: string; record: string; study: string; mod: string; date: string; hospital: string; status: string; tone: Tone }[] = [
  { patient: 'Juan Pérez Gómez', record: 'HN-00012345', study: 'TC de cráneo simple', mod: 'CT', date: '15/03/2025', hospital: 'Hospital Hugo Mendoza', status: 'Resultado disponible', tone: 'green' },
  { patient: 'María Altagracia Rosario', record: 'HN-00045871', study: 'TC de cráneo simple', mod: 'CT', date: '20/10/2026', hospital: 'Hospital Hugo Mendoza', status: 'En lectura', tone: 'blue' },
  { patient: 'Ana Lucía Martínez', record: 'HN-00051230', study: 'RM de rodilla derecha', mod: 'MR', date: '20/10/2026', hospital: 'Hospital Dr. Francisco A. Gonzalvo', status: 'En lectura', tone: 'blue' },
  { patient: 'Luis Alberto Guzmán', record: 'HN-00033457', study: 'TC de abdomen con contraste', mod: 'CT', date: '19/10/2026', hospital: 'Hospital Dr. Francisco A. Gonzalvo', status: 'Programado', tone: 'orange' },
  { patient: 'Rafael Antonio Mejía', record: 'HN-00058812', study: 'Ecografía renal', mod: 'US', date: '18/10/2026', hospital: 'Hospital General', status: 'Pendiente de cita', tone: 'yellow' },
]

function ReferidorResumen() {
  const d = useDoctorInfo()
  const [report, setReport] = useState<Study | null>(null)
  const [who, setWho] = useState(0)
  const results = STUDIES.slice(0, 4)
  const names = ['Juan Pérez Gómez', 'Carmen Julia Santos', 'Pedro Antonio Reyes', 'Rosa Elena Jiménez']
  const recs = ['HN-00012345', 'HN-00060012', 'HN-00028871', 'HN-00047719']
  return (
    <div className="space-y-4">
      <Welcome name={`${d.name.split(' ')[0]} ${d.first}`} photo={d.photo} subtitle="Sigue a tus pacientes referidos y sus resultados." code={`${d.code} · Exequátur ${d.exequatur}`}
        extra={<>
          <span className="inline-flex items-center gap-1.5"><FileText size={15} className="text-brand-700" /> {d.specialty}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-brand-700" /> Santo Domingo, Distrito Nacional</span>
        </>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} value="128" label="Pacientes referidos" bg="bg-brand-50" fg="text-brand-600" to="/medico/pacientes" />
        <KpiCard icon={FilePlus2} value="214" label="Estudios solicitados" bg="bg-teal-50" fg="text-teal-600" to="/medico/solicitudes" />
        <KpiCard icon={CheckCircle2} value="9" label="Resultados disponibles" bg="bg-emerald-50" fg="text-emerald-600" to="/medico/pacientes" />
        <KpiCard icon={Hourglass} value="6" label="Pendientes" bg="bg-orange-50" fg="text-orange-500" to="/medico/solicitudes" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Box icon={FilePlus2} title="Últimas referencias" to="/medico/solicitudes" linkText="Ver solicitudes">
          <div className="px-2 pb-2">
            <Table>
              <thead><tr>{['Paciente', 'Estudio', 'Fecha', 'Hospital', 'Estado'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {REFS.map((r) => (
                  <tr key={r.record + r.study} className="tr">
                    <td className="td"><p className="whitespace-nowrap font-semibold text-ink">{r.patient}</p><p className="text-[11px]">{r.record}</p></td>
                    <td className="td"><span className="flex items-center gap-2 whitespace-nowrap"><Modality m={r.mod} /> {r.study}</span></td>
                    <td className="td whitespace-nowrap">{r.date}</td>
                    <td className="td whitespace-nowrap">{r.hospital}</td>
                    <td className="td"><Badge tone={r.tone}>{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Box>
        <Box icon={CheckCircle2} title="Resultados recientes" to="/medico/pacientes" linkText="Ver pacientes">
          <div className="divide-y divide-[#eef2f8] px-4">
            {results.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 py-2.5">
                <img src={s.img} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink">{names[i]}</p>
                  <p className="truncate text-[12px] text-slate-500">{s.name} · {s.date}</p>
                </div>
                <button onClick={() => { setWho(i); setReport(s) }} className="btn-outline !px-2.5 !py-1 !text-[12px]"><FileText size={14} /> Informe</button>
              </div>
            ))}
          </div>
        </Box>
      </div>

      <Box icon={TrendingUp} title="Referencias por mes">
        <div className="p-4">
          <Bars labels={['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct']} height={170} showValues
            series={[{ name: 'Estudios solicitados', color: '#0b57f0', values: [28, 34, 31, 39, 42, 40] }]} />
        </div>
      </Box>

      <ReportModal study={report} onClose={() => setReport(null)} patient={names[who]} record={recs[who]} />
    </div>
  )
}

export default function Resumen() {
  const { role } = useDoctorRole()
  return (
    <div>
      <div className="mb-3 flex justify-end"><RoleSwitcher /></div>
      {role === 'radiologo' ? <RadiologoResumen /> : <ReferidorResumen />}
    </div>
  )
}
