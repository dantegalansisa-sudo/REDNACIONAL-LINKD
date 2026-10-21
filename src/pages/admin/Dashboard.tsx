import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowDown, ArrowRight, Building2, CalendarDays, ChevronDown, CircleCheck, Clock, Database,
  FileText, Info, LayoutGrid, LocateFixed, Minus, Plus, ScanLine, Settings2, ShieldCheck, Timer, TriangleAlert,
  UserRound, UserRoundPlus,
} from 'lucide-react'
import { Badge, DotsButton, IconCircle, Kpi, MoreLink, PageHeader, Panel, Table, clsx, type Tone } from '../../components/ui'
import { Bars, Donut, Legend, type Slice } from '../../components/charts'

/* ---------------- Datos mock ---------------- */
const RANGES = ['01/03/2025 - 31/03/2025', '01/02/2025 - 28/02/2025', '01/01/2025 - 31/03/2025', '01/01/2025 - 31/12/2025']

const porModalidad: Slice[] = [
  { label: 'RX', value: 5432, color: '#2f8cff' },
  { label: 'TC', value: 3125, color: '#a855f7' },
  { label: 'RM', value: 1842, color: '#f472b6' },
  { label: 'US', value: 1236, color: '#34d399' },
  { label: 'MG', value: 452, color: '#fbbf24' },
  { label: 'Otros', value: 371, color: '#9ca3af' },
]
const porEstado: Slice[] = [
  { label: 'Completados', value: 11276, color: '#16a34a' },
  { label: 'En proceso', value: 1182, color: '#fbbf24' },
  { label: 'Críticos', value: 78, color: '#ef4444' },
]
const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const porMes = [4800, 6300, 7700, 7400, 6900, 6600, 8900, 9800, 7100, 10100, 11300, 12458]

const conexion = [
  { label: 'Conectado', value: 52, color: '#16a34a' },
  { label: 'En proceso', value: 4, color: '#fbbf24' },
  { label: 'Sin conexión', value: 2, color: '#ef4444' },
]
const niveles = [
  { n: 'III', value: 12, cls: 'bg-violet-100 text-violet-700', bar: '#38bdf8' },
  { n: 'II', value: 24, cls: 'bg-brand-100 text-brand-700', bar: '#38bdf8' },
  { n: 'I', value: 22, cls: 'bg-amber-100 text-amber-600', bar: '#fbbf24' },
]

type Estado = 'En proceso' | 'Completado' | 'Pendiente'
const estadoTone: Record<Estado, Tone> = { 'En proceso': 'orange', Completado: 'green', Pendiente: 'red' }
const estudios: { fecha: string; hospital: string; paciente: string; mod: string; estado: Estado; asignado: string }[] = [
  { fecha: '12/03/2025 14:32', hospital: 'H. Pediátrico Hugo Mendoza', paciente: 'Carlos Méndez', mod: 'TC', estado: 'En proceso', asignado: '-' },
  { fecha: '12/03/2025 13:15', hospital: 'H. Dr. Marcelino Vélez', paciente: 'Ana Rodríguez', mod: 'RX', estado: 'Completado', asignado: 'Dr. López' },
  { fecha: '12/03/2025 12:48', hospital: 'H. Padre Billini', paciente: 'Luis Santana', mod: 'US', estado: 'Completado', asignado: 'Dra. Martínez' },
  { fecha: '12/03/2025 11:21', hospital: 'H. Traumatológico Ney Arias Lora', paciente: 'María Gómez', mod: 'RM', estado: 'En proceso', asignado: 'Dr. Pérez' },
  { fecha: '12/03/2025 10:56', hospital: 'H. Juan Pablo Pina', paciente: 'José Castillo', mod: 'TC', estado: 'Pendiente', asignado: '-' },
]

const alertas = [
  { icon: AlertTriangle, tone: 'red' as Tone, t: 'Falla de conexión HL7', s: 'Hospital Regional San Juan de la Maguana', time: 'Hace 12 min' },
  { icon: TriangleAlert, tone: 'orange' as Tone, t: 'Acumulación de estudios', s: 'H. Traumatológico Ney Arias Lora', time: 'Hace 28 min' },
  { icon: AlertTriangle, tone: 'red' as Tone, t: 'Equipo de RM fuera de servicio', s: 'Hospital Dr. Marcelino Vélez', time: 'Hace 1 hora' },
  { icon: Info, tone: 'blue' as Tone, t: 'Nueva versión de integración', s: 'H. Regional Taiwán 19 de Marzo', time: 'Hace 2 horas' },
  { icon: TriangleAlert, tone: 'orange' as Tone, t: 'Tiempo de respuesta alto - (> 12h)', s: 'Hospital Padre Billini', time: 'Hace 3 horas' },
]

const actividades = [
  { icon: FileText, tone: 'blue' as Tone, t: 'Informe emitido', s: 'TC de Cráneo', time: 'Hace 15 min' },
  { icon: ScanLine, tone: 'blue' as Tone, t: 'Estudio recibido', s: 'RM de Columna Lumbar', time: 'Hace 37 min' },
  { icon: ShieldCheck, tone: 'green' as Tone, t: 'Hospital conectado', s: 'Hospital Provincial de Azua', time: 'Hace 1 hora' },
  { icon: UserRoundPlus, tone: 'blue' as Tone, t: 'Usuario creado', s: 'Dra. Laura Sánchez (Radiólogo)', time: 'Hace 2 horas' },
  { icon: Settings2, tone: 'purple' as Tone, t: 'Parámetros actualizados', s: 'Configuración de HL7', time: 'Hace 3 horas' },
]

/* ---------------- Sub-componentes ---------------- */
function DateRange() {
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState(RANGES[0])
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-3 rounded-lg border border-[#d7e1f2] bg-white px-3.5 py-2.5 text-[13px] text-ink shadow-sm hover:border-brand-400">
        <CalendarDays size={17} className="text-brand-600" />
        <span className="tabular-nums">{range}</span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-full min-w-[230px] overflow-hidden rounded-lg border border-[#e3eaf6] bg-white py-1 shadow-soft">
          {RANGES.map((r) => (
            <button key={r} onClick={() => { setRange(r); setOpen(false) }}
              className={clsx('block w-full px-3.5 py-2 text-left text-[12.5px] tabular-nums hover:bg-brand-50', r === range && 'font-semibold text-brand-700')}>
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function HospitalMap() {
  const [zoom, setZoom] = useState(1)
  const navigate = useNavigate()
  const ctrl = 'flex h-8 w-8 items-center justify-center text-ink hover:bg-brand-50'
  return (
    <Panel title="Mapa de hospitales conectados" className="h-full" bodyClass="flex">
      <div className="flex w-full flex-col gap-3 rounded-xl bg-gradient-to-br from-[#eef5ff] to-[#e3eefc] p-3 sm:flex-row">
        <div className="relative min-h-[260px] flex-1 overflow-hidden rounded-lg">
          <img src="/img/crops/mapa-dashboard.webp" alt="Mapa de hospitales conectados en República Dominicana"
            className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 mix-blend-multiply"
            style={{ transform: `scale(${zoom})` }} />
          <div className="absolute left-1 top-1 flex flex-col overflow-hidden rounded-md border border-[#d7e1f2] bg-white shadow-sm">
            <button className={ctrl} onClick={() => setZoom((z) => Math.min(1.8, z + 0.2))} aria-label="Acercar"><Plus size={16} /></button>
            <button className={clsx(ctrl, 'border-t border-[#e6edf8]')} onClick={() => setZoom((z) => Math.max(1, z - 0.2))} aria-label="Alejar"><Minus size={16} /></button>
          </div>
          <button className="absolute left-1 top-[76px] flex h-8 w-8 items-center justify-center rounded-md border border-[#d7e1f2] bg-white text-ink shadow-sm hover:bg-brand-50"
            onClick={() => setZoom(1)} aria-label="Centrar mapa"><LocateFixed size={16} /></button>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:w-[150px]">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="mb-2 text-[12.5px] font-semibold text-ink">Estado de conexión</div>
            <ul className="space-y-1.5 text-[12px]">
              {conexion.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="flex-1 text-ink/90">{c.label}</span>
                  <span className="tabular-nums text-ink">{c.value}</span>
                </li>
              ))}
            </ul>
            <div className="mb-2 mt-4 text-[12.5px] font-semibold text-ink">Por nivel</div>
            <ul className="space-y-2 text-[12px]">
              {niveles.map((n) => (
                <li key={n.n} className="flex items-center gap-2">
                  <span className={clsx('flex h-[18px] w-[22px] items-center justify-center rounded text-[10px] font-bold', n.cls)}>{n.n}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8eef8]">
                    <span className="block h-full rounded-full" style={{ width: `${(n.value / 24) * 85}%`, background: n.bar }} />
                  </span>
                  <span className="w-5 text-right tabular-nums text-ink">{n.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <button onClick={() => navigate('/admin/hospitales')} className="btn-outline mt-auto justify-center gap-1 bg-white text-[12px]">
            Ver mapa completo <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </Panel>
  )
}

function DonutCard({ title, data, center }: { title: string; data: Slice[]; center: string }) {
  return (
    <Panel title={title} action={<MoreLink />} bodyClass="flex items-center gap-4">
      <Donut data={data} size={128} thickness={20} center={<><span className="text-[19px] font-bold text-ink">{center}</span><span className="text-[11px] text-slate-500">Estudios</span></>} />
      <Legend data={data} className="text-[12px]" />
    </Panel>
  )
}

function FeedItem({ icon, tone, t, s, time }: { icon: typeof Info; tone: Tone; t: string; s: string; time: string }) {
  return (
    <li className="flex items-start gap-3 border-t border-[#eef2f8] py-2.5 first:border-0 first:pt-1">
      <IconCircle icon={icon} tone={tone} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold text-ink">{t}</div>
        <div className="truncate text-[11.5px] text-slate-500">{s}</div>
      </div>
      <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-500">{time}</span>
    </li>
  )
}

/* ---------------- Página ---------------- */
export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader icon={LayoutGrid} title="Dashboard General" subtitle="Vista ejecutiva del estado de la red nacional de imágenes médicas" actions={<DateRange />} />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <Kpi icon={Building2} tone="blue" value="58" label="Hospitales">
          <button onClick={() => navigate('/admin/hospitales')} className="mt-0.5 flex items-center gap-1 text-[12px] text-emerald-600 hover:underline">
            <CircleCheck size={13} /> 52 activos (89.7%) <ArrowRight size={13} className="text-brand-600" />
          </button>
        </Kpi>
        <Kpi icon={Database} tone="blue" value="12,458" label="Estudios recibidos" sub="12% vs. mes anterior" trend="up" />
        <Kpi icon={FileText} tone="purple" value="11,276" label="Informes emitidos" sub="14% vs. mes anterior" trend="up" />
        <Kpi icon={Clock} tone="orange" value="1,182" label="Estudios pendientes" sub="8% vs. mes anterior" trend="up" trendTone="bad" />
        <Kpi icon={UserRound} tone="blue" value="36" label="Radiólogos activos">
          <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">4 en convocatoria</span>
        </Kpi>
        <Kpi icon={AlertTriangle} tone="red" value="12" label="Incidencias críticas">
          <span className="mt-1 inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[11px] text-red-600">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">!</span> 6 por integrar
          </span>
        </Kpi>
      </div>

      {/* Mapa + gráficos */}
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-5"><HospitalMap /></div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:col-span-7">
          <DonutCard title="Estudios por modalidad" data={porModalidad} center="12,458" />
          <DonutCard title="Estudios por estado" data={porEstado} center="12,458" />
          <Panel title="Estudios por mes" action={<MoreLink />}>
            <Bars labels={meses} series={[{ name: 'Estudios', color: '#4fa3f7', values: porMes }]} max={15000} yTicks={3} height={150} barWidth={0.72} />
          </Panel>
          <Panel title="Tiempo promedio de respuesta" action={<MoreLink />} bodyClass="flex items-center gap-4">
            <IconCircle icon={Timer} tone="blue" size="lg" className="!h-16 !w-16" />
            <div className="min-w-0">
              <div className="flex items-baseline gap-3">
                <span className="text-[26px] font-bold text-ink">6.8 horas</span>
                <span className="flex items-center text-[14px] font-semibold text-emerald-600"><ArrowDown size={15} /> 18%</span>
              </div>
              <p className="text-[13px] leading-snug text-slate-500">Desde recepción del estudio<br />hasta emisión del informe</p>
            </div>
          </Panel>
        </div>
      </div>

      {/* Tabla + alertas + actividades */}
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel title="Últimos estudios recibidos" action={<MoreLink onClick={() => navigate('/admin/estudios')}>Ver todos</MoreLink>} className="xl:col-span-6" bodyClass="px-0 pb-2">
          <Table>
            <thead className="bg-[#f6f9fe]">
              <tr>{['Fecha', 'Hospital', 'Paciente', 'Modalidad', 'Estado', 'Asignado a', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {estudios.map((e) => (
                <tr key={e.fecha} className="tr">
                  <td className="td whitespace-nowrap tabular-nums">{e.fecha}</td>
                  <td className="td min-w-[140px]">{e.hospital}</td>
                  <td className="td whitespace-nowrap">{e.paciente}</td>
                  <td className="td">{e.mod}</td>
                  <td className="td"><Badge tone={estadoTone[e.estado]} dot={false} className="min-w-[78px] justify-center py-1">{e.estado}</Badge></td>
                  <td className="td whitespace-nowrap">{e.asignado}</td>
                  <td className="td"><DotsButton /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:col-span-6">
          <Panel title="Alertas y notificaciones" action={<MoreLink onClick={() => navigate('/admin/operaciones')}>Ver todas</MoreLink>}>
            <ul>{alertas.map((a) => <FeedItem key={a.t} {...a} />)}</ul>
          </Panel>
          <Panel title="Actividades recientes" action={<MoreLink onClick={() => navigate('/admin/auditoria')}>Ver todas</MoreLink>}>
            <ul>{actividades.map((a) => <FeedItem key={a.t} {...a} />)}</ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
