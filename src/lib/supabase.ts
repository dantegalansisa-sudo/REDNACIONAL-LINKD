import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** true cuando las variables de entorno de Supabase están configuradas */
export const supabaseConfigurado = Boolean(url && anonKey)

/**
 * Cliente único de Supabase para toda la app.
 * Usa solo la clave pública (anon/publishable); la seguridad la aplican las políticas RLS de la base de datos.
 */
export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'sin-configurar', {
  auth: { persistSession: true, autoRefreshToken: true },
})
