import { supabase } from './supabase'
import { ESTADO_ESTUDIO, MOD_DESCRIPCION, fFecha, edad } from './admin-data'
import type { Study } from '../pages/patient/PatientPortal'
import type { WorkItem, Priority } from '../pages/doctor/Worklist'

/* =====================================================================
 * Consultas de los portales del paciente y del médico.
 * Las políticas RLS de la base limitan cada consulta a los datos del
 * usuario conectado (sus estudios, sus pacientes, sus asignaciones…).
 * En modo demostración las páginas siguen usando sus datos de ejemplo.
 * ===================================================================== */

export { useDatos, supabaseConfigurado } from './admin-data'

const unwrap = <T,>(r: { data: T | null; error: { message: string } | null }): T => {
  if (r.error) throw new Error(r.error.message)
  return r.data as T
}
const arr = <T,>(v: T | T[] | null | undefined): T[] => (Array.isArray(v) ? v : v ? [v] : [])
const lineas = (t?: string | null) => (t ?? '').split(/\n+/).map((l) => l.trim()).filter(Boolean)
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
const nombreMedico = (m?: { tratamiento?: string | null; nombre_completo?: string } | null) =>
  m ? `${m.tratamiento ?? 'Dr.'} ${m.nombre_completo}` : '—'

/** Miniatura de ejemplo según la modalidad (hasta que exista el visor DICOM) */
export const MINIATURA: Record<string, string> = {
  CT: '/img/crops/ct-cerebro.webp', RX: '/img/crops/rx-torax.webp', MR: '/img/crops/mr.webp', US: '/img/crops/us.webp', MG: '/img/crops/mg.webp',
}
export const miniatura = (mod: string) => MINIATURA[mod] ?? '/img/crops/ct-cerebro.webp'

const PRIORIDAD: Record<string, Priority> = { emergencia: 'Urgente', urgencia: 'Urgente', hospitalizado: 'Alta', ambulatorio: 'Normal' }
export const PRIORIDAD_DB: Record<string, string> = { Urgente: 'urgencia', Preferente: 'hospitalizado', Rutina: 'ambulatorio', Alta: 'hospitalizado', Normal: 'ambulatorio' }

/* -------------------------------- Estudios -------------------------------- */

const SEL_ESTUDIO = `id, numero_acceso, modalidad, descripcion, prioridad, estado, indicacion_clinica, recibido_en, vence_en, num_imagenes,
  hospitales(nombre, municipio, provincias(nombre)),
  radiologo:medicos!estudios_radiologo_id_fkey(tratamiento, nombre_completo),
  referidor:medicos!estudios_medico_referidor_id_fkey(tratamiento, nombre_completo),
  informes(id, numero, estado, tecnica, hallazgos, impresion, hallazgo_critico, publicado_en, calificacion)`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilaEstudio = any

/** Convierte un estudio de la base al formato `Study` que usan los portales */
export function aStudy(e: FilaEstudio): Study {
  const inf = arr(e.informes)[0] as FilaEstudio | undefined
  const publicado = inf?.estado === 'publicado'
  return {
    id: e.numero_acceso, name: MOD_DESCRIPCION[e.modalidad] ?? e.descripcion, mod: e.modalidad,
    date: fFecha(e.recibido_en), time: hora(e.recibido_en), hospital: e.hospitales?.nombre ?? '—',
    city: [e.hospitales?.municipio, e.hospitales?.provincias?.nombre].filter(Boolean).join(', '),
    img: miniatura(e.modalidad),
    status: publicado ? 'Informe publicado' : ['asignado', 'en_lectura', 'en_revision'].includes(e.estado) ? 'En lectura' : 'Pendiente',
    radiologist: nombreMedico(e.radiologo), referrer: nombreMedico(e.referidor), region: e.descripcion,
    technique: inf?.tecnica ?? '', findings: lineas(inf?.hallazgos), impression: lineas(inf?.impresion),
    series: 1, images: e.num_imagenes ?? 0,
  }
}

/* ============================= PORTAL DEL PACIENTE ============================= */

export type EstudioPaciente = Study & { uuid: string; hospitalId: string | null; referidorId: string | null; recibido: string; publicadoEn: string | null }

export async function fetchMisEstudios(pacienteId: string): Promise<EstudioPaciente[]> {
  const rows = unwrap(await supabase.from('estudios').select(SEL_ESTUDIO + ', hospital_id, medico_referidor_id')
    .eq('paciente_id', pacienteId).order('recibido_en', { ascending: false }))
  return (rows as FilaEstudio[]).map((e) => ({
    ...aStudy(e), uuid: e.id, hospitalId: e.hospital_id, referidorId: e.medico_referidor_id, recibido: e.recibido_en,
    publicadoEn: arr(e.informes).find((i: FilaEstudio) => i.estado === 'publicado')?.publicado_en ?? null,
  }))
}

export type HospitalPaciente = {
  id: string; name: string; short: string; city: string; last: string; address: string; phone: string; email: string
  mods: string[]; nivel: string; tipo: string; visitas: number; estudios: Study[]
}

/** Hospitales donde el paciente se ha realizado estudios */
export async function fetchMisHospitales(pacienteId: string): Promise<HospitalPaciente[]> {
  const est = await fetchMisEstudios(pacienteId)
  const ids = [...new Set(est.map((e) => e.hospitalId).filter(Boolean))] as string[]
  if (!ids.length) return []
  const hs = unwrap(await supabase.from('hospitales').select('id, nombre, sigla, tipo, nivel, municipio, direccion, telefono, correo, servicios, provincias(nombre)').in('id', ids)) as FilaEstudio[]
  return hs.map((h) => {
    const propios = est.filter((e) => e.hospitalId === h.id)
    return {
      id: h.id, name: h.nombre, short: h.nombre.replace(/^Hospital /, 'Hosp. '), city: [h.municipio, h.provincias?.nombre].filter(Boolean).join(', '),
      last: propios[0]?.date ?? '—', address: h.direccion ?? '—', phone: h.telefono ?? '—', email: h.correo ?? '—',
      mods: h.servicios ?? [], nivel: h.nivel ?? '', tipo: h.tipo ?? '', visitas: propios.length, estudios: propios,
    }
  }).sort((a, b) => b.visitas - a.visitas)
}

export type MedicoDelPaciente = {
  id: string; nombre: string; especialidades: string[]; telefono: string; correo: string; centro: string; codigo: string; estudios: Study[]
}

/** Médicos referidores que han solicitado estudios del paciente */
export async function fetchMisMedicos(pacienteId: string): Promise<MedicoDelPaciente[]> {
  const est = await fetchMisEstudios(pacienteId)
  const ids = [...new Set(est.map((e) => e.referidorId).filter(Boolean))] as string[]
  if (!ids.length) return []
  const ms = unwrap(await supabase.from('medicos').select('id, codigo, tratamiento, nombre_completo, especialidades, otra_especialidad, tel_whatsapp, correo, centro_trabajo').in('id', ids)) as FilaEstudio[]
  return ms.map((m) => ({
    id: m.id, nombre: nombreMedico(m), especialidades: [...(m.especialidades ?? []), m.otra_especialidad].filter(Boolean),
    telefono: m.tel_whatsapp ?? '—', correo: m.correo ?? '—', centro: m.centro_trabajo ?? '—', codigo: m.codigo,
    estudios: est.filter((e) => e.referidorId === m.id),
  }))
}

export type CitaReal = {
  id: string; fecha: string; day: string; month: string; weekday: string; time: string; title: string; mod?: string
  place: string; doctor: string; estado: string; status: 'Confirmada' | 'Pendiente de confirmar' | 'Cancelada' | 'Completada'; notas: string; pasada: boolean
}
const ESTADO_CITA: Record<string, CitaReal['status']> = {
  programada: 'Pendiente de confirmar', confirmada: 'Confirmada', completada: 'Completada', cancelada: 'Cancelada', no_asistio: 'Cancelada',
}

export async function fetchMisCitas(pacienteId: string): Promise<CitaReal[]> {
  const rows = unwrap(await supabase.from('citas')
    .select('id, tipo, fecha_hora, estado, notas, hospitales(nombre), medicos(tratamiento, nombre_completo), estudios(modalidad, descripcion)')
    .eq('paciente_id', pacienteId).order('fecha_hora')) as FilaEstudio[]
  return rows.map((c) => {
    const d = new Date(c.fecha_hora)
    return {
      id: c.id, fecha: c.fecha_hora, day: String(d.getDate()).padStart(2, '0'),
      month: d.toLocaleDateString('es-DO', { month: 'short' }).replace('.', '').toUpperCase(),
      weekday: d.toLocaleDateString('es-DO', { weekday: 'long' }).replace(/^\w/, (x) => x.toUpperCase()), time: hora(c.fecha_hora),
      title: c.estudios?.descripcion ?? c.tipo, mod: c.estudios?.modalidad, place: c.hospitales?.nombre ?? '—',
      doctor: c.medicos ? nombreMedico(c.medicos) : '—', estado: c.estado, status: ESTADO_CITA[c.estado] ?? 'Pendiente de confirmar',
      notas: c.notas ?? '', pasada: d.getTime() < Date.now(),
    }
  })
}

export type EventoHistoria = { fecha: string; date: string; year: string; type: 'Estudio' | 'Diagnóstico' | 'Consulta'; title: string; place: string; detail: string; mod?: string }

/** Línea de tiempo: estudios, diagnósticos (informes publicados) y consultas */
export async function fetchMiHistoria(pacienteId: string): Promise<EventoHistoria[]> {
  const [est, citas] = await Promise.all([fetchMisEstudios(pacienteId), fetchMisCitas(pacienteId)])
  const ev: EventoHistoria[] = []
  for (const e of est) {
    ev.push({ fecha: e.recibido, date: e.date, year: e.recibido.slice(0, 4), type: 'Estudio', title: e.name, place: e.hospital, detail: `${e.region} · ${e.id}`, mod: e.mod })
    if (e.publicadoEn) ev.push({
      fecha: e.publicadoEn, date: fFecha(e.publicadoEn), year: e.publicadoEn.slice(0, 4), type: 'Diagnóstico', title: `Informe: ${e.name}`,
      place: e.radiologist, detail: e.impression.join(' ') || 'Informe publicado', mod: e.mod,
    })
  }
  for (const c of citas.filter((x) => x.estado === 'completada')) {
    ev.push({ fecha: c.fecha, date: fFecha(c.fecha), year: c.fecha.slice(0, 4), type: 'Consulta', title: c.title, place: c.place, detail: c.doctor })
  }
  return ev.sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export type FichaPaciente = {
  id: string; codigo: string; nombre_completo: string; documento: string; tipo_documento: string; fecha_nacimiento: string | null; sexo: string | null
  nacionalidad: string | null; telefono: string | null; whatsapp: string | null; correo: string | null; provincia: string | null; municipio: string | null
  sector: string | null; calle: string | null; numero: string | null; apartamento: string | null; referencia: string | null
  ocupacion: string | null; estado_civil: string | null; emergencia_telefono: string | null; emergencia_parentesco: string | null; created_at: string
}

/** Ficha completa del paciente conectado (dirección, emergencia…) */
export async function fetchMiFicha(pacienteId: string): Promise<FichaPaciente> {
  return unwrap(await supabase.from('pacientes').select('*').eq('id', pacienteId).single()) as FichaPaciente
}

/* ============================== PORTAL DEL MÉDICO ============================== */

/* ------------------------------ Radiólogo ------------------------------ */

export type ItemTrabajo = WorkItem & { uuid: string; informeId: string | null; tecnica: string; hallazgos: string; impresion: string; critico: boolean; venceEn: string | null }

function restante(vence?: string | null) {
  if (!vence) return { txt: '—', pct: 0 }
  const ms = new Date(vence).getTime() - Date.now()
  const abs = Math.abs(ms) / 60000
  const txt = abs < 60 ? `${Math.round(abs)} min` : abs < 1440 ? `${(abs / 60).toFixed(1)} h` : `${Math.round(abs / 1440)} d`
  return { txt: ms < 0 ? `Vencido hace ${txt}` : txt, pct: ms <= 0 ? 100 : Math.max(5, Math.min(95, 100 - (ms / (7 * 86400000)) * 100)) }
}

/** Lista de trabajo del radiólogo: estudios asignados sin informe publicado */
export async function fetchListaTrabajo(radiologoId: string): Promise<ItemTrabajo[]> {
  const rows = unwrap(await supabase.from('estudios')
    .select(SEL_ESTUDIO + ', pacientes(codigo, nombre_completo, sexo, fecha_nacimiento)')
    .eq('radiologo_id', radiologoId).not('estado', 'in', '(informado,cancelado)').order('vence_en')) as FilaEstudio[]
  return rows.map((e) => {
    const inf = arr(e.informes)[0] as FilaEstudio | undefined
    const r = restante(e.vence_en)
    return {
      id: e.numero_acceso, uuid: e.id, patient: e.pacientes?.nombre_completo ?? '—', record: e.pacientes?.codigo ?? '—',
      age: `${edad(e.pacientes?.fecha_nacimiento)} ${e.pacientes?.sexo === 'Femenino' ? 'F' : 'M'}`,
      study: e.descripcion, mod: e.modalidad, hospital: e.hospitales?.nombre ?? '—', received: `${fFecha(e.recibido_en)} ${hora(e.recibido_en)}`,
      priority: PRIORIDAD[e.prioridad] ?? 'Normal', remaining: r.txt, pct: r.pct, img: miniatura(e.modalidad), referrer: nombreMedico(e.referidor),
      indication: e.indicacion_clinica ?? '—',
      status: inf?.estado === 'firmado' ? 'Firmado' : inf?.estado === 'borrador' ? 'Borrador' : e.estado === 'en_lectura' ? 'En lectura' : 'Pendiente',
      informeId: inf?.id ?? null, tecnica: inf?.tecnica ?? '', hallazgos: inf?.hallazgos ?? '', impresion: inf?.impresion ?? '',
      critico: Boolean(inf?.hallazgo_critico), venceEn: e.vence_en,
    }
  })
}

/** El radiólogo abre el estudio: pasa a "en lectura" */
export async function marcarEnLectura(estudioUuid: string) {
  unwrap(await supabase.from('estudios').update({ estado: 'en_lectura' }).eq('id', estudioUuid).in('estado', ['nuevo', 'asignado']).select('id'))
}

/** Guarda el informe como borrador o lo firma y publica (notifica al paciente y al referidor) */
export async function guardarInforme(p: {
  estudioUuid: string; radiologoId: string; informeId: string | null; tecnica: string; hallazgos: string; impresion: string; critico: boolean; publicar: boolean
}) {
  const datos = { tecnica: p.tecnica, hallazgos: p.hallazgos, impresion: p.impresion, hallazgo_critico: p.critico, estado: p.publicar ? 'publicado' : 'borrador' }
  if (p.informeId) {
    unwrap(await supabase.from('informes').update(datos).eq('id', p.informeId).select('id').single())
  } else {
    unwrap(await supabase.from('informes').insert({ ...datos, estudio_id: p.estudioUuid, radiologo_id: p.radiologoId }).select('id').single())
  }
}

export type InformeEmitido = {
  id: string; numero: string; patient: string; record: string; study: string; mod: string; hospital: string; date: string; tat: string
  status: 'Publicado' | 'Borrador' | 'Firmado' | 'Corregido'; rating: number; ref: Study
}

export async function fetchMisInformes(radiologoId: string): Promise<InformeEmitido[]> {
  const rows = unwrap(await supabase.from('informes')
    .select(`id, numero, estado, calificacion, publicado_en, created_at, estudios(${SEL_ESTUDIO}, pacientes(codigo, nombre_completo))`)
    .eq('radiologo_id', radiologoId).order('created_at', { ascending: false })) as FilaEstudio[]
  const EST: Record<string, InformeEmitido['status']> = { publicado: 'Publicado', borrador: 'Borrador', firmado: 'Firmado', corregido: 'Corregido' }
  return rows.map((i) => {
    const e = i.estudios
    const horas = i.publicado_en && e?.recibido_en ? (new Date(i.publicado_en).getTime() - new Date(e.recibido_en).getTime()) / 3600000 : null
    return {
      id: i.id, numero: i.numero, patient: e?.pacientes?.nombre_completo ?? '—', record: e?.pacientes?.codigo ?? '—', study: e?.descripcion ?? '—',
      mod: e?.modalidad ?? '', hospital: e?.hospitales?.nombre ?? '—', date: fFecha(i.publicado_en ?? i.created_at),
      tat: horas == null ? '—' : horas < 1 ? `${Math.round(horas * 60)} min` : `${horas.toFixed(1)} h`,
      status: EST[i.estado] ?? 'Borrador', rating: i.calificacion ?? 0, ref: e ? aStudy(e) : ({} as Study),
    }
  })
}

export type HospitalAsignado = {
  id: string; name: string; city: string; region: string; address: string; phone: string; email: string; contact: string
  mods: string[]; since: string; estado: string; pendientes: number; mes: number; pacs: string
}

/** Hospitales asignados al radiólogo con su carga de trabajo */
export async function fetchMisHospitalesRadiologo(radiologoId: string): Promise<HospitalAsignado[]> {
  const [asig, est] = await Promise.all([
    supabase.from('asignaciones').select('estado, modalidades, fecha_asignacion, hospitales(id, nombre, municipio, direccion, telefono, correo, director, servicios, provincias(nombre, region_salud), linkconnect_nodos(estado))')
      .eq('radiologo_id', radiologoId).in('estado', ['activa', 'pendiente']),
    supabase.from('estudios').select('hospital_id, estado, recibido_en').eq('radiologo_id', radiologoId),
  ])
  const estudios = unwrap(est) as { hospital_id: string; estado: string; recibido_en: string }[]
  const mesIni = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  return (unwrap(asig) as FilaEstudio[]).filter((a) => a.hospitales).map((a) => {
    const h = a.hospitales
    const lc = arr(h.linkconnect_nodos)[0] as FilaEstudio | undefined
    const propios = estudios.filter((e) => e.hospital_id === h.id)
    return {
      id: h.id, name: h.nombre, city: [h.municipio, h.provincias?.nombre].filter(Boolean).join(', '), region: h.provincias?.region_salud ? `Región ${h.provincias.region_salud}` : '—',
      address: h.direccion ?? '—', phone: h.telefono ?? '—', email: h.correo ?? '—', contact: h.director ? `${h.director} · Dirección` : '—',
      mods: (a.modalidades?.length ? a.modalidades : h.servicios) ?? [], since: fFecha(a.fecha_asignacion), estado: a.estado,
      pendientes: propios.filter((e) => !['informado', 'cancelado'].includes(e.estado)).length, mes: propios.filter((e) => e.recibido_en >= mesIni).length,
      pacs: lc?.estado === 'conectado' ? 'En línea' : lc ? 'Con incidencias' : 'Sin LINKConnect',
    }
  })
}

export type ConvocatoriaAbierta = {
  id: string; title: string; hospital: string; region: string; mods: string[]; schedule: string; volume: string; pay: string; close: string
  desc: string; reqs: string[]; postulacion: string | null
}

export async function fetchConvocatoriasAbiertas(medicoId: string): Promise<ConvocatoriaAbierta[]> {
  const [cs, ps] = await Promise.all([
    supabase.from('convocatorias').select('id, titulo, descripcion, especialidades, regiones_interes, modalidad_servicio, posiciones, tipo_contratacion, fecha_cierre, requisitos, condiciones, hospitales(nombre, provincias(region_salud))')
      .eq('estado', 'activa').order('fecha_cierre'),
    supabase.from('postulaciones').select('convocatoria_id, estado').eq('medico_id', medicoId),
  ])
  const post = new Map((unwrap(ps) as { convocatoria_id: string; estado: string }[]).map((p) => [p.convocatoria_id, p.estado]))
  return (unwrap(cs) as FilaEstudio[]).map((c) => {
    const req = c.requisitos ?? {}, cond = c.condiciones ?? {}
    const reqs = Array.isArray(req.lista) ? req.lista : Object.values(req).filter((v) => typeof v === 'string') as string[]
    return {
      id: c.id, title: c.titulo, hospital: c.hospitales?.nombre ?? 'Red nacional',
      region: c.regiones_interes?.join(', ') || (c.hospitales?.provincias?.region_salud ? `Región ${c.hospitales.provincias.region_salud}` : 'Todas'),
      mods: c.especialidades ?? [], schedule: (c.modalidad_servicio ?? []).join(' / ') || '—',
      volume: `${c.posiciones} posición${c.posiciones === 1 ? '' : 'es'}`, pay: c.tipo_contratacion ?? (typeof cond.pago === 'string' ? cond.pago : '—'),
      close: fFecha(c.fecha_cierre), desc: c.descripcion ?? '', reqs, postulacion: post.get(c.id) ?? null,
    }
  })
}

export async function postularConvocatoria(convocatoriaId: string, medicoId: string, comentario?: string) {
  unwrap(await supabase.from('postulaciones').insert({ convocatoria_id: convocatoriaId, medico_id: medicoId, comentario: comentario || null }).select('id').single())
}

export type MiPostulacion = { id: string; title: string; hospital: string; date: string; estado: string }
export async function fetchMisPostulaciones(medicoId: string): Promise<MiPostulacion[]> {
  const rows = unwrap(await supabase.from('postulaciones').select('id, estado, created_at, convocatorias(titulo, hospitales(nombre))')
    .eq('medico_id', medicoId).order('created_at', { ascending: false })) as FilaEstudio[]
  const E: Record<string, string> = { aplicada: 'Aplicada', preseleccionada: 'Preseleccionada', aceptada: 'Aceptada', rechazada: 'No seleccionada', retirada: 'Retirada' }
  return rows.map((p) => ({ id: p.id, title: p.convocatorias?.titulo ?? '—', hospital: p.convocatorias?.hospitales?.nombre ?? '—', date: fFecha(p.created_at), estado: E[p.estado] ?? p.estado }))
}

/* ------------------------------ Referidor ------------------------------ */

export type PacienteReferido = {
  id: string; name: string; record: string; cedula: string; age: number; sex: string; phone: string; email: string; last: string
  status: string; studies: Study[]; solicitudes: number
}

/** Pacientes del médico referidor (por sus estudios y solicitudes) */
export async function fetchMisPacientesReferidos(medicoId: string): Promise<PacienteReferido[]> {
  const [est, sol] = await Promise.all([
    supabase.from('estudios').select(SEL_ESTUDIO + ', paciente_id').eq('medico_referidor_id', medicoId).order('recibido_en', { ascending: false }),
    supabase.from('solicitudes_estudio').select('paciente_id, estado, created_at').eq('medico_id', medicoId),
  ])
  const estudios = unwrap(est) as FilaEstudio[]
  const solicitudes = unwrap(sol) as { paciente_id: string; estado: string; created_at: string }[]
  const ids = [...new Set([...estudios.map((e) => e.paciente_id), ...solicitudes.map((s) => s.paciente_id)])]
  if (!ids.length) return []
  const ps = unwrap(await supabase.from('pacientes').select('id, codigo, nombre_completo, documento, tipo_documento, fecha_nacimiento, sexo, telefono, correo').in('id', ids)) as FilaEstudio[]
  return ps.map((p) => {
    const propios = estudios.filter((e) => e.paciente_id === p.id).map(aStudy)
    const sols = solicitudes.filter((s) => s.paciente_id === p.id)
    const ultimo = propios[0]?.date ?? (sols[0] ? fFecha(sols[0].created_at) : '—')
    return {
      id: p.id, name: p.nombre_completo, record: p.codigo, cedula: p.tipo_documento === 'cedula' && /^\d{11}$/.test(p.documento) ? p.documento.replace(/^(\d{3})(\d{7})(\d)$/, '$1-$2-$3') : p.documento,
      age: edad(p.fecha_nacimiento), sex: p.sexo ?? '—', phone: p.telefono ?? '—', email: p.correo ?? '—', last: ultimo,
      status: propios.some((s) => s.status === 'Informe publicado') ? 'Resultado disponible' : propios.length ? 'En proceso' : 'Solicitud enviada',
      studies: propios, solicitudes: sols.length,
    }
  }).sort((a, b) => b.last.split('/').reverse().join('').localeCompare(a.last.split('/').reverse().join('')))
}

export type SolicitudReal = {
  id: string; patient: string; record: string; study: string; mod: string; hospital: string; date: string
  priority: 'Urgente' | 'Preferente' | 'Rutina'; status: string; estado: string; indicacion: string
}
const PRIO_SOL: Record<string, SolicitudReal['priority']> = { emergencia: 'Urgente', urgencia: 'Urgente', hospitalizado: 'Preferente', ambulatorio: 'Rutina' }
const ESTADO_SOL: Record<string, string> = { enviada: 'Enviada', programada: 'Programada', realizada: 'Realizada', cancelada: 'Cancelada' }

export async function fetchMisSolicitudes(medicoId: string): Promise<SolicitudReal[]> {
  const rows = unwrap(await supabase.from('solicitudes_estudio')
    .select('id, modalidad, descripcion, prioridad, indicacion, estado, created_at, pacientes(codigo, nombre_completo), hospitales(nombre), estudios!solicitudes_estudio_fk(estado, informes(estado))')
    .eq('medico_id', medicoId).order('created_at', { ascending: false })) as FilaEstudio[]
  return rows.map((s) => {
    const est = s.estudios
    const resultado = est && arr(est.informes).some((i: FilaEstudio) => i.estado === 'publicado')
    return {
      id: s.id, patient: s.pacientes?.nombre_completo ?? '—', record: s.pacientes?.codigo ?? '—', study: s.descripcion, mod: s.modalidad,
      hospital: s.hospitales?.nombre ?? '—', date: fFecha(s.created_at), priority: PRIO_SOL[s.prioridad] ?? 'Rutina',
      status: resultado ? 'Resultado disponible' : est ? (ESTADO_ESTUDIO[est.estado] ?? 'En proceso') : (ESTADO_SOL[s.estado] ?? s.estado),
      estado: s.estado, indicacion: s.indicacion ?? '',
    }
  })
}

export async function buscarPacientePorDocumento(doc: string) {
  const rows = unwrap(await supabase.rpc('buscar_paciente_por_documento', { p_documento: doc })) as { id: string; codigo: string; nombre_completo: string; sexo: string | null; fecha_nacimiento: string | null }[]
  return rows[0] ?? null
}

export async function crearSolicitud(s: { medico_id: string; paciente_id: string; hospital_id: string | null; modalidad: string; descripcion: string; prioridad: string; indicacion: string }) {
  unwrap(await supabase.from('solicitudes_estudio').insert({ ...s, estado: 'enviada' }).select('id').single())
}

export async function listarHospitalesActivos(): Promise<{ id: string; nombre: string; servicios: string[] }[]> {
  return unwrap(await supabase.from('hospitales').select('id, nombre, servicios').eq('estado', 'activo').order('nombre'))
}

/** Hospitales donde el referidor tiene estudios o solicitudes */
export async function fetchMisHospitalesReferidor(medicoId: string): Promise<HospitalAsignado[]> {
  const [est, sol] = await Promise.all([
    supabase.from('estudios').select('hospital_id, estado, recibido_en, informes(estado)').eq('medico_referidor_id', medicoId),
    supabase.from('solicitudes_estudio').select('hospital_id').eq('medico_id', medicoId),
  ])
  const estudios = unwrap(est) as FilaEstudio[]
  const ids = [...new Set([...estudios.map((e) => e.hospital_id), ...(unwrap(sol) as { hospital_id: string | null }[]).map((s) => s.hospital_id)].filter(Boolean))] as string[]
  if (!ids.length) return []
  const hs = unwrap(await supabase.from('hospitales').select('id, nombre, municipio, direccion, telefono, correo, director, servicios, created_at, provincias(nombre, region_salud), linkconnect_nodos(estado)').in('id', ids)) as FilaEstudio[]
  return hs.map((h) => {
    const propios = estudios.filter((e) => e.hospital_id === h.id)
    const lc = arr(h.linkconnect_nodos)[0] as FilaEstudio | undefined
    return {
      id: h.id, name: h.nombre, city: [h.municipio, h.provincias?.nombre].filter(Boolean).join(', '), region: h.provincias?.region_salud ? `Región ${h.provincias.region_salud}` : '—',
      address: h.direccion ?? '—', phone: h.telefono ?? '—', email: h.correo ?? '—', contact: h.director ? `${h.director} · Dirección` : '—',
      mods: h.servicios ?? [], since: fFecha(h.created_at), estado: 'activa',
      pendientes: propios.length, mes: propios.filter((e) => arr(e.informes).some((i: FilaEstudio) => i.estado === 'publicado')).length,
      pacs: lc?.estado === 'conectado' ? 'En línea' : lc ? 'Con incidencias' : 'Sin LINKConnect',
    }
  })
}

/** Resumen del médico para su página de inicio */
export async function fetchResumenMedico(medicoId: string, tipo: 'radiologo' | 'referidor') {
  const col = tipo === 'radiologo' ? 'radiologo_id' : 'medico_referidor_id'
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const [est, inf] = await Promise.all([
    supabase.from('estudios').select('estado, recibido_en, informes(estado, publicado_en)').eq(col, medicoId),
    tipo === 'radiologo' ? supabase.from('informes').select('estado, publicado_en, calificacion, created_at').eq('radiologo_id', medicoId) : Promise.resolve({ data: [], error: null }),
  ])
  const estudios = unwrap(est) as FilaEstudio[]
  const informes = unwrap(inf) as FilaEstudio[]
  const publicados = informes.filter((i) => i.estado === 'publicado')
  const calif = publicados.map((i) => i.calificacion).filter(Boolean) as number[]
  // Informes publicados por día de la semana (lunes a domingo) de los últimos 7 días
  const semana = Array(7).fill(0)
  const hace7 = Date.now() - 7 * 86400000
  for (const i of publicados) if (i.publicado_en && new Date(i.publicado_en).getTime() >= hace7) semana[(new Date(i.publicado_en).getDay() + 6) % 7]++
  return {
    asignados: estudios.length,
    pendientes: estudios.filter((e) => !['informado', 'cancelado'].includes(e.estado)).length,
    informesHoy: publicados.filter((i) => i.publicado_en && new Date(i.publicado_en) >= hoy).length,
    resultados: estudios.filter((e) => arr(e.informes).some((i: FilaEstudio) => i.estado === 'publicado')).length,
    calificacion: calif.length ? (calif.reduce((a, b) => a + b, 0) / calif.length).toFixed(1) : '—',
    semana, informesSemana: semana.reduce((a, b) => a + b, 0),
  }
}

/* ------------------------------ Perfil del médico ------------------------------ */

export type FichaMedico = {
  id: string; codigo: string; tipo: string; exequatur: string; tratamiento: string; nombre_completo: string; cedula: string | null
  correo: string; tel_residencia: string | null; tel_whatsapp: string | null; especialidades: string[]; otra_especialidad: string | null
  regiones_interes: string[]; provincia: string | null; municipio: string | null; sector: string | null; calle: string | null; casa: string | null
  residencial: string | null; centro_trabajo: string | null; disponible: boolean; bio: string | null; created_at: string
  medico_documentos: { id: string; tipo: string; archivo_path: string; nombre_archivo: string | null; tamano_bytes: number | null; estado: string; created_at: string }[]
}

export async function fetchMiFichaMedico(medicoId: string): Promise<FichaMedico> {
  return unwrap(await supabase.from('medicos').select('*, medico_documentos(id, tipo, archivo_path, nombre_archivo, tamano_bytes, estado, created_at)').eq('id', medicoId).single()) as FichaMedico
}

/** El médico actualiza sus datos de contacto, regiones o disponibilidad */
export async function actualizarMedico(medicoId: string, cambios: Partial<FichaMedico>) {
  unwrap(await supabase.from('medicos').update(cambios).eq('id', medicoId).select('id').single())
}

/** Sube un documento adicional a la carpeta privada del médico */
export async function subirDocumentoMedico(medicoId: string, userId: string, tipo: string, file: File) {
  const limpio = file.name.normalize('NFD').replace(/[^\w.-]+/g, '_')
  const path = `${userId}/${tipo}-${Date.now()}-${limpio}`
  const up = await supabase.storage.from('documentos-medicos').upload(path, file)
  if (up.error) throw new Error(up.error.message)
  unwrap(await supabase.from('medico_documentos').insert({ medico_id: medicoId, tipo, archivo_path: path, nombre_archivo: file.name, tamano_bytes: file.size }).select('id').single())
}
