import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowDown, Building2, Calendar, CheckCircle2, ChevronDown, Clock, Download, FileText, Filter, Layers,
  MoreHorizontal, Star, TriangleAlert, Upload, User, type LucideIcon,
} from 'lucide-react'
import { Bar, Checkbox, Kpi, Modality, PageHeader, Pagination, Select, Table, clsx } from '../../components/ui'
import { Bars, Donut } from '../../components/charts'
import { supabaseConfigurado } from '../../lib/admin-data'

/** En producción (Supabase configurado) la pantalla arranca vacía, sin datos de ejemplo */
const VACIO = supabaseConfigurado

function SinDatos({ texto = 'Sin datos para mostrar', className }: { texto?: string; className?: string }) {
  return <div className={clsx('flex items-center justify-center text-center text-[12.5px] text-slate-400', className)}>{texto}</div>
}

/* ---------------- Datos mock ---------------- */
const TREND_LABELS = ['08 Mar', '09 Mar', '10 Mar', '11 Mar', '12 Mar', '13 Mar', '14 Mar', '15 Mar']
const TREND = [
  { name: 'Informes generados', color: '#2f6bff', values: [180, 186, 181, 191, 180, 190, 192, 205] },
  { name: 'En tiempo', color: '#5cc879', values: [62, 60, 58, 62, 58, 65, 62, 72] },
]

const MOCK_MODALIDAD: { m: string; label: string; t: string; v: number; color: string; cls: string }[] = [
  { m: 'TC', label: 'TC', t: '1 h 28 min', v: 75, color: '#2f6bff', cls: 'bg-brand-50 text-brand-600' },
  { m: 'RX', label: 'RX', t: '48 min', v: 38, color: '#8b5cf6', cls: 'bg-violet-50 text-violet-600' },
  { m: 'RM', label: 'RM', t: '2 h 15 min', v: 63, color: '#22b35e', cls: 'bg-emerald-50 text-emerald-600' },
  { m: 'US', label: 'US', t: '1 h 12 min', v: 52, color: '#f59e0b', cls: 'bg-amber-50 text-amber-500' },
  { m: 'MG', label: 'MG', t: '1 h 50 min', v: 68, color: '#ef4444', cls: 'bg-red-50 text-red-500' },
]

const MOCK_CALIDAD = [
  { label: 'Excelente', value: 68, color: '#16a34a' },
  { label: 'Buena', value: 24, color: '#2f6bff' },
  { label: 'Regular', value: 6, color: '#f59e0b' },
  { label: 'Baja', value: 2, color: '#ef4444' },
]

type Rad = { n: string; esp: string; inf: number; t: string; cal: number; tiempo: number; hosp: string[]; f: string; h: string }
const MOCK_RADIOLOGOS: Rad[] = [
  { n: 'Dra. María López', esp: 'Neurorradiología', inf: 186, t: '1 h 15 min', cal: 4.9, tiempo: 99, hosp: ['HPHM', 'HFD', 'HRA'], f: '15/03/2025', h: '10:24 a. m.' },
  { n: 'Dr. Carlos Méndez', esp: 'Radiología General', inf: 162, t: '1 h 05 min', cal: 4.8, tiempo: 98, hosp: ['HJM', 'HRA', 'HRSJ'], f: '15/03/2025', h: '09:58 a. m.' },
  { n: 'Dra. Ana Rodríguez', esp: 'Imagenología', inf: 148, t: '1 h 42 min', cal: 4.7, tiempo: 97, hosp: ['HPHM', 'HGA', 'HRC'], f: '15/03/2025', h: '10:12 a. m.' },
  { n: 'Dr. Luis Vargas', esp: 'Radiología Torácica', inf: 132, t: '1 h 38 min', cal: 4.6, tiempo: 96, hosp: ['HGA', 'HJM', 'HRA'], f: '15/03/2025', h: '09:45 a. m.' },
  { n: 'Dra. Sofía Méndez', esp: 'Mamas / Imagen', inf: 118, t: '1 h 50 min', cal: 4.6, tiempo: 95, hosp: ['HPHM', 'HRC', 'HRSJ'], f: '15/03/2025', h: '08:41 a. m.' },
  { n: 'Dr. Miguel Santos', esp: 'Abdominal', inf: 104, t: '1 h 28 min', cal: 4.5, tiempo: 94, hosp: ['HJM', 'HRA', 'HGA'], f: '15/03/2025', h: '08:15 a. m.' },
  { n: 'Lic. Lucía Jiménez', esp: 'Musculoesquelético', inf: 96, t: '1 h 20 min', cal: 4.5, tiempo: 93, hosp: ['HPHM', 'HRA', 'HRC'], f: '14/03/2025', h: '06:52 p. m.' },
  { n: 'Dr. Roberto Díaz', esp: 'Radiología General', inf: 84, t: '1 h 35 min', cal: 4.4, tiempo: 92, hosp: ['HRSJ', 'HGA', 'HJM'], f: '14/03/2025', h: '05:28 p. m.' },
  { n: 'Dra. Carmen Vargas', esp: 'Pediátrica', inf: 76, t: '1 h 18 min', cal: 4.4, tiempo: 94, hosp: ['HPHM', 'HRC', 'HRA'], f: '14/03/2025', h: '04:36 p. m.' },
  { n: 'Dr. Tomás Peña', esp: 'Intervencionista', inf: 62, t: '1 h 12 min', cal: 4.3, tiempo: 91, hosp: ['HGA', 'HJM', 'HRSJ'], f: '14/03/2025', h: '03:21 p. m.' },
]

const MOCK_TOP5 = [
  { h: 'HPHM', v: 428, p: '22%', color: '#2f6bff' },
  { h: 'HRA', v: 362, p: '19%', color: '#2f6bff' },
  { h: 'HJM', v: 298, p: '15%', color: '#22b35e' },
  { h: 'HGA', v: 276, p: '14%', color: '#f59e0b' },
  { h: 'HRSJ', v: 241, p: '12%', color: '#f87171' },
]

const MOCK_ULTIMOS = [
  { id: 'EST-2025-000892', p: 'Juan Pérez (M, 45 años)', h: 'Hosp. Hugo Mendoza', f: '15/03/2025 10:24 a. m.', m: 'CT', img: '/img/crops/ct-cerebro.webp' },
  { id: 'EST-2025-000891', p: 'María López (F, 62 años)', h: 'Hosp. Dr. Fco. A. Gonzalvo', f: '15/03/2025 10:18 a. m.', m: 'RX', img: '/img/crops/rx-torax.webp' },
  { id: 'EST-2025-000890', p: 'Carlos Peña (M, 37 años)', h: 'Hosp. Juan de Herrera', f: '15/03/2025 09:55 a. m.', m: 'MR', img: '/img/crops/mr.webp' },
  { id: 'EST-2025-000899', p: 'Ana Rodríguez (F, 28 años)', h: 'Hosp. Municipal Boca Chica', f: '15/03/2025 09:32 a. m.', m: 'US', img: '/img/crops/us.webp' },
  { id: 'EST-2025-000888', p: 'Lucía Jiménez (F, 50 años)', h: 'Hosp. Jaime Mota', f: '15/03/2025 08:15 a. m.', m: 'MG', img: '/img/crops/mg.webp' },
]

const MODALIDAD = VACIO ? MOCK_MODALIDAD.map((m) => ({ ...m, t: '—', v: 0 })) : MOCK_MODALIDAD
const CALIDAD = VACIO ? [] : MOCK_CALIDAD
const RADIOLOGOS: Rad[] = VACIO ? [] : MOCK_RADIOLOGOS
const TOP5 = VACIO ? [] : MOCK_TOP5
const ULTIMOS = VACIO ? [] : MOCK_ULTIMOS
const HOSPITALES_FILTRO = VACIO ? [] : ['HPHM', 'HRA', 'HJM', 'HGA', 'HRSJ', 'HRC', 'HFD']

const initials = (n: string) => n.replace(/^(Dr\.|Dra\.|Lic\.)\s*/, '').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

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

function CardTitle({ icon: Icon, children, right }: { icon: LucideIcon; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-[14px] font-bold text-ink"><Icon size={17} className="text-brand-600" />{children}</h3>
      {right}
    </div>
  )
}

/* ---------------- Página ---------------- */
export default function Informes() {
  const [fRad, setFRad] = useState('Todos los radiólogos')
  const [sel, setSel] = useState<string | null>(null)
  const [checked, setChecked] = useState<string[]>([])

  const list = useMemo(() => RADIOLOGOS.filter((r) => fRad === 'Todos los radiólogos' || r.n === fRad), [fRad])
  const allChecked = list.length > 0 && list.every((r) => checked.includes(r.n))

  return (
    <>
      <PageHeader icon={FileText} title="Gestión de informes"
        subtitle="Desempeño de radiólogos, calidad, tiempos de reporte y actividad por hospital" actions={<ExportButton />} />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {VACIO ? (
          <>
            <Kpi icon={FileText} tone="blue" value="0" label="Informes generados (hoy)" sub="Sin datos aún" />
            <Kpi icon={Clock} tone="blue" value="—" label="Tiempo promedio de reporte" sub="Sin datos aún" />
            <Kpi icon={Star} tone="orange" value="—" label="Calificación promedio" sub="Sin evaluaciones aún" />
            <Kpi icon={CheckCircle2} tone="green" value="—" label="Informes en tiempo" sub="Sin datos aún" />
            <Kpi icon={TriangleAlert} tone="red" value="0" label="Informes retrasados" sub="Sin datos aún" />
          </>
        ) : (
          <>
            <Kpi icon={FileText} tone="blue" value="214" label="Informes generados (hoy)" sub="15% vs. ayer" trend="up" />
            <Kpi icon={Clock} tone="blue" value="1 h 42 min" label="Tiempo promedio de reporte" sub="18% vs. mes anterior" trend="down" trendTone="good" />
            <Kpi icon={Star} tone="orange" value="4.7 / 5" label="Calificación promedio" sub="Basado en 2,438 evaluaciones" />
            <Kpi icon={CheckCircle2} tone="green" value="98.3%" label="Informes en tiempo" sub="Dentro del tiempo objetivo" />
            <Kpi icon={TriangleAlert} tone="red" value="12" label="Informes retrasados" sub="1.7% del total" />
          </>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
        <section className="card min-w-0 p-3.5 xl:col-span-5">
          <CardTitle icon={FileText} right={
            <div className="flex items-center gap-4 text-[11px] text-slate-600">
              {TREND.map((s) => <span key={s.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}</span>)}
            </div>
          }>Tendencia de informes</CardTitle>
          {VACIO
            ? <SinDatos className="h-[150px]" />
            : <Bars labels={TREND_LABELS} series={TREND} height={150} max={250} yTicks={5} barWidth={0.72} />}
        </section>

        <section className="card min-w-0 p-3.5 xl:col-span-3">
          <CardTitle icon={Download}>Tiempo de reporte por modalidad</CardTitle>
          <div className="space-y-2.5">
            {MODALIDAD.map((m) => (
              <div key={m.m} className="grid grid-cols-[24px_26px_1fr_70px] items-center gap-2 text-[12px]">
                <span className={clsx('flex h-6 w-6 items-center justify-center rounded-md', m.cls)}><Layers size={13} /></span>
                <span className="font-medium text-ink">{m.label}</span>
                <Bar value={m.v} color={m.color} height={12} className="rounded" />
                <span className="text-right text-[11.5px] text-slate-600">{m.t}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card min-w-0 p-3.5 lg:col-span-2 xl:col-span-4">
          <CardTitle icon={FileText}>Calidad de informes</CardTitle>
          {VACIO ? <SinDatos className="h-[140px]" /> : (
          <div className="flex flex-wrap items-center justify-around gap-4">
            <Donut data={CALIDAD} size={140} thickness={20} center={<><span className="text-[28px] font-bold leading-none text-ink">4.7</span><span className="text-[13px] text-ink">/ 5</span></>} />
            <ul className="space-y-2.5 text-[13px] text-ink">
              {CALIDAD.map((c) => (
                <li key={c.label} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: c.color }} />{c.label} ({c.value}%)</li>
              ))}
            </ul>
          </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="min-w-0 space-y-3 xl:col-span-9">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Select icon={Building2} options={['Todos los hospitales', ...HOSPITALES_FILTRO]} />
            <Select icon={Layers} options={['Todas las modalidades', 'TC', 'RX', 'RM', 'US', 'MG']} />
            <Select icon={User} options={['Todos los radiólogos', ...RADIOLOGOS.map((r) => r.n)]} onChange={setFRad} />
            <Select icon={Calendar} options={['Últimos 30 días', 'Últimos 7 días', 'Hoy', 'Este año']} />
            <button className="btn-outline bg-white"><Filter size={16} /> Más filtros</button>
          </div>

          <section className="card min-w-0">
            <div className="flex items-center gap-3 px-4 pb-2 pt-3.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white"><ArrowDown size={15} /></span>
              <h3 className="text-[16px] font-bold text-ink">Radiólogos y desempeño en informes</h3>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11.5px] text-brand-700">{VACIO ? '0 radiólogos' : '28 radiólogos'}</span>
            </div>
            <Table>
              <thead>
                <tr className="bg-[#f6f9fe]">
                  <th className="th pl-4"><Checkbox checked={allChecked} onChange={(v) => setChecked(v ? list.map((r) => r.n) : [])} /></th>
                  <th className="th">#</th><th className="th">Radiólogo</th><th className="th">Especialidades</th><th className="th text-center">Informes</th>
                  <th className="th">Tiempo promedio</th><th className="th">Calificación</th><th className="th">En tiempo</th><th className="th">Últimos hospitales</th>
                  <th className="th">Último informe</th><th className="th">Estado</th><th className="th pr-4" />
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.n} onClick={() => setSel(r.n)} className={clsx('tr cursor-pointer', sel === r.n && '!bg-brand-50/70')}>
                    <td className="td pl-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={checked.includes(r.n)} onChange={() => setChecked(checked.includes(r.n) ? checked.filter((x) => x !== r.n) : [...checked, r.n])} />
                    </td>
                    <td className="td text-ink">{RADIOLOGOS.indexOf(r) + 1}</td>
                    <td className="td whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7d93b8] text-[10.5px] font-semibold text-white">{initials(r.n)}</span>
                        <span className="text-[12px] text-brand-800">{r.n}</span>
                      </span>
                    </td>
                    <td className="td whitespace-nowrap text-[11.5px]">{r.esp}</td>
                    <td className="td text-center text-ink">{r.inf}</td>
                    <td className="td whitespace-nowrap text-ink">{r.t}</td>
                    <td className="td whitespace-nowrap"><span className="inline-flex items-center gap-1 text-ink"><Star size={14} className="fill-amber-400 text-amber-400" />{r.cal}</span></td>
                    <td className="td whitespace-nowrap"><span className="inline-flex items-center gap-1 text-ink"><ArrowDown size={13} className="text-emerald-600" />{r.tiempo}%</span></td>
                    <td className="td">
                      <span className="flex gap-1">{r.hosp.map((h) => <span key={h} className="rounded border border-brand-100 bg-brand-50 px-1.5 py-0.5 text-[9.5px] font-semibold text-brand-700">{h}</span>)}</span>
                    </td>
                    <td className="td whitespace-nowrap text-[11px] leading-tight">{r.f}<br />{r.h}</td>
                    <td className="td whitespace-nowrap"><span className="inline-flex items-center gap-1.5 text-[11.5px] text-emerald-700"><CheckCircle2 size={14} className="fill-emerald-600 text-white" />Activo</span></td>
                    <td className="td pr-4" onClick={(e) => e.stopPropagation()}><button className="dots-btn" aria-label="Acciones"><MoreHorizontal size={16} /></button></td>
                  </tr>
                ))}
                {list.length === 0 && <tr><td colSpan={12} className="td py-8 text-center text-slate-400">{VACIO ? 'Aún no hay informes registrados' : 'No hay radiólogos con los filtros seleccionados.'}</td></tr>}
              </tbody>
            </Table>
            {VACIO
              ? <Pagination text="Mostrando 0 de 0 radiólogos" page={1} totalPages={1} />
              : <Pagination text="Mostrando 1 a 10 de 28 radiólogos" pages={[1, 2, 3]} />}
          </section>
        </div>

        <div className="min-w-0 space-y-4 xl:col-span-3">
          <section className="card p-3.5">
            <CardTitle icon={FileText}>Top 5 hospitales por informes</CardTitle>
            <div className="space-y-2.5">
              {TOP5.map((t) => (
                <div key={t.h} className="grid grid-cols-[44px_1fr_34px_32px] items-center gap-2 text-[12px]">
                  <span className="text-ink">{t.h}</span>
                  <Bar value={t.v} max={500} color={t.color} height={7} className="rounded" />
                  <span className="text-right text-ink">{t.v}</span>
                  <span className="text-right text-[11px] text-slate-500">{t.p}</span>
                </div>
              ))}
              {TOP5.length === 0 && <SinDatos className="py-6" />}
            </div>
          </section>

          <section className="card p-3.5">
            <CardTitle icon={FileText}>Últimos informes generados</CardTitle>
            <ul className="space-y-2.5">
              {ULTIMOS.map((u) => (
                <li key={u.id} className="flex items-start gap-2.5">
                  <img src={u.img} alt={u.m} className="h-[54px] w-[54px] shrink-0 rounded-md bg-black object-cover" />
                  <div className="min-w-0 flex-1 text-[11px] leading-tight text-slate-600">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-ink">{u.id}</span>
                      <Modality m={u.m} className="text-[9.5px]" />
                    </div>
                    <div className="text-ink/90">{u.p}</div>
                    <div className="truncate">{u.h}</div>
                    <div>{u.f}</div>
                  </div>
                  <button className="dots-btn mt-3 shrink-0" aria-label="Acciones"><MoreHorizontal size={16} /></button>
                </li>
              ))}
              {ULTIMOS.length === 0 && <li><SinDatos texto="Aún no se han generado informes" className="py-6" /></li>}
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}
