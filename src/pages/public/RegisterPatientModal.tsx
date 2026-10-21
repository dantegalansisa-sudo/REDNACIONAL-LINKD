import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  AlertCircle, ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ClipboardList, Copy, ExternalLink, FileText,
  Globe, Home as HomeIcon, IdCard, Info, KeyRound, Mail, MapPin, Phone, ShieldCheck, ShieldPlus, User, UserRound,
} from 'lucide-react'
import { Modal } from '../../components/ui'
import { Logo } from '../../components/Logo'
import { PROVINCIAS, municipiosDe, sectoresDe } from '../../data/geo'
import { BlockHead, Field, IconInput, NativeSelect, RegStepper, WhatsAppIcon } from './RegisterShared'
import { documentoRegistrado, mensajeError, registrarPaciente, supabaseConfigurado } from '../../lib/api'

// Los datos personales los escribe el paciente (cuando exista convenio con la JCE se podrán autocompletar).
const CODIGO_DEMO = 'RNS-00012345'

const LEFT = [
  {
    title: <>¡Bienvenido!</>, text: 'Prepárese para experimentar los servicios de salud a un nuevo nivel.',
    items: [[CalendarDays, 'Acceso a sus estudios e informes médicos.'], [FileText, 'Seguimiento de sus citas y resultados.'], [ShieldCheck, 'Un servicio más ágil, seguro y conectado.']],
  },
  {
    title: <>¡Ya casi<br />estás listo!</>, text: 'Completa tu información para disfrutar de una experiencia de salud más rápida, segura y conectada.',
    items: [[CalendarDays, 'Accede a tus citas y estudios.'], [FileText, 'Consulta tus resultados.'], [ShieldCheck, 'Un historial médico siempre disponible.']],
  },
  {
    title: <>¡Bienvenido a la Red Nacional de Salud!</>, text: 'Ahora puedes acceder a tus servicios de salud de forma más fácil, segura y conectada.',
    items: [[FileText, 'Consulta tus estudios e informes médicos.'], [CalendarDays, 'Gestiona tus citas y seguimiento.'], [ShieldPlus, 'Un historial médico siempre disponible.']],
  },
] as const

const initial = {
  docTipo: 'Cédula' as 'Cédula' | 'Pasaporte', doc: '', nombres: '', apellidos: '', nacimiento: '', sexo: '', nacionalidad: 'Dominicana',
  tel: '', wa: '', email: '',
  provincia: '', municipio: '', sector: '', calle: '', numero: '', apto: '', referencia: '',
  ocupacion: '', civil: '', emergencia: '', parentesco: '',
}

function ReadItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[12.5px] text-brand-700">{label}</div>
      <div className="flex items-center gap-1.5 truncate text-[15px] text-ink/80">{icon}{value || '—'}</div>
    </div>
  )
}

export function RegisterPatientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  // Al cambiar de paso, volver al inicio del modal
  useEffect(() => { document.querySelectorAll('.fixed.inset-0').forEach((el) => el.scrollTo({ top: 0 })) }, [step])
  const [f, setF] = useState(initial)
  const [terms, setTerms] = useState([false, false])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')
  const [codigo, setCodigo] = useState(CODIGO_DEMO)
  const CODIGO = codigo
  const set = (k: keyof typeof initial, v: string) => setF((p) => ({ ...p, [k]: v }))

  const close = () => { setStep(0); setF(initial); setTerms([false, false]); setErrors({}); setErrorEnvio(''); setEnviando(false); onClose() }

  const verify = async () => {
    const digits = f.docTipo === 'Cédula' ? f.doc.replace(/\D/g, '') : f.doc.replace(/\W/g, '')
    if (f.docTipo === 'Cédula' ? digits.length !== 11 : digits.length < 8) {
      setErrors({ doc: f.docTipo === 'Cédula' ? 'Ingrese una cédula válida de 11 dígitos' : 'Ingrese un número de pasaporte válido (mínimo 8 caracteres)' })
      return
    }
    if (supabaseConfigurado) {
      setEnviando(true)
      try {
        if (await documentoRegistrado(f.docTipo === 'Cédula' ? 'cedula' : 'pasaporte', f.doc)) {
          setErrors({ doc: 'Este documento ya está registrado. Inicia sesión con tu código de paciente.' })
          return
        }
      } catch (err) { setErrors({ doc: mensajeError(err) }); return } finally { setEnviando(false) }
    }
    setErrors({}); setStep(1)
  }

  const finalizar = async () => {
    setErrorEnvio('')
    if (!supabaseConfigurado) { setStep(3); return }
    setEnviando(true)
    try {
      const cod = await registrarPaciente({
        tipo_documento: f.docTipo === 'Cédula' ? 'cedula' : 'pasaporte', documento: f.doc,
        nombres: f.nombres.trim(), apellidos: f.apellidos.trim(), fecha_nacimiento: f.nacimiento, sexo: f.sexo, nacionalidad: f.nacionalidad,
        telefono: f.tel, whatsapp: f.wa, correo: f.email.trim(),
        provincia: f.provincia, municipio: f.municipio, sector: f.sector, calle: f.calle, numero: f.numero, apartamento: f.apto, referencia: f.referencia,
        ocupacion: f.ocupacion, estado_civil: f.civil, emergencia_telefono: f.emergencia, emergencia_parentesco: f.parentesco,
      })
      setCodigo(cod)
      setStep(3)
    } catch (err) { setErrorEnvio(mensajeError(err)) } finally { setEnviando(false) }
  }

  const validateInfo = () => {
    const e: Record<string, string> = {}
    if (!f.nombres.trim()) e.nombres = 'Requerido'
    if (!f.apellidos.trim()) e.apellidos = 'Requerido'
    if (!f.nacimiento) e.nacimiento = 'Requerido'
    if (!f.sexo) e.sexo = 'Requerido'
    if (!/^\d{3}-?\d{3}-?\d{4}$/.test(f.tel.trim())) e.tel = 'Teléfono inválido'
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Correo inválido'
    ;(['provincia', 'municipio', 'sector', 'calle'] as const).forEach((k) => { if (!f[k]) e[k] = 'Requerido' })
    setErrors(e)
    return !Object.keys(e).length
  }

  const docFmt = f.docTipo === 'Cédula'
    ? f.doc.replace(/\D/g, '').replace(/^(\d{3})(\d{7})(\d)$/, '$1-$2-$3')
    : f.doc

  const steps = [
    { title: 'Paso 1 de 3', sub: 'Identificación del Paciente' },
    { title: 'Paso 2 de 3', sub: 'Información Personal' },
    { title: 'Paso 3 de 3', sub: 'Confirmación de datos' },
  ]
  const left = LEFT[step === 0 ? 0 : step === 3 ? 2 : 1]

  return (
    <Modal open={open} onClose={close} className="max-w-[1180px]" closeOnBackdrop={false}>
      <div className="ui-compact grid min-h-[min(720px,88vh)] lg:grid-cols-[minmax(0,400px)_1fr]">
        {/* Panel izquierdo: texto arriba y foto abajo, sin superponerse */}
        <aside className="hidden flex-col overflow-hidden bg-gradient-to-b from-white to-[#e6effb] lg:flex">
          <div className="px-8 pt-7">
            <Logo size="md" to={null} />
            <h2 className={clsx('mt-7 font-bold leading-[1.08] tracking-tight text-ink', step === 3 ? 'text-[32px]' : 'text-[40px]')}>{left.title}</h2>
            <p className="mt-3 max-w-[330px] text-[17px] leading-snug text-ink/90">{left.text}</p>
            <ul className="mt-5 space-y-3">
              {left.items.map(([Icon, t]) => (
                <li key={t} className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm"><Icon size={20} /></span>
                  <span className="max-w-[240px] text-[14.5px] leading-snug text-ink">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mt-6 min-h-[200px] flex-1">
            <img src="/img/paciente-sala.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_85%]" />
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#eef4fc] to-transparent" />
          </div>
        </aside>

        {/* Contenido */}
        <div className="flex flex-col px-4 pb-6 pt-5 sm:px-10">
          <div className="mb-3 lg:hidden"><Logo size="sm" to={null} /></div>
          {step < 3 && <RegStepper steps={steps} current={step} className="pr-10" />}

          {/* Paso 1 */}
          {step === 0 && (
            <div className="mx-auto w-full max-w-[770px] flex-1 pt-10">
              <h2 className="text-center text-[34px] font-bold text-ink sm:text-[40px]">Registro de Paciente</h2>
              <p className="mt-2 text-center text-[19px] text-brand-800/80 sm:text-[22px]">Para comenzar, ingrese su número de cédula o pasaporte.</p>
              <p className="mx-auto mt-1 max-w-[560px] text-center text-[16px] text-slate-500 sm:text-[18px]">Esto nos permitirá verificar si ya se encuentra registrado en la red nacional de salud y facilitará el proceso de registro.</p>
              <div className="mt-7 rounded-xl border border-[#e3eaf6] bg-[#f6f9fe] p-6">
                <span className="label !text-[17px]">Tipo de documento</span>
                <div className="flex gap-3">
                  {(['Cédula', 'Pasaporte'] as const).map((t) => (
                    <button key={t} onClick={() => { set('docTipo', t); set('doc', '') }}
                      className={clsx('flex items-center gap-3 rounded-lg border px-6 py-3 text-[17px] transition', f.docTipo === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#d7e1f2] bg-white text-ink/80 hover:border-brand-300')}>
                      {t === 'Cédula' ? <IdCard size={24} /> : <Globe size={24} />} {t}
                    </button>
                  ))}
                </div>
                <label className="label mt-5 !text-[17px]">Número de {f.docTipo === 'Cédula' ? 'cédula' : 'pasaporte'} <span className="req">*</span></label>
                <IconInput icon={IdCard} value={f.doc} onChange={(e) => set('doc', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verify()}
                  placeholder={`Ingrese su número de ${f.docTipo === 'Cédula' ? 'cédula' : 'pasaporte'}`} className="!py-3.5 !text-[17px]" />
                {errors.doc && <p className="mt-1 text-[13px] text-red-600">{errors.doc}</p>}
                <button onClick={verify} disabled={enviando} className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-brand-600 py-4 text-[20px] font-medium text-white hover:bg-brand-700 disabled:opacity-60">
                  {enviando ? 'Verificando…' : 'Verificar y continuar'} <ArrowRight size={22} />
                </button>
              </div>
              <div className="mt-4 flex gap-4 rounded-xl border border-[#e3eaf6] bg-[#f6f9fe] p-5">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white ring-8 ring-brand-100"><Info size={30} /></span>
                <div>
                  <h4 className="text-[18px] font-bold text-ink">¿No tiene cédula o pasaporte?</h4>
                  <p className="text-[16px] text-slate-500">Si no cuenta con cédula o pasaporte, deberá registrarse en una de las instituciones de salud que forman parte de la red de centros de salud.</p>
                  <a href="/#enlaces" className="mt-2 inline-flex items-center gap-2 text-[17px] font-medium text-brand-700 hover:underline">Ver centros de salud <ExternalLink size={18} /></a>
                </div>
              </div>
            </div>
          )}

          {/* Paso 2 */}
          {step === 1 && (
            <div className="flex-1 pt-5">
              <h2 className="text-[34px] font-bold leading-none text-ink">Información Personal</h2>
              <p className="mt-1 text-[19px] text-slate-500">Complete sus datos personales y de contacto.</p>
              <div className="mt-3 space-y-3">
                <section className="rounded-xl border border-[#e6edf8]">
                  <BlockHead icon={User} title="Datos del paciente" extra={<span className="font-normal text-slate-500">(tal como aparecen en su documento)</span>} />
                  <div className="grid gap-3 p-3 sm:grid-cols-3">
                    <Field label={f.docTipo} req><input className="input-ro" readOnly value={docFmt} /></Field>
                    <Field label="Nombres" req error={errors.nombres}><input className="input" value={f.nombres} onChange={(e) => set('nombres', e.target.value)} placeholder="Nombres" /></Field>
                    <Field label="Apellidos" req error={errors.apellidos}><input className="input" value={f.apellidos} onChange={(e) => set('apellidos', e.target.value)} placeholder="Apellidos" /></Field>
                    <Field label="Fecha de nacimiento" req error={errors.nacimiento}><input type="date" className="input" value={f.nacimiento} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set('nacimiento', e.target.value)} /></Field>
                    <Field label="Sexo" req error={errors.sexo}><NativeSelect value={f.sexo} onChange={(v) => set('sexo', v)} options={['Masculino', 'Femenino']} placeholder="Seleccione" /></Field>
                    <Field label="Nacionalidad"><input className="input" value={f.nacionalidad} onChange={(e) => set('nacionalidad', e.target.value)} /></Field>
                  </div>
                </section>
                <section className="rounded-xl border border-[#e6edf8]">
                  <BlockHead icon={Phone} title="Información de contacto" />
                  <div className="p-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Teléfono principal" req error={errors.tel}><IconInput icon={Phone} value={f.tel} onChange={(e) => set('tel', e.target.value)} placeholder="809-555-1234" /></Field>
                      <Field label="WhatsApp"><span className="relative flex items-center"><WhatsAppIcon className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-emerald-500" /><input className="input pl-10" value={f.wa} onChange={(e) => set('wa', e.target.value)} placeholder="809-555-1234" /></span></Field>
                      <Field label="Correo electrónico" error={errors.email}><IconInput icon={Mail} type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="correo@email.com" /></Field>
                    </div>
                    <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13.5px] text-ink/80">
                      <AlertCircle size={26} className="shrink-0 fill-orange-500 text-white" />
                      <span><b className="text-orange-600">Importante:</b> Si en algún momento cambia su número de teléfono, deberá actualizarlo en su perfil de paciente para seguir recibiendo notificaciones de sus citas, resultados y comunicaciones.</span>
                    </div>
                  </div>
                </section>
                <section className="rounded-xl border border-[#e6edf8]">
                  <BlockHead icon={MapPin} title="Dirección de residencia" />
                  <div className="grid gap-3 p-3 sm:grid-cols-3 lg:grid-cols-[1.3fr_0.5fr_0.85fr_1.2fr]">
                    <Field label="Provincia" req error={errors.provincia}><NativeSelect value={f.provincia} onChange={(v) => setF((p) => ({ ...p, provincia: v, municipio: '', sector: '' }))} options={PROVINCIAS} placeholder="Seleccione" /></Field>
                    <Field label="Municipio" req error={errors.municipio} className="lg:col-span-2"><NativeSelect value={f.municipio} onChange={(v) => setF((p) => ({ ...p, municipio: v, sector: '' }))} options={f.provincia ? municipiosDe(f.provincia) : []} placeholder="Seleccione" /></Field>
                    <Field label="Sector" req error={errors.sector}><NativeSelect value={f.sector} onChange={(v) => set('sector', v)} options={f.municipio ? sectoresDe(f.municipio) : []} placeholder="Seleccione" /></Field>
                    <Field label="Calle" req error={errors.calle}><input className="input" value={f.calle} onChange={(e) => set('calle', e.target.value)} placeholder="Calle Principal" /></Field>
                    <Field label="Número"><input className="input" value={f.numero} onChange={(e) => set('numero', e.target.value)} placeholder="45" /></Field>
                    <Field label="Apartamento / Casa"><input className="input" value={f.apto} onChange={(e) => set('apto', e.target.value)} placeholder="Apto. 3B" /></Field>
                    <Field label="Referencia (opcional)"><input className="input" value={f.referencia} onChange={(e) => set('referencia', e.target.value)} placeholder="Torre Médica, frente al parque" /></Field>
                  </div>
                </section>
                <section className="rounded-xl border border-[#e6edf8]">
                  <BlockHead icon={FileText} title="Información adicional" extra={<span className="font-normal text-slate-500">(opcional)</span>} />
                  <div className="grid gap-3 p-3 sm:grid-cols-4">
                    <Field label="Ocupación"><NativeSelect value={f.ocupacion} onChange={(v) => set('ocupacion', v)} options={['Empleado(a)', 'Independiente', 'Estudiante', 'Jubilado(a)', 'Desempleado(a)']} placeholder="Seleccione" /></Field>
                    <Field label="Estado civil"><NativeSelect value={f.civil} onChange={(v) => set('civil', v)} options={['Soltero(a)', 'Casado(a)', 'Unión libre', 'Divorciado(a)', 'Viudo(a)']} placeholder="Seleccione" /></Field>
                    <Field label="Contacto de emergencia"><IconInput icon={Phone} value={f.emergencia} onChange={(e) => set('emergencia', e.target.value)} placeholder="809-555-9876" /></Field>
                    <Field label="Parentesco"><NativeSelect value={f.parentesco} onChange={(v) => set('parentesco', v)} options={['Padre', 'Madre', 'Esposo(a)', 'Hijo(a)', 'Hermano(a)', 'Otro']} placeholder="Seleccione" /></Field>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* Paso 3 */}
          {step === 2 && (
            <div className="flex-1 pt-5">
              <h2 className="text-[34px] font-bold leading-none text-ink">Confirmación de datos</h2>
              <p className="mt-1 text-[18px] text-slate-500">Revise su información antes de finalizar su registro en la red nacional de salud.</p>
              <div className="mt-4 grid gap-3 xl:grid-cols-[1.45fr_1fr]">
                <div className="space-y-3">
                  <section className="rounded-xl border border-[#e6edf8]">
                    <BlockHead icon={User} title="Datos del paciente" />
                    <div className="grid grid-cols-3 gap-3 p-3">
                      <ReadItem label={f.docTipo} value={docFmt} /><ReadItem label="Nombres" value={f.nombres} /><ReadItem label="Apellidos" value={f.apellidos} />
                      <ReadItem label="Fecha de nacimiento" value={f.nacimiento ? f.nacimiento.split('-').reverse().join('/') : ''} /><ReadItem label="Sexo" value={f.sexo} /><ReadItem label="Nacionalidad" value={f.nacionalidad} />
                    </div>
                  </section>
                  <section className="rounded-xl border border-[#e6edf8]">
                    <BlockHead icon={Phone} title="Información de contacto" />
                    <div className="grid grid-cols-3 gap-3 p-3">
                      <ReadItem label="Teléfono principal" value={f.tel} icon={<Phone size={16} className="text-brand-600" />} />
                      <ReadItem label="WhatsApp" value={f.wa} icon={<WhatsAppIcon className="h-4 w-4 text-emerald-500" />} />
                      <ReadItem label="Correo electrónico" value={f.email} icon={<Mail size={16} className="text-brand-600" />} />
                    </div>
                  </section>
                  <section className="rounded-xl border border-[#e6edf8]">
                    <BlockHead icon={MapPin} title="Dirección de residencia" />
                    <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
                      <ReadItem label="Provincia" value={f.provincia} /><ReadItem label="Municipio" value={f.municipio} /><ReadItem label="Sector" value={f.sector} /><ReadItem label="Calle" value={f.calle} />
                      <ReadItem label="Número" value={f.numero} /><ReadItem label="Apartamento / Casa" value={f.apto} /><div className="sm:col-span-2"><ReadItem label="Referencia" value={f.referencia} /></div>
                    </div>
                  </section>
                  <section className="rounded-xl border border-[#e6edf8]">
                    <BlockHead icon={FileText} title="Información adicional" />
                    <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
                      <ReadItem label="Ocupación" value={f.ocupacion} /><ReadItem label="Estado civil" value={f.civil} />
                      <ReadItem label="Contacto de emergencia" value={f.emergencia} icon={f.emergencia ? <Phone size={16} className="text-brand-600" /> : undefined} /><ReadItem label="Parentesco" value={f.parentesco} />
                    </div>
                  </section>
                </div>
                <div className="space-y-3">
                  <section className="rounded-xl border border-[#e6edf8]">
                    <BlockHead icon={FileText} title="Documentos y verificación" />
                    <div className="p-3">
                      <p className="text-[14px] text-slate-500">No se requieren documentos adicionales en este registro. Su identidad se confirma con el documento ingresado al momento de su atención en el centro de salud.</p>
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <CheckCircle2 size={34} className="shrink-0 fill-emerald-500 text-white" />
                        <span><b className="block text-[16px] text-emerald-700">Documento disponible</b><span className="text-[13px] text-slate-500">Este documento no estaba registrado en la red. Puede continuar con su registro.</span></span>
                      </div>
                    </div>
                  </section>
                  <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <AlertCircle size={30} className="shrink-0 fill-orange-500 text-white" />
                    <span className="text-[13px] text-ink/80"><b className="block text-[15px] text-orange-600">Importante</b>Si en algún momento cambia su número de teléfono, deberá actualizarlo en su perfil de paciente para seguir recibiendo notificaciones de sus citas, resultados y comunicaciones.</span>
                  </div>
                  <section className="rounded-xl border border-[#e6edf8]">
                    <BlockHead icon={ClipboardList} title="Términos y confirmación" />
                    <div className="space-y-3 p-3">
                      <p className="text-[14px] text-slate-500">Para finalizar su registro, por favor lea y acepte las siguientes declaraciones:</p>
                      {['Declaro que la información proporcionada es verídica y autorizo su verificación por parte del Ministerio de Salud Pública, el SNS y las entidades de la red.',
                        'Acepto formar parte de la Red Nacional de Salud Dominicana y recibir comunicaciones relacionadas con mis citas, resultados y servicios de salud.'].map((t, i) => (
                        <label key={i} className="flex cursor-pointer items-start gap-3 text-[12.5px] leading-snug text-ink/75">
                          <input type="checkbox" checked={terms[i]} onChange={() => setTerms((a) => a.map((x, j) => (j === i ? !x : x)))} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600" />{t}
                        </label>
                      ))}
                      <a href="/contacto#terminos" target="_blank" className="flex items-center gap-2 text-[14px] text-brand-700 hover:underline"><ExternalLink size={18} /> Ver términos y condiciones</a>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* Éxito */}
          {step === 3 && (
            <div className="flex-1 pt-2">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <span className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={38} strokeWidth={3} /></span>
                <span className="absolute -left-8 top-3 h-1 w-5 rotate-[30deg] rounded bg-brand-600" /><span className="absolute -left-6 bottom-4 h-1 w-4 -rotate-12 rounded bg-emerald-400" />
                <span className="absolute -right-8 top-3 h-1 w-5 -rotate-[30deg] rounded bg-orange-400" /><span className="absolute -right-6 bottom-4 h-1 w-4 rotate-12 rounded bg-brand-400" />
              </div>
              <h2 className="mt-2 text-center text-[28px] font-bold text-ink sm:text-[32px]">¡Registro completado!</h2>
              <p className="mx-auto mt-1 max-w-[640px] text-center text-[15px] leading-snug text-brand-800/80">Tu información ha sido guardada correctamente en la Red Nacional de Salud. A continuación encontrarás tu código de paciente y las instrucciones para acceder a tu portal.</p>
              <div className="mt-5 grid gap-4 rounded-xl bg-[#eef4fd] p-4 md:grid-cols-[1.35fr_1fr]">
                <div className="flex gap-4">
                  <UserRound size={32} className="mt-0.5 shrink-0 text-brand-600" />
                  <div>
                    <div className="text-[13px] font-bold tracking-wide text-ink">TU CÓDIGO DE PACIENTE</div>
                    <div className="mt-2 flex w-fit items-center gap-4 rounded-xl bg-white px-4 py-2">
                      <span className="text-[24px] font-bold text-ink sm:text-[26px]">{CODIGO}</span>
                      <button onClick={() => { try { navigator.clipboard.writeText(CODIGO) } catch { /* sin portapapeles */ } setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                        className="border-l border-[#dbe5f5] pl-4 text-brand-600" title="Copiar código">{copied ? <Check size={20} /> : <Copy size={20} />}</button>
                    </div>
                    <p className="mt-2 text-[13px] text-ink/70">Guarda este código para identificarte en futuras consultas y acceder a tu información.</p>
                  </div>
                </div>
                <div className="flex gap-4 border-[#cfdcf2] md:border-l md:pl-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white"><Mail size={20} /></span>
                  <div><div className="text-[15px] font-bold leading-tight text-ink">Información enviada por correo</div><p className="mt-1.5 text-[13px] text-ink/70">Si registraste un correo electrónico, también te enviamos tu código de paciente y estas instrucciones.</p></div>
                </div>
              </div>
              <div className="mt-3 grid items-center gap-4 rounded-xl bg-[#eef4fd] p-4 md:grid-cols-[1.6fr_1fr]">
                <div>
                  <h3 className="flex items-center gap-2.5 text-[16px] font-bold text-ink"><KeyRound size={22} className="text-brand-600" /> ¿Cómo acceder a tu portal de paciente?</h3>
                  <ol className="mt-3 space-y-2 text-[13.5px] text-ink/80">
                    {[<>Ingresa al <b>portal</b> de la Red Nacional de Salud.</>, <>En el campo <b>Usuario</b>, escribe tu código de paciente: <b className="text-brand-700">{CODIGO}</b>.</>, <>En el campo <b>Clave</b>, ingresa tu número de <b>cédula</b> o <b>pasaporte</b>.</>, <>Haz clic en <b>Iniciar sesión</b>.</>].map((t, i) => (
                      <li key={i} className="flex items-center gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[12px] font-bold text-brand-700">{i + 1}</span><span>{t}</span></li>
                    ))}
                  </ol>
                </div>
                <div className="mx-auto w-full max-w-[220px]">
                  <div className="rounded-t-xl border-[6px] border-b-0 border-brand-400 bg-white p-4 text-center">
                    <img src="/img/logos/rns.png" alt="" className="mx-auto h-8 w-auto" />
                    <div className="mt-2 rounded border border-[#d7e1f2] px-2 py-1 text-left text-[11px] text-ink">👤 {CODIGO}</div>
                    <div className="mt-1.5 rounded border border-[#d7e1f2] px-2 py-1 text-left text-[11px] text-ink">🔒 •••••••</div>
                    <div className="mt-2 rounded bg-brand-600 py-1 text-[11px] text-white">Iniciar sesión</div>
                  </div>
                  <div className="h-3 rounded-b-lg bg-brand-400" />
                </div>
              </div>
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertCircle size={30} className="shrink-0 fill-orange-500 text-white" />
                <div><b className="text-[15px] text-orange-600">Recomendamos cambiar tu contraseña</b><p className="text-[13px] text-ink/80">Por tu seguridad, te sugerimos cambiar tu contraseña en cuanto ingreses a tu portal. Puedes hacerlo fácilmente desde tu perfil, en la sección <b className="text-ink">Seguridad</b>.</p></div>
              </div>
            </div>
          )}

          {/* Navegación */}
          {step === 1 || step === 2 ? (
            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => { setErrors({}); setStep(step - 1) }} className="flex items-center gap-3 rounded-full border-2 border-brand-600 px-8 py-2.5 text-[18px] font-medium text-brand-700 hover:bg-brand-50"><ArrowLeft size={20} /> Anterior</button>
              {step === 1
                ? <button onClick={() => validateInfo() && setStep(2)} className="flex items-center gap-3 rounded-full bg-brand-600 px-14 py-3 text-[18px] font-medium text-white hover:bg-brand-700">Siguiente <ArrowRight size={20} /></button>
                : <div className="flex flex-col items-end gap-1">
                    <button disabled={!terms.every(Boolean) || enviando} onClick={finalizar} className="flex items-center gap-3 rounded-full bg-brand-600 px-9 py-3 text-[18px] font-medium text-white hover:bg-brand-700 disabled:opacity-50">{enviando ? 'Registrando…' : 'Finalizar Registro'} <ArrowRight size={20} /></button>
                    {errorEnvio && <p className="max-w-[420px] text-right text-[13px] text-red-600">{errorEnvio}</p>}
                  </div>}
            </div>
          ) : step === 3 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button onClick={close} className="flex items-center gap-2.5 rounded-full border-2 border-brand-600 px-7 py-2.5 text-[15px] font-medium text-brand-700 hover:bg-brand-50"><HomeIcon size={18} fill="currentColor" /> Ir al inicio</button>
              <button onClick={() => { close(); navigate('/paciente/login') }} className="flex items-center gap-2.5 rounded-full bg-brand-600 px-9 py-3 text-[15px] font-medium text-white hover:bg-brand-700">Iniciar sesión ahora <ArrowRight size={18} /></button>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
