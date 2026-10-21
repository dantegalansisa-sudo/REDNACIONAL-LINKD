import { useState } from 'react'
import { Award, Building2, Calendar, FileText, Mail, MapPin, MessageCircle, Phone, Send, UserRound } from 'lucide-react'
import { Badge, InfoRow, Modal, Modality } from '../../components/ui'
import { PortalHeading, STUDIES } from './PatientPortal'

export default function Medicos() {
  const [msg, setMsg] = useState(false)
  const [sent, setSent] = useState(false)
  const [text, setText] = useState('')

  return (
    <div>
      <PortalHeading icon={UserRound} title="Médicos referidores" subtitle="Profesionales que han solicitado tus estudios de imágenes." />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="card overflow-hidden">
          <div className="flex flex-col items-center gap-5 bg-gradient-to-r from-brand-50 to-white p-5 sm:flex-row sm:items-start">
            <img src="/img/crops/dr-luis.webp" alt="Dr. Luis Fernando González Santana" className="h-32 w-32 shrink-0 rounded-full border-4 border-white object-cover shadow-card" />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <Badge tone="green" icon>Médico referidor activo</Badge>
              <h2 className="mt-1.5 text-[22px] font-bold text-navy-800 sm:text-[25px]">Dr. Luis Fernando González Santana</h2>
              <p className="text-[14.5px] text-brand-700">Medicina Interna · Código MR-000156</p>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-[13px] text-slate-600 sm:justify-start"><MapPin size={14} /> Santo Domingo, Distrito Nacional</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <button onClick={() => { setMsg(true); setSent(false) }} className="btn-primary"><MessageCircle size={16} /> Enviar mensaje</button>
                <a href="tel:8095551098" className="btn-outline"><Phone size={16} /> Llamar consultorio</a>
              </div>
            </div>
          </div>
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-[15px] font-bold text-navy-800">Datos profesionales</h3>
              <InfoRow label="Especialidad">Medicina Interna</InfoRow>
              <InfoRow label="Exequátur">45678</InfoRow>
              <InfoRow label="Centro principal">Hospital Hugo Mendoza</InfoRow>
              <InfoRow label="Consultorio">Torre Médica, piso 3, consultorio 305</InfoRow>
              <InfoRow label="Horario">Lunes a viernes, 8:00 a. m. – 4:00 p. m.</InfoRow>
            </div>
            <div>
              <h3 className="mb-2 text-[15px] font-bold text-navy-800">Contacto</h3>
              <InfoRow label={<span className="flex items-center gap-1.5"><Phone size={14} /> Teléfono</span>}>809-555-1098</InfoRow>
              <InfoRow label={<span className="flex items-center gap-1.5"><Mail size={14} /> Correo</span>}>lgonzalez@rednacionalsalud.do</InfoRow>
              <InfoRow label={<span className="flex items-center gap-1.5"><Building2 size={14} /> Hospitales</span>}>Hugo Mendoza, Hospital General</InfoRow>
              <InfoRow label={<span className="flex items-center gap-1.5"><Award size={14} /> En la red desde</span>}>Enero 2023</InfoRow>
            </div>
          </div>
        </section>

        <section className="card min-w-0">
          <div className="card-head border-b border-[#eef2f8] !pb-3">
            <h3 className="card-title"><FileText size={18} className="text-brand-600" /> Estudios solicitados por tu médico</h3>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[12px] font-semibold text-brand-700">{STUDIES.length}</span>
          </div>
          <div className="divide-y divide-[#eef2f8] px-4">
            {STUDIES.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2.5">
                <Modality m={s.mod} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink">{s.name}</p>
                  <p className="flex items-center gap-1.5 text-[12px] text-slate-500"><Calendar size={12} /> {s.date} · {s.hospital}</p>
                </div>
                <Badge tone="green">Informe publicado</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Modal open={msg} onClose={() => setMsg(false)} className="max-w-[520px]">
        <div className="p-6">
          <h2 className="pr-8 text-[20px] font-bold text-navy-800">Mensaje al Dr. Luis Fernando González Santana</h2>
          {sent ? (
            <p className="mt-4 rounded-lg bg-emerald-50 p-4 text-[14px] text-emerald-700">Tu mensaje fue enviado. El médico te responderá a través del portal o por WhatsApp.</p>
          ) : (
            <>
              <label className="label mt-4">Asunto</label>
              <select className="input"><option>Consulta sobre resultados</option><option>Solicitud de cita</option><option>Otro</option></select>
              <label className="label mt-3">Mensaje</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="input resize-none" placeholder="Escribe tu mensaje…" />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setMsg(false)} className="btn-outline">Cancelar</button>
                <button disabled={!text.trim()} onClick={() => { setSent(true); setText('') }} className="btn-primary"><Send size={15} /> Enviar</button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
