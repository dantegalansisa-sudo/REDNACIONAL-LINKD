import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Building2, Calendar, CheckCircle2, ChevronRight, ClipboardList, Clock, FilePlus2, FileText, Hourglass, MapPin,
  Megaphone, Star, TrendingUp, Users, type LucideIcon,
} from 'lucide-react'
import { Badge, Modality, Table, UserSilhouette, clsx, type Tone } from '../../components/ui'
import { Bars } from '../../components/charts'
import { ReportModal, STUDIES, type Study } from '../patient/PatientPortal'
import { RoleSwitcher, useDoctorInfo, useDoctorRole } from './DoctorPortal'
import { EditorEstudio, PRIORITY_TONE, WORKLIST, type WorkItem } from './Worklist'
import { useSesion } from '../../lib/session'
import { mensajeError } from '../../lib/api'
import {
  fetchConvocatoriasAbiertas, fetchListaTrabajo, fetchMisHospitalesRadiologo, fetchMisPacientesReferidos, fetchMisSolicitudes,
  fetchResumenMedico, marcarEnLectura, supabaseConfigurado, useDatos,
  type ConvocatoriaAbierta, type HospitalAsignado, type ItemTrabajo, type PacienteReferido, type SolicitudReal,
} from '../../lib/portal-data'

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

/** Mensaje de carga / error / lista vacía (solo con datos reales) */
function Aviso({ cargando, error, vacio, textoVacio, onRetry }: { cargando: boolean; error: string; vacio: boolean; textoVacio: string; onRetry: () => void }) {
  if (!supabaseConfigurado) return null
  if (cargando && vacio) return <p className="px-4 py-6 text-center text-[13px] text-slate-500">Cargando…</p>
  if (error) return <p className="px-4 py-6 text-center text-[13px] text-red-600">No se pudo cargar: {error} <button onClick={onRetry} className="ml-1 font-semibold text-brand-600 hover:underline">Reintentar</button></p>
  if (vacio) return <p className="px-4 py-6 text-center text-[13px] text-slate-500">{textoVacio}</p>
  return null
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const POSTULACION: Record<string, string> = { aplicada: 'Postulación enviada', preseleccionada: 'Preseleccionada', aceptada: 'Aceptada', rechazada: 'No seleccionada', retirada: 'Retirada' }
/** dd/mm/aaaa → aaaammdd (para ordenar) */
const ordenFecha = (f: string) => f.split('/').reverse().join('')

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
  const m = useSesion().sesion?.medico
  const id = m?.tipo === 'radiologo' ? m.id : null
  const res = useDatos(() => (id ? fetchResumenMedico(id, 'radiologo') : Promise.resolve(null)), null, [id])
  const lista = useDatos<WorkItem[]>(() => (id ? fetchListaTrabajo(id) : Promise.resolve([])), WORKLIST, [id])
  const hosp = useDatos<HospitalAsignado[]>(() => (id ? fetchMisHospitalesRadiologo(id) : Promise.resolve([])), [], [id])
  const conv = useDatos<ConvocatoriaAbierta[]>(() => (id ? fetchConvocatoriasAbiertas(id) : Promise.resolve([])), [], [id])
  const [open, setOpen] = useState<WorkItem | null>(null)
  const [accionError, setAccionError] = useState('')
  const real = supabaseConfigurado
  const top = real ? lista.datos.slice(0, 5) : WORKLIST.filter((w) => w.priority !== 'Normal').slice(0, 5)
  const r = res.datos
  const kpi = (v: string | number | undefined) => (r ? String(v) : res.error ? '—' : '…')
  const semana: number[] = r?.semana ?? [0, 0, 0, 0, 0, 0, 0]

  const leer = async (w: WorkItem) => {
    setAccionError('')
    setOpen(w)
    const it = w as ItemTrabajo
    if (real && it.uuid && w.status === 'Pendiente') {
      try { await marcarEnLectura(it.uuid); await lista.recargar() } catch (e) { setAccionError(`No se pudo marcar el estudio como "en lectura": ${mensajeError(e)}`) }
    }
  }
  const recargarTodo = async () => { await Promise.all([lista.recargar(), res.recargar()]) }

  return (
    <div className="space-y-4">
      <Welcome name={`${d.name.split(' ')[0]} ${d.first}`} photo={d.photo} subtitle="Tu lista de lectura y rendimiento, en tiempo real." code={`${d.code} · Exequátur ${d.exequatur}`}
        extra={real ? (
          <span className="inline-flex items-center gap-1.5"><FileText size={15} className="text-brand-700" /> {d.specialty}</span>
        ) : <>
          <span className="inline-flex items-center gap-1.5"><FileText size={15} className="text-brand-700" /> {d.specialty}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-brand-700" /> Región Ozama · Cibao Norte</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={15} className="text-brand-700" /> Turno: 7:00 a. m. – 3:00 p. m.</span>
        </>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ClipboardList} value={real ? kpi(r?.asignados) : '42'} label="Estudios asignados" bg="bg-brand-50" fg="text-brand-600" to="/medico/lista-de-trabajo" />
        <KpiCard icon={Hourglass} value={real ? kpi(r?.pendientes) : String(WORKLIST.length)} label="Pendientes de lectura" bg="bg-orange-50" fg="text-orange-500" to="/medico/lista-de-trabajo" />
        <KpiCard icon={CheckCircle2} value={real ? kpi(r?.informesHoy) : '14'} label="Informes emitidos hoy" bg="bg-emerald-50" fg="text-emerald-600" to="/medico/informes" />
        {real
          ? <KpiCard icon={Star} value={kpi(r?.calificacion)} label="Calificación promedio" bg="bg-violet-100" fg="text-violet-600" to="/medico/informes" />
          : <KpiCard icon={Clock} value="38 min" label="Tiempo promedio" bg="bg-violet-100" fg="text-violet-600" to="/medico/informes" />}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Box icon={ClipboardList} title="Estudios prioritarios" to="/medico/lista-de-trabajo" linkText="Ver lista de trabajo">
          <div className="px-2 pb-2">
            {accionError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-600">{accionError}</p>}
            {top.length > 0 && (
              <Table>
                <thead><tr>{['Prioridad', 'Paciente', 'Estudio', 'Hospital', 'Tiempo restante', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {top.map((w) => (
                    <tr key={w.id} className="tr">
                      <td className="td"><Badge tone={PRIORITY_TONE[w.priority]}>{w.priority}</Badge></td>
                      <td className="td whitespace-nowrap font-semibold text-ink">{w.patient}</td>
                      <td className="td"><span className="flex items-center gap-2 whitespace-nowrap"><Modality m={w.mod} /> {w.study}</span></td>
                      <td className="td whitespace-nowrap">{w.hospital}</td>
                      <td className={clsx('td whitespace-nowrap font-semibold', w.priority === 'Urgente' ? 'text-red-600' : w.priority === 'Alta' ? 'text-orange-500' : 'text-ink')}>{w.remaining}</td>
                      <td className="td"><button onClick={() => leer(w)} className="btn-primary whitespace-nowrap !px-3 !py-1 !text-[12px]">Leer estudio</button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            <Aviso cargando={lista.cargando} error={lista.error} vacio={top.length === 0} onRetry={lista.recargar}
              textoVacio="No tienes estudios pendientes de lectura." />
          </div>
        </Box>
        <Box icon={TrendingUp} title="Rendimiento semanal" to="/medico/informes" linkText="Ver informes">
          <div className="p-4">
            <div className="mb-2 flex flex-wrap gap-4 text-[12px]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> {real ? 'Informes publicados (últimos 7 días)' : 'Informes emitidos'}</span>
              {!real && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#93c5fd]" /> Meta diaria</span>}
            </div>
            {real ? (
              <Bars labels={DIAS} height={190} max={Math.max(4, ...semana)} showValues
                series={[{ name: 'Informes', color: '#0b57f0', values: semana }]} />
            ) : (
              <Bars labels={DIAS} height={190}
                series={[{ name: 'Informes', color: '#0b57f0', values: [22, 28, 25, 31, 27, 12, 14] }, { name: 'Meta', color: '#93c5fd', values: [25, 25, 25, 25, 25, 12, 12] }]} />
            )}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {(real
                ? [[kpi(r?.informesSemana), 'Informes / semana'], [kpi(r?.pendientes), 'Pendientes'], [kpi(r?.calificacion), 'Calificación']]
                : [['159', 'Informes / semana'], ['98.6%', 'Dentro de SLA'], ['4.9', 'Calificación']]
              ).map(([v, l]) => (
                <div key={l} className="rounded-lg bg-[#f7faff] py-2"><p className="text-[17px] font-bold text-navy-800">{v}</p><p className="text-[11.5px] text-slate-500">{l}</p></div>
              ))}
            </div>
          </div>
        </Box>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Box icon={Building2} title="Hospitales asignados" to="/medico/hospitales" linkText="Ver hospitales">
          <div className="divide-y divide-[#eef2f8]">
            {(real ? hosp.datos.map((h) => ({ name: h.name, city: h.city, pending: h.pendientes })) : RAD_HOSPITALS).map((h) => (
              <Link key={h.name} to="/medico/hospitales" className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50/40">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Building2 size={22} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-bold text-navy-800">{h.name}</p>
                  <p className="flex items-center gap-1.5 truncate text-[12.5px] text-slate-600"><MapPin size={13} /> {h.city || '—'}</p>
                </div>
                <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[12px] font-semibold text-orange-600">{h.pending} pendientes</span>
                <ChevronRight size={18} className="text-brand-700" />
              </Link>
            ))}
          </div>
          <Aviso cargando={hosp.cargando} error={hosp.error} vacio={hosp.datos.length === 0} onRetry={hosp.recargar}
            textoVacio="Aún no tienes hospitales asignados. El SNS te asignará hospitales según tu perfil y región de interés." />
        </Box>
        <Box icon={Megaphone} title="Convocatorias abiertas para ti" to="/medico/convocatorias" linkText="Ver convocatorias">
          <div className="divide-y divide-[#eef2f8]">
            {real ? conv.datos.slice(0, 3).map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-bold text-navy-800">{c.title}</p>
                  <p className="text-[12.5px] text-slate-600">{c.hospital} · {c.region}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-500"><Calendar size={13} /> Cierra: {c.close}</p>
                </div>
                <Badge tone={c.postulacion ? 'blue' : 'green'}>{c.postulacion ? (POSTULACION[c.postulacion] ?? c.postulacion) : 'Abierta'}</Badge>
                <Link to="/medico/convocatorias" className="btn-outline !px-3 !py-1 !text-[12px]">Ver</Link>
              </div>
            )) : RAD_CALLS.map((c) => (
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
          <Aviso cargando={conv.cargando} error={conv.error} vacio={conv.datos.length === 0} onRetry={conv.recargar}
            textoVacio="No hay convocatorias abiertas en este momento." />
        </Box>
      </div>

      <EditorEstudio item={open} items={lista.datos} onClose={() => setOpen(null)} recargar={recargarTodo} />
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

/** Color del estado de una solicitud o estudio real */
const TONO_ESTADO: Record<string, Tone> = {
  'Resultado disponible': 'green', Enviada: 'purple', Programada: 'orange', Realizada: 'teal', Cancelada: 'red',
  Nuevo: 'yellow', Asignado: 'blue', 'En lectura': 'blue', 'En revisión': 'blue', Informado: 'green', Cancelado: 'red',
}

function ReferidorResumen() {
  const d = useDoctorInfo()
  const m = useSesion().sesion?.medico
  const id = m?.tipo === 'referidor' ? m.id : null
  const res = useDatos(() => (id ? fetchResumenMedico(id, 'referidor') : Promise.resolve(null)), null, [id])
  const sols = useDatos<SolicitudReal[]>(() => (id ? fetchMisSolicitudes(id) : Promise.resolve([])), [], [id])
  const pacs = useDatos<PacienteReferido[]>(() => (id ? fetchMisPacientesReferidos(id) : Promise.resolve([])), [], [id])
  const real = supabaseConfigurado
  const [report, setReport] = useState<Study | null>(null)
  const [who, setWho] = useState(0)
  const [repReal, setRepReal] = useState<{ s: Study; patient: string; record: string } | null>(null)
  const [hoy] = useState(() => new Date())
  const results = STUDIES.slice(0, 4)
  const names = ['Juan Pérez Gómez', 'Carmen Julia Santos', 'Pedro Antonio Reyes', 'Rosa Elena Jiménez']
  const recs = ['HN-00012345', 'HN-00060012', 'HN-00028871', 'HN-00047719']

  // ----- Datos reales -----
  const r = res.datos
  const cuenta = (listo: boolean, error: string, v: number) => (listo ? String(v) : error ? '—' : '…')
  const sinEstudio = sols.datos.filter((s) => s.estado === 'enviada' || s.estado === 'programada').length
  const refsReales = sols.datos.slice(0, 5)
  const resultadosReales = pacs.datos
    .flatMap((p) => p.studies.filter((s) => s.status === 'Informe publicado').map((s) => ({ s, patient: p.name, record: p.record })))
    .sort((a, b) => ordenFecha(b.s.date).localeCompare(ordenFecha(a.s.date)))
    .slice(0, 4)
  const ultimos6 = Array.from({ length: 6 }, (_, i) => new Date(hoy.getFullYear(), hoy.getMonth() - 5 + i, 1))
  const porMes = ultimos6.map((f) => sols.datos.filter((s) => {
    const [, mm, aa] = s.date.split('/').map(Number)
    return mm === f.getMonth() + 1 && aa === f.getFullYear()
  }).length)

  return (
    <div className="space-y-4">
      <Welcome name={`${d.name.split(' ')[0]} ${d.first}`} photo={d.photo} subtitle="Sigue a tus pacientes referidos y sus resultados." code={`${d.code} · Exequátur ${d.exequatur}`}
        extra={real ? (
          <span className="inline-flex items-center gap-1.5"><FileText size={15} className="text-brand-700" /> {d.specialty}</span>
        ) : <>
          <span className="inline-flex items-center gap-1.5"><FileText size={15} className="text-brand-700" /> {d.specialty}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-brand-700" /> Santo Domingo, Distrito Nacional</span>
        </>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} value={real ? cuenta(!pacs.cargando, pacs.error, pacs.datos.length) : '128'} label="Pacientes referidos" bg="bg-brand-50" fg="text-brand-600" to="/medico/pacientes" />
        <KpiCard icon={FilePlus2} value={real ? cuenta(!sols.cargando, sols.error, sols.datos.length) : '214'} label="Estudios solicitados" bg="bg-teal-50" fg="text-teal-600" to="/medico/solicitudes" />
        <KpiCard icon={CheckCircle2} value={real ? cuenta(!!r, res.error, r?.resultados ?? 0) : '9'} label="Resultados disponibles" bg="bg-emerald-50" fg="text-emerald-600" to="/medico/pacientes" />
        <KpiCard icon={Hourglass} value={real ? cuenta(!!r && !sols.cargando, res.error || sols.error, (r?.pendientes ?? 0) + sinEstudio) : '6'} label="Pendientes" bg="bg-orange-50" fg="text-orange-500" to="/medico/solicitudes" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Box icon={FilePlus2} title="Últimas referencias" to="/medico/solicitudes" linkText="Ver solicitudes">
          <div className="px-2 pb-2">
            {(!real || refsReales.length > 0) && (
              <Table>
                <thead><tr>{['Paciente', 'Estudio', 'Fecha', 'Hospital', 'Estado'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {(real
                    ? refsReales.map((s) => ({ key: s.id, patient: s.patient, record: s.record, study: s.study, mod: s.mod, date: s.date, hospital: s.hospital, status: s.status, tone: TONO_ESTADO[s.status] ?? 'gray' }))
                    : REFS.map((x) => ({ ...x, key: x.record + x.study }))
                  ).map((x) => (
                    <tr key={x.key} className="tr">
                      <td className="td"><p className="whitespace-nowrap font-semibold text-ink">{x.patient}</p><p className="text-[11px]">{x.record}</p></td>
                      <td className="td"><span className="flex items-center gap-2 whitespace-nowrap"><Modality m={x.mod} /> {x.study}</span></td>
                      <td className="td whitespace-nowrap">{x.date}</td>
                      <td className="td whitespace-nowrap">{x.hospital}</td>
                      <td className="td"><Badge tone={x.tone}>{x.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            <Aviso cargando={sols.cargando} error={sols.error} vacio={refsReales.length === 0} onRetry={sols.recargar}
              textoVacio="Aún no has enviado solicitudes de estudio. Usa «Solicitudes» para referir a un paciente." />
          </div>
        </Box>
        <Box icon={CheckCircle2} title="Resultados recientes" to="/medico/pacientes" linkText="Ver pacientes">
          <div className="divide-y divide-[#eef2f8] px-4">
            {real ? resultadosReales.map((x) => (
              <div key={x.s.id} className="flex items-center gap-3 py-2.5">
                <img src={x.s.img} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink">{x.patient}</p>
                  <p className="truncate text-[12px] text-slate-500">{x.s.name} · {x.s.date}</p>
                </div>
                <button onClick={() => setRepReal(x)} className="btn-outline !px-2.5 !py-1 !text-[12px]"><FileText size={14} /> Informe</button>
              </div>
            )) : results.map((s, i) => (
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
          <Aviso cargando={pacs.cargando} error={pacs.error} vacio={resultadosReales.length === 0} onRetry={pacs.recargar}
            textoVacio="Todavía no hay informes publicados de tus pacientes." />
        </Box>
      </div>

      <Box icon={TrendingUp} title="Referencias por mes">
        <div className="p-4">
          {real ? (
            <Bars labels={ultimos6.map((f) => MESES[f.getMonth()])} height={170} showValues max={Math.max(4, ...porMes)}
              series={[{ name: 'Estudios solicitados', color: '#0b57f0', values: porMes }]} />
          ) : (
            <Bars labels={['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct']} height={170} showValues
              series={[{ name: 'Estudios solicitados', color: '#0b57f0', values: [28, 34, 31, 39, 42, 40] }]} />
          )}
        </div>
      </Box>

      {real
        ? <ReportModal study={repReal?.s ?? null} onClose={() => setRepReal(null)} patient={repReal?.patient} record={repReal?.record} />
        : <ReportModal study={report} onClose={() => setReport(null)} patient={names[who]} record={recs[who]} />}
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
