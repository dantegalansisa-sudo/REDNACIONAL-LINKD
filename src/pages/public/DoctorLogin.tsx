import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowRight, ClipboardList, Eye, EyeOff, FileText, Lock, MonitorCheck, Stethoscope, User, UserRound, Users } from 'lucide-react'
import { LoginShell } from './PatientLogin'

export default function DoctorLogin() {
  const navigate = useNavigate()
  const [rol, setRol] = useState<'radiologo' | 'referidor'>('radiologo')
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user.trim() || pass.length < 6) return setError('Ingresa tu usuario y contraseña (mínimo 6 caracteres).')
    try { localStorage.setItem('rns-medico-rol', rol) } catch { /* almacenamiento no disponible */ }
    navigate('/medico')
  }

  return (
    <LoginShell
      bg="/img/doctor-banner.webp"
      title={<>Conectados por<br />la salud del país</>}
      highlight="Lee estudios, emite informes y da seguimiento a tus pacientes desde la red nacional."
      perks={[[MonitorCheck, 'Lista de trabajo y lectura de estudios.'], [FileText, 'Emisión y firma de informes.'], [Users, 'Seguimiento de pacientes referidos.'], [ClipboardList, 'Convocatorias y hospitales asignados.']]}
      badge={{ title: 'Red Nacional de Especialistas', text: 'Radiólogos y médicos referidores conectados con hospitales de todo el país.' }}
      card={
        <form onSubmit={submit}>
          <div className="flex items-center gap-5">
            <span className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Stethoscope size={40} /></span>
            <div><h2 className="text-[34px] font-bold leading-tight text-ink sm:text-[40px]">Portal del Médico</h2><p className="text-[19px] text-slate-500 sm:text-[22px]">Radiólogo o Referidor</p></div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            {([['radiologo', 'Médico Radiólogo'], ['referidor', 'Médico Referidor']] as const).map(([k, l]) => (
              <button type="button" key={k} onClick={() => setRol(k)}
                className={clsx('flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-[15px] font-semibold transition', rol === k ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-[#dbe5f5] text-slate-500 hover:border-brand-300')}>
                <UserRound size={20} /> {l}
              </button>
            ))}
          </div>
          <label className="mt-6 block text-[18px] font-semibold text-ink">Usuario</label>
          <span className="relative mt-2 flex items-center"><User size={21} className="absolute left-4 text-slate-500" /><input value={user} onChange={(e) => setUser(e.target.value)} className="input !py-3 pl-12 !text-[16px]" placeholder="No. de exequátur o correo electrónico" autoComplete="username" /></span>
          <div className="mt-5 flex items-center justify-between"><label className="text-[18px] font-semibold text-ink">Contraseña</label>
            <button type="button" onClick={() => setShow(!show)} className="flex items-center gap-2 text-[15px] text-slate-500">{show ? <EyeOff size={19} /> : <Eye size={19} />} {show ? 'Ocultar' : 'Mostrar'}</button></div>
          <span className="relative mt-2 flex items-center"><Lock size={20} className="absolute left-4 text-ink" /><input type={show ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} className="input !py-3 pl-12 !text-[16px]" placeholder="Ingresa tu contraseña" autoComplete="current-password" /></span>
          <p className="mt-3 rounded-xl bg-brand-50 p-3 text-[13.5px] text-ink/80">Tu cuenta se activa cuando el SNS aprueba tu solicitud de registro. Recibirás las credenciales por WhatsApp y correo electrónico.</p>
          {error && <p className="mt-3 text-[14px] text-red-600">{error}</p>}
          <button type="submit" className="mt-5 flex w-full items-center justify-center gap-3 rounded-full bg-brand-600 py-4 text-[21px] font-medium text-white hover:bg-brand-700">Iniciar sesión <ArrowRight size={22} /></button>
          <p className="mt-5 text-center text-[14px] text-slate-500">¿Aún no formas parte de la red? <Link to="/registro/medico" className="font-semibold text-brand-700">Regístrate aquí</Link></p>
        </form>
      }
    />
  )
}
