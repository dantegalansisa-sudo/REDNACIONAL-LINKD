import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Building2, Clock, Database, Eye, FileText, Heart, Image as ImageIcon,
  Play, Settings, Share2, ShieldCheck, Stethoscope, Users,
} from 'lucide-react'
import { PublicFooter, PublicHeader, SectionTitle } from '../../layouts/PublicLayout'
import { Modal } from '../../components/ui'
import { RegisterDoctorModal } from './RegisterDoctorModal'
import { RegisterPatientModal } from './RegisterPatientModal'

const FEATURES = [
  { icon: Database, text: ['Información centralizada', 'y segura'] },
  { icon: Share2, text: ['Hospitales conectados', 'en todo el país'] },
  { icon: BarChart3, text: ['Mejores decisiones', 'en salud pública'] },
  { icon: Users, text: ['Atención más rápida', 'y eficiente'] },
  { icon: ShieldCheck, text: ['Beneficio directo', 'para los pacientes'] },
]

const STATS = [
  { icon: Building2, value: '128', label: 'Hospitales conectados' },
  { icon: Users, value: '+500', label: 'Radiólogos registrados' },
  { icon: FileText, value: '+2.1 M', label: 'Estudios realizados (anual)' },
  { icon: ImageIcon, value: '+333 M', label: 'Imágenes disponibles' },
]

const BENEFITS = [
  { icon: Heart, title: 'Mejores diagnósticos y tratamientos', text: 'Acceso rápido a la información, para una atención más oportuna y precisa.' },
  { icon: Users, title: 'Colaboración entre profesionales', text: 'Conecta hospitales, radiólogos y médicos referidores en una sola red.' },
  { icon: Settings, title: 'Uso eficiente de los recursos', text: 'Optimiza la infraestructura y evita la duplicación de estudios.' },
  { icon: ShieldCheck, title: 'Información segura y confiable', text: 'Cumpliendo con los más altos estándares de seguridad y privacidad.' },
]

const PATIENT_PERKS = [
  { icon: FileText, text: ['Tus estudios', 'siempre contigo'] },
  { icon: Eye, text: ['Comprende', 'tus resultados'] },
  { icon: Clock, text: ['Ahorra tiempo', 'y evita traslados'] },
  { icon: Users, text: ['Una mejor', 'comunicación con', 'tu médico'] },
]

const LINKS: { src: string; alt: string; h: string; label?: string }[][] = [
  [
    { src: '/img/logos/presidencia.png', alt: 'Presidencia de la República Dominicana', h: 'h-[96px]' },
    { src: '/img/logos/agenda-digital.png', alt: 'Agenda Digital 2030', h: 'h-[70px]' },
    { src: '/img/logos/gobdo.png', alt: 'gob.do Servicios Digitales', h: 'h-[78px]' },
    { src: '/img/logos/saip.png', alt: 'Portal Único de Solicitud de Acceso a la Información', h: 'h-[74px]' },
    { src: '/img/logos/311.png', alt: '311 Usa tu voz', h: 'h-[74px]' },
    { src: '/img/logos/observatorio.png', alt: 'Observatorio Nacional de la Calidad de los Servicios Públicos', h: 'h-[92px]' },
  ],
  [
    { src: '/img/logos/ogtic.png', alt: 'OGTIC', h: 'h-[70px]' },
    { src: '/img/logos/911.png', alt: 'Sistema 911', h: 'h-[64px]' },
    { src: '/img/logos/orhs.png', alt: 'Observatorio de Recursos Humanos', h: 'h-[70px]' },
    { src: '/img/logos/mescyt.png', alt: 'MESCYT', h: 'h-[70px]' },
    { src: '/img/logos/ops.png', alt: 'Organización Panamericana de la Salud', h: 'h-[58px]' },
    { src: '/img/logos/sns.png', alt: 'Servicio Nacional de Salud', h: 'h-[70px]' },
    { src: '/img/logos/cncs.png', alt: 'Centro Nacional de Ciberseguridad', h: 'h-[60px]' },
  ],
]

export default function Home({ modal }: { modal?: 'medico' | 'paciente' }) {
  const navigate = useNavigate()
  const { hash } = useLocation()
  const [video, setVideo] = useState(false)

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } else if (!modal) window.scrollTo(0, 0)
  }, [hash, modal])

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-900">
        <img src="/img/hero-doctor-paciente.webp" alt="Médico explicando resultados a un paciente" className="absolute inset-y-0 right-0 h-full w-full object-cover object-[70%_center] md:w-[68%]" />
        <div className="absolute inset-0 hidden md:block" style={{ background: 'linear-gradient(90deg,#0a2a78 0%,#0c3290 34%,rgba(13,53,146,.75) 46%,rgba(13,53,146,0) 64%)' }} />
        <div className="absolute inset-0 bg-[#0a2a78]/85 md:hidden" />
                <div className="relative mx-auto grid max-w-[1440px] px-6 py-14 lg:grid-cols-[1.15fr_1fr] lg:px-10 lg:py-[70px]">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.32em] text-white/90 sm:text-[13px]">RED NACIONAL DE SALUD DOMINICANA</p>
            <h1 className="mt-4 font-serif text-[clamp(30px,9vw,44px)] font-bold leading-none tracking-[-0.02em] text-white sm:text-[60px] xl:text-[68px]">RedNacionalSalud.do</h1>
            <p className="mt-5 font-serif text-[22px] font-semibold leading-tight text-white sm:text-[27px]">
              Integración, información y tecnología<br className="hidden sm:block" /> al servicio de la salud de todos los dominicanos.
            </p>
            <p className="mt-5 max-w-[560px] text-[15px] leading-relaxed text-white/85 sm:text-[16px]">
              Una plataforma nacional que centraliza la gestión de información diagnóstica de los hospitales públicos, conectando profesionales
              de la salud, optimizando recursos y mejorando la calidad de la atención para cada paciente, en todo el país.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/sobre-el-proyecto" className="inline-flex items-center gap-3 rounded-lg bg-brand-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-brand-900/40 hover:bg-brand-500">
                Conoce el proyecto <ArrowRight size={18} />
              </Link>
              <button onClick={() => setVideo(true)} className="inline-flex items-center gap-3 rounded-full border border-white/70 px-6 py-3 text-[15px] font-medium text-white hover:bg-white/10">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-navy-900"><Play size={13} fill="currentColor" /></span>
                Ver video institucional
              </button>
            </div>
          </div>
          <div className="pointer-events-none relative hidden lg:block">
            <p className="absolute -left-[4%] top-[2%] -rotate-[6deg] font-script text-[26px] leading-[1.08] text-white/95 drop-shadow xl:text-[30px]">
              ¡Gracias<br />&nbsp;doctor!<br />Ahora entiendo<br />&nbsp;&nbsp;mi estudio ♥
            </p>
          </div>
        </div>
      </section>

      {/* Franja de características */}
      <section className="border-b border-[#e8eef8] bg-[#f3f7fe]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-4 gap-y-5 px-6 py-6 sm:grid-cols-3 lg:grid-cols-5 lg:px-10">
          {FEATURES.map((f) => (
            <div key={f.text[0]} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm"><f.icon size={21} /></span>
              <span className="text-[13.5px] leading-snug text-ink">{f.text[0]}<br />{f.text[1]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Únete a la red */}
      <section id="beneficios" className="mx-auto grid max-w-[1440px] gap-6 px-6 py-12 lg:grid-cols-[1fr_1.55fr] lg:px-10">
        <div className="self-center">
          <SectionTitle>Únete a la red nacional</SectionTitle>
          <p className="mt-6 max-w-[440px] text-[14px] leading-relaxed text-ink/80">
            Sé parte de una iniciativa que transforma la salud en la República Dominicana. Regístrate y accede a herramientas, información y beneficios diseñados para ti.
          </p>
          <Link to="/sobre-el-proyecto" className="mt-6 inline-flex items-center gap-3 rounded-md bg-brand-600 px-7 py-3 text-[15px] font-medium text-white hover:bg-brand-700">
            Conoce los beneficios <ArrowRight size={18} />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            { img: '/img/radiologo-monitor.webp', icon: Stethoscope, tone: 'bg-brand-600', btn: 'bg-brand-600 hover:bg-brand-700', title: 'Médico', to: '/registro/medico', text: 'Regístrate y forma parte de la red nacional de especialistas. Accede a estudios, emite informes y colabora con hospitales de todo el país.' },
            { img: '/img/paciente-senora.webp', icon: ImageIcon, tone: 'bg-accent-orange', btn: 'bg-accent-orange hover:bg-orange-600', title: 'Paciente', to: '/registro/paciente', text: 'Regístrate y consulta tus estudios e informes de forma segura, en cualquier momento y desde cualquier lugar.' },
          ].map((c) => (
            <article key={c.title} className="overflow-hidden rounded-2xl border border-[#e6edf8] bg-white shadow-card">
              <div className="relative h-[190px]">
                <img src={c.img} alt="" className="h-full w-full object-cover object-top" />
                <span className={`absolute -bottom-7 left-5 flex h-[60px] w-[60px] items-center justify-center rounded-full border-4 border-white text-white shadow-md ${c.tone}`}><c.icon size={26} /></span>
              </div>
              <div className="px-5 pb-5 pt-8">
                <h3 className="font-serif text-[22px] font-bold text-ink">{c.title}</h3>
                <p className="mt-1 min-h-[88px] text-[14px] leading-snug text-ink/75">{c.text}</p>
                <button onClick={() => navigate(c.to)} className={`mt-4 flex w-full items-center justify-center gap-3 rounded-full py-3 text-[19px] font-medium text-white shadow-md ${c.btn}`}>
                  Regístrese <ArrowRight size={20} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Cobertura + Beneficios */}
      <section className="mx-auto grid max-w-[1440px] gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[1.9fr_1fr] lg:px-10">
        <div className="overflow-hidden rounded-2xl border border-[#e6edf8] bg-gradient-to-br from-white to-[#eef4ff] shadow-card">
          <div className="grid items-center md:grid-cols-[0.65fr_1.35fr]">
            <div className="px-7 pt-7 md:pb-4">
              <SectionTitle>Cobertura nacional</SectionTitle>
              <p className="mt-5 text-[15px] leading-snug text-ink/80">Conectando hospitales y centros diagnósticos en las 32 provincias de la República Dominicana.</p>
            </div>
            <img src="/img/crops/mapa-home.webp" alt="Mapa de la República Dominicana con hospitales conectados" className="w-full mix-blend-multiply" />
          </div>
          <div className="m-3 grid grid-cols-2 gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"><s.icon size={20} /></span>
                <span>
                  <span className="block text-[20px] font-bold leading-none text-ink">{s.value}</span>
                  <span className="text-[11.5px] text-ink/70">{s.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e6edf8] bg-white p-6 shadow-card">
          <h2 className="font-serif text-[26px] font-bold text-ink">Beneficios para todos</h2>
          <ul className="mt-4 space-y-4">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"><b.icon size={21} fill="currentColor" fillOpacity={0.15} /></span>
                <span>
                  <span className="block text-[14px] font-semibold text-ink">{b.title}</span>
                  <span className="text-[12.5px] leading-snug text-ink/70">{b.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Banner país avanza */}
      <section className="bg-gradient-to-r from-[#e8f0fd] to-white">
        <div className="mx-auto grid max-w-[1600px] items-stretch lg:grid-cols-2">
          <img src="/img/home-movil.webp" alt="Paciente mostrando su estudio en el celular junto a su médico" className="h-full max-h-[340px] w-full object-cover" />
          <div className="px-6 py-8 lg:px-10">
            <h2 className="font-serif text-[30px] font-bold leading-[1.1] text-ink sm:text-[34px]">¡El país avanza hacia<br />una salud más fácil para todos!</h2>
            <p className="mt-4 max-w-[560px] text-[15px] text-ink/80">Ahora puedes consultar tus imágenes y resultados desde tu celular, de forma segura, rápida y en cualquier lugar del país.</p>
            <div className="mt-6 grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-brand-100">
              {PATIENT_PERKS.map((p) => (
                <div key={p.text[0]} className="flex flex-col items-center text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm ring-1 ring-brand-100"><p.icon size={22} /></span>
                  <span className="mt-2 text-[13px] leading-tight text-ink">{p.text.map((t) => <span key={t} className="block">{t}</span>)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enlaces de interés */}
      <section id="enlaces" className="mx-auto max-w-[1440px] scroll-mt-24 px-6 py-10 lg:px-10">
        <div className="flex flex-wrap items-center gap-5">
          <SectionTitle className="shrink-0">Enlaces de Interés</SectionTitle>
          <span className="hidden h-px flex-1 bg-brand-200 sm:block" />
          <a href="https://www.gob.do" target="_blank" rel="noreferrer" className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full border border-brand-300 px-4 py-1.5 text-[12.5px] font-medium text-brand-700 hover:bg-brand-50">
            Ver todos los enlaces <ArrowRight size={14} />
          </a>
        </div>
        {LINKS.map((row, i) => (
          <div key={i} className="mt-6 grid grid-cols-2 items-center gap-y-6 sm:grid-cols-3 lg:flex lg:justify-between lg:divide-x lg:divide-brand-100">
            {row.map((l) => (
              <a key={l.alt} href="#enlaces" title={l.alt} className="flex flex-1 items-center justify-center px-3">
                <img src={l.src} alt={l.alt} className={`${l.h} w-auto max-w-full object-contain transition hover:scale-105`} />
              </a>
            ))}
          </div>
        ))}
      </section>

      <PublicFooter />

      <Modal open={video} onClose={() => setVideo(false)} className="max-w-[900px] bg-navy-950">
        <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-gradient-to-br from-navy-900 to-brand-800 text-white">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15"><Play size={36} fill="currentColor" /></span>
          <p className="text-[16px] font-semibold">Video institucional</p>
          <p className="max-w-[420px] text-center text-[13px] text-white/70">Espacio reservado para el video institucional de RedNacionalSalud.do (se integrará cuando el cliente lo suministre).</p>
        </div>
      </Modal>

      <RegisterDoctorModal open={modal === 'medico'} onClose={() => navigate('/')} />
      <RegisterPatientModal open={modal === 'paciente'} onClose={() => navigate('/')} />
    </div>
  )
}
