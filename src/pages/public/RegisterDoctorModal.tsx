import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  ArrowLeft, ArrowRight, Award, Bell, Camera, Check, CheckCircle2, Clock, ClipboardList, Contact, Eye, FileCheck2,
  FileText, GraduationCap, IdCard, Info, Mail, MapPin, Map as MapIcon, Paperclip, Phone, Stethoscope, Upload, User,
  UserRound,
} from 'lucide-react'
import { Modal } from '../../components/ui'
import { Logo } from '../../components/Logo'
import { ESPECIALIDADES_MED, MODALIDADES_RAD, PROVINCIAS, REGIONES, municipiosDe, sectoresDe } from '../../data/geo'
import { BlockHead, Field, IconInput, NativeSelect, RegStepper, WhatsAppIcon } from './RegisterShared'

type Tipo = 'radiologo' | 'referidor'
type DocKey = 'titulo' | 'exequatur' | 'cedula' | 'especialidad' | 'otros'

const DOCS: { key: DocKey; icon: typeof GraduationCap; title: string; req: boolean; sub: Record<Tipo, string> }[] = [
  { key: 'titulo', icon: GraduationCap, title: 'Título de Médico', req: true, sub: { radiologo: 'Título de grado en Medicina.', referidor: 'Título de grado en Medicina.' } },
  { key: 'exequatur', icon: FileText, title: 'Registro de Exequátur', req: true, sub: { radiologo: 'Documento oficial del MESCyT.', referidor: 'Documento oficial del MESCyT.' } },
  { key: 'cedula', icon: IdCard, title: 'Cédula de Identidad', req: true, sub: { radiologo: 'Copia de su cédula de identidad.', referidor: 'Copia de su cédula de identidad.' } },
  { key: 'especialidad', icon: Award, title: 'Certificación de Especialidad', req: false, sub: { radiologo: 'Certificación de Radiología u otra.', referidor: 'Certificación de su especialidad médica.' } },
  { key: 'otros', icon: Paperclip, title: 'Otros documentos', req: false, sub: { radiologo: 'Cualquier documento adicional.', referidor: 'Cualquier documento adicional.' } },
]

/** Simula la consulta al registro de exequátur (en producción: API MESCyT / SNS) */
const EXEQUATUR_DB: Record<Tipo, { trat: string; nombres: string; apellidos: string; cedula: string; sexo: string; foto: string }> = {
  radiologo: { trat: 'Dr.', nombres: 'Carlos Andrés', apellidos: 'Méndez Rodríguez', cedula: '001-1234567-1', sexo: 'Masculino', foto: '/img/crops/dr-carlos.webp' },
  referidor: { trat: 'Dr.', nombres: 'Luis Fernando', apellidos: 'González Santana', cedula: '402-3456789-0', sexo: 'Masculino', foto: '/img/crops/dr-luis.webp' },
}

const initial = {
  exequatur: '', telRes: '', telWa: '', email: '', email2: '',
  provincia: '', municipio: '', sector: '', calle: '', casa: '', residencial: '', otraEsp: '',
}

export function RegisterDoctorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)
  // Al cambiar de paso, volver al inicio del modal
  useEffect(() => { document.querySelectorAll('.fixed.inset-0').forEach((el) => el.scrollTo({ top: 0 })) }, [step])
  const [tipo, setTipo] = useState<Tipo>('radiologo')
  const [f, setF] = useState(initial)
  const [esp, setEsp] = useState<string[]>([])
  const [reg, setReg] = useState<string[]>([])
  const [docs, setDocs] = useState<Partial<Record<DocKey, string>>>({})
  const [foto, setFoto] = useState<string | null>(null)
  const [acepta, setAcepta] = useState([false, false])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fotoRef = useRef<HTMLInputElement>(null)

  const found = f.exequatur.trim().length >= 4 ? EXEQUATUR_DB[tipo] : null
  const set = (k: keyof typeof initial, v: string) => setF((p) => ({ ...p, [k]: v }))
  const toggle = (arr: string[], v: string, fn: (a: string[]) => void) => fn(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const tipoLabel = tipo === 'radiologo' ? 'Médico Radiólogo' : 'Médico de Consulta (Referidor)'
  const photo = foto ?? found?.foto ?? null

  const reset = () => {
    setStep(0); setTipo('radiologo'); setF(initial); setEsp([]); setReg([]); setDocs({}); setFoto(null); setAcepta([false, false]); setErrors({})
  }
  const close = () => { reset(); onClose() }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!found) e.exequatur = 'Ingrese un número de exequátur válido'
    if (!photo) e.foto = 'La fotografía es obligatoria'
    if (!/^\d{3}-?\d{3}-?\d{4}$/.test(f.telRes.trim())) e.telRes = 'Teléfono inválido'
    if (!/^\d{3}-?\d{3}-?\d{4}$/.test(f.telWa.trim())) e.telWa = 'Teléfono inválido'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Correo inválido'
    if (f.email2 !== f.email || !f.email2) e.email2 = 'Los correos no coinciden'
    ;(['provincia', 'municipio', 'sector', 'calle', 'casa'] as const).forEach((k) => { if (!f[k].trim()) e[k] = 'Requerido' })
    if (!esp.length) e.esp = 'Seleccione al menos una opción'
    if (!reg.length) e.reg = 'Seleccione al menos una región'
    DOCS.filter((d) => d.req).forEach((d) => { if (!docs[d.key]) e['doc-' + d.key] = 'Documento requerido' })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const steps = [
    { title: 'Paso 1 de 3', sub: step > 0 ? <>Tipo de Médico<br /><span className="text-ink/80">{tipoLabel}</span></> : 'Tipo de Médico' },
    { title: 'Paso 2 de 3', sub: 'Registro Profesional' },
    { title: 'Paso 3 de 3', sub: 'Confirmación de datos' },
  ]

  const especialidades = tipo === 'radiologo' ? MODALIDADES_RAD : ESPECIALIDADES_MED
  const fullName = found ? `${found.trat} ${found.nombres} ${found.apellidos}` : ''

  const header = (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <RegStepper steps={steps} current={step} className="flex-1" />
      {step > 0 && (
        <div className="flex items-center gap-4 border-[#dbe5f5] lg:w-[440px] lg:border-l lg:pl-6">
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white"><UserRound size={40} /><Stethoscope size={16} className="absolute bottom-2 right-3" /></span>
          <div className="border-l border-[#dbe5f5] pl-4">
            <h3 className="text-[18px] font-bold text-ink">Registro de {tipoLabel}</h3>
            <p className="text-[14px] text-slate-500">{step === 1 ? 'Complete la información solicitada para formar parte de la red nacional de salud.' : 'Revise su información antes de finalizar su registro en la red nacional de salud.'}</p>
          </div>
        </div>
      )}
    </div>
  )

  /* ---------------- Éxito ---------------- */
  if (open && step === 3) {
    return (
      <Modal open onClose={close} className="max-w-[1100px]">
        <div className="px-6 pb-8 pt-6 sm:px-10">
          <Logo size="md" to={null} subtitle="SISTEMA NACIONAL DE SALUD DOMINICANA" />
          <div className="mx-auto -mt-2 flex h-[130px] w-[130px] items-center justify-center rounded-full bg-brand-50">
            <span className="flex h-[74px] w-[64px] items-center justify-center rounded-lg bg-brand-600 text-white"><FileCheck2 size={44} /></span>
          </div>
          <h2 className="mt-6 text-center text-[30px] font-bold text-ink sm:text-[38px]">¡Registro recibido exitosamente!</h2>
          <p className="mt-1 text-center text-[17px] text-slate-500 sm:text-[21px]">Gracias por formar parte de la Red Nacional de Salud Dominicana.</p>
          <p className="mx-auto mt-5 max-w-[680px] text-center text-[16px] leading-relaxed text-ink/80 sm:text-[18px]">
            Hemos recibido sus datos profesionales y los documentos enviados. Su solicitud será revisada por el equipo autorizado del <b className="text-ink">Sistema Nacional de Salud (SNS).</b>
          </p>
          <div className="mx-auto mt-6 max-w-[940px] space-y-4">
            <div className="flex items-center gap-5 rounded-xl border border-amber-200 bg-amber-50/70 px-6 py-4">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500"><Clock size={44} /></span>
              <div>
                <div className="text-[18px] font-bold text-ink">Estado de la solicitud</div>
                <div className="text-[19px] font-bold text-amber-500">Pendiente de revisión y aprobación</div>
                <div className="text-[15px] text-slate-500">Le notificaremos cuando su cuenta esté activada.</div>
              </div>
            </div>
            <div className="flex flex-col gap-5 rounded-xl border border-brand-100 bg-brand-50/60 px-6 py-4 sm:flex-row sm:items-center">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600"><Bell size={40} fill="currentColor" /></span>
              <div className="flex-1">
                <div className="text-[18px] font-bold text-ink">Recibirá una notificación cuando su cuenta sea aprobada</div>
                <div className="text-[15px] text-slate-500">Le enviaremos las instrucciones de acceso por los medios registrados:</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-[#dbe5f5] bg-white p-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white"><WhatsAppIcon className="h-7 w-7" /></span>
                    <span><b className="block text-[16px] text-ink">WhatsApp</b><span className="text-[14px] text-slate-500">Al número registrado</span></span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-[#dbe5f5] bg-white p-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white"><Mail size={24} /></span>
                    <span><b className="block text-[16px] text-ink">Correo electrónico</b><span className="text-[14px] text-slate-500">A su dirección registrada</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-[940px] border-t border-[#e3eaf6] pt-4 text-center text-[15px] text-slate-500">Gracias por contribuir a una atención médica más conectada<br />para todos los dominicanos.</p>
          <button onClick={close} className="mx-auto mt-4 flex w-full max-w-[740px] items-center justify-center gap-3 rounded-full bg-brand-600 py-3.5 text-[19px] font-medium text-white hover:bg-brand-700">
            Entendido <ArrowRight size={20} />
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={close} className="max-w-[1460px]" closeOnBackdrop={false}>
      {/* imagen decorativa de fondo (paso 1) */}
      {step === 0 && (
        <div className="pointer-events-none absolute right-0 top-0 hidden h-[380px] w-[48%] md:block">
          <img src="/img/doctor-banner.webp" alt="" className="h-full w-full object-cover object-[70%_center] opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-white/0" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>
      )}
      <div className="relative px-4 pb-4 pt-5 sm:px-8">
        <Logo size="md" to={null} subtitle="RED NACIONAL DE SALUD DOMINICANA" className="[&_img]:h-[62px] [&_img]:w-[62px]" />
        <div className="mt-5">{header}</div>

        {/* ---------------- Paso 1 ---------------- */}
        {step === 0 && (
          <div>
            <h2 className="mt-6 font-serif text-[40px] font-bold leading-none text-ink sm:text-[54px]">Registro de Médico</h2>
            <p className="mt-3 text-[16px] text-slate-600 sm:text-[19px]">Seleccione el tipo de médico para continuar con su registro.<br />Esto nos permitirá brindarle una experiencia personalizada.</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {([
                { k: 'radiologo', img: '/img/radiologo-cerebro.webp', title: 'Médico Radiólogo', text: 'Seleccione esta opción si usted es médico radiólogo para la lectura, interpretación y emisión de informes de imágenes diagnósticas.' },
                { k: 'referidor', img: '/img/doctor-consulta.webp', title: 'Médico de Consulta (Referidor)', text: 'Seleccione esta opción si usted es médico referidor para solicitar estudios, dar seguimiento a sus pacientes y acceder a los informes e imágenes diagnósticas.' },
              ] as const).map((c) => {
                const sel = tipo === c.k
                return (
                  <button key={c.k} onClick={() => setTipo(c.k)}
                    className={clsx('group relative overflow-hidden rounded-xl border-2 text-left transition', sel ? 'border-brand-600 bg-brand-50 shadow-lg shadow-brand-600/15' : 'border-transparent bg-slate-50 shadow-card hover:border-brand-200')}>
                    <img src={c.img} alt="" className={clsx('h-[200px] w-full object-cover transition sm:h-[255px]', !sel && 'grayscale')} />
                    <span className={clsx('absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white', sel ? 'bg-brand-600 text-white' : 'bg-white/80')}>{sel && <Check size={22} strokeWidth={3} />}</span>
                    <span className={clsx('absolute left-8 top-[150px] flex h-[96px] w-[96px] items-center justify-center rounded-full border-4 border-white text-white sm:top-[200px] sm:h-[110px] sm:w-[110px]', sel ? 'bg-brand-600' : 'bg-slate-500')}>
                      <UserRound size={50} />
                    </span>
                    <div className="pb-5 pl-[150px] pr-5 pt-3 sm:pl-[170px]">
                      <h3 className={clsx('font-serif text-[22px] font-bold sm:text-[26px]', sel ? 'text-ink' : 'text-slate-700')}>{c.title}</h3>
                      <p className={clsx('mt-1 text-[14px] leading-snug sm:text-[16px]', sel ? 'text-ink/75' : 'text-slate-500')}>{c.text}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="mx-auto mt-5 flex w-fit max-w-full items-center gap-3 rounded-full bg-brand-50 px-6 py-2.5 text-[15px] text-ink sm:text-[17px]">
              <CheckCircle2 size={26} className="shrink-0 fill-brand-600 text-white" />
              Usted ha seleccionado la opción: <b className="uppercase text-ink">{tipo === 'radiologo' ? 'Médico Radiólogo' : 'Médico Referidor'}</b>
            </div>
            <div className="mt-4 border-t border-[#e3eaf6] pt-4">
              <button onClick={() => setStep(1)} className="mx-auto flex w-full max-w-[370px] items-center justify-center gap-3 rounded-full bg-brand-600 py-3.5 text-[19px] font-medium text-white hover:bg-brand-700">
                Siguiente <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* ---------------- Paso 2 ---------------- */}
        {step === 1 && (
          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_465px]">
            <div className="space-y-4">
              <section className="rounded-xl border border-[#e6edf8] bg-white">
                <BlockHead icon={User} title="Información personal y profesional" sub="Complete sus datos tal como aparecen en sus documentos oficiales." />
                <div className="p-4">
                  <div className="grid items-center gap-3 rounded-xl border-2 border-brand-500 p-3 md:grid-cols-[auto_1fr_auto_1fr]">
                    <span className="hidden h-11 w-11 items-center justify-center rounded-lg bg-brand-600 text-white md:flex"><Contact size={24} /></span>
                    <Field label="No. Exequátur" req error={errors.exequatur}>
                      <input className="input" value={f.exequatur} onChange={(e) => set('exequatur', e.target.value.replace(/\D/g, ''))} placeholder="Ej. 12345" inputMode="numeric" />
                    </Field>
                    <div>
                      <span className="label">Status</span>
                      {found ? <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1.5 text-[14px] text-emerald-700"><CheckCircle2 size={16} className="fill-emerald-500 text-white" /> Activo</span>
                        : <span className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-[14px] text-slate-500">—</span>}
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-[12px] text-ink/80 md:border-l md:border-[#dbe5f5]">
                      <Info size={20} className="shrink-0 fill-brand-600 text-white" /> Ingrese su número de exequátur para autocompletar sus datos profesionales.
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-[170px_1fr]">
                    <div>
                      <div className="relative h-[165px] w-[165px] overflow-hidden rounded-xl bg-brand-50">
                        {photo ? <img src={photo} alt="Fotografía" className="h-full w-full object-cover" /> : <UserRound size={90} className="absolute inset-0 m-auto text-brand-200" />}
                        <button type="button" onClick={() => fotoRef.current?.click()} className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white"><Camera size={18} /></button>
                        <input ref={fotoRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setFoto(URL.createObjectURL(file)) }} />
                      </div>
                      <p className="mt-2 text-[13px] font-semibold text-ink">Fotografía (obligatoria)</p>
                      <p className="text-[12px] leading-snug text-slate-500">Formato: PNG, JPEG, JPG<br />Tamaño: 2x2 pulgadas<br />Máx. 5 MB</p>
                      {errors.foto && <p className="text-[11px] text-red-600">{errors.foto}</p>}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[0.6fr_1fr_1fr]">
                      <Field label="Tratamiento" req><input className="input-ro" readOnly value={found?.trat ?? ''} placeholder="Dr." /></Field>
                      <Field label="Nombres" req><input className="input-ro" readOnly value={found?.nombres ?? ''} placeholder="Autocompletado" /></Field>
                      <Field label="Apellidos" req><input className="input-ro" readOnly value={found?.apellidos ?? ''} placeholder="Autocompletado" /></Field>
                      <Field label="Cédula" req className="lg:col-span-2"><input className="input-ro" readOnly value={found?.cedula ?? ''} placeholder="000-0000000-0" /></Field>
                      <Field label="Sexo" req><NativeSelect value={found?.sexo ?? ''} onChange={() => {}} options={['Masculino', 'Femenino']} placeholder="—" disabled /></Field>
                      <Field label="Tel. Residencia" req error={errors.telRes} className="lg:col-span-1"><IconInput icon={Phone} value={f.telRes} onChange={(e) => set('telRes', e.target.value)} placeholder="809-555-0101" /></Field>
                      <Field label="Tel. Personal (WhatsApp)" req error={errors.telWa} className="lg:col-span-2"><span className="relative flex items-center"><WhatsAppIcon className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-emerald-500" /><input className="input pl-10" value={f.telWa} onChange={(e) => set('telWa', e.target.value)} placeholder="809-555-0202" /></span></Field>
                      <Field label="Correo electrónico" req error={errors.email} className="lg:col-span-1"><IconInput icon={Mail} type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="correo@email.com" /></Field>
                      <Field label="Confirmar correo electrónico" req error={errors.email2} className="lg:col-span-2"><IconInput icon={Mail} type="email" value={f.email2} onChange={(e) => set('email2', e.target.value)} placeholder="correo@email.com" /></Field>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-[#e6edf8] bg-white">
                <BlockHead icon={MapPin} title="Dirección actual" />
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  <Field label="Provincia" req error={errors.provincia}><NativeSelect value={f.provincia} onChange={(v) => setF((p) => ({ ...p, provincia: v, municipio: '', sector: '' }))} options={PROVINCIAS} placeholder="Seleccione" /></Field>
                  <Field label="Municipio" req error={errors.municipio}><NativeSelect value={f.municipio} onChange={(v) => setF((p) => ({ ...p, municipio: v, sector: '' }))} options={f.provincia ? municipiosDe(f.provincia) : []} placeholder="Seleccione" /></Field>
                  <Field label="Sector" req error={errors.sector}><NativeSelect value={f.sector} onChange={(v) => set('sector', v)} options={f.municipio ? sectoresDe(f.municipio) : []} placeholder="Seleccione" /></Field>
                  <Field label="Calle" req error={errors.calle}><input className="input" value={f.calle} onChange={(e) => set('calle', e.target.value)} placeholder="Calle Principal" /></Field>
                  <Field label="Casa / Apto. #" req error={errors.casa}><input className="input" value={f.casa} onChange={(e) => set('casa', e.target.value)} placeholder="Apto 4B" /></Field>
                  <Field label="Nombre Residencial / Edificio"><input className="input" value={f.residencial} onChange={(e) => set('residencial', e.target.value)} placeholder="Torre Médica (Si aplica)" /></Field>
                </div>
              </section>
            </div>

            <section className="rounded-xl border border-[#e6edf8] bg-white xl:row-span-1">
              <BlockHead icon={FileText} title="Documentos requeridos" sub={<>Cargue los documentos en formato PDF, PNG o JPG.<br />Tamaño máximo por archivo: 5 MB.</>} />
              <div className="divide-y divide-[#eef2f8]">
                {DOCS.map((d) => (
                  <div key={d.key} className="flex items-center gap-3 px-3 py-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><d.icon size={24} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-ink">{d.title} {d.req ? <span className="req">*</span> : <span className="font-normal text-slate-500">(Opcional)</span>}</div>
                      <div className="text-[12px] text-slate-500">{d.sub[tipo]}</div>
                      {docs[d.key] && <div className="truncate text-[11.5px] text-emerald-600">✓ {docs[d.key]}</div>}
                      {errors['doc-' + d.key] && !docs[d.key] && <div className="text-[11px] text-red-600">{errors['doc-' + d.key]}</div>}
                    </div>
                    <label className={clsx('flex w-[150px] shrink-0 cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-3 py-2.5 text-[12.5px] transition',
                      docs[d.key] ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-brand-200 text-brand-700 hover:bg-brand-50')}>
                      {docs[d.key] ? <CheckCircle2 size={20} /> : <Upload size={20} />}
                      <span className="leading-tight">{docs[d.key] ? 'Cambiar archivo' : <>Seleccionar<br />archivo</>}</span>
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setDocs((p) => ({ ...p, [d.key]: file.name })) }} />
                    </label>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-4 xl:col-span-2 xl:grid-cols-[1fr_1fr]">
              <section className="rounded-xl border border-[#e6edf8] bg-white">
                <BlockHead icon={Stethoscope} title={tipo === 'radiologo' ? 'Especialidades diagnósticas' : 'Especialidad médica'} sub={tipo === 'radiologo' ? 'Seleccione las modalidades en las que realiza interpretación de estudios.' : 'Seleccione su especialidad principal o las especialidades que correspondan.'} />
                <div className={clsx('p-3', tipo === 'radiologo' ? 'flex flex-wrap gap-2' : 'grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5')}>
                  {especialidades.map((e) => {
                    const on = esp.includes(e)
                    return (
                      <button key={e} type="button" onClick={() => toggle(esp, e, setEsp)}
                        className={clsx('flex items-center gap-2 rounded-lg border text-left transition', tipo === 'radiologo' ? 'px-4 py-2 text-[14px]' : 'px-2 py-1.5 text-[11.5px]',
                          on ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#dbe5f5] bg-white text-ink hover:border-brand-300')}>
                        <span className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded border', on ? 'border-white bg-white text-brand-600' : 'border-slate-300')}>{on && <Check size={11} strokeWidth={3} />}</span>
                        {e}
                      </button>
                    )
                  })}
                  {tipo === 'referidor' && (
                    <input className="input col-span-2 py-1.5 text-[11.5px] sm:col-span-3 lg:col-span-5" placeholder="Otras (especifique) — Especificar especialidad" value={f.otraEsp} onChange={(e) => set('otraEsp', e.target.value)} />
                  )}
                </div>
                {errors.esp && <p className="px-4 pb-2 text-[11px] text-red-600">{errors.esp}</p>}
              </section>
              <section className="rounded-xl border border-[#e6edf8] bg-white">
                <BlockHead icon={MapIcon} title="Región de interés" sub={tipo === 'radiologo' ? 'Seleccione la(s) región(es) donde desea recibir estudios.' : 'Seleccione la(s) región(es) donde desea recibir pacientes.'} />
                <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
                  {REGIONES.map((r) => {
                    const on = reg.includes(r)
                    return (
                      <button key={r} type="button" onClick={() => toggle(reg, r, setReg)}
                        className={clsx('flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] transition', on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-[#dbe5f5] text-ink hover:border-brand-300')}>
                        <span className={clsx('flex h-4 w-4 items-center justify-center rounded border', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300')}>{on && <Check size={11} strokeWidth={3} />}</span>
                        {r}
                      </button>
                    )
                  })}
                </div>
                {errors.reg && <p className="px-4 pb-2 text-[11px] text-red-600">{errors.reg}</p>}
              </section>
            </div>
            {Object.keys(errors).length > 0 && <p className="text-[13px] text-red-600 xl:col-span-2">Por favor complete los campos obligatorios marcados.</p>}
          </div>
        )}

        {/* ---------------- Paso 3 ---------------- */}
        {step === 2 && found && (
          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_485px]">
            <div className="space-y-4">
              <section className="rounded-xl border border-[#e6edf8] bg-white">
                <BlockHead icon={User} title="Resumen de información" sub="Revise que todos sus datos sean correctos. Si necesita modificar algún dato, puede regresar al paso anterior." />
                <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr]">
                  {photo && <img src={photo} alt="" className="h-[200px] w-[180px] rounded-xl object-cover" />}
                  <div className="rounded-xl bg-[#f4f8fe]">
                    <div className="flex flex-wrap items-center gap-6 rounded-t-xl bg-[#eaf1fc] px-5 py-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white"><Contact size={22} /></span>
                      <span><span className="block text-[14px] text-ink">No. Exequátur</span><b className="text-[19px] text-ink">{f.exequatur}</b></span>
                      <span className="ml-auto border-l border-[#d3dff2] pl-6"><span className="block text-[14px] text-ink">Status</span><span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1 text-[14px] text-emerald-700"><CheckCircle2 size={15} className="fill-emerald-500 text-white" /> Activo</span></span>
                    </div>
                    <div className="grid gap-3 px-5 py-3 sm:grid-cols-2">
                      <div className="sm:col-span-2"><div className="text-[13.5px] text-ink">Nombre completo</div><div className="text-[18px] font-semibold text-ink">{fullName}</div></div>
                      <div><div className="text-[13.5px] text-ink">Cédula</div><div className="text-[17px] text-slate-500">{found.cedula}</div></div>
                      <div><div className="text-[13.5px] text-ink">Sexo</div><div className="text-[17px] text-slate-500">{found.sexo}</div></div>
                    </div>
                  </div>
                </div>
              </section>
              <section className="rounded-xl border border-[#e6edf8] bg-white">
                <BlockHead icon={Phone} title="Contacto" />
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  <div><div className="text-[13.5px] text-ink">Tel. Residencia</div><div className="mt-1 flex items-center gap-2 text-[16px] text-slate-500"><Phone size={18} className="text-brand-600" />{f.telRes}</div></div>
                  <div><div className="text-[13.5px] text-ink">Tel. Personal (WhatsApp)</div><div className="mt-1 flex items-center gap-2 text-[16px] text-slate-500"><WhatsAppIcon className="h-5 w-5 text-emerald-500" />{f.telWa}</div></div>
                  <div><div className="text-[13.5px] text-ink">Correo electrónico</div><div className="mt-1 flex items-center gap-2 truncate text-[16px] text-slate-500"><Mail size={18} className="shrink-0 text-brand-600" />{f.email}</div></div>
                </div>
              </section>
              <section className="rounded-xl border border-[#e6edf8] bg-white">
                <BlockHead icon={MapPin} title="Dirección actual" />
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  {[['Provincia', f.provincia], ['Municipio', f.municipio], ['Sector', f.sector], ['Calle', f.calle], ['Casa / Apto. #', f.casa], ['Nombre Residencial / Edificio', f.residencial || '—']].map(([l, v]) => (
                    <div key={l}><div className="text-[13.5px] text-ink">{l}</div><div className="text-[16px] text-slate-500">{v}</div></div>
                  ))}
                </div>
              </section>
              <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-xl border border-[#e6edf8] bg-white">
                  <BlockHead icon={Stethoscope} title={tipo === 'radiologo' ? 'Especialidades diagnósticas' : 'Especialidad médica'} />
                  <div className="flex flex-wrap gap-2 p-4">{esp.map((e) => <span key={e} className="rounded-md bg-brand-600 px-3 py-1.5 text-[13px] text-white">{e}</span>)}</div>
                </section>
                <section className="rounded-xl border border-[#e6edf8] bg-white">
                  <BlockHead icon={MapIcon} title="Región de interés" />
                  <div className="grid grid-cols-4 gap-2 p-4">{REGIONES.map((r) => <span key={r} className={clsx('rounded-md px-2 py-1.5 text-center text-[12.5px]', reg.includes(r) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}>{r}</span>)}</div>
                </section>
              </div>
            </div>
            <div className="space-y-4">
              <section className="rounded-xl border border-[#e6edf8] bg-white">
                <BlockHead icon={FileText} title="Documentos cargados" sub="Verifique que todos los documentos requeridos estén cargados correctamente." />
                <div className="space-y-2 p-3">
                  {DOCS.filter((d) => docs[d.key]).map((d) => (
                    <div key={d.key} className="flex items-center gap-3 rounded-lg border border-[#eef2f8] p-2.5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><d.icon size={22} /></span>
                      <div className="min-w-0 flex-1"><div className="text-[13.5px] font-semibold text-ink">{d.title}</div><div className="truncate text-[12.5px] text-slate-500">{docs[d.key]}</div></div>
                      <span className="flex items-center gap-1.5 text-[13.5px] text-emerald-600"><CheckCircle2 size={17} className="fill-emerald-500 text-white" /> Cargado</span>
                      <span className="flex h-9 w-10 items-center justify-center rounded-lg border border-[#dbe5f5] text-brand-600"><Eye size={18} /></span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-xl border border-[#e6edf8] bg-white">
                <BlockHead icon={ClipboardList} title="Confirmación y envío" />
                <div className="space-y-3 p-4">
                  {['Declaro que la información proporcionada es verídica y autorizo su verificación por parte del Ministerio de Salud Pública, el MESCyT y las entidades correspondientes.',
                    'Acepto formar parte de la Red Nacional de Salud Dominicana y recibir comunicaciones relacionadas con el sistema.'].map((t, i) => (
                    <label key={i} className="flex cursor-pointer items-start gap-3 text-[12.5px] leading-snug text-ink/80">
                      <input type="checkbox" checked={acepta[i]} onChange={() => setAcepta((a) => a.map((x, j) => (j === i ? !x : x)))} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600" />
                      {t}
                    </label>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {step > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button onClick={() => { setErrors({}); setStep(step - 1) }} className="flex items-center gap-3 rounded-full border-2 border-brand-600 px-7 py-2.5 text-[17px] font-medium text-brand-700 hover:bg-brand-50">
              <ArrowLeft size={20} /> Anterior
            </button>
            {step === 1 ? (
              <button onClick={() => { if (validate()) setStep(2) }} className="flex items-center gap-3 rounded-full bg-brand-600 px-12 py-3 text-[17px] font-medium text-white hover:bg-brand-700">
                Siguiente <ArrowRight size={20} />
              </button>
            ) : (
              <button disabled={!acepta.every(Boolean)} onClick={() => setStep(3)} className="flex items-center gap-3 rounded-full bg-brand-600 px-10 py-3 text-[17px] font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
                Finalizar Registro <ArrowRight size={20} />
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
