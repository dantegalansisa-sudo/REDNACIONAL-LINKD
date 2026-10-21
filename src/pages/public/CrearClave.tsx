import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, KeyRound, Lock } from 'lucide-react'
import { RnsLogo } from '../../components/Logo'
import { supabase } from '../../lib/supabase'
import { crearClave, mensajeError } from '../../lib/api'

/**
 * El médico aprobado llega aquí desde el correo "Crea tu contraseña".
 * Supabase abre la sesión con el enlace del correo y aquí se define la contraseña.
 */
export default function CrearClave() {
  const navigate = useNavigate()
  const [listo, setListo] = useState<'esperando' | 'ok' | 'invalido'>('esperando')
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [hecho, setHecho] = useState(false)

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (evento === 'PASSWORD_RECOVERY' || (sesion && evento === 'SIGNED_IN')) setListo('ok')
    })
    // Si la sesión ya se abrió antes de montar la página
    supabase.auth.getSession().then(({ data: d }) => { if (d.session) setListo('ok') })
    const t = setTimeout(() => setListo((e) => (e === 'esperando' ? 'invalido' : e)), 4000)
    return () => { data.subscription.unsubscribe(); clearTimeout(t) }
  }, [])

  const valida = pwd.length >= 8 && /[a-zA-Z]/.test(pwd) && /\d/.test(pwd) && pwd === confirm

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valida) return setError('La contraseña debe tener al menos 8 caracteres, una letra y un número, y ambas deben coincidir.')
    setGuardando(true); setError('')
    try {
      await crearClave(pwd)
      await supabase.auth.signOut()
      setHecho(true)
    } catch (err) { setError(mensajeError(err)) } finally { setGuardando(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f7fd] px-4 py-10">
      <div className="w-full max-w-[460px] rounded-3xl bg-white p-8 shadow-soft">
        <RnsLogo className="mx-auto h-14 w-auto" />
        {hecho ? (
          <div className="mt-6 text-center">
            <CheckCircle2 size={52} className="mx-auto text-emerald-500" />
            <h1 className="mt-3 text-[24px] font-bold text-ink">¡Contraseña creada!</h1>
            <p className="mt-1 text-[14px] text-slate-500">Ya puede iniciar sesión en el portal del médico con su correo o número de exequátur.</p>
            <button onClick={() => navigate('/medico/login')} className="btn-primary btn-pill mt-6 w-full !py-3">Ir a iniciar sesión</button>
          </div>
        ) : listo === 'invalido' ? (
          <div className="mt-6 text-center">
            <h1 className="text-[22px] font-bold text-ink">Enlace no válido o vencido</h1>
            <p className="mt-2 text-[14px] text-slate-500">Abra el enlace más reciente que recibió por correo. Si venció, contacte a soporte para que le envíen uno nuevo.</p>
            <Link to="/" className="btn-outline mt-6">Volver al inicio</Link>
          </div>
        ) : (
          <form onSubmit={guardar} className="mt-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white"><KeyRound size={24} /></span>
              <div><h1 className="text-[22px] font-bold text-ink">Crea tu contraseña</h1><p className="text-[13px] text-slate-500">Portal del médico · Red Nacional de Salud</p></div>
            </div>
            <label className="label mt-6">Nueva contraseña</label>
            <span className="relative flex items-center"><Lock size={17} className="absolute left-3.5 text-slate-500" /><input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="input !py-3 pl-11" autoComplete="new-password" disabled={listo !== 'ok'} /></span>
            <label className="label mt-4">Repite la contraseña</label>
            <span className="relative flex items-center"><Lock size={17} className="absolute left-3.5 text-slate-500" /><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input !py-3 pl-11" autoComplete="new-password" disabled={listo !== 'ok'} /></span>
            <p className="mt-2 text-[12px] text-slate-500">Mínimo 8 caracteres, con al menos una letra y un número.</p>
            {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
            <button disabled={listo !== 'ok' || guardando} className="btn-primary btn-pill mt-6 w-full !py-3 !text-[15px]">
              {listo === 'esperando' ? 'Verificando enlace…' : guardando ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
