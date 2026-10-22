import { useMemo, useState } from 'react'
import {
  BarChart3, CalendarDays, CheckCircle2, ChevronDown, Clock, Database, FileBarChart, FileDown, FileSpreadsheet, FileText,
  Filter, Loader2, Map as MapIcon, PieChart, TrendingUp, UserRound, Building2, Table2, FileCheck2,
} from 'lucide-react'
import { Badge, Bar, DotsButton, InfoRow, Kpi, Modal, MoreLink, PageHeader, Pagination, Panel, Select, Table, clsx, type Tone } from '../../components/ui'
import { Bars, Donut } from '../../components/charts'
import { ESTADO_ESTUDIO, MOD_DESCRIPCION, MOD_ETIQUETA, fFecha, fFechaHora, num, pct, supabaseConfigurado, useDatos } from '../../lib/admin-data'
import { supabase } from '../../lib/supabase'
import { useSesion } from '../../lib/session'

/* ---------- Datos mock ---------- */
const modalidades = [
  { label: 'Tomografía (CT)', value: 512, pct: '23.8%', color: '#2f6bff' },
  { label: 'Resonancia (RM)', value: 333, pct: '15.5%', color: '#5cc49a' },
  { label: 'Rayos X (RX)', value: 218, pct: '10.2%', color: '#fbbf24' },
  { label: 'Ecografía (US)', value: 431, pct: '20.1%', color: '#a35cf0' },
  { label: 'Mamografía (MG)', value: 120, pct: '5.6%', color: '#f472b6' },
  { label: 'Otros', value: 534, pct: '24.8%', color: '#cbd5e1' },
]
const legendMod = ['#2f6bff', '#22b07d', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b']

const estados = [
  { label: 'Informados', value: 1652, pct: '76.9%', color: '#22a35a' },
  { label: 'En proceso', value: 312, pct: '14.5%', color: '#4f86f7' },
  { label: 'Sin asignar', value: 186, pct: '8.7%', color: '#fbbf24' },
]

const dias = Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0'))
const estudiosDia = [70, 90, 110, 105, 140, 170, 190, 220, 260, 290, 330, 210, 250, 270, 300, 260, 310, 240, 200, 280, 300, 240, 280, 320, 260, 230, 300, 250, 220, 310]
const informesDia = estudiosDia.map((v, i) => Math.round(v * (0.42 + ((i * 7) % 10) / 40)))

const MOCK_TOP_HOSPITALES = [
  ['HPHM - Hosp. Hugo Mendoza', '512', '23.8%', '17.1'],
  ['HRA - Hosp. Dr. Fco. A. Gonzalvo', '333', '15.5%', '11.1'],
  ['HJM - Hosp. Juan de Herrera', '218', '10.2%', '7.3'],
  ['HRC - Hosp. Municipal Constanza', '69', '3.2%', '2.3'],
  ['HGA - Hosp. Municipal La Vega', '35', '1.6%', '1.2'],
]

const MOCK_TIEMPOS = [
  { label: 'Tomografía (CT)', value: 48, txt: '48 min', color: '#6a9bff' },
  { label: 'Resonancia (RM)', value: 65, txt: '1 h 05 min', color: '#5cc49a' },
  { label: 'Rayos X (RX)', value: 28, txt: '28 min', color: '#fcd34d' },
  { label: 'Ecografía (US)', value: 42, txt: '42 min', color: '#a37cf5' },
  { label: 'Mamografía (MG)', value: 110, txt: '1 h 50 min', color: '#f472b6' },
]

const MOCK_REGIONES = [
  { label: 'Cibao Sur', value: '381,001', pct: '23.8%', color: '#2f6bff' },
  { label: 'Cibao Norte', value: '298,450', pct: '18.6%', color: '#22b07d' },
  { label: 'Santo Domingo', value: '272,118', pct: '17.0%', color: '#f59e0b' },
  { label: 'Este', value: '198,762', pct: '12.4%', color: '#8b5cf6' },
  { label: 'Sur', value: '150,443', pct: '9.4%', color: '#ec4899' },
  { label: 'Noroeste', value: '120,558', pct: '7.5%', color: '#fbbf24' },
  { label: 'Nordeste', value: '98,331', pct: '6.1%', color: '#64748b' },
]

type Reporte = { nombre: string; tipo: string; periodo: string; por: string; fecha: string; formato: string; estado: 'Completado' | 'Generando' }
const MOCK_RECIENTES: Reporte[] = [
  { nombre: 'Estudios por hospital', tipo: 'Operativo', periodo: '01/03/2025 - 15/03/2025', por: 'Juan Pérez', fecha: '15/03/2025 10:24 a. m.', formato: 'PDF', estado: 'Completado' },
  { nombre: 'Tiempo de reporte por modalidad', tipo: 'Estadístico', periodo: '01/03/2025 - 15/03/2025', por: 'Juan Pérez', fecha: '15/03/2025 09:18 a. m.', formato: 'PDF', estado: 'Completado' },
  { nombre: 'Volumen de imágenes', tipo: 'Estadístico', periodo: '01/03/2025 - 15/03/2025', por: 'María López', fecha: '14/03/2025 06:12 p. m.', formato: 'Excel', estado: 'Completado' },
  { nombre: 'Actividad de radiólogos', tipo: 'Operativo', periodo: '01/03/2025 - 15/03/2025', por: 'Carlos Peña', fecha: '14/03/2025 11:43 a. m.', formato: 'PDF', estado: 'Completado' },
  { nombre: 'Estudios críticos', tipo: 'Seguridad', periodo: '14/03/2025 - 15/03/2025', por: 'Ana Rodríguez', fecha: '14/03/2025 08:02 a. m.', formato: 'CSV', estado: 'Completado' },
]

const topHospitales = supabaseConfigurado ? [] : MOCK_TOP_HOSPITALES
const tiempos = supabaseConfigurado ? MOCK_TIEMPOS.map((t) => ({ ...t, value: 0, txt: '—' })) : MOCK_TIEMPOS
const regiones = supabaseConfigurado ? MOCK_REGIONES.map((r) => ({ ...r, value: '0', pct: '—' })) : MOCK_REGIONES
const HOSPITAL_REGION = ['Todos', 'Cibao Sur', 'Cibao Norte', 'Santo Domingo', 'HPHM', 'HRA', 'HJM']

function SinDatos({ className, texto = 'Sin datos para mostrar' }: { className?: string; texto?: string }) {
  return <div className={clsx('flex min-h-[150px] items-center justify-center text-center text-[12.5px] text-slate-400', className)}>{texto}</div>
}

const fechaCorta = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
const isoLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Rango [desde 00:00, hasta 23:59] de cada período, calculado a partir de la fecha actual */
function rangoPeriodo(periodo: string): { desde: Date; hasta: Date } {
  const hoy = new Date()
  const y = hoy.getFullYear(), m = hoy.getMonth(), d = hoy.getDate()
  const fin = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate(), 23, 59, 59, 999)
  switch (periodo) {
    case 'Últimos 7 días': return { desde: new Date(y, m, d - 6), hasta: fin(hoy) }
    case 'Mes actual': return { desde: new Date(y, m, 1), hasta: fin(hoy) }
    case 'Mes anterior': return { desde: new Date(y, m - 1, 1), hasta: fin(new Date(y, m, 0)) }
    case 'Año actual': return { desde: new Date(y, 0, 1), hasta: fin(hoy) }
    default: return { desde: new Date(y, m, d - 29), hasta: fin(hoy) }
  }
}
const textoRango = (r: { desde: Date; hasta: Date }) => `${fechaCorta(r.desde)} - ${fechaCorta(r.hasta)}`

const PERIODOS_ORDEN = ['Últimos 7 días', 'Últimos 30 días', 'Mes actual', 'Mes anterior', 'Año actual']
const TIPOS_REPORTE = [
  { nombre: 'Estudios por hospital', tipo: 'Operativo' },
  { nombre: 'Estudios por modalidad', tipo: 'Estadístico' },
  { nombre: 'Tiempo de reporte por modalidad', tipo: 'Estadístico' },
  { nombre: 'Volumen de imágenes', tipo: 'Estadístico' },
  { nombre: 'Actividad de radiólogos', tipo: 'Operativo' },
  { nombre: 'Estudios críticos', tipo: 'Seguridad' },
  { nombre: 'Estudios por región', tipo: 'Estadístico' },
]
const MOCK_PERIODOS: Record<string, string> = {
  'Últimos 7 días': '09/03/2025 - 15/03/2025',
  'Últimos 30 días': '14/02/2025 - 15/03/2025',
  'Mes actual': '01/03/2025 - 15/03/2025',
  'Mes anterior': '01/02/2025 - 28/02/2025',
  'Año actual': '01/01/2025 - 15/03/2025',
}
const PERIODOS: Record<string, string> = supabaseConfigurado
  ? Object.fromEntries(PERIODOS_ORDEN.map((p) => [p, textoRango(rangoPeriodo(p))]))
  : MOCK_PERIODOS

/* ---------- Datos reales ---------- */
const POR_PAGINA = 10
const PALETA = ['#2f6bff', '#22b07d', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6', '#64748b', '#fbbf24', '#ef4444']
const MOD_COLOR: Record<string, string> = { CT: '#2f6bff', MR: '#22b07d', RX: '#f59e0b', US: '#8b5cf6', MG: '#ec4899', PET: '#0ea5e9', NM: '#14b8a6', XA: '#64748b', OTROS: '#cbd5e1' }
const ESTADO_COLOR: Record<string, string> = { informado: '#22a35a', en_lectura: '#4f86f7', asignado: '#8b5cf6', en_revision: '#f59e0b', nuevo: '#fbbf24', cancelado: '#94a3b8' }
const PRIORIDAD: Record<string, string> = { emergencia: 'Emergencia', urgencia: 'Urgencia', hospitalizado: 'Hospitalizado', ambulatorio: 'Ambulatorio' }
const ESTADO_REPORTE: Record<string, { l: string; tone: Tone }> = {
  completado: { l: 'Completado', tone: 'green' }, en_proceso: { l: 'En proceso', tone: 'blue' }, fallido: { l: 'Fallido', tone: 'red' },
}
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

type EstudioRep = {
  id: string; numero: string; recibido: string; modalidad: string; prioridad: string; estado: string; imagenes: number
  hospitalId: string | null; hospital: string; hospitalNombre: string; region: string; informeFin: string | null
}
type HospitalOpc = { id: string; etiqueta: string; region: string }
/** Ámbito del reporte: toda la red, una región de salud o un hospital */
type Ambito = { ambito: 'todos' | 'region' | 'hospital'; valor: string; etiqueta: string }
const TODOS: Ambito = { ambito: 'todos', valor: '', etiqueta: 'Todos' }

type Resp<T> = { data: T | null; error: { message: string } | null }
const datos = <T,>(r: Resp<T>): T => { if (r.error) throw new Error(r.error.message); return r.data as T }
const uno = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)

/** Todos los estudios recibidos en el rango (se leen en bloques de 1,000) */
async function traerEstudios(desde: Date, hasta: Date): Promise<EstudioRep[]> {
  type Fila = {
    id: string; numero_acceso: string; recibido_en: string; modalidad: string; prioridad: string; estado: string; num_imagenes: number | null; hospital_id: string | null
    hospitales: { sigla: string | null; nombre: string; provincias: { region_salud: string | null } | null } | null
    informes: { estado: string; firmado_en: string | null; publicado_en: string | null }[] | { estado: string; firmado_en: string | null; publicado_en: string | null } | null
  }
  const filas: Fila[] = []
  const BLOQUE = 1000
  for (let i = 0; ; i += BLOQUE) {
    const r = await supabase.from('estudios')
      .select('id, numero_acceso, recibido_en, modalidad, prioridad, estado, num_imagenes, hospital_id, hospitales(sigla, nombre, provincias(region_salud)), informes(estado, firmado_en, publicado_en)')
      .gte('recibido_en', desde.toISOString()).lte('recibido_en', hasta.toISOString())
      .order('recibido_en').range(i, i + BLOQUE - 1)
    const lote = datos(r as Resp<Fila[]>)
    filas.push(...lote)
    if (lote.length < BLOQUE) break
  }
  return filas.map((e) => {
    const h = uno(e.hospitales)
    const infs = (Array.isArray(e.informes) ? e.informes : e.informes ? [e.informes] : [])
      .filter((i) => ['firmado', 'publicado', 'corregido'].includes(i.estado))
      .map((i) => i.firmado_en ?? i.publicado_en).filter((f): f is string => !!f).sort()
    return {
      id: e.id, numero: e.numero_acceso, recibido: e.recibido_en, modalidad: e.modalidad, prioridad: e.prioridad, estado: e.estado,
      imagenes: e.num_imagenes ?? 0, hospitalId: e.hospital_id, hospital: h?.sigla || h?.nombre || '—', hospitalNombre: h?.nombre ?? '—',
      region: uno(h?.provincias)?.region_salud ?? 'Sin región', informeFin: infs[0] ?? null,
    }
  })
}

const filtrarAmbito = (es: EstudioRep[], a: Ambito) =>
  a.ambito === 'region' ? es.filter((e) => e.region === a.valor) : a.ambito === 'hospital' ? es.filter((e) => e.hospitalId === a.valor) : es

type DatosPeriodo = { estudios: EstudioRep[]; hospitales: HospitalOpc[] }
async function cargarPeriodo(periodo: string): Promise<DatosPeriodo> {
  const { desde, hasta } = rangoPeriodo(periodo)
  const [estudios, hosp] = await Promise.all([
    traerEstudios(desde, hasta),
    supabase.from('hospitales').select('id, sigla, nombre, provincias(region_salud)').order('nombre'),
  ])
  type FilaH = { id: string; sigla: string | null; nombre: string; provincias: { region_salud: string | null } | null }
  return {
    estudios,
    hospitales: datos(hosp as Resp<FilaH[]>).map((h) => ({
      id: h.id, etiqueta: h.sigla ? `${h.sigla} - ${h.nombre}` : h.nombre, region: uno(h.provincias)?.region_salud ?? '',
    })),
  }
}

type ReporteReal = {
  id: string; nombre: string; tipo: string; formato: string; filtros: Record<string, unknown>; inicio: string | null; fin: string | null
  estado: string; archivo: string | null; generadoPor: string | null; por: string; creado: string
}
async function cargarRecientes(): Promise<ReporteReal[]> {
  type Fila = { id: string; nombre: string; tipo: string; formato: string; filtros: Record<string, unknown> | null; periodo_inicio: string | null; periodo_fin: string | null; estado: string; archivo_path: string | null; generado_por: string | null; created_at: string }
  const filas = datos(await supabase.from('reportes')
    .select('id, nombre, tipo, formato, filtros, periodo_inicio, periodo_fin, estado, archivo_path, generado_por, created_at')
    .order('created_at', { ascending: false }).limit(200) as Resp<Fila[]>)
  const ids = [...new Set(filas.map((f) => f.generado_por).filter((x): x is string => !!x))]
  const nombres = new Map<string, string>()
  if (ids.length) {
    const p = await supabase.from('profiles').select('id, nombre_completo').in('id', ids)
    for (const x of (p.data ?? []) as { id: string; nombre_completo: string | null }[]) if (x.nombre_completo) nombres.set(x.id, x.nombre_completo)
  }
  return filas.map((f) => ({
    id: f.id, nombre: f.nombre, tipo: f.tipo, formato: f.formato, filtros: f.filtros ?? {}, inicio: f.periodo_inicio, fin: f.periodo_fin,
    estado: f.estado, archivo: f.archivo_path, generadoPor: f.generado_por, por: (f.generado_por && nombres.get(f.generado_por)) || '—', creado: f.created_at,
  }))
}

/** Descarga en el navegador un CSV con los estudios (número de acceso, fecha, hospital, modalidad, prioridad, estado) */
function descargarCsv(nombreArchivo: string, filas: EstudioRep[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lineas = [
    ['Número de acceso', 'Fecha', 'Hospital', 'Modalidad', 'Prioridad', 'Estado'],
    ...filas.map((e) => [e.numero, fFechaHora(e.recibido), e.hospitalNombre, MOD_ETIQUETA[e.modalidad] ?? e.modalidad, PRIORIDAD[e.prioridad] ?? e.prioridad, ESTADO_ESTUDIO[e.estado] ?? e.estado]),
  ].map((f) => f.map((c) => esc(String(c ?? ''))).join(','))
  const blob = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nombreArchivo
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const nombreArchivo = (nombre: string, inicio: string, fin: string) => `reporte-${slug(nombre)}-${inicio}_${fin}.csv`

/** Minutos → "45 min" / "1 h 05 min" / "2 d 3 h" */
function duracion(min: number | null) {
  if (min === null || !Number.isFinite(min)) return '—'
  const m = Math.round(min)
  if (m < 60) return `${m} min`
  if (m < 1440) return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`
  return `${Math.floor(m / 1440)} d ${Math.floor((m % 1440) / 60)} h`
}
const minutosReporte = (e: EstudioRep) => (e.informeFin ? Math.max(0, (new Date(e.informeFin).getTime() - new Date(e.recibido).getTime()) / 60000) : null)

/** Opciones "Hospital / Región" derivadas de los hospitales registrados */
function opcionesAmbito(hospitales: HospitalOpc[]): Ambito[] {
  const regionesH = [...new Set(hospitales.map((h) => h.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
  return [
    TODOS,
    ...regionesH.map((r) => ({ ambito: 'region' as const, valor: r, etiqueta: `Región ${r}` })),
    ...hospitales.map((h) => ({ ambito: 'hospital' as const, valor: h.id, etiqueta: h.etiqueta })),
  ]
}

/* ---------- Modal Generar reporte ---------- */
function GenerarModal({ open, onClose, onGenerate, ambitos, onGenerado }: {
  open: boolean; onClose: () => void; onGenerate: (r: Reporte) => void
  /** Producción: opciones de hospital/región y aviso para recargar la lista */
  ambitos: Ambito[]; onGenerado: () => void
}) {
  const [tipo, setTipo] = useState(TIPOS_REPORTE[0].nombre)
  const [periodo, setPeriodo] = useState('Mes actual')
  const [ambito, setAmbito] = useState('Todos')
  const [formato, setFormato] = useState('PDF')
  const [step, setStep] = useState<'form' | 'loading' | 'done'>('form')
  const [error, setError] = useState('')
  const [ultimo, setUltimo] = useState<{ archivo: string; filas: EstudioRep[] } | null>(null)
  const { sesion } = useSesion()
  const close = () => { setStep('form'); setError(''); setUltimo(null); onClose() }

  const generarDemo = () => {
    setStep('loading')
    setTimeout(() => {
      const t = TIPOS_REPORTE.find((x) => x.nombre === tipo) ?? TIPOS_REPORTE[0]
      onGenerate({ nombre: t.nombre, tipo: t.tipo, periodo: PERIODOS[periodo], por: 'Juan Pérez', fecha: '15/03/2025 10:31 a. m.', formato, estado: 'Completado' })
      setStep('done')
    }, 1400)
  }

  const generarReal = async () => {
    setStep('loading'); setError('')
    try {
      if (!sesion?.userId) throw new Error('No hay una sesión activa.')
      const t = TIPOS_REPORTE.find((x) => x.nombre === tipo) ?? TIPOS_REPORTE[0]
      const amb = ambitos.find((a) => a.etiqueta === ambito) ?? TODOS
      const rango = rangoPeriodo(periodo)
      const filas = filtrarAmbito(await traerEstudios(rango.desde, rango.hasta), amb)
      const inicio = isoLocal(rango.desde), fin = isoLocal(rango.hasta)
      const { error: e } = await supabase.from('reportes').insert({
        nombre: t.nombre, tipo: t.tipo, formato, periodo_inicio: inicio, periodo_fin: fin, estado: 'completado', generado_por: sesion.userId,
        filtros: { periodo, hospital_region: amb.etiqueta, ambito: amb.ambito, valor: amb.valor || null, registros: filas.length, archivo_generado: 'CSV' },
      })
      if (e) throw new Error(e.message)
      const archivo = nombreArchivo(t.nombre, inicio, fin)
      descargarCsv(archivo, filas)
      setUltimo({ archivo, filas })
      setStep('done')
      onGenerado()
    } catch (e) {
      setError((e as Error).message ?? String(e)); setStep('form')
    }
  }

  const formatos = [
    { f: 'PDF', icon: FileText, d: 'Documento listo para imprimir' },
    { f: 'Excel', icon: FileSpreadsheet, d: 'Hoja de cálculo editable' },
    { f: 'CSV', icon: Table2, d: 'Datos planos separados por comas' },
  ]

  return (
    <Modal open={open} onClose={close} className="max-w-[620px]">
      <div className="flex items-center gap-3 border-b border-[#eef2f8] px-6 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white"><FileBarChart size={20} /></span>
        <div>
          <h2 className="text-[18px] font-bold text-ink">Generar reporte</h2>
          <p className="text-[12.5px] text-slate-500">Configure el tipo, el período y el formato de salida</p>
        </div>
      </div>

      {step === 'done' ? (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={30} /></span>
          <div className="text-[17px] font-bold text-ink">Reporte generado correctamente</div>
          <p className="mt-1 text-[13px] text-slate-500">“{tipo}” ({formato}) se agregó a Reportes recientes.</p>
          {supabaseConfigurado && ultimo && (
            <p className="mt-2 max-w-[460px] text-[12.5px] text-slate-500">
              Se descargó el archivo CSV con {num(ultimo.filas.length)} estudio{ultimo.filas.length === 1 ? '' : 's'} del período.
              {formato !== 'CSV' && ` La exportación en ${formato} aún no está disponible; el archivo se generó en formato CSV, que puede abrirse en Excel.`}
            </p>
          )}
          <div className="mt-5 flex gap-2">
            <button className="btn-outline" onClick={close}>Cerrar</button>
            <button className="btn-primary" onClick={() => { if (supabaseConfigurado && ultimo) descargarCsv(ultimo.archivo, ultimo.filas); else close() }}>
              <FileDown size={16} /> Descargar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4 px-6 py-5">
            <div>
              <span className="label">Tipo de reporte <span className="text-red-500">*</span></span>
              <Select options={TIPOS_REPORTE.map((t) => t.nombre)} onChange={setTipo} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="label">Período <span className="text-red-500">*</span></span>
                <Select options={Object.keys(PERIODOS)} value={periodo} onChange={setPeriodo} icon={CalendarDays} />
                <p className="mt-1 text-[11.5px] text-slate-500">{PERIODOS[periodo]}</p>
              </div>
              <div>
                <span className="label">Hospital / Región</span>
                <Select options={supabaseConfigurado ? ambitos.map((a) => a.etiqueta) : HOSPITAL_REGION} onChange={setAmbito} />
              </div>
            </div>
            <div>
              <span className="label">Formato <span className="text-red-500">*</span></span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {formatos.map(({ f, icon: Icon, d }) => (
                  <button key={f} type="button" onClick={() => setFormato(f)}
                    className={clsx('flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition',
                      formato === f ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-100' : 'border-[#d7e1f2] hover:border-brand-300')}>
                    <Icon size={20} className={formato === f ? 'text-brand-600' : 'text-slate-500'} />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-ink">{f}</span>
                      <span className="block text-[11px] leading-tight text-slate-500">{d}</span>
                    </span>
                  </button>
                ))}
              </div>
              {supabaseConfigurado && formato !== 'CSV' && (
                <p className="mt-1.5 text-[11.5px] text-slate-500">Por ahora el archivo descargado se genera en formato CSV.</p>
              )}
            </div>
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-600">No se pudo generar el reporte: {error}</p>}
          </div>
          <div className="flex justify-end gap-2 border-t border-[#eef2f8] px-6 py-4">
            <button className="btn-outline" onClick={close} disabled={step === 'loading'}>Cancelar</button>
            <button className="btn-primary min-w-[160px]" onClick={supabaseConfigurado ? generarReal : generarDemo} disabled={step === 'loading'}>
              {step === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Generando…</> : <><FileBarChart size={16} /> Generar reporte</>}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ---------- Cuerpo en modo demostración (datos de ejemplo) ---------- */
function CuerpoDemo({ recientes }: { recientes: Reporte[] }) {
  const [applied, setApplied] = useState(false)
  return (
    <>
      {/* Filtros */}
      <div className="card mb-4 grid grid-cols-1 items-center gap-3 px-4 py-3 sm:grid-cols-2 xl:grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto_1.3fr_auto]">
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink"><CalendarDays size={18} className="text-brand-600" /> Período</span>
        <Select options={['Últimos 30 días', 'Últimos 7 días', 'Mes actual', 'Mes anterior', 'Año actual']} />
        <span className="text-[13px] font-medium text-ink">Hospital / Región</span>
        <Select options={HOSPITAL_REGION} />
        <span className="text-[13px] font-medium text-ink">Tipo de reporte</span>
        <Select options={['Todos', 'Operativo', 'Estadístico', 'Seguridad']} />
        <span className="text-[13px] font-medium text-ink">Modalidad</span>
        <Select options={['Todas', 'CT', 'RM', 'RX', 'US', 'MG']} />
        <button className={clsx('btn-primary min-w-[150px]', applied && '!bg-emerald-600')} onClick={() => { setApplied(true); setTimeout(() => setApplied(false), 1500) }}>
          <Filter size={16} /> {applied ? 'Filtros aplicados' : 'Aplicar filtros'}
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {supabaseConfigurado ? (
          <>
            <Kpi icon={FileText} tone="blue" value="0" label="Estudios realizados" sub="Sin datos aún" />
            <Kpi icon={Database} tone="green" value="0" label="Imágenes de radiología" sub="Sin datos aún" />
            <Kpi icon={UserRound} tone="purple" value="0" label="Imágenes de cardiología" sub="Sin datos aún" />
            <Kpi icon={Clock} tone="red" value="—" label="Tiempo promedio de reporte" sub="Sin datos aún" />
          </>
        ) : (
          <>
            <Kpi icon={FileText} tone="blue" value="2,148" label="Estudios realizados" sub="18% vs. período anterior" trend="up" />
            <Kpi icon={Database} tone="green" value="220,904" label="Imágenes de radiología" sub="12% vs. período anterior" trend="up" />
            <Kpi icon={UserRound} tone="purple" value="112,151" label="Imágenes de cardiología" sub="9% vs. período anterior" trend="up" />
            <Kpi icon={Clock} tone="red" value="1 h 26 min" label="Tiempo promedio de reporte" sub="22% vs. período anterior" trend="down" />
          </>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1.15fr]">
        {/* Estudios por modalidad */}
        <Panel title="Estudios por modalidad" icon={PieChart} action={<MoreLink boxed />}>
          {supabaseConfigurado ? <SinDatos /> : (
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <Donut data={modalidades} size={170} thickness={36}
              center={<><span className="text-[19px] font-bold text-ink">2,148</span><span className="text-[12px] leading-tight text-ink/80">Estudios<br />totales</span></>} />
            <ul className="min-w-0 flex-1 space-y-2.5 text-[12.5px]">
              {modalidades.map((m, i) => (
                <li key={m.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: legendMod[i] }} />
                  <span className="min-w-0 flex-1 truncate text-ink">{m.label}</span>
                  <span className="w-10 text-right tabular-nums text-ink">{m.value}</span>
                  <span className="w-14 text-right tabular-nums text-ink/80">{m.pct}</span>
                </li>
              ))}
            </ul>
          </div>
          )}
        </Panel>

        {/* Estudios por estado */}
        <Panel title="Estudios por estado" icon={BarChart3} action={<MoreLink boxed />}>
          {supabaseConfigurado ? <SinDatos /> : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Donut data={estados} size={165} thickness={22}
              center={<><span className="text-[19px] font-bold text-ink">2,148</span><span className="text-[12px] leading-tight text-ink/80">Estudios<br />totales</span></>} />
            <ul className="min-w-0 flex-1 space-y-3 text-[12px]">
              {estados.map((s) => (
                <li key={s.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="min-w-0 flex-1 truncate text-ink">{s.label}</span>
                  <span className="tabular-nums text-ink">{s.value.toLocaleString('en-US')}</span>
                  <span className="tabular-nums text-ink/80">{s.pct}</span>
                </li>
              ))}
            </ul>
          </div>
          )}
        </Panel>

        {/* Tendencia */}
        <Panel className="lg:col-span-2 xl:col-span-1" title="Tendencia de estudios" icon={TrendingUp} action={<MoreLink boxed />}>
          <div className="mb-1 flex gap-4 text-[12px] text-ink">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#2f6bff]" />Estudios</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#5cc49a]" />Informes completados</span>
          </div>
          {supabaseConfigurado ? <SinDatos className="!min-h-[170px]" /> : <Bars
            labels={dias.map((d, i) => (i % 2 === 0 ? d : ''))}
            height={170}
            max={400}
            yTicks={4}
            barWidth={0.7}
            series={[
              { name: 'Estudios', color: '#2f6bff', values: estudiosDia },
              { name: 'Informes completados', color: '#5cc49a', values: informesDia },
            ]}
          />}
        </Panel>

        {/* Top hospitales */}
        <Panel title="Top 5 hospitales por volumen de estudios" icon={Building2} action={<MoreLink boxed />} bodyClass="!px-2">
          <Table>
            <thead><tr className="bg-[#f5f8fd]">{['#', 'Hospital', 'Estudios', '% del total', 'Promedio/día'].map((h) => <th key={h} className="th text-brand-800">{h}</th>)}</tr></thead>
            <tbody>
              {topHospitales.map((h, i) => (
                <tr key={h[0]} className="tr">
                  <td className="td py-1.5">{i + 1}</td>
                  <td className="td whitespace-nowrap py-1.5 text-ink">{h[0]}</td>
                  {h.slice(1).map((c, j) => <td key={j} className="td py-1.5 tabular-nums text-ink">{c}</td>)}
                </tr>
              ))}
              {topHospitales.length === 0 && <tr><td colSpan={5} className="td py-6 text-center text-slate-400">Aún no hay estudios registrados</td></tr>}
            </tbody>
          </Table>
        </Panel>

        {/* Tiempo promedio */}
        <Panel title="Tiempo promedio de reporte por modalidad" icon={Clock} action={<MoreLink boxed />}>
          <ul className="space-y-3.5 pt-1">
            {tiempos.map((t) => (
              <li key={t.label} className="grid grid-cols-[100px_1fr_74px] items-center gap-2 text-[12.5px]">
                <span className="truncate text-ink">{t.label}</span>
                <Bar value={t.value} max={115} color={t.color} height={18} />
                <span className="whitespace-nowrap font-bold text-ink">{t.txt}</span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Estudios por región */}
        <Panel className="lg:col-span-2 xl:col-span-1" title="Estudios por región" icon={MapIcon} action={<MoreLink boxed />}>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <img src="/img/crops/mapa-regiones.webp" alt="Mapa de regiones" className="w-full max-w-[170px] object-contain" />
            <ul className="min-w-0 flex-1 space-y-1.5 text-[12px]">
              {regiones.map((r) => (
                <li key={r.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                  <span className="min-w-0 flex-1 truncate text-ink">{r.label}</span>
                  <span className="tabular-nums text-ink">{r.value}</span>
                  <span className="w-11 text-right tabular-nums text-ink/80">{r.pct}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      {/* Reportes recientes */}
      <Panel title="Reportes recientes" icon={FileBarChart} action={<MoreLink boxed />} bodyClass="!px-2">
        <Table>
          <thead>
            <tr className="bg-[#f5f8fd]">{['#', 'Nombre del reporte', 'Tipo', 'Período', 'Generado por', 'Fecha / Hora', 'Estado', 'Acciones'].map((h) => <th key={h} className="th text-brand-800">{h}</th>)}</tr>
          </thead>
          <tbody>
            {recientes.map((r, i) => (
              <tr key={r.nombre + r.fecha + i} className="tr">
                <td className="td py-1.5">{i + 1}</td>
                <td className="td whitespace-nowrap py-1.5 text-ink">{r.nombre}</td>
                <td className="td py-1.5 text-ink">{r.tipo}</td>
                <td className="td whitespace-nowrap py-1.5 text-ink">{r.periodo}</td>
                <td className="td whitespace-nowrap py-1.5 text-ink">{r.por}</td>
                <td className="td whitespace-nowrap py-1.5 text-ink">{r.fecha}</td>
                <td className="td whitespace-nowrap py-1.5"><Badge tone="green" icon>{r.estado}</Badge></td>
                <td className="td py-1.5">
                  <div className="flex items-center gap-2">
                    <button className="dots-btn" title={`Descargar ${r.formato}`} aria-label="Descargar"><FileDown size={15} /></button>
                    <DotsButton />
                  </div>
                </td>
              </tr>
            ))}
            {recientes.length === 0 && <tr><td colSpan={8} className="td py-6 text-center text-slate-400">Aún no hay reportes generados</td></tr>}
          </tbody>
        </Table>
      </Panel>

    </>
  )
}

/* ---------- Detalle de un reporte generado ---------- */
function DetalleReporte({ r, onClose, onDescargar, descargando }: { r: ReporteReal | null; onClose: () => void; onDescargar: (r: ReporteReal) => void; descargando: boolean }) {
  const f = r?.filtros ?? {}
  const est = r ? ESTADO_REPORTE[r.estado] ?? { l: r.estado, tone: 'gray' as Tone } : null
  return (
    <Modal open={!!r} onClose={onClose} className="max-w-[520px]">
      {r && est && (
        <div className="px-6 py-5">
          <h2 className="mb-3 pr-8 text-[18px] font-bold text-ink">{r.nombre}</h2>
          <InfoRow label="Tipo">{r.tipo}</InfoRow>
          <InfoRow label="Formato solicitado">{r.formato}</InfoRow>
          <InfoRow label="Período">{fFecha(r.inicio)} - {fFecha(r.fin)}{typeof f.periodo === 'string' && <span className="text-slate-500"> ({f.periodo})</span>}</InfoRow>
          <InfoRow label="Hospital / Región">{typeof f.hospital_region === 'string' ? f.hospital_region : 'Todos'}</InfoRow>
          <InfoRow label="Estudios incluidos">{typeof f.registros === 'number' ? num(f.registros) : '—'}</InfoRow>
          <InfoRow label="Generado por">{r.por}</InfoRow>
          <InfoRow label="Fecha / Hora">{fFechaHora(r.creado)}</InfoRow>
          <InfoRow label="Estado"><Badge tone={est.tone} icon={est.tone === 'green'}>{est.l}</Badge></InfoRow>
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn-outline" onClick={onClose}>Cerrar</button>
            <button className="btn-primary" disabled={descargando || !r.inicio || !r.fin} onClick={() => onDescargar(r)}>
              {descargando ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} Descargar CSV
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ---------- Cuerpo con datos reales ---------- */
type Filtros = { periodo: string; ambito: string; tipo: string; mod: string }
const FILTROS_INICIALES: Filtros = { periodo: 'Últimos 30 días', ambito: 'Todos', tipo: 'Todos', mod: 'Todas' }

function CuerpoReal({ periodoDatos, recientes }: {
  periodoDatos: ReturnType<typeof useDatos<DatosPeriodo | null>> & { aplicar: (f: Filtros) => void; filtros: Filtros }
  recientes: ReturnType<typeof useDatos<ReporteReal[]>>
}) {
  const { datos: dp, cargando, error, recargar, filtros, aplicar } = periodoDatos
  const [pendientes, setPendientes] = useState<Filtros>(filtros)
  const [applied, setApplied] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [descargando, setDescargando] = useState<string | null>(null)
  const [errorDescarga, setErrorDescarga] = useState('')

  const ambitos = useMemo(() => opcionesAmbito(dp?.hospitales ?? []), [dp])
  const modsDisponibles = useMemo(() => [...new Set((dp?.estudios ?? []).map((e) => e.modalidad))].sort(), [dp])

  const v = useMemo(() => {
    if (!dp) return null
    const amb = ambitos.find((a) => a.etiqueta === filtros.ambito) ?? TODOS
    const modDb = Object.keys(MOD_ETIQUETA).find((k) => MOD_ETIQUETA[k] === filtros.mod)
    const es = filtrarAmbito(dp.estudios, amb).filter((e) => !modDb || e.modalidad === modDb)
    const rango = rangoPeriodo(filtros.periodo)
    const diasN = Math.max(1, Math.round((new Date(rango.hasta.getFullYear(), rango.hasta.getMonth(), rango.hasta.getDate()).getTime() - rango.desde.getTime()) / 86400000) + 1)
    const total = es.length
    const contar = (clave: (e: EstudioRep) => string) => {
      const m = new Map<string, number>()
      for (const e of es) m.set(clave(e), (m.get(clave(e)) ?? 0) + 1)
      return [...m.entries()].sort((a, b) => b[1] - a[1])
    }
    const conInforme = es.filter((e) => e.informeFin)
    const mins = conInforme.map(minutosReporte).filter((x): x is number => x !== null)
    const porModT = new Map<string, { s: number; n: number }>()
    for (const e of conInforme) { const m = minutosReporte(e); if (m === null) continue; const x = porModT.get(e.modalidad) ?? { s: 0, n: 0 }; x.s += m; x.n++; porModT.set(e.modalidad, x) }
    const tiemposMod = [...porModT.entries()].map(([mod, x]) => ({ mod, min: x.s / x.n, n: x.n })).sort((a, b) => b.n - a.n)

    // Tendencia: por día si el período tiene hasta 31 días; si no, por mes
    const porDia = diasN <= 31
    const claves: string[] = []
    const etiquetas: string[] = []
    if (porDia) {
      for (let i = 0; i < diasN; i++) { const d = new Date(rango.desde.getFullYear(), rango.desde.getMonth(), rango.desde.getDate() + i); claves.push(isoLocal(d)); etiquetas.push(String(d.getDate()).padStart(2, '0')) }
    } else {
      for (let d = new Date(rango.desde.getFullYear(), rango.desde.getMonth(), 1); d <= rango.hasta; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
        claves.push(isoLocal(d).slice(0, 7)); etiquetas.push(MESES[d.getMonth()])
      }
    }
    const clave = (iso: string) => (porDia ? isoLocal(new Date(iso)) : isoLocal(new Date(iso)).slice(0, 7))
    const serieEst = claves.map(() => 0), serieInf = claves.map(() => 0)
    for (const e of es) {
      const i = claves.indexOf(clave(e.recibido)); if (i >= 0) serieEst[i]++
      if (e.informeFin) { const j = claves.indexOf(clave(e.informeFin)); if (j >= 0) serieInf[j]++ }
    }

    return {
      total, diasN, porDia,
      imagenes: es.reduce((a, e) => a + e.imagenes, 0),
      informes: conInforme.length,
      promedio: mins.length ? mins.reduce((a, b) => a + b, 0) / mins.length : null,
      porMod: contar((e) => e.modalidad).map(([k, n], i) => ({ k, label: `${MOD_DESCRIPCION[k] ?? k} (${MOD_ETIQUETA[k] ?? k})`, value: n, color: MOD_COLOR[k] ?? PALETA[i % PALETA.length] })),
      porEstado: contar((e) => e.estado).map(([k, n], i) => ({ label: ESTADO_ESTUDIO[k] ?? k, value: n, color: ESTADO_COLOR[k] ?? PALETA[i % PALETA.length] })),
      porHospital: contar((e) => e.hospitalNombre).slice(0, 5).map(([nombre, n]) => {
        const e = es.find((x) => x.hospitalNombre === nombre)
        return { nombre: e && e.hospital !== nombre ? `${e.hospital} - ${nombre}` : nombre, n }
      }),
      porRegion: contar((e) => e.region).map(([label, n], i) => ({ label, value: n, color: PALETA[i % PALETA.length] })),
      tiemposMod,
      maxTiempo: Math.max(1, ...tiemposMod.map((t) => t.min)),
      tendencia: { etiquetas, serieEst, serieInf, max: Math.max(1, ...serieEst, ...serieInf) },
    }
  }, [dp, ambitos, filtros])

  const lista = (recientes.datos ?? []).filter((r) => filtros.tipo === 'Todos' || r.tipo === filtros.tipo)
  const tiposRep = ['Todos', ...new Set([...TIPOS_REPORTE.map((t) => t.tipo), ...(recientes.datos ?? []).map((r) => r.tipo)])]
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const pag = Math.min(pagina, paginas)
  const filas = lista.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA)
  const detalle = (recientes.datos ?? []).find((r) => r.id === detalleId) ?? null

  const descargar = async (r: ReporteReal) => {
    if (!r.inicio || !r.fin) return
    setDescargando(r.id); setErrorDescarga('')
    try {
      const f = r.filtros
      const amb: Ambito = f.ambito === 'region' || f.ambito === 'hospital'
        ? { ambito: f.ambito, valor: String(f.valor ?? ''), etiqueta: String(f.hospital_region ?? '') } : TODOS
      const filasR = filtrarAmbito(await traerEstudios(new Date(r.inicio + 'T00:00:00'), new Date(r.fin + 'T23:59:59.999')), amb)
      descargarCsv(nombreArchivo(r.nombre, r.inicio, r.fin), filasR)
    } catch (e) { setErrorDescarga((e as Error).message ?? String(e)) } finally { setDescargando(null) }
  }

  const cargandoIni = cargando && !dp
  const estadoVacio = cargandoIni ? 'Cargando…' : error && !dp ? 'Sin datos' : 'Sin datos para mostrar'
  const kpi = (x: string) => (cargandoIni ? 'Cargando…' : error && !dp ? '—' : x)
  const subPeriodo = textoRango(rangoPeriodo(filtros.periodo))

  return (
    <>
      {/* Filtros */}
      <div className="card mb-4 grid grid-cols-1 items-center gap-3 px-4 py-3 sm:grid-cols-2 xl:grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto_1.3fr_auto]">
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink"><CalendarDays size={18} className="text-brand-600" /> Período</span>
        <Select options={['Últimos 30 días', 'Últimos 7 días', 'Mes actual', 'Mes anterior', 'Año actual']} value={pendientes.periodo} onChange={(x) => setPendientes({ ...pendientes, periodo: x })} />
        <span className="text-[13px] font-medium text-ink">Hospital / Región</span>
        <Select key={`amb-${ambitos.length}`} options={ambitos.map((a) => a.etiqueta)} value={pendientes.ambito} onChange={(x) => setPendientes({ ...pendientes, ambito: x })} />
        <span className="text-[13px] font-medium text-ink">Tipo de reporte</span>
        <Select key={`tipo-${tiposRep.length}`} options={tiposRep} value={pendientes.tipo} onChange={(x) => setPendientes({ ...pendientes, tipo: x })} />
        <span className="text-[13px] font-medium text-ink">Modalidad</span>
        <Select key={`mod-${modsDisponibles.join()}`} options={['Todas', ...modsDisponibles.map((m) => MOD_ETIQUETA[m] ?? m)]} value={pendientes.mod} onChange={(x) => setPendientes({ ...pendientes, mod: x })} />
        <button className={clsx('btn-primary min-w-[150px]', applied && '!bg-emerald-600')}
          onClick={() => { aplicar(pendientes); setPagina(1); setApplied(true); setTimeout(() => setApplied(false), 1500) }}>
          <Filter size={16} /> {applied ? 'Filtros aplicados' : 'Aplicar filtros'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          No se pudieron cargar los datos del período: {error}
          <button onClick={recargar} className="ml-2 font-semibold text-brand-600 hover:underline">Reintentar</button>
        </div>
      )}

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={FileText} tone="blue" value={kpi(num(v?.total ?? 0))} label="Estudios realizados" sub={subPeriodo} />
        <Kpi icon={Database} tone="green" value={kpi(num(v?.imagenes ?? 0))} label="Imágenes recibidas" sub="Suma de imágenes de los estudios" />
        <Kpi icon={FileCheck2} tone="purple" value={kpi(num(v?.informes ?? 0))} label="Informes emitidos" sub={v?.total ? `${pct(v.informes, v.total)} de los estudios` : 'Estudios con informe firmado'} />
        <Kpi icon={Clock} tone="red" value={kpi(duracion(v?.promedio ?? null))} label="Tiempo promedio de reporte" sub="Recepción a firma del informe" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1.15fr]">
        {/* Estudios por modalidad */}
        <Panel title="Estudios por modalidad" icon={PieChart} action={<MoreLink boxed />}>
          {!v || v.total === 0 ? <SinDatos texto={estadoVacio} /> : (
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <Donut data={v.porMod} size={170} thickness={36}
                center={<><span className="text-[19px] font-bold text-ink">{num(v.total)}</span><span className="text-[12px] leading-tight text-ink/80">Estudios<br />totales</span></>} />
              <ul className="min-w-0 flex-1 space-y-2.5 text-[12.5px]">
                {v.porMod.map((m) => (
                  <li key={m.k} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.color }} />
                    <span className="min-w-0 flex-1 truncate text-ink" title={m.label}>{m.label}</span>
                    <span className="w-10 text-right tabular-nums text-ink">{num(m.value)}</span>
                    <span className="w-14 text-right tabular-nums text-ink/80">{pct(m.value, v.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        {/* Estudios por estado */}
        <Panel title="Estudios por estado" icon={BarChart3} action={<MoreLink boxed />}>
          {!v || v.total === 0 ? <SinDatos texto={estadoVacio} /> : (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Donut data={v.porEstado} size={165} thickness={22}
                center={<><span className="text-[19px] font-bold text-ink">{num(v.total)}</span><span className="text-[12px] leading-tight text-ink/80">Estudios<br />totales</span></>} />
              <ul className="min-w-0 flex-1 space-y-3 text-[12px]">
                {v.porEstado.map((s) => (
                  <li key={s.label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="min-w-0 flex-1 truncate text-ink">{s.label}</span>
                    <span className="tabular-nums text-ink">{num(s.value)}</span>
                    <span className="tabular-nums text-ink/80">{pct(s.value, v.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        {/* Tendencia */}
        <Panel className="lg:col-span-2 xl:col-span-1" title="Tendencia de estudios" icon={TrendingUp} action={<MoreLink boxed />}
          subtitle={v ? (v.porDia ? 'Por día' : 'Por mes') : undefined}>
          <div className="mb-1 flex gap-4 text-[12px] text-ink">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#2f6bff]" />Estudios</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#5cc49a]" />Informes completados</span>
          </div>
          {!v || v.total === 0 ? <SinDatos className="!min-h-[170px]" texto={estadoVacio} /> : <Bars
            labels={v.tendencia.etiquetas.map((d, i) => (v.porDia && v.tendencia.etiquetas.length > 16 && i % 2 !== 0 ? '' : d))}
            height={170}
            max={Math.ceil(v.tendencia.max * 1.15)}
            yTicks={4}
            barWidth={0.7}
            series={[
              { name: 'Estudios', color: '#2f6bff', values: v.tendencia.serieEst },
              { name: 'Informes completados', color: '#5cc49a', values: v.tendencia.serieInf },
            ]}
          />}
        </Panel>

        {/* Top hospitales */}
        <Panel title="Top 5 hospitales por volumen de estudios" icon={Building2} action={<MoreLink boxed />} bodyClass="!px-2">
          <Table>
            <thead><tr className="bg-[#f5f8fd]">{['#', 'Hospital', 'Estudios', '% del total', 'Promedio/día'].map((h) => <th key={h} className="th text-brand-800">{h}</th>)}</tr></thead>
            <tbody>
              {(v?.porHospital ?? []).map((h, i) => (
                <tr key={h.nombre} className="tr">
                  <td className="td py-1.5">{i + 1}</td>
                  <td className="td whitespace-nowrap py-1.5 text-ink">{h.nombre}</td>
                  <td className="td py-1.5 tabular-nums text-ink">{num(h.n)}</td>
                  <td className="td py-1.5 tabular-nums text-ink">{pct(h.n, v?.total ?? 0)}</td>
                  <td className="td py-1.5 tabular-nums text-ink">{(h.n / (v?.diasN ?? 1)).toFixed(1)}</td>
                </tr>
              ))}
              {(!v || v.porHospital.length === 0) && <tr><td colSpan={5} className="td py-6 text-center text-slate-400">{cargandoIni ? 'Cargando…' : 'No hay estudios en el período'}</td></tr>}
            </tbody>
          </Table>
        </Panel>

        {/* Tiempo promedio */}
        <Panel title="Tiempo promedio de reporte por modalidad" icon={Clock} action={<MoreLink boxed />}>
          {!v || v.tiemposMod.length === 0 ? <SinDatos texto={estadoVacio} /> : (
            <ul className="space-y-3.5 pt-1">
              {v.tiemposMod.map((t) => (
                <li key={t.mod} className="grid grid-cols-[100px_1fr_74px] items-center gap-2 text-[12.5px]" title={`${num(t.n)} informe${t.n === 1 ? '' : 's'}`}>
                  <span className="truncate text-ink">{`${MOD_DESCRIPCION[t.mod] ?? t.mod} (${MOD_ETIQUETA[t.mod] ?? t.mod})`}</span>
                  <Bar value={t.min} max={v.maxTiempo} color={MOD_COLOR[t.mod] ?? '#6a9bff'} height={18} />
                  <span className="whitespace-nowrap font-bold text-ink">{duracion(t.min)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Estudios por región */}
        <Panel className="lg:col-span-2 xl:col-span-1" title="Estudios por región" icon={MapIcon} action={<MoreLink boxed />}>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <img src="/img/crops/mapa-regiones.webp" alt="Mapa de regiones" className="w-full max-w-[170px] object-contain" />
            {!v || v.porRegion.length === 0 ? <SinDatos className="flex-1" texto={estadoVacio} /> : (
              <ul className="min-w-0 flex-1 space-y-1.5 text-[12px]">
                {v.porRegion.map((r) => (
                  <li key={r.label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                    <span className="min-w-0 flex-1 truncate text-ink">{r.label}</span>
                    <span className="tabular-nums text-ink">{num(r.value)}</span>
                    <span className="w-11 text-right tabular-nums text-ink/80">{pct(r.value, v.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>

      {/* Reportes recientes */}
      <Panel title="Reportes recientes" icon={FileBarChart} action={<MoreLink boxed />} bodyClass="!px-2">
        {errorDescarga && <p className="mx-2 mb-2 rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-600">No se pudo descargar el reporte: {errorDescarga}</p>}
        <Table>
          <thead>
            <tr className="bg-[#f5f8fd]">{['#', 'Nombre del reporte', 'Tipo', 'Período', 'Generado por', 'Fecha / Hora', 'Estado', 'Acciones'].map((h) => <th key={h} className="th text-brand-800">{h}</th>)}</tr>
          </thead>
          <tbody>
            {recientes.error ? (
              <tr><td colSpan={8} className="td py-6 text-center text-red-600">No se pudieron cargar los reportes: {recientes.error} <button onClick={recientes.recargar} className="ml-2 font-semibold text-brand-600 hover:underline">Reintentar</button></td></tr>
            ) : recientes.cargando && !(recientes.datos ?? []).length ? (
              <tr><td colSpan={8} className="td py-6 text-center text-slate-400">Cargando…</td></tr>
            ) : (
              <>
                {filas.map((r, i) => {
                  const est = ESTADO_REPORTE[r.estado] ?? { l: r.estado, tone: 'gray' as Tone }
                  return (
                    <tr key={r.id} className={clsx('tr cursor-pointer', detalleId === r.id && 'bg-brand-50/60')} onClick={() => setDetalleId(r.id)}>
                      <td className="td py-1.5">{(pag - 1) * POR_PAGINA + i + 1}</td>
                      <td className="td whitespace-nowrap py-1.5 text-ink">{r.nombre}</td>
                      <td className="td py-1.5 text-ink">{r.tipo}</td>
                      <td className="td whitespace-nowrap py-1.5 text-ink">{fFecha(r.inicio)} - {fFecha(r.fin)}</td>
                      <td className="td whitespace-nowrap py-1.5 text-ink">{r.por}</td>
                      <td className="td whitespace-nowrap py-1.5 text-ink">{fFechaHora(r.creado)}</td>
                      <td className="td whitespace-nowrap py-1.5"><Badge tone={est.tone} icon={est.tone === 'green'}>{est.l}</Badge></td>
                      <td className="td py-1.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button className="dots-btn" title="Descargar CSV" aria-label="Descargar" disabled={descargando === r.id} onClick={() => descargar(r)}>
                            {descargando === r.id ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
                          </button>
                          <DotsButton onClick={() => setDetalleId(r.id)} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {lista.length === 0 && <tr><td colSpan={8} className="td py-6 text-center text-slate-400">{filtros.tipo === 'Todos' ? 'Aún no hay reportes generados' : 'No hay reportes de este tipo'}</td></tr>}
              </>
            )}
          </tbody>
        </Table>
        {lista.length > POR_PAGINA && (
          <Pagination text={`Mostrando ${(pag - 1) * POR_PAGINA + 1}-${Math.min(pag * POR_PAGINA, lista.length)} de ${num(lista.length)} reportes`}
            page={pag} onPage={setPagina} totalPages={paginas} perPage={false} />
        )}
      </Panel>

      <DetalleReporte r={detalle} onClose={() => setDetalleId(null)} onDescargar={descargar} descargando={!!detalle && descargando === detalle.id} />
    </>
  )
}

/* ---------- Página ---------- */
export default function Reportes() {
  const [modal, setModal] = useState(false)
  const [recientesDemo, setRecientesDemo] = useState<Reporte[]>(supabaseConfigurado ? [] : MOCK_RECIENTES)
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES)
  const periodo = useDatos<DatosPeriodo | null>(() => cargarPeriodo(filtros.periodo), null, [filtros.periodo])
  const recientes = useDatos<ReporteReal[]>(cargarRecientes, [])
  const ambitos = useMemo(() => opcionesAmbito(periodo.datos?.hospitales ?? []), [periodo.datos])

  return (
    <div>
      <PageHeader
        icon={FileText}
        title="Reportes"
        subtitle="Generación de reportes estadísticos y operativos de la plataforma"
        actions={
          <button className="btn-primary min-w-[190px]" onClick={() => setModal(true)}>
            <FileText size={17} /> Generar reporte <ChevronDown size={16} className="ml-3" />
          </button>
        }
      />

      {supabaseConfigurado
        ? <CuerpoReal periodoDatos={{ ...periodo, filtros, aplicar: setFiltros }} recientes={recientes} />
        : <CuerpoDemo recientes={recientesDemo} />}

      <GenerarModal open={modal} onClose={() => setModal(false)} ambitos={ambitos} onGenerado={recientes.recargar}
        onGenerate={(r) => setRecientesDemo([r, ...recientesDemo].slice(0, 6))} />
    </div>
  )
}
