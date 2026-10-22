import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Archive, Building2, CheckCircle2, CircleCheck, Clock, Crosshair, EllipsisVertical, Hospital, House, Info,
  MapPin, Megaphone, Pause, Pencil, Plus, Settings, Star, Users, X, type LucideIcon,
} from 'lucide-react'
import {
  Badge, IconCircle, Kpi, Modality, PageHeader, Pagination, Panel, Select, Table, Tabs, clsx, type Tone,
} from '../../components/ui'
import { MOD_DESCRIPCION, fFecha, fFechaHora, pct, supabaseConfigurado, useDatos } from '../../lib/admin-data'
import { supabase } from '../../lib/supabase'
import { ConvocatoriaWizard } from './ConvocatoriaWizard'

/** En producción (Supabase configurado) la pantalla muestra los datos reales de la base */
const VACIO = supabaseConfigurado
const POR_PAGINA = 10

/* ---------------- Tipos ---------------- */
type Estado = 'Borrador' | 'Activa' | 'En evaluación' | 'Cerrada' | 'En pausa' | 'Cancelada'

/** Aplicante real (postulación + médico) */
type Aplicante = { id: string; nombre: string; codigo: string; esp: string[]; rating: number | null; hosp: number; estado: string; fecha: string }

/** Datos adicionales de una convocatoria real */
type ConvReal = {
  codigo: string; regionesInteres: string[]; modalidadServicio: string[]; posiciones: number; tipo: string
  ratingMin: number | null; experienciaMin: string | null; requisitos: Record<string, unknown>; condiciones: Record<string, unknown>
  canales: string[]; asunto: string; mensaje: string; publicadaEn: string | null; creada: string; actualizada: string
  cierre: string | null; cierrePasado: boolean; aplicantes: Aplicante[]
}

type Conv = {
  id: string; titulo: string; hospital: string; hospitalLines: [string, string?]; esp: string[]; region: string
  inicio: string; limite: string; postulaciones: number; estado: Estado; icon: LucideIcon; iconColor: string
  provincia: string; descripcion: string; aplicaA: string; criterios: string[]; rating: number
  real?: ConvReal
}

const ESP_NOMBRE: Record<string, string> = {
  CT: 'Tomografía Computarizada', MR: 'Resonancia Magnética', US: 'Ultrasonido', RX: 'Radiografía Convencional', MG: 'Mamografía',
}

const ESTADO_DB: Record<string, Estado> = {
  borrador: 'Borrador', activa: 'Activa', en_evaluacion: 'En evaluación', en_pausa: 'En pausa', cerrada: 'Cerrada', cancelada: 'Cancelada',
}
const ESTADO_A_DB: Record<Estado, string> = {
  Borrador: 'borrador', Activa: 'activa', 'En evaluación': 'en_evaluacion', 'En pausa': 'en_pausa', Cerrada: 'cerrada', Cancelada: 'cancelada',
}
const APLICA_TXT: Record<string, string> = {
  todos: 'Todos los médicos radiólogos', sin_hospital: 'Solo médicos sin hospitales asignados',
  un_hospital: 'Solo médicos con un hospital asignado', dos_o_mas: 'Solo médicos con 2 o más hospitales asignados',
}
const SERVICIO_TXT: Record<string, string> = { teleradiologia: 'Teleradiología', presencial: 'Presencial', hibrido: 'Híbrido' }
const POSTULACION_TXT: Record<string, { t: string; tone: Tone }> = {
  aplicada: { t: 'Aplicada', tone: 'blue' }, preseleccionada: { t: 'Preseleccionada', tone: 'green' }, aceptada: { t: 'Aceptada', tone: 'green' },
  rechazada: { t: 'No seleccionada', tone: 'red' }, retirada: { t: 'Retirada', tone: 'gray' },
}

/** Divide el nombre del hospital en dos líneas (como en el diseño) */
function partir(nombre: string): [string, string?] {
  const p = nombre.split(' ')
  if (p.length < 3) return [nombre]
  const mitad = Math.ceil(p.length / 2)
  return [p.slice(0, mitad).join(' '), p.slice(mitad).join(' ')]
}

const textos = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') as string[] : [])

/* ---------------- Consulta (datos reales) ---------------- */
async function fetchConvocatorias(): Promise<Conv[]> {
  const { data, error } = await supabase.from('convocatorias')
    .select('id, codigo, titulo, modalidad_servicio, descripcion, posiciones, tipo_contratacion, aplica_a, regiones_interes, rating_minimo, experiencia_minima, especialidades, requisitos, condiciones, fecha_inicio, fecha_cierre, canales, asunto_mensaje, mensaje, estado, publicada_en, created_at, updated_at, hospitales(nombre, provincias(nombre, region_salud)), postulaciones(id, estado, created_at, medicos(codigo, tratamiento, nombre_completo, especialidades, rating, asignaciones(estado)))')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((c) => {
    const h = c.hospitales
    const req = (c.requisitos ?? {}) as Record<string, unknown>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aplicantes: Aplicante[] = (c.postulaciones ?? []).map((p: any) => ({
      id: p.id, nombre: p.medicos ? `${p.medicos.tratamiento ?? 'Dr.'} ${p.medicos.nombre_completo}` : '—', codigo: p.medicos?.codigo ?? '',
      esp: p.medicos?.especialidades ?? [], rating: p.medicos?.rating != null ? Number(p.medicos.rating) : null,
      hosp: (p.medicos?.asignaciones ?? []).filter((a: { estado: string }) => a.estado === 'activa').length,
      estado: p.estado, fecha: fFecha(p.created_at),
    }))
    const ratings = aplicantes.map((a) => a.rating).filter((r): r is number => r !== null)
    const hospital = h?.nombre ?? 'Red nacional'
    return {
      id: c.id, titulo: c.titulo, hospital, hospitalLines: partir(hospital), esp: c.especialidades ?? [],
      region: (c.regiones_interes ?? []).join(', ') || h?.provincias?.region_salud || 'Todas',
      inicio: fFecha(c.fecha_inicio), limite: fFecha(c.fecha_cierre), postulaciones: aplicantes.length,
      estado: ESTADO_DB[c.estado] ?? 'Borrador', icon: Building2, iconColor: 'text-brand-600',
      provincia: h?.provincias?.nombre ?? '—', descripcion: c.descripcion ?? '', aplicaA: APLICA_TXT[c.aplica_a] ?? c.aplica_a,
      criterios: [...textos(req.lista), ...(c.experiencia_minima ? [`Experiencia mínima: ${c.experiencia_minima}`] : [])],
      rating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0,
      real: {
        codigo: c.codigo, regionesInteres: c.regiones_interes ?? [], modalidadServicio: c.modalidad_servicio ?? [], posiciones: c.posiciones,
        tipo: c.tipo_contratacion ?? '', ratingMin: c.rating_minimo != null ? Number(c.rating_minimo) : null, experienciaMin: c.experiencia_minima,
        requisitos: req, condiciones: (c.condiciones ?? {}) as Record<string, unknown>, canales: c.canales ?? [],
        asunto: c.asunto_mensaje ?? '', mensaje: c.mensaje ?? '', publicadaEn: c.publicada_en, creada: c.created_at, actualizada: c.updated_at,
        cierre: c.fecha_cierre, cierrePasado: !!c.fecha_cierre && new Date(c.fecha_cierre + 'T23:59:59') < new Date(), aplicantes,
      },
    }
  })
}

const MOCK_CONVS: Conv[] = [
  { id: '1', titulo: 'Radiólogo para Tomografía', hospital: 'Hospital Pediátrico Hugo Mendoza', hospitalLines: ['Hospital Pediátrico', 'Hugo Mendoza'], esp: ['CT'], region: 'Sur', inicio: '01/03/2025', limite: '20/03/2025', postulaciones: 12, estado: 'Activa', icon: Building2, iconColor: 'text-violet-600', provincia: 'Santo Domingo, DN', descripcion: 'Se requiere médico radiólogo con experiencia en tomografía para cubrir la lectura de estudios en el Hospital Pediátrico Hugo Mendoza. Modalidad teleradiología. Turnos rotativos.', aplicaA: 'Todos los médicos radiólogos', criterios: ['Experiencia mínima de 2 años', 'Disponibilidad inmediata'], rating: 4.6 },
  { id: '2', titulo: 'Radiólogos para área de Ultrasonido', hospital: 'Hospital Dr. Marcelino Vélez', hospitalLines: ['Hospital Dr. Marcelino', 'Vélez'], esp: ['US'], region: 'Este', inicio: '05/03/2025', limite: '25/03/2025', postulaciones: 8, estado: 'En evaluación', icon: CheckCircle2, iconColor: 'text-emerald-600', provincia: 'Santo Domingo Oeste', descripcion: 'Se requieren médicos radiólogos con experiencia en ultrasonido general y obstétrico para cubrir turnos en el área de imágenes.', aplicaA: 'Solo médicos sin hospitales asignados', criterios: ['Experiencia mínima de 1 año', 'Certificación en ultrasonido'], rating: 4.4 },
  { id: '3', titulo: 'Resonancia Magnética', hospital: 'Hospital Regional Taiwán 19 de Marzo', hospitalLines: ['Hospital Regional', 'Taiwán 19 de Marzo'], esp: ['MR'], region: 'Norte', inicio: '20/02/2025', limite: '10/03/2025', postulaciones: 22, estado: 'Cerrada', icon: MapPin, iconColor: 'text-orange-500', provincia: 'Azua', descripcion: 'Lectura remota de estudios de resonancia magnética de neuro y musculoesquelético.', aplicaA: 'Todos los médicos radiólogos', criterios: ['Experiencia mínima de 3 años'], rating: 4.7 },
  { id: '4', titulo: 'Radiografía General', hospital: 'Hospital Dr. Francisco Moscoso Puello', hospitalLines: ['Hospital Dr. Francisco', 'Moscoso Puello'], esp: ['RX'], region: 'SurEste', inicio: '15/03/2025', limite: '30/03/2025', postulaciones: 6, estado: 'En pausa', icon: Building2, iconColor: 'text-brand-600', provincia: 'Santo Domingo, DN', descripcion: 'Cobertura de lectura de radiografía convencional para emergencias y consulta externa.', aplicaA: 'Solo médicos con un hospital asignado', criterios: ['Disponibilidad nocturna'], rating: 4.3 },
  { id: '5', titulo: 'Ultrasonido y Doppler', hospital: 'Hospital Regional San Juan de la Maguana', hospitalLines: ['Hospital Regional', 'San Juan de la Maguana'], esp: ['US'], region: 'Oeste', inicio: '10/03/2025', limite: '31/03/2025', postulaciones: 18, estado: 'Activa', icon: MapPin, iconColor: 'text-amber-500', provincia: 'San Juan', descripcion: 'Se requiere radiólogo con experiencia en Doppler vascular para atención presencial e híbrida.', aplicaA: 'Todos los médicos radiólogos', criterios: ['Experiencia en Doppler vascular'], rating: 4.5 },
  { id: '6', titulo: 'Neurorradiología', hospital: 'Centro Médico Real', hospitalLines: ['Centro Médico Real'], esp: ['MR', 'CT'], region: 'Todos', inicio: '01/01/2025', limite: '28/02/2025', postulaciones: 25, estado: 'Cerrada', icon: Crosshair, iconColor: 'text-red-500', provincia: 'Santo Domingo, DN', descripcion: 'Neurorradiólogo para lectura de estudios de cerebro y columna en CT y MR.', aplicaA: 'Todos los médicos radiólogos', criterios: ['Subespecialidad en neurorradiología'], rating: 4.8 },
  { id: '7', titulo: 'Pediatría Radiológica', hospital: 'Hospital Infantil Dr. Robert Reid Cabral', hospitalLines: ['Hospital Infantil', 'Dr. Robert Reid Cabral'], esp: ['CT', 'US'], region: 'Sur', inicio: '18/02/2025', limite: '10/03/2025', postulaciones: 10, estado: 'Cerrada', icon: House, iconColor: 'text-emerald-600', provincia: 'Santo Domingo, DN', descripcion: 'Radiólogo pediatra para estudios de tomografía y ultrasonido en población infantil.', aplicaA: 'Todos los médicos radiólogos', criterios: ['Experiencia en pediatría'], rating: 4.6 },
  { id: '8', titulo: 'Intervencionismo', hospital: 'Hospital Dr. Ney Arias Lora', hospitalLines: ['Hospital Dr. Ney Arias Lora'], esp: ['CT'], region: 'Este', inicio: '05/03/2025', limite: '25/03/2025', postulaciones: 4, estado: 'Cancelada', icon: Building2, iconColor: 'text-violet-600', provincia: 'Santo Domingo Norte', descripcion: 'Radiólogo intervencionista para procedimientos guiados por tomografía.', aplicaA: 'Solo médicos con 2 o más hospitales asignados', criterios: ['Certificación en intervencionismo'], rating: 4.2 },
  { id: '9', titulo: 'Mamografía Diagnóstica', hospital: 'Instituto Nacional del Cáncer Rosa Emilia S.', hospitalLines: ['Instituto Nacional', 'del Cáncer Rosa Emilia S.'], esp: ['MG'], region: 'Todos', inicio: '01/03/2025', limite: '20/03/2025', postulaciones: 9, estado: 'Activa', icon: Crosshair, iconColor: 'text-red-500', provincia: 'Santo Domingo, DN', descripcion: 'Lectura de mamografías de tamizaje y diagnósticas con reporte BI-RADS.', aplicaA: 'Todos los médicos radiólogos', criterios: ['Experiencia en mamografía', 'Disponibilidad inmediata'], rating: 4.5 },
  { id: '10', titulo: 'Tomografía y Resonancia', hospital: 'Hospital Regional Antonio Musa', hospitalLines: ['Hospital Regional', 'Antonio Musa'], esp: ['CT', 'MR'], region: 'Norte', inicio: '10/03/2025', limite: '05/04/2025', postulaciones: 7, estado: 'En evaluación', icon: Megaphone, iconColor: 'text-emerald-600', provincia: 'San Pedro de Macorís', descripcion: 'Cobertura de lectura de tomografía y resonancia para el servicio de emergencias.', aplicaA: 'Todos los médicos radiólogos', criterios: ['Experiencia mínima de 2 años'], rating: 4.4 },
]

/** Total mostrado en el listado (el demo simula 18 convocatorias) */
const TOTAL_DEMO = 18

const ESTADO_STYLE: Record<Estado, { tone: Tone; cls: string; icon: LucideIcon }> = {
  'Borrador': { tone: 'gray', cls: 'bg-slate-100 text-slate-600', icon: Pencil },
  'Activa': { tone: 'green', cls: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  'En evaluación': { tone: 'blue', cls: 'bg-brand-50 text-brand-700', icon: CheckCircle2 },
  'Cerrada': { tone: 'gray', cls: 'bg-slate-100 text-slate-600', icon: CircleCheck },
  'En pausa': { tone: 'orange', cls: 'bg-orange-50 text-orange-600', icon: Pause },
  'Cancelada': { tone: 'red', cls: 'bg-red-50 text-red-600', icon: X },
}

function EstadoPill({ estado, className }: { estado: Estado; className?: string }) {
  const s = ESTADO_STYLE[estado]
  const Icon = s.icon
  return (
    <span className={clsx('inline-flex w-[92px] items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11.5px] font-medium', s.cls, className)}>
      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-current">
        <Icon size={9} strokeWidth={3} className="text-white" />
      </span>
      {estado}
    </span>
  )
}

const MOCK_APLICANTES = [
  { n: 'Dra. María López', esp: 'Neurorradiología', exp: '8 años', rating: 4.9, hosp: 0, estado: 'Preseleccionado' },
  { n: 'Dr. Carlos Méndez', esp: 'Radiología General', exp: '6 años', rating: 4.8, hosp: 1, estado: 'En revisión' },
  { n: 'Dra. Ana Rodríguez', esp: 'Imagenología', exp: '5 años', rating: 4.7, hosp: 0, estado: 'En revisión' },
  { n: 'Dr. Luis Vargas', esp: 'Radiología Torácica', exp: '4 años', rating: 4.6, hosp: 0, estado: 'Nuevo' },
  { n: 'Dra. Sofía Méndez', esp: 'Mamas / Imagen', exp: '3 años', rating: 4.6, hosp: 1, estado: 'Nuevo' },
  { n: 'Dr. Miguel Santos', esp: 'Abdominal', exp: '7 años', rating: 4.5, hosp: 0, estado: 'Nuevo' },
]

const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))

/* ---------------- Página ---------------- */
export default function Convocatorias() {
  const [params, setParams] = useSearchParams()
  const [wizard, setWizard] = useState(params.get('nueva') === '1')
  const { datos: CONVS, cargando, error, recargar, real } = useDatos(fetchConvocatorias, MOCK_CONVS)
  const [sel, setSel] = useState('1')
  const [tab, setTab] = useState(0)
  const [q, setQ] = useState('')
  const [fEstado, setFEstado] = useState('Todos')
  const [fEsp, setFEsp] = useState('Todas')
  const [fRegion, setFRegion] = useState('Todas')
  const [page, setPage] = useState(1)
  const [estados, setEstados] = useState<Record<string, Estado>>({})
  const [accion, setAccion] = useState('')
  const [errAccion, setErrAccion] = useState('')

  const list = useMemo(() => CONVS.filter((c) => {
    const text = `${c.titulo} ${c.hospital} ${c.esp.join(' ')} ${c.region} ${c.real?.codigo ?? ''}`.toLowerCase()
    return (!q || text.includes(q.toLowerCase()))
      && (fEstado === 'Todos' || (estados[c.id] ?? c.estado) === fEstado)
      && (fEsp === 'Todas' || c.esp.includes(fEsp))
      && (fRegion === 'Todas' || (real ? c.region.split(', ').includes(fRegion) : c.region === fRegion))
  }), [CONVS, q, fEstado, fEsp, fRegion, estados, real])

  // Paginación (solo con datos reales; el demo muestra su listado completo)
  const totalPages = Math.max(1, Math.ceil(list.length / POR_PAGINA))
  const pagina = Math.min(page, totalPages)
  const visibles = real ? list.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA) : list
  const filtrar = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(1) }

  // Opciones de filtros: derivadas de los datos en producción
  const opcEstado = real ? ['Todos', ...(Object.keys(ESTADO_STYLE) as Estado[]).filter((e) => CONVS.some((c) => c.estado === e))] : ['Todos', 'Activa', 'En evaluación', 'En pausa', 'Cerrada', 'Cancelada']
  const opcEsp = real ? ['Todas', ...uniq(CONVS.flatMap((c) => c.esp))] : ['Todas', 'CT', 'MR', 'RX', 'US', 'MG']
  const opcRegion = real ? ['Todas', ...uniq(CONVS.flatMap((c) => c.region.split(', ')))] : ['Todas', 'Norte', 'Sur', 'Este', 'Oeste', 'SurEste', 'Todos']

  const conv: Conv | undefined = CONVS.find((c) => c.id === sel) ?? CONVS[0]
  const estado: Estado = conv ? estados[conv.id] ?? conv.estado : 'Activa'
  const cuenta = (e: Estado) => CONVS.filter((c) => c.estado === e).length

  const closeWizard = () => {
    setWizard(false)
    if (params.get('nueva')) { params.delete('nueva'); setParams(params, { replace: true }) }
  }

  /** Pausar / Reanudar / Archivar / Publicar: en producción actualiza el estado en la base */
  async function cambiarEstado(nuevo: Estado) {
    if (!conv) return
    if (!real) { setEstados({ ...estados, [conv.id]: nuevo }); return }
    setAccion(nuevo); setErrAccion('')
    const cambios: Record<string, unknown> = { estado: ESTADO_A_DB[nuevo] }
    if (nuevo === 'Activa' && !conv.real?.publicadaEn) cambios.publicada_en = new Date().toISOString()
    const { error: e } = await supabase.from('convocatorias').update(cambios).eq('id', conv.id).select('id').single()
    setAccion('')
    if (e) { setErrAccion(`No se pudo actualizar el estado: ${e.message}`); return }
    await recargar()
  }

  const totalTxt = real ? list.length : list.length === CONVS.length ? TOTAL_DEMO : list.length
  const cerrada = estado === 'Cerrada' || estado === 'Cancelada'

  return (
    <>
      <PageHeader
        icon={Megaphone}
        title="Convocatoria de radiólogos"
        subtitle="Gestión de convocatorias para asignación de médicos radiólogos a hospitales y centros de salud"
        actions={<button className="btn-primary px-5 py-2.5" onClick={() => setWizard(true)}><Plus size={18} /> Nueva convocatoria</button>}
      />

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {VACIO ? (
          <>
            <Kpi icon={Megaphone} tone="blue" value={cargando ? '…' : CONVS.length} label="Convocatorias totales" sub={cuenta('Borrador') ? `${cuenta('Borrador')} en borrador` : 'Registradas en la red'} />
            <Kpi icon={CircleCheck} tone="green" value={cargando ? '…' : cuenta('Activa')} label="Activas" sub={`${pct(cuenta('Activa'), CONVS.length)} del total`} />
            <Kpi icon={Clock} tone="orange" value={cargando ? '…' : cuenta('En evaluación')} label="En evaluación" sub={`${pct(cuenta('En evaluación'), CONVS.length)} del total`} />
            <Kpi icon={Pause} tone="yellow" value={cargando ? '…' : cuenta('En pausa')} label="En pausa" sub={`${pct(cuenta('En pausa'), CONVS.length)} del total`} />
            <Kpi icon={CircleCheck} tone="gray" value={cargando ? '…' : cuenta('Cerrada')} label="Cerradas" sub={`${pct(cuenta('Cerrada'), CONVS.length)} del total`} />
            <Kpi icon={X} tone="red" value={cargando ? '…' : cuenta('Cancelada')} label="Canceladas" sub={`${pct(cuenta('Cancelada'), CONVS.length)} del total`} />
          </>
        ) : (
          <>
            <Kpi icon={Megaphone} tone="blue" value="18" label="Convocatorias totales" sub={<><b className="font-medium">25%</b><span className="text-slate-500"> vs. mes anterior</span></>} trend="up" />
            <Kpi icon={CircleCheck} tone="green" value="7" label="Activas" sub="38.9% del total" />
            <Kpi icon={Clock} tone="orange" value="4" label="En evaluación" sub="22.2% del total" />
            <Kpi icon={Pause} tone="yellow" value="3" label="En pausa" sub="16.7% del total" />
            <Kpi icon={CircleCheck} tone="gray" value="3" label="Cerradas" sub="16.7% del total" />
            <Kpi icon={X} tone="red" value="1" label="Cancelada" sub="5.6% del total" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Listado */}
        <section className="card min-w-0 xl:col-span-7">
          <div className="flex items-start gap-3 px-4 pt-4">
            <Clock size={30} className="mt-0.5 shrink-0 text-brand-600" />
            <div>
              <h3 className="text-[16px] font-bold text-ink">Listado de convocatorias</h3>
              <p className="text-[12px] text-slate-500">{totalTxt} convocatorias encontradas</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2.5 px-4 pb-3 pt-2 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:items-end">
            <label className="relative flex items-center sm:col-span-2 lg:col-span-1">
              <svg className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} className="input pl-9 text-[12px]" placeholder="Buscar por título, hospital, especialidad, región..." />
            </label>
            <div><span className="label text-[11.5px]">Estado</span><Select key={`e${opcEstado.length}`} options={opcEstado} onChange={filtrar(setFEstado)} /></div>
            <div><span className="label text-[11.5px]">Especialidad</span><Select key={`m${opcEsp.length}`} options={opcEsp} onChange={filtrar(setFEsp)} /></div>
            <div><span className="label text-[11.5px]">Región</span><Select key={`r${opcRegion.length}`} options={opcRegion} onChange={filtrar(setFRegion)} /></div>
          </div>
          <Table className="[&_.td]:px-2 [&_.th]:px-2">
            <thead>
              <tr className="bg-[#f6f9fe]">
                <th className="th !pl-4" colSpan={2}>Título</th>
                <th className="th">Hospital / Centro</th>
                <th className="th">Especialidad</th>
                <th className="th">Región</th>
                <th className="th">Fecha inicio</th>
                <th className="th">Fecha límite</th>
                <th className="th">Postulaciones</th>
                <th className="th">Estado</th>
                <th className="th !pr-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan={10} className="td py-8 text-center text-slate-400">Cargando convocatorias…</td></tr>}
              {!cargando && error && (
                <tr><td colSpan={10} className="td py-8 text-center text-red-600">No se pudieron cargar las convocatorias: {error} <button onClick={recargar} className="ml-2 font-semibold text-brand-600 hover:underline">Reintentar</button></td></tr>
              )}
              {!cargando && !error && visibles.map((c) => {
                const Icon = c.icon
                const active = c.id === conv?.id
                return (
                  <tr key={c.id} onClick={() => { setSel(c.id); setTab(0); setErrAccion('') }}
                    className={clsx('tr cursor-pointer', active && '!bg-brand-50/70 outline outline-1 -outline-offset-1 outline-brand-300')}>
                    <td className="td w-8 !pl-4 !pr-0"><Icon size={18} className={c.iconColor} /></td>
                    <td className="td min-w-[128px] max-w-[160px] pl-2 text-[11.5px] font-medium leading-tight text-ink">{c.titulo}</td>
                    <td className="td whitespace-nowrap text-[11px] leading-tight">{c.hospitalLines[0]}{c.hospitalLines[1] && <><br />{c.hospitalLines[1]}</>}</td>
                    <td className="td"><div className="flex gap-1">{c.esp.map((e) => <Modality key={e} m={e} />)}</div></td>
                    <td className="td">{c.region}</td>
                    <td className="td">{c.inicio}</td>
                    <td className="td">{c.limite}</td>
                    <td className="td text-center">{c.postulaciones}</td>
                    <td className="td"><EstadoPill estado={estados[c.id] ?? c.estado} /></td>
                    <td className="td !pr-4 text-right">
                      <button onClick={(e) => e.stopPropagation()} className="rounded p-1 text-brand-700 hover:bg-brand-50" aria-label="Acciones"><EllipsisVertical size={16} /></button>
                    </td>
                  </tr>
                )
              })}
              {!cargando && !error && list.length === 0 && <tr><td colSpan={10} className="td py-8 text-center text-slate-400">{VACIO && CONVS.length === 0 ? 'Aún no hay convocatorias registradas' : 'No se encontraron convocatorias con los filtros seleccionados.'}</td></tr>}
            </tbody>
          </Table>
          {real
            ? <Pagination text={list.length ? `Mostrando ${(pagina - 1) * POR_PAGINA + 1} a ${Math.min(pagina * POR_PAGINA, list.length)} de ${list.length} convocatorias` : 'Mostrando 0 de 0 convocatorias'} page={pagina} onPage={setPage} totalPages={totalPages} perPage={false} />
            : <Pagination text={`Mostrando 1 a ${Math.min(10, list.length)} de ${list.length === CONVS.length ? TOTAL_DEMO : list.length} convocatorias`} pages={[1, 2]} />}
        </section>

        {/* Detalle */}
        <section className="card min-w-0 xl:col-span-5">
          {!conv ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 px-4 py-10 text-center text-[12.5px] text-slate-400">
              <Hospital size={28} className="text-slate-300" />
              {cargando ? 'Cargando…' : 'Sin registros. Crea una convocatoria para ver aquí su detalle.'}
            </div>
          ) : (<>
          <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Hospital size={24} /></span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[17px] font-bold leading-tight text-ink">{conv.titulo}</h3>
                  <Badge tone={ESTADO_STYLE[estado].tone} icon>{estado}</Badge>
                </div>
                <p className="text-[12px] text-brand-800/80">{conv.real && <>{conv.real.codigo}<span className="mx-1.5 text-slate-300">|</span></>}{conv.hospital} <span className="mx-1.5 text-slate-300">|</span> {conv.provincia}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {!real && <button className="btn-primary px-3 py-1.5 text-[12px]" onClick={() => setWizard(true)}><Pencil size={14} /> Editar</button>}
              {estado === 'Borrador' ? (
                <button disabled={!!accion} className="btn-primary px-3 py-1.5 text-[12px] disabled:opacity-60" onClick={() => cambiarEstado('Activa')}>
                  <CheckCircle2 size={14} /> {accion === 'Activa' ? 'Publicando…' : 'Publicar'}
                </button>
              ) : (
                <button disabled={!!accion || (real && cerrada)} className="btn border border-orange-300 bg-white px-3 py-1.5 text-[12px] text-orange-500 hover:bg-orange-50 disabled:opacity-50"
                  onClick={() => cambiarEstado(estado === 'En pausa' ? 'Activa' : 'En pausa')}>
                  <Pause size={14} /> {accion === 'En pausa' || accion === 'Activa' ? 'Guardando…' : estado === 'En pausa' ? 'Reanudar' : 'Pausar'}
                </button>
              )}
              <button disabled={!!accion || (real && cerrada)} className="btn border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                onClick={() => cambiarEstado('Cerrada')}><Archive size={14} /> {accion === 'Cerrada' ? 'Archivando…' : 'Archivar'}</button>
            </div>
          </div>
          {errAccion && <p className="mx-4 mt-2 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-600">{errAccion}</p>}

          <Tabs className="mx-4 mt-3" size="md" active={tab} onChange={setTab}
            tabs={['Resumen', `Aplicantes (${conv.postulaciones})`, 'Criterios', 'Comunicaciones', 'Historial']} />

          <div className="p-4">
            {tab === 0 && <Resumen conv={conv} estado={estado} />}
            {tab === 1 && <Aplicantes conv={conv} />}
            {tab === 2 && <Criterios conv={conv} />}
            {tab === 3 && <Comunicaciones conv={conv} />}
            {tab === 4 && <Historial conv={conv} />}
          </div>
          </>)}
        </section>
      </div>

      <ConvocatoriaWizard open={wizard} onClose={closeWizard} onGuardada={recargar} />
    </>
  )
}

/* ---------------- Sub-secciones del detalle ---------------- */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-[#eef2f8] py-1.5 last:border-0">
      <div className="text-[12px] text-ink/80">{label}</div>
      <div className="mt-0.5 text-[12px] text-slate-500">{children}</div>
    </div>
  )
}

function Vacio({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-[#d7e1f2] px-3 py-8 text-center text-[12.5px] text-slate-400">{children}</div>
}

function Resumen({ conv, estado }: { conv: Conv; estado: Estado }) {
  const steps = ['Publicada', 'Recepción de aplicantes', 'Evaluación', 'Asignación']
  const current = estado === 'Activa' || estado === 'En pausa' ? 1 : estado === 'En evaluación' ? 2 : estado === 'Cerrada' ? 3 : 0
  const r = conv.real
  // Con datos reales: aplicantes con y sin hospital asignado (asignaciones activas del médico)
  const sinHosp = r ? r.aplicantes.filter((a) => a.hosp === 0).length : Math.round(conv.postulaciones * (2 / 3))
  const conHosp = conv.postulaciones - sinHosp
  const fechaPub = r ? (r.publicadaEn ? fFecha(r.publicadaEn) : '—') : conv.inicio
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#e6edf8] p-3">
        <h4 className="mb-1 flex items-center gap-2 text-[14px] font-bold text-ink"><Hospital size={18} className="text-brand-600" /> Información general</h4>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[1.45fr_1fr]">
          <div>
            <Field label="Título de la convocatoria">{conv.titulo}</Field>
            <Field label="Hospital / Centro">{conv.hospital}</Field>
            <Field label="Especialidad(es)">{conv.esp.length ? <span className="flex gap-1">{conv.esp.map((e) => <Modality key={e} m={e} />)}</span> : '—'}</Field>
            <Field label="Región">{conv.region}</Field>
            <Field label="Aplica a">{conv.aplicaA}</Field>
            {r && <Field label="Modalidad de servicio">{r.modalidadServicio.map((m) => SERVICIO_TXT[m] ?? m).join(', ') || '—'}</Field>}
          </div>
          <div className="sm:border-l sm:border-[#eef2f8] sm:pl-4">
            <Field label="Estado"><Badge tone={ESTADO_STYLE[estado].tone} icon>{estado}</Badge></Field>
            <Field label="Fecha de inicio">{conv.inicio}</Field>
            <Field label="Fecha límite">{conv.limite}</Field>
            <Field label="Postulaciones recibidas">{conv.postulaciones}</Field>
            {r && <Field label="Posiciones / contratación">{r.posiciones}{r.tipo && ` · ${r.tipo}`}</Field>}
            <Field label="Criterios adicionales">{conv.criterios.length ? conv.criterios.map((c) => <div key={c}>{c}</div>) : '—'}</Field>
          </div>
        </div>
        <Field label="Descripción"><span className="leading-snug">{conv.descripcion || '—'}</span></Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-xl border border-[#e6edf8] p-3">
          <h4 className="mb-2 text-[13.5px] font-bold text-ink">Especialidades requeridas</h4>
          <div className="space-y-2">
            {conv.esp.map((e) => (
              <div key={e} className="flex items-center gap-2 rounded-lg border border-[#eef2f8] p-1.5 text-[11.5px] text-slate-600">
                <Modality m={e} /> {ESP_NOMBRE[e] ?? MOD_DESCRIPCION[e] ?? e}
              </div>
            ))}
            {conv.esp.length === 0 && <p className="text-[11.5px] text-slate-400">Sin especialidades definidas</p>}
          </div>
        </div>
        <div className="rounded-xl border border-[#e6edf8] p-3">
          <h4 className="mb-3 text-[13.5px] font-bold text-ink">Estado de la convocatoria</h4>
          <div className="relative grid grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-[7px] h-[2px] bg-slate-200" />
            <div className="absolute left-[12.5%] top-[7px] h-[2px] bg-brand-500" style={{ width: `${(current / 3) * 75}%` }} />
            {steps.map((s, i) => (
              <div key={s} className="relative flex flex-col items-center text-center">
                <span className={clsx('h-4 w-4 rounded-full border-2 border-white shadow',
                  i === 0 ? (estado === 'Borrador' ? 'bg-slate-300' : 'bg-emerald-600') : i <= current ? 'bg-brand-500 ring-2 ring-brand-200' : 'bg-slate-300')} />
                <span className={clsx('mt-1.5 text-[10.5px] leading-tight', i <= current ? 'text-ink' : 'text-slate-500')}>{s}</span>
                {i === 0 && <span className="text-[10px] text-slate-500">{fechaPub}</span>}
                {i === 1 && <span className="text-[10px] text-slate-500">{conv.inicio} - {conv.limite}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#e6edf8] p-3">
        <h4 className="mb-2 flex items-center gap-2 text-[14px] font-bold text-ink"><Settings size={18} className="text-brand-600" /> Estadísticas rápidas</h4>
        <div className="grid grid-cols-2 gap-2 2xl:grid-cols-4">
          <QuickStat icon={Users} tone="blue" value={conv.postulaciones} l1="Aplicantes" l2="Hasta la fecha" />
          {r ? (<>
            <QuickStat icon={Hospital} tone="green" value={sinHosp} l1="Sin hospital asignado" l2={pct(sinHosp, conv.postulaciones)} l2Class="text-emerald-600" />
            <QuickStat icon={CircleCheck} tone="orange" value={conHosp} l1="Con hospital asignado" l2={pct(conHosp, conv.postulaciones)} l2Class="text-orange-500" />
            <QuickStat icon={Star} tone="purple" value={conv.rating ? conv.rating.toFixed(1) : '—'} l1="Rating promedio" l2="de los aplicantes" />
          </>) : (<>
            <QuickStat icon={Hospital} tone="green" value={sinHosp} l1="Sin hospital asignado" l2="66.7%" l2Class="text-emerald-600" />
            <QuickStat icon={CircleCheck} tone="orange" value={conHosp} l1="Sin hospital asignado" l2="33.3%" l2Class="text-orange-500" />
            <QuickStat icon={Star} tone="purple" value={conv.rating} l1="Rating promedio" l2="de los aplicantes" />
          </>)}
        </div>
      </div>
    </div>
  )
}

function QuickStat({ icon, tone, value, l1, l2, l2Class }: { icon: LucideIcon; tone: Tone; value: ReactNode; l1: string; l2: string; l2Class?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#eef2f8] p-2">
      <IconCircle icon={icon} tone={tone} size="sm" />
      <div className="min-w-0 leading-tight">
        <div className="text-[16px] font-bold text-ink">{value}</div>
        <div className="text-[10.5px] text-slate-500">{l1}</div>
        <div className={clsx('text-[10.5px] text-slate-500', l2Class)}>{l2}</div>
      </div>
    </div>
  )
}

function Aplicantes({ conv }: { conv: Conv }) {
  const r = conv.real
  if (r) {
    if (r.aplicantes.length === 0) return <Vacio>Aún no hay postulaciones para esta convocatoria.</Vacio>
    return (
      <div className="rounded-xl border border-[#e6edf8]">
        <Table>
          <thead><tr className="bg-[#f6f9fe]"><th className="th">Radiólogo</th><th className="th">Especialidad</th><th className="th">Postulación</th><th className="th">Rating</th><th className="th">Hospitales</th><th className="th">Estado</th></tr></thead>
          <tbody>
            {r.aplicantes.map((a) => {
              const e = POSTULACION_TXT[a.estado] ?? { t: a.estado, tone: 'gray' as Tone }
              return (
                <tr key={a.id} className="tr">
                  <td className="td"><div className="font-medium text-ink">{a.nombre}</div>{a.codigo && <div className="text-[11px] text-slate-500">{a.codigo}</div>}</td>
                  <td className="td">{a.esp.length ? <span className="flex flex-wrap gap-1">{a.esp.map((m) => <Modality key={m} m={m} />)}</span> : '—'}</td>
                  <td className="td whitespace-nowrap">{a.fecha}</td>
                  <td className="td">{a.rating !== null ? <span className="inline-flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400" />{a.rating.toFixed(1)}</span> : '—'}</td>
                  <td className="td">{a.hosp}</td>
                  <td className="td"><Badge tone={e.tone}>{e.t}</Badge></td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        <p className="border-t border-[#eef2f8] px-3 py-2 text-[11.5px] text-slate-500">{r.aplicantes.length} aplicante{r.aplicantes.length === 1 ? '' : 's'}</p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-[#e6edf8]">
      <Table>
        <thead><tr className="bg-[#f6f9fe]"><th className="th">Radiólogo</th><th className="th">Especialidad</th><th className="th">Experiencia</th><th className="th">Rating</th><th className="th">Hospitales</th><th className="th">Estado</th></tr></thead>
        <tbody>
          {MOCK_APLICANTES.slice(0, Math.min(MOCK_APLICANTES.length, conv.postulaciones)).map((a) => (
            <tr key={a.n} className="tr">
              <td className="td font-medium text-ink">{a.n}</td>
              <td className="td">{a.esp}</td>
              <td className="td">{a.exp}</td>
              <td className="td"><span className="inline-flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400" />{a.rating}</span></td>
              <td className="td">{a.hosp}</td>
              <td className="td"><Badge tone={a.estado === 'Preseleccionado' ? 'green' : a.estado === 'Nuevo' ? 'blue' : 'orange'}>{a.estado}</Badge></td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="border-t border-[#eef2f8] px-3 py-2 text-[11.5px] text-slate-500">Mostrando {Math.min(6, conv.postulaciones)} de {conv.postulaciones} aplicantes</p>
    </div>
  )
}

const PESOS_DEMO = [['Experiencia profesional', 30], ['Rating histórico', 25], ['Disponibilidad de horario', 20], ['Entrevista / Evaluación', 15], ['Otros (certificaciones, formación, etc.)', 10]] as const

function Criterios({ conv }: { conv: Conv }) {
  const r = conv.real
  // Con datos reales, la ponderación sale de requisitos.ponderacion ([{ criterio, peso }]) guardada por el asistente
  const pesos: readonly (readonly [string, number])[] = r
    ? (Array.isArray(r.requisitos.ponderacion) ? r.requisitos.ponderacion as { criterio?: unknown; peso?: unknown }[] : [])
      .filter((p) => typeof p.criterio === 'string' && typeof p.peso === 'number').map((p) => [p.criterio as string, p.peso as number] as const)
    : PESOS_DEMO
  const extras = r ? [
    r.ratingMin !== null && `Rating mínimo: ${r.ratingMin.toFixed(1)}`,
    r.regionesInteres.length > 0 && `Regiones de interés: ${r.regionesInteres.join(', ')}`,
    typeof r.requisitos.nivel === 'string' && `Nivel profesional: ${r.requisitos.nivel}`,
  ].filter(Boolean) as string[] : []
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Panel title="Criterios adicionales" className="shadow-none" bodyClass="space-y-2">
        {[...conv.criterios, ...extras].map((c) => <div key={c} className="flex items-center gap-2 text-[12.5px] text-ink"><CheckCircle2 size={15} className="text-emerald-600" />{c}</div>)}
        <div className="flex items-center gap-2 text-[12.5px] text-ink"><Info size={15} className="text-brand-600" />Aplica a: {conv.aplicaA}</div>
      </Panel>
      <Panel title="Ponderación de evaluación" className="shadow-none" bodyClass="space-y-2">
        {pesos.map(([l, v]) => (
          <div key={l} className="text-[12px]">
            <div className="mb-0.5 flex justify-between text-ink/90"><span>{l}</span><b>{v}%</b></div>
            <div className="h-2 rounded bg-[#e8eef8]"><div className="h-2 rounded bg-brand-500" style={{ width: `${Math.min(100, v * 3)}%` }} /></div>
          </div>
        ))}
        {pesos.length === 0 && <p className="py-4 text-center text-[12px] text-slate-400">Sin ponderación definida</p>}
      </Panel>
    </div>
  )
}

const CANAL_TXT: Record<string, string> = { email: 'Correo electrónico', portal: 'Notificación en el Portal', whatsapp: 'WhatsApp' }

function Comunicaciones({ conv }: { conv: Conv }) {
  const r = conv.real
  if (r) {
    const notif = (r.condiciones.notificaciones ?? {}) as Record<string, unknown>
    const canales = [...r.canales, ...(notif.whatsapp === true ? ['whatsapp'] : [])]
    const recordatorio = typeof notif.recordatorio === 'string' ? notif.recordatorio : ''
    if (!r.asunto && !r.mensaje && canales.length === 0) return <Vacio>Esta convocatoria no tiene comunicaciones configuradas.</Vacio>
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[#e6edf8] p-3">
          <Field label="Asunto">{r.asunto || '—'}</Field>
          <Field label="Mensaje"><span className="whitespace-pre-line leading-snug">{r.mensaje || '—'}</span></Field>
          {recordatorio && <Field label="Recordatorio">{recordatorio}</Field>}
        </div>
        <ul className="divide-y divide-[#eef2f8] rounded-xl border border-[#e6edf8]">
          {canales.map((c) => (
            <li key={c} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[12.5px]">
              <div className="font-medium text-ink">{CANAL_TXT[c] ?? c}</div>
              <Badge tone="green" icon>Canal seleccionado</Badge>
            </li>
          ))}
          {canales.length === 0 && <li className="px-3 py-4 text-center text-[12px] text-slate-400">Sin canales de notificación</li>}
        </ul>
      </div>
    )
  }
  const items = [
    { c: 'Correo electrónico', d: `${conv.inicio} 10:24 a. m.`, t: 'Notificación de nueva convocatoria', n: 342 },
    { c: 'WhatsApp', d: `${conv.inicio} 10:25 a. m.`, t: 'Notificación de nueva convocatoria', n: 298 },
    { c: 'Notificación en el Portal', d: `${conv.inicio} 10:25 a. m.`, t: 'Nueva convocatoria disponible', n: 412 },
    { c: 'Correo electrónico', d: `${conv.limite} 08:00 a. m.`, t: 'Recordatorio: 1 día antes del cierre', n: 0 },
  ]
  return (
    <ul className="divide-y divide-[#eef2f8] rounded-xl border border-[#e6edf8]">
      {items.map((i, k) => (
        <li key={k} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[12.5px]">
          <div><div className="font-medium text-ink">{i.t}</div><div className="text-[11.5px] text-slate-500">{i.c} · {i.d}</div></div>
          {i.n ? <Badge tone="green" icon>{i.n} enviados</Badge> : <Badge tone="orange">Programado</Badge>}
        </li>
      ))}
    </ul>
  )
}

function Historial({ conv }: { conv: Conv }) {
  const r = conv.real
  const items = r
    ? [
      { k: 'c', d: fFechaHora(r.creada), t: r.publicadaEn ? 'Convocatoria creada' : 'Convocatoria creada como borrador', u: '' },
      ...(r.publicadaEn ? [{ k: 'p', d: fFechaHora(r.publicadaEn), t: 'Convocatoria publicada', u: '' }] : []),
      ...(r.actualizada && Math.abs(new Date(r.actualizada).getTime() - new Date(r.creada).getTime()) > 60000
        ? [{ k: 'a', d: fFechaHora(r.actualizada), t: `Última actualización (estado: ${conv.estado})`, u: '' }] : []),
      ...(r.cierre ? [{ k: 'f', d: fFecha(r.cierre), t: r.cierrePasado ? 'Cierre de recepción de aplicantes' : 'Cierre de recepción de aplicantes (programado)', u: '' }] : []),
    ]
    : [
      { k: '1', d: `${conv.inicio} 10:24 a. m.`, t: 'Convocatoria publicada', u: 'Juan Pérez' },
      { k: '2', d: `${conv.inicio} 10:22 a. m.`, t: 'Convocatoria creada como borrador', u: 'Juan Pérez' },
      { k: '3', d: `${conv.inicio} 10:25 a. m.`, t: 'Notificaciones enviadas a médicos radiólogos', u: 'Sistema' },
      { k: '4', d: `${conv.limite} 11:59 p. m.`, t: 'Cierre de recepción de aplicantes (programado)', u: 'Sistema' },
    ]
  return (
    <ol className="relative ml-2 space-y-4 border-l-2 border-brand-100 pl-5">
      {items.map((i) => (
        <li key={i.k} className="relative text-[12.5px]">
          <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500 shadow" />
          <div className="font-medium text-ink">{i.t}</div>
          <div className="text-[11.5px] text-slate-500">{i.d}{i.u && ` · ${i.u}`}</div>
        </li>
      ))}
    </ol>
  )
}
