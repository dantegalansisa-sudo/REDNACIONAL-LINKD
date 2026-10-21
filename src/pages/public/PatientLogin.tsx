import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, BarChart3, CalendarDays, Eye, EyeOff, FileText, HeartPulse, Lock, ShieldPlus, User, Users, type LucideIcon } from 'lucide-react'
import { PublicFooter, PublicHeader } from '../../layouts/PublicLayout'
import { Modal } from '../../components/ui'

/** Plantilla de login compartida por el portal del paciente y del médico */
export function LoginShell({ bg, title, highlight, perks, badge, card }: {
  bg: string; title: ReactNode; highlight: ReactNode; perks: [LucideIcon, string][]; badge: { title: string; text: string }; card: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />
      <main className="relative flex-1 overflow-hidden">
        <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover object-[35%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/30 to-white/0" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/70 to-transparent" />
        <div className="relative mx-auto grid max-w-[1440px] gap-8 px-5 py-10 lg:grid-cols-[1fr_640px] lg:px-14 lg:py-12">
          <div className="flex flex-col">
            <h1 className="text-[44px] font-bold leading-[0.98] tracking-[-0.03em] text-ink sm:text-[64px]">{title}</h1>
            <p className="mt-4 max-w-[460px] text-[19px] leading-snug text-ink sm:text-[23px]">{highlight}</p>
            <ul className="mt-6 space-y-4">
              {perks.map(([Icon, t]) => (
                <li key={t} className="flex items-center gap-5">
                  <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30"><Icon size={26} /></span>
                  <span className="max-w-[210px] text-[17px] leading-snug text-ink sm:text-[19px]">{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex max-w-[600px] items-center gap-4 rounded-2xl bg-white/85 p-5 shadow-soft backdrop-blur lg:mt-auto">
              <span className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600"><HeartPulse size={34} /></span>
              <div><div className="text-[19px] font-bold text-ink sm:text-[21px]">{badge.title}</div><div className="text-[16px] text-ink/70 sm:text-[18px]">{badge.text}</div></div>
            </div>
          </div>
          <div className="self-start rounded-3xl bg-white p-6 shadow-soft sm:p-9">{card}</div>
        </div>
      </main>
      <PublicFooter compact />
    </div>
  )
}

export default function PatientLogin() {
  const navigate = useNavigate()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [forgot, setForgot] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^RNS-?\d{5,}$/i.test(user.trim())) return setError('Ingresa un código de paciente válido (ej. RNS-00012345).')
    if (pass.trim().length < 6) return setError('Ingresa tu clave (cédula o pasaporte).')
    setError('')
    navigate('/paciente')
  }

  return (
    <>
    <LoginShell
      bg="/img/pareja-pacientes.webp"
      title={<>Tu salud,<br />siempre contigo</>}
      highlight="Accede a tus estudios, informes y citas desde un solo lugar, de forma segura, rápida y confiable."
      perks={[[FileText, 'Consulta tus estudios e informes médicos.'], [CalendarDays, 'Gestiona tus citas y seguimientos.'], [BarChart3, 'Accede a tu historial de salud en la red.'], [ShieldPlus, 'Un servicio más ágil, seguro y conectado.']]}
      badge={{ title: 'La Red Nacional de Salud Dominicana', text: 'Conectando centros de salud para brindarte una mejor atención.' }}
      card={
        <form onSubmit={submit}>
          <div className="flex items-center gap-5">
            <span className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Users size={40} fill="currentColor" /></span>
            <div><h2 className="text-[34px] font-bold leading-tight text-ink sm:text-[40px]">Portal del Paciente</h2><p className="text-[19px] text-slate-500 sm:text-[22px]">Accede a tu información de salud</p></div>
          </div>
          <label className="mt-8 block text-[18px] font-semibold text-ink">Usuario</label>
          <span className="relative mt-2 flex items-center"><User size={21} className="absolute left-4 text-slate-500" /><input value={user} onChange={(e) => setUser(e.target.value.toUpperCase())} className="input !py-3 pl-12 !text-[16px]" placeholder="Ingresa tu código de paciente" autoComplete="username" /></span>
          <p className="mt-1.5 text-[14px] text-slate-500">Ejemplo: RNS-00012345</p>
          <div className="mt-5 flex items-center justify-between"><label className="text-[18px] font-semibold text-ink">Clave</label>
            <button type="button" onClick={() => setShow(!show)} className="flex items-center gap-2 text-[15px] text-slate-500">{show ? <EyeOff size={19} /> : <Eye size={19} />} {show ? 'Ocultar' : 'Mostrar'}</button></div>
          <span className="relative mt-2 flex items-center"><Lock size={20} className="absolute left-4 text-ink" /><input type={show ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} className="input !py-3 pl-12 !text-[16px]" placeholder="Ingresa tu número de cédula o pasaporte" autoComplete="current-password" /></span>
          <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertCircle size={36} className="shrink-0 fill-orange-500 text-white" />
            <p className="text-[14px] text-ink/80"><b className="text-orange-600 underline">Nota importante</b><br />En tu primer acceso, utiliza tu número de cédula o pasaporte como contraseña. Te recomendamos cambiar tu contraseña luego en tu perfil, en la sección <span className="text-brand-700">Seguridad</span>.</p>
          </div>
          {error && <p className="mt-3 text-[14px] text-red-600">{error}</p>}
          <button type="submit" className="mt-5 flex w-full items-center justify-center gap-3 rounded-full bg-brand-600 py-4 text-[21px] font-medium text-white hover:bg-brand-700">Iniciar sesión <ArrowRight size={22} /></button>
          <div className="mt-5 text-center"><button type="button" onClick={() => setForgot(true)} className="text-[17px] text-brand-700 underline">¿Olvidaste tu código de paciente?</button></div>
          <p className="mt-3 text-center text-[14px] text-slate-500">¿No tienes cuenta? <Link to="/registro/paciente" className="font-semibold text-brand-700">Regístrate aquí</Link></p>
        </form>
      }
    />
    <Modal open={forgot} onClose={() => { setForgot(false); setSent(false) }} className="max-w-[520px]">
      <div className="p-7">
        <h3 className="text-[24px] font-bold text-ink">Recuperar código de paciente</h3>
        {sent ? (
          <p className="mt-3 text-[15px] text-ink/80">Si los datos coinciden con un paciente registrado, enviaremos tu código por WhatsApp y correo electrónico.</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
            <p className="mt-2 text-[14px] text-slate-500">Ingresa tu cédula o pasaporte y te enviaremos tu código a los medios registrados.</p>
            <input required className="input mt-4 !py-3" placeholder="Cédula o pasaporte" />
            <button className="btn-primary btn-pill mt-4 w-full !py-3 !text-[16px]">Enviar código</button>
          </form>
        )}
      </div>
    </Modal>
    </>
  )
}
