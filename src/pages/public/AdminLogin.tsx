import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, ShieldCheck, User } from 'lucide-react'
import { PartnersMark, RnsLogo } from '../../components/Logo'
import { BRAND } from '../../config/brand'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'cred' | '2fa'>('cred')
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [code, setCode] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 'cred') {
      if (!user.trim() || pass.length < 6) return setError('Usuario o contraseña inválidos.')
      setError(''); setStep('2fa')
    } else {
      if (!/^\d{6}$/.test(code)) return setError('Ingrese el código de 6 dígitos de su aplicación autenticadora.')
      navigate('/admin')
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <img src="/img/radiologo-monitor.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950/95 via-navy-900/80 to-brand-800/60" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="w-fit rounded-xl bg-white/95 px-4 py-2"><RnsLogo className="h-14 w-auto" /></div>
          <div>
            <p className="text-[13px] font-semibold tracking-[0.3em] text-white/80">PANEL DE ADMINISTRACIÓN</p>
            <h1 className="mt-3 max-w-[560px] text-[44px] font-bold leading-tight text-white">Gestión centralizada de la red nacional de imágenes médicas</h1>
            <p className="mt-4 max-w-[520px] text-[17px] text-white/80">Hospitales, LINKConnect, radiólogos, estudios, informes y analítica nacional en un solo lugar.</p>
          </div>
          <div className="flex items-center justify-between">
            <PartnersMark dark />
            <span className="text-[12px] text-white/60">Versión 1.0</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-[#f3f7fd] px-5 py-10">
        <form onSubmit={submit} className="w-full max-w-[460px] rounded-3xl bg-white p-8 shadow-soft">
          <RnsLogo className="mx-auto h-16 w-auto lg:hidden" />
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white"><ShieldCheck size={30} /></span>
            <div><h2 className="text-[26px] font-bold text-ink">Acceso administrativo</h2><p className="text-[14px] text-slate-500">{BRAND.domain} · Sistema Nacional de Salud</p></div>
          </div>
          {step === 'cred' ? (
            <>
              <label className="label mt-7 !text-[14px]">Usuario</label>
              <span className="relative flex items-center"><User size={18} className="absolute left-3.5 text-slate-500" /><input value={user} onChange={(e) => setUser(e.target.value)} className="input !py-3 pl-11" placeholder="usuario o correo institucional" autoComplete="username" /></span>
              <div className="mt-4 flex items-center justify-between"><label className="label !text-[14px]">Contraseña</label>
                <button type="button" onClick={() => setShow(!show)} className="text-slate-500">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              <span className="relative flex items-center"><Lock size={18} className="absolute left-3.5 text-slate-500" /><input type={show ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} className="input !py-3 pl-11" placeholder="••••••••" autoComplete="current-password" /></span>
            </>
          ) : (
            <>
              <p className="mt-7 text-[14px] text-ink/80">Autenticación de dos factores (TOTP). Ingrese el código generado por su aplicación autenticadora.</p>
              <span className="relative mt-3 flex items-center"><KeyRound size={18} className="absolute left-3.5 text-slate-500" /><input autoFocus inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="input !py-3 pl-11 tracking-[0.5em]" placeholder="000000" /></span>
            </>
          )}
          {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
          <button className="btn-primary btn-pill mt-6 w-full !py-3.5 !text-[16px]">{step === 'cred' ? 'Continuar' : 'Verificar e ingresar'} <ArrowRight size={18} /></button>
          {step === '2fa' && <button type="button" onClick={() => setStep('cred')} className="mt-3 w-full text-[13px] text-brand-700">← Volver</button>}
          <p className="mt-6 text-center text-[12px] text-slate-500">Acceso restringido a personal autorizado. Todas las acciones quedan registradas en auditoría.</p>
          <p className="mt-2 text-center text-[12px]"><Link to="/" className="text-brand-700">Volver al sitio público</Link></p>
        </form>
      </div>
    </div>
  )
}
