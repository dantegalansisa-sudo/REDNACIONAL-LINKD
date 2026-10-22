import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowDown, Building2, Calendar, CheckCircle2, ChevronDown, Clock, Download, FileText, Filter, Layers,
  MoreHorizontal, Star, TriangleAlert, Upload, User, type LucideIcon,
} from 'lucide-react'
import { Bar, Checkbox, Kpi, Modality, PageHeader, Pagination, Select, Table, clsx } from '../../components/ui'
import { Bars, Donut } from '../../components/charts'
import { MOD_ETIQUETA, edad, fFecha, fFechaHora, num, pct, useDatos } from '../../lib/admin-data'
import { supabase } from '../../lib/supabase'

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

type Rad = { id?: string; n: string; esp: string; inf: number; t: string; cal: number | null; tiempo: number | null; hosp: string[]; f: string; h: string; estado?: string }
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

const HOSPITALES_FILTRO = ['HPHM', 'HRA', 'HJM', 'HGA', 'HRSJ', 'HRC', 'HFD']

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


/* ---------------- Datos reales (Supabase) ---------------- */
type InformeFila = {
  id: string; publicado: string; cal: number | null; radId: string | null; numeroAcceso: string; modDb: string
  hospital: string; hospNombre: string; paciente: string; sexo: string; edad: number | null
  /** Milisegundos entre la recepción del estudio y la publicación del informe */
  ms: number; enTiempo: boolean | null
}
type RadiologoBase = { id: string; nombre: string; esp: string[]; estado: string }
type DatosInformes = { informes: InformeFila[]; radiologos: RadiologoBase[] }

const PERIODOS = ['Últimos 30 días', 'Últimos 7 días', 'Hoy', 'Este año', 'Todo el historial']
const ESTADO_REG: Record<string, string> = { aprobado: 'Activo', pendiente: 'Pendiente', rechazado: 'Rechazado', suspendido: 'Suspendido' }
const MINIATURA: Record<string, string> = { CT: '/img/crops/ct-cerebro.webp', PET: '/img/crops/ct-cerebro.webp', NM: '/img/crops/ct-cerebro.webp', RX: '/img/crops/rx-torax.webp', XA: '/img/crops/rx-torax.webp', MR: '/img/crops/mr.webp', US: '/img/crops/us.webp', MG: '/img/crops/mg.webp' }
const ESTILO_MOD: Record<string, { color: string; cls: string }> = {
  TC: { color: '#2f6bff', cls: 'bg-brand-50 text-brand-600' }, RX: { color: '#8b5cf6', cls: 'bg-violet-50 text-violet-600' },
  RM: { color: '#22b35e', cls: 'bg-emerald-50 text-emerald-600' }, US: { color: '#f59e0b', cls: 'bg-amber-50 text-amber-500' },
  MG: { color: '#ef4444', cls: 'bg-red-50 text-red-500' },
}
const COLORES_TOP = ['#2f6bff', '#2f6bff', '#22b35e', '#f59e0b', '#f87171']
const TODOS_HOSP = 'Todos los hospitales', TODAS_MOD = 'Todas las modalidades', TODOS_RAD = 'Todos los radiólogos'
const unicos = (v: string[]) => Array.from(new Set(v)).sort((a, b) => a.localeCompare(b, 'es'))
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
const promedio = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null)

/** Duración legible: "12 min", "3 h 05 min", "2 días 4 h" */
function duracion(ms: number | null) {
  if (ms === null) return '—'
  const min = Math.max(0, Math.round(ms / 60000))
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h ${String(min % 60).padStart(2, '0')} min`
  const d = Math.floor(h / 24)
  return `${d} día${d === 1 ? '' : 's'}${h % 24 ? ` ${h % 24} h` : ''}`
}

/** Fecha de inicio del período (null = sin límite) */
function inicioPeriodo(periodo: string): Date | null {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  if (periodo === 'Hoy') return hoy
  if (periodo === 'Últimos 7 días') return new Date(hoy.getTime() - 6 * 86400000)
  if (periodo === 'Últimos 30 días') return new Date(hoy.getTime() - 29 * 86400000)
  if (periodo === 'Este año') return new Date(hoy.getFullYear(), 0, 1)
  return null
}

async function fetchInformes(periodo: string): Promise<DatosInformes> {
  let q = supabase.from('informes')
    .select(`id, numero, estado, publicado_en, calificacion, radiologo_id,
      estudio:estudios(numero_acceso, modalidad, prioridad, recibido_en, vence_en, hospital_id, hospitales(nombre, sigla), pacientes(nombre_completo, sexo, fecha_nacimiento))`)
    .in('estado', ['publicado', 'corregido']).not('publicado_en', 'is', null)
  const desde = inicioPeriodo(periodo)
  if (desde) q = q.gte('publicado_en', desde.toISOString())
  const [inf, med] = await Promise.all([
    q.order('publicado_en', { ascending: false }).limit(5000),
    supabase.from('medicos').select('id, tratamiento, nombre_completo, especialidades, estado_registro').eq('tipo', 'radiologo').order('nombre_completo'),
  ])
  if (inf.error) throw new Error(inf.error.message)
  if (med.error) throw new Error(med.error.message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const informes = (inf.data as any[]).filter((i) => i.estudio).map((i): InformeFila => {
    const e = Array.isArray(i.estudio) ? i.estudio[0] : i.estudio
    const pub = new Date(i.publicado_en).getTime()
    return {
      id: i.id, publicado: i.publicado_en, cal: i.calificacion ?? null, radId: i.radiologo_id, numeroAcceso: e.numero_acceso, modDb: e.modalidad,
      hospital: e.hospitales?.sigla || e.hospitales?.nombre || '—', hospNombre: e.hospitales?.nombre ?? '—',
      paciente: e.pacientes?.nombre_completo ?? '—', sexo: e.pacientes?.sexo === 'Masculino' ? 'M' : e.pacientes?.sexo === 'Femenino' ? 'F' : '—',
      edad: e.pacientes?.fecha_nacimiento ? edad(e.pacientes.fecha_nacimiento) : null,
      ms: Math.max(0, pub - new Date(e.recibido_en).getTime()), enTiempo: e.vence_en ? pub <= new Date(e.vence_en).getTime() : null,
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radiologos = (med.data as any[]).map((m): RadiologoBase => ({
    id: m.id, nombre: `${m.tratamiento ?? 'Dr.'} ${m.nombre_completo}`, esp: m.especialidades ?? [], estado: ESTADO_REG[m.estado_registro] ?? m.estado_registro,
  }))
  return { informes, radiologos }
}

/** Serie de la tendencia: por día (períodos cortos) o por mes (año / historial) */
function tendencia(informes: InformeFila[], periodo: string) {
  const porDia = ['Hoy', 'Últimos 7 días', 'Últimos 30 días'].includes(periodo)
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const claves: string[] = [], labels: string[] = []
  if (porDia) {
    const dias = periodo === 'Hoy' ? 1 : periodo === 'Últimos 7 días' ? 7 : 30
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date(hoy.getTime() - i * 86400000)
      claves.push(fFecha(d.toISOString()))
      const l = d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' }).replace('.', '')
      labels.push(dias <= 10 || i % 5 === 0 ? l : '')
    }
  } else {
    const desde = periodo === 'Este año' ? new Date(hoy.getFullYear(), 0, 1)
      : informes.length ? new Date(informes.map((i) => i.publicado).sort()[0]) : hoy
    const ini = new Date(desde.getFullYear(), desde.getMonth(), 1)
    const meses = Math.min(24, (hoy.getFullYear() - ini.getFullYear()) * 12 + hoy.getMonth() - ini.getMonth() + 1)
    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      claves.push(`${d.getFullYear()}-${d.getMonth()}`)
      labels.push(d.toLocaleDateString('es-DO', { month: 'short', year: meses > 12 ? '2-digit' : undefined }).replace('.', ''))
    }
  }
  const clave = (iso: string) => { const d = new Date(iso); return porDia ? fFecha(iso) : `${d.getFullYear()}-${d.getMonth()}` }
  const total = claves.map(() => 0), aTiempo = claves.map(() => 0)
  for (const i of informes) {
    const k = claves.indexOf(clave(i.publicado))
    if (k < 0) continue
    total[k]++
    if (i.enTiempo) aTiempo[k]++
  }
  const m = Math.max(...total, 0)
  return {
    labels, max: Math.max(4, Math.ceil((m * 1.1) / 4) * 4),
    series: [{ name: 'Informes generados', color: '#2f6bff', values: total }, { name: 'En tiempo', color: '#5cc879', values: aTiempo }],
  }
}

/* ---------------- Página ---------------- */
export default function Informes() {
  const [fPer, setFPer] = useState(PERIODOS[0])
  const { datos, cargando, error, recargar, real } = useDatos(() => fetchInformes(fPer), { informes: [], radiologos: [] } as DatosInformes, [fPer])
  const [fRad, setFRad] = useState(TODOS_RAD)
  const [fHosp, setFHosp] = useState(TODOS_HOSP)
  const [fMod, setFMod] = useState(TODAS_MOD)
  const [sel, setSel] = useState<string | null>(null)
  const [checked, setChecked] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const filtro = (set: (v: string) => void) => (v: string) => { set(v); setPage(1) }

  /* Informes filtrados por hospital, modalidad y radiólogo */
  const fil = useMemo(() => {
    const rad = datos.radiologos.find((r) => r.nombre === fRad)
    return datos.informes.filter((i) =>
      (fHosp === TODOS_HOSP || i.hospital === fHosp)
      && (fMod === TODAS_MOD || (MOD_ETIQUETA[i.modDb] ?? i.modDb) === fMod)
      && (fRad === TODOS_RAD || i.radId === rad?.id))
  }, [datos, fHosp, fMod, fRad])

  const vm = useMemo(() => {
    const conVence = fil.filter((i) => i.enTiempo !== null)
    const enTiempo = conVence.filter((i) => i.enTiempo).length
    const cals = fil.filter((i) => i.cal !== null).map((i) => i.cal!)
    const calProm = promedio(cals)

    const porMod = new Map<string, number[]>()
    for (const i of fil) porMod.set(i.modDb, [...(porMod.get(i.modDb) ?? []), i.ms])
    const mods = [...porMod.entries()].map(([m, v]) => ({ m: MOD_ETIQUETA[m] ?? m, prom: promedio(v) ?? 0 })).sort((a, b) => a.m.localeCompare(b.m))
    const maxMod = Math.max(...mods.map((m) => m.prom), 1)
    const modalidad = mods.map((m) => ({ m: m.m, label: m.m, t: duracion(m.prom), v: (m.prom / maxMod) * 100, ...(ESTILO_MOD[m.m] ?? { color: '#64748b', cls: 'bg-slate-100 text-slate-600' }) }))

    const grupos = [
      { label: 'Excelente', color: '#16a34a', n: cals.filter((c) => c >= 5).length },
      { label: 'Buena', color: '#2f6bff', n: cals.filter((c) => c === 4).length },
      { label: 'Regular', color: '#f59e0b', n: cals.filter((c) => c === 3).length },
      { label: 'Baja', color: '#ef4444', n: cals.filter((c) => c <= 2).length },
    ]
    const calidad = cals.length ? grupos.map((g) => ({ label: g.label, color: g.color, value: Math.round((g.n / cals.length) * 100) })) : []

    const radiologos: Rad[] = datos.radiologos.filter((r) => fRad === TODOS_RAD || r.nombre === fRad).map((r) => {
      const mios = fil.filter((i) => i.radId === r.id)
      const cv = mios.filter((i) => i.enTiempo !== null)
      const c = mios.filter((i) => i.cal !== null).map((i) => i.cal!)
      const ultimo = mios[0]
      const pc = promedio(c)
      return {
        id: r.id, n: r.nombre, esp: r.esp.join(', ') || '—', inf: mios.length, t: duracion(promedio(mios.map((i) => i.ms))),
        cal: pc !== null ? Number(pc.toFixed(1)) : null,
        tiempo: cv.length ? Math.round((cv.filter((i) => i.enTiempo).length / cv.length) * 100) : null,
        hosp: unicos(mios.map((i) => i.hospital)).slice(0, 3), f: ultimo ? fFecha(ultimo.publicado) : '—', h: ultimo ? hora(ultimo.publicado) : '', estado: r.estado,
      }
    }).sort((a, b) => b.inf - a.inf || a.n.localeCompare(b.n, 'es'))

    const porHosp = new Map<string, number>()
    for (const i of fil) porHosp.set(i.hospital, (porHosp.get(i.hospital) ?? 0) + 1)
    const top5 = [...porHosp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([h, v], i) => ({ h, v, p: pct(v, fil.length).replace('.0%', '%'), color: COLORES_TOP[i] }))

    return {
      total: fil.length, tiempo: duracion(promedio(fil.map((i) => i.ms))), calProm, nCal: cals.length,
      pctTiempo: conVence.length ? pct(enTiempo, conVence.length) : '—', retrasados: conVence.length - enTiempo,
      trend: tendencia(fil, fPer), modalidad, calidad, radiologos, top5,
    }
  }, [fil, datos.radiologos, fRad, fPer])

  const RADIOLOGOS = real ? vm.radiologos : MOCK_RADIOLOGOS
  const list = useMemo(() => (real ? RADIOLOGOS : RADIOLOGOS.filter((r) => fRad === TODOS_RAD || r.n === fRad)), [RADIOLOGOS, real, fRad])
  const totalPages = Math.max(1, Math.ceil(list.length / 10))
  const pagina = Math.min(page, totalPages)
  const filas = real ? list.slice((pagina - 1) * 10, pagina * 10) : list
  const keyOf = (r: Rad) => r.id ?? r.n
  const allChecked = filas.length > 0 && filas.every((r) => checked.includes(keyOf(r)))

  const MODALIDAD = real ? vm.modalidad : MOCK_MODALIDAD
  const CALIDAD = real ? vm.calidad : MOCK_CALIDAD
  const TOP5 = real ? vm.top5 : MOCK_TOP5
  const selRad = real && sel ? vm.radiologos.find((r) => r.id === sel) : undefined
  const ULTIMOS = real
    ? fil.filter((i) => !selRad || i.radId === selRad.id).slice(0, 5).map((i) => ({
      id: i.numeroAcceso, key: i.id, p: `${i.paciente} (${i.sexo}${i.edad !== null ? `, ${i.edad} años` : ''})`, h: i.hospNombre,
      f: fFechaHora(i.publicado), m: MOD_ETIQUETA[i.modDb] ?? i.modDb, img: MINIATURA[i.modDb] ?? '/img/crops/rx-torax.webp',
    }))
    : MOCK_ULTIMOS.map((u) => ({ ...u, key: u.id }))
  const kv = (v: string) => (cargando ? '…' : v)

  return (
    <>
      <PageHeader icon={FileText} title="Gestión de informes"
        subtitle="Desempeño de radiólogos, calidad, tiempos de reporte y actividad por hospital" actions={<ExportButton />} />

      {real && !cargando && error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-[12.5px] text-red-600">
          No se pudieron cargar los informes: {error} <button onClick={recargar} className="ml-2 font-semibold text-brand-600 hover:underline">Reintentar</button>
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {real ? (
          <>
            <Kpi icon={FileText} tone="blue" value={kv(num(vm.total))} label="Informes generados" sub={fPer} />
            <Kpi icon={Clock} tone="blue" value={kv(vm.tiempo)} label="Tiempo promedio de reporte" sub="Desde la recepción del estudio" />
            <Kpi icon={Star} tone="orange" value={kv(vm.calProm !== null ? `${vm.calProm.toFixed(1)} / 5` : '—')} label="Calificación promedio"
              sub={vm.nCal ? `Basado en ${num(vm.nCal)} evaluaci${vm.nCal === 1 ? 'ón' : 'ones'}` : 'Sin evaluaciones aún'} />
            <Kpi icon={CheckCircle2} tone="green" value={kv(vm.pctTiempo)} label="Informes en tiempo" sub="Publicados antes del vencimiento" />
            <Kpi icon={TriangleAlert} tone="red" value={kv(num(vm.retrasados))} label="Informes retrasados" sub={vm.total ? `${pct(vm.retrasados, vm.total)} del total` : 'Sin datos aún'} />
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
          {!real
            ? <Bars labels={TREND_LABELS} series={TREND} height={150} max={250} yTicks={5} barWidth={0.72} />
            : cargando ? <SinDatos texto="Cargando…" className="h-[150px]" />
              : vm.total === 0 ? <SinDatos className="h-[150px]" />
                : <Bars labels={vm.trend.labels} series={vm.trend.series} height={150} max={vm.trend.max} yTicks={4} barWidth={0.72} />}
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
            {MODALIDAD.length === 0 && <SinDatos texto={cargando ? 'Cargando…' : undefined} className="py-6" />}
          </div>
        </section>

        <section className="card min-w-0 p-3.5 lg:col-span-2 xl:col-span-4">
          <CardTitle icon={FileText}>Calidad de informes</CardTitle>
          {CALIDAD.length === 0 ? <SinDatos texto={cargando ? 'Cargando…' : undefined} className="h-[140px]" /> : (
          <div className="flex flex-wrap items-center justify-around gap-4">
            <Donut data={CALIDAD} size={140} thickness={20} center={<><span className="text-[28px] font-bold leading-none text-ink">{real ? (vm.calProm ?? 0).toFixed(1) : '4.7'}</span><span className="text-[13px] text-ink">/ 5</span></>} />
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
            <Select icon={Building2} options={[TODOS_HOSP, ...(real ? unicos(datos.informes.map((i) => i.hospital)) : HOSPITALES_FILTRO)]} onChange={filtro(setFHosp)} />
            <Select icon={Layers} options={real ? [TODAS_MOD, ...unicos(datos.informes.map((i) => MOD_ETIQUETA[i.modDb] ?? i.modDb))] : [TODAS_MOD, 'TC', 'RX', 'RM', 'US', 'MG']} onChange={filtro(setFMod)} />
            <Select icon={User} options={[TODOS_RAD, ...(real ? datos.radiologos.map((r) => r.nombre) : MOCK_RADIOLOGOS.map((r) => r.n))]} onChange={filtro(setFRad)} />
            <Select icon={Calendar} options={PERIODOS.slice(0, real ? 5 : 4)} onChange={filtro(setFPer)} />
            <button className="btn-outline bg-white"><Filter size={16} /> Más filtros</button>
          </div>

          <section className="card min-w-0">
            <div className="flex items-center gap-3 px-4 pb-2 pt-3.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white"><ArrowDown size={15} /></span>
              <h3 className="text-[16px] font-bold text-ink">Radiólogos y desempeño en informes</h3>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11.5px] text-brand-700">
                {real ? (cargando ? 'Cargando…' : `${num(list.length)} radiólogo${list.length === 1 ? '' : 's'}`) : '28 radiólogos'}
              </span>
            </div>
            <Table>
              <thead>
                <tr className="bg-[#f6f9fe]">
                  <th className="th pl-4"><Checkbox checked={allChecked} onChange={(v) => setChecked(v ? filas.map(keyOf) : [])} /></th>
                  <th className="th">#</th><th className="th">Radiólogo</th><th className="th">Especialidades</th><th className="th text-center">Informes</th>
                  <th className="th">Tiempo promedio</th><th className="th">Calificación</th><th className="th">En tiempo</th><th className="th">Últimos hospitales</th>
                  <th className="th">Último informe</th><th className="th">Estado</th><th className="th pr-4" />
                </tr>
              </thead>
              <tbody>
                {real && cargando && <tr><td colSpan={12} className="td py-8 text-center text-slate-500">Cargando…</td></tr>}
                {real && !cargando && error && (
                  <tr><td colSpan={12} className="td py-8 text-center text-red-600">No se pudieron cargar los informes: {error} <button onClick={recargar} className="ml-2 font-semibold text-brand-600 hover:underline">Reintentar</button></td></tr>
                )}
                {!(real && (cargando || error)) && filas.map((r) => (
                  <tr key={keyOf(r)} onClick={() => setSel(real && sel === keyOf(r) ? null : keyOf(r))} className={clsx('tr cursor-pointer', sel === keyOf(r) && '!bg-brand-50/70')}>
                    <td className="td pl-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={checked.includes(keyOf(r))} onChange={() => setChecked(checked.includes(keyOf(r)) ? checked.filter((x) => x !== keyOf(r)) : [...checked, keyOf(r)])} />
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
                    <td className="td whitespace-nowrap">
                      {r.cal === null ? <span className="text-slate-400">—</span>
                        : <span className="inline-flex items-center gap-1 text-ink"><Star size={14} className="fill-amber-400 text-amber-400" />{r.cal}</span>}
                    </td>
                    <td className="td whitespace-nowrap">
                      {r.tiempo === null ? <span className="text-slate-400">—</span>
                        : <span className="inline-flex items-center gap-1 text-ink"><ArrowDown size={13} className="text-emerald-600" />{r.tiempo}%</span>}
                    </td>
                    <td className="td">
                      <span className="flex gap-1">{r.hosp.map((h) => <span key={h} title={h} className="max-w-[90px] truncate rounded border border-brand-100 bg-brand-50 px-1.5 py-0.5 text-[9.5px] font-semibold text-brand-700">{h}</span>)}</span>
                      {r.hosp.length === 0 && <span className="text-slate-400">—</span>}
                    </td>
                    <td className="td whitespace-nowrap text-[11px] leading-tight">{r.f}<br />{r.h}</td>
                    <td className="td whitespace-nowrap">
                      {(r.estado ?? 'Activo') === 'Activo'
                        ? <span className="inline-flex items-center gap-1.5 text-[11.5px] text-emerald-700"><CheckCircle2 size={14} className="fill-emerald-600 text-white" />Activo</span>
                        : <span className="text-[11.5px] text-slate-500">{r.estado}</span>}
                    </td>
                    <td className="td pr-4" onClick={(e) => e.stopPropagation()}><button className="dots-btn" aria-label="Acciones" onClick={() => setSel(keyOf(r))}><MoreHorizontal size={16} /></button></td>
                  </tr>
                ))}
                {!(real && (cargando || error)) && list.length === 0 && (
                  <tr><td colSpan={12} className="td py-8 text-center text-slate-400">{real && datos.radiologos.length === 0 ? 'Aún no hay radiólogos registrados' : 'No hay radiólogos con los filtros seleccionados.'}</td></tr>
                )}
              </tbody>
            </Table>
            {real
              ? <Pagination text={list.length ? `Mostrando ${num((pagina - 1) * 10 + 1)} a ${num(Math.min(pagina * 10, list.length))} de ${num(list.length)} radiólogos` : 'Mostrando 0 de 0 radiólogos'} page={pagina} onPage={setPage} totalPages={totalPages} />
              : <Pagination text="Mostrando 1 a 10 de 28 radiólogos" pages={[1, 2, 3]} />}
          </section>
        </div>

        <div className="min-w-0 space-y-4 xl:col-span-3">
          <section className="card p-3.5">
            <CardTitle icon={FileText}>Top 5 hospitales por informes</CardTitle>
            <div className="space-y-2.5">
              {TOP5.map((t) => (
                <div key={t.h} className="grid grid-cols-[44px_1fr_34px_32px] items-center gap-2 text-[12px]">
                  <span className="truncate text-ink" title={t.h}>{t.h}</span>
                  <Bar value={t.v} max={real ? Math.max(1, TOP5[0]?.v ?? 1) : 500} color={t.color} height={7} className="rounded" />
                  <span className="text-right text-ink">{t.v}</span>
                  <span className="text-right text-[11px] text-slate-500">{t.p}</span>
                </div>
              ))}
              {TOP5.length === 0 && <SinDatos texto={cargando ? 'Cargando…' : undefined} className="py-6" />}
            </div>
          </section>

          <section className="card p-3.5">
            <CardTitle icon={FileText} right={selRad && <button onClick={() => setSel(null)} className="text-[11.5px] font-semibold text-brand-600 hover:underline">Ver todos</button>}>
              Últimos informes generados
            </CardTitle>
            {selRad && <p className="-mt-1 mb-2 text-[11.5px] text-slate-500">{selRad.n}</p>}
            <ul className="space-y-2.5">
              {ULTIMOS.map((u) => (
                <li key={u.key} className="flex items-start gap-2.5">
                  <img src={u.img} alt={u.m} className="h-[54px] w-[54px] shrink-0 rounded-md bg-black object-cover" />
                  <div className="min-w-0 flex-1 text-[11px] leading-tight text-slate-600">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] font-bold text-ink">{u.id}</span>
                      <Modality m={u.m} className="text-[9.5px]" />
                    </div>
                    <div className="text-ink/90">{u.p}</div>
                    <div className="truncate">{u.h}</div>
                    <div>{u.f}</div>
                  </div>
                  <button className="dots-btn mt-3 shrink-0" aria-label="Acciones"><MoreHorizontal size={16} /></button>
                </li>
              ))}
              {ULTIMOS.length === 0 && <li><SinDatos texto={cargando ? 'Cargando…' : 'Aún no se han generado informes'} className="py-6" /></li>}
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}
