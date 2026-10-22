import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, CalendarCheck, CalendarDays, Check, CheckCircle2, ChevronDown, Clock, Download, Gauge as GaugeIcon, Hospital, Mail,
  MapPinned, Phone, Plus, UserRoundX, X,
} from 'lucide-react'
import {
  Badge, Bar, Checkbox, DotsButton, InfoRow, Kpi, Modality, MoreLink, PageHeader, Pagination, Panel, SearchInput, Select,
  Table, Tabs, UserSilhouette, clsx, type Tone,
} from '../../components/ui'
import { Donut } from '../../components/charts'
import { fFecha, pct, supabaseConfigurado, useDatos } from '../../lib/admin-data'
import { supabase } from '../../lib/supabase'
import { useSesion } from '../../lib/session'

/** En producción (Supabase configurado) la pantalla muestra los datos reales de la base */
const VACIO = supabaseConfigurado
const POR_PAGINA = 10

/* ---------------- Tipos ---------------- */
type Estado = 'Activa' | 'Pendiente' | 'Suspendida' | 'Finalizada'
const estadoTone: Record<Estado, Tone> = { Activa: 'green', Pendiente: 'orange', Suspendida: 'red', Finalizada: 'gray' }
const ESTADO_DB: Record<string, Estado> = { activa: 'Activa', pendiente: 'Pendiente', suspendida: 'Suspendida', finalizada: 'Finalizada' }
const ESTADO_A_DB: Record<Estado, string> = { Activa: 'activa', Pendiente: 'pendiente', Suspendida: 'suspendida', Finalizada: 'finalizada' }

type Asig = {
  /** Identificador (código en el demo, uuid con datos reales) */
  id: string
  /** Código visible de la asignación (solo demo) */
  ref?: string
  rad: string; radId: string; hospital: string; codigo: string; region: string; mods: string[]; fecha: string
  carga: number; capacidad: number; estado: Estado; turno: string; email: string; tel: string; sla: string
  fin?: string
}

type Opcion = { id: string; nombre: string }
type HospitalCob = { id: string; nombre: string; codigo: string; region: string; servicios: string[] }

/** Datos que usa la pantalla (reales o de ejemplo) */
type Datos = {
  asigs: Asig[]
  /** Radiólogos aprobados (tipo radiólogo) */
  radiologos: Opcion[]
  hospitales: HospitalCob[]
  /** id de radiólogo por asignación (para KPIs y cobertura) */
  radDe: Record<string, string>
  /** id de hospital por asignación */
  hospDe: Record<string, string>
}

/* ---------------- Datos mock ---------------- */
const MOCK_ASIGS: Asig[] = [
  { id: 'ASG-0142', rad: 'Dr. Carlos Méndez', radId: 'RAD-001', hospital: 'Hospital Pediátrico Hugo Mendoza', codigo: 'H-001', region: 'Ozama', mods: ['CT', 'MR'], fecha: '12/01/2025', carga: 132, capacidad: 160, estado: 'Activa', turno: 'Lunes a viernes · 08:00 - 16:00', email: 'c.mendez@email.com', tel: '809-555-0202', sla: '6 horas' },
  { id: 'ASG-0151', rad: 'Dr. Carlos Méndez', radId: 'RAD-001', hospital: 'Hospital Dr. Marcelino Vélez', codigo: 'H-002', region: 'Ozama', mods: ['CT'], fecha: '05/03/2025', carga: 116, capacidad: 160, estado: 'Activa', turno: 'Guardia remota · 16:00 - 22:00', email: 'c.mendez@email.com', tel: '809-555-0202', sla: '8 horas' },
  { id: 'ASG-0137', rad: 'Dra. Ana Rodríguez', radId: 'RAD-002', hospital: 'Hospital Dr. Marcelino Vélez', codigo: 'H-002', region: 'Ozama', mods: ['RX', 'US'], fecha: '18/02/2025', carga: 188, capacidad: 200, estado: 'Activa', turno: 'Lunes a sábado · 07:00 - 15:00', email: 'a.rodriguez@email.com', tel: '829-555-0412', sla: '4 horas' },
  { id: 'ASG-0128', rad: 'Dra. María Gómez', radId: 'RAD-004', hospital: 'Hospital Regional Antonio Musa', codigo: 'H-010', region: 'Este', mods: ['MR', 'US'], fecha: '10/03/2025', carga: 98, capacidad: 150, estado: 'Activa', turno: 'Lunes a viernes · 08:00 - 18:00', email: 'm.gomez@email.com', tel: '809-555-0832', sla: '6 horas' },
  { id: 'ASG-0119', rad: 'Dra. María Gómez', radId: 'RAD-004', hospital: 'Hospital Padre Billini', codigo: 'H-003', region: 'Ozama', mods: ['MR'], fecha: '22/01/2025', carga: 121, capacidad: 140, estado: 'Activa', turno: 'Fines de semana · 08:00 - 20:00', email: 'm.gomez@email.com', tel: '809-555-0832', sla: '8 horas' },
  { id: 'ASG-0156', rad: 'Dra. Laura Sánchez', radId: 'RAD-006', hospital: 'Hospital Traumatológico Ney Arias Lora', codigo: 'H-005', region: 'Ozama', mods: ['CT', 'MR'], fecha: '28/02/2025', carga: 174, capacidad: 180, estado: 'Activa', turno: 'Lunes a viernes · 14:00 - 22:00', email: 'l.sanchez@email.com', tel: '809-555-1252', sla: '4 horas' },
  { id: 'ASG-0160', rad: 'Dr. Luis Santana', radId: 'RAD-003', hospital: 'Hospital Dr. Alejandro Cabral', codigo: 'H-009', region: 'El Valle', mods: ['CT'], fecha: '14/03/2025', carga: 0, capacidad: 120, estado: 'Pendiente', turno: 'Por definir', email: 'l.santana@email.com', tel: '849-555-0621', sla: '8 horas' },
  { id: 'ASG-0133', rad: 'Dra. Claudia Jiménez', radId: 'RAD-008', hospital: 'Hospital Regional San Juan de la Maguana', codigo: 'H-008', region: 'El Valle', mods: ['MR'], fecha: '14/01/2025', carga: 64, capacidad: 140, estado: 'Suspendida', turno: 'Lunes a viernes · 08:00 - 16:00', email: 'c.jimenez@email.com', tel: '809-555-1672', sla: '8 horas' },
  { id: 'ASG-0148', rad: 'Dr. Rafael Pineda', radId: 'RAD-009', hospital: 'Hospital Regional Taiwán 19 de Marzo', codigo: 'H-007', region: 'Valdesia', mods: ['CT', 'RX'], fecha: '06/03/2025', carga: 109, capacidad: 160, estado: 'Activa', turno: 'Lunes a viernes · 08:00 - 16:00', email: 'r.pineda@email.com', tel: '829-555-1882', sla: '6 horas' },
  { id: 'ASG-0098', rad: 'Dr. Pedro Martínez', radId: 'RAD-007', hospital: 'Hospital Juan Pablo Pina', codigo: 'H-006', region: 'Valdesia', mods: ['US'], fecha: '03/11/2024', carga: 0, capacidad: 120, estado: 'Finalizada', turno: 'Finalizada el 28/02/2025', email: 'p.martinez@email.com', tel: '849-555-1462', sla: '8 horas' },
].map((a) => ({ ...a, estado: a.estado as Estado, ref: a.id }))

const MOCK_RADIOLOGOS = ['Dr. Carlos Méndez', 'Dra. Ana Rodríguez', 'Dr. Luis Santana', 'Dra. María Gómez', 'Dr. José Castillo', 'Dra. Laura Sánchez', 'Dr. Pedro Martínez', 'Dra. Claudia Jiménez', 'Dr. Rafael Pineda', 'Dra. Isabel Torres']
const MOCK_HOSPITALES = ['Hospital Pediátrico Hugo Mendoza', 'Hospital Dr. Marcelino Vélez', 'Hospital Padre Billini', 'Hospital Dr. Francisco Moscoso Puello', 'Hospital Traumatológico Ney Arias Lora', 'Hospital Juan Pablo Pina', 'Hospital Regional Taiwán 19 de Marzo', 'Hospital Regional San Juan de la Maguana', 'Hospital Dr. Alejandro Cabral', 'Hospital Regional Antonio Musa']
const MODS = ['RX', 'CT', 'MR', 'US', 'MG']
const SLAS = ['4 horas', '6 horas', '8 horas', '12 horas', '24 horas']
const HORARIOS = ['Lunes a viernes · 08:00 - 16:00', 'Lunes a viernes · 14:00 - 22:00', 'Guardia remota · 16:00 - 22:00', 'Fines de semana · 08:00 - 20:00', 'Cobertura 24/7']

const MOCK_COBERTURA = [
  { r: 'Metropolitana (Ozama)', h: 18, cub: 18, rad: 74 },
  { r: 'Norcentral (Cibao Central)', h: 9, cub: 8, rad: 31 },
  { r: 'Este', h: 7, cub: 6, rad: 18 },
  { r: 'Valdesia', h: 6, cub: 5, rad: 14 },
  { r: 'El Valle', h: 5, cub: 3, rad: 7 },
  { r: 'Enriquillo', h: 4, cub: 2, rad: 5 },
  { r: 'Nordeste', h: 5, cub: 4, rad: 11 },
  { r: 'Cibao Occidental', h: 4, cub: 3, rad: 8 },
]

const MOCK_PENDIENTES = [
  { h: 'Hospital Dr. Alejandro Cabral', m: ['CT'], f: '14/03/2025', p: 'Alta' },
  { h: 'Hospital Provincial de Azua', m: ['RX', 'US'], f: '13/03/2025', p: 'Media' },
  { h: 'Hospital Regional Jaime Mota', m: ['CT', 'MR'], f: '12/03/2025', p: 'Alta' },
  { h: 'Hospital San Vicente de Paúl', m: ['MG'], f: '11/03/2025', p: 'Baja' },
]

/** Regiones de salud para el filtro del demo (catálogo, no datos de ejemplo) */
const REGIONES_FILTRO = MOCK_COBERTURA.map((c) => c.r)

const DEMO: Datos = { asigs: MOCK_ASIGS, radiologos: [], hospitales: [], radDe: {}, hospDe: {} }
const SIN_DATOS: Datos = { asigs: [], radiologos: [], hospitales: [], radDe: {}, hospDe: {} }

const cargaColor = (p: number) => (p >= 90 ? '#ef4444' : p >= 75 ? '#f59e0b' : '#16a34a')
const porcentaje = (a: Asig) => (a.capacidad ? Math.round((a.carga / a.capacidad) * 100) : 0)
const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
const nombreMedico = (m?: { tratamiento?: string | null; nombre_completo?: string } | null) => (m ? `${m.tratamiento ?? 'Dr.'} ${m.nombre_completo}` : '—')

/* ---------------- Consulta (datos reales) ---------------- */
async function fetchAsignaciones(): Promise<Datos> {
  const hoy = new Date()
  const mesIni = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()
  const [a, m, h, e] = await Promise.all([
    supabase.from('asignaciones')
      .select('id, radiologo_id, hospital_id, modalidades, horario, sla_horas, carga_mensual_max, fecha_asignacion, fecha_fin, estado, created_at, medicos(codigo, tratamiento, nombre_completo, correo, tel_whatsapp), hospitales(codigo, nombre, provincias(region_salud))')
      .order('created_at', { ascending: false }),
    supabase.from('medicos').select('id, codigo, tratamiento, nombre_completo').eq('tipo', 'radiologo').eq('estado_registro', 'aprobado').order('nombre_completo'),
    supabase.from('hospitales').select('id, codigo, nombre, servicios, provincias(region_salud)').order('nombre'),
    // Estudios asignados este mes (carga de cada radiólogo en cada hospital)
    supabase.from('estudios').select('radiologo_id, hospital_id').not('radiologo_id', 'is', null).gte('asignado_en', mesIni),
  ])
  for (const r of [a, m, h, e]) if (r.error) throw new Error(r.error.message)
  const carga = new Map<string, number>()
  for (const x of (e.data ?? []) as { radiologo_id: string; hospital_id: string }[]) {
    const k = `${x.radiologo_id}|${x.hospital_id}`
    carga.set(k, (carga.get(k) ?? 0) + 1)
  }
  const radDe: Record<string, string> = {}, hospDe: Record<string, string> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const asigs: Asig[] = (a.data as any[]).map((x) => {
    radDe[x.id] = x.radiologo_id; hospDe[x.id] = x.hospital_id
    return {
      id: x.id, rad: nombreMedico(x.medicos), radId: x.medicos?.codigo ?? '—', hospital: x.hospitales?.nombre ?? '—',
      codigo: x.hospitales?.codigo ?? '—', region: x.hospitales?.provincias?.region_salud ?? '—', mods: x.modalidades ?? [],
      fecha: fFecha(x.fecha_asignacion), fin: x.fecha_fin ? fFecha(x.fecha_fin) : undefined,
      carga: carga.get(`${x.radiologo_id}|${x.hospital_id}`) ?? 0, capacidad: x.carga_mensual_max ?? 0,
      estado: ESTADO_DB[x.estado] ?? 'Pendiente', turno: x.horario || 'Por definir',
      email: x.medicos?.correo ?? '—', tel: x.medicos?.tel_whatsapp ?? '—', sla: x.sla_horas != null ? `${x.sla_horas} horas` : '—',
    }
  })
  return {
    asigs,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    radiologos: (m.data as any[]).map((r) => ({ id: r.id, nombre: `${nombreMedico(r)}${r.codigo ? ` (${r.codigo})` : ''}` })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hospitales: (h.data as any[]).map((x) => ({ id: x.id, nombre: x.nombre, codigo: x.codigo, region: x.provincias?.region_salud ?? 'Sin región', servicios: x.servicios ?? [] })),
    radDe, hospDe,
  }
}

/* ---------------- Panel lateral ---------------- */
function DetalleAsig({ a, real, onEstado, guardando, error }: {
  a: Asig; real: boolean; onEstado: (e: Estado) => void; guardando: boolean; error: string
}) {
  const p = porcentaje(a)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <UserSilhouette size={48} className="!bg-brand-600 [&_circle]:fill-white [&_path]:fill-white" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h3 className="text-[16px] font-bold text-ink">{a.rad}</h3><Badge tone={estadoTone[a.estado]} icon={a.estado === 'Activa'}>{a.estado}</Badge></div>
          <p className="text-[12px] text-slate-500">{a.radId}{a.ref && ` · Asignación ${a.ref}`}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-[#e6edf8] bg-[#f6f9fe] p-3">
        <Donut size={84} thickness={11} data={[{ label: 'Carga', value: a.carga, color: cargaColor(p) }, { label: 'Disponible', value: Math.max(0, a.capacidad - a.carga), color: '#e8eef8' }]}
          center={<span className="text-[15px] font-bold text-ink">{p}%</span>} />
        <div className="text-[12.5px]">
          <div className="font-semibold text-ink">Carga de estudios (mes)</div>
          <div className="text-slate-500">{a.carga} de {a.capacidad} estudios</div>
          <div className="mt-1 text-slate-500">SLA de respuesta: <b className="text-ink">{a.sla}</b></div>
        </div>
      </div>
      <div className="rounded-lg bg-[#f6f9fe] px-3 py-2">
        <InfoRow label="Hospital"><span className="font-medium">{a.hospital}</span></InfoRow>
        <InfoRow label="Código">{a.codigo}</InfoRow>
        <InfoRow label="Región">{a.region}</InfoRow>
        <InfoRow label="Modalidades">{a.mods.length ? <span className="flex gap-1">{a.mods.map((m) => <Modality key={m} m={m} />)}</span> : '—'}</InfoRow>
        <InfoRow label="Fecha de asignación">{a.fecha}</InfoRow>
        {a.fin && <InfoRow label="Fecha de fin">{a.fin}</InfoRow>}
        <InfoRow label="Horario">{a.turno}</InfoRow>
        <InfoRow label="Teléfono"><span className="flex items-center gap-1.5"><Phone size={13} />{a.tel}</span></InfoRow>
        <InfoRow label="Correo"><span className="flex items-center gap-1.5 break-all text-brand-600"><Mail size={13} className="shrink-0 text-ink" />{a.email}</span></InfoRow>
      </div>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</p>}
      {real ? (
        a.estado !== 'Finalizada' && (
          <div className="grid grid-cols-2 gap-2">
            {a.estado === 'Suspendida' || a.estado === 'Pendiente'
              ? <button disabled={guardando} onClick={() => onEstado('Activa')} className="btn-primary justify-center gap-1.5 disabled:opacity-60"><Check size={15} /> {guardando ? 'Guardando…' : 'Activar'}</button>
              : <button disabled={guardando} onClick={() => onEstado('Suspendida')} className="btn justify-center gap-1.5 border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-60"><X size={15} /> {guardando ? 'Guardando…' : 'Suspender'}</button>}
            <button disabled={guardando} onClick={() => onEstado('Finalizada')} className="btn-outline justify-center gap-1.5 disabled:opacity-60"><CalendarDays size={15} /> Finalizar</button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-outline justify-center gap-1.5"><CalendarDays size={15} /> Reprogramar</button>
          {a.estado === 'Suspendida' || a.estado === 'Pendiente'
            ? <button className="btn-primary justify-center gap-1.5"><Check size={15} /> Activar</button>
            : <button className="btn justify-center gap-1.5 border border-red-200 bg-white text-red-600 hover:bg-red-50"><X size={15} /> Suspender</button>}
        </div>
      )}
    </div>
  )
}

/** Formulario del modo demostración (sin guardar) */
function NuevaAsignacionDemo({ onDone }: { onDone: () => void }) {
  const [mods, setMods] = useState<string[]>(['CT'])
  const [ok, setOk] = useState(false)
  if (ok) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <CheckCircle2 size={48} className="text-emerald-500" />
        <h4 className="mt-2 text-[16px] font-bold text-ink">Asignación creada</h4>
        <p className="mt-1 text-[12.5px] text-slate-500">Se notificó al radiólogo y al hospital. La asignación queda <b>Pendiente</b> hasta su aceptación.</p>
        <button className="btn-primary mt-4" onClick={() => { setOk(false); onDone() }}>Ver detalle</button>
      </div>
    )
  }
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setOk(true) }}>
      <div><label className="label">Radiólogo <span className="text-red-500">*</span></label><Select placeholder="Seleccionar radiólogo" value="" options={MOCK_RADIOLOGOS} /></div>
      <div><label className="label">Hospital <span className="text-red-500">*</span></label><Select placeholder="Seleccionar hospital" value="" options={MOCK_HOSPITALES} /></div>
      <div>
        <label className="label">Modalidades <span className="text-red-500">*</span></label>
        <ModsPicker mods={mods} setMods={setMods} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Fecha de inicio</label><input type="date" className="input" defaultValue="2025-03-17" /></div>
        <div><label className="label">Fecha de fin</label><input type="date" className="input" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Capacidad mensual</label><input type="number" className="input" defaultValue={150} min={1} placeholder="Ej. 150" /></div>
        <div><label className="label">SLA de respuesta</label><Select options={SLAS} value="6 horas" /></div>
      </div>
      <div><label className="label">Horario / turno</label><Select options={HORARIOS} /></div>
      <div><label className="label">Observaciones</label><textarea className="input min-h-[64px] resize-y" placeholder="Notas para el hospital o el radiólogo..." /></div>
      <Checkbox checked label="Notificar al radiólogo y al hospital por correo" />
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onDone} className="btn-outline">Cancelar</button>
        <button type="submit" className="btn-primary gap-1.5"><Plus size={15} /> Crear asignación</button>
      </div>
    </form>
  )
}

function ModsPicker({ mods, setMods }: { mods: string[]; setMods: (m: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODS.map((m) => {
        const on = mods.includes(m)
        return (
          <button type="button" key={m} onClick={() => setMods(on ? mods.filter((x) => x !== m) : [...mods, m])}
            className={clsx('rounded-lg border px-3 py-1.5 text-[12px] font-bold transition', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#d7e1f2] bg-white text-ink hover:border-brand-400')}>{m}</button>
        )
      })}
    </div>
  )
}

/** Formulario real: guarda en `asignaciones` */
function NuevaAsignacionReal({ radiologos, hospitales, onGuardada, onVer, onCancel }: {
  radiologos: Opcion[]; hospitales: HospitalCob[]; onGuardada: () => void; onVer: (id: string) => void; onCancel: () => void
}) {
  const { sesion } = useSesion()
  const [rad, setRad] = useState('')
  const [hosp, setHosp] = useState('')
  const [mods, setMods] = useState<string[]>([])
  const [inicio, setInicio] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [fin, setFin] = useState('')
  const [capacidad, setCapacidad] = useState('')
  const [sla, setSla] = useState('6 horas')
  const [horario, setHorario] = useState(HORARIOS[0])
  const [estado, setEstado] = useState<'activa' | 'pendiente'>('activa')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [creada, setCreada] = useState<string | null>(null)

  if (creada) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <CheckCircle2 size={48} className="text-emerald-500" />
        <h4 className="mt-2 text-[16px] font-bold text-ink">Asignación creada</h4>
        <p className="mt-1 text-[12.5px] text-slate-500">La asignación quedó registrada como <b>{estado === 'activa' ? 'Activa' : 'Pendiente'}</b>.</p>
        <button className="btn-primary mt-4" onClick={() => onVer(creada)}>Ver detalle</button>
      </div>
    )
  }

  async function guardar() {
    if (!rad) return setError('Seleccione el radiólogo.')
    if (!hosp) return setError('Seleccione el hospital.')
    if (!mods.length) return setError('Seleccione al menos una modalidad.')
    if (fin && inicio && fin < inicio) return setError('La fecha de fin no puede ser anterior a la fecha de inicio.')
    const cap = capacidad ? Number(capacidad) : null
    if (cap !== null && (!Number.isFinite(cap) || cap < 1)) return setError('La capacidad mensual debe ser mayor que cero.')
    setGuardando(true); setError('')
    const fila: Record<string, unknown> = {
      radiologo_id: rad, hospital_id: hosp, modalidades: mods, horario, sla_horas: parseInt(sla, 10),
      fecha_asignacion: inicio || undefined, fecha_fin: fin || null, estado, creado_por: sesion?.userId ?? null,
    }
    if (cap !== null) fila.carga_mensual_max = cap
    const { data, error: e } = await supabase.from('asignaciones').insert(fila).select('id').single()
    setGuardando(false)
    if (e) {
      setError(e.code === '23505' ? 'Ese radiólogo ya tiene una asignación en ese hospital.' : `No se pudo crear la asignación: ${e.message}`)
      return
    }
    setCreada((data as { id: string }).id)
    onGuardada()
  }

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); guardar() }}>
      <div>
        <label className="label">Radiólogo <span className="text-red-500">*</span></label>
        <select className={clsx('input', !rad && 'text-slate-400')} value={rad} onChange={(e) => setRad(e.target.value)}>
          <option value="">{radiologos.length ? 'Seleccionar radiólogo' : 'No hay radiólogos aprobados'}</option>
          {radiologos.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Hospital <span className="text-red-500">*</span></label>
        <select className={clsx('input', !hosp && 'text-slate-400')} value={hosp} onChange={(e) => setHosp(e.target.value)}>
          <option value="">{hospitales.length ? 'Seleccionar hospital' : 'No hay hospitales registrados'}</option>
          {hospitales.map((h) => <option key={h.id} value={h.id}>{h.nombre}{h.codigo ? ` (${h.codigo})` : ''}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Modalidades <span className="text-red-500">*</span></label>
        <ModsPicker mods={mods} setMods={setMods} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Fecha de inicio</label><input type="date" className="input" value={inicio} onChange={(e) => setInicio(e.target.value)} /></div>
        <div><label className="label">Fecha de fin</label><input type="date" className="input" value={fin} min={inicio} onChange={(e) => setFin(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Capacidad mensual</label><input type="number" className="input" min={1} value={capacidad} onChange={(e) => setCapacidad(e.target.value)} placeholder="Ej. 150" /></div>
        <div><label className="label">SLA de respuesta</label><Select options={SLAS} value={sla} onChange={setSla} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Horario / turno</label><Select options={HORARIOS} value={horario} onChange={setHorario} /></div>
        <div><label className="label">Estado inicial</label><Select options={['Activa', 'Pendiente']} value="Activa" onChange={(v) => setEstado(v === 'Pendiente' ? 'pendiente' : 'activa')} /></div>
      </div>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-600" role="alert">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-outline">Cancelar</button>
        <button type="submit" disabled={guardando} className="btn-primary gap-1.5 disabled:opacity-60"><Plus size={15} /> {guardando ? 'Guardando…' : 'Crear asignación'}</button>
      </div>
    </form>
  )
}

/* ---------------- Página ---------------- */
export default function Asignaciones() {
  const navigate = useNavigate()
  const { datos, cargando, error, recargar, real } = useDatos(fetchAsignaciones, VACIO ? SIN_DATOS : DEMO)
  const ASIGS = datos.asigs
  const [sel, setSel] = useState(MOCK_ASIGS[0].id)
  const [tab, setTab] = useState(0)
  const [q, setQ] = useState('')
  const [fHosp, setFHosp] = useState('Todos')
  const [fMod, setFMod] = useState('Todas')
  const [fRegion, setFRegion] = useState('Todas')
  const [estado, setEstado] = useState('Todos')
  const [page, setPage] = useState(1)
  const [fk, setFk] = useState(0)
  const [exp, setExp] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errEstado, setErrEstado] = useState('')

  const rows = useMemo(() => ASIGS.filter((a) => {
    if (estado !== 'Todos' && a.estado !== estado) return false
    if (!real) return true // el demo solo filtra por estado (como antes)
    const t = `${a.rad} ${a.radId} ${a.hospital} ${a.codigo}`.toLowerCase()
    return (!q || t.includes(q.toLowerCase()))
      && (fHosp === 'Todos' || a.hospital === fHosp)
      && (fMod === 'Todas' || a.mods.includes(fMod))
      && (fRegion === 'Todas' || a.region === fRegion)
  }), [ASIGS, estado, real, q, fHosp, fMod, fRegion])

  const totalPages = Math.max(1, Math.ceil(rows.length / POR_PAGINA))
  const pagina = Math.min(page, totalPages)
  const visibles = real ? rows.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA) : rows
  const filtrar = (fn: (v: string) => void) => (v: string) => { fn(v); setPage(1) }
  const actual = ASIGS.find((a) => a.id === sel) ?? ASIGS[0]

  /* ---- Indicadores y cobertura (datos reales) ---- */
  const calc = useMemo(() => {
    const activas = ASIGS.filter((a) => a.estado === 'Activa')
    const radActivos = new Set(activas.map((a) => datos.radDe[a.id]))
    const hospActivos = new Set(activas.map((a) => datos.hospDe[a.id]))
    const hospPendientes = new Set(ASIGS.filter((a) => a.estado === 'Pendiente').map((a) => datos.hospDe[a.id]))
    const conCap = activas.filter((a) => a.capacidad > 0)
    const cargaProm = conCap.length ? Math.round(conCap.reduce((s, a) => s + porcentaje(a), 0) / conCap.length) : null
    const regiones = uniq(datos.hospitales.map((h) => h.region)).map((r) => {
      const hs = datos.hospitales.filter((h) => h.region === r)
      const ids = new Set(hs.map((h) => h.id))
      return {
        r, h: hs.length, cub: hs.filter((h) => hospActivos.has(h.id)).length,
        rad: new Set(activas.filter((a) => ids.has(datos.hospDe[a.id])).map((a) => datos.radDe[a.id])).size,
      }
    })
    const sinCobertura = datos.hospitales.filter((h) => !hospActivos.has(h.id)).map((h) => ({ ...h, pendiente: hospPendientes.has(h.id) }))
    return {
      activas: activas.length, pendientes: ASIGS.filter((a) => a.estado === 'Pendiente').length,
      sinAsignar: datos.radiologos.filter((r) => !radActivos.has(r.id)).length, cubiertos: hospActivos.size, cargaProm, regiones, sinCobertura,
    }
  }, [ASIGS, datos])

  const opcHosp = real ? ['Todos', ...uniq(ASIGS.map((a) => a.hospital))] : ['Todos', ...MOCK_HOSPITALES]
  const opcMod = real ? ['Todas', ...uniq(ASIGS.flatMap((a) => a.mods))] : ['Todas', ...MODS]
  const opcRegion = real ? ['Todas', ...uniq(ASIGS.map((a) => a.region))] : ['Todas', ...REGIONES_FILTRO]
  const opcEstado = real ? ['Todos', ...(['Activa', 'Pendiente', 'Suspendida', 'Finalizada'] as Estado[]).filter((e) => ASIGS.some((a) => a.estado === e))] : ['Todos', 'Activa', 'Pendiente', 'Suspendida', 'Finalizada']

  async function cambiarEstado(a: Asig, nuevo: Estado) {
    setGuardando(true); setErrEstado('')
    const cambios: Record<string, unknown> = { estado: ESTADO_A_DB[nuevo] }
    if (nuevo === 'Finalizada') cambios.fecha_fin = new Date().toLocaleDateString('en-CA')
    const { error: e } = await supabase.from('asignaciones').update(cambios).eq('id', a.id).select('id').single()
    setGuardando(false)
    if (e) { setErrEstado(`No se pudo actualizar la asignación: ${e.message}`); return }
    await recargar()
  }

  const limpiar = () => { setFk(fk + 1); setEstado('Todos'); setQ(''); setFHosp('Todos'); setFMod('Todas'); setFRegion('Todas'); setPage(1) }
  const kpiVal = (v: string | number) => (cargando ? '…' : v)

  return (
    <div>
      <PageHeader
        icon={CalendarCheck}
        title="Asignaciones"
        subtitle="Gestión de asignaciones de radiólogos a hospitales de la red"
        actions={
          <>
            <button onClick={() => setTab(1)} className="btn-primary gap-2"><Plus size={17} /> Nueva asignación</button>
            <button onClick={() => navigate('/admin/radiologos')} className="btn-outline gap-2"><Hospital size={16} /> Ver radiólogos</button>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {VACIO ? (
          <>
            <Kpi icon={CalendarCheck} tone="blue" value={kpiVal(calc.activas)} label="Asignaciones activas" sub={`${pct(calc.activas, ASIGS.length)} del total`} />
            <Kpi icon={UserRoundX} tone="orange" value={kpiVal(calc.sinAsignar)} label="Radiólogos sin asignar" sub={`de ${datos.radiologos.length} radiólogos aprobados`} />
            <Kpi icon={Building2} tone="green" value={kpiVal(`${calc.cubiertos} / ${datos.hospitales.length}`)} label="Hospitales con cobertura" sub={`${pct(calc.cubiertos, datos.hospitales.length)} de la red`} />
            <Kpi icon={Clock} tone="purple" value={kpiVal(calc.pendientes)} label="Asignaciones pendientes" sub="Por activar" />
            <Kpi icon={GaugeIcon} tone="teal" value={kpiVal(calc.cargaProm === null ? '—' : `${calc.cargaProm}%`)} label="Carga promedio" sub={calc.cargaProm === null ? 'Sin asignaciones activas' : 'de la capacidad asignada (mes)'} />
          </>
        ) : (
          <>
            <Kpi icon={CalendarCheck} tone="blue" value="214" label="Asignaciones activas" sub="9% vs. mes anterior" trend="up" />
            <Kpi icon={UserRoundX} tone="orange" value="56" label="Radiólogos sin asignar" sub="19.5% del total" />
            <Kpi icon={Building2} tone="green" value="49 / 58" label="Hospitales con cobertura" sub="84.5% de la red" />
            <Kpi icon={Clock} tone="purple" value="17" label="Solicitudes pendientes" sub="5 con prioridad alta" />
            <Kpi icon={GaugeIcon} tone="teal" value="78%" label="Carga promedio" sub="de la capacidad asignada" />
          </>
        )}
      </div>

      {/* Filtros */}
      <div key={fk} className="card mt-3 grid grid-cols-1 items-end gap-3 px-4 py-3.5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
        {real ? (
          <label className="relative flex items-center">
            <svg className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input className="input pl-9" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Buscar por radiólogo, hospital o código..." />
          </label>
        ) : <SearchInput placeholder="Buscar por radiólogo, hospital o código..." />}
        <div><label className="label">Hospital</label><Select key={`h${opcHosp.length}`} options={opcHosp} onChange={filtrar(setFHosp)} /></div>
        <div><label className="label">Modalidad</label><Select key={`m${opcMod.length}`} options={opcMod} onChange={filtrar(setFMod)} /></div>
        <div><label className="label">Región</label><Select key={`r${opcRegion.length}`} options={opcRegion} onChange={filtrar(setFRegion)} /></div>
        <div><label className="label">Estado</label><Select key={`e${opcEstado.length}`} options={opcEstado} onChange={filtrar(setEstado)} /></div>
        <button onClick={limpiar} className="btn-outline justify-center px-10">Limpiar</button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-3 xl:col-span-8">
          <Panel title="Listado de asignaciones" subtitle={`${real ? rows.length : rows.length === ASIGS.length ? 248 : rows.length} asignaciones encontradas`} bodyClass="px-0 pb-0">
            <Table>
              <thead className="bg-[#f6f9fe]">
                <tr>{['Radiólogo', 'Hospital', 'Modalidades', 'Fecha de asignación', 'Carga de estudios', 'Estado', ''].map((x) => <th key={x} className="th">{x}</th>)}</tr>
              </thead>
              <tbody>
                {cargando && <tr><td colSpan={7} className="td py-8 text-center text-slate-400">Cargando asignaciones…</td></tr>}
                {!cargando && error && (
                  <tr><td colSpan={7} className="td py-8 text-center text-red-600">No se pudieron cargar las asignaciones: {error} <button onClick={recargar} className="ml-2 font-semibold text-brand-600 hover:underline">Reintentar</button></td></tr>
                )}
                {!cargando && !error && visibles.map((a) => {
                  const p = porcentaje(a)
                  return (
                    <tr key={a.id} onClick={() => { setSel(a.id); setTab(0); setErrEstado('') }} className={clsx('tr cursor-pointer', a.id === actual?.id && tab === 0 && '!bg-brand-50 shadow-[inset_3px_0_0_#0b57f0]')}>
                      <td className="td">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <UserSilhouette size={26} className="!bg-brand-600 [&_circle]:fill-white [&_path]:fill-white" />
                          <div><div className="font-semibold text-ink">{a.rad}</div><div className="text-[11px] text-slate-500">{a.radId}</div></div>
                        </div>
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Building2 size={15} /></span>
                          <div><div className="whitespace-nowrap text-ink">{a.hospital}</div><div className="text-[11px] text-slate-500">{a.codigo} · {a.region}</div></div>
                        </div>
                      </td>
                      <td className="td"><span className="flex gap-1">{a.mods.map((m) => <Modality key={m} m={m} />)}</span></td>
                      <td className="td whitespace-nowrap">{a.fecha}</td>
                      <td className="td min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <Bar value={a.carga} max={a.capacidad || 1} color={cargaColor(p)} height={7} className="rounded-full" />
                          <span className="w-9 shrink-0 text-right tabular-nums text-ink">{p}%</span>
                        </div>
                        <div className="text-[10.5px] text-slate-500">{a.carga} / {a.capacidad} estudios</div>
                      </td>
                      <td className="td"><Badge tone={estadoTone[a.estado]} icon={a.estado === 'Activa'}>{a.estado}</Badge></td>
                      <td className="td" onClick={(e) => e.stopPropagation()}><DotsButton /></td>
                    </tr>
                  )
                })}
                {!cargando && !error && rows.length === 0 && <tr><td colSpan={7} className="td py-6 text-center text-slate-400">{VACIO && ASIGS.length === 0 ? 'Aún no hay asignaciones registradas' : 'No hay asignaciones con esos filtros'}</td></tr>}
              </tbody>
            </Table>
            {real
              ? <Pagination text={rows.length ? `Mostrando ${(pagina - 1) * POR_PAGINA + 1} a ${Math.min(pagina * POR_PAGINA, rows.length)} de ${rows.length} asignaciones` : 'Mostrando 0 de 0 asignaciones'} page={pagina} onPage={setPage} totalPages={totalPages} perPage={false} />
              : <Pagination text="Mostrando 1 a 10 de 248 asignaciones" pages={[1, 2, 3, 4, 5]} last={25} />}
          </Panel>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
            <Panel title="Cobertura por región" icon={MapPinned} subtitle="Hospitales con al menos un radiólogo asignado" action={<MoreLink onClick={() => navigate('/admin/operaciones')}>Ver mapa</MoreLink>} bodyClass="px-0 pb-2">
              <Table>
                <thead className="bg-[#f6f9fe]"><tr>{['Región de salud', 'Hospitales', 'Con cobertura', 'Radiólogos', 'Cobertura'].map((x) => <th key={x} className="th">{x}</th>)}</tr></thead>
                <tbody>
                  {(real ? calc.regiones : MOCK_COBERTURA).map((c) => {
                    const p = c.h ? Math.round((c.cub / c.h) * 100) : 0
                    return (
                      <tr key={c.r} className="tr">
                        <td className="td whitespace-nowrap font-medium text-ink">{c.r}</td>
                        <td className="td text-center">{c.h}</td>
                        <td className="td text-center">{c.cub}</td>
                        <td className="td text-center">{c.rad}</td>
                        <td className="td min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <Bar value={p} color={p === 100 ? '#16a34a' : p >= 75 ? '#2f6bff' : '#f59e0b'} height={7} className="rounded-full" />
                            <span className="w-9 shrink-0 text-right tabular-nums text-ink">{p}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {real && !cargando && calc.regiones.length === 0 && <tr><td colSpan={5} className="td py-6 text-center text-slate-400">Sin datos de cobertura aún</td></tr>}
                </tbody>
              </Table>
            </Panel>
            {real ? (
              <Panel title="Hospitales sin cobertura" icon={Clock} subtitle="Sin radiólogo con asignación activa">
                <ul className="scroll-soft max-h-[300px] divide-y divide-[#eef2f8] overflow-y-auto">
                  {calc.sinCobertura.map((h) => (
                    <li key={h.id} className="flex items-center gap-2.5 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500"><Building2 size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-semibold text-ink">{h.nombre}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">{h.servicios.map((m) => <Modality key={m} m={m} className="!py-0 !text-[10px]" />)} {h.servicios.length > 0 && '·'} {h.region}</div>
                      </div>
                      <Badge tone={h.pendiente ? 'orange' : 'red'}>{h.pendiente ? 'Pendiente' : 'Sin radiólogo'}</Badge>
                    </li>
                  ))}
                  {!cargando && calc.sinCobertura.length === 0 && <li className="py-6 text-center text-[12.5px] text-slate-400">{datos.hospitales.length ? 'Todos los hospitales tienen cobertura' : 'Aún no hay hospitales registrados'}</li>}
                </ul>
                <button onClick={() => setTab(1)} className="btn-outline mt-2 w-full justify-center gap-1.5 text-[12.5px]"><Plus size={15} /> Asignar radiólogo</button>
              </Panel>
            ) : (
              <Panel title="Hospitales sin cobertura" icon={Clock} subtitle="Solicitudes de radiólogo pendientes" action={<MoreLink>Ver todas</MoreLink>}>
                <ul className="divide-y divide-[#eef2f8]">
                  {MOCK_PENDIENTES.map((p) => (
                    <li key={p.h} className="flex items-center gap-2.5 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500"><Building2 size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-semibold text-ink">{p.h}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">{p.m.map((m) => <Modality key={m} m={m} className="!py-0 !text-[10px]" />)} · {p.f}</div>
                      </div>
                      <Badge tone={p.p === 'Alta' ? 'red' : p.p === 'Media' ? 'orange' : 'gray'}>{p.p}</Badge>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setTab(1)} className="btn-outline mt-2 w-full justify-center gap-1.5 text-[12.5px]"><Plus size={15} /> Asignar radiólogo</button>
              </Panel>
            )}
          </div>
        </div>

        <section className="card self-start xl:col-span-4">
          <Tabs className="mx-4 mt-2" size="md" tabs={[{ label: 'Detalle de asignación', icon: CalendarCheck }, { label: 'Nueva asignación', icon: Plus }]} active={tab} onChange={setTab} />
          <div className="p-4">
            {tab === 0
              ? (actual
                ? <DetalleAsig a={actual} real={real} guardando={guardando} error={errEstado} onEstado={(e) => cambiarEstado(actual, e)} />
                : <div className="py-10 text-center text-[12.5px] text-slate-400">{cargando ? 'Cargando…' : 'Sin registros. Crea una asignación para ver aquí su detalle.'}</div>)
              : real
                ? <NuevaAsignacionReal radiologos={datos.radiologos} hospitales={datos.hospitales} onCancel={() => setTab(0)}
                  onGuardada={recargar} onVer={(id) => { setSel(id); setTab(0) }} />
                : <NuevaAsignacionDemo onDone={() => setTab(0)} />}
          </div>
        </section>
      </div>
    </div>
  )
}
