import { useState } from 'react'
import { CheckCircle2, ChevronDown, Clock, Mail, MapPin, Phone, Send } from 'lucide-react'
import PublicLayout, { PageHero, SectionTitle } from '../../layouts/PublicLayout'
import { BRAND } from '../../config/brand'

const FAQ = [
  ['¿Cómo me registro como paciente?', 'Haz clic en "Regístrese" en la tarjeta Paciente de la página de inicio, ingresa tu cédula o pasaporte y completa tus datos. Recibirás tu código de paciente por WhatsApp.'],
  ['¿Cuál es mi contraseña en el primer acceso?', 'Tu usuario es tu código de paciente (RNS-XXXXXXXX) y tu clave inicial es tu número de cédula o pasaporte. El sistema te pedirá cambiarla al ingresar.'],
  ['¿Cuánto tarda la aprobación de un médico?', 'El equipo del SNS revisa los documentos y valida el exequátur. Recibirá una notificación por WhatsApp y correo cuando su cuenta esté activa.'],
  ['¿Cómo se integra un hospital a la red?', 'El hospital solicita la integración y el equipo técnico instala LINKConnect, que conecta sus equipos de imágenes (DICOM/HL7) con el Repositorio Nacional.'],
]

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [open, setOpen] = useState<number | null>(0)
  return (
    <PublicLayout>
      <PageHero eyebrow="CONTACTO" title="Estamos para ayudarte" text="Escríbenos para consultas sobre la plataforma, registro de médicos, integración de hospitales o soporte técnico." image="/img/banner-hospital.webp" />
      <section className="section-x grid gap-8 py-14 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <SectionTitle>Información de contacto</SectionTitle>
          {[[Phone, 'Teléfono', BRAND.supportPhone], [Mail, 'Correo electrónico', BRAND.contactEmail], [MapPin, 'Dirección', 'Santo Domingo, República Dominicana'], [Clock, 'Soporte técnico', '24/7 — ' + BRAND.supportEmail]].map(([I, l, v]) => {
            const Icon = I as typeof Phone
            return (
              <div key={l as string} className="card flex items-center gap-4 p-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Icon size={22} /></span>
                <div><div className="text-[13px] text-slate-500">{l as string}</div><div className="text-[15px] font-semibold">{v as string}</div></div>
              </div>
            )
          })}
        </div>
        <div className="card p-6 sm:p-8">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 size={56} className="text-emerald-500" />
              <h3 className="mt-3 text-[24px] font-bold">¡Mensaje enviado!</h3>
              <p className="mt-1 text-ink/70">Te responderemos a la brevedad a tu correo electrónico.</p>
              <button onClick={() => setSent(false)} className="btn-outline mt-6">Enviar otro mensaje</button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="grid gap-4 sm:grid-cols-2">
              <h3 className="text-[22px] font-bold sm:col-span-2">Envíanos un mensaje</h3>
              <label><span className="label">Nombre completo <span className="req">*</span></span><input required className="input !py-2.5" /></label>
              <label><span className="label">Correo electrónico <span className="req">*</span></span><input required type="email" className="input !py-2.5" /></label>
              <label><span className="label">Teléfono</span><input className="input !py-2.5" /></label>
              <label><span className="label">Tipo de consulta</span>
                <span className="relative flex items-center"><select className="input appearance-none !py-2.5"><option>Información general</option><option>Pacientes</option><option>Médicos</option><option>Hospitales</option><option>Soporte técnico</option></select><ChevronDown size={16} className="pointer-events-none absolute right-3" /></span>
              </label>
              <label className="sm:col-span-2"><span className="label">Mensaje <span className="req">*</span></span><textarea required rows={5} className="input" /></label>
              <button className="btn-primary btn-pill !py-3 !text-[15px] sm:col-span-2 sm:w-fit sm:!px-10"><Send size={17} /> Enviar mensaje</button>
            </form>
          )}
        </div>
      </section>
      <section id="faq" className="scroll-mt-24 bg-[#f3f7fe] py-14">
        <div className="section-x max-w-[900px]">
          <SectionTitle>Preguntas frecuentes</SectionTitle>
          <div className="mt-6 space-y-3">
            {FAQ.map(([q, a], i) => (
              <div key={q} className="card">
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left text-[15.5px] font-semibold">{q}<ChevronDown size={18} className={open === i ? 'rotate-180 transition' : 'transition'} /></button>
                {open === i && <p className="px-5 pb-4 text-[14.5px] text-ink/75">{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="terminos" className="section-x scroll-mt-24 grid gap-8 py-14 md:grid-cols-2">
        <div><SectionTitle>Términos de Uso</SectionTitle><p className="mt-5 text-[14px] leading-relaxed text-ink/75">El uso de la plataforma está sujeto a la normativa del Ministerio de Salud Pública y del Servicio Nacional de Salud. Los usuarios se comprometen a proporcionar información verídica y a utilizar los datos clínicos únicamente con fines asistenciales. (Texto legal definitivo pendiente de aprobación por el cliente.)</p></div>
        <div id="privacidad" className="scroll-mt-24"><SectionTitle>Política de Privacidad</SectionTitle><p className="mt-5 text-[14px] leading-relaxed text-ink/75">Los datos personales y clínicos se tratan conforme a la Ley 172-13 sobre protección de datos de carácter personal. El acceso está restringido por roles y cada consulta queda registrada en auditoría. (Texto legal definitivo pendiente de aprobación por el cliente.)</p></div>
      </section>
    </PublicLayout>
  )
}
