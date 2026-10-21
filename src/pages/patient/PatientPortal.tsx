import { useState, type ReactNode } from 'react'
import {
  Building2, CalendarClock, CheckCircle2, Circle, Download, Eye, EyeOff, FileText, Folder, Home, Info, Lock,
  Maximize2, Minus, Plus, Printer, RotateCw, Share2, Sun, User, UserRound, XCircle, Contrast, Move, type LucideIcon,
} from 'lucide-react'
import PortalLayout, { type PortalConfig } from '../../layouts/PortalLayout'
import { RequiereSesion, useSesion } from '../../lib/session'
import { cambiarClave, cambiarClavePrimerAcceso, mensajeError, supabaseConfigurado } from '../../lib/api'
import { Badge, Modal, Modality, clsx } from '../../components/ui'

/* =========================================================
   Utilidades compartidas por las páginas del portal (paciente y médico)
   ========================================================= */

/** Encabezado grande de página para los portales */
export function PortalHeading({ icon: Icon, title, subtitle, actions }: {
  icon: LucideIcon; title: string; subtitle?: ReactNode; actions?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e6edf8] bg-white px-4 py-4 shadow-card sm:px-5">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon size={28} />
        </span>
        <div className="min-w-0">
          <h1 className="text-[24px] font-bold leading-tight text-ink sm:text-[28px]">{title}</h1>
          {subtitle && <p className="text-[14px] text-brand-800/80">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Lee/escribe localStorage de forma segura */
export function lsGet(key: string): string | null {
  try { return window.localStorage.getItem(key) } catch { return null }
}
export function lsSet(key: string, value: string) {
  try { window.localStorage.setItem(key, value) } catch { /* sin almacenamiento */ }
}

/* ---------- Estudios del paciente (mock) ---------- */
export type Study = {
  id: string; name: string; mod: string; date: string; time: string; hospital: string; city: string
  img: string; status: 'Informe publicado' | 'En lectura' | 'Pendiente'; radiologist: string; referrer: string
  region: string; technique: string; findings: string[]; impression: string[]; series: number; images: number
}

export const STUDIES: Study[] = [
  {
    id: 'EST-2025-000873', name: 'Tomografía computarizada', mod: 'CT', date: '15/03/2025', time: '10:24 a. m.',
    hospital: 'Hosp. Hugo Mendoza', city: 'Santo Domingo, Distrito Nacional', img: '/img/crops/ct-cerebro.webp', status: 'Informe publicado',
    radiologist: 'Dr. Carlos Andrés Méndez Rodríguez', referrer: 'Dr. Luis Fernando González Santana', region: 'Cráneo simple',
    technique: 'Tomografía computarizada de cráneo sin contraste endovenoso, cortes axiales de 5 mm con reconstrucciones multiplanares.',
    findings: [
      'Parénquima cerebral de densidad conservada, sin evidencia de lesiones focales ni colecciones.',
      'Sistema ventricular de tamaño y morfología normales, centrado en la línea media.',
      'Surcos y cisuras de amplitud acorde a la edad.',
      'No se observan signos de sangrado agudo ni efecto de masa.',
      'Estructuras óseas de la calota sin alteraciones.',
    ],
    impression: ['Estudio tomográfico de cráneo dentro de límites normales.', 'Se sugiere correlación clínica.'],
    series: 4, images: 186,
  },
  {
    id: 'EST-2025-000812', name: 'Radiografía de tórax', mod: 'RX', date: '02/03/2025', time: '09:15 a. m.',
    hospital: 'Hospital General', city: 'Santo Domingo, Distrito Nacional', img: '/img/crops/rx-torax.webp', status: 'Informe publicado',
    radiologist: 'Dra. María Elena Castillo', referrer: 'Dr. Luis Fernando González Santana', region: 'Tórax PA',
    technique: 'Radiografía de tórax en proyección posteroanterior, en bipedestación e inspiración adecuada.',
    findings: [
      'Campos pulmonares bien ventilados, sin consolidaciones ni nódulos.',
      'Silueta cardíaca de tamaño normal (índice cardiotorácico < 0.5).',
      'Senos costofrénicos libres.',
      'Mediastino centrado, hilios de aspecto habitual.',
    ],
    impression: ['Radiografía de tórax sin hallazgos patológicos.'],
    series: 1, images: 2,
  },
  {
    id: 'EST-2025-000655', name: 'Resonancia magnética de rodilla', mod: 'MR', date: '28/01/2025', time: '03:40 p. m.',
    hospital: 'Hospital Dr. Francisco A. Gonzalvo', city: 'Santiago de los Caballeros', img: '/img/crops/mr.webp', status: 'Informe publicado',
    radiologist: 'Dr. José Ramírez Peña', referrer: 'Dr. Luis Fernando González Santana', region: 'Rodilla derecha',
    technique: 'Resonancia magnética de rodilla derecha en secuencias T1, T2 y DP con supresión grasa, planos sagital, coronal y axial.',
    findings: [
      'Menisco medial con señal lineal intrasustancia que no alcanza la superficie articular.',
      'Ligamentos cruzados anterior y posterior íntegros.',
      'Leve derrame articular suprarrotuliano.',
      'Cartílago femorotibial conservado.',
    ],
    impression: ['Degeneración mucoide grado II del menisco medial.', 'Leve derrame articular.'],
    series: 6, images: 240,
  },
  {
    id: 'EST-2024-004210', name: 'Ecografía abdominal', mod: 'US', date: '12/11/2024', time: '08:05 a. m.',
    hospital: 'Hosp. Hugo Mendoza', city: 'Santo Domingo, Distrito Nacional', img: '/img/crops/us.webp', status: 'Informe publicado',
    radiologist: 'Dra. Ana Lucía Ferreira', referrer: 'Dr. Luis Fernando González Santana', region: 'Abdomen completo',
    technique: 'Ecografía abdominal con transductor convexo de 3.5 MHz.',
    findings: [
      'Hígado de tamaño normal y ecogenicidad conservada.',
      'Vesícula biliar sin litos, pared fina.',
      'Riñones de tamaño y morfología normales, sin dilatación de vías.',
      'Bazo y páncreas sin alteraciones visibles.',
    ],
    impression: ['Ecografía abdominal dentro de límites normales.'],
    series: 1, images: 32,
  },
  {
    id: 'EST-2024-003877', name: 'Radiografía de columna lumbar', mod: 'RX', date: '20/09/2024', time: '11:30 a. m.',
    hospital: 'Hospital General', city: 'Santo Domingo, Distrito Nacional', img: '/img/crops/rx-torax.webp', status: 'Informe publicado',
    radiologist: 'Dra. María Elena Castillo', referrer: 'Dr. Luis Fernando González Santana', region: 'Columna lumbar AP y lateral',
    technique: 'Radiografía de columna lumbosacra en proyecciones AP y lateral.',
    findings: [
      'Rectificación de la lordosis lumbar fisiológica.',
      'Cuerpos vertebrales de altura conservada.',
      'Discreta disminución del espacio discal L5-S1.',
    ],
    impression: ['Cambios espondiloartrósicos incipientes L5-S1.', 'Rectificación lumbar por contractura muscular.'],
    series: 1, images: 2,
  },
  {
    id: 'EST-2024-002915', name: 'Tomografía de abdomen', mod: 'CT', date: '05/07/2024', time: '02:10 p. m.',
    hospital: 'Hospital Dr. Francisco A. Gonzalvo', city: 'Santiago de los Caballeros', img: '/img/crops/ct-cerebro.webp', status: 'Informe publicado',
    radiologist: 'Dr. Carlos Andrés Méndez Rodríguez', referrer: 'Dr. Luis Fernando González Santana', region: 'Abdomen y pelvis con contraste',
    technique: 'Tomografía de abdomen y pelvis con contraste endovenoso en fase portal.',
    findings: [
      'Hígado, bazo y páncreas de morfología y realce normales.',
      'Apéndice cecal de calibre normal.',
      'Sin adenopatías ni líquido libre intraabdominal.',
    ],
    impression: ['Tomografía abdominopélvica sin hallazgos agudos.'],
    series: 5, images: 312,
  },
  {
    id: 'EST-2024-001540', name: 'Ecografía tiroidea', mod: 'US', date: '18/04/2024', time: '09:45 a. m.',
    hospital: 'Hosp. Hugo Mendoza', city: 'Santo Domingo, Distrito Nacional', img: '/img/crops/us.webp', status: 'Informe publicado',
    radiologist: 'Dra. Ana Lucía Ferreira', referrer: 'Dr. Luis Fernando González Santana', region: 'Tiroides',
    technique: 'Ecografía de tiroides con transductor lineal de alta frecuencia y Doppler color.',
    findings: [
      'Glándula tiroides de tamaño normal y ecoestructura homogénea.',
      'Nódulo quístico de 4 mm en lóbulo derecho (TI-RADS 1).',
    ],
    impression: ['Quiste simple tiroideo derecho, de aspecto benigno.'],
    series: 1, images: 18,
  },
  {
    id: 'EST-2024-000932', name: 'Radiografía de mano', mod: 'RX', date: '10/02/2024', time: '04:20 p. m.',
    hospital: 'Hospital General', city: 'Santo Domingo, Distrito Nacional', img: '/img/crops/rx-torax.webp', status: 'Informe publicado',
    radiologist: 'Dr. José Ramírez Peña', referrer: 'Dr. Luis Fernando González Santana', region: 'Mano izquierda',
    technique: 'Radiografía de mano izquierda en proyecciones PA y oblicua.',
    findings: ['Estructuras óseas sin trazos de fractura.', 'Espacios articulares conservados.', 'Partes blandas sin alteraciones.'],
    impression: ['Radiografía de mano izquierda sin alteraciones óseas agudas.'],
    series: 1, images: 2,
  },
]

/* ---------- Modal: informe radiológico ---------- */
export function ReportModal({ study, onClose, patient = 'Juan Pérez Gómez', record = 'HN-00012345' }: {
  study: Study | null; onClose: () => void; patient?: string; record?: string
}) {
  return (
    <Modal open={!!study} onClose={onClose} className="max-w-[860px]">
      {study && (
        <div className="max-h-[88vh] overflow-y-auto">
          <div className="border-b border-[#e6edf8] bg-gradient-to-r from-brand-50 to-white px-5 py-4 pr-14 sm:px-7">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white"><FileText size={22} /></span>
              <div>
                <h2 className="text-[20px] font-bold text-ink">Informe radiológico</h2>
                <p className="text-[12.5px] text-brand-800/80">{study.name} · {study.region}</p>
              </div>
            </div>
          </div>
          <div className="space-y-5 px-5 py-5 sm:px-7">
            <div className="grid gap-x-6 gap-y-2 rounded-xl border border-[#e6edf8] bg-[#f7faff] p-4 text-[12.5px] sm:grid-cols-2">
              <p><span className="text-brand-800/70">Paciente: </span><b className="text-ink">{patient}</b></p>
              <p><span className="text-brand-800/70">Expediente: </span><b className="text-ink">{record}</b></p>
              <p><span className="text-brand-800/70">Estudio: </span><span className="text-ink">{study.id}</span> <Modality m={study.mod} className="ml-1" /></p>
              <p><span className="text-brand-800/70">Fecha: </span><span className="text-ink">{study.date} {study.time}</span></p>
              <p><span className="text-brand-800/70">Centro: </span><span className="text-ink">{study.hospital}</span></p>
              <p><span className="text-brand-800/70">Médico referidor: </span><span className="text-ink">{study.referrer}</span></p>
            </div>
            <ReportSection title="Técnica"><p>{study.technique}</p></ReportSection>
            <ReportSection title="Hallazgos">
              <ul className="list-disc space-y-1 pl-5">{study.findings.map((f) => <li key={f}>{f}</li>)}</ul>
            </ReportSection>
            <ReportSection title="Impresión diagnóstica">
              <ol className="list-decimal space-y-1 pl-5 font-medium text-ink">{study.impression.map((f) => <li key={f}>{f}</li>)}</ol>
            </ReportSection>
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[#e6edf8] pt-4">
              <div>
                <p className="font-serif text-[22px] italic text-brand-700">{study.radiologist.replace(/^Dra?\.\s*/, '').split(' ').slice(0, 2).join(' ')}</p>
                <div className="mt-1 h-px w-56 bg-slate-300" />
                <p className="mt-1 text-[13px] font-semibold text-ink">{study.radiologist}</p>
                <p className="text-[12px] text-slate-500">Médico radiólogo{supabaseConfigurado ? '' : ' · Exequátur 12345'}</p>
                <p className="text-[12px] text-slate-500">Firmado electrónicamente el {study.date}</p>
              </div>
              <Badge tone="green" icon>Informe publicado</Badge>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-[#e6edf8] bg-[#f7faff] px-5 py-3 sm:px-7">
            <button className="btn-outline"><Printer size={16} /> Imprimir</button>
            <button className="btn-outline"><Share2 size={16} /> Compartir</button>
            <button className="btn-primary"><Download size={16} /> Descargar PDF</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-[13px] font-bold uppercase tracking-wide text-brand-700">{title}</h3>
      <div className="text-[13.5px] leading-relaxed text-slate-700">{children}</div>
    </section>
  )
}

/* ---------- Modal: visor de imágenes ---------- */
export function ViewerModal({ study, onClose, patient = 'Juan Pérez Gómez', record = 'HN-00012345' }: {
  study: Study | null; onClose: () => void; patient?: string; record?: string
}) {
  const [zoom, setZoom] = useState(1)
  const [rot, setRot] = useState(0)
  const [invert, setInvert] = useState(false)
  const [bright, setBright] = useState(1)
  const [idx, setIdx] = useState(0)
  const close = () => { setZoom(1); setRot(0); setInvert(false); setBright(1); setIdx(0); onClose() }
  const tools: { icon: LucideIcon; label: string; on: () => void; active?: boolean }[] = [
    { icon: Plus, label: 'Acercar', on: () => setZoom((z) => Math.min(3, z + 0.25)) },
    { icon: Minus, label: 'Alejar', on: () => setZoom((z) => Math.max(0.5, z - 0.25)) },
    { icon: RotateCw, label: 'Rotar', on: () => setRot((r) => r + 90) },
    { icon: Contrast, label: 'Invertir', on: () => setInvert((v) => !v), active: invert },
    { icon: Sun, label: 'Brillo', on: () => setBright((b) => (b >= 1.6 ? 0.8 : b + 0.2)) },
    { icon: Move, label: 'Desplazar', on: () => {} },
    { icon: Maximize2, label: 'Restablecer', on: () => { setZoom(1); setRot(0); setInvert(false); setBright(1) } },
  ]
  const thumbs = study ? Array.from({ length: Math.min(6, study.images) }, (_, i) => i) : []
  return (
    <Modal open={!!study} onClose={close} className="max-w-[1100px] !bg-[#0b1220]">
      {study && (
        <div className="flex max-h-[90vh] flex-col text-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3 pr-14">
            <Modality m={study.mod} />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{study.name} · {study.region}</p>
              <p className="text-[12px] text-white/60">{study.date} {study.time} · {study.hospital} · {study.series} series / {study.images} imágenes</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 px-4 py-2">
            {tools.map((t) => (
              <button key={t.label} onClick={t.on} title={t.label}
                className={clsx('flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] transition hover:bg-white/10', t.active ? 'bg-brand-600' : 'bg-white/5')}>
                <t.icon size={15} /> <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
            <span className="ml-auto text-[12px] text-white/60">Zoom {Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <div className="scroll-soft flex gap-2 overflow-auto border-white/10 p-3 md:w-[120px] md:flex-col md:border-r">
              {thumbs.map((i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={clsx('relative shrink-0 overflow-hidden rounded-md border-2', i === idx ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100')}>
                  <img src={study.img} alt="" className="h-20 w-20 object-cover md:h-24 md:w-full" style={{ filter: `brightness(${0.85 + i * 0.05})` }} />
                  <span className="absolute bottom-0.5 right-1 text-[10px]">{i + 1}</span>
                </button>
              ))}
            </div>
            <div className="relative flex min-h-[320px] flex-1 items-center justify-center overflow-hidden bg-black sm:min-h-[460px]">
              <img src={study.img} alt={study.name}
                className="h-[52vh] w-auto max-w-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom}) rotate(${rot}deg)`, filter: `${invert ? 'invert(1) ' : ''}brightness(${bright})` }} />
              <div className="pointer-events-none absolute left-3 top-3 space-y-0.5 text-[11px] text-white/80">
                <p>{patient}</p><p>{record}</p><p>{study.id}</p>
              </div>
              <div className="pointer-events-none absolute right-3 top-3 text-right text-[11px] text-white/80">
                <p>{study.hospital}</p><p>{study.date}</p>
              </div>
              <div className="pointer-events-none absolute bottom-3 left-3 text-[11px] text-white/80">
                <p>Serie 1 · Imagen {idx + 1}/{study.images}</p><p>W: 80 L: 40</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5 text-[12px] text-white/60">
            <span>Visor de demostración · Las imágenes diagnósticas completas se cargan desde el PACS del centro.</span>
            <button className="btn bg-white/10 text-white hover:bg-white/20"><Download size={15} /> Descargar imágenes</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ---------- Avisos de carga, error y lista vacía (datos reales) ---------- */
export function AvisoDatos({ cargando, error, vacio, mensaje, className }: {
  cargando?: boolean; error?: string; vacio?: boolean; mensaje: string; className?: string
}) {
  if (cargando) return (
    <div className={clsx('flex items-center justify-center gap-2.5 p-8 text-[14px] text-slate-500', className)}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" /> Cargando información…
    </div>
  )
  if (error) return <div className={clsx('p-8 text-center text-[14px] text-red-600', className)}>No se pudo cargar la información. {error}</div>
  if (vacio) return <div className={clsx('p-8 text-center text-[14px] text-slate-500', className)}>{mensaje}</div>
  return null
}

/* ---------- Formulario de contraseña con validación en vivo ---------- */
export function usePasswordRules(pwd: string, confirm: string) {
  const rules = [
    { label: 'Mínimo 8 caracteres', ok: pwd.length >= 8 },
    { label: 'Al menos una letra', ok: /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(pwd) },
    { label: 'Al menos un número', ok: /\d/.test(pwd) },
    { label: 'Ambas contraseñas deben coincidir', ok: pwd.length > 0 && pwd === confirm },
  ]
  let score = 0
  if (pwd.length >= 8) score++
  if (/[a-zA-Z]/.test(pwd) && /\d/.test(pwd)) score++
  if (pwd.length >= 12 || /[^a-zA-Z0-9]/.test(pwd) || (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd))) score++
  if (!pwd) score = 0
  return { rules, valid: rules.every((r) => r.ok), score }
}

export function PasswordInput({ value, onChange, placeholder, label }: {
  value: string; onChange: (v: string) => void; placeholder: string; label: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="mb-1.5 block text-[14px] font-bold text-ink">{label}</label>
      <div className="relative">
        <Lock size={19} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/80" />
        <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="input h-12 pl-11 pr-11 text-[14.5px]" autoComplete="new-password" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/70 hover:text-ink" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
          {show ? <Eye size={19} /> : <EyeOff size={19} />}
        </button>
      </div>
    </div>
  )
}

export function StrengthBar({ score }: { score: number }) {
  const colors = ['#ef4444', '#f59e0b', '#16a34a']
  const labels = ['Débil', 'Media', 'Fuerte']
  return (
    <div className="mt-2">
      <div className="grid grid-cols-3 gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 rounded-full transition-colors" style={{ background: i < score ? colors[score - 1] : '#e3e9f3' }} />
        ))}
      </div>
      {score > 0 && <p className="mt-1 text-right text-[11.5px] font-medium" style={{ color: colors[score - 1] }}>Seguridad: {labels[score - 1]}</p>}
    </div>
  )
}

export function RuleList({ rules }: { rules: { label: string; ok: boolean }[] }) {
  return (
    <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
      {rules.map((r) => (
        <li key={r.label} className={clsx('flex items-center gap-2 transition-colors', r.ok ? 'text-emerald-600' : 'text-brand-800/80')}>
          {r.ok ? <CheckCircle2 size={15} className="shrink-0" /> : <Circle size={14} className="shrink-0" />}
          {r.label}
        </li>
      ))}
    </ul>
  )
}

/** Bloque reutilizable para cambiar contraseña (sección Seguridad de los perfiles) */
export function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const { rules, valid, score } = usePasswordRules(pwd, confirm)
  const mismatch = confirm.length > 0 && pwd !== confirm
  const ok = valid && current.length > 0
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault()
      if (!ok) return
      setErr('')
      try {
        if (supabaseConfigurado) await cambiarClave(current, pwd)
        setDone(true); setCurrent(''); setPwd(''); setConfirm('')
      } catch (error) { setErr(mensajeError(error)) }
    }}>
      <PasswordInput label="Contraseña actual" value={current} onChange={(v) => { setCurrent(v); setDone(false) }} placeholder="Escribe tu contraseña actual" />
      <div>
        <PasswordInput label="Nueva contraseña" value={pwd} onChange={(v) => { setPwd(v); setDone(false) }} placeholder="Escribe tu nueva contraseña" />
        <StrengthBar score={score} />
        <RuleList rules={rules} />
      </div>
      <PasswordInput label="Repite tu nueva contraseña" value={confirm} onChange={(v) => { setConfirm(v); setDone(false) }} placeholder="Vuelve a escribir tu nueva contraseña" />
      {mismatch && (
        <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700"><XCircle size={18} className="text-red-500" /> Las contraseñas no coinciden</p>
      )}
      {done && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700"><CheckCircle2 size={18} /> Tu contraseña se actualizó correctamente.</p>
      )}
      {err && (
        <p className="text-[13px] text-red-600">{err}</p>
      )}
      <button type="submit" disabled={!ok} className="btn-primary"><Lock size={16} /> Actualizar contraseña</button>
    </form>
  )
}

/* =========================================================
   Modal obligatorio de primer acceso
   ========================================================= */
const PWD_KEY = 'rns-paciente-pwd'

function FirstAccessModal({ open, onDone }: { open: boolean; onDone: (pwd: string) => Promise<void> }) {
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const { rules, valid, score } = usePasswordRules(pwd, confirm)
  const mismatch = confirm.length > 0 && pwd !== confirm
  return (
    <Modal open={open} onClose={() => {}} hideClose closeOnBackdrop={false} className="max-w-[660px] !rounded-3xl">
      <form className="max-h-[92vh] overflow-y-auto px-5 pb-7 pt-6 sm:px-12"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!valid || guardando) return
          setGuardando(true); setError('')
          try { await onDone(pwd) } catch (err) { setError(mensajeError(err)) } finally { setGuardando(false) }
        }}>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-[118px] w-[118px] items-center justify-center rounded-full bg-brand-100">
            <span className="relative flex h-[66px] w-[60px] items-end justify-center">
              <span className="absolute top-0 h-9 w-10 rounded-t-full border-[7px] border-b-0 border-brand-600" />
              <span className="relative flex h-[42px] w-[60px] items-center justify-center rounded-lg bg-brand-600">
                <span className="flex flex-col items-center"><span className="h-3 w-3 rounded-full bg-white" /><span className="-mt-0.5 h-2.5 w-1.5 rounded-b bg-white" /></span>
              </span>
            </span>
          </span>
          <h2 className="mt-4 text-[26px] font-extrabold leading-tight text-navy-800 sm:text-[31px]">Establece tu nueva contraseña</h2>
          <p className="mt-2 max-w-[500px] text-[15px] text-brand-800/85 sm:text-[17px]">Por tu seguridad, debes crear una contraseña personal antes de acceder a tu portal de paciente.</p>
        </div>

        <div className="mt-6">
          <PasswordInput label="Nueva contraseña" value={pwd} onChange={setPwd} placeholder="Escribe tu nueva contraseña" />
          <StrengthBar score={score} />
          <RuleList rules={rules} />
        </div>
        <div className="mt-5">
          <PasswordInput label="Repite tu nueva contraseña" value={confirm} onChange={setConfirm} placeholder="Vuelve a escribir tu nueva contraseña" />
        </div>
        {mismatch && (
          <p className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
            <XCircle size={20} className="shrink-0 fill-red-500 text-white" /> Las contraseñas no coinciden
          </p>
        )}
        <div className="mt-5 flex gap-3 rounded-xl bg-brand-50 px-4 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white"><Info size={20} /></span>
          <div className="text-[14px] text-brand-800/90">
            <p className="font-bold text-ink">Este paso es obligatorio</p>
            <p>No podrás omitir este paso ni acceder a tu información médica hasta que establezcas tu nueva contraseña.</p>
          </div>
        </div>
        {error && <p className="mt-3 text-[14px] text-red-600">{error}</p>}
        <button type="submit" disabled={!valid || guardando}
          className={clsx('mt-5 flex h-14 w-full items-center justify-center gap-2.5 rounded-full text-[17px] font-semibold text-white transition',
            valid ? 'bg-brand-600 shadow-lg shadow-brand-600/30 hover:bg-brand-700' : 'cursor-not-allowed bg-[#b4c1dc]')}>
          <Lock size={20} /> {guardando ? 'Guardando…' : 'Guardar contraseña y continuar'}
        </button>
      </form>
    </Modal>
  )
}

export const PATIENT_CONFIG: PortalConfig = {
  home: '/paciente',
  topLinks: [
    { to: '/paciente', label: 'Inicio', end: true },
    { to: '/paciente/estudios', label: 'Mis estudios' },
    { to: '/paciente/hospitales', label: 'Hospitales' },
    { to: '/paciente/historia', label: 'Mi historia clínica' },
    { to: '/paciente/perfil', label: 'Mi perfil' },
  ],
  side: [
    { to: '/paciente', label: 'Resumen', icon: Home, end: true },
    { to: '/paciente/estudios', label: 'Mis estudios', icon: FileText },
    { to: '/paciente/hospitales', label: 'Hospitales', icon: Building2 },
    { to: '/paciente/medicos', label: 'Médicos referidores', icon: UserRound },
    { to: '/paciente/historia', label: 'Historia clínica', icon: Folder },
    { to: '/paciente/citas', label: 'Citas y seguimiento', icon: CalendarClock },
    { to: '/paciente/perfil', label: 'Mi perfil', icon: User },
  ],
  user: { name: 'Juan Pérez Gómez', code: 'HN-00012345' },
  profilePath: '/paciente/perfil',
  logoutPath: '/paciente/login',
}

function PortalPaciente() {
  const { sesion, recargar } = useSesion()
  const p = sesion?.paciente
  // En modo demostración el primer acceso se recuerda en el navegador; con Supabase lo indica la base de datos
  const [demoPwd, setDemoPwd] = useState(() => lsGet(PWD_KEY) === null)
  const needsPwd = supabaseConfigurado ? Boolean(p?.debe_cambiar_clave) : demoPwd
  const config = p ? { ...PATIENT_CONFIG, user: { name: p.nombre_completo, code: p.codigo } } : PATIENT_CONFIG
  return (
    <PortalLayout
      config={config}
      overlay={<FirstAccessModal open={needsPwd} onDone={async (pwd) => {
        if (supabaseConfigurado) { await cambiarClavePrimerAcceso(pwd); await recargar() }
        else { lsSet(PWD_KEY, new Date().toISOString()); setDemoPwd(false) }
      }} />}
    />
  )
}

export default function PatientPortal() {
  return (
    <RequiereSesion roles={['paciente']} login="/paciente/login">
      <PortalPaciente />
    </RequiereSesion>
  )
}
