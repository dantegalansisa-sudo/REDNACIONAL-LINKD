import { useState } from 'react'
import { Activity, AlertTriangle, CalendarCheck, Droplet, FileText, Folder, HeartPulse, Pill, Scan, Stethoscope, Syringe, type LucideIcon } from 'lucide-react'
import { InfoRow, Modality, clsx, type Tone } from '../../components/ui'
import { AvisoDatos, PortalHeading } from './PatientPortal'
import { useSesion } from '../../lib/session'
import { fetchMiHistoria, useDatos } from '../../lib/portal-data'

type Ev = { date: string; year: string; type: string; icon: LucideIcon; tone: Tone; title: string; place: string; detail: string; mod?: string }

const EVENTS: Ev[] = [
  { date: '15/03/2025', year: '2025', type: 'Estudio', icon: Scan, tone: 'blue', title: 'Tomografía computarizada de cráneo', place: 'Hospital Hugo Mendoza', detail: 'Informe publicado: estudio dentro de límites normales.', mod: 'CT' },
  { date: '10/03/2025', year: '2025', type: 'Consulta', icon: Stethoscope, tone: 'purple', title: 'Consulta de Medicina Interna', place: 'Dr. Luis Fernando González Santana', detail: 'Cefalea recurrente. Se indica tomografía de cráneo y control en 4 semanas.' },
  { date: '02/03/2025', year: '2025', type: 'Estudio', icon: Scan, tone: 'blue', title: 'Radiografía de tórax', place: 'Hospital General', detail: 'Chequeo preoperatorio. Sin hallazgos patológicos.', mod: 'RX' },
  { date: '28/01/2025', year: '2025', type: 'Estudio', icon: Scan, tone: 'blue', title: 'Resonancia magnética de rodilla', place: 'Hospital Dr. Francisco A. Gonzalvo', detail: 'Degeneración mucoide grado II del menisco medial.', mod: 'MR' },
  { date: '15/01/2025', year: '2025', type: 'Vacuna', icon: Syringe, tone: 'green', title: 'Vacuna contra la influenza', place: 'Centro de Salud La Fe', detail: 'Dosis anual aplicada sin reacciones adversas.' },
  { date: '12/11/2024', year: '2024', type: 'Estudio', icon: Scan, tone: 'blue', title: 'Ecografía abdominal', place: 'Hospital Hugo Mendoza', detail: 'Dentro de límites normales.', mod: 'US' },
  { date: '20/09/2024', year: '2024', type: 'Diagnóstico', icon: Activity, tone: 'orange', title: 'Lumbalgia mecánica', place: 'Dr. Luis Fernando González Santana', detail: 'Tratamiento con fisioterapia y analgésicos por 2 semanas.' },
  { date: '18/04/2024', year: '2024', type: 'Estudio', icon: Scan, tone: 'blue', title: 'Ecografía tiroidea', place: 'Hospital Hugo Mendoza', detail: 'Quiste simple tiroideo derecho, de aspecto benigno.', mod: 'US' },
]

const FILTERS = ['Todos', 'Estudio', 'Consulta', 'Diagnóstico', 'Vacuna']

/** Icono y tono de cada tipo de evento real */
const ESTILO: Record<string, { icon: LucideIcon; tone: Tone }> = {
  Estudio: { icon: Scan, tone: 'blue' }, Diagnóstico: { icon: Activity, tone: 'orange' }, Consulta: { icon: Stethoscope, tone: 'purple' },
}

export default function Historia() {
  const pac = useSesion().sesion?.paciente
  const { datos: events, cargando, error, real } = useDatos<Ev[]>(async () => {
    if (!pac) return []
    return (await fetchMiHistoria(pac.id)).map((e) => ({ ...e, ...(ESTILO[e.type] ?? ESTILO.Estudio) }))
  }, EVENTS, [pac?.id])
  const filters = real ? ['Todos', ...['Estudio', 'Diagnóstico', 'Consulta'].filter((t) => events.some((e) => e.type === t))] : FILTERS
  const [f, setF] = useState('Todos')
  const list = events.filter((e) => f === 'Todos' || e.type === f)
  const years = [...new Set(list.map((e) => e.year))]

  return (
    <div>
      <PortalHeading icon={Folder} title="Mi historia clínica" subtitle={real
        ? 'Tu historial médico en orden cronológico: estudios, diagnósticos y consultas.'
        : 'Tu historial médico en orden cronológico: estudios, consultas, diagnósticos y vacunas.'} />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="card min-w-0 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.map((x) => (
              <button key={x} onClick={() => setF(x)} className={clsx('rounded-full border px-4 py-1.5 text-[13px] font-medium transition',
                f === x ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#d7e1f2] text-ink hover:border-brand-400')}>{x}</button>
            ))}
          </div>
          <AvisoDatos cargando={cargando} error={error} vacio={events.length === 0} mensaje="Aún no hay eventos en tu historia clínica. Aquí verás tus estudios, diagnósticos y consultas realizados en la red." />
          {years.map((y) => (
            <div key={y} className="mb-2">
              <p className="mb-3 inline-block rounded-md bg-navy-800 px-3 py-1 text-[13px] font-bold text-white">{y}</p>
              <ol className="relative ml-5 border-l-2 border-brand-100">
                {list.filter((e) => e.year === y).map((e, i) => (
                  <li key={`${e.date}-${e.title}-${i}`} className="relative mb-4 pl-8">
                    <span className={clsx('absolute -left-[19px] top-0 flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-white',
                      { blue: 'bg-brand-600', purple: 'bg-violet-600', green: 'bg-emerald-600', orange: 'bg-orange-500' }[e.tone as string] ?? 'bg-brand-600')}>
                      <e.icon size={17} className="text-white" />
                    </span>
                    <div className="rounded-xl border border-[#e6edf8] p-3.5 transition hover:border-brand-200 hover:bg-brand-50/30">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-semibold text-brand-700">{e.date}</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{e.type}</span>
                        {e.mod && <Modality m={e.mod} />}
                      </div>
                      <p className="mt-1 text-[15px] font-bold text-navy-800">{e.title}</p>
                      <p className="text-[12.5px] text-slate-500">{e.place}</p>
                      <p className="mt-1.5 text-[13px] text-slate-700">{e.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>

        {real ? (
          <div className="space-y-4">
            <section className="card p-4">
              <h3 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-navy-800"><HeartPulse size={18} className="text-brand-600" /> Datos clínicos</h3>
              <p className="text-[13px] text-slate-500">Tu tipo de sangre, alergias, medicamentos y antecedentes aparecerán aquí cuando un centro de la red los registre en tu expediente.</p>
            </section>
          </div>
        ) : (
        <div className="space-y-4">
          <section className="card p-4">
            <h3 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-navy-800"><HeartPulse size={18} className="text-brand-600" /> Datos clínicos</h3>
            <InfoRow label={<span className="flex items-center gap-1.5"><Droplet size={14} /> Tipo de sangre</span>}>O+</InfoRow>
            <InfoRow label="Peso / Talla">78 kg · 1.75 m</InfoRow>
            <InfoRow label="IMC">25.5</InfoRow>
            <InfoRow label="Presión arterial">120/80 mmHg</InfoRow>
            <InfoRow label="Última actualización">10/03/2025</InfoRow>
          </section>
          <section className="card p-4">
            <h3 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-navy-800"><AlertTriangle size={18} className="text-red-500" /> Alergias</h3>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-red-50 px-3 py-1 text-[12.5px] font-medium text-red-600">Penicilina</span>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-[12.5px] font-medium text-orange-600">Medio de contraste yodado (leve)</span>
            </div>
          </section>
          <section className="card p-4">
            <h3 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-navy-800"><Pill size={18} className="text-brand-600" /> Medicamentos actuales</h3>
            <ul className="space-y-2 text-[13px]">
              <li className="rounded-lg bg-[#f7faff] p-2.5"><b className="text-ink">Losartán 50 mg</b><p className="text-slate-500">1 tableta diaria · desde 2023</p></li>
              <li className="rounded-lg bg-[#f7faff] p-2.5"><b className="text-ink">Acetaminofén 500 mg</b><p className="text-slate-500">Según necesidad para dolor</p></li>
            </ul>
          </section>
          <section className="card p-4">
            <h3 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-navy-800"><CalendarCheck size={18} className="text-brand-600" /> Antecedentes</h3>
            <ul className="list-disc space-y-1 pl-5 text-[13px] text-slate-700">
              <li>Hipertensión arterial controlada (2023)</li>
              <li>Apendicectomía (2010)</li>
              <li>Antecedente familiar de diabetes tipo 2</li>
            </ul>
            <button className="btn-outline mt-3 w-full"><FileText size={15} /> Descargar resumen clínico</button>
          </section>
        </div>
        )}
      </div>
    </div>
  )
}
