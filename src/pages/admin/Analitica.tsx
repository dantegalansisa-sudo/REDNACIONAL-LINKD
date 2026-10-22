import { useState } from 'react'
import {
  Activity, BarChart3, Building2, CalendarDays, ChevronDown, Filter, HeartPulse, LayoutGrid, MapPin, Scan, Stethoscope,
  Target, Upload, UserRound, Users, Waves, X as XIcon, type LucideIcon,
} from 'lucide-react'
import { Bar, IconCircle, Kpi, MoreLink, PageHeader, Panel, Select, Table, clsx, type Tone } from '../../components/ui'
import { Donut } from '../../components/charts'
import { supabaseConfigurado } from '../../lib/admin-data'

/* ---------- Datos mock ---------- */
const PERIODOS = ['Últimos 12 meses', 'Últimos 6 meses', 'Últimos 3 meses', 'Año 2025', 'Año 2024']
const REGIONES = ['Todas las regiones', 'Cibao Sur', 'Sánchez Ramírez', 'Cibao Norte', 'Cibao Nordeste', 'Valdesia']
const PROVINCIAS = ['Todas las provincias', 'La Vega', 'Santiago', 'Santo Domingo', 'Duarte', 'Sánchez Ramírez', 'Monseñor Nouel']
const MUNICIPIOS = ['Todos los municipios', 'La Vega', 'Santiago', 'Constanza', 'Jarabacoa', 'Cotuí']

const COLORS = ['#2f6bff', '#22b07d', '#f59e0b', '#8b5cf6', '#ef4444', '#94a3b8']

const poblacionRegion = [
  { label: 'Cibao Sur', value: 381001, pct: '35.1%' },
  { label: 'Sánchez Ramírez', value: 72239, pct: '6.7%' },
  { label: 'Cibao Norte', value: 69421, pct: '6.4%' },
  { label: 'Cibao Nordeste', value: 62118, pct: '5.7%' },
  { label: 'Valdesia', value: 58762, pct: '5.4%' },
  { label: 'Otras regiones', value: 442369, pct: '40.8%' },
]

const condiciones = [
  { label: 'Diabetes (11.6%)', value: 1258355, color: '#2f6bff' },
  { label: 'Hipertensión (33%)', value: 3568412, color: '#22b07d' },
  { label: 'Día + Hiper', value: 4826767, color: '#f59e0b' },
  { label: 'Telediagnóstico (30%)', value: 1448030, color: '#8b5cf6' },
]

const modalidades: { label: string; value: number; icon: LucideIcon; tone: Tone; color: string }[] = [
  { label: 'Electrocardiograma', value: 61174, icon: Activity, tone: 'blue', color: '#2f6bff' },
  { label: 'Sonografía / Doppler', value: 169926, icon: Waves, tone: 'purple', color: '#22b07d' },
  { label: 'Ecocardiograma', value: 50978, icon: HeartPulse, tone: 'orange', color: '#f59e0b' },
  { label: 'Rayos X', value: 50978, icon: XIcon, tone: 'purple', color: '#8b5cf6' },
]

const reqRegion = [
  { label: 'Cibao Sur', value: 10 },
  { label: 'Sánchez Ramírez', value: 6.1 },
  { label: 'Cibao Norte', value: 4.0 },
  { label: 'Cibao Nordeste', value: 2.6 },
  { label: 'Valdesia', value: 1.9 },
]

const imgProvincia = [
  { label: 'La Vega', value: 133098 },
  { label: 'Sánchez Ramírez', value: 41884 },
  { label: 'Monseñor Nouel', value: 38562 },
  { label: 'Santiago', value: 32441 },
  { label: 'Duarte', value: 28993 },
  { label: 'Otras provincias', value: 95228 },
]

const MOCK_TOP_PROVINCIAS = [
  ['La Vega', '229,559', '21.2%'],
  ['Santiago', '205,341', '18.9%'],
  ['Santo Domingo', '198,762', '18.3%'],
  ['Duarte', '120,558', '11.1%'],
  ['Sánchez Ramírez', '72,239', '6.7%'],
]
const MOCK_TOP_RADIOLOGIA = [
  ['La Vega', '86,644', '333'],
  ['Santiago', '56,760', '218'],
  ['Constanza', '18,020', '69'],
  ['Jarabacoa', '19,088', '73'],
  ['Cotuí', '17,153', '66'],
]
const MOCK_TOP_CARDIOLOGIA = [
  ['La Vega', '67,573', '260'],
  ['Santiago', '43,989', '169'],
  ['Constanza', '9,148', '35'],
  ['Jarabacoa', '9,691', '37'],
  ['Cotuí', '8,708', '29'],
]

const topProvincias = supabaseConfigurado ? [] : MOCK_TOP_PROVINCIAS
const topRadiologia = supabaseConfigurado ? [] : MOCK_TOP_RADIOLOGIA
const topCardiologia = supabaseConfigurado ? [] : MOCK_TOP_CARDIOLOGIA

const fmt = (n: number) => n.toLocaleString('en-US')

const SIN_DATOS = 'Disponible al integrar los datos'
/** En producción (Supabase) las cifras de referencia se ocultan hasta integrar los datos reales */
const v = (mock: string) => (supabaseConfigurado ? '—' : mock)

function Vacio({ className }: { className?: string }) {
  return <div className={clsx('flex min-h-[150px] items-center justify-center text-center text-[12.5px] text-slate-400', className)}>{SIN_DATOS}</div>
}

/* ---------- Subcomponentes ---------- */
function HBarList({ rows, max, pct }: { rows: { label: string; value: number; pct?: string }[]; max: number; pct?: boolean }) {
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={r.label} className="grid grid-cols-[minmax(92px,1fr)_minmax(60px,1.3fr)_auto] items-center gap-3 text-[12.5px]">
          <span className="truncate text-ink">{r.label}</span>
          <Bar value={r.value} max={max} color={COLORS[i] ?? COLORS[5]} height={14} />
          <span className="flex items-center justify-end gap-2 tabular-nums text-ink">
            <span className="min-w-[56px] text-right">{fmt(r.value)}</span>
            {pct && <span className="w-[46px] text-right text-slate-500">({r.pct})</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

function MiniStat({ icon, tone, value, label }: { icon: LucideIcon; tone: Tone; value: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-[#e6edf8] px-3 py-2.5">
      <IconCircle icon={icon} tone={tone} />
      <div className="min-w-0">
        <div className="text-[18px] font-bold leading-tight text-ink">{value}</div>
        <div className="text-[11.5px] leading-snug text-slate-500">{label}</div>
      </div>
    </div>
  )
}

function TopTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <Table>
      <thead>
        <tr className="bg-[#f5f8fd]">
          <th className="th w-8">#</th>
          {head.map((h, i) => <th key={h} className={clsx('th', i > 0 && 'text-right')}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r[0]} className="tr">
            <td className="td py-1.5">{i + 1}</td>
            {r.map((c, j) => <td key={j} className={clsx('td py-1.5 text-ink', j > 0 && 'text-right tabular-nums')}>{c}</td>)}
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={head.length + 1} className="td py-6 text-center text-slate-400">{SIN_DATOS}</td></tr>}
      </tbody>
    </Table>
  )
}

/* ---------- Página ---------- */
export default function Analitica() {
  const [exportOpen, setExportOpen] = useState(false)
  const [moreFilters, setMoreFilters] = useState(false)
  const maxReq = 11

  return (
    <div>
      <PageHeader
        icon={BarChart3}
        title="Analítica Nacional"
        subtitle="Resumen de población, demanda diagnóstica, producción de imágenes y recursos por región"
        actions={
          <div className="relative">
            <button className="btn-primary min-w-[160px]" onClick={() => setExportOpen(!exportOpen)}>
              <Upload size={17} /> Exportar <ChevronDown size={16} className="ml-3" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-lg border border-[#e3eaf6] bg-white py-1 shadow-lg">
                {['Exportar PDF', 'Exportar Excel', 'Exportar CSV'].map((o) => (
                  <button key={o} onClick={() => setExportOpen(false)} className="block w-full px-4 py-2 text-left text-[13px] hover:bg-brand-50">{o}</button>
                ))}
              </div>
            )}
          </div>
        }
      />

      {/* Filtros */}
      <div className="card mb-4 grid grid-cols-1 items-center gap-3 px-4 py-3 sm:grid-cols-2 xl:grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto_1.4fr_auto]">
        <span className="text-[13px] font-semibold text-ink">Periodo</span>
        <Select options={PERIODOS} icon={CalendarDays} />
        <span className="text-[13px] font-semibold text-ink">Región</span>
        <Select options={REGIONES} />
        <span className="text-[13px] font-semibold text-ink">Provincia</span>
        <Select options={PROVINCIAS} />
        <span className="text-[13px] font-semibold text-ink">Municipio</span>
        <Select options={MUNICIPIOS} />
        <button onClick={() => setMoreFilters(!moreFilters)} className={clsx('btn-outline min-w-[150px]', moreFilters && 'bg-brand-50')}>
          <Filter size={16} /> Más filtros
        </button>
      </div>
      {moreFilters && (
        <div className="card mb-4 grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 xl:grid-cols-4">
          <div><span className="label">Sexo</span><Select options={['Todos', 'Femenino', 'Masculino']} /></div>
          <div><span className="label">Rango de edad</span><Select options={['Todas las edades', '0-17', '18-39', '40-64', '65+']} /></div>
          <div><span className="label">Modalidad</span><Select options={['Todas', 'Electrocardiograma', 'Sonografía / Doppler', 'Ecocardiograma', 'Rayos X']} /></div>
          <div><span className="label">Tipo de hospital</span><Select options={['Todos', 'Regional', 'Provincial', 'Municipal']} /></div>
        </div>
      )}

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.25fr_1fr_1.25fr_1.1fr_1.3fr]">
        {supabaseConfigurado ? (
          <>
            <Kpi icon={Users} tone="blue" value="—" label="Población total estimada" sub={SIN_DATOS} />
            <Kpi icon={Target} tone="blue" value="—" label="Objetivo Diabetes" sub={SIN_DATOS} />
            <Kpi icon={Target} tone="blue" value="—" label="Objetivo Hipertensión" sub={SIN_DATOS} />
            <Kpi icon={Scan} tone="orange" value="—" label="Objetivo Día + Hiper" sub={SIN_DATOS} />
            <Kpi icon={Building2} tone="orange" value="—" label="Objetivo Tele diagnóstico" sub={SIN_DATOS} />
          </>
        ) : (
          <>
            <Kpi icon={Users} tone="blue" value="10,847,910" label="Población total estimada" sub="2.3% vs. año anterior" trend="up" />
            <Kpi icon={Target} tone="blue" value="1,258,355" label="Objetivo Diabetes (11.6%)" />
            <Kpi icon={Target} tone="blue" value="3,568,412" label="Objetivo Hipertensión (33%)" />
            <Kpi icon={Scan} tone="orange" value="4,826,767" label="Objetivo Día + Hiper" />
            <Kpi icon={Building2} tone="orange" value="1,448,030" label="Objetivo Tele diagnóstico (30%)" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
        {/* Fila 1 */}
        <Panel className="xl:col-span-4" title="Población por región" icon={BarChart3} action={<MoreLink boxed />}>
          {supabaseConfigurado ? <Vacio /> : <HBarList rows={poblacionRegion} max={442369 * 1.05} pct />}
        </Panel>

        <Panel className="xl:col-span-4" title="Población objetivo por condición" icon={Target} action={<MoreLink boxed />}>
          {supabaseConfigurado ? <Vacio /> : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Donut
              data={condiciones}
              size={170}
              thickness={26}
              center={<><span className="text-[19px] font-bold text-ink">6,274,797</span><span className="text-[11px] leading-tight text-ink/80">Población objetivo<br />total</span></>}
            />
            <ul className="min-w-0 flex-1 space-y-3 text-[12.5px]">
              {condiciones.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="min-w-0 flex-1 truncate text-ink/90">{c.label}</span>
                  <span className="tabular-nums text-ink">{fmt(c.value)}</span>
                </li>
              ))}
            </ul>
          </div>
          )}
        </Panel>

        <Panel className="lg:col-span-2 xl:col-span-4" title="Estudios por modalidad (1 diagnóstico por año)" icon={Stethoscope} action={<MoreLink boxed />}>
          {supabaseConfigurado ? <Vacio /> : (
          <ul className="space-y-3">
            {modalidades.map((m) => (
              <li key={m.label} className="grid grid-cols-[auto_minmax(100px,1fr)_minmax(60px,1.4fr)_auto] items-center gap-3 text-[12.5px]">
                <IconCircle icon={m.icon} tone={m.tone} size="sm" className="!rounded-lg" />
                <span className="truncate text-ink">{m.label}</span>
                <Bar value={m.value} max={180000} color={m.color} height={20} />
                <span className="w-[60px] text-right text-[14px] tabular-nums text-ink">{fmt(m.value)}</span>
              </li>
            ))}
          </ul>
          )}
        </Panel>

        {/* Fila 2 */}
        <Panel className="xl:col-span-4" title="Total de imágenes por año" icon={Scan} action={<MoreLink boxed />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MiniStat icon={Scan} tone="blue" value={v('220,904')} label="Imágenes de Radiología (1 diagnóstico por año)" />
            <MiniStat icon={HeartPulse} tone="red" value={v('112,151')} label="Imágenes de Cardiología (1 diagnóstico por año)" />
          </div>
          <div className="mb-2 mt-3 text-[13px] font-bold text-ink">Promedio por día</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MiniStat icon={Activity} tone="blue" value={v('850')} label="Imágenes de Radiología diarias" />
            <MiniStat icon={HeartPulse} tone="red" value={v('431')} label="Imágenes de Cardiología diarias" />
          </div>
        </Panel>

        <Panel className="xl:col-span-4" title="Recursos humanos requeridos" icon={UserRound} action={<MoreLink boxed />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MiniStat icon={Users} tone="green" value={v('10')} label="Radiólogos requeridos (5 min x estudio)" />
            <MiniStat icon={Stethoscope} tone="purple" value={v('18')} label="Cardiólogos / Internistas requeridos (10 min x estudio)" />
          </div>
          <div className="mb-1 mt-3 text-[13px] font-bold text-ink">Requerimiento por región (radiólogos)</div>
          {supabaseConfigurado ? <Vacio className="!min-h-[118px]" /> : (<>
          <div className="grid h-[118px] grid-cols-5 items-end gap-2 border-b border-[#e6edf8] px-1">
            {reqRegion.map((r, i) => (
              <div key={r.label} className="flex h-full flex-col items-center justify-end">
                <span className="mb-0.5 text-[11.5px] font-bold text-ink">{r.value % 1 === 0 && r.value < 10 ? r.value.toFixed(1) : r.value}</span>
                <span className="w-[60%] max-w-[44px] rounded-t-sm" style={{ height: `${(r.value / maxReq) * 90}px`, background: COLORS[i] }} />
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-5 gap-2 text-center text-[10.5px] leading-tight text-ink/80">
            {reqRegion.map((r) => <span key={r.label}>{r.label}</span>)}
          </div>
          </>)}
        </Panel>

        <Panel className="lg:col-span-2 xl:col-span-4" title="Distribución de imágenes por provincia" icon={MapPin} action={<MoreLink boxed />}>
          {supabaseConfigurado ? <Vacio /> : <HBarList rows={imgProvincia} max={150000} />}
        </Panel>

        {/* Fila 3 */}
        <Panel className="xl:col-span-4" title="Top 5 provincias por población" icon={LayoutGrid} action={<MoreLink boxed />} bodyClass="!px-2">
          <TopTable head={['Provincia', 'Población', '% del total']} rows={topProvincias} />
        </Panel>
        <Panel className="xl:col-span-4" title="Top 5 municipios por imágenes de Radiología" icon={Scan} action={<MoreLink boxed />} bodyClass="!px-2">
          <TopTable head={['Municipio', 'Imágenes/año', 'Promedio día']} rows={topRadiologia} />
        </Panel>
        <Panel className="lg:col-span-2 xl:col-span-4" title="Top 5 municipios por imágenes de Cardiología" icon={HeartPulse} action={<MoreLink boxed />} bodyClass="!px-2">
          <TopTable head={['Municipio', 'Imágenes/año', 'Promedio día']} rows={topCardiologia} />
        </Panel>
      </div>
    </div>
  )
}
