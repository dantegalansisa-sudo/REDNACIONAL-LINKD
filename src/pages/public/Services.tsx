import { Link } from 'react-router-dom'
import { ArrowRight, Building2, CheckCircle2, Stethoscope, UserRound, Users } from 'lucide-react'
import PublicLayout, { PageHero, SectionTitle } from '../../layouts/PublicLayout'

const SERVICES = [
  {
    icon: UserRound, img: '/img/radiologo-cerebro.webp', title: 'Para Radiólogos', to: '/registro/medico', cta: 'Registrarme como radiólogo',
    items: ['Lista de trabajo con estudios priorizados', 'Lectura remota (teleradiología)', 'Emisión y firma digital de informes', 'Convocatorias para hospitales de la red'],
  },
  {
    icon: Stethoscope, img: '/img/doctor-consulta.webp', title: 'Para Médicos Referidores', to: '/registro/medico', cta: 'Registrarme como referidor',
    items: ['Solicitud de estudios para sus pacientes', 'Acceso a imágenes e informes', 'Seguimiento del estado de cada estudio', 'Historial de referencias'],
  },
  {
    icon: Users, img: '/img/pareja-pacientes.webp', title: 'Para Pacientes', to: '/registro/paciente', cta: 'Registrarme como paciente',
    items: ['Consulta de estudios e informes desde el celular', 'Historial médico disponible en la red', 'Notificaciones por WhatsApp y correo', 'Seguimiento de citas'],
  },
  {
    icon: Building2, img: '/img/banner-hospital.webp', title: 'Para Hospitales', to: '/contacto', cta: 'Solicitar integración',
    items: ['Integración con LINKConnect (DICOM / HL7)', 'Envío de estudios al Repositorio Nacional', 'Asignación de radiólogos por convocatoria', 'Indicadores de desempeño y tiempos de respuesta'],
  },
]

export default function Services() {
  return (
    <PublicLayout>
      <PageHero eyebrow="SERVICIOS" title="Herramientas para cada actor de la salud" text="Servicios digitales para radiólogos, médicos referidores, pacientes y hospitales de la red nacional." image="/img/home-movil.webp" />
      <section className="section-x py-14">
        <SectionTitle>Nuestros servicios</SectionTitle>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {SERVICES.map((s) => (
            <article key={s.title} className="card overflow-hidden">
              <img src={s.img} alt="" className="h-[200px] w-full object-cover" />
              <div className="p-6">
                <h3 className="flex items-center gap-3 font-serif text-[22px] font-bold"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white"><s.icon size={20} /></span>{s.title}</h3>
                <ul className="mt-4 space-y-2">{s.items.map((i) => <li key={i} className="flex items-center gap-2.5 text-[14.5px] text-ink/80"><CheckCircle2 size={18} className="shrink-0 text-brand-600" />{i}</li>)}</ul>
                <Link to={s.to} className="btn-primary btn-pill mt-6 !px-6 !py-2.5">{s.cta} <ArrowRight size={16} /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicLayout>
  )
}
