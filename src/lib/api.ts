import { supabase, supabaseConfigurado } from './supabase'
import { BRAND } from '../config/brand'

/* =====================================================================
 * Capa de datos: todas las llamadas a Supabase de los formularios y logins.
 * Si Supabase no está configurado (.env), la web funciona en modo demostración.
 * ===================================================================== */

export { supabaseConfigurado }

export type Rol = 'admin' | 'coordinador' | 'operador' | 'radiologo' | 'referidor' | 'paciente'

/** Traduce los errores técnicos de Supabase a mensajes para el usuario */
export function mensajeError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e)
  if (/Invalid login credentials/i.test(msg)) return 'Usuario o contraseña incorrectos.'
  if (/pacientes_tipo_documento_documento_key|documento.*duplicate/i.test(msg)) return 'Este documento ya está registrado. Inicia sesión con tu código de paciente.'
  if (/medicos_exequatur_key/i.test(msg)) return 'Este número de exequátur ya está registrado.'
  if (/User already registered|already been registered/i.test(msg)) return 'Este correo electrónico ya está registrado.'
  if (/Password should be at least/i.test(msg)) return 'La contraseña debe tener al menos 8 caracteres.'
  if (/rate limit|too many/i.test(msg)) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'No hay conexión con el servidor. Revisa tu internet.'
  return msg
}

/** Normaliza cédula (solo dígitos) o pasaporte (mayúsculas sin espacios), igual que la base de datos */
export function normalizarDocumento(tipo: 'cedula' | 'pasaporte', doc: string) {
  return tipo === 'cedula' ? doc.replace(/\D/g, '') : doc.replace(/\s/g, '').toUpperCase()
}

function claveAleatoria() {
  const a = new Uint8Array(24)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('') + 'Aa1!'
}

function dispositivo() {
  const ua = navigator.userAgent
  const disp = /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'Celular' : 'PC'
  const nav = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Otro'
  const so = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Otro'
  return { disp, nav: `${nav} / ${so}` }
}

async function registrarAcceso() {
  const { disp, nav } = dispositivo()
  await supabase.rpc('registrar_acceso', { p_dispositivo: disp, p_navegador: nav })
}

/* ------------------------------ Pacientes ------------------------------ */

export async function documentoRegistrado(tipo: 'cedula' | 'pasaporte', doc: string) {
  const { data, error } = await supabase.rpc('documento_registrado', { p_tipo: tipo, p_documento: doc })
  if (error) throw error
  return Boolean(data)
}

export type DatosPaciente = {
  tipo_documento: 'cedula' | 'pasaporte'; documento: string; nombres: string; apellidos: string
  fecha_nacimiento: string; sexo: string; nacionalidad: string
  telefono: string; whatsapp: string; correo: string
  provincia: string; municipio: string; sector: string; calle: string; numero: string; apartamento: string; referencia: string
  ocupacion: string; estado_civil: string; emergencia_telefono: string; emergencia_parentesco: string
}

/**
 * Crea la cuenta del paciente. Su usuario es el código RNS y su clave inicial es su documento.
 * La cuenta usa un correo interno (no recibe correos); el correo real va en la ficha del paciente.
 * Devuelve el código de paciente generado por la base de datos.
 */
export async function registrarPaciente(d: DatosPaciente): Promise<string> {
  const documento = normalizarDocumento(d.tipo_documento, d.documento)
  const correoInterno = `p.${crypto.randomUUID()}@${BRAND.patientAuthDomain}`
  const { data, error } = await supabase.auth.signUp({
    email: correoInterno,
    password: documento,
    options: { data: { rol: 'paciente', ...d, documento } },
  })
  if (error) throw error
  if (!data.session) throw new Error('No se pudo iniciar la sesión del nuevo paciente. Verifique que "Confirm email" esté desactivado en Supabase.')
  const { data: pac, error: e2 } = await supabase.from('pacientes').select('codigo').eq('user_id', data.user!.id).single()
  await supabase.auth.signOut()
  if (e2) throw e2
  return pac.codigo as string
}

export async function loginPaciente(codigo: string, clave: string) {
  const { data: correo, error } = await supabase.rpc('correo_login_paciente', { p_codigo: codigo })
  if (error) throw error
  if (!correo) throw new Error('No encontramos un paciente activo con ese código.')
  const { error: e2 } = await supabase.auth.signInWithPassword({ email: correo as string, password: clave.trim() })
  if (e2) {
    // La clave inicial es el documento normalizado: se reintenta por si lo escribió con guiones
    const alt = clave.replace(/\D/g, '')
    const r = alt && alt !== clave.trim() ? await supabase.auth.signInWithPassword({ email: correo as string, password: alt }) : null
    if (!r || r.error) throw e2
  }
  await registrarAcceso()
}

/** "¿Olvidaste tu código?": la base de datos envía el código al correo registrado (si existe) */
export async function solicitarCodigoPaciente(doc: string) {
  const { error } = await supabase.rpc('solicitar_codigo_paciente', { p_documento: doc })
  if (error) throw error
}

/** Primer acceso: el paciente reemplaza la clave inicial (su documento) por una personal */
export async function cambiarClavePrimerAcceso(nueva: string) {
  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) throw error
  const { error: e2 } = await supabase.rpc('marcar_clave_cambiada')
  if (e2) throw e2
}

/** Cambio de contraseña desde "Mi perfil → Seguridad": verifica la actual antes de cambiarla */
export async function cambiarClave(actual: string, nueva: string) {
  const { data } = await supabase.auth.getUser()
  const email = data.user?.email
  if (!email) throw new Error('La sesión expiró. Vuelve a iniciar sesión.')
  const { error } = await supabase.auth.signInWithPassword({ email, password: actual })
  if (error) throw new Error('La contraseña actual no es correcta.')
  const { error: e2 } = await supabase.auth.updateUser({ password: nueva })
  if (e2) throw e2
}

/** El paciente actualiza sus datos de contacto, dirección o contacto de emergencia */
export async function actualizarPaciente(id: string, cambios: Record<string, string>) {
  const { error } = await supabase.from('pacientes').update(cambios).eq('id', id)
  if (error) throw error
}

/* ------------------------------- Médicos ------------------------------- */

export async function exequaturRegistrado(exequatur: string) {
  const { data, error } = await supabase.rpc('exequatur_registrado', { p_exequatur: exequatur })
  if (error) throw error
  return Boolean(data)
}

export type DatosMedico = {
  tipo: 'radiologo' | 'referidor'; exequatur: string; tratamiento: string; nombres: string; apellidos: string; cedula: string; sexo: string
  tel_residencia: string; tel_whatsapp: string; correo: string
  provincia: string; municipio: string; sector: string; calle: string; casa: string; residencial: string
  especialidades: string[]; otra_especialidad: string; regiones_interes: string[]
}
export type DocumentoMedico = { tipo: 'titulo' | 'exequatur' | 'cedula' | 'especialidad' | 'otros'; file: File }

/**
 * Registra al médico: crea su cuenta (queda "pendiente"), sube la foto y los documentos a su carpeta privada.
 * El médico define su contraseña cuando el SNS aprueba la solicitud (recibe un correo para crearla).
 */
export async function registrarMedico(d: DatosMedico, foto: File | null, documentos: DocumentoMedico[]) {
  const { correo, tipo, ...resto } = d
  const { data, error } = await supabase.auth.signUp({
    email: correo.trim().toLowerCase(),
    password: claveAleatoria(),
    options: { data: { rol: tipo, ...resto } },
  })
  if (error) throw error
  if (!data.session) throw new Error('No se pudo completar el registro. Verifique que "Confirm email" esté desactivado en Supabase.')
  const uid = data.user!.id
  try {
    const { data: med, error: e1 } = await supabase.from('medicos').select('id').eq('user_id', uid).single()
    if (e1) throw e1
    if (foto) {
      const path = `${uid}/foto.${foto.name.split('.').pop()?.toLowerCase() || 'jpg'}`
      const { error: ef } = await supabase.storage.from('fotos-perfil').upload(path, foto, { upsert: true })
      if (ef) throw ef
      await supabase.from('medicos').update({ foto_path: path }).eq('id', med.id)
    }
    for (const doc of documentos) {
      const limpio = doc.file.name.normalize('NFD').replace(/[^\w.-]+/g, '_')
      const path = `${uid}/${doc.tipo}-${Date.now()}-${limpio}`
      const { error: eu } = await supabase.storage.from('documentos-medicos').upload(path, doc.file)
      if (eu) throw eu
      const { error: ed } = await supabase.from('medico_documentos').insert({
        medico_id: med.id, tipo: doc.tipo, archivo_path: path, nombre_archivo: doc.file.name, tamano_bytes: doc.file.size,
      })
      if (ed) throw ed
    }
  } finally {
    await supabase.auth.signOut()
  }
}

/** Correo de acceso de un médico aprobado a partir de su exequátur */
async function correoMedico(usuario: string) {
  if (usuario.includes('@')) return usuario.trim().toLowerCase()
  const { data, error } = await supabase.rpc('correo_login_medico', { p_exequatur: usuario.trim() })
  if (error) throw error
  if (!data) throw new Error('No encontramos un médico aprobado con ese exequátur.')
  return data as string
}

export async function loginMedico(usuario: string, clave: string): Promise<'radiologo' | 'referidor'> {
  const email = await correoMedico(usuario)
  const { data: ses, error } = await supabase.auth.signInWithPassword({ email, password: clave })
  if (error) throw error
  const { data: med } = await supabase.from('medicos').select('tipo, estado_registro').eq('user_id', ses.user.id).maybeSingle()
  if (!med || med.estado_registro !== 'aprobado') {
    await supabase.auth.signOut()
    throw new Error(med?.estado_registro === 'pendiente'
      ? 'Su solicitud aún está en revisión. Le avisaremos por correo cuando sea aprobada.'
      : 'Su cuenta de médico no está activa. Contacte a soporte.')
  }
  await registrarAcceso()
  return med.tipo as 'radiologo' | 'referidor'
}

/** Médico aprobado crea su contraseña desde el enlace del correo */
export async function crearClave(nueva: string) {
  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) throw error
}

/* --------------------------- Administración --------------------------- */

export async function loginAdmin(email: string, clave: string) {
  const { data: ses, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: clave })
  if (error) throw error
  const { data: perfil } = await supabase.from('profiles').select('rol, estado').eq('id', ses.user.id).maybeSingle()
  if (!perfil || !['admin', 'coordinador', 'operador'].includes(perfil.rol) || perfil.estado !== 'activo') {
    await supabase.auth.signOut()
    throw new Error('Esta cuenta no tiene acceso al panel de administración.')
  }
  await registrarAcceso()
}

export type MedicoPendiente = {
  id: string; codigo: string; tipo: 'radiologo' | 'referidor'; tratamiento: string; nombre_completo: string; exequatur: string
  cedula: string | null; correo: string; tel_whatsapp: string | null; especialidades: string[]; regiones_interes: string[]
  estado_registro: string; created_at: string; foto_path: string | null
  medico_documentos: { id: string; tipo: string; archivo_path: string; nombre_archivo: string | null }[]
}

export async function listarSolicitudesMedicos(): Promise<MedicoPendiente[]> {
  const { data, error } = await supabase.from('medicos')
    .select('id, codigo, tipo, tratamiento, nombre_completo, exequatur, cedula, correo, tel_whatsapp, especialidades, regiones_interes, estado_registro, created_at, foto_path, medico_documentos(id, tipo, archivo_path, nombre_archivo)')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return (data ?? []) as MedicoPendiente[]
}

/** Enlace temporal (5 min) para ver un documento privado */
export async function urlArchivo(bucket: 'documentos-medicos' | 'fotos-perfil', path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
}

/** Aprueba al médico y le envía el correo para crear su contraseña */
export async function aprobarMedico(m: MedicoPendiente) {
  const { error } = await supabase.from('medicos').update({ estado_registro: 'aprobado', motivo_rechazo: null }).eq('id', m.id)
  if (error) throw error
  const { error: e2 } = await supabase.auth.resetPasswordForEmail(m.correo, { redirectTo: `${window.location.origin}/medico/crear-clave` })
  if (e2) throw new Error('Médico aprobado, pero no se pudo enviar el correo para crear la contraseña: ' + mensajeError(e2))
}

export async function rechazarMedico(id: string, motivo: string) {
  const { error } = await supabase.from('medicos').update({ estado_registro: 'rechazado', motivo_rechazo: motivo }).eq('id', id)
  if (error) throw error
}

/* ------------------------------- General ------------------------------- */

export async function enviarContacto(m: { nombre: string; correo: string; telefono: string; tipo: string; mensaje: string }) {
  const { error } = await supabase.from('mensajes_contacto').insert(m)
  if (error) throw error
}

export async function cerrarSesion() {
  await supabase.auth.signOut()
}
