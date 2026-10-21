import { useState } from 'react'
import { CheckCircle2, FilePlus2, Paperclip, Search, Send, UserCheck, UserX } from 'lucide-react'
import { Badge, Modal, Modality, Table, Tabs, clsx, type Tone } from '../../components/ui'
import { PortalHeading } from '../patient/PatientPortal'
import { RoleNotice, useDoctorRole } from './DoctorPortal'
import { useSesion } from '../../lib/session'
import { mensajeError } from '../../lib/api'
import { MOD_DESCRIPCION } from '../../lib/admin-data'
import {
  PRIORIDAD_DB, buscarPacientePorDocumento, crearSolicitud, fetchMisSolicitudes, listarHospitalesActivos, supabaseConfigurado, useDatos,
  type SolicitudReal,
} from '../../lib/portal-data'

type Req = { id: string; patient: string; record: string; study: string; mod: string; hospital: string; date: string; priority: 'Urgente' | 'Preferente' | 'Rutina'; status: string; tone: Tone }

const INITIAL: Req[] = [
  { id: 'SOL-2026-00412', patient: 'María Altagracia Rosario', record: 'HN-00045871', study: 'TC de cráneo simple', mod: 'CT', hospital: 'Hospital Hugo Mendoza', date: '20/10/2026', priority: 'Urgente', status: 'En lectura', tone: 'blue' },
  { id: 'SOL-2026-00409', patient: 'Ana Lucía Martínez', record: 'HN-00051230', study: 'RM de rodilla derecha', mod: 'MR', hospital: 'Hospital Dr. Francisco A. Gonzalvo', date: '19/10/2026', priority: 'Preferente', status: 'Realizado', tone: 'teal' },
  { id: 'SOL-2026-00405', patient: 'Luis Alberto Guzmán', record: 'HN-00033457', study: 'TC de abdomen con contraste', mod: 'CT', hospital: 'Hospital Dr. Francisco A. Gonzalvo', date: '18/10/2026', priority: 'Rutina', status: 'Programado', tone: 'orange' },
  { id: 'SOL-2026-00398', patient: 'Rafael Antonio Mejía', record: 'HN-00058812', study: 'Ecografía renal', mod: 'US', hospital: 'Hospital General', date: '18/10/2026', priority: 'Rutina', status: 'Pendiente de cita', tone: 'yellow' },
  { id: 'SOL-2026-00377', patient: 'Juan Pérez Gómez', record: 'HN-00012345', study: 'TC de cráneo simple', mod: 'CT', hospital: 'Hospital Hugo Mendoza', date: '10/03/2025', priority: 'Preferente', status: 'Resultado disponible', tone: 'green' },
  { id: 'SOL-2026-00370', patient: 'Carmen Julia Santos', record: 'HN-00060012', study: 'Mamografía bilateral', mod: 'MG', hospital: 'Hospital General', date: '09/10/2026', priority: 'Rutina', status: 'Resultado disponible', tone: 'green' },
  { id: 'SOL-2026-00361', patient: 'Pedro Antonio Reyes', record: 'HN-00028871', study: 'Ecografía abdominal', mod: 'US', hospital: 'Hospital Hugo Mendoza', date: '05/10/2026', priority: 'Preferente', status: 'Resultado disponible', tone: 'green' },
]

const PRIO_TONE: Record<Req['priority'], Tone> = { Urgente: 'red', Preferente: 'orange', Rutina: 'gray' }
const TABS = ['Todas', 'En proceso', 'Resultado disponible']

/** Color del estado de una solicitud real (o del estudio que generó) */
const TONO_ESTADO: Record<string, Tone> = {
  'Resultado disponible': 'green', Enviada: 'purple', Programada: 'orange', Realizada: 'teal', Cancelada: 'red',
  Nuevo: 'yellow', Asignado: 'blue', 'En lectura': 'blue', 'En revisión': 'blue', Informado: 'green', Cancelado: 'red',
}
const MODALIDADES_REAL = ['CT', 'MR', 'RX', 'US', 'MG', 'PET', 'NM', 'XA', 'OTROS']

/** Solicitud de la base → fila de la tabla */
const aReq = (s: SolicitudReal): Req => ({
  id: `SOL-${s.id.slice(0, 8).toUpperCase()}`, patient: s.patient, record: s.record, study: s.study, mod: s.mod, hospital: s.hospital,
  date: s.date, priority: s.priority, status: s.status, tone: TONO_ESTADO[s.status] ?? 'gray',
})

type PacienteEncontrado = { id: string; codigo: string; nombre_completo: string }
const FORM_INICIAL = { patient: '', cedula: '', mod: 'CT', study: '', region: '', hospital: 'Hospital Hugo Mendoza', priority: 'Rutina' as Req['priority'], indication: '', contrast: false }

export default function Solicitudes() {
  const { role } = useDoctorRole()
  const m = useSesion().sesion?.medico
  const referidor = m?.tipo === 'referidor' ? m.id : null
  const real = supabaseConfigurado
  const sol = useDatos<SolicitudReal[]>(() => (referidor ? fetchMisSolicitudes(referidor) : Promise.resolve([])), [], [referidor])
  const hosp = useDatos(() => (referidor ? listarHospitalesActivos() : Promise.resolve([])), [] as { id: string; nombre: string; servicios: string[] }[], [referidor])
  const [demo, setDemo] = useState(INITIAL)
  const [tab, setTab] = useState(0)
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [form, setForm] = useState(FORM_INICIAL)
  // Solo modo real: paciente buscado, hospital elegido, envío
  const [buscando, setBuscando] = useState(false)
  const [encontrado, setEncontrado] = useState<PacienteEncontrado | null | undefined>(undefined)
  const [hospitalId, setHospitalId] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  if (role !== 'referidor') return <RoleNotice needed="referidor" />

  const reqs = real ? sol.datos.map(aReq) : demo
  const list = reqs.filter((r) => tab === 0 || (tab === 2 ? r.status === 'Resultado disponible' : r.status !== 'Resultado disponible'))
  const valid = real
    ? Boolean(encontrado && form.study.trim() && form.indication.trim() && hospitalId)
    : form.patient.trim() && form.cedula.trim() && form.study.trim() && form.indication.trim()

  const submitDemo = () => {
    const id = `SOL-2026-00${413 + demo.length - INITIAL.length}`
    setDemo([{ id, patient: form.patient, record: 'HN-' + String(Math.floor(10000000 + Math.random() * 89999999)).slice(0, 8), study: form.study, mod: form.mod, hospital: form.hospital, date: '20/10/2026', priority: form.priority, status: 'Enviada', tone: 'purple' }, ...demo])
    setDone(id)
  }
  const submitReal = async () => {
    if (!m || !encontrado) return
    setEnviando(true); setErrorForm('')
    try {
      await crearSolicitud({
        medico_id: m.id, paciente_id: encontrado.id, hospital_id: hospitalId || null, modalidad: form.mod,
        descripcion: [form.study.trim(), form.region.trim()].filter(Boolean).join(' · '),
        prioridad: PRIORIDAD_DB[form.priority],
        indicacion: form.indication.trim() + (form.contrast ? '\nRequiere medio de contraste.' : ''),
      })
      setDone(`para ${encontrado.nombre_completo}`)
      await sol.recargar()
    } catch (e) {
      setErrorForm(`No se pudo enviar la solicitud: ${mensajeError(e)}`)
    } finally {
      setEnviando(false)
    }
  }
  const buscar = async () => {
    const doc = form.cedula.trim()
    if (!doc) return
    setBuscando(true); setErrorForm(''); setEncontrado(undefined)
    try { setEncontrado(await buscarPacientePorDocumento(doc)) } catch (e) { setErrorForm(`No se pudo buscar el paciente: ${mensajeError(e)}`) } finally { setBuscando(false) }
  }
  const reset = () => {
    setOpen(false); setDone(null); setForm(FORM_INICIAL)
    setEncontrado(undefined); setHospitalId(''); setErrorForm(''); setEnviando(false)
  }

  const cuenta = (v: number) => (sol.cargando && reqs.length === 0 ? '…' : sol.error ? '—' : String(v))
  const kpis = real
    ? [
      [cuenta(reqs.length), 'Solicitudes totales', 'text-navy-800'],
      [cuenta(reqs.filter((r) => r.status !== 'Resultado disponible' && r.status !== 'Cancelada').length), 'En proceso', 'text-orange-500'],
      [cuenta(reqs.filter((r) => r.status === 'Resultado disponible').length), 'Resultados disponibles', 'text-emerald-600'],
      [cuenta(reqs.filter((r) => r.priority === 'Urgente').length), 'Urgentes', 'text-red-600'],
    ]
    : [['214', 'Solicitudes totales', 'text-navy-800'], ['6', 'En proceso', 'text-orange-500'], ['9', 'Resultados disponibles', 'text-emerald-600'], ['2.1 días', 'Tiempo promedio a resultado', 'text-brand-600']]

  return (
    <div>
      <PortalHeading icon={FilePlus2} title="Solicitudes" subtitle="Solicitudes de estudios de imágenes enviadas a los hospitales de la red."
        actions={<button onClick={() => setOpen(true)} className="btn-primary"><FilePlus2 size={16} /> Nueva solicitud de estudio</button>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(([v, l, c]) => (
          <div key={l} className="card px-4 py-3"><p className={clsx('text-[22px] font-bold', c)}>{v}</p><p className="text-[12.5px] text-slate-500">{l}</p></div>
        ))}
      </div>

      <section className="card min-w-0">
        <Tabs tabs={TABS} active={tab} onChange={setTab} className="px-3" />
        <Table>
          <thead className="bg-[#f3f7fd]"><tr>{['N.º solicitud', 'Paciente', 'Estudio', 'Hospital', 'Fecha', 'Prioridad', 'Estado'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {real && sol.cargando && reqs.length === 0 && <tr><td colSpan={7} className="td py-8 text-center text-slate-500">Cargando solicitudes…</td></tr>}
            {real && !sol.cargando && sol.error && (
              <tr><td colSpan={7} className="td py-8 text-center text-red-600">No se pudieron cargar las solicitudes: {sol.error} <button onClick={sol.recargar} className="ml-2 font-semibold text-brand-600 hover:underline">Reintentar</button></td></tr>
            )}
            {real && !sol.cargando && !sol.error && list.length === 0 && (
              <tr><td colSpan={7} className="td py-8 text-center">
                {reqs.length === 0 ? 'Aún no has enviado solicitudes. Usa «Nueva solicitud de estudio» para referir a un paciente.' : 'No hay solicitudes en esta pestaña.'}
              </td></tr>
            )}
            {list.map((r) => (
              <tr key={r.id} className="tr">
                <td className="td whitespace-nowrap font-semibold text-brand-700">{r.id}</td>
                <td className="td"><p className="whitespace-nowrap font-semibold text-ink">{r.patient}</p><p className="text-[11px]">{r.record}</p></td>
                <td className="td"><span className="flex items-center gap-2 whitespace-nowrap"><Modality m={r.mod} /> {r.study}</span></td>
                <td className="td whitespace-nowrap">{r.hospital}</td>
                <td className="td whitespace-nowrap">{r.date}</td>
                <td className="td"><Badge tone={PRIO_TONE[r.priority]} dot={false}>{r.priority}</Badge></td>
                <td className="td"><Badge tone={r.tone}>{r.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>

      <Modal open={open} onClose={reset} className="max-w-[760px]" closeOnBackdrop={false}>
        <div className="max-h-[92vh] overflow-y-auto">
          <div className="border-b border-[#e6edf8] px-6 py-4 pr-14">
            <h2 className="flex items-center gap-2 text-[20px] font-bold text-navy-800"><FilePlus2 size={22} className="text-brand-600" /> Nueva solicitud de estudio</h2>
            <p className="text-[12.5px] text-slate-500">La solicitud se envía al hospital seleccionado y el paciente recibe una notificación para coordinar su cita.</p>
          </div>
          {done ? (
            <div className="p-8 text-center">
              <CheckCircle2 size={56} className="mx-auto fill-emerald-500 text-white" />
              <p className="mt-3 text-[19px] font-bold text-navy-800">Solicitud {done} enviada</p>
              <p className="mt-1 text-[13.5px] text-slate-600">Te notificaremos cuando el estudio sea realizado y el informe esté disponible.</p>
              <button onClick={reset} className="btn-primary mt-5">Entendido</button>
            </div>
          ) : (
            <form className="space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); if (valid && !enviando) { if (real) submitReal(); else submitDemo() } }}>
              <div>
                <p className="mb-2 text-[13px] font-bold uppercase tracking-wide text-brand-700">Paciente</p>
                {real ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">Cédula o pasaporte <span className="req">*</span></label>
                      <div className="flex gap-2">
                        <input className="input" value={form.cedula} placeholder="000-0000000-0"
                          onChange={(e) => { setForm({ ...form, cedula: e.target.value }); setEncontrado(undefined) }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscar() } }} />
                        <button type="button" onClick={buscar} disabled={!form.cedula.trim() || buscando} className="btn-outline shrink-0"><Search size={15} /> {buscando ? 'Buscando…' : 'Buscar'}</button>
                      </div>
                    </div>
                    <div className="flex items-end">
                      {encontrado ? (
                        <p className="flex w-full items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-800">
                          <UserCheck size={17} className="shrink-0" /> <span className="min-w-0"><b className="block truncate">{encontrado.nombre_completo}</b><span className="text-[12px]">{encontrado.codigo}</span></span>
                        </p>
                      ) : encontrado === null ? (
                        <p className="flex w-full items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-[13px] text-orange-700">
                          <UserX size={17} className="shrink-0" /> Paciente no encontrado: debe registrarse en la red.
                        </p>
                      ) : (
                        <p className="w-full rounded-lg bg-[#f7faff] px-3 py-2.5 text-[12.5px] text-slate-500">Busca al paciente por su documento para continuar.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className="label">Nombre completo <span className="req">*</span></label><input className="input" value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} placeholder="Nombre y apellidos" /></div>
                    <div><label className="label">Cédula <span className="req">*</span></label><input className="input" value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} placeholder="000-0000000-0" /></div>
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-[13px] font-bold uppercase tracking-wide text-brand-700">Estudio</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div><label className="label">Modalidad</label>
                    <select className="input" value={form.mod} onChange={(e) => setForm({ ...form, mod: e.target.value })}>
                      {real
                        ? MODALIDADES_REAL.map((x) => <option key={x} value={x}>{x} · {MOD_DESCRIPCION[x] ?? x}</option>)
                        : <><option value="CT">CT · Tomografía</option><option value="MR">MR · Resonancia</option><option value="RX">RX · Radiografía</option><option value="US">US · Ecografía</option><option value="MG">MG · Mamografía</option></>}
                    </select>
                  </div>
                  <div className="sm:col-span-2"><label className="label">Estudio solicitado <span className="req">*</span></label><input className="input" value={form.study} onChange={(e) => setForm({ ...form, study: e.target.value })} placeholder="Ej.: TC de tórax con contraste" /></div>
                  <div><label className="label">Región anatómica</label><input className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Ej.: Tórax" /></div>
                  <div className="sm:col-span-2"><label className="label">Hospital{real && <> <span className="req">*</span></>}</label>
                    {real ? (
                      <select className="input" value={hospitalId} onChange={(e) => setHospitalId(e.target.value)}>
                        <option value="">{hosp.cargando ? 'Cargando hospitales…' : hosp.datos.length ? 'Selecciona un hospital' : 'No hay hospitales activos'}</option>
                        {hosp.datos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                      </select>
                    ) : (
                      <select className="input" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })}>
                        <option>Hospital Hugo Mendoza</option><option>Hospital General</option><option>Hospital Dr. Francisco A. Gonzalvo</option>
                      </select>
                    )}
                    {real && hosp.error && <p className="mt-1 text-[12px] text-red-600">No se pudieron cargar los hospitales: {hosp.error}</p>}
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Prioridad</label>
                <div className="flex flex-wrap gap-2">
                  {(['Rutina', 'Preferente', 'Urgente'] as const).map((p) => (
                    <button type="button" key={p} onClick={() => setForm({ ...form, priority: p })}
                      className={clsx('rounded-lg border px-4 py-2 text-[13px] font-medium', form.priority === p
                        ? p === 'Urgente' ? 'border-red-500 bg-red-50 text-red-600' : p === 'Preferente' ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-[#d7e1f2] text-ink')}>{p}</button>
                  ))}
                </div>
              </div>
              <div><label className="label">Indicación clínica / sospecha diagnóstica <span className="req">*</span></label><textarea rows={3} className="input resize-none" value={form.indication} onChange={(e) => setForm({ ...form, indication: e.target.value })} placeholder="Describe el motivo del estudio" /></div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-[13px] text-ink"><input type="checkbox" className="accent-brand-600" checked={form.contrast} onChange={(e) => setForm({ ...form, contrast: e.target.checked })} /> Requiere medio de contraste</label>
                {!real && <button type="button" className="btn-ghost"><Paperclip size={15} /> Adjuntar documentos</button>}
              </div>
              {errorForm && <p className="rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-600">{errorForm}</p>}
              <div className="flex justify-end gap-2 border-t border-[#e6edf8] pt-4">
                <button type="button" onClick={reset} className="btn-outline">Cancelar</button>
                <button disabled={!valid || enviando} className="btn-primary"><Send size={15} /> {enviando ? 'Enviando…' : 'Enviar solicitud'}</button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  )
}
