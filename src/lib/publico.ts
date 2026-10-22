import { useEffect, useState } from 'react'
import { supabase, supabaseConfigurado } from './supabase'

/** Cifras públicas de la red (sitio público). En demostración se usan las cifras de ejemplo. */
export type CifrasPublicas = { hospitales: string; radiologos: string; estudios: string; imagenes: string }

const DEMO: CifrasPublicas = { hospitales: '128', radiologos: '+500', estudios: '+2.1 M', imagenes: '+333 M' }
const CERO: CifrasPublicas = { hospitales: '0', radiologos: '0', estudios: '0', imagenes: '0' }

/** 1234567 → "1.2 M", 15300 → "15.3 K" */
const compacto = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')} M` : n >= 10_000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')} K` : n.toLocaleString('en-US')

export function useCifrasPublicas(): CifrasPublicas {
  const [c, setC] = useState<CifrasPublicas>(supabaseConfigurado ? CERO : DEMO)
  useEffect(() => {
    if (!supabaseConfigurado) return
    supabase.rpc('estadisticas_publicas').then(({ data }) => {
      if (!data) return
      const d = data as { hospitales_conectados: number; radiologos: number; estudios_anio: number; imagenes: number }
      setC({ hospitales: compacto(d.hospitales_conectados), radiologos: compacto(d.radiologos), estudios: compacto(d.estudios_anio), imagenes: compacto(d.imagenes) })
    })
  }, [])
  return c
}
