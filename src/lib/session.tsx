import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase, supabaseConfigurado } from './supabase'
import type { Rol } from './api'

/** Datos del usuario conectado que usan los portales y el panel */
export type Sesion = {
  userId: string
  rol: Rol | null
  nombre: string
  correo: string | null
  paciente?: {
    id: string; codigo: string; nombres: string; nombre_completo: string; documento: string; tipo_documento: string
    fecha_nacimiento: string | null; sexo: string | null; telefono: string | null; whatsapp: string | null; correo: string | null
    debe_cambiar_clave: boolean
  }
  medico?: {
    id: string; codigo: string; tipo: 'radiologo' | 'referidor'; tratamiento: string; nombres: string; nombre_completo: string
    exequatur: string; correo: string; tel_whatsapp: string | null; especialidades: string[]; estado_registro: string; foto_path: string | null
  }
}

async function cargarSesion(): Promise<Sesion | null> {
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) return null
  const { data: perfil } = await supabase.from('profiles').select('rol, nombre_completo, correo').eq('id', user.id).maybeSingle()
  const s: Sesion = { userId: user.id, rol: (perfil?.rol as Rol) ?? null, nombre: perfil?.nombre_completo ?? '', correo: perfil?.correo ?? user.email ?? null }
  if (s.rol === 'paciente') {
    const { data: p } = await supabase.from('pacientes')
      .select('id, codigo, nombres, nombre_completo, documento, tipo_documento, fecha_nacimiento, sexo, telefono, whatsapp, correo, debe_cambiar_clave')
      .eq('user_id', user.id).maybeSingle()
    if (p) s.paciente = p as Sesion['paciente']
  }
  if (s.rol === 'radiologo' || s.rol === 'referidor') {
    const { data: m } = await supabase.from('medicos')
      .select('id, codigo, tipo, tratamiento, nombres, nombre_completo, exequatur, correo, tel_whatsapp, especialidades, estado_registro, foto_path')
      .eq('user_id', user.id).maybeSingle()
    if (m) s.medico = m as Sesion['medico']
  }
  return s
}

const Ctx = createContext<{ sesion: Sesion | null; recargar: () => Promise<void> }>({ sesion: null, recargar: async () => {} })

/** Sesión actual (null en modo demostración o sin iniciar sesión) */
export const useSesion = () => useContext(Ctx)

function Cargando() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
    </div>
  )
}

/**
 * Protege un portal: exige sesión con uno de los roles indicados.
 * En modo demostración (sin Supabase configurado) deja pasar.
 */
export function RequiereSesion({ roles, login, children }: { roles: Rol[]; login: string; children: ReactNode }) {
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'fuera'>(supabaseConfigurado ? 'cargando' : 'ok')
  const [sesion, setSesion] = useState<Sesion | null>(null)

  const recargar = async () => {
    const s = await cargarSesion()
    const permitido = s && s.rol && roles.includes(s.rol) && (!s.medico || s.medico.estado_registro === 'aprobado')
    setSesion(permitido ? s : null)
    setEstado(permitido ? 'ok' : 'fuera')
  }

  useEffect(() => {
    if (!supabaseConfigurado) return
    recargar()
    const { data } = supabase.auth.onAuthStateChange((evento) => { if (evento === 'SIGNED_OUT') setEstado('fuera') })
    return () => data.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (estado === 'cargando') return <Cargando />
  if (estado === 'fuera') return <Navigate to={login} replace />
  return <Ctx.Provider value={{ sesion, recargar }}>{children}</Ctx.Provider>
}

/** Fecha ISO (aaaa-mm-dd) → dd/mm/aaaa (edad) */
export function fechaConEdad(iso: string | null | undefined) {
  if (!iso) return '—'
  const [a, m, d] = iso.split('-').map(Number)
  const hoy = new Date()
  let edad = hoy.getFullYear() - a
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) edad--
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a} (${edad} años)`
}

/** Cédula 00115678901 → 001-1567890-1 */
export function formatoCedula(doc: string) {
  return /^\d{11}$/.test(doc) ? doc.replace(/^(\d{3})(\d{7})(\d)$/, '$1-$2-$3') : doc
}
