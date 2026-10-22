import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowDownToLine, ArrowUpFromLine, BarChart3, Building2, CalendarDays, Check, ChevronDown, ChevronLeft,
  ChevronRight, Clock, CloudUpload, Gauge as GaugeIcon, Info, Link2, Network, RefreshCw, Search, Server, Settings, ShieldCheck,
  TriangleAlert, Unplug, X, type LucideIcon,
} from 'lucide-react'
import { Badge, DotsButton, IconCircle, InfoRow, Kpi, MoreLink, PageHeader, Pagination, Panel, Table, clsx, type Tone } from '../../components/ui'
import { Gauge, Lines } from '../../components/charts'
import { fFechaHora, pct, supabaseConfigurado, useDatos } from '../../lib/admin-data'
import { supabase } from '../../lib/supabase'

const POR_PAGINA = 10
const DIAS = 30

/* ---------------- Tipos ---------------- */
type Estado = 'Conectado' | 'En sincronización' | 'Desconectado'
const estadoTone: Record<Estado, Tone> = { Conectado: 'green', 'En sincronización': 'orange', Desconectado: 'red' }
const ESTADO_DB: Record<string, Estado> = { conectado: 'Conectado', sincronizando: 'En sincronización', desconectado: 'Desconectado' }

type LC = {
  /** Código en el demo; uuid del nodo con datos reales */
  id: string
  hospital: string; hospitalId: string; codigo: string; ubicacion: string; estado: Estado; conexion: string; velocidad: number | null
  marca: string; modelo: string; serial: string; ram: string; cpu: string; disco: string; so: string; version: string
  host: string; ip: string; puerto: string; aet: string; hl7: boolean
  /** CPU/RAM/Disco: no existen en la base (null con datos reales) */
  uso: [number, number, number] | null
  bajada: number | null; subida: number | null
}

/* ---------------- Datos mock ---------------- */
const mk = (i: number, hospital: string, ubicacion: string, estado: Estado, conexion: string, velocidad: number, uso: [number, number, number], marca = 'Dell', modelo = 'PowerEdge R740'): LC => {
  const code = `H-${String(i).padStart(3, '0')}`
  return {
    id: code, hospital, hospitalId: code, codigo: code, ubicacion, estado, conexion, velocidad, marca, modelo,
    serial: ['5Y3F2K1', '7H2K9L3', '3M8P1Q7', '9D4R6T2', '2B7N5V8', '6C1X3Z9', '8F5G2H4', '4J9K7L1', '1P6Q3R8', '5S2T9U4'][i - 1],
    ram: i % 3 === 0 ? '64 GB' : '128 GB', cpu: 'Intel Xeon Silver 4210 (10 núcleos)', disco: '2 x 1.92 TB SSD (RAID 1)',
    so: 'Ubuntu Server 22.04 LTS', version: i === 5 ? 'v2.7.9' : 'v2.8.1', host: i === 1 ? 'hphm-linkconnect' : `${code.toLowerCase().replace('-', '')}-linkconnect`,
    ip: `192.168.10.${14 + i}`, puerto: '104', aet: i === 1 ? 'HPHM_LC' : `${code.replace('-', '')}_LC`, hl7: estado !== 'Desconectado', uso,
    bajada: velocidad === 0 ? 0 : Math.round(velocidad * 2.5), subida: velocidad === 0 ? 0 : Math.round(velocidad * 2.5) - 1,
  }
}

const MOCK_LINKS: LC[] = [
  mk(1, 'Hospital Pediátrico Hugo Mendoza', 'Santo Domingo, DN', 'Conectado', '12/03/2025 10:24', 98, [18, 42, 31]),
  mk(2, 'Hospital Dr. Marcelino Vélez', 'Santo Domingo, DN', 'Conectado', '12/03/2025 10:22', 78, [24, 51, 44]),
  mk(3, 'Hospital Padre Billini', 'Santo Domingo, DN', 'Conectado', '12/03/2025 10:20', 65, [12, 38, 27], 'HPE', 'ProLiant DL380 Gen10'),
  mk(4, 'Hospital Dr. Francisco Moscoso Puello', 'Santo Domingo, DN', 'Conectado', '12/03/2025 10:18', 72, [31, 47, 52]),
  mk(5, 'Hospital Traumatológico Ney Arias Lora', 'Santo Domingo Norte', 'En sincronización', '12/03/2025 10:15', 54, [67, 72, 58]),
  mk(6, 'Hospital Juan Pablo Pina', 'San Cristóbal', 'Conectado', '12/03/2025 10:12', 63, [21, 40, 36], 'Lenovo', 'ThinkSystem SR650'),
  mk(7, 'Hospital Regional Taiwán 19 de Marzo', 'Azua', 'Conectado', '12/03/2025 10:10', 49, [15, 33, 29]),
  mk(8, 'Hospital Regional San Juan de la Maguana', 'San Juan', 'Desconectado', '12/03/2025 09:42', 0, [0, 0, 41]),
  mk(9, 'Hospital Dr. Alejandro Cabral', 'San Juan', 'Conectado', '12/03/2025 10:08', 58, [19, 36, 22], 'HPE', 'ProLiant DL360 Gen10'),
  mk(10, 'Hospital Regional Antonio Musa', 'San Pedro de Macoris', 'Conectado', '12/03/2025 10:06', 67, [14, 30, 18]),
]

const ACTION_ICONS: LucideIcon[] = [RefreshCw, BarChart3, ShieldCheck, BarChart3, RefreshCw, BarChart3, BarChart3, BarChart3, RefreshCw, BarChart3]

type Alerta = { k: string; icon: LucideIcon; tone: Tone; t: string; s?: string; d: string }
const MOCK_ALERTAS: Alerta[] = [
  { k: '1', icon: AlertTriangle, tone: 'red', t: 'Error de conexión', s: 'Hospital Regional San Juan de la Maguana', d: '12/03/2025 09:42' },
  { k: '2', icon: TriangleAlert, tone: 'orange', t: 'Retraso en sincronización', s: 'Hospital Traumatológico Ney Arias Lora', d: '12/03/2025 08:15' },
  { k: '3', icon: Info, tone: 'blue', t: 'Reinicio del servicio LINKConnect', d: '11/03/2025 22:30' },
  { k: '4', icon: ShieldCheck, tone: 'green', t: 'Actualización de seguridad aplicada', d: '10/03/2025 16:20' },
  { k: '5', icon: Info, tone: 'blue', t: 'Alta de nuevo hospital', s: 'Hospital Regional Antonio Musa', d: '10/03/2025 11:45' },
]
const ALERTA_TIPO: Record<string, { icon: LucideIcon; tone: Tone }> = {
  critico: { icon: AlertTriangle, tone: 'red' }, incidencia: { icon: TriangleAlert, tone: 'orange' }, sla: { icon: Clock, tone: 'orange' },
  sistema: { icon: Info, tone: 'blue' }, info: { icon: Info, tone: 'blue' },
}

type Mov = { k: string; f: string; h: string; e: string; st: 'Exitoso' | 'Fallido' | 'Reenviado' }
const MOCK_MOVIMIENTOS: Mov[] = [
  { k: '1', f: '12/03/2025 10:24', h: 'H-001', e: 'Envío de estudio', st: 'Exitoso' },
  { k: '2', f: '12/03/2025 10:18', h: 'H-004', e: 'Recepción de estudio', st: 'Exitoso' },
  { k: '3', f: '12/03/2025 09:42', h: 'H-008', e: 'Error de transmisión', st: 'Fallido' },
  { k: '4', f: '12/03/2025 08:15', h: 'H-005', e: 'Reenvío de estudio', st: 'Reenviado' },
  { k: '5', f: '12/03/2025 07:32', h: 'H-002', e: 'Envío de estudio', st: 'Exitoso' },
]
const movStyle: Record<Mov['st'], { tone: Tone; icon: LucideIcon }> = {
  Exitoso: { tone: 'green', icon: Check }, Fallido: { tone: 'red', icon: X }, Reenviado: { tone: 'blue', icon: RefreshCw },
}
const EVENTO_TXT: Record<string, string> = {
  envio_estudio: 'Envío de estudio', recepcion: 'Recepción de estudio', recepcion_estudio: 'Recepción de estudio',
  error_transmision: 'Error de transmisión', reenvio: 'Reenvío de estudio', reenvio_estudio: 'Reenvío de estudio',
}
const eventoTxt = (e: string) => EVENTO_TXT[e] ?? (e.charAt(0).toUpperCase() + e.slice(1)).replace(/_/g, ' ')
const esReenvio = (e: string) => e.startsWith('reenvio')
const estadoMov = (e: { evento: string; exitoso: boolean }): Mov['st'] => (!e.exitoso ? 'Fallido' : esReenvio(e.evento) ? 'Reenviado' : 'Exitoso')

const dias = Array.from({ length: 31 }, (_, i) => i)
const wave = (base: number, amp: number, seed: number) => dias.map((d) => Math.round(base + amp * Math.sin(d / 2.3 + seed) + amp * 0.6 * Math.cos(d / 1.3 + seed * 2)))
const enviados = wave(1050, 230, 0.4)
const fallidos = wave(70, 30, 1.7)
const reenviados = wave(45, 20, 2.6)

const MOCK_CONFIG: [string, ReactNode][] = [
  ['Protocolo de integración', 'DICOM / HL7'],
  ['Repositorio Nacional', 'Activo (https://repo.sns.gob.do)'],
  ['Nombre Host (DICOM)', 'hphm-linkconnect'],
  ['IP Address (DICOM)', '192.168.10.15'],
  ['Puerto (DICOM)', '104'],
  ['AETitle (DICOM)', 'HPHM_LC'],
  ['Integración HL7', <Badge key="hl7" tone="green" dot={false}>Activo</Badge>],
  ['Integración XRoad', <span key="xr" className="font-medium text-red-500">No</span>],
  ['Tiempo de espera (timeout)', '60 seg'],
  ['Reintentos automáticos', '3'],
  ['Horario de operación', '24/7'],
  ['Servidor de respaldo', <Badge key="bk" tone="green" dot={false}>Activo</Badge>],
  ['Certificado SSL', 'Válido (hasta 01/2026)'],
]
const CONFIG_VACIA: [string, ReactNode][] = [
  ['Protocolo de integración', 'DICOM / HL7'],
  ['Repositorio Nacional', '—'],
  ['Nombre Host (DICOM)', '—'],
  ['IP Address (DICOM)', '—'],
  ['Puerto (DICOM)', '—'],
  ['AETitle (DICOM)', '—'],
  ['Integración HL7', '—'],
  ['Integración XRoad', '—'],
  ['Tiempo de espera (timeout)', '—'],
  ['Reintentos automáticos', '—'],
  ['Horario de operación', '—'],
  ['Servidor de respaldo', '—'],
  ['Certificado SSL', '—'],
]
const config = supabaseConfigurado ? CONFIG_VACIA : MOCK_CONFIG

/* ---------------- Consultas (datos reales) ---------------- */
type Evento = { id: number; nodo: string; evento: string; exitoso: boolean; fecha: string }
type DatosLC = { nodos: LC[]; eventos: Evento[]; recientes: Evento[] }

const DEMO: DatosLC = { nodos: MOCK_LINKS, eventos: [], recientes: [] }
const SIN_DATOS: DatosLC = { nodos: [], eventos: [], recientes: [] }
const t = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v))
const inicioVentana = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (DIAS - 1)); return d }

async function fetchLinkConnect(): Promise<DatosLC> {
  const [n, ev, rec] = await Promise.all([
    supabase.from('linkconnect_nodos')
      .select('id, hospital_id, marca, modelo, serial, memoria_ram, procesador, almacenamiento, sistema_operativo, version, host_dicom, ip_dicom, puerto_dicom, aetitle, integracion_hl7, velocidad_mbps, estado, ultima_conexion, created_at, hospitales(codigo, nombre, municipio, provincias(nombre))')
      .order('created_at'),
    supabase.from('linkconnect_eventos').select('id, nodo_id, evento, exitoso, created_at')
      .gte('created_at', inicioVentana().toISOString()).order('created_at'),
    supabase.from('linkconnect_eventos').select('id, nodo_id, evento, exitoso, created_at')
      .order('created_at', { ascending: false }).limit(5),
  ])
  for (const r of [n, ev, rec]) if (r.error) throw new Error(r.error.message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aEvento = (e: any): Evento => ({ id: e.id, nodo: e.nodo_id, evento: e.evento, exitoso: e.exitoso, fecha: e.created_at })
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodos: (n.data as any[]).map((x) => {
      const h = x.hospitales
      return {
        id: x.id, hospital: h?.nombre ?? '—', hospitalId: x.hospital_id, codigo: h?.codigo ?? '—',
        ubicacion: [h?.municipio, h?.provincias?.nombre].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ') || '—',
        estado: ESTADO_DB[x.estado] ?? 'Desconectado', conexion: fFechaHora(x.ultima_conexion),
        velocidad: x.velocidad_mbps != null ? Number(x.velocidad_mbps) : null,
        marca: t(x.marca), modelo: t(x.modelo), serial: t(x.serial), ram: t(x.memoria_ram), cpu: t(x.procesador), disco: t(x.almacenamiento),
        so: t(x.sistema_operativo), version: t(x.version), host: t(x.host_dicom), ip: t(x.ip_dicom), puerto: t(x.puerto_dicom), aet: t(x.aetitle),
        hl7: !!x.integracion_hl7, uso: null, bajada: null, subida: null,
      }
    }),
    eventos: (ev.data ?? []).map(aEvento),
    recientes: (rec.data ?? []).map(aEvento),
  }
}

async function fetchAlertasHospital(hospitalId: string): Promise<Alerta[]> {
  if (!hospitalId) return []
  const { data, error } = await supabase.from('alertas').select('id, tipo, mensaje, resuelta, created_at')
    .eq('hospital_id', hospitalId).order('created_at', { ascending: false }).limit(5)
  if (error) throw new Error(error.message)
  return (data as { id: string; tipo: string; mensaje: string; resuelta: boolean; created_at: string }[]).map((a) => ({
    k: a.id, ...(ALERTA_TIPO[a.tipo] ?? ALERTA_TIPO.info), t: a.mensaje, s: a.resuelta ? 'Resuelta' : undefined, d: fFechaHora(a.created_at),
  }))
}

function SinDatos({ texto = 'Sin datos para mostrar', className }: { texto?: string; className?: string }) {
  return <div className={clsx('flex min-h-[120px] items-center justify-center text-center text-[12.5px] text-slate-400', className)}>{texto}</div>
}

/** Medidor sin dato (CPU/RAM/Disco no se reportan a la base) */
function GaugeVacio({ label, size = 72 }: { label: string; size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}><circle cx={size / 2} cy={size / 2} r={size / 2 - 6} fill="none" stroke="#e8eef8" strokeWidth={6} /></svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
        <span className="text-[9px] font-semibold text-slate-500">{label}</span>
        <span className="text-[14px] font-bold text-slate-400">—</span>
      </div>
    </div>
  )
}

const ddmm = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`

/* ---------------- Página ---------------- */
export default function LinkConnect() {
  const navigate = useNavigate()
  const { datos, cargando, error, recargar, real } = useDatos(fetchLinkConnect, supabaseConfigurado ? SIN_DATOS : DEMO)
  const LINKS = datos.nodos
  const [sel, setSel] = useState(MOCK_LINKS[0].id)
  const [q, setQ] = useState('')
  const [fEstado, setFEstado] = useState('Todos')
  const [page, setPage] = useState(1)
  const lc: LC | undefined = LINKS.find((l) => l.id === sel) ?? LINKS[0]
  const rows = LINKS.map((l, i) => ({ l, i })).filter(({ l }) => (l.hospital + l.codigo + l.ubicacion).toLowerCase().includes(q.toLowerCase())
    && (fEstado === 'Todos' || l.estado === fEstado))
  const totalPages = Math.max(1, Math.ceil(rows.length / POR_PAGINA))
  const pagina = Math.min(page, totalPages)
  const visibles = real ? rows.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA) : rows
  const online = lc ? lc.estado !== 'Desconectado' : false

  // Últimas alertas del hospital del nodo seleccionado
  const hid = real ? lc?.hospitalId ?? '' : ''
  const al = useDatos(() => fetchAlertasHospital(hid), MOCK_ALERTAS, [hid])
  const alertas = al.datos

  /* ---- Indicadores, movimientos y transmisión (datos reales) ---- */
  const calc = useMemo(() => {
    const conFallos = new Set(datos.eventos.filter((e) => !e.exitoso).map((e) => e.nodo))
    const vels = LINKS.map((l) => l.velocidad).filter((v): v is number => v !== null)
    const codigoDe = new Map(LINKS.map((l) => [l.id, l.codigo]))
    const ini = inicioVentana()
    const dias30 = Array.from({ length: DIAS }, (_, i) => new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i))
    const serie = { env: Array(DIAS).fill(0) as number[], fal: Array(DIAS).fill(0) as number[], ree: Array(DIAS).fill(0) as number[] }
    for (const e of datos.eventos) {
      const d = new Date(e.fecha)
      const i = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - ini.getTime()) / 86400000)
      if (i < 0 || i >= DIAS) continue
      const st = estadoMov(e)
      if (st === 'Fallido') serie.fal[i]++
      else if (st === 'Reenviado') serie.ree[i]++
      else serie.env[i]++
    }
    return {
      conectados: LINKS.filter((l) => l.estado === 'Conectado').length,
      desconectados: LINKS.filter((l) => l.estado === 'Desconectado').length,
      incidencias: LINKS.filter((l) => l.estado === 'En sincronización' || conFallos.has(l.id)).length,
      velocidad: vels.length ? Math.round(vels.reduce((a, b) => a + b, 0) / vels.length) : null,
      movimientos: datos.recientes.map((e): Mov => ({ k: String(e.id), f: fFechaHora(e.fecha), h: codigoDe.get(e.nodo) ?? '—', e: eventoTxt(e.evento), st: estadoMov(e) })),
      serie, hayEventos: datos.eventos.length > 0,
      etiquetas: [0, 5, 10, 15, 20, 25, DIAS - 1].map((i) => ddmm(dias30[i])),
    }
  }, [datos, LINKS])
  const movimientos = real ? calc.movimientos : MOCK_MOVIMIENTOS
  const kv = (v: ReactNode) => (cargando ? '…' : v)

  return (
    <div>
      <PageHeader
        icon={Server}
        breadcrumb={
          <span className="flex items-center gap-1.5">
            <ChevronLeft size={13} />
            <button onClick={() => navigate('/admin/linkconnect')} className="text-brand-600 hover:underline">LINKConnect</button>
            <ChevronRight size={13} /> Interoperabilidad
          </span>
        }
        title="LINKConnect e Interoperabilidad"
        subtitle="Gestión de conexiones, recepción y envío de estudios al Repositorio Nacional"
        actions={
          <button className="flex items-center gap-3 rounded-lg border border-[#d7e1f2] bg-white px-3.5 py-2.5 text-[13px] text-ink shadow-sm hover:border-brand-400">
            <CalendarDays size={17} className="text-brand-600" /> {real ? `Últimos ${DIAS} días` : '01/03/2025 - 31/03/2025'} <ChevronDown size={15} />
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {real ? (
          <>
            <Kpi icon={Server} tone="blue" value={kv(LINKS.length)} label="LINKConnect instalados" sub="Registrados en la red" />
            <Kpi icon={Link2} tone="green" value={kv(calc.conectados)} label="Conectados" sub={`${pct(calc.conectados, LINKS.length)} de los instalados`} />
            <Kpi icon={AlertTriangle} tone="orange" value={kv(calc.incidencias)} label="Con incidencias" sub={`En sincronización o con fallos (${DIAS} días)`} />
            <Kpi icon={Unplug} tone="red" value={kv(calc.desconectados)} label="Desconectados" sub={`${pct(calc.desconectados, LINKS.length)} de los instalados`} />
            <Kpi icon={GaugeIcon} tone="teal" value={kv(calc.velocidad === null ? '—' : `${calc.velocidad} Mbps`)} label="Velocidad promedio" sub={calc.velocidad === null ? 'Sin velocidades registradas' : 'de Internet en los nodos'} />
          </>
        ) : (
          <>
            <Kpi icon={Link2} tone="blue" value={<span className="flex items-center gap-2">12 <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">100%</span></span>} label="Hospitales conectados" sub="de 12 registrados" />
            <Kpi icon={CloudUpload} tone="blue" value="8,432" label="Estudios enviados" sub="12% vs. mes anterior" trend="up" />
            <Kpi icon={AlertTriangle} tone="red" value="214" label="Estudios fallidos" sub="-32% vs. mes anterior" trend="down" />
            <Kpi icon={RefreshCw} tone="blue" value="367" label="Estudios reenviados" sub="-18% vs. mes anterior" trend="down" />
            <Kpi icon={Clock} tone="blue" value="2.8 min" label="Tiempo promedio de envío" sub="-45% vs. mes anterior" trend="down" />
          </>
        )}
      </div>

      {/* Tabla + detalle */}
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel
          title="LINKConnects instalados"
          className="xl:col-span-7"
          bodyClass="px-0 pb-2"
          action={!real ? (
            <label className="relative hidden w-full max-w-[310px] items-center sm:flex">
              <Search size={15} className="pointer-events-none absolute left-3 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} className="input py-1.5 pl-9 text-[12px]" placeholder="Buscar LINKConnect por hospital, código o ubicación..." />
            </label>
          ) : (
            <div className="hidden w-full max-w-[420px] items-center gap-2 sm:flex">
              <label className="relative flex w-full items-center">
                <Search size={15} className="pointer-events-none absolute left-3 text-slate-400" />
                <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} className="input py-1.5 pl-9 text-[12px]" placeholder="Buscar LINKConnect por hospital, código o ubicación..." />
              </label>
              <select value={fEstado} onChange={(e) => { setFEstado(e.target.value); setPage(1) }} className="input w-[150px] shrink-0 py-1.5 text-[12px]" aria-label="Estado">
                {['Todos', ...(['Conectado', 'En sincronización', 'Desconectado'] as Estado[]).filter((e) => LINKS.some((l) => l.estado === e))].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          )}
        >
          <Table>
            <thead className="bg-[#f6f9fe]">
              <tr>{['Hospital / Centro', 'Ubicación', 'Estado', 'Última conexión', 'Velocidad Internet', 'Acciones'].map((x) => <th key={x} className="th">{x}</th>)}</tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan={6} className="td py-6 text-center text-slate-400">Cargando LINKConnect…</td></tr>}
              {!cargando && error && (
                <tr><td colSpan={6} className="td py-6 text-center text-red-600">No se pudieron cargar los LINKConnect: {error} <button onClick={recargar} className="ml-2 font-semibold text-brand-600 hover:underline">Reintentar</button></td></tr>
              )}
              {!cargando && !error && visibles.map(({ l, i }) => {
                const A = real ? RefreshCw : ACTION_ICONS[i]
                return (
                  <tr key={l.id} onClick={() => setSel(l.id)} className={clsx('tr cursor-pointer', l.id === lc?.id && '!bg-brand-50 shadow-[inset_3px_0_0_#0b57f0]')}>
                    <td className="td">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Building2 size={16} /></span>
                        <div><div className="whitespace-nowrap text-[12px] font-semibold text-ink">{l.hospital}</div><div className="text-[11px] text-slate-500">{l.codigo}</div></div>
                      </div>
                    </td>
                    <td className="td whitespace-nowrap">{l.ubicacion}</td>
                    <td className="td"><Badge tone={estadoTone[l.estado]} icon={l.estado === 'Conectado'}>{l.estado}</Badge></td>
                    <td className="td whitespace-nowrap tabular-nums">{l.conexion}</td>
                    <td className="td whitespace-nowrap">{l.velocidad === null ? '—' : `${l.velocidad} Mbps`}</td>
                    <td className="td" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button onClick={real ? recargar : undefined} className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 text-brand-600 hover:bg-brand-100" title={real ? 'Actualizar' : 'Sincronizar'}><A size={14} /></button>
                        <DotsButton />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!cargando && !error && rows.length === 0 && (
                <tr><td colSpan={6} className="td py-6 text-center text-slate-400">{LINKS.length === 0 ? 'Aún no hay LINKConnect instalados' : 'Sin resultados'}</td></tr>
              )}
            </tbody>
          </Table>
          {real && <Pagination text={rows.length ? `Mostrando ${(pagina - 1) * POR_PAGINA + 1} a ${Math.min(pagina * POR_PAGINA, rows.length)} de ${rows.length} LINKConnect` : 'Mostrando 0 de 0 LINKConnect'} page={pagina} onPage={setPage} totalPages={totalPages} perPage={false} />}
        </Panel>

        <div className="flex flex-col gap-3 xl:col-span-5">
          {!lc ? (
            <section className="card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="card-title"><Server size={20} className="text-brand-600" /> Detalle del LINKConnect</h3>
              </div>
              <SinDatos texto={cargando ? 'Cargando…' : 'Aún no hay LINKConnect instalados'} className="min-h-[200px]" />
            </section>
          ) : (
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="card-title"><Server size={20} className="text-brand-600" /> LINKConnect de {lc.hospital.replace('Hospital Pediátrico', 'Hospital P.')}</h3>
              <Badge tone={online ? 'green' : 'red'} icon={online}>{online ? 'En línea' : 'Fuera de línea'}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px]">
              <div className="rounded-lg border border-[#eef2f8] px-3 py-1">
                <InfoRow label="Ubicación">{lc.ubicacion}</InfoRow>
                <InfoRow label="Marca">{lc.marca}</InfoRow>
                <InfoRow label="Modelo">{lc.modelo}</InfoRow>
                <InfoRow label="Serial">{lc.serial}</InfoRow>
                <InfoRow label="Memoria RAM">{lc.ram}</InfoRow>
                <InfoRow label="Procesador">{lc.cpu}</InfoRow>
                <InfoRow label="Almacenamiento">{lc.disco}</InfoRow>
                <InfoRow label="Sistema Operativo">{lc.so}</InfoRow>
                <InfoRow label="Versión de LINKConnect">{lc.version}</InfoRow>
                <InfoRow label="Nombre Host (DICOM)">{lc.host}</InfoRow>
                <InfoRow label="IP Address (DICOM)">{lc.ip}</InfoRow>
                <InfoRow label="Puerto (DICOM)">{lc.puerto}</InfoRow>
                <InfoRow label="AETitle (DICOM)">{lc.aet}</InfoRow>
                {real && <InfoRow label="Última conexión">{lc.conexion}</InfoRow>}
                <InfoRow label="Integración">HL7 <span className={lc.hl7 ? 'text-emerald-600' : 'text-red-500'}>({lc.hl7 ? 'Activo' : 'Inactivo'})</span></InfoRow>
              </div>
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-[#eef2f8] p-3">
                  <div className="mb-2 text-[13px] font-bold text-ink">Rendimiento</div>
                  <div className="flex flex-wrap justify-around gap-2">
                    {lc.uso ? (<>
                      <Gauge value={lc.uso[0]} label="CPU" color="#2f8cff" size={72} />
                      <Gauge value={lc.uso[1]} label="RAM" color="#16a34a" size={72} />
                      <Gauge value={lc.uso[2]} label="Disco" color="#a855f7" size={72} />
                    </>) : (<>
                      <GaugeVacio label="CPU" />
                      <GaugeVacio label="RAM" />
                      <GaugeVacio label="Disco" />
                    </>)}
                  </div>
                  {!lc.uso && <p className="mt-1.5 text-center text-[10.5px] text-slate-400">Métricas no reportadas</p>}
                </div>
                <div className="rounded-lg border border-[#eef2f8] p-3">
                  <div className="mb-2 text-[13px] font-bold text-ink">Conectividad</div>
                  {(lc.bajada === null
                    ? [{ i: ArrowDownToLine, l: 'Velocidad de Internet', v: lc.velocidad }]
                    : [{ i: ArrowDownToLine, l: 'Velocidad de bajada', v: lc.bajada }, { i: ArrowUpFromLine, l: 'Velocidad de subida', v: lc.subida }]
                  ).map(({ i: I, l, v }) => (
                    <div key={l} className="flex items-center gap-2.5 py-1.5">
                      <IconCircle icon={I} tone="blue" size="sm" />
                      <div><div className="text-[10.5px] text-slate-500">{l}</div><div className="text-[14px] font-bold text-ink">{v === null ? '—' : `${v} Mbps`}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          )}

          <Panel title="Últimas alertas" icon={Clock} subtitle={real && lc ? lc.hospital : undefined} action={<MoreLink onClick={() => navigate('/admin/operaciones')}>Ver todas</MoreLink>}>
            {al.cargando && <SinDatos texto="Cargando alertas…" className="min-h-[80px]" />}
            {!al.cargando && al.error && (
              <div className="py-4 text-center text-[12.5px] text-red-600">No se pudieron cargar las alertas: {al.error} <button onClick={al.recargar} className="ml-1 font-semibold text-brand-600 hover:underline">Reintentar</button></div>
            )}
            {!al.cargando && !al.error && alertas.length === 0 && <SinDatos texto="Aún no hay alertas registradas" className="min-h-[80px]" />}
            {!al.cargando && !al.error && (
              <ul className="space-y-1">
                {alertas.map((a) => (
                  <li key={a.k} className="flex items-start gap-2.5 py-1">
                    <IconCircle icon={a.icon} tone={a.tone} size="sm" className="!h-7 !w-7" />
                    <div className="min-w-0 text-[12px] leading-snug">
                      <div className="text-ink">{a.t}{a.s && <span className="text-ink/80"> · {a.s}</span>}</div>
                      <div className="text-[11px] text-slate-500">{a.d}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* Estadísticas + movimientos + configuración */}
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:col-span-7">
          <Panel
            title="Estadísticas de transmisión"
            subtitle={real ? `Eventos por día · últimos ${DIAS} días` : undefined}
            action={
              <div className="hidden items-center gap-3 text-[11px] text-slate-600 sm:flex">
                {[['Enviados', '#2f8cff'], ['Fallidos', '#ef4444'], ['Reenviados', '#f59e0b']].map(([n, c]) => (
                  <span key={n} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{n}</span>
                ))}
              </div>
            }
          >
            {real
              ? (cargando ? <SinDatos texto="Cargando…" className="min-h-[190px]" />
                : !calc.hayEventos ? <SinDatos className="min-h-[190px]" />
                  : <Lines
                    labels={calc.etiquetas}
                    series={[
                      { name: 'Enviados', color: '#2f8cff', values: calc.serie.env },
                      { name: 'Fallidos', color: '#ef4444', values: calc.serie.fal },
                      { name: 'Reenviados', color: '#f59e0b', values: calc.serie.ree },
                    ]}
                    height={190}
                  />)
              : <Lines
                labels={['01/03', '05/03', '10/03', '15/03', '20/03', '25/03', '31/03']}
                series={[
                  { name: 'Enviados', color: '#2f8cff', values: enviados },
                  { name: 'Fallidos', color: '#ef4444', values: fallidos },
                  { name: 'Reenviados', color: '#f59e0b', values: reenviados },
                ]}
                max={2000}
                height={190}
              />}
          </Panel>
          <Panel title="Últimos movimientos" action={<MoreLink>Ver todas</MoreLink>} bodyClass="px-0 pb-2">
            <Table>
              <thead className="bg-[#f6f9fe]"><tr>{['Fecha y hora', 'Hospital', 'Evento', 'Estado'].map((x) => <th key={x} className="th">{x}</th>)}</tr></thead>
              <tbody>
                {movimientos.map((m) => {
                  const s = movStyle[m.st]
                  return (
                    <tr key={m.k} className="tr">
                      <td className="td whitespace-nowrap tabular-nums">{m.f}</td>
                      <td className="td">{m.h}</td>
                      <td className="td whitespace-nowrap">{m.e}</td>
                      <td className="td"><Badge tone={s.tone} dot={false}><s.icon size={12} />{m.st}</Badge></td>
                    </tr>
                  )
                })}
                {movimientos.length === 0 && <tr><td colSpan={4} className="td py-6 text-center text-slate-400">{cargando ? 'Cargando…' : 'Aún no hay movimientos registrados'}</td></tr>}
              </tbody>
            </Table>
          </Panel>
        </div>
        <Panel title="Configuración y servicios" icon={Settings} action={<button className="text-[12px] font-semibold text-brand-600 hover:underline">Editar</button>} className="xl:col-span-5">
          <div className="rounded-lg border border-[#eef2f8] px-3 py-1">
            {config.map(([k, v]) => <InfoRow key={k} label={k} className="py-1">{v}</InfoRow>)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><Network size={13} /> Configuración global aplicada a todos los LINKConnect de la red.</div>
        </Panel>
      </div>
    </div>
  )
}
