import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowRight, BarChart3, Building2, CalendarDays, Clock, Database, FileText, Hospital, LayoutGrid, Map as MapIcon,
  Minus, Network, Plus, Radio, Server, ShieldPlus, Timer, Upload, UserRound, UserX, Wifi, ChevronDown, Bell, type LucideIcon,
} from 'lucide-react'
import { Badge, Bar, DotsButton, InfoRow, Kpi, Modal, MoreLink, PageHeader, Pagination, Panel, Table, clsx, type Tone } from '../../components/ui'
import { Bars } from '../../components/charts'
import { ESTADO_ESTUDIO, MOD_DESCRIPCION, MOD_ETIQUETA, fFechaHora, num, pct, supabaseConfigurado, useDatos } from '../../lib/admin-data'
import { supabase } from '../../lib/supabase'

/* ---------- Datos mock ---------- */
type Estudio = { hora: string; paciente: string; hospital: string; mod: string; estado: string; tone: Tone; tiempo: string; dot: string }

const MOCK_ESTUDIOS: Record<string, Estudio[]> = {
  'En proceso': [
    { hora: '10:24 a. m.', paciente: 'Juan Pérez', hospital: 'HPHM', mod: 'CT', estado: 'En lectura', tone: 'green', tiempo: '12 min', dot: '#16a34a' },
    { hora: '10:18 a. m.', paciente: 'María López', hospital: 'HGA', mod: 'RX', estado: 'Crítico', tone: 'red', tiempo: '28 min', dot: '#ef4444' },
    { hora: '09:55 a. m.', paciente: 'Carlos Peña', hospital: 'HJM', mod: 'RM', estado: 'Asignado', tone: 'blue', tiempo: '45 min', dot: '#ef4444' },
    { hora: '09:32 a. m.', paciente: 'Ana Rodríguez', hospital: 'HRC', mod: 'US', estado: 'Informe', tone: 'orange', tiempo: '1 h 12 min', dot: '#ef4444' },
    { hora: '08:41 a. m.', paciente: 'Pedro Martínez', hospital: 'HRA', mod: 'CT', estado: 'Pendiente', tone: 'gray', tiempo: '2 h 05 min', dot: '#f59e0b' },
  ],
  'Críticos': [
    { hora: '10:18 a. m.', paciente: 'María López', hospital: 'HGA', mod: 'RX', estado: 'Crítico', tone: 'red', tiempo: '28 min', dot: '#ef4444' },
    { hora: '10:02 a. m.', paciente: 'Rafael Gómez', hospital: 'HPHM', mod: 'CT', estado: 'Crítico', tone: 'red', tiempo: '44 min', dot: '#ef4444' },
    { hora: '09:47 a. m.', paciente: 'Lucía Fernández', hospital: 'HJM', mod: 'RM', estado: 'Crítico', tone: 'red', tiempo: '59 min', dot: '#ef4444' },
    { hora: '09:15 a. m.', paciente: 'José Ramírez', hospital: 'HRC', mod: 'CT', estado: 'Sin acuse', tone: 'orange', tiempo: '1 h 31 min', dot: '#ef4444' },
    { hora: '08:58 a. m.', paciente: 'Carmen Díaz', hospital: 'HGA', mod: 'US', estado: 'Sin acuse', tone: 'orange', tiempo: '1 h 48 min', dot: '#ef4444' },
  ],
  'Sin asignar': [
    { hora: '10:31 a. m.', paciente: 'Miguel Santos', hospital: 'HRA', mod: 'RX', estado: 'Sin asignar', tone: 'gray', tiempo: '5 min', dot: '#f59e0b' },
    { hora: '10:27 a. m.', paciente: 'Rosa Castillo', hospital: 'HGA', mod: 'US', estado: 'Sin asignar', tone: 'gray', tiempo: '9 min', dot: '#f59e0b' },
    { hora: '10:12 a. m.', paciente: 'Luis Herrera', hospital: 'HPHM', mod: 'CT', estado: 'Sin asignar', tone: 'gray', tiempo: '24 min', dot: '#f59e0b' },
    { hora: '09:58 a. m.', paciente: 'Elena Vargas', hospital: 'HJM', mod: 'MG', estado: 'Sin asignar', tone: 'gray', tiempo: '38 min', dot: '#ef4444' },
    { hora: '09:40 a. m.', paciente: 'Andrés Reyes', hospital: 'HRC', mod: 'RX', estado: 'Sin asignar', tone: 'gray', tiempo: '56 min', dot: '#ef4444' },
  ],
  'Vencidos': [
    { hora: '07:12 a. m.', paciente: 'Sofía Medina', hospital: 'HRA', mod: 'RM', estado: 'Vencido', tone: 'red', tiempo: '3 h 24 min', dot: '#ef4444' },
    { hora: '06:50 a. m.', paciente: 'Héctor Núñez', hospital: 'HGA', mod: 'CT', estado: 'Vencido', tone: 'red', tiempo: '3 h 46 min', dot: '#ef4444' },
    { hora: '06:21 a. m.', paciente: 'Patricia Rosario', hospital: 'HJM', mod: 'MG', estado: 'Vencido', tone: 'red', tiempo: '4 h 15 min', dot: '#ef4444' },
    { hora: '05:44 a. m.', paciente: 'Francisco Mejía', hospital: 'HPHM', mod: 'US', estado: 'Vencido', tone: 'red', tiempo: '4 h 52 min', dot: '#ef4444' },
    { hora: '04:30 a. m.', paciente: 'Daniela Cruz', hospital: 'HRC', mod: 'RX', estado: 'Vencido', tone: 'red', tiempo: '6 h 06 min', dot: '#ef4444' },
  ],
}
const MOCK_TABS = [
  { label: 'En proceso', count: '2,148' },
  { label: 'Críticos', count: '24' },
  { label: 'Sin asignar', count: '186' },
  { label: 'Vencidos', count: '312' },
]

const sistemas: { name: string; icon: LucideIcon; ok: boolean }[] = [
  { name: 'Repositorio Nacional', icon: Database, ok: true },
  { name: 'LINKConnect', icon: Network, ok: true },
  { name: 'PACS', icon: Server, ok: true },
  { name: 'RIS', icon: FileText, ok: true },
  { name: 'Interoperabilidad (HL7)', icon: Radio, ok: false },
  { name: 'Red y comunicaciones', icon: Wifi, ok: true },
]

const MOCK_RESPUESTA = [
  { label: 'Tomografía (CT)', value: 48, max: 60, txt: '48 min', obj: 'Objetivo < 60 min', color: '#2f6bff' },
  { label: 'Resonancia (RM)', value: 65, max: 120, txt: '1 h 05 min', obj: 'Objetivo < 2 h', color: '#22b07d' },
  { label: 'Rayos X (RX)', value: 28, max: 120, txt: '28 min', obj: 'Objetivo < 30 min', color: '#f59e0b' },
  { label: 'Ecografía (US)', value: 42, max: 90, txt: '42 min', obj: 'Objetivo < 60 min', color: '#2f6bff' },
  { label: 'Mamografía (MG)', value: 110, max: 110, txt: '1 h 50 min', obj: 'Objetivo < 24 h', color: '#8b5cf6' },
]

const horas = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const recibidos = [70, 55, 40, 32, 48, 60, 75, 110, 170, 200, 215, 190, 205, 220, 195, 230, 240, 210, 200, 185, 160, 140, 120, 95]
const completados = [35, 30, 20, 18, 25, 30, 38, 55, 85, 100, 108, 95, 100, 110, 98, 115, 120, 105, 98, 92, 80, 70, 60, 48]
const criticos = [10, 8, 6, 5, 7, 9, 12, 15, 22, 25, 28, 24, 26, 30, 27, 31, 33, 29, 26, 24, 20, 18, 15, 12]

const MOCK_TOP_HOSPITALES: [string, string, string, boolean][] = [
  ['HPHM - Hosp. Hugo Mendoza', '133,098', '512', true],
  ['HRA - Hosp. Dr. Fco. A. Gonzalvo', '86,644', '333', true],
  ['HJM - Hosp. Juan de Herrera', '56,760', '218', true],
  ['HRC - Hosp. Municipal Constanza', '18,020', '69', false],
  ['HGA - Hosp. Municipal La Vega', '9,148', '35', true],
]
const MOCK_TOP_PROVINCIAS = [
  ['La Vega', '229,559', '21.2%'],
  ['Santiago', '198,762', '18.3%'],
  ['Santo Domingo', '120,558', '11.1%'],
  ['Sánchez Ramírez', '72,239', '6.7%'],
  ['Monseñor Nouel', '62,118', '5.7%'],
]
const MOCK_ALERTAS: { hora: string; tipo: string; tone: Tone; msg: string }[] = [
  { hora: '10:15 a. m.', tipo: 'Crítico', tone: 'red', msg: 'Estudio CT sin acuse de recepción - HPHM' },
  { hora: '09:42 a. m.', tipo: 'Incidencia', tone: 'red', msg: 'Error de envío HL7 - HRC' },
  { hora: '09:18 a. m.', tipo: 'Sistema', tone: 'red', msg: 'Hospital HJM sin conexión' },
  { hora: '08:55 a. m.', tipo: 'SLA', tone: 'orange', msg: 'Estudio RM próximo a vencer - HRA' },
  { hora: '08:22 a. m.', tipo: 'Info', tone: 'blue', msg: 'Nuevo hospital conectado - Hospital de Constanza' },
]
const MOCK_RESUMEN = { total: '128', operativos: ['102', '79.7%'], incidencias: ['18', '14.1%'], sinConexion: ['8', '6.2%'] }

/* ---------- Datos reales ---------- */
const POR_PAGINA = 10
const TAB_LABELS = ['En proceso', 'Críticos', 'Sin asignar', 'Vencidos'] as const
const MOD_COLOR: Record<string, string> = { CT: '#2f6bff', MR: '#22b07d', RX: '#f59e0b', US: '#0ea5e9', MG: '#8b5cf6', PET: '#ec4899', NM: '#14b8a6', XA: '#64748b', OTROS: '#94a3b8' }
const PRIORIDAD: Record<string, string> = { emergencia: 'Emergencia', urgencia: 'Urgencia', hospitalizado: 'Hospitalizado', ambulatorio: 'Ambulatorio' }
const TONO_ESTADO: Record<string, Tone> = { nuevo: 'gray', asignado: 'blue', en_lectura: 'green', en_revision: 'orange', informado: 'green', cancelado: 'gray' }
const ALERTA: Record<string, { l: string; tone: Tone }> = {
  critico: { l: 'Crítico', tone: 'red' }, incidencia: { l: 'Incidencia', tone: 'red' }, sistema: { l: 'Sistema', tone: 'red' },
  sla: { l: 'SLA', tone: 'orange' }, info: { l: 'Info', tone: 'blue' },
}
const ESTADO_HOSP: Record<string, { l: string; tone: Tone }> = {
  activo: { l: 'Activo', tone: 'green' }, en_proceso: { l: 'En proceso', tone: 'orange' }, inactivo: { l: 'Inactivo', tone: 'gray' },
}

type EstudioActivo = {
  id: string; numero: string; descripcion: string; recibido: string; asignado: string | null; vence: string | null
  modalidad: string; prioridad: string; estado: string; radiologoId: string | null; imagenes: number | null
  paciente: string; pacienteCodigo: string; hospital: string; hospitalNombre: string; radiologo: string
}
type HospOps = { id: string; etiqueta: string; estado: string; provincia: string; estudios: number }
type AlertaOps = { id: string; tipo: string; mensaje: string; fecha: string; hospital: string; estudio: string }
type Ops = {
  activos: EstudioActivo[]
  conteos: { hoy: number; enProceso: number; criticos: number; sinAsignar: number; vencidos: number }
  tiempo: { promedioMin: number | null; informes: number; porModalidad: { mod: string; min: number; n: number }[] }
  actividad: { labels: string[]; recibidos: number[]; asignados: number[]; informados: number[] }
  hospitales: HospOps[]
  nodos: { total: number; conectados: number; sincronizando: number; desconectados: number }
  alertas: AlertaOps[]
  diasAnio: number
}

type Resp<T> = { data: T | null; error: { message: string } | null; count?: number | null }
const datos = <T,>(r: Resp<T>): T => { if (r.error) throw new Error(r.error.message); return r.data as T }
const contar = (r: Resp<unknown>) => { if (r.error) throw new Error(r.error.message); return r.count ?? 0 }
const uno = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)

const CERRADOS = '(informado,cancelado)'

async function cargarOperaciones(): Promise<Ops> {
  const ahora = new Date()
  const hoy0 = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const inicioHora = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), ahora.getHours())
  const desde24 = new Date(inicioHora.getTime() - 23 * 3600000)
  const desde30 = new Date(ahora.getTime() - 30 * 86400000)
  const inicioAnio = new Date(ahora.getFullYear(), 0, 1)
  const cuenta = () => supabase.from('estudios').select('id', { count: 'exact', head: true })

  const [activos, hoy, enProceso, criticosN, sinAsignar, vencidos, informes, rec24, asig24, hosp, nodos, alertas] = await Promise.all([
    supabase.from('estudios')
      .select('id, numero_acceso, descripcion, recibido_en, asignado_en, vence_en, modalidad, prioridad, estado, radiologo_id, num_imagenes, pacientes(codigo, nombre_completo), hospitales(sigla, nombre), radiologo:medicos!estudios_radiologo_id_fkey(tratamiento, nombre_completo)')
      .not('estado', 'in', CERRADOS).order('recibido_en', { ascending: false }).limit(1000),
    cuenta().gte('recibido_en', hoy0.toISOString()),
    cuenta().not('estado', 'in', CERRADOS),
    cuenta().not('estado', 'in', CERRADOS).eq('prioridad', 'emergencia'),
    cuenta().not('estado', 'in', CERRADOS).is('radiologo_id', null),
    cuenta().not('estado', 'in', CERRADOS).lt('vence_en', ahora.toISOString()),
    supabase.from('informes').select('firmado_en, publicado_en, created_at, estudios(recibido_en, modalidad)')
      .in('estado', ['firmado', 'publicado', 'corregido']).gte('created_at', desde30.toISOString()).limit(5000),
    supabase.from('estudios').select('recibido_en').gte('recibido_en', desde24.toISOString()).limit(5000),
    supabase.from('estudios').select('asignado_en').gte('asignado_en', desde24.toISOString()).limit(5000),
    supabase.from('hospitales').select('id, codigo, sigla, nombre, estado, provincias(nombre), estudios(count)')
      .gte('estudios.recibido_en', inicioAnio.toISOString()).order('codigo'),
    supabase.from('linkconnect_nodos').select('estado'),
    supabase.from('alertas').select('id, tipo, mensaje, created_at, hospitales(sigla, nombre), estudios(numero_acceso)')
      .eq('resuelta', false).order('created_at', { ascending: false }).limit(100),
  ])

  // Tiempo de reporte: desde la recepción del estudio hasta la firma (o publicación) del informe, últimos 30 días
  type FilaInforme = { firmado_en: string | null; publicado_en: string | null; created_at: string; estudios: { recibido_en: string; modalidad: string } | { recibido_en: string; modalidad: string }[] | null }
  const filasInf = datos(informes as Resp<FilaInforme[]>)
  const tiempos: { mod: string; min: number; fin: number }[] = []
  for (const i of filasInf) {
    const e = uno(i.estudios)
    const fin = new Date(i.firmado_en ?? i.publicado_en ?? i.created_at).getTime()
    if (e?.recibido_en) tiempos.push({ mod: e.modalidad, min: Math.max(0, (fin - new Date(e.recibido_en).getTime()) / 60000), fin })
  }
  const porMod = new Map<string, { s: number; n: number }>()
  for (const t of tiempos) { const m = porMod.get(t.mod) ?? { s: 0, n: 0 }; m.s += t.min; m.n++; porMod.set(t.mod, m) }

  // Actividad por hora (últimas 24 horas, terminando en la hora actual)
  const bucket = (iso: string | null) => (iso ? Math.floor((new Date(iso).getTime() - desde24.getTime()) / 3600000) : -1)
  const serie = (fechas: (string | null)[]) => {
    const v = Array(24).fill(0) as number[]
    for (const f of fechas) { const b = bucket(f); if (b >= 0 && b < 24) v[b]++ }
    return v
  }

  type FilaHosp = { id: string; codigo: string; sigla: string | null; nombre: string; estado: string; provincias: { nombre: string } | null; estudios: { count: number }[] | null }
  type FilaAlerta = { id: string; tipo: string; mensaje: string; created_at: string; hospitales: { sigla: string | null; nombre: string } | null; estudios: { numero_acceso: string } | null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filasAct = datos(activos as Resp<any[]>)
  const ns = datos(nodos as Resp<{ estado: string }[]>)

  return {
    activos: filasAct.map((e) => {
      const h = uno(e.hospitales) as { sigla: string | null; nombre: string } | null
      const p = uno(e.pacientes) as { codigo: string; nombre_completo: string } | null
      const r = uno(e.radiologo) as { tratamiento: string | null; nombre_completo: string } | null
      return {
        id: e.id, numero: e.numero_acceso, descripcion: e.descripcion ?? '', recibido: e.recibido_en, asignado: e.asignado_en, vence: e.vence_en,
        modalidad: e.modalidad, prioridad: e.prioridad, estado: e.estado, radiologoId: e.radiologo_id, imagenes: e.num_imagenes,
        paciente: p?.nombre_completo ?? '—', pacienteCodigo: p?.codigo ?? '', hospital: h?.sigla || h?.nombre || '—', hospitalNombre: h?.nombre ?? '—',
        radiologo: r ? `${r.tratamiento ?? ''} ${r.nombre_completo}`.trim() : '',
      }
    }),
    conteos: { hoy: contar(hoy), enProceso: contar(enProceso), criticos: contar(criticosN), sinAsignar: contar(sinAsignar), vencidos: contar(vencidos) },
    tiempo: {
      promedioMin: tiempos.length ? tiempos.reduce((a, t) => a + t.min, 0) / tiempos.length : null,
      informes: tiempos.length,
      porModalidad: [...porMod.entries()].map(([mod, v]) => ({ mod, min: v.s / v.n, n: v.n })).sort((a, b) => b.n - a.n),
    },
    actividad: {
      labels: Array.from({ length: 24 }, (_, i) => String(new Date(desde24.getTime() + i * 3600000).getHours()).padStart(2, '0')),
      recibidos: serie(datos(rec24 as Resp<{ recibido_en: string }[]>).map((r) => r.recibido_en)),
      asignados: serie(datos(asig24 as Resp<{ asignado_en: string | null }[]>).map((r) => r.asignado_en)),
      informados: serie(tiempos.map((t) => new Date(t.fin).toISOString())),
    },
    hospitales: datos(hosp as Resp<FilaHosp[]>).map((h) => ({
      id: h.id, etiqueta: h.sigla ? `${h.sigla} - ${h.nombre}` : h.nombre, estado: h.estado, provincia: uno(h.provincias)?.nombre ?? 'Sin provincia',
      estudios: h.estudios?.[0]?.count ?? 0,
    })),
    nodos: {
      total: ns.length, conectados: ns.filter((n) => n.estado === 'conectado').length,
      sincronizando: ns.filter((n) => n.estado === 'sincronizando').length, desconectados: ns.filter((n) => n.estado === 'desconectado').length,
    },
    alertas: datos(alertas as Resp<FilaAlerta[]>).map((a) => {
      const h = uno(a.hospitales), e = uno(a.estudios)
      return { id: a.id, tipo: a.tipo, mensaje: a.mensaje, fecha: a.created_at, hospital: h?.sigla || h?.nombre || '', estudio: e?.numero_acceso ?? '' }
    }),
    diasAnio: Math.max(1, Math.floor((hoy0.getTime() - inicioAnio.getTime()) / 86400000) + 1),
  }
}

/** Minutos → "45 min" / "1 h 05 min" / "2 d 3 h" */
function duracion(min: number | null) {
  if (min === null || !Number.isFinite(min)) return '—'
  const m = Math.round(min)
  if (m < 60) return `${m} min`
  if (m < 1440) return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`
  return `${Math.floor(m / 1440)} d ${Math.floor((m % 1440) / 60)} h`
}
const desde = (iso: string) => duracion((Date.now() - new Date(iso).getTime()) / 60000)
const hora = (iso: string) => {
  const d = new Date(iso), hoy = new Date()
  const t = d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === hoy.toDateString() ? t : fFechaHora(iso)
}
const vencido = (e: EstudioActivo) => !!e.vence && new Date(e.vence).getTime() < Date.now()
const colorPunto = (e: EstudioActivo) => (vencido(e) || e.prioridad === 'emergencia' ? '#ef4444' : e.prioridad === 'urgencia' ? '#f59e0b' : '#16a34a')

function FilaVacia({ colSpan, texto }: { colSpan: number; texto: string }) {
  return <tr><td colSpan={colSpan} className="td py-6 text-center text-slate-400">{texto}</td></tr>
}
function FilaEstado({ colSpan, cargando, error, recargar }: { colSpan: number; cargando: boolean; error: string; recargar: () => void }) {
  if (error) return <tr><td colSpan={colSpan} className="td py-6 text-center text-red-600">No se pudieron cargar los datos: {error} <button onClick={recargar} className="ml-2 font-semibold text-brand-600 hover:underline">Reintentar</button></td></tr>
  if (cargando) return <FilaVacia colSpan={colSpan} texto="Cargando…" />
  return null
}
function SinDatos({ texto = 'Sin datos para mostrar', className }: { texto?: string; className?: string }) {
  return <div className={clsx('flex min-h-[150px] items-center justify-center text-center text-[12.5px] text-slate-400', className)}>{texto}</div>
}

/** Detalle de un estudio activo */
function DetalleEstudio({ e, onClose }: { e: EstudioActivo | null; onClose: () => void }) {
  return (
    <Modal open={!!e} onClose={onClose} className="max-w-[520px]">
      {e && (
        <div className="px-6 py-5">
          <h2 className="mb-1 pr-8 text-[18px] font-bold text-ink">Estudio {e.numero}</h2>
          <p className="mb-3 text-[12.5px] text-slate-500">{e.descripcion || MOD_DESCRIPCION[e.modalidad] || e.modalidad}</p>
          <InfoRow label="Paciente">{e.paciente}{e.pacienteCodigo && <span className="text-slate-500"> ({e.pacienteCodigo})</span>}</InfoRow>
          <InfoRow label="Hospital">{e.hospitalNombre}</InfoRow>
          <InfoRow label="Modalidad">{MOD_DESCRIPCION[e.modalidad] ?? e.modalidad} ({MOD_ETIQUETA[e.modalidad] ?? e.modalidad})</InfoRow>
          <InfoRow label="Prioridad">{PRIORIDAD[e.prioridad] ?? e.prioridad}</InfoRow>
          <InfoRow label="Estado"><Badge tone={TONO_ESTADO[e.estado] ?? 'gray'}>{ESTADO_ESTUDIO[e.estado] ?? e.estado}</Badge></InfoRow>
          <InfoRow label="Radiólogo asignado">{e.radiologo || 'Sin asignar'}</InfoRow>
          <InfoRow label="Recibido">{fFechaHora(e.recibido)} <span className="text-slate-500">({desde(e.recibido)})</span></InfoRow>
          <InfoRow label="Asignado">{fFechaHora(e.asignado)}</InfoRow>
          <InfoRow label="Vence">{fFechaHora(e.vence)}{vencido(e) && <Badge tone="red" className="ml-2">Vencido</Badge>}</InfoRow>
          <InfoRow label="Imágenes">{e.imagenes ?? '—'}</InfoRow>
          <div className="mt-4 flex justify-end"><button className="btn-outline" onClick={onClose}>Cerrar</button></div>
        </div>
      )}
    </Modal>
  )
}

/* ---------- Página ---------- */
export default function Operaciones() {
  const [tab, setTab] = useState(0)
  const [paginaSel, setPagina] = useState(1)
  const [paginaAlertasSel, setPaginaAlertas] = useState(1)
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const { datos: ops, cargando, error, recargar } = useDatos<Ops | null>(cargarOperaciones, null)
  const real = supabaseConfigurado
  const cargandoInicial = real && cargando && !ops

  // Actualización automática cada 60 s
  useEffect(() => {
    if (!real) return
    const t = setInterval(() => { recargar() }, 60000)
    return () => clearInterval(t)
  }, [real, recargar])

  /* ----- Vista calculada de los datos reales ----- */
  const vista = useMemo(() => {
    if (!ops) return null
    const listas: EstudioActivo[][] = [
      ops.activos,
      ops.activos.filter((e) => e.prioridad === 'emergencia'),
      ops.activos.filter((e) => !e.radiologoId),
      ops.activos.filter(vencido),
    ]
    const totalHosp = ops.hospitales.length
    const porEstado = (s: string) => ops.hospitales.filter((h) => h.estado === s).length
    const conEstudios = ops.hospitales.filter((h) => h.estudios > 0)
    const totalAnio = conEstudios.reduce((a, h) => a + h.estudios, 0)
    const provincias = new Map<string, number>()
    for (const h of conEstudios) provincias.set(h.provincia, (provincias.get(h.provincia) ?? 0) + h.estudios)
    const maxMod = Math.max(0, ...ops.tiempo.porModalidad.map((m) => m.min))
    return {
      listas,
      resumen: { total: totalHosp, activos: porEstado('activo'), enProceso: porEstado('en_proceso'), inactivos: porEstado('inactivo') },
      topHospitales: [...conEstudios].sort((a, b) => b.estudios - a.estudios).slice(0, 5),
      topProvincias: [...provincias.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      totalAnio,
      respuesta: ops.tiempo.porModalidad.map((m) => ({
        label: `${MOD_DESCRIPCION[m.mod] ?? m.mod} (${MOD_ETIQUETA[m.mod] ?? m.mod})`, value: m.min, max: maxMod || 1, txt: duracion(m.min),
        obj: `${num(m.n)} informe${m.n === 1 ? '' : 's'}`, color: MOD_COLOR[m.mod] ?? '#2f6bff',
      })),
      hayActividad: [...ops.actividad.recibidos, ...ops.actividad.asignados, ...ops.actividad.informados].some((v) => v > 0),
      maxActividad: Math.max(1, ...ops.actividad.recibidos, ...ops.actividad.asignados, ...ops.actividad.informados),
    }
  }, [ops])

  const conteoTabs = ops ? [ops.conteos.enProceso, ops.conteos.criticos, ops.conteos.sinAsignar, ops.conteos.vencidos] : [0, 0, 0, 0]
  const tabs = real ? TAB_LABELS.map((l, i) => ({ label: l, count: num(conteoTabs[i]) })) : MOCK_TABS
  const listaReal = vista?.listas[tab] ?? []
  const paginasEst = Math.max(1, Math.ceil(listaReal.length / POR_PAGINA))
  const pagina = Math.min(paginaSel, paginasEst)
  const filasReal = listaReal.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const filasMock = real ? [] : MOCK_ESTUDIOS[MOCK_TABS[tab].label] ?? []
  const detalle = ops?.activos.find((e) => e.id === detalleId) ?? null

  const alertasReal = ops?.alertas ?? []
  const paginasAlertas = Math.max(1, Math.ceil(alertasReal.length / POR_PAGINA))
  const paginaAlertas = Math.min(paginaAlertasSel, paginasAlertas)
  const alertasPagina = alertasReal.slice((paginaAlertas - 1) * POR_PAGINA, paginaAlertas * POR_PAGINA)

  const resumen = real
    ? (() => {
      const r = vista?.resumen ?? { total: 0, activos: 0, enProceso: 0, inactivos: 0 }
      return {
        total: num(r.total),
        filas: [
          { n: num(r.activos), l: 'Activos', p: r.total ? pct(r.activos, r.total) : '—', c: 'bg-emerald-600', dot: 'bg-emerald-600' },
          { n: num(r.enProceso), l: 'En proceso', p: r.total ? pct(r.enProceso, r.total) : '—', c: 'bg-amber-500', dot: 'bg-amber-500' },
          { n: num(r.inactivos), l: 'Inactivos', p: r.total ? pct(r.inactivos, r.total) : '—', c: 'bg-red-500', dot: 'bg-red-500' },
        ],
      }
    })()
    : {
      total: MOCK_RESUMEN.total,
      filas: [
        { n: MOCK_RESUMEN.operativos[0], l: 'Operativos', p: MOCK_RESUMEN.operativos[1], c: 'bg-emerald-600', dot: 'bg-emerald-600' },
        { n: MOCK_RESUMEN.incidencias[0], l: 'Con incidencias', p: MOCK_RESUMEN.incidencias[1], c: 'bg-amber-500', dot: 'bg-amber-500' },
        { n: MOCK_RESUMEN.sinConexion[0], l: 'Sin conexión', p: MOCK_RESUMEN.sinConexion[1], c: 'bg-red-500', dot: 'bg-red-500' },
      ],
    }
  const leyendaMock = ['Operativo', 'Con incidencias', 'Sin conexión']

  // LINKConnect según nodos conectados; el resto de sistemas aún no reporta su estado
  const estadoLinkConnect = (() => {
    const n = ops?.nodos
    if (!n || n.total === 0) return null
    return { ok: n.desconectados === 0, texto: `${n.conectados}/${n.total} conectados` }
  })()

  const sinCarga = cargandoInicial ? 'Cargando…' : error && !ops ? 'Sin datos' : null

  return (
    <div>
      <PageHeader
        icon={ShieldPlus}
        title="Centro de Operaciones"
        subtitle="Monitoreo en tiempo real de la red de hospitales, flujo de estudios, tiempos de respuesta y alertas críticas"
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

      {real && error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          No se pudieron cargar los datos de operaciones: {error}
          <button onClick={recargar} className="ml-2 font-semibold text-brand-600 hover:underline">Reintentar</button>
        </div>
      )}

      {/* KPIs */}
      {real ? (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <Kpi icon={CalendarDays} tone="blue" value={sinCarga ?? num(ops?.conteos.hoy ?? 0)} label="Estudios de hoy" sub="Recibidos desde las 00:00" />
          <Kpi icon={FileText} tone="blue" value={sinCarga ?? num(ops?.conteos.enProceso ?? 0)} label="Estudios en proceso" sub="Pendientes de informe" />
          <Kpi icon={AlertTriangle} tone="red" value={sinCarga ?? num(ops?.conteos.criticos ?? 0)} label="Estudios críticos" sub="Emergencias sin informar" />
          <Kpi icon={UserX} tone="orange" value={sinCarga ?? num(ops?.conteos.sinAsignar ?? 0)} label="Sin asignar" sub="Sin radiólogo asignado" />
          <Kpi icon={Timer} tone="red" value={sinCarga ?? num(ops?.conteos.vencidos ?? 0)} label="Estudios vencidos" sub="Fuera del plazo de entrega" />
          <Kpi icon={Clock} tone="blue" value={sinCarga ?? duracion(ops?.tiempo.promedioMin ?? null)} label="Tiempo promedio de reporte"
            sub={ops?.tiempo.informes ? `Últimos 30 días · ${num(ops.tiempo.informes)} informes` : 'Sin informes en 30 días'} />
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Kpi icon={Hospital} tone="blue" value="128" label="Hospitales conectados" sub="6 nuevos este mes" trend="up" />
          <Kpi icon={FileText} tone="blue" value="2,148" label="Estudios en proceso" sub="18% vs. ayer" trend="down" />
          <Kpi icon={AlertTriangle} tone="red" value="24" label="Estudios críticos" sub="11 sin acuse (≤ 15 min)" trend="up" trendTone="bad" />
          <Kpi icon={Clock} tone="blue" value="1 h 26 min" label="Tiempo promedio de reporte" sub="22% vs. mes anterior" trend="down" />
          <Kpi icon={UserRound} tone="blue" value="142" label="Radiólogos activos" sub="78% de disponibilidad" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
        {/* Mapa */}
        <Panel className="lg:col-span-2 xl:col-span-7" title="Mapa de hospitales y estado en tiempo real" icon={Building2}
          action={<button className="link-more rounded-md border border-brand-200 px-2 py-1"><MapIcon size={14} /> Ver todos los hospitales <ArrowRight size={13} /></button>}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_170px]">
            <div className="relative min-h-[260px] overflow-hidden rounded-lg bg-[#f5f8fd]">
              <img src="/img/crops/mapa-operaciones.webp" alt="Mapa de hospitales"
                className="h-full w-full object-contain transition-transform" style={{ transform: `scale(${zoom})` }} />
              <div className="absolute left-2 top-2 flex flex-col overflow-hidden rounded-md border border-[#d7e1f2] bg-white">
                <button className="p-1.5 hover:bg-brand-50" onClick={() => setZoom(Math.min(2, zoom + 0.2))} aria-label="Acercar"><Plus size={15} /></button>
                <button className="border-t border-[#d7e1f2] p-1.5 hover:bg-brand-50" onClick={() => setZoom(Math.max(1, zoom - 0.2))} aria-label="Alejar"><Minus size={15} /></button>
              </div>
              <ul className="absolute right-2 top-2 space-y-1 rounded-md bg-white/90 px-2.5 py-2 text-[12px] text-ink shadow-sm">
                {resumen.filas.map((s, i) => (
                  <li key={s.l} className="flex items-center gap-2"><span className={clsx('h-2.5 w-2.5 rounded-full', s.dot)} />{real ? s.l : leyendaMock[i]} ({s.n})</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-[#e6edf8] p-3">
              <div className="text-[20px] font-bold leading-tight text-ink">{resumen.total}</div>
              <div className="mb-3 text-[12px] text-ink/80">Total hospitales</div>
              {resumen.filas.map((s) => (
                <div key={s.l} className="flex gap-2.5 border-t border-[#eef2f8] py-2.5">
                  <span className={clsx('mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white', s.c)}><Hospital size={11} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[17px] font-bold leading-tight text-ink">{s.n}</div>
                    <div className="flex justify-between gap-1 text-[11.5px] text-ink/80"><span>{s.l}</span><span>{s.p}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Estudios en tiempo real */}
        <Panel className="lg:col-span-2 xl:col-span-5" title="Estudios en tiempo real" icon={LayoutGrid} bodyClass="!px-0 !pb-0"
          action={<span className="flex items-center gap-1.5 text-[11.5px] text-slate-500"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />{real ? 'Actualización: cada 60 s' : 'Actualización: en tiempo real'}</span>}>
          <div className="px-4">
            <div className="scroll-soft flex gap-1 overflow-x-auto border-b border-[#e6edf8]">
              {tabs.map((t, i) => (
                <button key={t.label} onClick={() => { setTab(i); setPagina(1) }}
                  className={clsx('-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-[12.5px] font-medium',
                    i === tab ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-600 hover:text-brand-700')}>
                  {t.label}
                  <span className={clsx('rounded-md px-1.5 text-[11.5px] font-semibold', i === 0 ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600')}>{t.count}</span>
                </button>
              ))}
            </div>
          </div>
          <Table className="px-2">
            <thead>
              <tr>
                {['#', 'Hora', 'Paciente', 'Hospital', 'Modalidad', 'Estado', 'Tiempo', 'Acciones'].map((h) => <th key={h} className="th">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {real ? (
                <>
                  <FilaEstado colSpan={8} cargando={cargandoInicial} error={ops ? '' : error} recargar={recargar} />
                  {filasReal.map((e, i) => (
                    <tr key={e.id} className={clsx('tr cursor-pointer', detalleId === e.id && 'bg-brand-50/60')} onClick={() => setDetalleId(e.id)}>
                      <td className="td whitespace-nowrap"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: colorPunto(e) }} />{(pagina - 1) * POR_PAGINA + i + 1}</td>
                      <td className="td whitespace-nowrap">{hora(e.recibido)}</td>
                      <td className="td whitespace-nowrap text-ink">{e.paciente}</td>
                      <td className="td" title={e.hospitalNombre}>{e.hospital}</td>
                      <td className="td"><Badge tone="blue" dot={false} className="border border-brand-100 bg-white">{MOD_ETIQUETA[e.modalidad] ?? e.modalidad}</Badge></td>
                      <td className="td">
                        {tab === 3 || (tab === 0 && vencido(e)) ? <Badge tone="red">Vencido</Badge>
                          : tab === 1 ? <Badge tone="red">Emergencia</Badge>
                            : tab === 2 ? <Badge tone="gray">Sin asignar</Badge>
                              : <Badge tone={TONO_ESTADO[e.estado] ?? 'gray'} icon={e.estado === 'en_lectura'}>{ESTADO_ESTUDIO[e.estado] ?? e.estado}</Badge>}
                      </td>
                      <td className="td whitespace-nowrap">{desde(e.recibido)}</td>
                      <td className="td" onClick={(ev) => ev.stopPropagation()}><DotsButton onClick={() => setDetalleId(e.id)} /></td>
                    </tr>
                  ))}
                  {!cargandoInicial && !(error && !ops) && filasReal.length === 0 && <FilaVacia colSpan={8} texto="No hay estudios en esta categoría" />}
                </>
              ) : (
                filasMock.map((r, i) => (
                  <tr key={r.paciente + i} className="tr">
                    <td className="td whitespace-nowrap"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: r.dot }} />{i + 1}</td>
                    <td className="td whitespace-nowrap">{r.hora}</td>
                    <td className="td whitespace-nowrap text-ink">{r.paciente}</td>
                    <td className="td">{r.hospital}</td>
                    <td className="td"><Badge tone="blue" dot={false} className="border border-brand-100 bg-white">{r.mod}</Badge></td>
                    <td className="td"><Badge tone={r.tone} icon={r.tone === 'green'}>{r.estado}</Badge></td>
                    <td className="td whitespace-nowrap">{r.tiempo}</td>
                    <td className="td"><DotsButton /></td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
          {real ? (
            listaReal.length > POR_PAGINA && (
              <Pagination text={`Mostrando ${(pagina - 1) * POR_PAGINA + 1}-${Math.min(pagina * POR_PAGINA, listaReal.length)} de ${num(listaReal.length)}`}
                page={pagina} onPage={setPagina} totalPages={paginasEst} perPage={false} />
            )
          ) : (
            <div className="flex justify-end px-4 py-3"><MoreLink boxed>Ver todos los estudios</MoreLink></div>
          )}
        </Panel>

        {/* Estado de sistemas */}
        <Panel className="xl:col-span-4" title="Estado de los sistemas" icon={Server} action={<MoreLink boxed />}>
          <ul className="divide-y divide-[#eef2f8]">
            {sistemas.map((s) => {
              const lc = real && s.name === 'LINKConnect' ? estadoLinkConnect : null
              return (
                <li key={s.name} className="flex items-center gap-3 py-1.5 text-[12.5px]">
                  <span className={clsx('flex h-5 w-5 items-center justify-center rounded',
                    real ? (lc ? (lc.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500') : 'bg-slate-100 text-slate-400')
                      : s.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500')}><s.icon size={12} /></span>
                  <span className="flex-1 text-ink">{s.name}{lc && <span className="ml-1.5 text-[11px] text-slate-500">({lc.texto})</span>}</span>
                  <span className="w-[140px]">
                    {real
                      ? lc ? (lc.ok ? <Badge tone="green" icon>Operativo</Badge> : <Badge tone="orange">Con incidencias</Badge>) : <Badge tone="gray">Sin datos</Badge>
                      : s.ok ? <Badge tone="green" icon>Operativo</Badge> : <Badge tone="orange">Con incidencias</Badge>}
                  </span>
                </li>
              )
            })}
          </ul>
        </Panel>

        {/* Tiempo de respuesta */}
        <Panel className="xl:col-span-4" title="Tiempo de respuesta por modalidad" icon={Clock} action={<MoreLink boxed />}
          subtitle={real ? 'Recepción a firma del informe · últimos 30 días' : undefined}>
          {real && !vista?.respuesta.length ? <SinDatos texto={cargandoInicial ? 'Cargando…' : 'Sin datos para mostrar'} /> : (
            <ul className="space-y-3.5 pt-1">
              {(real ? vista?.respuesta ?? [] : MOCK_RESPUESTA).map((r) => (
                <li key={r.label} className="grid grid-cols-[110px_1fr_70px_auto] items-center gap-2 text-[12.5px]">
                  <span className="truncate text-ink" title={r.label}>{r.label}</span>
                  <Bar value={r.value} max={r.max} color={r.color} height={14} />
                  <span className="font-bold text-ink">{r.txt}</span>
                  <span className="whitespace-nowrap text-[11px] text-slate-500">{r.obj}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Actividad por hora */}
        <Panel className="lg:col-span-2 xl:col-span-4" title="Actividad por hora (últimas 24 horas)" icon={BarChart3} action={<MoreLink boxed />}>
          {real ? (
            <>
              <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#2f6bff]" />Estudios recibidos</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />Estudios asignados</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#22b07d]" />Informes emitidos</span>
              </div>
              {ops && vista?.hayActividad ? (
                <Bars
                  labels={ops.actividad.labels.map((h, i) => (i % 2 === 0 ? h : ''))}
                  height={150}
                  max={Math.ceil(vista.maxActividad * 1.15)}
                  yTicks={3}
                  barWidth={0.8}
                  series={[
                    { name: 'Estudios recibidos', color: '#2f6bff', values: ops.actividad.recibidos },
                    { name: 'Estudios asignados', color: '#f59e0b', values: ops.actividad.asignados },
                    { name: 'Informes emitidos', color: '#22b07d', values: ops.actividad.informados },
                  ]}
                />
              ) : <SinDatos texto={cargandoInicial ? 'Cargando…' : 'Sin datos para mostrar'} />}
            </>
          ) : (
            <>
              <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#2f6bff]" />Estudios recibidos</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#22b07d]" />Informes completados</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />Críticos</span>
              </div>
              <Bars
                labels={horas.map((h, i) => (i % 2 === 0 ? h : ''))}
                height={150}
                max={300}
                yTicks={3}
                barWidth={0.8}
                series={[
                  { name: 'Estudios recibidos', color: '#2f6bff', values: recibidos },
                  { name: 'Informes completados', color: '#22b07d', values: completados },
                  { name: 'Críticos', color: '#ef4444', values: criticos },
                ]}
              />
            </>
          )}
        </Panel>

        {/* Top hospitales */}
        <Panel className="lg:col-span-2 xl:col-span-5" title="Top 5 hospitales por volumen de estudios" icon={Building2} action={<MoreLink boxed />} bodyClass="!px-2">
          <Table>
            <thead><tr className="bg-[#f5f8fd]">{['#', 'Hospital', 'Estudios (año)', 'Promedio/día', 'Estado'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {real ? (
                <>
                  <FilaEstado colSpan={5} cargando={cargandoInicial} error={ops ? '' : error} recargar={recargar} />
                  {(vista?.topHospitales ?? []).map((h, i) => (
                    <tr key={h.id} className="tr">
                      <td className="td py-1.5">{i + 1}</td>
                      <td className="td whitespace-nowrap py-1.5 text-ink">{h.etiqueta}</td>
                      <td className="td py-1.5 tabular-nums text-ink">{num(h.estudios)}</td>
                      <td className="td py-1.5 tabular-nums text-ink">{(h.estudios / (ops?.diasAnio ?? 1)).toFixed(1)}</td>
                      <td className="td py-1.5">{(() => { const s = ESTADO_HOSP[h.estado] ?? { l: h.estado, tone: 'gray' as Tone }; return <Badge tone={s.tone} icon={s.tone === 'green'}>{s.l}</Badge> })()}</td>
                    </tr>
                  ))}
                  {vista && vista.topHospitales.length === 0 && <FilaVacia colSpan={5} texto="Aún no hay hospitales con estudios este año" />}
                </>
              ) : MOCK_TOP_HOSPITALES.map((h, i) => (
                <tr key={h[0]} className="tr">
                  <td className="td py-1.5">{i + 1}</td>
                  <td className="td whitespace-nowrap py-1.5 text-ink">{h[0]}</td>
                  <td className="td py-1.5 tabular-nums text-ink">{h[1]}</td>
                  <td className="td py-1.5 tabular-nums text-ink">{h[2]}</td>
                  <td className="td py-1.5">{h[3] ? <Badge tone="green" icon>Operativo</Badge> : <Badge tone="orange">Con incidencias</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>

        {/* Top provincias */}
        <Panel className="xl:col-span-3" title="Top 5 provincias por estudios" icon={MapIcon} action={<MoreLink boxed />} bodyClass="!px-2">
          <Table>
            <thead><tr className="bg-[#f5f8fd]">{['#', 'Provincia', 'Estudios (año)', '% del total'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {real ? (
                <>
                  <FilaEstado colSpan={4} cargando={cargandoInicial} error={ops ? '' : error} recargar={recargar} />
                  {(vista?.topProvincias ?? []).map(([p, n], i) => (
                    <tr key={p} className="tr">
                      <td className="td py-1.5">{i + 1}</td>
                      <td className="td whitespace-nowrap py-1.5 text-ink">{p}</td>
                      <td className="td py-1.5 text-right tabular-nums text-ink">{num(n)}</td>
                      <td className="td py-1.5 text-right tabular-nums text-ink">{pct(n, vista?.totalAnio ?? 0)}</td>
                    </tr>
                  ))}
                  {vista && vista.topProvincias.length === 0 && <FilaVacia colSpan={4} texto="Aún no hay estudios por provincia este año" />}
                </>
              ) : MOCK_TOP_PROVINCIAS.map((p, i) => (
                <tr key={p[0]} className="tr">
                  <td className="td py-1.5">{i + 1}</td>
                  <td className="td whitespace-nowrap py-1.5 text-ink">{p[0]}</td>
                  <td className="td py-1.5 text-right tabular-nums text-ink">{p[1]}</td>
                  <td className="td py-1.5 text-right tabular-nums text-ink">{p[2]}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>

        {/* Alertas */}
        <Panel className="xl:col-span-4" title="Alertas y notificaciones" icon={Bell} action={<MoreLink boxed />} bodyClass="!px-2">
          <Table>
            <thead><tr>{['Hora', 'Tipo', 'Mensaje'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {real ? (
                <>
                  <FilaEstado colSpan={3} cargando={cargandoInicial} error={ops ? '' : error} recargar={recargar} />
                  {alertasPagina.map((a) => {
                    const t = ALERTA[a.tipo] ?? { l: a.tipo, tone: 'gray' as Tone }
                    const extra = [a.estudio, a.hospital].filter(Boolean).join(' - ')
                    return (
                      <tr key={a.id} className="tr">
                        <td className="td whitespace-nowrap py-1.5">{hora(a.fecha)}</td>
                        <td className="td py-1.5"><Badge tone={t.tone}>{t.l}</Badge></td>
                        <td className={clsx('td py-1.5', t.tone === 'red' ? 'text-red-600' : t.tone === 'orange' ? 'text-orange-600' : 'text-brand-700')}>
                          {a.mensaje}{extra && <span className="text-slate-500"> · {extra}</span>}
                        </td>
                      </tr>
                    )
                  })}
                  {ops && alertasReal.length === 0 && <FilaVacia colSpan={3} texto="No hay alertas sin resolver" />}
                </>
              ) : MOCK_ALERTAS.map((a) => (
                <tr key={a.hora} className="tr">
                  <td className="td whitespace-nowrap py-1.5">{a.hora}</td>
                  <td className="td py-1.5"><Badge tone={a.tone}>{a.tipo}</Badge></td>
                  <td className={clsx('td py-1.5', a.tone === 'red' ? 'text-red-600' : a.tone === 'orange' ? 'text-orange-600' : 'text-brand-700')}>{a.msg}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          {real && alertasReal.length > POR_PAGINA && (
            <Pagination text={`${num(alertasReal.length)} alertas sin resolver`} page={paginaAlertas} onPage={setPaginaAlertas} totalPages={paginasAlertas} perPage={false} />
          )}
        </Panel>
      </div>

      <DetalleEstudio e={detalle} onClose={() => setDetalleId(null)} />
    </div>
  )
}
