import { Building2, Clock, FileText, Image as ImageIcon, Users } from 'lucide-react'
import PublicLayout, { PageHero, SectionTitle } from '../../layouts/PublicLayout'
import { Bars, Donut, Legend } from '../../components/charts'
import { Bar } from '../../components/ui'
import { supabaseConfigurado } from '../../lib/supabase'
import { useCifrasPublicas } from '../../lib/publico'

const KPIS = [
  { icon: Building2, v: '128', l: 'Hospitales conectados' },
  { icon: Users, v: '+500', l: 'Radiólogos registrados' },
  { icon: FileText, v: '+2.1 M', l: 'Estudios realizados (anual)' },
  { icon: ImageIcon, v: '+333 M', l: 'Imágenes disponibles' },
  { icon: Clock, v: '6.8 h', l: 'Tiempo promedio de informe' },
]

const MOD = [
  { label: 'Rayos X (RX)', value: 5432, color: '#2f6bff' },
  { label: 'Tomografía (TC)', value: 3125, color: '#8b5cf6' },
  { label: 'Resonancia (RM)', value: 1842, color: '#ec4899' },
  { label: 'Ultrasonido (US)', value: 1236, color: '#16a34a' },
  { label: 'Mamografía (MG)', value: 452, color: '#f59e0b' },
  { label: 'Otros', value: 371, color: '#94a3b8' },
]

const REG = [['Cibao Sur', 35.1], ['Ozama / Metropolitana', 28.4], ['Cibao Norte', 12.3], ['Este', 9.6], ['Sur', 8.2], ['Noroeste', 6.4]] as const

function SinDatos() {
  return <p className="mt-6 rounded-xl bg-[#f6f9fe] py-10 text-center text-[14px] text-slate-500">Disponible cuando los hospitales de la red comiencen a enviar estudios.</p>
}

export default function Stats() {
  const c = useCifrasPublicas()
  const real = supabaseConfigurado
  const kpis = real
    ? [{ ...KPIS[0], v: c.hospitales }, { ...KPIS[1], v: c.radiologos }, { ...KPIS[2], v: c.estudios }, { ...KPIS[3], v: c.imagenes }, { ...KPIS[4], v: '—' }]
    : KPIS
  return (
    <PublicLayout>
      <PageHero eyebrow="ESTADÍSTICAS" title="La red en números" text="Indicadores públicos de la Red Nacional de Salud. Los datos se actualizarán automáticamente cuando la plataforma esté conectada al Repositorio Nacional." image="/img/radiologo-monitor.webp" />
      <section className="section-x py-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {kpis.map((k) => (
            <div key={k.l} className="card p-5 text-center">
              <k.icon size={26} className="mx-auto text-brand-600" />
              <div className="mt-2 text-[28px] font-bold">{k.v}</div>
              <div className="text-[13px] text-ink/70">{k.l}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-2">
            <SectionTitle>Estudios por mes</SectionTitle>
            {real ? <SinDatos /> : <div className="mt-6"><Bars labels={['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']} series={[{ name: 'Estudios', color: '#3b82f6', values: [168, 182, 176, 190, 186, 201, 198, 210, 205, 214, 220, 231].map((v) => v * 1000) }]} height={220} /></div>}
          </div>
          <div className="card p-6">
            <SectionTitle>Por modalidad</SectionTitle>
            {real ? <SinDatos /> : <div className="mt-6 flex flex-col items-center gap-5">
              <Donut data={MOD} size={170} center={<><b className="text-[22px]">12,458</b><span className="text-[12px] text-slate-500">Estudios</span></>} />
              <Legend data={MOD} className="w-full" />
            </div>}
          </div>
        </div>
        <div className="card mt-6 p-6">
          <SectionTitle>Distribución por región</SectionTitle>
          {real ? <SinDatos /> : <div className="mt-6 grid gap-4 md:grid-cols-2">
            {REG.map(([r, p], i) => (
              <div key={r} className="flex items-center gap-4">
                <span className="w-44 text-[14px]">{r}</span>
                <Bar value={p} max={40} color={['#2f6bff', '#16a34a', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'][i]} height={12} />
                <span className="w-14 text-right text-[14px] font-semibold">{p}%</span>
              </div>
            ))}
          </div>}
        </div>
      </section>
    </PublicLayout>
  )
}
