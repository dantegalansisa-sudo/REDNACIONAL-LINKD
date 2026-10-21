import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { SolicitudesRegistro } from './SolicitudesRegistro'
import {
  AlertCircle, Building2, CheckCircle2, ChevronDown, Clock, Download, FileCheck2, FileText, Hospital, LineChart,
  Mail, Megaphone, MoreVertical, Pencil, Plus, Star, UserRound, ClipboardList,
} from 'lucide-react'
import {
  Badge, Checkbox, DotsButton, InfoRow, Kpi, Modality, MoreLink, PageHeader, Pagination, Panel, Select,
  Stars, Table, Tabs, UserSilhouette, clsx, type Tone,
} from '../../components/ui'
import {
  cambiarEstadoMedico, fFecha, fetchAccesos, fetchRadiologos, num, pct as pctTotal, useDatos,
  type Acceso, type RadiologoReal,
} from '../../lib/admin-data'
import { urlArchivo } from '../../lib/api'
import { supabase } from '../../lib/supabase'

/* ---------------- Tipos y tonos ---------------- */
type Estado = RadiologoReal['estado']
const estadoTone: Record<Estado, Tone> = {
  Activo: 'green', 'Sin asignación': 'orange', 'En convocatoria': 'purple', Pendiente: 'orange', Rechazado: 'red', Suspendido: 'gray',
}
/** Estados de un médico con registro aprobado (se puede suspender) */
const APROBADOS: Estado[] = ['Activo', 'Sin asignación', 'En convocatoria']

type Rad = RadiologoReal

/* ---------------- Datos mock (sin Supabase) ---------------- */
type RadMock = Omit<Rad, 'codigo' | 'userId' | 'registrado' | 'fotoPath'>

const RADS_MOCK: RadMock[] = [
  { nombre: 'Dr. Carlos Méndez', id: 'RAD-001', cedula: '001-1234567-1', esp: ['CT', 'MR'], region: 'Sur', hosp: 2, rating: 4.8, estado: 'Activo', exequatur: '12345', telRes: '809-555-0101', telPer: '809-555-0202', email: 'c.mendez@email.com', vive: 'Santo Domingo (Distrito Nacional)', dir: 'Santo Domingo, Distrito Nacional\nEns. Naco, Calle Principal, Torre Médica, Apto 4B', interes: ['Sur', 'Oeste'], stats: [248, 235, 8, 5], hospitales: [['Hospital Pediátrico Hugo Mendoza', '12/01/2025'], ['Hospital Dr. Marcelino Vélez', '05/03/2025']] },
  { nombre: 'Dra. Ana Rodríguez', id: 'RAD-002', cedula: '001-2345678-2', esp: ['RX', 'US'], region: 'Oeste', hosp: 1, rating: 4.6, estado: 'Activo', exequatur: '13872', telRes: '809-555-0311', telPer: '829-555-0412', email: 'a.rodriguez@email.com', vive: 'Santo Domingo Oeste', dir: 'Santo Domingo Oeste\nLas Caobas, Calle 5 No. 12', interes: ['Oeste'], stats: [196, 188, 4, 6], hospitales: [['Hospital Dr. Marcelino Vélez', '18/02/2025']] },
  { nombre: 'Dr. Luis Santana', id: 'RAD-003', cedula: '001-3456789-3', esp: ['CT'], region: 'Norte', hosp: 0, rating: 4.2, estado: 'Sin asignación', exequatur: '14520', telRes: '809-555-0520', telPer: '849-555-0621', email: 'l.santana@email.com', vive: 'Santiago', dir: 'Santiago de los Caballeros\nLos Jardines Metropolitanos', interes: ['Norte'], stats: [0, 0, 0, 0], hospitales: [] },
  { nombre: 'Dra. María Gómez', id: 'RAD-004', cedula: '001-4567890-4', esp: ['MR', 'US'], region: 'Este', hosp: 3, rating: 4.9, estado: 'Activo', exequatur: '11098', telRes: '809-555-0731', telPer: '809-555-0832', email: 'm.gomez@email.com', vive: 'La Romana', dir: 'La Romana\nVilla Verde, Calle B No. 8', interes: ['Este', 'SurEste'], stats: [312, 305, 3, 4], hospitales: [['Hospital Regional Antonio Musa', '10/03/2025'], ['Hospital Padre Billini', '22/01/2025'], ['Hospital Juan Pablo Pina', '03/02/2025']] },
  { nombre: 'Dr. José Castillo', id: 'RAD-005', cedula: '001-5678901-5', esp: ['RX'], region: 'SurEste', hosp: 0, rating: 4.0, estado: 'En convocatoria', exequatur: '15633', telRes: '809-555-0941', telPer: '829-555-1042', email: 'j.castillo@email.com', vive: 'San Pedro de Macorís', dir: 'San Pedro de Macorís\nVilla Velásquez, Calle 3', interes: ['SurEste'], stats: [0, 0, 0, 0], hospitales: [] },
  { nombre: 'Dra. Laura Sánchez', id: 'RAD-006', cedula: '001-6789012-6', esp: ['CT', 'MR'], region: 'Norte', hosp: 1, rating: 4.7, estado: 'Activo', exequatur: '12987', telRes: '809-555-1151', telPer: '809-555-1252', email: 'l.sanchez@email.com', vive: 'Santiago', dir: 'Santiago de los Caballeros\nCerros de Gurabo', interes: ['Norte', 'NorOeste'], stats: [174, 170, 2, 5], hospitales: [['Hospital Traumatológico Ney Arias Lora', '28/02/2025']] },
  { nombre: 'Dr. Pedro Martínez', id: 'RAD-007', cedula: '001-7890123-7', esp: ['US'], region: 'SurOeste', hosp: 0, rating: 3.9, estado: 'Sin asignación', exequatur: '16210', telRes: '809-555-1361', telPer: '849-555-1462', email: 'p.martinez@email.com', vive: 'Barahona', dir: 'Santa Cruz de Barahona\nPalmarito, Calle 2', interes: ['SurOeste'], stats: [0, 0, 0, 0], hospitales: [] },
  { nombre: 'Dra. Claudia Jiménez', id: 'RAD-008', cedula: '001-8901234-8', esp: ['MR'], region: 'Oeste', hosp: 2, rating: 4.5, estado: 'Activo', exequatur: '13340', telRes: '809-555-1571', telPer: '809-555-1672', email: 'c.jimenez@email.com', vive: 'San Juan de la Maguana', dir: 'San Juan de la Maguana\nCentro, Calle Duarte 44', interes: ['Oeste'], stats: [152, 147, 5, 6], hospitales: [['Hospital Regional San Juan de la Maguana', '14/01/2025'], ['Hospital Dr. Alejandro Cabral', '20/02/2025']] },
  { nombre: 'Dr. Rafael Pineda', id: 'RAD-009', cedula: '001-9012345-9', esp: ['CT', 'RX'], region: 'NorEste', hosp: 1, rating: 4.3, estado: 'Activo', exequatur: '14780', telRes: '809-555-1781', telPer: '829-555-1882', email: 'r.pineda@email.com', vive: 'San Francisco de Macorís', dir: 'San Francisco de Macorís\nUrb. Almánzar', interes: ['NorEste'], stats: [131, 126, 4, 7], hospitales: [['Hospital Regional Taiwán 19 de Marzo', '06/03/2025']] },
  { nombre: 'Dra. Isabel Torres', id: 'RAD-010', cedula: '001-0123456-0', esp: ['US'], region: 'NorOeste', hosp: 0, rating: 4.1, estado: 'En convocatoria', exequatur: '16955', telRes: '809-555-1991', telPer: '809-555-2092', email: 'i.torres@email.com', vive: 'Mao, Valverde', dir: 'Mao, Valverde\nLos Multis, Calle 7', interes: ['NorOeste'], stats: [0, 0, 0, 0], hospitales: [] },
]
const RADS: Rad[] = RADS_MOCK.map((r) => ({ ...r, codigo: r.id, userId: null, registrado: '—', fotoPath: null }))

type Conv = { id: string; t: string; esp: string[]; region: string; aplica: string; fecha: string; post: number; estado: string }

const CONVOCATORIAS: Conv[] = [
  { id: 'c1', t: 'Radiólogos para Hospital Regional Azua', esp: ['CT', 'MR'], region: 'Sur', aplica: 'Todos', fecha: '20/03/2025', post: 12, estado: 'Abierta' },
  { id: 'c2', t: 'Médicos para área de Ultrasonido', esp: ['US'], region: 'Este', aplica: 'Sin hospitales', fecha: '18/03/2025', post: 8, estado: 'Abierta' },
  { id: 'c3', t: 'Convocatoria Tomografía - NorOeste', esp: ['CT'], region: 'NorOeste', aplica: 'Con 1 hospital', fecha: '25/03/2025', post: 5, estado: 'En evaluación' },
]

const APLICA_A: Record<string, string> = { todos: 'Todos', sin_hospital: 'Sin hospitales', un_hospital: 'Con 1 hospital', dos_o_mas: 'Con 2 o más' }

/** Convocatorias con estado 'activa' (modo real) */
async function fetchConvocatoriasActivas(): Promise<Conv[]> {
  const { data, error } = await supabase.from('convocatorias')
    .select('id, titulo, especialidades, regiones_interes, aplica_a, fecha_cierre, postulaciones(count)')
    .eq('estado', 'activa').order('fecha_cierre', { ascending: true })
  if (error) throw new Error(error.message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((c) => ({
    id: c.id, t: c.titulo, esp: c.especialidades ?? [], region: (c.regiones_interes ?? []).join(', ') || 'Todas',
    aplica: APLICA_A[c.aplica_a] ?? c.aplica_a, fecha: fFecha(c.fecha_cierre), post: c.postulaciones?.[0]?.count ?? 0, estado: 'Abierta',
  }))
}

type Documento = { id: string; nombre: string; path: string; estado: string }
const ESTADO_DOC: Record<string, { l: string; t: Tone }> = {
  verificado: { l: 'Verificado', t: 'green' }, cargado: { l: 'Cargado', t: 'orange' }, rechazado: { l: 'Rechazado', t: 'red' },
}
const TIPO_DOC: Record<string, string> = { titulo: 'Título', exequatur: 'Exequátur', cedula: 'Cédula de identidad', especialidad: 'Título de especialidad', otros: 'Otro documento' }

async function fetchDocumentos(medicoId: string): Promise<Documento[]> {
  const { data, error } = await supabase.from('medico_documentos')
    .select('id, tipo, archivo_path, nombre_archivo, estado').eq('medico_id', medicoId).order('created_at')
  if (error) throw new Error(error.message)
  return ((data ?? []) as { id: string; tipo: string; archivo_path: string; nombre_archivo: string | null; estado: string }[])
    .map((d) => ({ id: d.id, nombre: d.nombre_archivo || TIPO_DOC[d.tipo] || d.tipo, path: d.archivo_path, estado: d.estado }))
}

const solicitudes = [
  { f: '12/03/2025 14:32', n: 'Dr. Javier Rosario', e: 'RX', s: 'Pendiente' },
  { f: '12/03/2025 11:20', n: 'Dra. Melissa Peña', e: 'US', s: 'Pendiente' },
  { f: '11/03/2025 16:45', n: 'Dr. Antonio Vargas', e: 'CT', s: 'Aprobado' },
  { f: '11/03/2025 10:18', n: 'Dra. Elena Cruz', e: 'MR', s: 'Pendiente' },
  { f: '10/03/2025 09:32', n: 'Dr. Manuel Rivas', e: 'RX', s: 'Aprobado' },
]

const SPECS = ['CT', 'MR', 'RX', 'US', 'MG']
const REGIONES = ['Norte', 'Sur', 'Este', 'Oeste', 'NorEste', 'NorOeste', 'SurEste', 'SurOeste']
const ESTADOS_MOCK: Estado[] = ['Activo', 'Sin asignación', 'En convocatoria']
const ESTADOS_REAL: Estado[] = ['Activo', 'Sin asignación', 'En convocatoria', 'Pendiente', 'Rechazado', 'Suspendido']
const POR_PAGINA = 10
const unicos = (xs: string[]) => Array.from(new Set(xs.filter((x) => x && x !== '—')))

/** Carga asíncrona simple ligada a un id (detalle) */
function useCarga<T>(fn: (() => Promise<T>) | null, inicial: T, clave: string) {
  const [estado, setEstado] = useState<{ datos: T; cargando: boolean; error: string }>({ datos: inicial, cargando: Boolean(fn), error: '' })
  useEffect(() => {
    if (!fn) return
    let vivo = true
    fn().then((datos) => { if (vivo) setEstado({ datos, cargando: false, error: '' }) })
      .catch((e: unknown) => { if (vivo) setEstado({ datos: inicial, cargando: false, error: (e as Error).message ?? String(e) }) })
    return () => { vivo = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
  return estado
}

function RegionChip({ r }: { r: string }) {
  return <span className="inline-flex rounded-md border border-red-100 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">{r}</span>
}

/** Foto real del radiólogo (bucket privado) o la silueta por defecto */
function FotoRadiologo({ path, nombre }: { path: string | null; nombre: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!path) return
    let vivo = true
    urlArchivo('fotos-perfil', path).then((u) => { if (vivo) setUrl(u) }).catch(() => { /* se queda la silueta */ })
    return () => { vivo = false }
  }, [path])
  if (path && url) return <img src={url} alt={nombre} className="h-[52px] w-[52px] shrink-0 rounded-full object-cover" />
  return <UserSilhouette size={52} className="!bg-brand-600 [&_circle]:fill-white [&_path]:fill-white" />
}

function Vacio({ children }: { children: ReactNode }) {
  return <li className="rounded-lg border border-dashed border-[#d7e1f2] px-3 py-6 text-center text-[12.5px] text-slate-500">{children}</li>
}

/* ---------------- Detalle ---------------- */
function Detalle({ r, real, onCambio }: { r: Rad; real: boolean; onCambio: () => void }) {
  const [tab, setTab] = useState(0)
  const [procesando, setProcesando] = useState(false)
  const [errAccion, setErrAccion] = useState('')
  const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) : '0.0')
  const accesos = useCarga<Acceso[]>(real ? () => fetchAccesos(r.userId) : null, [], `acc-${r.id}`)
  const docs = useCarga<Documento[]>(real ? () => fetchDocumentos(r.id) : null, [], `doc-${r.id}`)
  const aprobado = APROBADOS.includes(r.estado)
  const puedeCambiar = real && (aprobado || r.estado === 'Suspendido')

  const cambiar = async () => {
    setProcesando(true); setErrAccion('')
    try { await cambiarEstadoMedico(r.id, aprobado ? 'suspendido' : 'aprobado'); onCambio() }
    catch (e) { setErrAccion((e as Error).message ?? String(e)) }
    finally { setProcesando(false) }
  }
  const abrirDoc = async (path: string) => {
    try { window.open(await urlArchivo('documentos-medicos', path), '_blank', 'noopener') } catch (e) { setErrAccion((e as Error).message ?? String(e)) }
  }

  return (
    <section className="card flex flex-col">
      <div className="flex items-start gap-3 px-4 pt-4">
        <FotoRadiologo path={r.fotoPath} nombre={r.nombre} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[19px] font-bold leading-tight text-ink">{r.nombre}</h2>
            <Badge tone={estadoTone[r.estado]}>{r.estado}</Badge>
          </div>
          <p className="text-[12.5px] text-slate-500">{r.codigo} <span className="mx-1.5">|</span> Exequátur: {r.exequatur}</p>
        </div>
        {puedeCambiar && (
          <button onClick={cambiar} disabled={procesando}
            className={clsx('btn-outline gap-1.5 px-3 py-1.5 text-[12.5px] disabled:opacity-60', aprobado ? 'text-red-600' : 'text-emerald-700')}>
            {procesando ? 'Guardando…' : aprobado ? 'Suspender' : 'Reactivar'}
          </button>
        )}
        <button className="btn-primary gap-1.5 px-3 py-1.5 text-[12.5px]"><Pencil size={14} /> Editar</button>
        <button className="rounded-md p-1 text-ink hover:bg-slate-100" aria-label="Más"><MoreVertical size={18} /></button>
      </div>
      {errAccion && <p className="mx-4 mt-2 rounded-md bg-red-50 px-3 py-1.5 text-[12px] text-red-600">{errAccion}</p>}
      <Tabs className="mx-4 mt-3" tabs={['Información', 'Asignaciones', 'Rendimiento', 'Actividad', 'Documentos']} active={tab} onChange={setTab} />
      <div className="space-y-3 px-4 py-3">
        {tab === 0 && (
          <div className="rounded-lg bg-[#f6f9fe] px-3 py-2">
            <h4 className="mb-1 flex items-center gap-2 text-[13.5px] font-bold text-ink"><UserRound size={16} className="text-brand-600" /> Información personal</h4>
            <InfoRow label="Nombre completo">{r.nombre}</InfoRow>
            <InfoRow label="Cédula">{r.cedula}</InfoRow>
            <InfoRow label="Exequátur">{r.exequatur}</InfoRow>
            <InfoRow label="Tel. Residencia">{r.telRes}</InfoRow>
            <InfoRow label="Tel. Personal (WhatsApp)">
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-emerald-500"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.2Z" /></svg>
                {r.telPer}
              </span>
            </InfoRow>
            <InfoRow label="Correo electrónico"><span className="flex items-center gap-1.5 break-all text-brand-600"><Mail size={13} className="shrink-0 text-ink" />{r.email}</span></InfoRow>
            <InfoRow label="Dirección actual"><span className="whitespace-pre-line">{r.dir}</span></InfoRow>
            <InfoRow label="Especialidades"><span className="flex flex-wrap gap-1.5">{r.esp.length ? r.esp.map((e) => <Modality key={e} m={e} />) : '—'}</span></InfoRow>
            <InfoRow label="Región donde vive">{r.vive}</InfoRow>
            <InfoRow label="Región de interés"><span className="flex flex-wrap gap-1.5">{r.interes.length ? r.interes.map((x) => <RegionChip key={x} r={x} />) : '—'}</span></InfoRow>
            {real && <InfoRow label="Fecha de registro">{r.registrado}</InfoRow>}
            <InfoRow label="Bio / Observaciones">-</InfoRow>
          </div>
        )}
        {tab === 1 && (
          <ul className="space-y-2">
            {r.hospitales.length === 0 && <Vacio>Sin hospitales asignados</Vacio>}
            {r.hospitales.map(([h, f], i) => (
              <li key={`${h}-${i}`} className="flex items-center gap-3 rounded-lg border border-[#e6edf8] px-3 py-2.5">
                <Building2 size={18} className="text-brand-600" />
                <div className="min-w-0 flex-1 text-[12.5px]"><div className="font-semibold text-ink">{h}</div><div className="text-slate-500">Asignado el {f} · {r.esp.join(', ')}</div></div>
                <Badge tone="green" icon>Activo</Badge>
              </li>
            ))}
          </ul>
        )}
        {tab === 2 && (
          <div className="space-y-2 text-[12.5px]">
            {real && r.stats[0] === 0 && <ul><Vacio>Aún no tiene estudios asignados para calcular su rendimiento</Vacio></ul>}
            {(real
              ? (r.stats[0] ? [['Informes emitidos', Number(pct(r.stats[1], r.stats[0]))], ['Estudios sin vencer', Number(pct(r.stats[0] - r.stats[2], r.stats[0]))]] : [])
              : [['Informes a tiempo', 92], ['Calidad (revisión por pares)', 96], ['Aceptación de estudios', 88]]
            ).map(([l, v]) => (
              <div key={l as string}>
                <div className="mb-1 flex justify-between"><span className="text-ink">{l}</span><b className="text-ink">{r.stats[0] ? v : 0}%</b></div>
                <div className="h-2 overflow-hidden rounded bg-[#e8eef8]"><div className="h-full rounded bg-brand-500" style={{ width: `${r.stats[0] ? v : 0}%` }} /></div>
              </div>
            ))}
          </div>
        )}
        {tab === 3 && (
          <ul className="space-y-2 text-[12.5px]">
            {real ? (
              <>
                {accesos.cargando && <Vacio>Cargando actividad…</Vacio>}
                {accesos.error && <Vacio><span className="text-red-600">{accesos.error}</span></Vacio>}
                {!accesos.cargando && !accesos.error && accesos.datos.length === 0 && <Vacio>Sin actividad registrada en el portal</Vacio>}
                {accesos.datos.map((a, i) => (
                  <li key={`${a.f}-${i}`} className="flex justify-between border-b border-[#eef2f8] pb-2"><span className="text-ink">Inicio de sesión · {a.d}</span><span className="text-slate-500">{a.f}</span></li>
                ))}
              </>
            ) : [['Informe emitido · TC de Cráneo', 'Hace 15 min'], ['Estudio aceptado · RM de Rodilla', 'Hace 1 hora'], ['Inicio de sesión', 'Hoy 08:02'], ['Actualizó su perfil', '10/03/2025']].map(([a, t]) => (
              <li key={a} className="flex justify-between border-b border-[#eef2f8] pb-2"><span className="text-ink">{a}</span><span className="text-slate-500">{t}</span></li>
            ))}
          </ul>
        )}
        {tab === 4 && (
          <ul className="space-y-2">
            {real ? (
              <>
                {docs.cargando && <Vacio>Cargando documentos…</Vacio>}
                {docs.error && <Vacio><span className="text-red-600">{docs.error}</span></Vacio>}
                {!docs.cargando && !docs.error && docs.datos.length === 0 && <Vacio>No hay documentos cargados</Vacio>}
                {docs.datos.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 rounded-lg border border-[#e6edf8] px-3 py-2 text-[12.5px]">
                    <FileText size={17} className="text-red-500" />
                    <button onClick={() => abrirDoc(d.path)} className="flex-1 truncate text-left text-ink hover:text-brand-600 hover:underline">{d.nombre}</button>
                    <Badge tone={ESTADO_DOC[d.estado]?.t ?? 'gray'} icon={d.estado === 'verificado'}>{ESTADO_DOC[d.estado]?.l ?? d.estado}</Badge>
                  </li>
                ))}
              </>
            ) : ['Exequátur.pdf', 'Cédula de identidad.pdf', 'Título de especialidad.pdf', 'Curriculum vitae.pdf'].map((d) => (
              <li key={d} className="flex items-center gap-3 rounded-lg border border-[#e6edf8] px-3 py-2 text-[12.5px]">
                <FileText size={17} className="text-red-500" /><span className="flex-1 text-ink">{d}</span><Badge tone="green" icon>Verificado</Badge>
              </li>
            ))}
          </ul>
        )}

        {/* Estadísticas */}
        <div className="rounded-lg bg-[#f6f9fe] px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-[13.5px] font-bold text-ink"><LineChart size={16} className="text-brand-600" /> Estadísticas de rendimiento</h4>
            <Select options={['Últimos 6 meses', 'Últimos 3 meses', 'Último año']} className="w-[140px] [&_select]:py-1 [&_select]:text-[11.5px]" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { i: ClipboardList, c: 'text-violet-600', v: r.stats[0], l: 'Estudios asignados', s: '' },
              { i: FileCheck2, c: 'text-emerald-600', v: r.stats[1], l: 'Informes emitidos', s: `${pct(r.stats[1], r.stats[0])}%`, sc: 'text-emerald-600' },
              { i: AlertCircle, c: 'text-red-500', v: r.stats[2], l: 'Estudios vencidos', s: `${pct(r.stats[2], r.stats[0])}%`, sc: 'text-red-500', vc: 'text-red-500' },
              { i: Clock, c: 'text-violet-600', v: real && !r.stats[3] ? '—' : r.stats[3], l: 'Promedio (horas)', s: '' },
            ].map((x) => (
              <div key={x.l} className="rounded-lg border border-[#e6edf8] bg-white p-2">
                <div className="flex items-center gap-1.5"><x.i size={15} className={x.c} /><span className={clsx('text-[17px] font-bold', x.vc ?? 'text-brand-700')}>{x.v}</span></div>
                <div className="text-[11px] leading-tight text-slate-500">{x.l}</div>
                {x.s && <div className={clsx('text-[11.5px] font-semibold', x.sc)}>{x.s}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Hospitales asignados */}
        <div className="rounded-lg bg-[#f6f9fe] px-3 py-2.5">
          <div className="mb-1 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-[13.5px] font-bold text-ink"><Hospital size={16} className="text-brand-600" /> Hospitales asignados ({r.hospitales.length})</h4>
            <button className="rounded-md border border-brand-200 bg-white px-2 py-1 text-[11.5px] font-semibold text-brand-600 hover:bg-brand-50">Gestionar</button>
          </div>
          <Table>
            <thead><tr>{['Hospital / Centro', 'Fecha de asignación', 'Estado'].map((x) => <th key={x} className="th px-1">{x}</th>)}</tr></thead>
            <tbody>
              {r.hospitales.map(([h, f], i) => (
                <tr key={`${h}-${i}`} className="border-t border-[#e6edf8]">
                  <td className="td px-1 font-medium text-ink">{h}</td><td className="td px-1">{f}</td><td className="td px-1"><Badge tone="green" icon>Abierto</Badge></td>
                </tr>
              ))}
              {r.hospitales.length === 0 && <tr><td colSpan={3} className="td px-1 text-center">Sin hospitales asignados</td></tr>}
            </tbody>
          </Table>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Página ---------------- */
export default function Radiologos() {
  const navigate = useNavigate()
  const { datos, cargando, error, recargar, real } = useDatos(fetchRadiologos, RADS)
  const conv = useDatos(fetchConvocatoriasActivas, CONVOCATORIAS)
  const [selId, setSelId] = useState<string | null>(null)
  const [checked, setChecked] = useState<string[]>([])
  const [fk, setFk] = useState(0)
  const [exp, setExp] = useState(false)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [fEsp, setFEsp] = useState('Todos')
  const [fVive, setFVive] = useState('Todos')
  const [fInteres, setFInteres] = useState('Todos')
  const [fEstado, setFEstado] = useState('Todos')

  // Opciones de filtros derivadas de los datos
  const optEsp = ['Todos', ...unicos([...SPECS, ...datos.flatMap((r) => r.esp)])]
  const optVive = ['Todos', ...unicos(datos.map((r) => r.vive)).sort()]
  const optInteres = ['Todos', ...unicos([...REGIONES, ...datos.flatMap((r) => r.interes)])]
  const optEstado = ['Todos', ...(real ? ESTADOS_REAL : ESTADOS_MOCK)]

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    return datos.filter((r) =>
      (!t || `${r.nombre} ${r.cedula} ${r.exequatur} ${r.codigo} ${r.esp.join(' ')}`.toLowerCase().includes(t))
      && (fEsp === 'Todos' || r.esp.includes(fEsp))
      && (fVive === 'Todos' || r.vive === fVive)
      && (fInteres === 'Todos' || r.interes.includes(fInteres))
      && (fEstado === 'Todos' || r.estado === fEstado))
  }, [datos, q, fEsp, fVive, fInteres, fEstado])

  const totalPages = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const pagina = Math.min(page, totalPages)
  const filas = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const sel = datos.find((r) => r.id === selId) ?? filas[0] ?? datos[0] ?? null
  const allChecked = filas.length > 0 && filas.every((r) => checked.includes(r.id))

  const filtro = (fn: (v: string) => void) => (v: string) => { fn(v); setPage(1) }
  const limpiar = () => { setQ(''); setFEsp('Todos'); setFVive('Todos'); setFInteres('Todos'); setFEstado('Todos'); setPage(1); setFk(fk + 1) }

  // KPIs
  const total = datos.length
  const cuenta = (e: Estado) => datos.filter((r) => r.estado === e).length
  const conRating = datos.filter((r) => r.rating > 0)
  const ratingProm = conRating.length ? (conRating.reduce((s, r) => s + r.rating, 0) / conRating.length).toFixed(1) : '—'
  const kv = (n: number) => (cargando ? '—' : num(n))

  const mensajeTabla = cargando ? 'Cargando radiólogos…'
    : error ? null
    : datos.length === 0 ? 'Aún no hay radiólogos registrados'
    : filtrados.length === 0 ? 'No se encontraron radiólogos con los filtros aplicados' : null

  return (
    <div>
      <PageHeader
        icon={UserRound}
        title="Radiólogos"
        subtitle="Registro, gestión y asignación de médicos radiólogos"
        actions={
          <>
            <button onClick={() => navigate('/admin/convocatorias?nueva=1')} className="btn-primary gap-2"><Plus size={17} /> Nueva convocatoria</button>
            <button onClick={() => navigate('/admin/asignaciones')} className="btn-outline gap-2"><Building2 size={16} /> Asignar a hospital</button>
            <div className="relative">
              <button onClick={() => setExp(!exp)} className="btn-outline gap-2"><Download size={16} /> Exportar <ChevronDown size={15} /></button>
              {exp && (
                <div className="absolute right-0 top-11 z-30 w-40 overflow-hidden rounded-lg border border-[#e3eaf6] bg-white py-1 shadow-soft">
                  {['Excel (.xlsx)', 'PDF', 'CSV'].map((l) => <button key={l} onClick={() => setExp(false)} className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-brand-50">{l}</button>)}
                </div>
              )}
            </div>
          </>
        }
      />

      {real ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Kpi icon={Building2} tone="blue" value={kv(total)} label="Médicos registrados" sub="radiólogos en la red" />
          <Kpi icon={CheckCircle2} tone="green" value={kv(cuenta('Activo'))} label="Activos" sub={`${pctTotal(cuenta('Activo'), total)} del total`} />
          <Kpi icon={UserRound} tone="orange" value={kv(cuenta('Sin asignación'))} label="Sin asignación" sub={`${pctTotal(cuenta('Sin asignación'), total)} del total`} />
          <Kpi icon={Megaphone} tone="purple" value={kv(cuenta('En convocatoria'))} label="En convocatoria" sub={`${pctTotal(cuenta('En convocatoria'), total)} del total`} />
          <Kpi icon={Star} tone="yellow" value={cargando ? '—' : ratingProm} label="Rating promedio" sub="de 5.0" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Kpi icon={Building2} tone="blue" value="287" label="Médicos registrados" sub="12% vs. mes anterior" trend="up" />
          <Kpi icon={CheckCircle2} tone="green" value="198" label="Activos" sub="69.0% del total" />
          <Kpi icon={UserRound} tone="orange" value="56" label="Sin asignación" sub="19.5% del total" />
          <Kpi icon={Megaphone} tone="purple" value="33" label="En convocatoria" sub="11.5% del total" />
          <Kpi icon={Star} tone="yellow" value="4.6" label="Rating promedio" sub="de 5.0" />
        </div>
      )}

      {/* Filtros */}
      <div key={fk} className="card mt-3 grid grid-cols-1 items-end gap-3 px-4 py-3.5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
        <label className="relative flex items-center">
          <svg className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} className="input pl-9" placeholder="Buscar radiólogo por nombre, exequátur, cédula..." />
        </label>
        <div><label className="label">Especialidad</label><Select value={fEsp} options={optEsp} onChange={filtro(setFEsp)} /></div>
        <div><label className="label">Región donde vive</label><Select value={fVive} options={optVive} onChange={filtro(setFVive)} /></div>
        <div><label className="label">Región de interés</label><Select value={fInteres} options={optInteres} onChange={filtro(setFInteres)} /></div>
        <div><label className="label">Estado</label><Select value={fEstado} options={optEstado} onChange={filtro(setFEstado)} /></div>
        <button onClick={limpiar} className="btn-outline justify-center px-10">Limpiar</button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-3 xl:col-span-8">
          <Panel title="Listado de radiólogos" subtitle={real ? `${num(filtrados.length)} registro${filtrados.length === 1 ? '' : 's'} encontrado${filtrados.length === 1 ? '' : 's'}` : '287 registros encontrados'} bodyClass="px-0 pb-0">
            <Table>
              <thead className="bg-[#f6f9fe]">
                <tr>
                  <th className="th w-8"><Checkbox checked={allChecked} onChange={(v) => setChecked(v ? filas.map((r) => r.id) : [])} /></th>
                  {['Nombre', 'Exequátur', 'Cédula', 'Especialidad', 'Región de interés', 'Hospitales asignados', 'Rating', 'Estado', 'Acciones'].map((x) => <th key={x} className="th">{x}</th>)}
                </tr>
              </thead>
              <tbody>
                {error && !cargando && (
                  <tr><td colSpan={10} className="td py-8 text-center">
                    <span className="text-red-600">No se pudieron cargar los radiólogos: {error}</span>{' '}
                    <button onClick={recargar} className="font-semibold text-brand-600 hover:underline">Reintentar</button>
                  </td></tr>
                )}
                {mensajeTabla && <tr><td colSpan={10} className="td py-8 text-center text-slate-500">{mensajeTabla}</td></tr>}
                {!cargando && !error && filas.map((r) => (
                  <tr key={r.id} onClick={() => setSelId(r.id)} className={clsx('tr cursor-pointer', r.id === sel?.id && '!bg-brand-50 shadow-[inset_3px_0_0_#0b57f0]')}>
                    <td className="td" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={checked.includes(r.id)} onChange={(v) => setChecked(v ? [...checked, r.id] : checked.filter((x) => x !== r.id))} />
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <UserSilhouette size={24} className="!bg-brand-600 [&_circle]:fill-white [&_path]:fill-white" />
                        <span className="font-semibold text-ink">{r.nombre}</span>
                      </div>
                    </td>
                    <td className="td">{real ? r.exequatur : r.codigo}</td>
                    <td className="td whitespace-nowrap">{r.cedula}</td>
                    <td className="td"><span className="flex gap-1">{r.esp.map((e) => <Modality key={e} m={e} />)}</span></td>
                    <td className="td">{r.region}</td>
                    <td className="td text-center">{r.hosp}</td>
                    <td className="td"><span className="flex items-center gap-1.5 whitespace-nowrap"><Stars value={r.rating} size={12} /><span className="text-ink">{r.rating > 0 || !real ? r.rating.toFixed(1) : '—'}</span></span></td>
                    <td className="td"><Badge tone={estadoTone[r.estado]} icon={r.estado === 'Activo'}>{r.estado}</Badge></td>
                    <td className="td" onClick={(e) => e.stopPropagation()}><DotsButton /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {real ? (
              <Pagination
                text={filtrados.length ? `Mostrando ${num((pagina - 1) * POR_PAGINA + 1)} a ${num((pagina - 1) * POR_PAGINA + filas.length)} de ${num(filtrados.length)} radiólogos` : 'Mostrando 0 de 0 radiólogos'}
                page={pagina} onPage={setPage} totalPages={totalPages} />
            ) : (
              <Pagination text="Mostrando 1 a 10 de 287 radiólogos" pages={[1, 2, 3, 4, 5]} last={29} />
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Panel title="Convocatorias activas" icon={Megaphone}
              subtitle={conv.real ? (conv.cargando ? 'Cargando…' : `${conv.datos.length} convocatoria${conv.datos.length === 1 ? '' : 's'} en proceso`) : '3 convocatorias en proceso'}
              action={<MoreLink onClick={() => navigate('/admin/convocatorias')}>Ver todas</MoreLink>} bodyClass="px-0 pb-2">
              <Table>
                <thead className="bg-[#f6f9fe]"><tr>{['Título', 'Especialidad', 'Región', 'Aplican a', 'Fecha límite', 'Postulaciones', 'Estado'].map((x) => <th key={x} className="th">{x}</th>)}</tr></thead>
                <tbody>
                  {conv.cargando && <tr><td colSpan={7} className="td py-6 text-center text-slate-500">Cargando convocatorias…</td></tr>}
                  {conv.error && !conv.cargando && <tr><td colSpan={7} className="td py-6 text-center text-red-600">No se pudieron cargar las convocatorias: {conv.error}</td></tr>}
                  {!conv.cargando && !conv.error && conv.datos.length === 0 && <tr><td colSpan={7} className="td py-6 text-center text-slate-500">No hay convocatorias activas</td></tr>}
                  {!conv.cargando && !conv.error && conv.datos.map((c) => (
                    <tr key={c.id} className="tr">
                      <td className="td min-w-[150px] text-ink">{c.t}</td>
                      <td className="td"><span className="flex gap-1">{c.esp.map((e) => <Modality key={e} m={e} />)}</span></td>
                      <td className="td">{c.region}</td>
                      <td className="td whitespace-nowrap">{c.aplica}</td>
                      <td className="td">{c.fecha}</td>
                      <td className="td text-center">{c.post}</td>
                      <td className="td"><Badge tone={c.estado === 'Abierta' ? 'green' : 'orange'} icon={c.estado === 'Abierta'}>{c.estado}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Panel>
            <SolicitudesRegistro demo={solicitudes} />
          </div>
        </div>

        <div className="xl:col-span-4">
          {sel ? (
            <Detalle key={sel.id} r={sel} real={real} onCambio={recargar} />
          ) : (
            <section className="card flex flex-col items-center gap-3 px-4 py-10 text-center">
              <UserSilhouette size={52} className="!bg-brand-600 [&_circle]:fill-white [&_path]:fill-white" />
              <p className="text-[13px] text-slate-500">{cargando ? 'Cargando radiólogos…' : error ? 'No se pudo cargar el detalle.' : 'Aún no hay radiólogos registrados'}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
