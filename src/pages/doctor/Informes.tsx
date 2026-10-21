import { useMemo, useState } from 'react'
import { CheckCircle2, Clock, Eye, FileText, Star, TrendingUp } from 'lucide-react'
import { Badge, Modality, Pagination, SearchInput, Select, Stars, Table, Tabs, type Tone } from '../../components/ui'
import { PortalHeading, ReportModal, STUDIES, type Study } from '../patient/PatientPortal'
import { RoleNotice, useDoctorRole } from './DoctorPortal'
import { useSesion } from '../../lib/session'
import { fetchMisInformes, supabaseConfigurado, useDatos, type InformeEmitido } from '../../lib/portal-data'

type Rep = {
  id: string; patient: string; study: string; mod: string; hospital: string; date: string; tat: string
  status: 'Publicado' | 'Adenda' | 'Borrador' | 'En revisión' | 'Firmado' | 'Corregido'; rating: number; comment: string; ref: Study; record?: string
}

const STATUS_TONE: Record<Rep['status'], Tone> = { Publicado: 'green', Adenda: 'purple', Borrador: 'yellow', 'En revisión': 'blue', Firmado: 'teal', Corregido: 'purple' }
const TABS_DEMO = ['Todos', 'Publicado', 'Adenda', 'Borrador', 'En revisión']
const TABS_REAL = ['Todos', 'Publicado', 'Firmado', 'Borrador', 'Corregido']

/** Informe de la base → fila de la tabla */
const aRep = (i: InformeEmitido): Rep => ({
  id: i.numero, patient: i.patient, record: i.record, study: i.study, mod: i.mod, hospital: i.hospital, date: i.date, tat: i.tat,
  status: i.status, rating: i.rating, comment: '', ref: i.ref,
})
/** "32 min" / "1.5 h" → horas */
const horasTat = (t: string) => (/min$/.test(t) ? parseFloat(t) / 60 : /h$/.test(t) ? parseFloat(t) : NaN)
const hoyTexto = () => new Date().toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' })

const REPORTS: Rep[] = [
  { id: 'INF-2026-008841', patient: 'Francisco Javier Ureña', study: 'TC de cráneo simple', mod: 'CT', hospital: 'Hospital Hugo Mendoza', date: '20/10/2026 07:48 a. m.', tat: '32 min', status: 'Publicado', rating: 5, comment: 'Informe claro y oportuno.', ref: STUDIES[0] },
  { id: 'INF-2026-008836', patient: 'Yolanda Mercedes Paulino', study: 'Radiografía de tórax PA', mod: 'RX', hospital: 'Hospital General', date: '20/10/2026 07:21 a. m.', tat: '18 min', status: 'Publicado', rating: 5, comment: 'Excelente correlación clínica.', ref: STUDIES[1] },
  { id: 'INF-2026-008829', patient: 'Héctor Manuel Cabrera', study: 'RM de columna lumbar', mod: 'MR', hospital: 'Hospital Dr. Francisco A. Gonzalvo', date: '19/10/2026 05:10 p. m.', tat: '2 h 05 min', status: 'Adenda', rating: 4, comment: 'Se solicitó ampliar descripción de L4-L5.', ref: STUDIES[2] },
  { id: 'INF-2026-008815', patient: 'Carmen Julia Santos', study: 'Mamografía bilateral', mod: 'MG', hospital: 'Hospital General', date: '19/10/2026 03:40 p. m.', tat: '—', status: 'Borrador', rating: 0, comment: '', ref: STUDIES[3] },
  { id: 'INF-2026-008802', patient: 'Andrés Felipe Rosario', study: 'Ecografía abdominal', mod: 'US', hospital: 'Hospital Hugo Mendoza', date: '19/10/2026 11:25 a. m.', tat: '45 min', status: 'Publicado', rating: 4.5, comment: 'Muy completo.', ref: STUDIES[3] },
  { id: 'INF-2026-008790', patient: 'Teresa de Jesús Almonte', study: 'TC de abdomen con contraste', mod: 'CT', hospital: 'Hospital Dr. Francisco A. Gonzalvo', date: '18/10/2026 06:02 p. m.', tat: '1 h 12 min', status: 'En revisión', rating: 0, comment: 'Revisión por par (control de calidad).', ref: STUDIES[5] },
  { id: 'INF-2026-008771', patient: 'Ramón Emilio Taveras', study: 'Radiografía de rodilla', mod: 'RX', hospital: 'Hospital General', date: '18/10/2026 10:14 a. m.', tat: '22 min', status: 'Publicado', rating: 5, comment: 'Rápido y preciso.', ref: STUDIES[7] },
  { id: 'INF-2026-008760', patient: 'Juan Pérez Gómez', study: 'Ecografía tiroidea', mod: 'US', hospital: 'Hospital Hugo Mendoza', date: '17/10/2026 04:55 p. m.', tat: '38 min', status: 'Publicado', rating: 5, comment: '', ref: STUDIES[6] },
]

export default function Informes() {
  const { role } = useDoctorRole()
  const m = useSesion().sesion?.medico
  const radiologo = m?.tipo === 'radiologo' ? m.id : null
  const { datos, cargando, error, recargar } = useDatos<InformeEmitido[]>(() => (radiologo ? fetchMisInformes(radiologo) : Promise.resolve([])), [], [radiologo])
  const real = supabaseConfigurado
  const [tab, setTab] = useState(0)
  const [mod, setMod] = useState('Todas las modalidades')
  const [view, setView] = useState<Rep | null>(null)
  const [hoy] = useState(hoyTexto)
  const tabs = real ? TABS_REAL : TABS_DEMO
  const reports = useMemo(() => (real ? datos.map(aRep) : REPORTS), [real, datos])
  const list = useMemo(() => reports.filter((r) => (tab === 0 || r.status === tabs[tab]) && (mod === 'Todas las modalidades' || r.mod === mod)), [reports, tabs, tab, mod])

  if (role !== 'radiologo') return <RoleNotice needed="radiologo" />

  // Indicadores reales calculados sobre los informes del radiólogo
  const publicados = reports.filter((r) => r.status === 'Publicado')
  const tats = publicados.map((r) => horasTat(r.tat)).filter((h) => !Number.isNaN(h))
  const tatProm = tats.length ? tats.reduce((a, b) => a + b, 0) / tats.length : null
  const calificados = reports.filter((r) => r.rating > 0)
  const califProm = calificados.length ? calificados.reduce((a, r) => a + r.rating, 0) / calificados.length : null
  const v = (x: string) => (cargando && reports.length === 0 ? '…' : error ? '—' : x)
  const kpis = real
    ? [
      { i: FileText, v: v(String(publicados.length)), l: 'Informes publicados', c: 'text-brand-600' },
      { i: CheckCircle2, v: v(String(publicados.filter((r) => r.date === hoy).length)), l: 'Publicados hoy', c: 'text-emerald-600' },
      { i: Clock, v: v(tatProm == null ? '—' : tatProm < 1 ? `${Math.round(tatProm * 60)} min` : `${tatProm.toFixed(1)} h`), l: 'Tiempo promedio de respuesta', c: 'text-violet-600' },
      { i: Star, v: v(califProm == null ? '—' : `${califProm.toFixed(1)} / 5`), l: 'Calificación promedio', c: 'text-amber-500' },
    ]
    : [
      { i: FileText, v: '1,248', l: 'Informes emitidos (2026)', c: 'text-brand-600' },
      { i: CheckCircle2, v: '14', l: 'Emitidos hoy', c: 'text-emerald-600' },
      { i: Clock, v: '38 min', l: 'Tiempo promedio de respuesta', c: 'text-violet-600' },
      { i: Star, v: '4.9 / 5', l: 'Calificación promedio', c: 'text-amber-500' },
    ]

  return (
    <div>
      <PortalHeading icon={FileText} title="Informes" subtitle="Informes emitidos, su estado de publicación y la calificación de los médicos referidores." />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.l} className="card flex items-center gap-3 px-4 py-3">
            <k.i size={24} className={k.c} />
            <div className="min-w-0"><p className="text-[21px] font-bold leading-none text-navy-800">{k.v}</p><p className="truncate text-[12.5px] text-slate-500">{k.l}</p></div>
          </div>
        ))}
      </div>

      <section className="card min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3 px-3 pt-2">
          <Tabs tabs={tabs} active={tab} onChange={setTab} className="!border-0" />
          <div className="flex flex-wrap gap-2 pb-2">
            <SearchInput placeholder="Buscar paciente o N.º de informe" className="w-full sm:w-[260px]" />
            <Select options={['Todas las modalidades', 'CT', 'MR', 'RX', 'US', 'MG']} onChange={setMod} className="w-full sm:w-[190px]" />
          </div>
        </div>
        <Table className="border-t border-[#eef2f8]">
          <thead className="bg-[#f3f7fd]">
            <tr>{['N.º informe', 'Paciente', 'Estudio', 'Hospital', 'Fecha de emisión', 'TAT', 'Estado', 'Calificación', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {real && cargando && reports.length === 0 && <tr><td colSpan={9} className="td py-8 text-center text-slate-500">Cargando informes…</td></tr>}
            {real && !cargando && error && (
              <tr><td colSpan={9} className="td py-8 text-center text-red-600">No se pudieron cargar los informes: {error} <button onClick={recargar} className="ml-2 font-semibold text-brand-600 hover:underline">Reintentar</button></td></tr>
            )}
            {real && !cargando && !error && reports.length === 0 && (
              <tr><td colSpan={9} className="td py-8 text-center">Aún no has emitido informes. Los informes que guardes o publiques desde la lista de trabajo aparecerán aquí.</td></tr>
            )}
            {list.map((r) => (
              <tr key={r.id} className="tr">
                <td className="td whitespace-nowrap font-semibold text-brand-700">{r.id}</td>
                <td className="td whitespace-nowrap font-semibold text-ink">{r.patient}</td>
                <td className="td"><span className="flex items-center gap-2 whitespace-nowrap"><Modality m={r.mod} /> {r.study}</span></td>
                <td className="td whitespace-nowrap">{r.hospital}</td>
                <td className="td whitespace-nowrap">{r.date}</td>
                <td className="td whitespace-nowrap">{r.tat}</td>
                <td className="td"><Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge></td>
                <td className="td">
                  {r.rating ? (
                    <div title={r.comment} className="whitespace-nowrap"><Stars value={r.rating} /> <span className="ml-1 text-[11.5px] font-semibold text-ink">{r.rating.toFixed(1)}</span></div>
                  ) : <span className="text-[11.5px] text-slate-400">Sin calificar</span>}
                </td>
                <td className="td"><button disabled={!r.ref?.id} onClick={() => setView(r)} className="btn-outline whitespace-nowrap !px-2.5 !py-1 !text-[12px]"><Eye size={14} /> Ver</button></td>
              </tr>
            ))}
            {list.length === 0 && reports.length > 0 && <tr><td colSpan={9} className="td py-8 text-center">No hay informes con este filtro.</td></tr>}
          </tbody>
        </Table>
        {real
          ? <Pagination text={`Mostrando ${list.length} de ${reports.length} informe${reports.length === 1 ? '' : 's'}`} totalPages={1} perPage={false} />
          : <Pagination text={`Mostrando ${list.length} de 1,248 informes`} pages={[1, 2, 3]} last={156} />}
      </section>

      <section className="card mt-4 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-navy-800"><TrendingUp size={18} className="text-brand-600" /> {real ? 'Calificaciones recientes de referidores' : 'Comentarios recientes de referidores'}</h3>
        {real && calificados.length === 0 && <p className="text-[13px] text-slate-500">{cargando ? 'Cargando…' : 'Aún no hay calificaciones de tus informes.'}</p>}
        <div className="grid gap-3 md:grid-cols-3">
          {real && calificados.slice(0, 3).map((r) => (
            <div key={r.id} className="rounded-xl bg-[#f7faff] p-3.5">
              <Stars value={r.rating} />
              <p className="mt-1.5 text-[13px] font-semibold text-ink">{r.rating.toFixed(1)} / 5 · {r.id}</p>
              <p className="mt-1 text-[11.5px] text-slate-500">{r.study} · {r.patient}</p>
            </div>
          ))}
          {!real && REPORTS.filter((r) => r.comment && r.rating).slice(0, 3).map((r) => (
            <div key={r.id} className="rounded-xl bg-[#f7faff] p-3.5">
              <Stars value={r.rating} />
              <p className="mt-1.5 text-[13px] italic text-ink">“{r.comment}”</p>
              <p className="mt-1 text-[11.5px] text-slate-500">{r.study} · {r.patient}</p>
            </div>
          ))}
        </div>
      </section>

      <ReportModal study={view?.ref ?? null} onClose={() => setView(null)} patient={view?.patient} record={view ? (view.record ?? 'HN-000' + view.id.slice(-5)) : undefined} />
    </div>
  )
}
