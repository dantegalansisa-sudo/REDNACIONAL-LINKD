import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigurado } from './supabase'

/* =====================================================================
 * Consultas del panel de administración (Dashboard, Hospitales, Pacientes,
 * Radiólogos y Médicos referidores). Todas respetan las políticas RLS:
 * el personal del SNS (admin, coordinador, operador) puede leer todo.
 * Sin Supabase configurado, las pantallas usan sus datos de ejemplo.
 * ===================================================================== */

export { supabaseConfigurado }

/* ------------------------------- Utilidades ------------------------------- */

/** dd/mm/aaaa */
export const fFecha = (iso?: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
  return d.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
/** dd/mm/aaaa hh:mm */
export const fFechaHora = (iso?: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${fFecha(iso)} ${d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}`
}
/** "Hace 12 min" / "Hace 3 horas" / "Hace 2 días" */
export const hace = (iso?: string | null) => {
  if (!iso) return ''
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'Hace un momento'
  if (s < 3600) return `Hace ${Math.round(s / 60)} min`
  if (s < 86400) { const h = Math.round(s / 3600); return `Hace ${h} hora${h === 1 ? '' : 's'}` }
  const d = Math.round(s / 86400); return `Hace ${d} día${d === 1 ? '' : 's'}`
}
export const edad = (iso?: string | null) => {
  if (!iso) return 0
  const n = new Date(iso + 'T12:00:00'), h = new Date()
  let e = h.getFullYear() - n.getFullYear()
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--
  return e
}
/** 00115678901 → 001-1567890-1 */
export const fCedula = (doc?: string | null) => (doc && /^\d{11}$/.test(doc) ? doc.replace(/^(\d{3})(\d{7})(\d)$/, '$1-$2-$3') : doc ?? '—')
export const pct = (parte: number, total: number) => (total ? `${((parte / total) * 100).toFixed(1)}%` : '0%')
export const num = (n: number) => n.toLocaleString('en-US')

/** Nombres de modalidades en la base (CT, MR…) ↔ etiquetas en pantalla (TC, RM…) */
export const MOD_ETIQUETA: Record<string, string> = { CT: 'TC', MR: 'RM', RX: 'RX', US: 'US', MG: 'MG', PET: 'PET', NM: 'NM', XA: 'XA', OTROS: 'Otros' }
export const MOD_DESCRIPCION: Record<string, string> = {
  CT: 'Tomografía Computarizada', MR: 'Resonancia Magnética', RX: 'Radiografía', US: 'Ecografía', MG: 'Mamografía',
  PET: 'PET', NM: 'Medicina Nuclear', XA: 'Angiografía', OTROS: 'Otros',
}
export const ESTADO_ESTUDIO: Record<string, string> = {
  nuevo: 'Nuevo', asignado: 'Asignado', en_lectura: 'En lectura', informado: 'Informado', en_revision: 'En revisión', cancelado: 'Cancelado',
}

/**
 * Carga datos reales cuando Supabase está configurado; si no, devuelve los de ejemplo.
 * `recargar` vuelve a consultar (después de crear o editar).
 */
export function useDatos<T>(consulta: () => Promise<T>, ejemplo: T, deps: unknown[] = []) {
  const [datos, setDatos] = useState<T>(supabaseConfigurado ? (Array.isArray(ejemplo) ? ([] as unknown as T) : ejemplo) : ejemplo)
  const [cargando, setCargando] = useState(supabaseConfigurado)
  const [error, setError] = useState('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recargar = useCallback(async () => {
    if (!supabaseConfigurado) return
    setCargando(true); setError('')
    try { setDatos(await consulta()) } catch (e) { setError((e as Error).message ?? String(e)) } finally { setCargando(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { recargar() }, [recargar])
  return { datos, cargando, error, recargar, real: supabaseConfigurado }
}

const unwrap = <T,>(r: { data: T | null; error: { message: string } | null }): T => {
  if (r.error) throw new Error(r.error.message)
  return r.data as T
}

/* ------------------------------- Hospitales ------------------------------- */

export type EstadoHospital = 'Activo' | 'En proceso' | 'Inactivo'
const ESTADO_HOSP: Record<string, EstadoHospital> = { activo: 'Activo', en_proceso: 'En proceso', inactivo: 'Inactivo' }
export const ESTADO_HOSP_DB: Record<EstadoHospital, string> = { Activo: 'activo', 'En proceso': 'en_proceso', Inactivo: 'inactivo' }

export type HospitalReal = {
  id: string; nombre: string; tipo: string; codigo: string; sigla: string; provincia: string; provinciaId: number | null; region: string
  municipio: string; nivel: 'I' | 'II' | 'III'; estado: EstadoHospital; direccion: string; telefono: string; email: string; director: string
  registro: string; actualizado: string; servicios: string[]
  equipos: { modalidad: string; marca: string | null; modelo: string | null; serial: string | null; estado: string }[]
  linkconnect: { estado: string; version: string | null; aetitle: string | null; integracion_hl7: boolean; ultima_conexion: string | null } | null
  estudios: number
}

export async function fetchHospitales(): Promise<HospitalReal[]> {
  const rows = unwrap(await supabase.from('hospitales')
    .select('id, codigo, sigla, nombre, tipo, nivel, municipio, direccion, telefono, correo, director, servicios, estado, created_at, updated_at, provincia_id, provincias(nombre, region_salud), equipos_imagen(modalidad, marca, modelo, serial, estado), linkconnect_nodos(estado, version, aetitle, integracion_hl7, ultima_conexion), estudios(count)')
    .order('codigo'))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map((h) => ({
    id: h.id, nombre: h.nombre, tipo: h.tipo ?? '', codigo: h.codigo, sigla: h.sigla ?? '', provincia: h.provincias?.nombre ?? '—',
    provinciaId: h.provincia_id, region: h.provincias?.region_salud ?? '', municipio: h.municipio ?? '—', nivel: (h.nivel ?? 'I') as 'I' | 'II' | 'III',
    estado: ESTADO_HOSP[h.estado] ?? 'En proceso', direccion: h.direccion ?? '—', telefono: h.telefono ?? '—', email: h.correo ?? '—', director: h.director ?? '',
    registro: fFecha(h.created_at), actualizado: fFechaHora(h.updated_at), servicios: h.servicios ?? [],
    equipos: h.equipos_imagen ?? [], linkconnect: Array.isArray(h.linkconnect_nodos) ? h.linkconnect_nodos[0] ?? null : h.linkconnect_nodos ?? null,
    estudios: h.estudios?.[0]?.count ?? 0,
  }))
}

export type NuevoHospital = {
  nombre: string; tipo: string; nivel: 'I' | 'II' | 'III'; estado: string; provincia_id: number | null; municipio: string
  direccion: string; telefono: string; correo: string; director: string; servicios: string[]
}

/** Siguiente código H-### disponible */
export async function siguienteCodigoHospital() {
  const rows = unwrap(await supabase.from('hospitales').select('codigo'))
  const max = (rows as { codigo: string }[]).reduce((m, r) => Math.max(m, Number(r.codigo.replace(/\D/g, '')) || 0), 0)
  return `H-${String(max + 1).padStart(3, '0')}`
}

export async function crearHospital(h: NuevoHospital) {
  const codigo = await siguienteCodigoHospital()
  unwrap(await supabase.from('hospitales').insert({ ...h, codigo }).select('id').single())
  return codigo
}

export async function listarProvincias(): Promise<{ id: number; nombre: string; region_salud: string }[]> {
  return unwrap(await supabase.from('provincias').select('id, nombre, region_salud').order('nombre'))
}

/* -------------------------------- Pacientes -------------------------------- */

export type PacienteReal = {
  id: string; userId: string | null; n: number; hn: string; cedula: string; nombre: string; tel: string; edad: number; sexo: 'M' | 'F' | '—'
  ultimo: string; estado: 'Con estudios' | 'Sin estudios'; dob: string; dir: string; email: string; emergencia: string; activo: boolean
  estudios: number; hospitales: number; referidores: number; registrado: string
}

export async function fetchPacientes(): Promise<PacienteReal[]> {
  const rows = unwrap(await supabase.from('pacientes')
    .select('id, user_id, codigo, tipo_documento, documento, nombre_completo, telefono, fecha_nacimiento, sexo, correo, provincia, municipio, sector, calle, numero, apartamento, emergencia_telefono, emergencia_parentesco, estado, created_at, estudios(recibido_en, hospital_id, medico_referidor_id)')
    .order('created_at', { ascending: false }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map((p, i) => {
    const est = (p.estudios ?? []) as { recibido_en: string; hospital_id: string; medico_referidor_id: string | null }[]
    const ultimo = est.map((e) => e.recibido_en).sort().pop()
    const dir = [p.calle && `${p.calle}${p.numero ? ' #' + p.numero : ''}${p.apartamento ? ', ' + p.apartamento : ''}`, p.sector, p.municipio, p.provincia].filter(Boolean).join(', ')
    return {
      id: p.id, userId: p.user_id, n: i + 1, hn: p.codigo, cedula: p.tipo_documento === 'cedula' ? fCedula(p.documento) : p.documento, nombre: p.nombre_completo,
      tel: p.telefono ?? '—', edad: edad(p.fecha_nacimiento), sexo: p.sexo === 'Masculino' ? 'M' : p.sexo === 'Femenino' ? 'F' : '—',
      ultimo: ultimo ? fFecha(ultimo) : '—', estado: est.length ? 'Con estudios' : 'Sin estudios', dob: fFecha(p.fecha_nacimiento),
      dir: dir || '—', email: p.correo ?? '—',
      emergencia: p.emergencia_telefono ? `${p.emergencia_parentesco ? p.emergencia_parentesco + ' ' : ''}(${p.emergencia_telefono})` : '—',
      activo: p.estado === 'activo', estudios: est.length, hospitales: new Set(est.map((e) => e.hospital_id)).size,
      referidores: new Set(est.map((e) => e.medico_referidor_id).filter(Boolean)).size, registrado: fFecha(p.created_at),
    }
  })
}

export type EstudioResumen = { id: string; numero: string; modalidad: string; descripcion: string; fecha: string; hospital: string; estado: string; informePublicado: boolean }

export async function fetchEstudiosPaciente(pacienteId: string): Promise<EstudioResumen[]> {
  const rows = unwrap(await supabase.from('estudios')
    .select('id, numero_acceso, modalidad, descripcion, recibido_en, estado, hospitales(nombre), informes(estado)')
    .eq('paciente_id', pacienteId).order('recibido_en', { ascending: false }).limit(10))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map((e) => ({
    id: e.id, numero: e.numero_acceso, modalidad: e.modalidad, descripcion: e.descripcion, fecha: fFechaHora(e.recibido_en),
    hospital: e.hospitales?.nombre ?? '—', estado: ESTADO_ESTUDIO[e.estado] ?? e.estado,
    informePublicado: (Array.isArray(e.informes) ? e.informes : e.informes ? [e.informes] : []).some((i: { estado: string }) => i.estado === 'publicado'),
  }))
}

export type Acceso = { f: string; d: string; nav: string; ip: string }

export async function fetchAccesos(userId: string | null): Promise<Acceso[]> {
  if (!userId) return []
  const rows = unwrap(await supabase.from('accesos_portal').select('created_at, dispositivo, navegador, ip')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(5))
  return (rows as { created_at: string; dispositivo: string | null; navegador: string | null; ip: string | null }[])
    .map((a) => ({ f: fFechaHora(a.created_at), d: a.dispositivo ?? '—', nav: a.navegador ?? '—', ip: a.ip || '—' }))
}

export async function contarAccesos(userIds: string[]) {
  if (!userIds.length) return {} as Record<string, number>
  const rows = unwrap(await supabase.from('accesos_portal').select('user_id').in('user_id', userIds))
  return (rows as { user_id: string }[]).reduce<Record<string, number>>((m, r) => ({ ...m, [r.user_id]: (m[r.user_id] ?? 0) + 1 }), {})
}

/* ------------------------- Médicos (radiólogos y referidores) ------------------------- */

const ESTADO_REG: Record<string, string> = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado', suspendido: 'Suspendido' }

export type RadiologoReal = {
  id: string; userId: string | null; nombre: string; codigo: string; cedula: string; esp: string[]; region: string; hosp: number
  rating: number; estado: 'Activo' | 'Sin asignación' | 'En convocatoria' | 'Pendiente' | 'Rechazado' | 'Suspendido'
  exequatur: string; telRes: string; telPer: string; email: string; vive: string; dir: string; interes: string[]
  /** [asignados, informes emitidos, vencidos, promedio horas] */
  stats: [number, number, number, number]
  hospitales: [string, string][]; registrado: string; fotoPath: string | null
}

export async function fetchRadiologos(): Promise<RadiologoReal[]> {
  const rows = unwrap(await supabase.from('medicos')
    .select('id, user_id, codigo, tratamiento, nombre_completo, cedula, exequatur, especialidades, regiones_interes, region_reside, provincia, municipio, sector, calle, casa, residencial, tel_residencia, tel_whatsapp, correo, rating, estado_registro, foto_path, created_at, asignaciones(estado, fecha_asignacion, hospitales(nombre)), postulaciones(estado), estudios!estudios_radiologo_id_fkey(estado, vence_en), informes(estado, publicado_en, created_at)')
    .eq('tipo', 'radiologo').order('created_at', { ascending: false }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map((m) => {
    const asig = (m.asignaciones ?? []).filter((a: { estado: string }) => a.estado === 'activa')
    const enConv = (m.postulaciones ?? []).some((p: { estado: string }) => ['aplicada', 'preseleccionada'].includes(p.estado))
    const est = (m.estudios ?? []) as { estado: string; vence_en: string | null }[]
    const inf = ((m.informes ?? []) as { estado: string; publicado_en: string | null }[]).filter((i) => i.estado === 'publicado')
    const vencidos = est.filter((e) => e.vence_en && new Date(e.vence_en) < new Date() && !['informado', 'cancelado'].includes(e.estado)).length
    const estado: RadiologoReal['estado'] = m.estado_registro !== 'aprobado' ? (ESTADO_REG[m.estado_registro] as RadiologoReal['estado'])
      : asig.length ? 'Activo' : enConv ? 'En convocatoria' : 'Sin asignación'
    return {
      id: m.id, userId: m.user_id, nombre: `${m.tratamiento ?? 'Dr.'} ${m.nombre_completo}`, codigo: m.codigo, cedula: fCedula(m.cedula),
      esp: m.especialidades ?? [], region: m.regiones_interes?.[0] ?? '—', hosp: asig.length, rating: Number(m.rating ?? 0), estado,
      exequatur: m.exequatur, telRes: m.tel_residencia ?? '—', telPer: m.tel_whatsapp ?? '—', email: m.correo,
      vive: [m.municipio, m.provincia].filter(Boolean).join(', ') || '—',
      dir: [[m.municipio, m.provincia].filter(Boolean).join(', '), [m.sector, m.calle, m.casa && `Casa/Apto ${m.casa}`, m.residencial].filter(Boolean).join(', ')].filter(Boolean).join('\n') || '—',
      interes: m.regiones_interes ?? [], stats: [est.length, inf.length, vencidos, 0],
      hospitales: asig.map((a: { fecha_asignacion: string; hospitales: { nombre: string } | null }) => [a.hospitales?.nombre ?? '—', fFecha(a.fecha_asignacion)] as [string, string]),
      registrado: fFecha(m.created_at), fotoPath: m.foto_path,
    }
  })
}

export type ReferidorReal = {
  id: string; userId: string | null; n: number; nombre: string; cedula: string; esp: string; refs: number; ultima: string; activo: boolean
  estado: string; codigo: string; tel: string; email: string; centro: string; dir: string; registrado: string; pacientes: number; hospitales: number
  especialidades: string[]
}

export async function fetchReferidores(): Promise<ReferidorReal[]> {
  const rows = unwrap(await supabase.from('medicos')
    .select('id, user_id, codigo, tratamiento, nombre_completo, cedula, especialidades, otra_especialidad, centro_trabajo, provincia, municipio, sector, calle, tel_whatsapp, tel_residencia, correo, estado_registro, created_at, estudios!estudios_medico_referidor_id_fkey(recibido_en, paciente_id, hospital_id)')
    .eq('tipo', 'referidor').order('created_at', { ascending: false }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map((m, i) => {
    const est = (m.estudios ?? []) as { recibido_en: string; paciente_id: string; hospital_id: string }[]
    const ultima = est.map((e) => e.recibido_en).sort().pop()
    const esp = [...(m.especialidades ?? []), m.otra_especialidad].filter(Boolean) as string[]
    return {
      id: m.id, userId: m.user_id, n: i + 1, nombre: `${m.tratamiento ?? 'Dr.'} ${m.nombre_completo}`, cedula: fCedula(m.cedula), esp: esp.join(', ') || '—',
      refs: est.length, ultima: ultima ? fFecha(ultima) : '—', activo: m.estado_registro === 'aprobado', estado: ESTADO_REG[m.estado_registro] ?? m.estado_registro,
      codigo: m.codigo, tel: m.tel_whatsapp ?? m.tel_residencia ?? '—', email: m.correo, centro: m.centro_trabajo ?? '—',
      dir: [m.calle, m.sector, m.municipio, m.provincia].filter(Boolean).join(', ') || '—', registrado: fFecha(m.created_at),
      pacientes: new Set(est.map((e) => e.paciente_id)).size, hospitales: new Set(est.map((e) => e.hospital_id)).size, especialidades: esp,
    }
  })
}

export type ReferenciaReal = { f: string; p: string; e: string; h: string; s: string }

export async function fetchReferenciasMedico(medicoId: string): Promise<ReferenciaReal[]> {
  const rows = unwrap(await supabase.from('estudios')
    .select('recibido_en, descripcion, estado, pacientes(codigo), hospitales(nombre)')
    .eq('medico_referidor_id', medicoId).order('recibido_en', { ascending: false }).limit(5))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map((e) => ({ f: fFecha(e.recibido_en), p: e.pacientes?.codigo ?? '—', e: e.descripcion, h: e.hospitales?.nombre ?? '—', s: ESTADO_ESTUDIO[e.estado] ?? e.estado }))
}

/** Activa o desactiva a un médico (admin/coordinador) */
export async function cambiarEstadoMedico(id: string, estado: 'aprobado' | 'suspendido') {
  unwrap(await supabase.from('medicos').update({ estado_registro: estado }).eq('id', id).select('id').single())
}

/* -------------------------------- Dashboard -------------------------------- */

export type Kpis = {
  hospitales: number; hospitales_activos: number; estudios_recibidos: number; informes_emitidos: number; estudios_pendientes: number
  radiologos_activos: number; medicos_pendientes: number; incidencias_criticas: number
  por_modalidad: Record<string, number>; por_estado: Record<string, number>; tiempo_promedio_horas: number | null
}

export async function fetchKpis(desde: string, hasta: string): Promise<Kpis> {
  return unwrap(await supabase.rpc('kpis_dashboard', { p_desde: desde, p_hasta: hasta })) as Kpis
}

export type DashboardReal = {
  kpis: Kpis; previo: Kpis
  hospitalesPorEstado: Record<string, number>; hospitalesPorNivel: Record<string, number>; convocatoriasActivas: number
  porMes: number[]
  ultimos: { fecha: string; hospital: string; paciente: string; mod: string; estado: string; asignado: string }[]
  alertas: { tipo: string; t: string; s: string; time: string }[]
  actividades: { accion: string; modulo: string; registro: string; usuario: string; time: string }[]
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Rango de fechas del selector del Dashboard */
export function rangoFechas(opcion: string): { desde: string; hasta: string; prevDesde: string; prevHasta: string } {
  const hoy = new Date()
  let desde: Date
  if (opcion === 'Este mes') desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  else if (opcion === 'Este año') desde = new Date(hoy.getFullYear(), 0, 1)
  else if (opcion === 'Últimos 12 meses') desde = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate() + 1)
  else desde = new Date(hoy.getTime() - 29 * 86400000)
  const dias = Math.round((hoy.getTime() - desde.getTime()) / 86400000) + 1
  const prevHasta = new Date(desde.getTime() - 86400000)
  const prevDesde = new Date(prevHasta.getTime() - (dias - 1) * 86400000)
  return { desde: iso(desde), hasta: iso(hoy), prevDesde: iso(prevDesde), prevHasta: iso(prevHasta) }
}

export async function fetchDashboard(opcion: string): Promise<DashboardReal> {
  const r = rangoFechas(opcion)
  const inicioAnio = `${new Date().getFullYear()}-01-01`
  const [kpis, previo, hosp, conv, anio, ultimos, alertas, auditoria] = await Promise.all([
    fetchKpis(r.desde, r.hasta),
    fetchKpis(r.prevDesde, r.prevHasta),
    supabase.from('hospitales').select('estado, nivel'),
    supabase.from('convocatorias').select('id', { count: 'exact', head: true }).eq('estado', 'activa'),
    supabase.from('estudios').select('recibido_en').gte('recibido_en', inicioAnio),
    supabase.from('estudios').select('recibido_en, modalidad, estado, hospitales(nombre), pacientes(nombre_completo), radiologo:medicos!estudios_radiologo_id_fkey(tratamiento, nombre_completo)')
      .order('recibido_en', { ascending: false }).limit(5),
    supabase.from('alertas').select('tipo, mensaje, created_at, hospitales(nombre)').eq('resuelta', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('auditoria').select('accion, modulo, registro_afectado, usuario, created_at').order('created_at', { ascending: false }).limit(5),
  ])
  const hs = unwrap(hosp) as { estado: string; nivel: string | null }[]
  const porMes = Array(12).fill(0)
  for (const e of unwrap(anio) as { recibido_en: string }[]) porMes[new Date(e.recibido_en).getMonth()]++
  return {
    kpis, previo,
    hospitalesPorEstado: hs.reduce<Record<string, number>>((m, h) => ({ ...m, [h.estado]: (m[h.estado] ?? 0) + 1 }), {}),
    hospitalesPorNivel: hs.reduce<Record<string, number>>((m, h) => ({ ...m, [h.nivel ?? 'I']: (m[h.nivel ?? 'I'] ?? 0) + 1 }), {}),
    convocatoriasActivas: conv.count ?? 0,
    porMes,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ultimos: (unwrap(ultimos) as any[]).map((e) => ({
      fecha: fFechaHora(e.recibido_en), hospital: e.hospitales?.nombre ?? '—', paciente: e.pacientes?.nombre_completo ?? '—',
      mod: MOD_ETIQUETA[e.modalidad] ?? e.modalidad, estado: ESTADO_ESTUDIO[e.estado] ?? e.estado,
      asignado: e.radiologo ? `${e.radiologo.tratamiento ?? ''} ${e.radiologo.nombre_completo}`.trim() : '-',
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    alertas: (unwrap(alertas) as any[]).map((a) => ({ tipo: a.tipo, t: a.mensaje, s: a.hospitales?.nombre ?? 'Red nacional', time: hace(a.created_at) })),
    // La auditoría solo la ve el administrador; para otros roles llega vacía
    actividades: (auditoria.error ? [] : (auditoria.data ?? []) as { accion: string; modulo: string; registro_afectado: string | null; usuario: string | null; created_at: string }[])
      .map((a) => ({ accion: a.accion, modulo: a.modulo, registro: a.registro_afectado ?? '', usuario: a.usuario ?? 'Sistema', time: hace(a.created_at) })),
  }
}
