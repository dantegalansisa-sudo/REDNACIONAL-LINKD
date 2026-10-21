import { useRef, useState } from 'react'
import { Award, CheckCircle2, Download, FileText, MapPin, Shield, Upload, User, UserRound, X } from 'lucide-react'
import { Badge, InfoRow, Toggle, UserSilhouette, clsx } from '../../components/ui'
import { ChangePasswordForm, PortalHeading } from '../patient/PatientPortal'
import { RoleSwitcher, useDoctorInfo, useDoctorRole } from './DoctorPortal'

const REGIONS = ['Ozama', 'Cibao Norte', 'Cibao Sur', 'Cibao Nordeste', 'Cibao Noroeste', 'Valdesia', 'Enriquillo', 'El Valle', 'Yuma', 'Higuamo']

type Doc = { name: string; size: string; date: string; status: 'Verificado' | 'En revisión' }

export default function Perfil() {
  const { role } = useDoctorRole()
  const d = useDoctorInfo()
  const rad = role === 'radiologo'
  const fileRef = useRef<HTMLInputElement>(null)
  const [regions, setRegions] = useState<string[]>(rad ? ['Ozama', 'Cibao Norte', 'Valdesia'] : ['Ozama'])
  const [avail, setAvail] = useState(true)
  const [notif, setNotif] = useState({ mail: true, wa: true, crit: true })
  const [docs, setDocs] = useState<Doc[]>([
    { name: 'Exequátur.pdf', size: '420 KB', date: '15/01/2024', status: 'Verificado' },
    { name: 'Cédula de identidad.pdf', size: '310 KB', date: '15/01/2024', status: 'Verificado' },
    { name: rad ? 'Título de especialidad en Radiología.pdf' : 'Título de especialidad en Medicina Interna.pdf', size: '1.2 MB', date: '15/01/2024', status: 'Verificado' },
    { name: 'Certificado de colegiatura CMD.pdf', size: '280 KB', date: '02/10/2026', status: 'En revisión' },
  ])
  const specialties = rad ? ['Radiología e Imágenes Diagnósticas', 'Neurorradiología', 'Imagen musculoesquelética'] : ['Medicina Interna', 'Cardiología clínica']

  return (
    <div>
      <PortalHeading icon={User} title="Mi perfil" subtitle="Datos profesionales, documentación y seguridad de tu cuenta." actions={<RoleSwitcher />} />

      <section className="card mb-4 flex flex-col items-center gap-5 p-5 sm:flex-row">
        {d.photo ? <img src={d.photo} alt={d.name} className="h-28 w-28 rounded-full border-4 border-brand-100 object-cover" /> : <UserSilhouette size={112} />}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="text-[23px] font-bold text-navy-800">{d.name}</h2>
          <p className="text-[15px] font-semibold text-brand-700">{d.code} · Exequátur {d.exequatur}</p>
          <p className="text-[13px] text-slate-500">{d.specialty}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Badge tone="green" icon>Cuenta verificada</Badge>
            <Badge tone="blue">Miembro desde 01/2024</Badge>
          </div>
        </div>
        {rad && (
          <div className="flex items-center gap-3 rounded-xl border border-[#e6edf8] px-4 py-3">
            <div><p className="text-[13.5px] font-semibold text-ink">Disponible para asignaciones</p><p className="text-[12px] text-slate-500">{avail ? 'Recibiendo estudios nuevos' : 'Pausado temporalmente'}</p></div>
            <Toggle on={avail} onChange={setAvail} />
          </div>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-navy-800"><UserRound size={18} className="text-brand-600" /> Datos profesionales</h3>
          <InfoRow label="Nombre completo">{d.name}</InfoRow>
          <InfoRow label="Código RNS">{d.code}</InfoRow>
          <InfoRow label="Exequátur">{d.exequatur}</InfoRow>
          <InfoRow label="Colegiatura CMD">{rad ? 'CMD-08812' : 'CMD-11204'}</InfoRow>
          <InfoRow label="Correo">{d.email}</InfoRow>
          <InfoRow label="Teléfono / WhatsApp">{d.phone}</InfoRow>
          <InfoRow label="Rol en la red">{rad ? 'Médico radiólogo (lector)' : 'Médico referidor'}</InfoRow>
        </section>

        <section className="card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-navy-800"><Award size={18} className="text-brand-600" /> Especialidades</h3>
          <div className="flex flex-wrap gap-2">{specialties.map((s) => <span key={s} className="rounded-full bg-brand-50 px-3 py-1 text-[12.5px] font-medium text-brand-700">{s}</span>)}</div>
          <h3 className="mb-2 mt-5 flex items-center gap-2 text-[15px] font-bold text-navy-800"><MapPin size={18} className="text-brand-600" /> Región de interés</h3>
          <p className="mb-2 text-[12.5px] text-slate-500">{rad ? 'Recibirás convocatorias y asignaciones de estas regiones de salud.' : 'Regiones donde refieres pacientes con mayor frecuencia.'}</p>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => {
              const on = regions.includes(r)
              return (
                <button key={r} onClick={() => setRegions(on ? regions.filter((x) => x !== r) : [...regions, r])}
                  className={clsx('rounded-full border px-3 py-1 text-[12.5px] font-medium transition', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#d7e1f2] text-ink hover:border-brand-400')}>
                  {on && <CheckCircle2 size={13} className="mr-1 inline" />}{r}
                </button>
              )
            })}
          </div>
        </section>

        <section className="card p-4 xl:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-navy-800"><FileText size={18} className="text-brand-600" /> Documentos cargados</h3>
            <button onClick={() => fileRef.current?.click()} className="btn-outline"><Upload size={15} /> Cargar documento</button>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.png" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setDocs([...docs, { name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB`, date: '20/10/2026', status: 'En revisión' }]); e.target.value = '' }} />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {docs.map((doc, i) => (
              <div key={doc.name + i} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e6edf8] p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[11px] font-bold text-red-600">PDF</span>
                <div className="min-w-0 flex-1"><p className="truncate text-[13.5px] font-semibold text-ink">{doc.name}</p><p className="text-[12px] text-slate-500">{doc.size} · Cargado el {doc.date}</p></div>
                <Badge tone={doc.status === 'Verificado' ? 'green' : 'orange'}>{doc.status}</Badge>
                <button className="rounded p-1 text-brand-700 hover:bg-brand-50" aria-label="Descargar"><Download size={16} /></button>
                {doc.status === 'En revisión' && <button onClick={() => setDocs(docs.filter((_, j) => j !== i))} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Quitar"><X size={16} /></button>}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card mt-4">
        <div className="card-head border-b border-[#eef2f8] !pb-3"><h3 className="card-title"><Shield size={18} className="text-brand-600" /> Seguridad</h3></div>
        <div className="grid gap-6 p-4 lg:grid-cols-[1.2fr_1fr] lg:p-5">
          <div><h4 className="mb-3 text-[15px] font-bold text-navy-800">Cambiar contraseña</h4><ChangePasswordForm /></div>
          <div className="space-y-3">
            <h4 className="text-[15px] font-bold text-navy-800">Notificaciones</h4>
            {([
              ['mail', 'Correo electrónico', rad ? 'Nuevas asignaciones y convocatorias' : 'Resultados disponibles de tus pacientes'],
              ['wa', 'WhatsApp', 'Avisos de estudios urgentes'],
              ['crit', 'Hallazgos críticos', rad ? 'Confirmación de notificación al referidor' : 'Alertas inmediatas de hallazgos críticos'],
            ] as const).map(([k, t, s]) => (
              <div key={k} className="flex items-center justify-between gap-3 rounded-xl border border-[#e6edf8] p-3.5">
                <div><p className="text-[13.5px] font-semibold text-ink">{t}</p><p className="text-[12px] text-slate-500">{s}</p></div>
                <Toggle on={notif[k]} onChange={(v) => setNotif({ ...notif, [k]: v })} />
              </div>
            ))}
            <div className="rounded-xl bg-brand-50 p-3.5 text-[12.5px] text-brand-800">
              Último acceso: 20/10/2026 07:02 a. m. · Chrome / Windows · 201.200.15.33
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
