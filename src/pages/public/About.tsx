import { Link } from 'react-router-dom'
import { ArrowRight, Building2, CheckCircle2, Database, Eye, Network, ShieldCheck, Target, Users } from 'lucide-react'
import PublicLayout, { PageHero, SectionTitle } from '../../layouts/PublicLayout'

const OBJETIVOS = [
  { icon: Database, t: 'Centralizar la información diagnóstica', d: 'Un repositorio nacional de imágenes e informes accesible desde cualquier hospital de la red.' },
  { icon: Network, t: 'Interconectar hospitales', d: 'LINKConnect integra los equipos de imágenes (DICOM/HL7) de cada centro con el Repositorio Nacional.' },
  { icon: Users, t: 'Optimizar el talento médico', d: 'Radiólogos de todo el país leen estudios por teleradiología, reduciendo los tiempos de respuesta.' },
  { icon: ShieldCheck, t: 'Proteger los datos del paciente', d: 'Estándares de seguridad, auditoría completa y control de accesos por rol.' },
]

const ETAPAS = [
  ['Fase 1', 'Diseño de la plataforma, portales de pacientes y médicos, panel de administración.'],
  ['Fase 2', 'Integración de base de datos, autenticación, notificaciones por correo y WhatsApp.'],
  ['Fase 3', 'Conexión de hospitales vía LINKConnect, PACS/RIS y Repositorio Nacional.'],
  ['Fase 4', 'Despliegue nacional en las 32 provincias y analítica de salud pública.'],
]

export default function About() {
  return (
    <PublicLayout>
      <PageHero eyebrow="SOBRE EL PROYECTO" title="Una red nacional para una salud más conectada"
        text="RedNacionalSalud.do es la iniciativa del Sistema Nacional de Salud para integrar la información diagnóstica de los hospitales públicos de la República Dominicana."
        image="/img/hero-doctor-paciente.webp" />
      <section className="section-x grid gap-10 py-14 lg:grid-cols-2">
        <div>
          <SectionTitle>¿Qué es RedNacionalSalud.do?</SectionTitle>
          <p className="mt-6 text-[15.5px] leading-relaxed text-ink/80">
            Es una plataforma nacional que conecta hospitales, radiólogos, médicos referidores y pacientes. Cada estudio de imágenes realizado en un hospital
            de la red se envía al Repositorio Nacional, se asigna a un radiólogo para su lectura y el informe queda disponible para el médico y el paciente de forma segura.
          </p>
          <ul className="mt-6 space-y-3">
            {['Pacientes con acceso a sus estudios desde el celular', 'Médicos con información completa para decidir mejor', 'Hospitales conectados y recursos optimizados', 'Datos para la planificación de la salud pública'].map((t) => (
              <li key={t} className="flex items-center gap-3 text-[15px] text-ink"><CheckCircle2 size={20} className="text-brand-600" /> {t}</li>
            ))}
          </ul>
        </div>
        <img src="/img/radiologo-monitor.webp" alt="Radiólogo analizando estudios" className="h-full max-h-[420px] w-full rounded-2xl object-cover shadow-soft" />
      </section>
      <section id="objetivos" className="scroll-mt-24 bg-[#f3f7fe] py-14">
        <div className="section-x">
          <SectionTitle>Objetivos</SectionTitle>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {OBJETIVOS.map((o) => (
              <div key={o.t} className="card p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600"><o.icon size={24} /></span>
                <h3 className="mt-4 text-[16px] font-bold">{o.t}</h3>
                <p className="mt-2 text-[14px] text-ink/70">{o.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="alcance" className="section-x scroll-mt-24 grid gap-10 py-14 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <SectionTitle>Alcance</SectionTitle>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {[[Building2, '128', 'Hospitales conectados'], [Target, '32', 'Provincias'], [Users, '+500', 'Radiólogos'], [Eye, '+2.1 M', 'Estudios al año']].map(([I, v, l]) => {
              const Icon = I as typeof Building2
              return <div key={l as string} className="card p-5"><Icon size={22} className="text-brand-600" /><div className="mt-2 text-[26px] font-bold">{v as string}</div><div className="text-[13px] text-ink/70">{l as string}</div></div>
            })}
          </div>
        </div>
        <div>
          <SectionTitle>Etapas del proyecto</SectionTitle>
          <ol className="mt-6 space-y-4 border-l-2 border-brand-100 pl-6">
            {ETAPAS.map(([f, d]) => (
              <li key={f} className="relative">
                <span className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-4 border-white bg-brand-600 shadow" />
                <div className="text-[15px] font-bold text-ink">{f}</div>
                <p className="text-[14px] text-ink/70">{d}</p>
              </li>
            ))}
          </ol>
          <Link to="/registro/medico" className="btn-primary mt-8 !px-6 !py-3 !text-[15px]">Únete a la red <ArrowRight size={18} /></Link>
        </div>
      </section>
    </PublicLayout>
  )
}
