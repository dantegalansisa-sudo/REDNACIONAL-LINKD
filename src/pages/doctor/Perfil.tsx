import { useRef, useState } from 'react'
import { Award, CheckCircle2, Download, FileText, MapPin, Pencil, Shield, Upload, User, UserRound, X } from 'lucide-react'
import { Badge, InfoRow, Toggle, UserSilhouette, clsx } from '../../components/ui'
import { ChangePasswordForm, PortalHeading } from '../patient/PatientPortal'
import { RoleSwitcher, useDoctorInfo, useDoctorRole } from './DoctorPortal'
import { useSesion } from '../../lib/session'
import { mensajeError, urlArchivo } from '../../lib/api'
import { fCedula, fFecha, fetchAccesos } from '../../lib/admin-data'
import { REGIONES } from '../../data/geo'
import { actualizarMedico, fetchMiFichaMedico, subirDocumentoMedico, supabaseConfigurado, useDatos, type FichaMedico } from '../../lib/portal-data'

const REGIONS = ['Ozama', 'Cibao Norte', 'Cibao Sur', 'Cibao Nordeste', 'Cibao Noroeste', 'Valdesia', 'Enriquillo', 'El Valle', 'Yuma', 'Higuamo']

type Doc = { name: string; size: string; date: string; status: 'Verificado' | 'En revisión' | 'Rechazado'; path?: string }

const tamano = (b: number | null) => (b == null ? '—' : b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const ESTADO_DOC: Record<string, Doc['status']> = { verificado: 'Verificado', rechazado: 'Rechazado', cargado: 'En revisión' }
const TIPO_DOC: Record<string, string> = { titulo: 'Título', exequatur: 'Exequátur', cedula: 'Cédula', especialidad: 'Especialidad', otros: 'Otro documento' }

/** Documentos de la base → formato de la pantalla */
const aDocs = (f: FichaMedico | null): Doc[] => (f?.medico_documentos ?? [])
  .slice().sort((a, b) => a.created_at.localeCompare(b.created_at))
  .map((x) => ({ name: x.nombre_archivo || TIPO_DOC[x.tipo] || x.tipo, size: tamano(x.tamano_bytes), date: fFecha(x.created_at), status: ESTADO_DOC[x.estado] ?? 'En revisión', path: x.archivo_path }))

export default function Perfil() {
  const { role } = useDoctorRole()
  const d = useDoctorInfo()
  const sesion = useSesion().sesion
  const m = sesion?.medico
  const real = supabaseConfigurado
  const rad = role === 'radiologo'
  const fileRef = useRef<HTMLInputElement>(null)
  const ficha = useDatos<FichaMedico | null>(() => (m ? fetchMiFichaMedico(m.id) : Promise.resolve(null)), null, [m?.id])
  const accesos = useDatos(() => fetchAccesos(sesion?.userId ?? null), [], [sesion?.userId])
  const [regions, setRegions] = useState<string[]>(rad ? ['Ozama', 'Cibao Norte', 'Valdesia'] : ['Ozama'])
  const [avail, setAvail] = useState(true)
  const [notif, setNotif] = useState({ mail: true, wa: true, crit: true })
  const [docs, setDocs] = useState<Doc[]>([
    { name: 'Exequátur.pdf', size: '420 KB', date: '15/01/2024', status: 'Verificado' },
    { name: 'Cédula de identidad.pdf', size: '310 KB', date: '15/01/2024', status: 'Verificado' },
    { name: rad ? 'Título de especialidad en Radiología.pdf' : 'Título de especialidad en Medicina Interna.pdf', size: '1.2 MB', date: '15/01/2024', status: 'Verificado' },
    { name: 'Certificado de colegiatura CMD.pdf', size: '280 KB', date: '02/10/2026', status: 'En revisión' },
  ])
  // ----- Solo datos reales -----
  const f = ficha.datos
  const [regReal, setRegReal] = useState<string[] | null>(null)
  const [dispReal, setDispReal] = useState<boolean | null>(null)
  const [tels, setTels] = useState<{ wa: string; res: string } | null>(null)
  const [aviso, setAviso] = useState<{ ok: boolean; t: string } | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const specialties = real
    ? [...(f?.especialidades ?? []), f?.otra_especialidad].filter(Boolean) as string[]
    : rad ? ['Radiología e Imágenes Diagnósticas', 'Neurorradiología', 'Imagen musculoesquelética'] : ['Medicina Interna', 'Cardiología clínica']
  const regionList = real ? REGIONES : REGIONS
  const regionesSel = real ? (regReal ?? f?.regiones_interes ?? []) : regions
  const disponible = real ? (dispReal ?? f?.disponible ?? true) : avail
  const listaDocs = real ? aDocs(f) : docs
  const miembro = real ? (f ? fFecha(f.created_at).slice(3) : '—') : '01/2024'
  const ultimo = accesos.datos[0]

  const guardar = async (cambios: Partial<FichaMedico>, okMsg: string, revertir: () => void) => {
    if (!m) return
    setAviso(null)
    try {
      await actualizarMedico(m.id, cambios)
      setAviso({ ok: true, t: okMsg })
    } catch (e) {
      revertir()
      setAviso({ ok: false, t: `No se pudieron guardar los cambios: ${mensajeError(e)}` })
    }
  }
  const toggleRegion = (r: string) => {
    const on = regionesSel.includes(r)
    const nuevas = on ? regionesSel.filter((x) => x !== r) : [...regionesSel, r]
    if (!real) { setRegions(nuevas); return }
    const antes = regionesSel
    setRegReal(nuevas)
    guardar({ regiones_interes: nuevas }, 'Regiones de interés guardadas.', () => setRegReal(antes))
  }
  const cambiarDisponible = (v: boolean) => {
    if (!real) { setAvail(v); return }
    setDispReal(v)
    guardar({ disponible: v }, v ? 'Ahora estás disponible para asignaciones.' : 'Asignaciones pausadas temporalmente.', () => setDispReal(!v))
  }
  const guardarTelefonos = async () => {
    if (!tels || !m) return
    setGuardando(true)
    await guardar({ tel_whatsapp: tels.wa.trim() || null, tel_residencia: tels.res.trim() || null }, 'Teléfonos actualizados.', () => {})
    setGuardando(false)
    setTels(null)
    await ficha.recargar()
  }
  const subir = async (file: File) => {
    if (!real) { setDocs([...docs, { name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, date: '20/10/2026', status: 'En revisión' }]); return }
    if (!m || !sesion) return
    setSubiendo(true); setAviso(null)
    try {
      await subirDocumentoMedico(m.id, sesion.userId, 'otros', file)
      setAviso({ ok: true, t: `Documento «${file.name}» cargado. Quedará en revisión hasta que el SNS lo verifique.` })
      await ficha.recargar()
    } catch (e) {
      setAviso({ ok: false, t: `No se pudo cargar el documento: ${mensajeError(e)}` })
    } finally {
      setSubiendo(false)
    }
  }
  const descargar = async (doc: Doc) => {
    if (!doc.path) return
    try { window.open(await urlArchivo('documentos-medicos', doc.path), '_blank', 'noopener') } catch (e) { setAviso({ ok: false, t: `No se pudo abrir el documento: ${mensajeError(e)}` }) }
  }

  return (
    <div>
      <PortalHeading icon={User} title="Mi perfil" subtitle="Datos profesionales, documentación y seguridad de tu cuenta." actions={<RoleSwitcher />} />

      {real && ficha.error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">No se pudo cargar tu ficha: {ficha.error} <button onClick={ficha.recargar} className="ml-1 font-semibold text-brand-600 hover:underline">Reintentar</button></p>
      )}
      {aviso && (
        <p className={clsx('mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-[13px]', aviso.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
          {aviso.t} <button onClick={() => setAviso(null)} aria-label="Cerrar"><X size={15} /></button>
        </p>
      )}

      <section className="card mb-4 flex flex-col items-center gap-5 p-5 sm:flex-row">
        {d.photo ? <img src={d.photo} alt={d.name} className="h-28 w-28 rounded-full border-4 border-brand-100 object-cover" /> : <UserSilhouette size={112} />}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="text-[23px] font-bold text-navy-800">{d.name}</h2>
          <p className="text-[15px] font-semibold text-brand-700">{d.code} · Exequátur {d.exequatur}</p>
          <p className="text-[13px] text-slate-500">{d.specialty}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Badge tone="green" icon>Cuenta verificada</Badge>
            <Badge tone="blue">Miembro desde {miembro}</Badge>
          </div>
        </div>
        {rad && (
          <div className="flex items-center gap-3 rounded-xl border border-[#e6edf8] px-4 py-3">
            <div><p className="text-[13.5px] font-semibold text-ink">Disponible para asignaciones</p><p className="text-[12px] text-slate-500">{disponible ? 'Recibiendo estudios nuevos' : 'Pausado temporalmente'}</p></div>
            <Toggle on={disponible} onChange={cambiarDisponible} />
          </div>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-navy-800"><UserRound size={18} className="text-brand-600" /> Datos profesionales</h3>
            {real && f && !tels && <button onClick={() => setTels({ wa: f.tel_whatsapp ?? '', res: f.tel_residencia ?? '' })} className="btn-ghost !px-2 !py-1 !text-[12.5px]"><Pencil size={14} /> Editar teléfonos</button>}
          </div>
          <InfoRow label="Nombre completo">{d.name}</InfoRow>
          <InfoRow label="Código RNS">{d.code}</InfoRow>
          <InfoRow label="Exequátur">{d.exequatur}</InfoRow>
          {real
            ? <InfoRow label="Cédula">{f ? fCedula(f.cedula) : '…'}</InfoRow>
            : <InfoRow label="Colegiatura CMD">{rad ? 'CMD-08812' : 'CMD-11204'}</InfoRow>}
          <InfoRow label="Correo">{real ? (f?.correo ?? d.email) : d.email}</InfoRow>
          {real ? (
            tels ? (
              <div className="space-y-2 border-b border-[#eef2f8] py-2.5">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><label className="label">Teléfono / WhatsApp</label><input className="input" value={tels.wa} onChange={(e) => setTels({ ...tels, wa: e.target.value })} placeholder="809-000-0000" /></div>
                  <div><label className="label">Teléfono residencial</label><input className="input" value={tels.res} onChange={(e) => setTels({ ...tels, res: e.target.value })} placeholder="809-000-0000" /></div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setTels(null)} className="btn-outline !py-1.5">Cancelar</button>
                  <button onClick={guardarTelefonos} disabled={guardando} className="btn-primary !py-1.5">{guardando ? 'Guardando…' : 'Guardar'}</button>
                </div>
              </div>
            ) : <>
              <InfoRow label="Teléfono / WhatsApp">{f?.tel_whatsapp || '—'}</InfoRow>
              <InfoRow label="Teléfono residencial">{f?.tel_residencia || '—'}</InfoRow>
            </>
          ) : <InfoRow label="Teléfono / WhatsApp">{d.phone}</InfoRow>}
          {real && !rad && <InfoRow label="Centro de trabajo">{f?.centro_trabajo || '—'}</InfoRow>}
          <InfoRow label="Rol en la red">{rad ? 'Médico radiólogo (lector)' : 'Médico referidor'}</InfoRow>
        </section>

        <section className="card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-navy-800"><Award size={18} className="text-brand-600" /> Especialidades</h3>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => <span key={s} className="rounded-full bg-brand-50 px-3 py-1 text-[12.5px] font-medium text-brand-700">{s}</span>)}
            {real && specialties.length === 0 && <span className="text-[12.5px] text-slate-500">{ficha.cargando ? 'Cargando…' : 'Sin especialidades registradas.'}</span>}
          </div>
          <h3 className="mb-2 mt-5 flex items-center gap-2 text-[15px] font-bold text-navy-800"><MapPin size={18} className="text-brand-600" /> Región de interés</h3>
          <p className="mb-2 text-[12.5px] text-slate-500">{rad ? 'Recibirás convocatorias y asignaciones de estas regiones de salud.' : 'Regiones donde refieres pacientes con mayor frecuencia.'}</p>
          <div className="flex flex-wrap gap-2">
            {regionList.map((r) => {
              const on = regionesSel.includes(r)
              return (
                <button key={r} disabled={real && !f} onClick={() => toggleRegion(r)}
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
            <button onClick={() => fileRef.current?.click()} disabled={subiendo || (real && !f)} className="btn-outline"><Upload size={15} /> {subiendo ? 'Cargando…' : 'Cargar documento'}</button>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.png" className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) subir(file); e.target.value = '' }} />
          </div>
          {real && listaDocs.length === 0 && <p className="text-[13px] text-slate-500">{ficha.cargando ? 'Cargando documentos…' : 'No tienes documentos cargados.'}</p>}
          <div className="grid gap-2 md:grid-cols-2">
            {listaDocs.map((doc, i) => (
              <div key={doc.name + i} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e6edf8] p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[11px] font-bold text-red-600">{real ? (doc.name.split('.').pop() ?? 'DOC').slice(0, 4).toUpperCase() : 'PDF'}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-[13.5px] font-semibold text-ink">{doc.name}</p><p className="text-[12px] text-slate-500">{doc.size} · Cargado el {doc.date}</p></div>
                <Badge tone={doc.status === 'Verificado' ? 'green' : doc.status === 'Rechazado' ? 'red' : 'orange'}>{doc.status}</Badge>
                <button onClick={() => descargar(doc)} className="rounded p-1 text-brand-700 hover:bg-brand-50" aria-label="Descargar"><Download size={16} /></button>
                {!real && doc.status === 'En revisión' && <button onClick={() => setDocs(docs.filter((_, j) => j !== i))} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Quitar"><X size={16} /></button>}
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
              {real
                ? ultimo ? `Último acceso: ${ultimo.f} · ${ultimo.nav} · ${ultimo.ip}` : accesos.cargando ? 'Último acceso: cargando…' : 'Último acceso: sin registros.'
                : 'Último acceso: 20/10/2026 07:02 a. m. · Chrome / Windows · 201.200.15.33'}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
