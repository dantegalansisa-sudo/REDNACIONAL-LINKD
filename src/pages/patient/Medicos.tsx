import { useState } from 'react'
import { Award, Building2, Calendar, FileText, Mail, MapPin, MessageCircle, Phone, Send, UserRound, type LucideIcon } from 'lucide-react'
import { Badge, InfoRow, Modal, Modality } from '../../components/ui'
import { AvisoDatos, PortalHeading, STUDIES, type Study } from './PatientPortal'
import { useSesion } from '../../lib/session'
import { fetchMisMedicos, supabaseConfigurado, useDatos } from '../../lib/portal-data'

type MedicoVista = {
  id: string; nombre: string; foto?: string; subtitulo: string; ubicacion?: string; telefono: string; correo: string
  profesionales: [string, string][]; contacto: [LucideIcon, string, string][]; estudios: Study[]
}

const DEMO: MedicoVista[] = [{
  id: 'demo', nombre: 'Dr. Luis Fernando González Santana', foto: '/img/crops/dr-luis.webp',
  subtitulo: 'Medicina Interna · Código MR-000156', ubicacion: 'Santo Domingo, Distrito Nacional', telefono: '809-555-1098', correo: 'lgonzalez@rednacionalsalud.com',
  profesionales: [
    ['Especialidad', 'Medicina Interna'], ['Exequátur', '45678'], ['Centro principal', 'Hospital Hugo Mendoza'],
    ['Consultorio', 'Torre Médica, piso 3, consultorio 305'], ['Horario', 'Lunes a viernes, 8:00 a. m. – 4:00 p. m.'],
  ],
  contacto: [
    [Phone, 'Teléfono', '809-555-1098'],
    [Mail, 'Correo', 'lgonzalez@rednacionalsalud.com'],
    [Building2, 'Hospitales', 'Hugo Mendoza, Hospital General'],
    [Award, 'En la red desde', 'Enero 2023'],
  ],
  estudios: STUDIES,
}]

const badgeEstudio = (s: Study) => (
  <Badge tone={s.status === 'Informe publicado' ? 'green' : s.status === 'En lectura' ? 'blue' : 'orange'}>{s.status}</Badge>
)

export default function Medicos() {
  const pac = useSesion().sesion?.paciente
  const { datos: medicos, cargando, error } = useDatos<MedicoVista[]>(async () => {
    if (!pac) return []
    return (await fetchMisMedicos(pac.id)).map((m) => {
      const esp = m.especialidades.join(', ') || 'Médico referidor'
      const hosp = [...new Set(m.estudios.map((e) => e.hospital).filter((x) => x && x !== '—'))].join(', ') || '—'
      return {
        id: m.id, nombre: m.nombre, subtitulo: `${esp} · Código ${m.codigo}`, ubicacion: m.centro !== '—' ? m.centro : undefined,
        telefono: m.telefono, correo: m.correo,
        profesionales: [['Especialidad', esp], ['Centro principal', m.centro]],
        contacto: [
          [Phone, 'Teléfono', m.telefono],
          [Mail, 'Correo', m.correo],
          [Building2, 'Hospitales', hosp],
        ],
        estudios: m.estudios,
      }
    })
  }, DEMO, [pac?.id])
  const [msg, setMsg] = useState(false)
  const [dest, setDest] = useState(DEMO[0].nombre)
  const [sent, setSent] = useState(false)
  const [text, setText] = useState('')

  return (
    <div>
      <PortalHeading icon={UserRound} title="Médicos referidores" subtitle="Profesionales que han solicitado tus estudios de imágenes." />
      {medicos.length === 0 && (
        <div className="card"><AvisoDatos cargando={cargando} error={error} vacio mensaje="Aún no tienes médicos referidores registrados en la red." /></div>
      )}
      <div className="space-y-4">
        {medicos.map((m) => (
          <div key={m.id} className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <section className="card overflow-hidden">
              <div className="flex flex-col items-center gap-5 bg-gradient-to-r from-brand-50 to-white p-5 sm:flex-row sm:items-start">
                {m.foto
                  ? <img src={m.foto} alt={m.nombre} className="h-32 w-32 shrink-0 rounded-full border-4 border-white object-cover shadow-card" />
                  : <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-4 border-white bg-brand-100 text-brand-600 shadow-card"><UserRound size={64} /></span>}
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <Badge tone="green" icon>Médico referidor activo</Badge>
                  <h2 className="mt-1.5 text-[22px] font-bold text-navy-800 sm:text-[25px]">{m.nombre}</h2>
                  <p className="text-[14.5px] text-brand-700">{m.subtitulo}</p>
                  {m.ubicacion && <p className="mt-1 flex items-center justify-center gap-1.5 text-[13px] text-slate-600 sm:justify-start"><MapPin size={14} /> {m.ubicacion}</p>}
                  <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {supabaseConfigurado
                      ? m.correo !== '—' && <a href={`mailto:${m.correo}`} className="btn-primary"><MessageCircle size={16} /> Enviar mensaje</a>
                      : <button onClick={() => { setDest(m.nombre); setMsg(true); setSent(false) }} className="btn-primary"><MessageCircle size={16} /> Enviar mensaje</button>}
                    {m.telefono !== '—' && <a href={`tel:${m.telefono.replace(/\D/g, '')}`} className="btn-outline"><Phone size={16} /> Llamar consultorio</a>}
                  </div>
                </div>
              </div>
              <div className="grid gap-5 p-5 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-[15px] font-bold text-navy-800">Datos profesionales</h3>
                  {m.profesionales.map(([l, v]) => <InfoRow key={l} label={l}>{v}</InfoRow>)}
                </div>
                <div>
                  <h3 className="mb-2 text-[15px] font-bold text-navy-800">Contacto</h3>
                  {m.contacto.map(([Icon, l, v]) => <InfoRow key={l} label={<span className="flex items-center gap-1.5"><Icon size={14} /> {l}</span>}>{v}</InfoRow>)}
                </div>
              </div>
            </section>

            <section className="card min-w-0">
              <div className="card-head border-b border-[#eef2f8] !pb-3">
                <h3 className="card-title"><FileText size={18} className="text-brand-600" /> Estudios solicitados por tu médico</h3>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[12px] font-semibold text-brand-700">{m.estudios.length}</span>
              </div>
              <div className="divide-y divide-[#eef2f8] px-4">
                {m.estudios.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 py-2.5">
                    <Modality m={s.mod} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink">{s.name}</p>
                      <p className="flex items-center gap-1.5 text-[12px] text-slate-500"><Calendar size={12} /> {s.date} · {s.hospital}</p>
                    </div>
                    {badgeEstudio(s)}
                  </div>
                ))}
              </div>
            </section>
          </div>
        ))}
      </div>

      <Modal open={msg} onClose={() => setMsg(false)} className="max-w-[520px]">
        <div className="p-6">
          <h2 className="pr-8 text-[20px] font-bold text-navy-800">Mensaje al {dest}</h2>
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
