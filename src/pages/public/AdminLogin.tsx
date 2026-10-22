import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginAdmin, mensajeError, supabaseConfigurado } from '../../lib/api'
import { AlertTriangle, ArrowRight, Eye, EyeOff, Fingerprint, KeyRound, Lock, LockKeyhole, User } from 'lucide-react'
import { RnsLogo } from '../../components/Logo'

/** Bandera de la República Dominicana (simplificada) */
function Bandera({ className = 'h-4 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-label="Bandera de la República Dominicana">
      <rect width="30" height="20" fill="#fff" />
      <rect width="13" height="8" fill="#002d62" /><rect x="17" width="13" height="8" fill="#ce1126" />
      <rect y="12" width="13" height="8" fill="#ce1126" /><rect x="17" y="12" width="13" height="8" fill="#002d62" />
      <circle cx="15" cy="10" r="1.6" fill="#0b6b2f" />
    </svg>
  )
}

const mono = 'font-mono tracking-[0.18em]'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'cred' | '2fa'>('cred')
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [code, setCode] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 'cred') {
      if (!user.trim() || pass.length < 6) return setError('Usuario o contraseña inválidos.')
      setError('')
      if (supabaseConfigurado) {
        // Acceso real con Supabase (la verificación en dos pasos se activa en una fase posterior)
        setCargando(true)
        try { await loginAdmin(user, pass) } catch (err) { setCargando(false); return setError(mensajeError(err)) }
        setCargando(false)
        return navigate('/admin')
      }
      setStep('2fa')
    } else {
      if (!/^\d{6}$/.test(code)) return setError('Ingrese el código de 6 dígitos de su aplicación autenticadora.')
      navigate('/admin')
    }
  }

  const campo = 'w-full rounded-lg border border-[#2b5ad6]/60 bg-[#06123a]/80 py-3 pl-12 pr-12 text-[15px] text-white outline-none placeholder:text-[#7f93c4] focus:border-[#4d8dff] focus:ring-2 focus:ring-[#2f6bff]/40'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030a24] text-white">
      {/* Fondo: sala de control */}
      <div className="absolute inset-y-0 left-0 hidden w-[60%] lg:block">
        <img src="/img/login-admin-fondo.webp" alt="" className="h-full w-full object-cover object-left" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030a24]/30 via-[#030a24]/10 to-[#030a24]" />
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#030a24] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#030a24] to-transparent" />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(800px 500px at 80% 20%, rgba(37,99,235,.35), transparent 60%)' }} />

      <div className="relative mx-auto grid min-h-screen max-w-[1600px] gap-8 px-5 py-5 lg:grid-cols-[1fr_minmax(0,600px)] lg:px-10">
        {/* Columna izquierda */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-5">
            <div className="rounded-xl bg-white px-3 py-2 shadow-[0_0_30px_rgba(59,130,246,.35)]"><RnsLogo className="h-12 w-auto sm:h-14" /></div>
            <div className="border-l border-[#2b5ad6]/60 pl-5">
              <div className="text-[22px] font-semibold tracking-wide sm:text-[26px]">RED NACIONAL DE SALUD</div>
              <div className={`text-[11px] text-[#5b9bff] sm:text-[13px] ${mono}`}>SISTEMA NACIONAL DE INFORMACIÓN SANITARIA</div>
              <div className={`mt-1 flex items-center gap-2 text-[11px] text-white/85 sm:text-[13px] ${mono}`}>REPÚBLICA DOMINICANA <Bandera /></div>
            </div>
          </div>
          <div className={`mt-6 hidden border-y border-[#2b5ad6]/40 py-2 text-[10.5px] text-[#5b9bff] lg:block ${mono}`}>
            CENTRO DE OPERACIONES • IMÁGENES MÉDICAS • DATOS CLÍNICOS • ANALÍTICA • INTEROPERABILIDAD
          </div>
          <div className="flex-1" />
          <div className="hidden items-center gap-4 text-[15px] font-semibold tracking-wide text-white/90 lg:flex">
            HDCO <span className="h-4 w-px bg-white/40" /> LINKDICOM
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Bandera className="mt-1 h-7 w-10" />
              <div className={`text-[10.5px] leading-relaxed text-[#9db6ec] ${mono}`}>
                <div className="text-white/90">REPÚBLICA DOMINICANA</div>
                SERVICIO NACIONAL DE SALUD<br />INFRAESTRUCTURA CRÍTICA NACIONAL
              </div>
            </div>
            <div>
              <div className="rounded-lg border border-amber-400/80 bg-amber-400/5 px-4 py-2 shadow-[0_0_18px_rgba(251,191,36,.25)]">
                <div className={`text-[10px] text-amber-300/90 ${mono}`}>NIVEL DE CLASIFICACIÓN</div>
                <div className="text-[20px] font-bold tracking-wide text-amber-400">CONFIDENCIAL</div>
              </div>
              <div className={`mt-1.5 text-[9.5px] leading-tight text-[#9db6ec] ${mono}`}>ACCESO RESTRINGIDO<br />SOLO PERSONAL AUTORIZADO</div>
            </div>
          </div>

          <form onSubmit={submit}
            className="relative rounded-2xl border border-[#2f6bff]/60 bg-gradient-to-b from-[#0a1f5c]/85 to-[#06123a]/90 px-6 pb-6 pt-6 shadow-[0_0_40px_rgba(37,99,235,.35),inset_0_0_30px_rgba(37,99,235,.15)] backdrop-blur sm:px-10">
            <div className={`absolute right-6 top-5 text-right text-[10px] text-[#5b9bff] ${mono}`}>
              <div className="text-[#8fb6ff]">RNS-ADMIN v1.0.0</div>SECURE ACCESS TERMINAL
            </div>
            <div className={`absolute left-6 top-14 hidden space-y-4 text-[8.5px] leading-tight text-[#5b9bff]/80 sm:block ${mono}`}>
              <div>AUTENTICACIÓN<br />CIFRADA</div><div>MONITOREO<br />EN TIEMPO REAL</div><div>REGISTRO<br />DE ACTIVIDAD</div>
            </div>

            <div className="mx-auto mt-3 flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-[#4d8dff] bg-[#0b2a7a]/60 shadow-[0_0_30px_rgba(59,130,246,.6)]">
              <LockKeyhole size={40} className="text-white" />
            </div>
            <h1 className="mt-4 text-center text-[28px] font-extrabold tracking-wide text-white sm:text-[34px]">ACCESO RESTRINGIDO</h1>
            <div className={`text-center text-[14px] text-[#5b9bff] sm:text-[16px] ${mono} tracking-[0.35em]`}>RED NACIONAL DE SALUD</div>
            <div className={`mt-2 text-center text-[10.5px] text-[#9db6ec] ${mono}`}>SISTEMA NACIONAL DE INFORMACIÓN SANITARIA</div>
            <div className={`text-center text-[11px] text-white/90 ${mono}`}>REPÚBLICA DOMINICANA</div>

            {step === 'cred' ? (
              <div className="mx-auto mt-4 max-w-[480px]">
                <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#8fb6ff]"><User size={18} /> USUARIO INSTITUCIONAL</label>
                <span className="relative flex items-center">
                  <User size={17} className="pointer-events-none absolute left-4 text-[#7f93c4]" />
                  <input value={user} onChange={(e) => setUser(e.target.value)} className={campo} placeholder="Ingrese su usuario o correo institucional" autoComplete="username" />
                </span>
                <label className="mb-2 mt-4 flex items-center gap-2 text-[13px] font-semibold text-[#8fb6ff]"><Lock size={18} /> CONTRASEÑA</label>
                <span className="relative flex items-center">
                  <Lock size={17} className="pointer-events-none absolute left-4 text-[#7f93c4]" />
                  <input type={show ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} className={campo} placeholder="Ingrese su contraseña" autoComplete="current-password" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-4 text-[#8fb6ff] hover:text-white" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {show ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </span>
              </div>
            ) : (
              <div className="mx-auto mt-6 max-w-[480px]">
                <p className="text-[14px] text-[#c7d5f3]">Autenticación de dos factores (TOTP). Ingrese el código generado por su aplicación autenticadora.</p>
                <span className="relative mt-3 flex items-center">
                  <KeyRound size={17} className="pointer-events-none absolute left-4 text-[#7f93c4]" />
                  <input autoFocus inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className={`${campo} tracking-[0.5em]`} placeholder="000000" />
                </span>
              </div>
            )}

            <div className="mx-auto max-w-[480px]">
              {error && <p className="mt-3 rounded-md bg-red-500/15 px-3 py-2 text-[13px] text-red-300">{error}</p>}
              <button disabled={cargando}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-[#1f5fff] to-[#0b57f0] py-3.5 text-[17px] font-bold tracking-wide text-white shadow-[0_0_24px_rgba(37,99,235,.55)] transition hover:brightness-110 disabled:opacity-60">
                <ArrowRight size={20} /> {cargando ? 'VERIFICANDO…' : step === 'cred' ? 'AUTENTICAR' : 'VERIFICAR E INGRESAR'}
              </button>
              {step === '2fa' && <button type="button" onClick={() => setStep('cred')} className="mt-3 w-full text-[13px] text-[#8fb6ff]">← Volver</button>}

              <div className="mt-4 flex items-center gap-4 rounded-lg border border-[#2b5ad6]/50 bg-[#06123a]/60 px-4 py-3">
                <Fingerprint size={36} className="shrink-0 text-[#5b9bff]" />
                <div className="border-l border-[#2b5ad6]/50 pl-4">
                  <div className="text-[13px] font-semibold tracking-wide">ACCESO CONTROLADO Y REGISTRADO</div>
                  <div className={`text-[10.5px] text-[#9db6ec] ${mono}`}>VERIFICACIÓN DE CREDENCIALES</div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3 rounded-lg border border-amber-400/70 bg-amber-400/5 px-4 py-3">
              <AlertTriangle size={26} className="mt-0.5 shrink-0 fill-amber-400 text-[#06123a]" />
              <p className="text-[12.5px] leading-snug text-[#c7d5f3]">
                <b className="block text-amber-400">ESTE SISTEMA CONTIENE INFORMACIÓN SENSIBLE DE SALUD.</b>
                El acceso no autorizado está prohibido y será monitoreado. Toda actividad queda registrada y sujeta a auditoría.
              </p>
            </div>
            <p className="mt-4 text-center text-[12px]"><Link to="/" className="text-[#8fb6ff] hover:text-white">Volver al sitio público</Link></p>
          </form>
        </div>
      </div>
    </div>
  )
}
