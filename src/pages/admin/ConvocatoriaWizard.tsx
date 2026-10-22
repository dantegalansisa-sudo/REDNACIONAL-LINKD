import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowLeft, ArrowRight, AtSign, Bell, Bold, Briefcase, Building2, Calendar, CalendarDays, Check, CheckCircle2,
  ChevronDown, ClipboardList, Clock, FileText, Filter, GraduationCap, Hospital, Image, Info, Italic, Link2,
  List, ListOrdered, Mail, Pencil, MapPin, Megaphone, MessageCircle, MessagesSquare, Monitor, Paperclip, Save, Search,
  Send, ShieldCheck, Smile, Star, Stethoscope, Table2, Underline, User, UserCog, Users, X, type LucideIcon,
} from 'lucide-react'
import { Checkbox, Modal, Tabs, clsx } from '../../components/ui'
import { BRAND } from '../../config/brand'
import { fetchHospitales, supabaseConfigurado, useDatos } from '../../lib/admin-data'
import { useSesion } from '../../lib/session'

/* ---------------- Opciones ---------------- */
type HospOpt = { n: string; p: string }
/** Solo para el modo demostración; en producción se listan los hospitales reales de la base */
const MOCK_HOSPITALES: HospOpt[] = [
  { n: 'Hospital Pediátrico Hugo Mendoza', p: 'Santo Domingo, DN' },
  { n: 'Hospital Dr. Marcelino Vélez', p: 'Santo Domingo Oeste' },
  { n: 'Hospital Regional Taiwán 19 de Marzo', p: 'Azua' },
  { n: 'Hospital Dr. Francisco Moscoso Puello', p: 'Santo Domingo, DN' },
  { n: 'Hospital Regional San Juan de la Maguana', p: 'San Juan' },
  { n: 'Hospital Infantil Dr. Robert Reid Cabral', p: 'Santo Domingo, DN' },
  { n: 'Hospital Dr. Ney Arias Lora', p: 'Santo Domingo Norte' },
  { n: 'Hospital Regional Antonio Musa', p: 'San Pedro de Macorís' },
]
const REGIONES = ['Todas las regiones', 'Norte (Cibao)', 'Sur', 'Este', 'Oeste', 'Metropolitana']
const TIPOS = ['Lectura remota (teleradiología)', 'Presencial', 'Híbrido (remoto/presencial)', 'Guardias / turnos']
const EXPERIENCIA = ['Sin mínimo', '1 año o más', '2 años o más', '3 años o más', '5 años o más']
const NIVELES = ['Especialista / Exequátur válido', 'Residente de último año', 'Subespecialista']
const DURACION = ['1 mes', '3 meses', '6 meses', '12 meses', 'Indefinida']
const MOD_TRABAJO = ['Remoto', 'Presencial', 'Híbrido']
const DISPONIBILIDAD = ['Inmediata', 'En 15 días', 'En 30 días']
const RECORDATORIO = ['Sin recordatorio', '1 día antes', '2 días antes', '3 días antes', '1 semana antes']
const APLICAR_A = ['Todos los médicos radiólogos', 'Solo médicos sin hospitales asignados', 'Solo médicos con un hospital asignado', 'Solo médicos con 2 o más hospitales asignados']
const DOCUMENTOS = ['Términos de referencia', 'Perfil del puesto', 'Formulario de aplicación', 'Contrato modelo']

const ESPECIALIDADES: { k: string; n: string }[] = [
  { k: 'CT', n: 'Tomografía' }, { k: 'MR', n: 'Resonancia Magnética' }, { k: 'RX', n: 'Radiografía Convencional' },
  { k: 'US', n: 'Ultrasonido' }, { k: 'MG', n: 'Mamografía' }, { k: 'IR', n: 'Intervencionismo' },
  { k: 'NM', n: 'Medicina Nuclear' }, { k: 'OT', n: 'Otras' },
]
const ESP_LARGO: Record<string, string> = { CT: 'Tomografía', MR: 'Resonancia Magnética', RX: 'Radiografía Convencional', US: 'Ultrasonido', MG: 'Mamografía', IR: 'Intervencionismo', NM: 'Medicina Nuclear' }

const REQ_DOCS = ['Copia de Exequátur', 'Cédula de identidad', 'Currículum vitae', 'Certificaciones de especialidad', 'Constancias de experiencia']
const CRITERIOS = ['Experiencia profesional', `Rating histórico en Radiólogo Nacional`, 'Disponibilidad de horario', 'Entrevista / Evaluación', 'Otros (certificaciones, formación, etc.)']
const ESTADO_ASIG = ['Todos los médicos radiólogos', 'Solo médicos sin hospitales asignados', 'Solo médicos con un hospital asignado', 'Solo médicos con 2 o más hospitales asignados']
const OTROS_CRIT = ['Solo médicos con experiencia en el tipo de estudio', 'Preferir médicos con menor carga actual', 'Requerir certificaciones adicionales', 'Incluir médicos en proceso de certificación']

/* ---------------- Estado del formulario ---------------- */
type Form = {
  titulo: string; hospital: string; servicio: string[]; descripcion: string
  numero: number; tipo: string
  aplicaA: string; regionInteres: string; regionViven: string; exclusiones: string; rating: number; experiencia: string
  inicio: string; cierre: string; documentos: string[]
  especialidades: string[]; otraEsp: string; nivel: string; estadoAsig: string[]; disponibilidadInm: string; otrosCrit: string[]
  reqDocs: string[]; otrosDocs: boolean; otrosDocsTxt: string; pesos: number[]
  duracion: string; modTrabajo: string; disponibilidad: string; infoAdicional: string; descPosicion: string
  canales: { email: boolean; whatsapp: boolean; portal: boolean }; mensaje: string | null
  recordatorio: string; msgRecordatorio: string
}

const INITIAL: Form = {
  titulo: '', hospital: '', servicio: [], descripcion: '',
  numero: 1, tipo: '',
  aplicaA: APLICAR_A[0], regionInteres: '', regionViven: '', exclusiones: '', rating: 3, experiencia: '',
  inicio: '', cierre: '', documentos: [],
  especialidades: [], otraEsp: '', nivel: NIVELES[0], estadoAsig: [ESTADO_ASIG[0]], disponibilidadInm: 'Cualquiera', otrosCrit: [],
  reqDocs: REQ_DOCS.slice(0, 3), otrosDocs: false, otrosDocsTxt: '', pesos: [30, 25, 20, 15, 10],
  duracion: '6 meses', modTrabajo: 'Remoto', disponibilidad: 'Inmediata', infoAdicional: '', descPosicion: '',
  canales: { email: true, whatsapp: true, portal: true }, mensaje: null,
  recordatorio: '1 día antes', msgRecordatorio: '',
}

const STEPS = [
  { t: 'Información general', s: 'Datos principales de la convocatoria' },
  { t: 'Requisitos y perfil', s: 'Especialidades y filtros de médicos' },
  { t: 'Condiciones y cronograma', s: 'Fechas y términos de la convocatoria' },
  { t: 'Notificaciones', s: 'Canales y mensaje' },
  { t: 'Revisión y publicación', s: 'Resumen final' },
]

const fmtDate = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '')

/* ---------------- Controles pequeños ---------------- */
function Sel({ value, options, onChange, placeholder, className, icon: Icon }: {
  value: string; options: string[]; onChange: (v: string) => void; placeholder?: string; className?: string; icon?: LucideIcon
}) {
  return (
    <label className={clsx('relative flex items-center', className)}>
      {Icon && <Icon size={16} className="pointer-events-none absolute left-3 text-slate-500" />}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={clsx('input appearance-none truncate pr-8 text-[12.5px]', Icon && 'pl-9', !value && 'text-slate-400')}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-2.5 text-ink" />
    </label>
  )
}

function Lbl({ children, req, info }: { children: ReactNode; req?: boolean; info?: boolean }) {
  return (
    <span className="label flex items-center gap-1 text-[12px]">
      {children}{req && <span className="req">*</span>}
      {info && <Info size={13} className="text-brand-600" />}
    </span>
  )
}

function Section({ icon: Icon, title, subtitle, children, className, bodyClass, action }: {
  icon: LucideIcon; title: string; subtitle?: string; children: ReactNode; className?: string; bodyClass?: string; action?: ReactNode
}) {
  return (
    <section className={clsx('min-w-0 rounded-xl border border-[#e6edf8] bg-white', className)}>
      <div className="flex items-start justify-between gap-3 rounded-t-xl bg-[#f6f9fe] px-3.5 py-2.5">
        <div className="flex items-start gap-2.5">
          <Icon size={22} className="mt-0.5 shrink-0 text-brand-600" />
          <div>
            <h4 className="text-[14.5px] font-bold leading-tight text-ink">{title}</h4>
            {subtitle && <p className="text-[11.5px] text-brand-800/75">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className={clsx('px-3.5 pb-3.5 pt-2.5', bodyClass)}>{children}</div>
    </section>
  )
}

function StarPicker({ value, onChange, size = 18 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => onChange(i)} aria-label={`${i} estrellas`}>
            <Star size={size} className={i <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} />
          </button>
        ))}
      </span>
      <span className="text-[11.5px] text-slate-500">{value.toFixed(1)} o más</span>
    </span>
  )
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-[#d7e1f2] bg-white focus-within:border-brand-500">
      <input type="number" min={1} value={value} onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className="w-full px-3 py-2 text-[13px] text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
      <div className="flex flex-col border-l border-[#d7e1f2]">
        <button type="button" className="flex-1 px-2 text-ink hover:bg-brand-50" onClick={() => onChange(value + 1)} aria-label="Aumentar"><ChevronDown size={13} className="rotate-180" /></button>
        <button type="button" className="flex-1 px-2 text-ink hover:bg-brand-50" onClick={() => onChange(Math.max(1, value - 1))} aria-label="Disminuir"><ChevronDown size={13} /></button>
      </div>
    </div>
  )
}

function Radio({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[12px] text-ink/90">
      <span onClick={onChange} className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2', checked ? 'border-brand-600' : 'border-slate-300')}>
        {checked && <span className="h-2 w-2 rounded-full bg-brand-600" />}
      </span>
      <span onClick={onChange}>{label}</span>
    </label>
  )
}

const toggleIn = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

/* ---------------- Wizard ---------------- */
export function ConvocatoriaWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <WizardContent onClose={onClose} /> : null
}

function WizardContent({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [f, setF] = useState<Form>(INITIAL)
  const [done, setDone] = useState(false)
  const [toast, setToast] = useState('')
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(onClose, 2600)
    return () => clearTimeout(t)
  }, [done, onClose])

  // En producción se ofrecen los hospitales registrados en la base (sin datos de ejemplo)
  const { datos: hospReales } = useDatos(fetchHospitales, [])
  const hospitales: HospOpt[] = useMemo(
    () => (supabaseConfigurado ? hospReales.map((h) => ({ n: h.nombre, p: h.provincia === '—' ? '' : h.provincia })) : MOCK_HOSPITALES),
    [hospReales])
  const hospitalObj = hospitales.find((h) => h.n === f.hospital)
  const autoMsg = useMemo(() => [
    'Estimado/a Dr(a).',
    '',
    `El SNS le informa sobre una nueva convocatoria para el cargo de Radiólogo en el ${f.hospital || '[Hospital / Centro]'}.`,
    '',
    `Puede aplicar a través del portal ${BRAND.domain} antes del ${fmtDate(f.cierre) || '[fecha de cierre]'}.`,
    '',
    'Gracias por su interés.',
    '',
    'SNS',
  ].join('\n'), [f.hospital, f.cierre])
  const mensaje = f.mensaje ?? autoMsg

  return (
    <Modal open onClose={onClose} className="max-w-[1000px]" closeOnBackdrop={false}>
      {/* Encabezado */}
      <div className="flex items-center gap-3 px-5 pb-3 pt-4 pr-14">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30"><Megaphone size={26} /></span>
        <div>
          <h2 className="text-[20px] font-bold leading-tight text-ink">Nueva convocatoria de radiólogos</h2>
          <p className="text-[13px] text-brand-800/80">Complete la información para publicar una nueva convocatoria de médicos radiólogos</p>
        </div>
      </div>

      {done ? (
        <div className="flex flex-col items-center px-6 pb-12 pt-8 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={48} /></span>
          <h3 className="mt-4 text-[22px] font-bold text-ink">¡Convocatoria publicada!</h3>
          <p className="mt-1 max-w-md text-[13.5px] text-slate-600">
            La convocatoria <b className="text-ink">{f.titulo || 'Nueva convocatoria de radiólogos'}</b> fue publicada y se notificó a los médicos radiólogos que cumplen con los criterios establecidos.
          </p>
          <button className="btn-primary mt-6 px-6" onClick={onClose}>Cerrar</button>
        </div>
      ) : (
        <>
          {/* Stepper */}
          <div className="mx-5 overflow-x-auto rounded-xl bg-[#f6f9fe] scroll-soft">
            <div className="grid min-w-[860px] grid-cols-5">
              {STEPS.map((s, i) => (
                <button key={s.t} type="button" onClick={() => setStep(i)}
                  className={clsx('flex items-center gap-2.5 border-b-2 px-3 py-3 text-left transition',
                    i === step ? 'border-brand-600 bg-white' : 'border-transparent hover:bg-white/60')}>
                  <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px] font-bold',
                    i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-brand-100 text-ink')}>
                    {i < step ? <Check size={18} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className={clsx('block text-[12px] font-medium', i === step ? 'text-brand-700' : 'text-ink')}>{s.t}</span>
                    <span className="block text-[10.5px] text-slate-500">{s.s}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Cuerpo */}
          <div className="px-5 py-4">
            {step === 0 && <Step1 f={f} set={set} hospitales={hospitales} />}
            {step === 1 && <Step2 f={f} set={set} />}
            {step === 2 && <Step3 f={f} set={set} hospitalObj={hospitalObj} hospitales={hospitales} />}
            {step === 3 && <Step4 f={f} set={set} mensaje={mensaje} />}
            {step === 4 && <Step5 f={f} hospitalObj={hospitalObj} goEdit={() => setStep(0)} />}
          </div>

          {/* Pie */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eef2f8] px-5 py-3.5">
            <button className="btn border border-slate-300 bg-white px-6 text-ink hover:bg-slate-50" onClick={onClose}>Cancelar</button>
            <div className="flex flex-wrap items-center gap-2">
              {step > 0 && <button className="btn-outline px-5" onClick={() => setStep(step - 1)}><ArrowLeft size={17} /> Anterior</button>}
              <button className="btn-outline px-5" onClick={() => setToast('Borrador guardado correctamente')}><Save size={17} /> Guardar como borrador</button>
              {step < 4
                ? <button className="btn-primary px-7" onClick={() => setStep(step + 1)}>Siguiente <ArrowRight size={17} /></button>
                : <button className="btn-primary px-7" onClick={() => setDone(true)}><Send size={16} /> Publicar convocatoria</button>}
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className="pointer-events-none absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-lg bg-navy-900 px-4 py-2 text-[12.5px] font-medium text-white shadow-lg">
          <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-400" />{toast}</span>
        </div>
      )}
    </Modal>
  )
}

type StepProps = { f: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void }

/* ---------------- Paso 1 ---------------- */
function Step1({ f, set, hospitales }: StepProps & { hospitales: HospOpt[] }) {
  const [doc, setDoc] = useState('')
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
      <div className="space-y-4">
        <Section icon={Building2} title="Información general">
          <div className="space-y-3">
            <div>
              <Lbl req>Título de la convocatoria</Lbl>
              <input className="input" maxLength={150} value={f.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Ej. Radiólogos para Hospital Regional..." />
              <div className="mt-0.5 text-right text-[11px] text-slate-500">{f.titulo.length}/150</div>
            </div>
            <div>
              <Lbl req>Hospital / Centro de salud</Lbl>
              <Sel icon={Search} value={f.hospital} onChange={(v) => set('hospital', v)} placeholder="Seleccionar hospital / centro" options={hospitales.map((h) => h.n)} />
            </div>
            <div>
              <Lbl req>Modalidad de servicio</Lbl>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {['Teleradiología (remoto)', 'Presencial', 'Híbrido (remoto/presencial)'].map((m) => (
                  <Checkbox key={m} label={m} checked={f.servicio.includes(m)} onChange={() => set('servicio', toggleIn(f.servicio, m))} />
                ))}
              </div>
            </div>
            <div>
              <Lbl req>Descripción de la convocatoria</Lbl>
              <textarea className="input h-[72px] resize-none" maxLength={1000} value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)}
                placeholder="Detalle los objetivos, alcance, responsabilidades y cualquier información relevante..." />
              <div className="mt-0.5 text-right text-[11px] text-slate-500">{f.descripcion.length}/1000</div>
            </div>
          </div>
        </Section>
        <Section icon={Building2} title="Cantidad de posiciones">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><Lbl req>Número de radiólogos requeridos</Lbl><NumberInput value={f.numero} onChange={(v) => set('numero', v)} /></div>
            <div><Lbl req>Tipo de contratación / modalidad</Lbl><Sel value={f.tipo} onChange={(v) => set('tipo', v)} placeholder="Seleccionar modalidad" options={TIPOS} /></div>
          </div>
        </Section>
      </div>

      <div className="space-y-4">
        <Section icon={Filter} title="Filtros de médicos" subtitle="Defina a qué médicos se enviará la convocatoria">
          <div className="space-y-3">
            <div>
              <Lbl req info>Aplicar a</Lbl>
              <div className="space-y-1.5">
                {APLICAR_A.map((a) => <Radio key={a} label={a} checked={f.aplicaA === a} onChange={() => set('aplicaA', a)} />)}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Lbl req>Región de interés</Lbl><Sel value={f.regionInteres} onChange={(v) => set('regionInteres', v)} placeholder="Seleccionar región(es)" options={REGIONES} /></div>
              <div><Lbl info>Región donde viven</Lbl><Sel value={f.regionViven} onChange={(v) => set('regionViven', v)} placeholder="Seleccionar región(es)" options={REGIONES} /></div>
            </div>
            <div>
              <Lbl info>Exclusiones (opcional)</Lbl>
              <Sel value={f.exclusiones} onChange={(v) => set('exclusiones', v)} placeholder="Excluir médicos con hospital(es) específico(s)" options={hospitales.map((h) => h.n)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Lbl>Rating mínimo (opcional)</Lbl><div className="py-1.5"><StarPicker value={f.rating} onChange={(v) => set('rating', v)} /></div></div>
              <div><Lbl>Experiencia mínima (opcional)</Lbl><Sel value={f.experiencia} onChange={(v) => set('experiencia', v)} placeholder="Seleccionar experiencia mínima" options={EXPERIENCIA} /></div>
            </div>
          </div>
        </Section>
        <Section icon={CalendarDays} title="Cronograma">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><Lbl req>Fecha de inicio</Lbl><input type="date" className="input" value={f.inicio} onChange={(e) => set('inicio', e.target.value)} /></div>
            <div><Lbl req>Fecha de cierre</Lbl><input type="date" className="input" value={f.cierre} min={f.inicio} onChange={(e) => set('cierre', e.target.value)} /></div>
          </div>
        </Section>
        <Section icon={FileText} title="Documentos y requisitos (opcional)">
          <Lbl>Documento adicional</Lbl>
          <div className="flex gap-2">
            <Sel className="flex-1" value={doc} onChange={setDoc} placeholder="Seleccionar documento" options={DOCUMENTOS} />
            <button type="button" className="btn-outline px-4" onClick={() => { if (doc && !f.documentos.includes(doc)) set('documentos', [...f.documentos, doc]); setDoc('') }}>Agregar</button>
          </div>
          <p className="mt-1 text-[10.5px] text-slate-500">Formatos permitidos: PDF, DOC, DOCX (Máx. 10 MB)</p>
          {f.documentos.length > 0 && (
            <ul className="mt-2 space-y-1">
              {f.documentos.map((d) => (
                <li key={d} className="flex items-center justify-between rounded-md bg-brand-50 px-2 py-1 text-[11.5px] text-brand-800">
                  <span className="flex items-center gap-1.5"><Paperclip size={13} />{d}</span>
                  <button type="button" onClick={() => set('documentos', f.documentos.filter((x) => x !== d))} aria-label="Quitar"><X size={13} /></button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  )
}

/* ---------------- Paso 2 ---------------- */
function Step2({ f, set }: StepProps) {
  const total = f.pesos.reduce((a, b) => a + b, 0)
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.45fr_1fr]">
      <div className="space-y-4">
        <Section icon={Stethoscope} title="Especialidades y perfil profesional">
          <Lbl req>Especialidades requeridas</Lbl>
          <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-[#e6edf8] sm:grid-cols-3">
            {ESPECIALIDADES.map((e) => {
              const on = f.especialidades.includes(e.k)
              const isOther = e.k === 'OT'
              return (
                <div key={e.k} className={clsx('flex items-center gap-2.5 border-b border-r border-[#e6edf8] px-3 py-2', on && 'bg-brand-50', isOther && 'sm:col-span-2')}>
                  <Checkbox checked={on} onChange={() => set('especialidades', toggleIn(f.especialidades, e.k))} />
                  <button type="button" className="text-left leading-tight" onClick={() => set('especialidades', toggleIn(f.especialidades, e.k))}>
                    <span className="block text-[12px] font-bold text-ink">{e.k}</span>
                    <span className="block text-[11px] text-slate-500">{e.n}</span>
                  </button>
                  {isOther && (
                    <input className="input ml-2 flex-1 py-1.5 text-[11.5px]" value={f.otraEsp} onChange={(ev) => set('otraEsp', ev.target.value)} placeholder="Especifique otra especialidad..." />
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><Lbl req>Número de radiólogos requeridos</Lbl><NumberInput value={f.numero} onChange={(v) => set('numero', v)} /></div>
            <div><Lbl req>Tipo de contratación / modalidad</Lbl><Sel value={f.tipo} onChange={(v) => set('tipo', v)} placeholder="Seleccionar modalidad" options={TIPOS} /></div>
            <div><Lbl>Nivel profesional mínimo</Lbl><Sel value={f.nivel} onChange={(v) => set('nivel', v)} options={NIVELES} /></div>
            <div><Lbl>Años de experiencia mínima (opcional)</Lbl><Sel value={f.experiencia} onChange={(v) => set('experiencia', v)} placeholder="Seleccionar" options={EXPERIENCIA} /></div>
          </div>
        </Section>

        <Section icon={Filter} title="Filtros de médicos" subtitle="Defina el perfil de los médicos que podrán aplicar a esta convocatoria">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.15fr]">
            <div>
              <Lbl>Estado actual de asignación</Lbl>
              <div className="space-y-1.5">
                {ESTADO_ASIG.map((a) => <div key={a}><Checkbox label={a} checked={f.estadoAsig.includes(a)} onChange={() => set('estadoAsig', toggleIn(f.estadoAsig, a))} className="!text-[11.5px]" /></div>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-3">
              <div><Lbl>Región donde vive</Lbl><Sel value={f.regionViven || REGIONES[0]} onChange={(v) => set('regionViven', v)} options={REGIONES} /></div>
              <div><Lbl>Región de interés</Lbl><Sel value={f.regionInteres || REGIONES[0]} onChange={(v) => set('regionInteres', v)} options={REGIONES} /></div>
              <div><span className="label text-[11.5px]">Rating mínimo (opcional)</span><div className="py-1.5"><StarPicker size={15} value={f.rating} onChange={(v) => set('rating', v)} /></div></div>
              <div><span className="label text-[11.5px]">Disponibilidad inmediata (opcional)</span><Sel value={f.disponibilidadInm} onChange={(v) => set('disponibilidadInm', v)} options={['Cualquiera', 'Sí', 'No']} /></div>
            </div>
          </div>
          <div className="mt-3">
            <Lbl>Otros criterios (opcional)</Lbl>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {OTROS_CRIT.map((a) => <Checkbox key={a} label={a} checked={f.otrosCrit.includes(a)} onChange={() => set('otrosCrit', toggleIn(f.otrosCrit, a))} className="!text-[11.5px]" />)}
            </div>
          </div>
        </Section>
      </div>

      <div className="space-y-4">
        <Section icon={FileText} title="Requisitos y documentos (opcional)" subtitle="Seleccione los documentos requeridos para aplicar">
          <div className="space-y-2.5">
            {REQ_DOCS.map((d) => <div key={d}><Checkbox label={d} checked={f.reqDocs.includes(d)} onChange={() => set('reqDocs', toggleIn(f.reqDocs, d))} /></div>)}
            <div className="flex items-center gap-3">
              <Checkbox label="Otros documentos" checked={f.otrosDocs} onChange={(v) => set('otrosDocs', v)} className="shrink-0" />
              <input className="input py-1.5 text-[12px]" value={f.otrosDocsTxt} onChange={(e) => set('otrosDocsTxt', e.target.value)} placeholder="Especifique..." />
            </div>
          </div>
        </Section>
        <Section icon={ClipboardList} title="Criterios de evaluación (opcional)" subtitle="Defina los criterios que se utilizarán para evaluar las aplicaciones">
          <div className="space-y-1.5">
            {CRITERIOS.map((c, i) => (
              <div key={c} className="flex items-center gap-2 rounded-lg border border-[#eef2f8] pl-3 text-[12px] text-ink/90">
                <span className="flex-1">{c}</span>
                <input type="number" min={0} max={100} value={f.pesos[i]}
                  onChange={(e) => set('pesos', f.pesos.map((p, k) => (k === i ? Math.max(0, Math.min(100, Number(e.target.value) || 0)) : p)))}
                  className="w-14 border-l border-[#eef2f8] bg-[#f6f9fe] px-2 py-1.5 text-[12px] text-ink outline-none" />
                <span className="pr-3 text-slate-500">%</span>
              </div>
            ))}
            <div className={clsx('flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-semibold', total === 100 ? 'bg-brand-50 text-ink' : 'bg-red-50 text-red-600')}>
              <span>Total</span><span>{total} %</span>
            </div>
            {total !== 100 && <p className="text-[11px] text-red-500">La suma de los criterios debe ser 100%.</p>}
          </div>
        </Section>
      </div>
    </div>
  )
}

/* ---------------- Paso 3 ---------------- */
function Step3({ f, set, hospitalObj, hospitales }: StepProps & { hospitalObj?: HospOpt; hospitales: HospOpt[] }) {
  const [changing, setChanging] = useState(false)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Section icon={CalendarDays} title="Fechas de la convocatoria" subtitle="Defina el período de publicación y recepción de aplicaciones">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Lbl req>Fecha de inicio</Lbl><input type="date" className="input" value={f.inicio} onChange={(e) => set('inicio', e.target.value)} /></div>
              <div><Lbl req>Fecha de cierre</Lbl><input type="date" className="input" value={f.cierre} min={f.inicio} onChange={(e) => set('cierre', e.target.value)} /></div>
            </div>
          </Section>
          <Section icon={Clock} title="Condiciones de la convocatoria" subtitle="Establezca las condiciones principales">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Lbl req>Tipo de contratación</Lbl><Sel value={f.tipo} onChange={(v) => set('tipo', v)} placeholder="Seleccionar" options={TIPOS} /></div>
              <div><Lbl req>Duración inicial</Lbl><Sel value={f.duracion} onChange={(v) => set('duracion', v)} options={DURACION} /></div>
              <div><Lbl>Modalidad de trabajo</Lbl><Sel value={f.modTrabajo} onChange={(v) => set('modTrabajo', v)} options={MOD_TRABAJO} /></div>
              <div><Lbl req>Disponibilidad requerida</Lbl><Sel value={f.disponibilidad} onChange={(v) => set('disponibilidad', v)} options={DISPONIBILIDAD} /></div>
            </div>
          </Section>
        </div>
        <div className="space-y-4">
          <Section icon={Hospital} title="Hospital / Centro de salud" subtitle="Hospital o centro donde se requiere el médico">
            {changing || !hospitalObj ? (
              <Sel value={f.hospital} onChange={(v) => { set('hospital', v); setChanging(false) }} placeholder="Seleccionar hospital / centro" options={hospitales.map((h) => h.n)} icon={Search} />
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-[#f6f9fe] p-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-100 bg-white text-brand-600"><Hospital size={22} /></span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-[12.5px] font-semibold text-ink">{hospitalObj.n}</div>
                  {hospitalObj.p && <div className="text-[11.5px] text-slate-500">{hospitalObj.p}</div>}
                </div>
                <button type="button" className="btn-outline px-3 py-1.5" onClick={() => setChanging(true)}>Cambiar</button>
              </div>
            )}
          </Section>
          <Section icon={FileText} title="Información adicional (opcional)" subtitle="Condiciones o aclaraciones adicionales">
            <textarea className="input h-[110px] resize-none" maxLength={500} value={f.infoAdicional} onChange={(e) => set('infoAdicional', e.target.value)}
              placeholder="Información adicional, condiciones especiales, contacto, etc..." />
            <div className="mt-0.5 text-right text-[11px] text-slate-500">{f.infoAdicional.length}/500</div>
          </Section>
        </div>
      </div>
      <Section icon={FileText} title="Descripción de la posición" subtitle="Detalle las responsabilidades, alcance del trabajo y condiciones relevantes">
        <textarea className="input h-[100px] resize-none" maxLength={1000} value={f.descPosicion} onChange={(e) => set('descPosicion', e.target.value)}
          placeholder="Describa las responsabilidades, tipo de estudios, volumen estimado, horario, condiciones, etc..." />
        <div className="mt-0.5 text-right text-[11px] text-slate-500">{f.descPosicion.length}/1000</div>
      </Section>
    </div>
  )
}

/* ---------------- Paso 4 ---------------- */
function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  const valid = terms.filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!valid.length) return <>{text}</>
  const re = new RegExp(`(${valid.join('|')})`, 'g')
  return <>{text.split(re).map((p, i) => (valid.some((v) => new RegExp(`^${v}$`).test(p)) ? <b key={i} className="font-semibold text-ink">{p}</b> : <span key={i}>{p}</span>))}</>
}

function Step4({ f, set, mensaje }: StepProps & { mensaje: string }) {
  const [prev, setPrev] = useState(0)
  const terms = ['Radiólogo', f.hospital, BRAND.domain, fmtDate(f.cierre), 'SNS']
  const paragraphs = mensaje.split(/\n\s*\n/)
  const canales: { k: keyof Form['canales']; icon: LucideIcon; t: string; s: string }[] = [
    { k: 'email', icon: Mail, t: 'Correo Electrónico', s: 'Enviar notificación por email' },
    { k: 'whatsapp', icon: MessageCircle, t: 'WhatsApp', s: 'Enviar notificación por WhatsApp' },
    { k: 'portal', icon: Bell, t: 'Notificación en el Portal', s: 'Mensaje en su panel' },
  ]
  const tools: LucideIcon[] = [Bold, Italic, Underline, List, ListOrdered, Link2, AtSign, Smile, Image, Table2]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Section icon={Bell} title="Canales de notificación" subtitle="Seleccione cómo se notificará a los médicos seleccionados">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {canales.map(({ k, icon: Icon, t, s }) => (
                <button key={k} type="button" onClick={() => set('canales', { ...f.canales, [k]: !f.canales[k] })}
                  className={clsx('rounded-lg border p-2.5 text-left transition', f.canales[k] ? 'border-brand-200 bg-brand-50/40' : 'border-[#e6edf8]')}>
                  <span className="flex items-center gap-2">
                    <Checkbox checked={f.canales[k]} />
                    <Icon size={17} className="text-brand-600" />
                    <span className="text-[12px] font-medium text-ink">{t}</span>
                  </span>
                  <span className="mt-1 block pl-[25px] text-[10.5px] text-slate-500">{s}</span>
                </button>
              ))}
            </div>
          </Section>
          <Section icon={MessagesSquare} title="Mensaje de la convocatoria" subtitle="Personalice el mensaje que recibirán los médicos">
            <div className="overflow-hidden rounded-lg border border-[#d7e1f2]">
              <div className="flex flex-wrap items-center gap-1 border-b border-[#e6edf8] bg-[#f6f9fe] px-2 py-1.5">
                {tools.map((T, i) => (
                  <button key={i} type="button" className={clsx('flex h-7 w-7 items-center justify-center rounded border border-[#e6edf8] bg-white text-ink hover:bg-brand-50', (i === 3 || i === 5 || i === 8) && 'ml-2')}>
                    <T size={14} />
                  </button>
                ))}
              </div>
              <textarea value={mensaje} onChange={(e) => set('mensaje', e.target.value)}
                className="h-[190px] w-full resize-none px-3.5 py-3 text-[13.5px] leading-relaxed text-ink outline-none" />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              {f.mensaje !== null ? <button type="button" className="link-more" onClick={() => set('mensaje', null)}>Restablecer mensaje sugerido</button> : <span />}
              <span>Caracteres: {mensaje.length}</span>
            </div>
          </Section>
        </div>

        <Section icon={Send} title="Vista previa de notificación" bodyClass="pt-0">
          <Tabs className="mb-3" active={prev} onChange={setPrev} tabs={[{ label: 'Email', icon: Mail }, { label: 'WhatsApp', icon: MessageCircle }, { label: 'Portal', icon: Monitor }]} />
          {prev === 0 && (
            <div className="overflow-hidden rounded-lg border border-[#e6edf8] shadow-sm">
              <img src="/img/crops/sns-email-header.webp" alt="Servicio Nacional de Salud" className="h-[62px] w-full object-cover object-left" />
              <div className="space-y-3 p-4 text-[12.5px] leading-relaxed text-ink/90">
                {paragraphs.map((p, i) => <p key={i} className={clsx('whitespace-pre-line', i === 0 && 'font-semibold text-ink')}><Highlighted text={p} terms={terms} /></p>)}
              </div>
            </div>
          )}
          {prev === 1 && (
            <div className="rounded-lg bg-[#e7ded3] p-3">
              <div className="mb-2 flex items-center gap-2 rounded-md bg-[#075e54] px-3 py-2 text-white">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#075e54]">SNS</span>
                <span className="text-[12px] font-semibold">SNS Convocatorias</span>
              </div>
              <div className="ml-auto max-w-[92%] rounded-lg rounded-tr-none bg-[#dcf8c6] p-3 text-[12px] leading-relaxed text-[#111] shadow-sm">
                {paragraphs.map((p, i) => <p key={i} className="mb-2 whitespace-pre-line last:mb-0"><Highlighted text={p} terms={terms} /></p>)}
                <div className="mt-1 text-right text-[10px] text-slate-500">10:24 a. m. ✓✓</div>
              </div>
            </div>
          )}
          {prev === 2 && (
            <div className="rounded-lg border border-[#e6edf8] p-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Megaphone size={18} /></span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-ink">Nueva convocatoria disponible</div>
                  <div className="text-[10.5px] text-slate-500">Hace un momento · {BRAND.domain}</div>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-[12px] leading-relaxed text-ink/90">
                {paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line"><Highlighted text={p} terms={terms} /></p>)}
              </div>
              <button type="button" className="btn-primary mt-3 w-full py-1.5 text-[12px]">Ver convocatoria</button>
            </div>
          )}
        </Section>
      </div>
      <Section icon={Clock} title="Configuración adicional" subtitle="Opciones adicionales de notificación">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
          <div><Lbl>Recordatorio automático</Lbl><Sel value={f.recordatorio} onChange={(v) => set('recordatorio', v)} options={RECORDATORIO} /></div>
          <div><Lbl>Mensaje de recordatorio (opcional)</Lbl><input className="input" value={f.msgRecordatorio} onChange={(e) => set('msgRecordatorio', e.target.value)} placeholder="Mensaje personalizado..." /></div>
        </div>
      </Section>
    </div>
  )
}

/* ---------------- Paso 5 ---------------- */
const ROL_NOMBRE: Record<string, string> = {
  admin: 'Administrador Nacional (SNS)', coordinador: 'Coordinador (SNS)', operador: 'Operador (SNS)',
  radiologo: 'Médico radiólogo', referidor: 'Médico referidor', paciente: 'Paciente',
}

function Step5({ f, hospitalObj, goEdit }: { f: Form; hospitalObj?: HospOpt; goEdit: () => void }) {
  const { sesion } = useSesion()
  const dash = <span className="text-slate-400">—</span>
  const esp = f.especialidades.filter((e) => e !== 'OT')
  const espNames = [...esp.map((e) => ESP_LARGO[e]), ...(f.especialidades.includes('OT') && f.otraEsp ? [f.otraEsp] : [])]
  const canales = [f.canales.email && 'Correo electrónico', f.canales.whatsapp && 'WhatsApp', f.canales.portal && 'Portal'].filter(Boolean) as string[]
  const canalTxt = canales.length > 1 ? `${canales.slice(0, -1).join(', ')} y ${canales[canales.length - 1]}` : canales[0] ?? 'Ninguno'
  const rows: { icon: LucideIcon; l: string; v: ReactNode }[] = [
    { icon: FileText, l: 'Título de la convocatoria', v: f.titulo || dash },
    { icon: Building2, l: 'Hospital / Centro de salud', v: hospitalObj ? <>{hospitalObj.n}{hospitalObj.p && <><br /><span className="text-slate-500">{hospitalObj.p}</span></>}</> : dash },
    { icon: Stethoscope, l: 'Especialidades requeridas', v: espNames.length ? <><b className="font-semibold">{[...esp, ...(f.especialidades.includes('OT') ? ['OT'] : [])].join(', ')}</b><br /><span className="text-slate-500">({espNames.join(', ')})</span></> : dash },
    { icon: Users, l: 'Número de radiólogos', v: f.numero },
    { icon: Briefcase, l: 'Tipo de contratación', v: f.tipo || dash },
    { icon: Clock, l: 'Duración', v: f.duracion },
    { icon: Monitor, l: 'Modalidad de trabajo', v: f.modTrabajo },
    { icon: UserCog, l: 'Disponibilidad requerida', v: f.disponibilidad },
    { icon: Calendar, l: 'Fecha de inicio', v: fmtDate(f.inicio) || dash },
    { icon: Calendar, l: 'Fecha de cierre', v: fmtDate(f.cierre) || dash },
    { icon: MapPin, l: 'Región de interés', v: f.regionInteres || 'Todas las regiones' },
    { icon: MapPin, l: 'Región donde viven', v: f.regionViven || 'Todas las regiones' },
    { icon: GraduationCap, l: 'Nivel profesional mínimo', v: f.nivel },
    { icon: Star, l: 'Experiencia mínima', v: f.experiencia || dash },
    { icon: FileText, l: 'Descripción', v: f.descripcion || f.descPosicion || dash },
    { icon: Bell, l: 'Notificaciones', v: <>{canalTxt}<br /><span className="text-slate-500">Recordatorio: {f.recordatorio === 'Sin recordatorio' ? 'sin recordatorio' : `${f.recordatorio} del cierre`}</span></> },
  ]
  const [ahora] = useState(() => new Date())
  const creador: { icon: LucideIcon; l: string; v: string }[] = supabaseConfigurado
    ? [
      // En producción: el usuario conectado y la fecha/hora actual (sin datos de ejemplo)
      { icon: User, l: 'Usuario', v: sesion?.nombre || 'Administrador' },
      { icon: ShieldCheck, l: 'Rol', v: (sesion?.rol && ROL_NOMBRE[sesion.rol]) || 'Administrador' },
      { icon: Calendar, l: 'Fecha', v: ahora.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' }) },
      { icon: Clock, l: 'Hora', v: ahora.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }) },
    ]
    : [
      { icon: User, l: 'Usuario', v: 'Juan Pérez' },
      { icon: ShieldCheck, l: 'Rol', v: 'Administrador Nacional (SNS)' },
      { icon: Calendar, l: 'Fecha', v: '01/03/2025' },
      { icon: Clock, l: 'Hora', v: '10:24 a. m.' },
      { icon: MapPin, l: 'IP Address', v: '186.101.45.72' },
    ]
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Section icon={ClipboardList} title="Resumen de la convocatoria" subtitle="Revise la información antes de publicar"
        action={<button type="button" className="btn-outline px-3 py-1.5" onClick={goEdit}><Pencil size={14} /> Editar</button>}>
        <div className="divide-y divide-[#eef2f8]">
          {rows.map(({ icon: Icon, l, v }) => (
            <div key={l} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] items-center gap-3 py-1.5 text-[12.5px]">
              <span className="flex items-center gap-2.5 text-ink"><Icon size={17} className="shrink-0 text-brand-600" />{l}</span>
              <span className="text-ink/90">{v}</span>
            </div>
          ))}
        </div>
      </Section>
      <div className="space-y-4">
        <Section icon={User} title="Información del creador">
          <div className="divide-y divide-[#eef2f8]">
            {creador.map(({ icon: Icon, l, v }) => (
              <div key={l} className="grid grid-cols-[110px_1fr] items-center gap-2 py-2.5 text-[12.5px]">
                <span className="flex items-center gap-2.5 text-ink"><Icon size={17} className="text-brand-600" />{l}</span>
                <span className="text-ink/90">{v}</span>
              </div>
            ))}
          </div>
        </Section>
        <div className="rounded-xl bg-brand-50/70 p-4">
          <h4 className="flex items-center gap-2 text-[13.5px] font-bold text-ink"><Info size={20} className="fill-brand-600 text-white" /> Estado de la convocatoria</h4>
          <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600">Al hacer clic en "Publicar convocatoria" la información será enviada a los médicos radiólogos que cumplen con los criterios establecidos.</p>
        </div>
        <div className="rounded-xl bg-emerald-50/70 p-4">
          <h4 className="flex items-center gap-2 text-[13.5px] font-bold text-ink"><CheckCircle2 size={20} className="fill-emerald-600 text-white" /> ¿Todo listo para publicar?</h4>
          <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600">Revise que toda la información sea correcta. Podrá pausar, editar o archivar la convocatoria en cualquier momento después de publicarla.</p>
        </div>
      </div>
    </div>
  )
}
