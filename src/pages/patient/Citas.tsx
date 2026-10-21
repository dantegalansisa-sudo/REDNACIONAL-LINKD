import { useState } from 'react'
import { Bell, CalendarClock, CalendarPlus, CheckCircle2, Circle, Clock, MapPin, UserRound, X } from 'lucide-react'
import { Badge, Modal, Modality, Toggle, clsx } from '../../components/ui'
import { PortalHeading } from './PatientPortal'

type Appt = { id: number; day: string; month: string; weekday: string; time: string; title: string; mod?: string; place: string; doctor: string; status: 'Confirmada' | 'Pendiente de confirmar' | 'Cancelada'; prep?: string }

const INITIAL: Appt[] = [
  { id: 1, day: '07', month: 'ABR', weekday: 'Lunes', time: '09:30 a. m.', title: 'Control de Medicina Interna', place: 'Hospital Hugo Mendoza · Consultorio 305', doctor: 'Dr. Luis Fernando González Santana', status: 'Confirmada' },
  { id: 2, day: '14', month: 'ABR', weekday: 'Lunes', time: '07:45 a. m.', title: 'Resonancia magnética de rodilla (control)', mod: 'MR', place: 'Hospital Dr. Francisco A. Gonzalvo · Imágenes', doctor: 'Solicitado por Dr. Luis Fernando González Santana', status: 'Pendiente de confirmar', prep: 'Retirar objetos metálicos. Llegar 30 minutos antes.' },
  { id: 3, day: '05', month: 'MAY', weekday: 'Lunes', time: '10:00 a. m.', title: 'Sesión de fisioterapia', place: 'Hospital General · Rehabilitación', doctor: 'Lic. Patricia Almonte', status: 'Confirmada' },
]

const FOLLOW = [
  { title: 'Tomografía de cráneo realizada', date: '15/03/2025', done: true },
  { title: 'Informe radiológico publicado', date: '16/03/2025', done: true },
  { title: 'Revisión de resultados con tu médico', date: '07/04/2025', done: false },
  { title: 'Resonancia de control de rodilla', date: '14/04/2025', done: false },
  { title: 'Alta del seguimiento', date: 'Por definir', done: false },
]

const HISTORY = [
  { date: '10/03/2025', title: 'Consulta de Medicina Interna', place: 'Hospital Hugo Mendoza', status: 'Asistida' },
  { date: '02/03/2025', title: 'Radiografía de tórax', place: 'Hospital General', status: 'Asistida' },
  { date: '20/02/2025', title: 'Consulta de Ortopedia', place: 'Hospital General', status: 'No asistida' },
]

export default function Citas() {
  const [appts, setAppts] = useState(INITIAL)
  const [cancel, setCancel] = useState<Appt | null>(null)
  const [req, setReq] = useState(false)
  const [reqSent, setReqSent] = useState(false)
  const [rem, setRem] = useState({ wa: true, sms: false, mail: true })

  return (
    <div>
      <PortalHeading icon={CalendarClock} title="Citas y seguimiento" subtitle="Tus próximas citas, estudios programados y el seguimiento de tu atención."
        actions={<button onClick={() => { setReq(true); setReqSent(false) }} className="btn-primary"><CalendarPlus size={16} /> Solicitar cita</button>} />

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4">
          <section className="card">
            <div className="card-head border-b border-[#eef2f8] !pb-3"><h3 className="card-title"><CalendarClock size={18} className="text-brand-600" /> Próximas citas</h3></div>
            <div className="divide-y divide-[#eef2f8]">
              {appts.map((a) => (
                <div key={a.id} className={clsx('flex flex-col gap-4 p-4 sm:flex-row sm:items-center', a.status === 'Cancelada' && 'opacity-60')}>
                  <div className="flex h-[78px] w-[78px] shrink-0 flex-col items-center justify-center rounded-xl bg-brand-600 text-white">
                    <span className="text-[26px] font-bold leading-none">{a.day}</span>
                    <span className="text-[12px] font-semibold tracking-wide">{a.month}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15.5px] font-bold text-navy-800">{a.title}</p>
                      {a.mod && <Modality m={a.mod} />}
                    </div>
                    <div className="mt-1 grid gap-x-5 gap-y-0.5 text-[12.5px] text-slate-600 sm:grid-cols-2">
                      <p className="flex items-center gap-1.5"><Clock size={13} className="text-brand-700" /> {a.weekday}, {a.time}</p>
                      <p className="flex items-center gap-1.5"><MapPin size={13} className="text-brand-700" /> {a.place}</p>
                      <p className="flex items-center gap-1.5 sm:col-span-2"><UserRound size={13} className="text-brand-700" /> {a.doctor}</p>
                    </div>
                    {a.prep && <p className="mt-2 rounded-md bg-amber-50 px-3 py-1.5 text-[12px] text-amber-700"><b>Preparación:</b> {a.prep}</p>}
                  </div>
                  <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
                    <Badge tone={a.status === 'Confirmada' ? 'green' : a.status === 'Cancelada' ? 'red' : 'orange'}>{a.status}</Badge>
                    {a.status !== 'Cancelada' && (
                      <div className="flex gap-1.5">
                        {a.status === 'Pendiente de confirmar' && (
                          <button onClick={() => setAppts(appts.map((x) => x.id === a.id ? { ...x, status: 'Confirmada' } : x))} className="btn-primary !px-3 !py-1 !text-[12px]">Confirmar</button>
                        )}
                        <button onClick={() => setCancel(a)} className="btn-outline !px-3 !py-1 !text-[12px]">Cancelar</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-head border-b border-[#eef2f8] !pb-3"><h3 className="card-title">Historial de citas</h3></div>
            <div className="divide-y divide-[#eef2f8] px-4">
              {HISTORY.map((h) => (
                <div key={h.date + h.title} className="flex flex-wrap items-center gap-3 py-2.5 text-[13px]">
                  <span className="w-24 text-slate-500">{h.date}</span>
                  <span className="min-w-0 flex-1 font-medium text-ink">{h.title}<span className="block text-[12px] font-normal text-slate-500">{h.place}</span></span>
                  <Badge tone={h.status === 'Asistida' ? 'blue' : 'gray'}>{h.status}</Badge>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="card p-4">
            <h3 className="text-[15px] font-bold text-navy-800">Seguimiento: cefalea recurrente</h3>
            <p className="text-[12.5px] text-slate-500">Plan indicado por Dr. Luis Fernando González Santana</p>
            <div className="my-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8eef8]"><div className="h-full w-2/5 rounded-full bg-brand-600" /></div>
              <span className="text-[12.5px] font-semibold text-brand-700">2 de 5</span>
            </div>
            <ol className="space-y-3">
              {FOLLOW.map((f, i) => (
                <li key={f.title} className="flex gap-3">
                  {f.done ? <CheckCircle2 size={20} className="shrink-0 fill-emerald-600 text-white" /> : <Circle size={20} className={clsx('shrink-0', i === 2 ? 'text-brand-600' : 'text-slate-300')} />}
                  <div className="text-[13px]">
                    <p className={clsx('font-medium', f.done ? 'text-slate-500 line-through' : 'text-ink')}>{f.title}</p>
                    <p className="text-[12px] text-slate-500">{f.date}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-navy-800"><Bell size={17} className="text-brand-600" /> Recordatorios</h3>
            {([['wa', 'WhatsApp (809-555-1234)'], ['sms', 'Mensaje de texto (SMS)'], ['mail', 'Correo electrónico']] as const).map(([k, l]) => (
              <div key={k} className="flex items-center justify-between border-b border-[#eef2f8] py-2.5 text-[13px] last:border-0">
                <span className="text-ink">{l}</span>
                <Toggle on={rem[k]} onChange={(v) => setRem({ ...rem, [k]: v })} />
              </div>
            ))}
            <p className="mt-2 text-[12px] text-slate-500">Te avisaremos 24 horas antes de cada cita.</p>
          </section>
        </div>
      </div>

      <Modal open={!!cancel} onClose={() => setCancel(null)} className="max-w-[440px]">
        <div className="p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500"><X size={28} /></span>
          <h2 className="mt-3 text-[19px] font-bold text-navy-800">¿Cancelar esta cita?</h2>
          <p className="mt-1 text-[13.5px] text-slate-600">{cancel?.title} — {cancel?.weekday} {cancel?.day} {cancel?.month}, {cancel?.time}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button onClick={() => setCancel(null)} className="btn-outline">Volver</button>
            <button onClick={() => { setAppts(appts.map((x) => x.id === cancel?.id ? { ...x, status: 'Cancelada' } : x)); setCancel(null) }} className="btn bg-red-600 text-white hover:bg-red-700">Sí, cancelar</button>
          </div>
        </div>
      </Modal>

      <Modal open={req} onClose={() => setReq(false)} className="max-w-[520px]">
        <div className="p-6">
          <h2 className="pr-8 text-[20px] font-bold text-navy-800">Solicitar cita</h2>
          {reqSent ? (
            <p className="mt-4 rounded-lg bg-emerald-50 p-4 text-[14px] text-emerald-700">Solicitud enviada. El centro te contactará para confirmar fecha y hora.</p>
          ) : (
            <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); setReqSent(true) }}>
              <div><label className="label">Tipo de cita</label><select className="input"><option>Consulta médica</option><option>Estudio de imágenes</option><option>Revisión de resultados</option></select></div>
              <div><label className="label">Hospital</label><select className="input"><option>Hospital Hugo Mendoza</option><option>Hospital General</option><option>Hospital Dr. Francisco A. Gonzalvo</option></select></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="label">Fecha preferida</label><input type="date" className="input" required /></div>
                <div><label className="label">Horario</label><select className="input"><option>Mañana</option><option>Tarde</option></select></div>
              </div>
              <div><label className="label">Motivo</label><textarea rows={3} className="input resize-none" placeholder="Describe brevemente el motivo" /></div>
              <div className="flex justify-end gap-2 pt-1"><button type="button" onClick={() => setReq(false)} className="btn-outline">Cancelar</button><button className="btn-primary">Enviar solicitud</button></div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  )
}
