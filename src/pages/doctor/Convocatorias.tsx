import { useState } from 'react'
import { Building2, Calendar, CheckCircle2, Clock, DollarSign, MapPin, Megaphone, Send } from 'lucide-react'
import { Badge, Modal, Modality, Tabs, clsx } from '../../components/ui'
import { PortalHeading } from '../patient/PatientPortal'
import { RoleNotice, useDoctorRole } from './DoctorPortal'

type Call = { id: string; title: string; hospital: string; region: string; mods: string[]; schedule: string; volume: string; pay: string; close: string; match: number; desc: string; reqs: string[] }

const CALLS: Call[] = [
  { id: 'CONV-2026-031', title: 'Cobertura nocturna de tomografía', hospital: 'Hospital Regional Taiwán', region: 'Azua · Región Valdesia', mods: ['CT'], schedule: 'Lunes a viernes, 11:00 p. m. – 7:00 a. m.', volume: '≈ 25 estudios / noche', pay: 'RD$ 450 por estudio', close: '30/10/2026', match: 96, desc: 'Lectura remota de tomografías de emergencia en horario nocturno con tiempo de respuesta máximo de 60 minutos.', reqs: ['Exequátur vigente', 'Experiencia mínima de 3 años en TC', 'Disponibilidad nocturna'] },
  { id: 'CONV-2026-029', title: 'Lectura de mamografías de tamizaje', hospital: 'Hospital Dr. Marcelino Vélez', region: 'Santo Domingo Oeste · Región Ozama', mods: ['MG'], schedule: 'Flexible, entrega en 48 horas', volume: '≈ 120 estudios / semana', pay: 'RD$ 380 por estudio', close: '05/11/2026', match: 88, desc: 'Programa nacional de detección temprana de cáncer de mama. Clasificación BI-RADS obligatoria.', reqs: ['Exequátur vigente', 'Formación en imagen mamaria', 'Uso de plantilla BI-RADS'] },
  { id: 'CONV-2026-027', title: 'Radiólogo de apoyo para resonancia', hospital: 'Hospital Dr. Francisco A. Gonzalvo', region: 'Santiago · Región Cibao Norte', mods: ['MR'], schedule: 'Fines de semana, 8:00 a. m. – 4:00 p. m.', volume: '≈ 18 estudios / día', pay: 'RD$ 650 por estudio', close: '12/11/2026', match: 81, desc: 'Apoyo en lectura de resonancias musculoesqueléticas y neurológicas durante fines de semana.', reqs: ['Exequátur vigente', 'Experiencia en RM musculoesquelética'] },
  { id: 'CONV-2026-024', title: 'Ecografía general — atención primaria', hospital: 'Hospital Municipal de Baní', region: 'Peravia · Región Valdesia', mods: ['US', 'RX'], schedule: 'Lunes a viernes, 8:00 a. m. – 12:00 p. m.', volume: '≈ 40 estudios / día', pay: 'RD$ 300 por estudio', close: '20/11/2026', match: 64, desc: 'Lectura de radiografías y validación de ecografías realizadas por técnicos en centros de primer nivel.', reqs: ['Exequátur vigente'] },
]

const APPLIED = [
  { title: 'Lectura de urgencias de rayos X', hospital: 'Hospital General', date: '02/10/2026', status: 'En evaluación', tone: 'blue' as const },
  { title: 'Cobertura de tomografía diurna', hospital: 'Hospital Hugo Mendoza', date: '15/01/2024', status: 'Aprobada', tone: 'green' as const },
]

export default function Convocatorias() {
  const { role } = useDoctorRole()
  const [tab, setTab] = useState(0)
  const [apply, setApply] = useState<Call | null>(null)
  const [applied, setApplied] = useState<string[]>([])
  const [sent, setSent] = useState(false)
  const [accept, setAccept] = useState(false)

  if (role !== 'radiologo') return <RoleNotice needed="radiologo" />

  const close = () => { setApply(null); setSent(false); setAccept(false) }

  return (
    <div>
      <PortalHeading icon={Megaphone} title="Convocatorias" subtitle="Oportunidades de lectura abiertas en hospitales de la red según tu perfil y región de interés." />
      <section className="card mb-4"><Tabs tabs={[`Disponibles (${CALLS.length})`, `Mis postulaciones (${APPLIED.length + applied.length})`]} active={tab} onChange={setTab} size="md" className="px-3" /></section>

      {tab === 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {CALLS.map((c) => {
            const done = applied.includes(c.id)
            return (
              <article key={c.id} className="card flex flex-col p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold text-brand-700">{c.id}</p>
                    <h3 className="text-[17px] font-bold text-navy-800">{c.title}</h3>
                  </div>
                  <span className={clsx('rounded-full px-3 py-1 text-[12px] font-bold', c.match >= 85 ? 'bg-emerald-50 text-emerald-700' : c.match >= 75 ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600')}>{c.match}% compatible</span>
                </div>
                <p className="mt-1 text-[13px] text-slate-600">{c.desc}</p>
                <div className="mt-3 grid gap-x-4 gap-y-1.5 text-[12.5px] text-slate-600 sm:grid-cols-2">
                  <p className="flex items-center gap-1.5"><Building2 size={14} className="text-brand-700" /> {c.hospital}</p>
                  <p className="flex items-center gap-1.5"><MapPin size={14} className="text-brand-700" /> {c.region}</p>
                  <p className="flex items-center gap-1.5"><Clock size={14} className="text-brand-700" /> {c.schedule}</p>
                  <p className="flex items-center gap-1.5"><DollarSign size={14} className="text-brand-700" /> {c.pay}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.mods.map((m) => <Modality key={m} m={m} />)}
                  {c.reqs.map((r) => <span key={r} className="rounded-md bg-[#f3f7fd] px-2 py-0.5 text-[11.5px] text-ink/80">{r}</span>)}
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                  <span className="flex items-center gap-1.5 text-[12.5px] text-slate-500"><Calendar size={14} /> Cierra: {c.close} · {c.volume}</span>
                  {done ? <Badge tone="green" icon>Postulación enviada</Badge> : <button onClick={() => setApply(c)} className="btn-primary"><Send size={15} /> Aplicar</button>}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <section className="card divide-y divide-[#eef2f8]">
          {[...CALLS.filter((c) => applied.includes(c.id)).map((c) => ({ title: c.title, hospital: c.hospital, date: '20/10/2026', status: 'Enviada', tone: 'purple' as const })), ...APPLIED].map((a) => (
            <div key={a.title} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Megaphone size={19} /></span>
              <div className="min-w-0 flex-1"><p className="text-[14.5px] font-bold text-navy-800">{a.title}</p><p className="text-[12.5px] text-slate-500">{a.hospital} · Postulado el {a.date}</p></div>
              <Badge tone={a.tone}>{a.status}</Badge>
            </div>
          ))}
        </section>
      )}

      <Modal open={!!apply} onClose={close} className="max-w-[500px]">
        {apply && (
          <div className="p-6">
            {sent ? (
              <div className="text-center">
                <CheckCircle2 size={56} className="mx-auto fill-emerald-500 text-white" />
                <h2 className="mt-3 text-[20px] font-bold text-navy-800">¡Postulación enviada!</h2>
                <p className="mt-1 text-[13.5px] text-slate-600">El equipo de la Red Nacional de Salud evaluará tu perfil para «{apply.title}». Te notificaremos por correo y en el portal.</p>
                <button onClick={close} className="btn-primary mt-5">Entendido</button>
              </div>
            ) : (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Send size={22} /></span>
                <h2 className="mt-3 pr-8 text-[20px] font-bold text-navy-800">Confirmar postulación</h2>
                <p className="mt-1 text-[13.5px] text-slate-600">Vas a aplicar a <b className="text-ink">{apply.title}</b> en {apply.hospital}.</p>
                <div className="mt-4 space-y-1.5 rounded-xl bg-[#f7faff] p-4 text-[13px]">
                  <p><span className="text-slate-500">Horario: </span>{apply.schedule}</p>
                  <p><span className="text-slate-500">Volumen estimado: </span>{apply.volume}</p>
                  <p><span className="text-slate-500">Honorarios: </span>{apply.pay}</p>
                  <p><span className="text-slate-500">Se enviará: </span>perfil profesional, exequátur y documentos cargados.</p>
                </div>
                <label className="mt-4 flex items-start gap-2 text-[13px] text-ink">
                  <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 accent-brand-600" />
                  Confirmo mi disponibilidad y acepto las condiciones de la convocatoria.
                </label>
                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={close} className="btn-outline">Cancelar</button>
                  <button disabled={!accept} onClick={() => { setApplied([...applied, apply.id]); setSent(true) }} className="btn-primary">Confirmar y aplicar</button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
