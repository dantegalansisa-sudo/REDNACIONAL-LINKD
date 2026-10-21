import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle, Building2, Calendar, CheckCircle2, ChevronDown, Clock, Eye, FileText, Filter, Flag, Hourglass,
  Hospital, Images, Layers, MonitorPlay, MoreHorizontal, Plus, Siren, Tag, TriangleAlert, Upload, UserRound,
  type LucideIcon,
} from 'lucide-react'
import { Badge, Checkbox, Kpi, Modality, PageHeader, Pagination, Select, Table, Tabs, clsx, type Tone } from '../../components/ui'

/* ---------------- Datos mock ---------------- */
type Prioridad = 'Emergencia' | 'Urgencia' | 'Hospitalizado' | 'Ambulatorio'
type EstadoEst = 'Nuevo' | 'Visto' | 'Reportado'
type EstadoInf = 'En edición' | 'Informado' | 'Pendiente'
type Vence = { t: string; kind: 'critico' | 'alerta' | 'ok' | 'vencido' | 'rojo' }

type Estudio = {
  id: string; fecha: string; hora: string; paciente: string; sexo: 'M' | 'F'; edad: number; hospital: string; ciudad: string
  mod: string; prioridad: Prioridad; estado: EstadoEst; informe: EstadoInf; radiologo: string
  lectura: string; frac: number; color: string; vence: Vence; obs: string
}

const ESTUDIOS: Estudio[] = [
  { id: 'EST-2025-000892', fecha: '15/03/2025', hora: '10:24 a. m.', paciente: 'Juan Pérez', sexo: 'M', edad: 45, hospital: 'Hosp. Hugo Mendoza', ciudad: 'Santo Domingo', mod: 'CT', prioridad: 'Emergencia', estado: 'Nuevo', informe: 'En edición', radiologo: 'Dra. María López', lectura: '12 min', frac: 1, color: '#16a34a', vence: { t: '18 min', kind: 'critico' }, obs: 'Sospecha de ACV. Prioridad alta.' },
  { id: 'EST-2025-000891', fecha: '15/03/2025', hora: '10:18 a. m.', paciente: 'María López', sexo: 'F', edad: 62, hospital: 'Hosp. Dr. Fco. A. Gonzalvo', ciudad: 'La Romana', mod: 'XR', prioridad: 'Urgencia', estado: 'Visto', informe: 'Informado', radiologo: 'Dr. Carlos Méndez', lectura: '1 h 05 min', frac: 1, color: '#f59e0b', vence: { t: '15 min', kind: 'alerta' }, obs: 'Dolor torácico. Descartar neumotórax.' },
  { id: 'EST-2025-000890', fecha: '15/03/2025', hora: '09:55 a. m.', paciente: 'Carlos Peña', sexo: 'M', edad: 37, hospital: 'Hosp. Juan de Herrera', ciudad: 'San Juan de la Maguana', mod: 'MR', prioridad: 'Hospitalizado', estado: 'Visto', informe: 'Informado', radiologo: 'Dra. Ana Rodríguez', lectura: '3 h 42 min', frac: 1, color: '#16a34a', vence: { t: '20 h 18 min', kind: 'ok' }, obs: 'Control post quirúrgico de rodilla.' },
  { id: 'EST-2025-000889', fecha: '15/03/2025', hora: '09:32 a. m.', paciente: 'Ana Rodríguez', sexo: 'F', edad: 28, hospital: 'Hosp. Municipal Boca Chica', ciudad: 'Boca Chica', mod: 'US', prioridad: 'Ambulatorio', estado: 'Reportado', informe: 'Informado', radiologo: 'Dr. Luis Vargas', lectura: '22 h 15 min', frac: 1, color: '#16a34a', vence: { t: '2 días 4 h', kind: 'ok' }, obs: 'Ecografía obstétrica de rutina.' },
  { id: 'EST-2025-000888', fecha: '15/03/2025', hora: '08:41 a. m.', paciente: 'Pedro Martínez', sexo: 'M', edad: 70, hospital: 'Hosp. Regional Universitario', ciudad: 'Santiago', mod: 'CT', prioridad: 'Urgencia', estado: 'Visto', informe: 'En edición', radiologo: 'Dra. Sofía Méndez', lectura: '48 min', frac: 1, color: '#ef4444', vence: { t: '1 h 12 min', kind: 'rojo' }, obs: 'Trauma craneoencefálico leve.' },
  { id: 'EST-2025-000887', fecha: '15/03/2025', hora: '08:15 a. m.', paciente: 'Lucía Jiménez', sexo: 'F', edad: 50, hospital: 'Hosp. Jaime Mota', ciudad: 'Barahona', mod: 'MG', prioridad: 'Ambulatorio', estado: 'Visto', informe: 'Informado', radiologo: 'Dr. Miguel Santos', lectura: '1 día 4 h', frac: 1, color: '#84a83a', vence: { t: '5 días 6 h', kind: 'ok' }, obs: 'Mamografía de tamizaje anual.' },
  { id: 'EST-2025-000886', fecha: '15/03/2025', hora: '08:41 a. m.', paciente: 'Roberto Díaz', sexo: 'M', edad: 61, hospital: 'Hosp. Ntra. Sra. Altagracia', ciudad: 'Higüey', mod: 'CT', prioridad: 'Hospitalizado', estado: 'Nuevo', informe: 'Pendiente', radiologo: '-', lectura: '-', frac: 0.1, color: '#16a34a', vence: { t: '21 h 54 min', kind: 'ok' }, obs: 'TC de abdomen con contraste.' },
  { id: 'EST-2025-000885', fecha: '15/03/2025', hora: '06:38 a. m.', paciente: 'Carmen Vargas', sexo: 'F', edad: 33, hospital: 'Hosp. Municipal Constanza', ciudad: 'Constanza', mod: 'US', prioridad: 'Ambulatorio', estado: 'Reportado', informe: 'Informado', radiologo: 'Dra. Laura Fernández', lectura: '2 días 3 h', frac: 0.5, color: '#16a34a', vence: { t: '2 días 18 h', kind: 'ok' }, obs: 'Ecografía abdominal.' },
  { id: 'EST-2025-000884', fecha: '15/03/2025', hora: '05:21 a. m.', paciente: 'Luis Santana', sexo: 'M', edad: 56, hospital: 'Hosp. Taiwán 19 de Marzo', ciudad: 'Azua', mod: 'RX', prioridad: 'Hospitalizado', estado: 'Visto', informe: 'Informado', radiologo: 'Dr. Carlos Méndez', lectura: '26 h 10 min', frac: 0.5, color: '#ef4444', vence: { t: 'Vencido', kind: 'vencido' }, obs: 'Radiografía de tórax PA y lateral.' },
  { id: 'EST-2025-000883', fecha: '15/03/2025', hora: '04:58 a. m.', paciente: 'Sofía Méndez', sexo: 'F', edad: 41, hospital: 'Hosp. Dr. Antonio Musa', ciudad: 'San Pedro de Macorís', mod: 'MR', prioridad: 'Ambulatorio', estado: 'Nuevo', informe: 'Pendiente', radiologo: '-', lectura: '-', frac: 0, color: '#16a34a', vence: { t: '6 días 12 h', kind: 'ok' }, obs: 'RM de columna lumbar.' },
]

const PRIORIDAD: Record<Prioridad, { cls: string; tone: Tone; label: string; max: string }> = {
  Emergencia: { cls: 'bg-red-50 text-red-600', tone: 'red', label: 'Emergencia Crítica', max: '< 30 min' },
  Urgencia: { cls: 'bg-orange-50 text-orange-500', tone: 'orange', label: 'Urgencia', max: '< 2 horas' },
  Hospitalizado: { cls: 'bg-brand-50 text-brand-700', tone: 'blue', label: 'Hospitalizado', max: '< 48 horas' },
  Ambulatorio: { cls: 'bg-violet-50 text-violet-700', tone: 'purple', label: 'Ambulatorio', max: '< 7 días' },
}
const ESTADO_TONE: Record<EstadoEst, Tone> = { Nuevo: 'blue', Visto: 'green', Reportado: 'green' }
const INFORME_TONE: Record<EstadoInf, Tone> = { 'En edición': 'orange', Informado: 'green', Pendiente: 'gray' }
const MOD_NOMBRE: Record<string, string> = { CT: 'Tomografía Computarizada', XR: 'Radiografía Digital', RX: 'Radiografía Convencional', MR: 'Resonancia Magnética', US: 'Ultrasonido', MG: 'Mamografía' }
const THUMB: Record<string, string> = { CT: '/img/crops/ct-cerebro.webp', XR: '/img/crops/rx-torax.webp', RX: '/img/crops/rx-torax.webp', MR: '/img/crops/mr.webp', US: '/img/crops/us.webp', MG: '/img/crops/mg.webp' }

/* ---------------- Piezas ---------------- */
function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <Badge tone={tone} icon className="rounded-full">{children}</Badge>
}

function PieDot({ frac, color }: { frac: number; color: string }) {
  const r = 6, c = 2 * Math.PI * r
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" className="-rotate-90 shrink-0">
      <circle cx={7} cy={7} r={6.5} fill="#eef2f8" />
      <circle cx={7} cy={7} r={r / 2} fill="none" stroke={color} strokeWidth={r} strokeDasharray={`${frac * (c / 2)} ${c}`} />
    </svg>
  )
}

function VenceCell({ v }: { v: Vence }) {
  if (v.kind === 'vencido') return <Badge tone="red" icon className="rounded-full">Vencido</Badge>
  const map: Record<Exclude<Vence['kind'], 'vencido'>, { icon: LucideIcon; cls: string }> = {
    critico: { icon: Plus, cls: 'text-red-600' },
    alerta: { icon: Clock, cls: 'text-orange-500' },
    rojo: { icon: AlertTriangle, cls: 'text-red-600' },
    ok: { icon: Hourglass, cls: 'text-emerald-600' },
  }
  const { icon: Icon, cls } = map[v.kind]
  return <span className={clsx('inline-flex items-center gap-1 whitespace-nowrap font-semibold', cls)}><Icon size={14} strokeWidth={v.kind === 'critico' ? 4 : 2.2} />{v.t}</span>
}

function ExportButton() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button className="btn-primary px-5 py-2.5" onClick={() => setOpen(!open)}><Upload size={17} /> Exportar <ChevronDown size={16} className="ml-4" /></button>
      {open && (
        <div className="absolute right-0 top-12 z-20 w-44 overflow-hidden rounded-lg border border-[#e3eaf6] bg-white py-1 shadow-soft">
          {['Exportar a PDF', 'Exportar a Excel', 'Exportar a CSV'].map((o) => (
            <button key={o} onClick={() => setOpen(false)} className="block w-full px-4 py-2 text-left text-[12.5px] text-ink hover:bg-brand-50">{o}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Página ---------------- */
export default function Estudios() {
  const [sel, setSel] = useState(ESTUDIOS[0].id)
  const [tab, setTab] = useState(0)
  const [checked, setChecked] = useState<string[]>([])
  const [fHosp, setFHosp] = useState('TODOS los hospitales')
  const [fMod, setFMod] = useState('Todas las modalidades')
  const [fEst, setFEst] = useState('Todos los estados')
  const [fInf, setFInf] = useState('Todos los estados de informe')

  const list = useMemo(() => ESTUDIOS.filter((e) =>
    (fHosp === 'TODOS los hospitales' || e.hospital === fHosp)
    && (fMod === 'Todas las modalidades' || e.mod === fMod)
    && (fEst === 'Todos los estados' || e.estado === fEst)
    && (fInf === 'Todos los estados de informe' || e.informe === fInf)), [fHosp, fMod, fEst, fInf])

  const est = ESTUDIOS.find((e) => e.id === sel) ?? ESTUDIOS[0]
  const allChecked = list.length > 0 && list.every((e) => checked.includes(e.id))

  return (
    <>
      <PageHeader icon={Images} title="Estudios de imágenes"
        subtitle="Monitoreo de estudios entrantes, estado de lectura, tiempos de respuesta y desempeño de radiología"
        actions={<ExportButton />} />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <Kpi icon={UserRound} tone="blue" value="1,248" label="Total de estudios (hoy)" sub="12% vs. ayer" trend="up" />
        <Kpi icon={FileText} tone="blue" value="892" label="Nuevos" sub="71.5% del total" />
        <Kpi icon={Eye} tone="orange" value="214" label="Vistos" sub="17.1% del total" />
        <Kpi icon={CheckCircle2} tone="green" value="118" label="Reportados" sub="9.5% del total" />
        <Kpi icon={TriangleAlert} tone="red" value="24" label="Fallidos" sub="1.9% del total" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="card min-w-0 p-3 xl:col-span-7">
          <h3 className="mb-2 flex items-center gap-2 text-[14px] font-bold text-ink"><FileText size={17} className="text-brand-600" /> Tiempo promedio de reporte</h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <TiempoCard icon={Siren} bg="bg-red-50" iconCls="bg-red-500" title="Emergencia Crítica" titleCls="text-red-600" value="28 min" valueCls="text-red-600" obj="Objetivo: < 30 min" />
            <TiempoCard icon={AlertTriangle} bg="bg-orange-50" iconCls="bg-orange-500" title="Urgencias Generales" titleCls="text-orange-600" value="1 h 26 min" valueCls="text-orange-500" obj="Objetivo: 1–2 h" />
            <TiempoCard icon={Hospital} bg="bg-brand-50" iconCls="bg-brand-600" title="Hospitalizado" titleCls="text-brand-700" value="18 h 40 min" valueCls="text-brand-700" obj="Objetivo: 24–48 h" />
            <TiempoCard icon={TriangleAlert} bg="bg-violet-50" iconCls="bg-violet-600" title="Ambulatorio" titleCls="text-violet-700" value="3.6 días" valueCls="text-ink" obj="Objetivo: 3–7 días" />
          </div>
        </section>
        <section className="card min-w-0 p-3 xl:col-span-5">
          <h3 className="mb-2 flex items-center gap-2 text-[14px] font-bold text-ink"><Building2 size={17} className="text-brand-600" /> Estudios próximos a vencer</h3>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <VencerCard bg="bg-red-50" circle="bg-red-500 text-white" icon={<span className="text-[13px] font-bold">12</span>} value="12" vcls="text-red-600" l1="< 30 min" l2="Emergencia" l2cls="text-red-600" />
            <VencerCard bg="bg-orange-50" circle="bg-orange-500 text-white" icon={<Siren size={16} />} value="28" vcls="text-orange-500" l1="< 2 horas" l2="Urgencias" />
            <VencerCard bg="bg-amber-50" circle="bg-amber-400 text-white" icon={<Eye size={16} />} value="46" vcls="text-amber-500" l1="< 24 horas" l2="Hospitalizados" />
            <VencerCard bg="bg-brand-50" circle="bg-brand-600 text-white" icon={<Calendar size={16} />} value="31" vcls="text-brand-700" l1="< 7 días" l2="Ambulatorios" />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="min-w-0 space-y-3 xl:col-span-9">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[1fr_1fr_0.9fr_0.9fr_0.7fr_0.6fr]">
            <Select icon={Building2} options={['TODOS los hospitales', ...Array.from(new Set(ESTUDIOS.map((e) => e.hospital)))]} onChange={setFHosp} className="[&_select]:bg-white" />
            <Select icon={Layers} options={['Todas las modalidades', 'CT', 'MR', 'XR', 'RX', 'US', 'MG']} onChange={setFMod} />
            <Select icon={Tag} options={['Todos los estados', 'Nuevo', 'Visto', 'Reportado']} onChange={setFEst} />
            <Select icon={Flag} options={['Todos los estados de informe', 'En edición', 'Informado', 'Pendiente']} onChange={setFInf} />
            <Select icon={Calendar} options={['Hoy', 'Ayer', 'Últimos 7 días', 'Últimos 30 días']} />
            <button className="btn-outline bg-white"><Filter size={16} /> Más filtros</button>
          </div>

          <section className="card min-w-0">
            <div className="flex items-center gap-3 px-4 pb-2 pt-3.5">
              <FileText size={24} className="text-brand-600" />
              <h3 className="text-[16px] font-bold text-ink">Listado de estudios</h3>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11.5px] text-brand-700">1,248 registros</span>
            </div>
            <Table className="[&_.td]:px-[5px] [&_.th]:whitespace-normal [&_.th]:px-[5px] [&_.th]:leading-tight [&_td>span.rounded-full]:gap-1 [&_td>span.rounded-full]:px-1.5 [&_td>span.rounded-full]:text-[10.5px]">
              <thead>
                <tr className="bg-[#f6f9fe]">
                  <th className="th !pl-4"><Checkbox checked={allChecked} onChange={(v) => setChecked(v ? list.map((e) => e.id) : [])} /></th>
                  <th className="th">#</th><th className="th">Fecha/Hora</th><th className="th">Paciente</th><th className="th">Hospital / Centro de salud</th>
                  <th className="th">Modalidad</th><th className="th">Prioridad</th><th className="th">Estado</th><th className="th">Estado del informe</th>
                  <th className="th">Radiólogo</th><th className="th">Tiempo lectura</th><th className="th">Vence en</th><th className="th pr-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id} onClick={() => { setSel(e.id); setTab(0) }} className={clsx('tr cursor-pointer', e.id === sel && '!bg-brand-50/70')}>
                    <td className="td !pl-4" onClick={(ev) => ev.stopPropagation()}>
                      <Checkbox checked={checked.includes(e.id)} onChange={() => setChecked(checked.includes(e.id) ? checked.filter((x) => x !== e.id) : [...checked, e.id])} />
                    </td>
                    <td className="td whitespace-nowrap text-[10.5px] text-brand-700">{e.id}</td>
                    <td className="td whitespace-nowrap text-[10.5px] leading-tight">{e.fecha}<br />{e.hora}</td>
                    <td className="td whitespace-nowrap text-[10.5px] leading-tight"><span className="text-ink">{e.paciente}</span><br />{e.sexo} {e.edad} años</td>
                    <td className="td text-[11px] leading-tight" title={e.hospital}><div className="w-[108px] truncate text-ink">{e.hospital}</div><div className="w-[108px] truncate">{e.ciudad}</div></td>
                    <td className="td"><Modality m={e.mod} className="py-1" /></td>
                    <td className="td"><Badge tone={PRIORIDAD[e.prioridad].tone} icon className="rounded-full">{e.prioridad}</Badge></td>
                    <td className="td"><StatusPill tone={ESTADO_TONE[e.estado]}>{e.estado}</StatusPill></td>
                    <td className="td"><StatusPill tone={INFORME_TONE[e.informe]}>{e.informe}</StatusPill></td>
                    <td className={clsx("td whitespace-nowrap text-[11px] text-ink", e.radiologo.length > 18 && "text-[10px]")}>{e.radiologo}</td>
                    <td className="td whitespace-nowrap text-[11.5px]">
                      <span className="inline-flex items-center gap-1.5">
                        {e.lectura !== '-' || e.frac > 0 ? <PieDot frac={e.frac} color={e.color} /> : <span className="w-[14px]" />}
                        <span className={clsx(e.color === '#ef4444' && e.frac === 1 ? 'font-semibold text-red-600' : 'text-ink')}>{e.lectura}</span>
                      </span>
                    </td>
                    <td className="td text-[11.5px]"><VenceCell v={e.vence} /></td>
                    <td className="td pr-4 text-center" onClick={(ev) => ev.stopPropagation()}>
                      <button className="dots-btn" aria-label="Acciones"><MoreHorizontal size={16} /></button>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && <tr><td colSpan={13} className="td py-8 text-center">No hay estudios con los filtros seleccionados.</td></tr>}
              </tbody>
            </Table>
            <Pagination text="Mostrando 1 a 10 de 1,248 estudios" pages={[1, 2, 3, 4, 5]} last={125} />
          </section>
        </div>

        {/* Detalle */}
        <section className="card min-w-0 self-start xl:col-span-3">
          <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3.5">
            <h3 className="flex items-center gap-2 text-[14.5px] font-bold text-ink"><Eye size={17} className="text-brand-600" /> Detalle del estudio</h3>
            <button className="btn-outline px-2.5 py-1 text-[12px]"><MonitorPlay size={14} /> Ver en visor</button>
          </div>
          <div className="flex gap-3 px-4">
            <img src={THUMB[est.mod]} alt={MOD_NOMBRE[est.mod]} className="h-[86px] w-[86px] shrink-0 rounded-lg bg-black object-cover" />
            <div className="min-w-0 space-y-1 text-[11.5px] leading-snug text-ink/90">
              <div className="text-[14px] font-bold text-ink">{est.id}</div>
              <Badge tone={PRIORIDAD[est.prioridad].tone} icon className="rounded-full">{PRIORIDAD[est.prioridad].label}</Badge>
              <div>{est.mod} - {MOD_NOMBRE[est.mod]}</div>
              <div>{est.fecha} {est.hora}</div>
            </div>
          </div>
          <Tabs className="mx-4 mt-3 [&>button]:flex-1 [&>button]:justify-center" active={tab} onChange={setTab} tabs={['Información', 'Informe', 'Historial']} />
          <div className="px-4 pb-4 pt-1">
            {tab === 0 && (
              <div className="text-[12px]">
                <DRow l="Paciente"><b className="font-semibold text-ink">{est.paciente} ({est.sexo}, {est.edad} años)</b></DRow>
                <DRow l="Hospital / Centro">{est.hospital}<br />{est.ciudad}</DRow>
                <DRow l="Prioridad"><Badge tone={PRIORIDAD[est.prioridad].tone} icon className="rounded-full">{PRIORIDAD[est.prioridad].label}</Badge></DRow>
                <DRow l="Estado del estudio"><StatusPill tone={ESTADO_TONE[est.estado]}>{est.estado}</StatusPill></DRow>
                <DRow l="Estado del informe"><StatusPill tone={INFORME_TONE[est.informe]}>{est.informe}</StatusPill></DRow>
                <DRow l="Radiólogo">
                  {est.radiologo === '-' ? <span className="text-slate-400">Sin asignar</span>
                    : <span className="flex items-center gap-2"><img src="/img/crops/dr-carlos.webp" alt="" className="h-7 w-7 rounded-full object-cover" />{est.radiologo}</span>}
                </DRow>
                <DRow l="Tiempo transcurrido"><b className="font-semibold text-ink">{est.lectura === '-' ? '—' : est.lectura}</b></DRow>
                <DRow l="Tiempo máximo"><span className="text-red-500">{PRIORIDAD[est.prioridad].max}</span></DRow>
                <DRow l="Tiempo restante"><VenceCell v={est.vence} /></DRow>
                <DRow l="Cumplimiento">
                  {est.vence.kind === 'vencido' ? <Badge tone="red" icon className="rounded-full">Fuera del tiempo</Badge> : <Badge tone="green" icon className="rounded-full">Dentro del tiempo</Badge>}
                </DRow>
                <DRow l="Observaciones">{est.obs}</DRow>
              </div>
            )}
            {tab === 1 && (
              <div className="space-y-3 pt-2 text-[12px] text-ink/90">
                <div className="flex items-center justify-between"><span className="text-brand-800/70">Estado</span><StatusPill tone={INFORME_TONE[est.informe]}>{est.informe}</StatusPill></div>
                <div className="rounded-lg border border-[#eef2f8] bg-[#f8fafe] p-3 leading-relaxed">
                  {est.informe === 'Pendiente'
                    ? 'El estudio aún no tiene un informe asignado. Será asignado al próximo radiólogo disponible.'
                    : <><b className="text-ink">Hallazgos:</b> Estudio de {MOD_NOMBRE[est.mod].toLowerCase()} realizado según protocolo. {est.informe === 'Informado' ? 'Sin hallazgos agudos significativos. Se recomienda correlación clínica.' : 'Informe en redacción por el radiólogo asignado.'}</>}
                </div>
                <button className="btn-outline w-full py-1.5 text-[12px]"><FileText size={14} /> Ver informe completo</button>
              </div>
            )}
            {tab === 2 && (
              <ol className="relative ml-2 mt-3 space-y-3 border-l-2 border-brand-100 pl-4 text-[12px]">
                {[
                  ['Estudio recibido desde PACS', est.hora],
                  ['Asignado a radiólogo', est.radiologo === '-' ? 'Pendiente' : est.radiologo],
                  ['Estudio abierto en visor', est.estado === 'Nuevo' ? 'Pendiente' : 'Visto'],
                  ['Informe', est.informe],
                ].map(([t, d]) => (
                  <li key={t} className="relative">
                    <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500 shadow" />
                    <div className="font-medium text-ink">{t}</div><div className="text-[11.5px] text-slate-500">{d}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>
    </>
  )
}

function DRow({ l, children }: { l: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[44%_1fr] items-center gap-2 border-b border-[#eef2f8] py-2 last:border-0">
      <span className="text-brand-800/70">{l}</span>
      <span className="min-w-0 text-ink/90">{children}</span>
    </div>
  )
}

function TiempoCard({ icon: Icon, bg, iconCls, title, titleCls, value, valueCls, obj }: {
  icon: LucideIcon; bg: string; iconCls: string; title: string; titleCls: string; value: string; valueCls: string; obj: string
}) {
  return (
    <div className={clsx('flex gap-2.5 rounded-lg p-2.5', bg)}>
      <span className={clsx('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white', iconCls)}><Icon size={15} /></span>
      <div className="min-w-0 flex-1">
        <div className={clsx('text-[12px] font-medium', titleCls)}>{title}</div>
        <div className={clsx('flex items-center gap-1 text-[16px] font-bold', valueCls)}><Clock size={16} />{value}</div>
        <div className="text-right text-[10.5px] text-slate-500">{obj}</div>
      </div>
    </div>
  )
}

function VencerCard({ bg, circle, icon, value, vcls, l1, l2, l2cls }: {
  bg: string; circle: string; icon: ReactNode; value: string; vcls: string; l1: string; l2: string; l2cls?: string
}) {
  return (
    <div className={clsx('flex items-center gap-2 rounded-lg p-2.5', bg)}>
      <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', circle)}>{icon}</span>
      <div className="min-w-0 leading-tight">
        <div className={clsx('text-[19px] font-bold', vcls)}>{value}</div>
        <div className={clsx('text-[11px]', vcls)}>{l1}</div>
        <div className={clsx('text-[11px] text-slate-500', l2cls)}>{l2}</div>
      </div>
    </div>
  )
}

