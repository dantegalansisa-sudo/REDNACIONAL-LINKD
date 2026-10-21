import { useEffect, useState } from 'react'
import { CheckCircle2, ExternalLink, FileText, RefreshCw, UserPlus, XCircle } from 'lucide-react'
import { Badge, Modal, MoreLink, Panel, Table } from '../../components/ui'
import {
  aprobarMedico, listarSolicitudesMedicos, mensajeError, rechazarMedico, supabaseConfigurado, urlArchivo, type MedicoPendiente,
} from '../../lib/api'

type Demo = { f: string; n: string; e: string; s: string }

const TONO: Record<string, 'green' | 'orange' | 'red' | 'gray'> = { aprobado: 'green', pendiente: 'orange', rechazado: 'red', suspendido: 'gray' }
const ETIQUETA: Record<string, string> = { aprobado: 'Aprobado', pendiente: 'Pendiente', rechazado: 'Rechazado', suspendido: 'Suspendido' }
const DOC: Record<string, string> = { titulo: 'Título de Médico', exequatur: 'Registro de Exequátur', cedula: 'Cédula de Identidad', especialidad: 'Certificación de Especialidad', otros: 'Otros documentos' }

const fecha = (iso: string) => new Date(iso).toLocaleString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** Solicitudes de registro de médicos: con Supabase muestra las reales y permite aprobarlas o rechazarlas */
export function SolicitudesRegistro({ demo }: { demo: Demo[] }) {
  const [lista, setLista] = useState<MedicoPendiente[]>([])
  const [cargando, setCargando] = useState(supabaseConfigurado)
  const [error, setError] = useState('')
  const [sel, setSel] = useState<MedicoPendiente | null>(null)

  const cargar = async () => {
    setCargando(true); setError('')
    try { setLista(await listarSolicitudesMedicos()) } catch (e) { setError(mensajeError(e)) } finally { setCargando(false) }
  }
  useEffect(() => { if (supabaseConfigurado) cargar() }, [])

  const pendientes = lista.filter((m) => m.estado_registro === 'pendiente').length

  return (
    <Panel title="Últimas solicitudes de registro" icon={UserPlus} bodyClass="px-0 pb-2"
      subtitle={supabaseConfigurado ? `${pendientes} pendiente(s) de aprobación` : undefined}
      action={supabaseConfigurado
        ? <button onClick={cargar} className="link-more"><RefreshCw size={13} className={cargando ? 'animate-spin' : ''} /> Actualizar</button>
        : <MoreLink>Ver todas</MoreLink>}>
      <Table>
        <thead className="bg-[#f6f9fe]"><tr>{['Fecha', 'Nombre', 'Especialidad', 'Estado'].map((x) => <th key={x} className="th">{x}</th>)}</tr></thead>
        <tbody>
          {!supabaseConfigurado && demo.map((s) => (
            <tr key={s.f} className="tr">
              <td className="td whitespace-nowrap tabular-nums">{s.f}</td>
              <td className="td whitespace-nowrap">{s.n}</td>
              <td className="td">{s.e}</td>
              <td className="td"><Badge tone={s.s === 'Aprobado' ? 'green' : 'orange'}>{s.s}</Badge></td>
            </tr>
          ))}
          {supabaseConfigurado && lista.map((m) => (
            <tr key={m.id} className="tr cursor-pointer" onClick={() => setSel(m)} title="Ver solicitud">
              <td className="td whitespace-nowrap tabular-nums">{fecha(m.created_at)}</td>
              <td className="td whitespace-nowrap">{m.tratamiento} {m.nombre_completo}<span className="block text-[11px] text-slate-400">{m.tipo === 'radiologo' ? 'Radiólogo' : 'Referidor'} · Exeq. {m.exequatur}</span></td>
              <td className="td">{m.especialidades.join(', ') || '—'}</td>
              <td className="td"><Badge tone={TONO[m.estado_registro] ?? 'gray'}>{ETIQUETA[m.estado_registro] ?? m.estado_registro}</Badge></td>
            </tr>
          ))}
          {supabaseConfigurado && !cargando && !lista.length && !error && (
            <tr><td colSpan={4} className="td py-6 text-center text-slate-400">Aún no hay solicitudes de registro.</td></tr>
          )}
          {error && <tr><td colSpan={4} className="td py-4 text-center text-red-600">{error}</td></tr>}
        </tbody>
      </Table>
      <DetalleSolicitud m={sel} onClose={() => setSel(null)} onCambio={() => { setSel(null); cargar() }} />
    </Panel>
  )
}

function DetalleSolicitud({ m, onClose, onCambio }: { m: MedicoPendiente | null; onClose: () => void; onCambio: () => void }) {
  const [foto, setFoto] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [rechazando, setRechazando] = useState(false)
  const [trabajando, setTrabajando] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setFoto(null); setMotivo(''); setRechazando(false); setMsg('')
    if (m?.foto_path) urlArchivo('fotos-perfil', m.foto_path).then(setFoto).catch(() => {})
  }, [m])

  if (!m) return null
  const abrirDoc = async (path: string) => {
    try { window.open(await urlArchivo('documentos-medicos', path), '_blank', 'noopener') } catch (e) { setMsg(mensajeError(e)) }
  }
  const accion = async (fn: () => Promise<void>) => {
    setTrabajando(true); setMsg('')
    try { await fn(); onCambio() } catch (e) { setMsg(mensajeError(e)) } finally { setTrabajando(false) }
  }

  return (
    <Modal open onClose={onClose} className="max-w-[720px]">
      <div className="p-6">
        <div className="flex items-center gap-4 pr-10">
          {foto ? <img src={foto} alt="" className="h-20 w-20 rounded-xl object-cover" /> : <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-brand-50 text-[11px] text-slate-400">Sin foto</span>}
          <div>
            <h3 className="text-[20px] font-bold text-ink">{m.tratamiento} {m.nombre_completo}</h3>
            <p className="text-[13px] text-slate-500">{m.tipo === 'radiologo' ? 'Médico radiólogo' : 'Médico referidor'} · {m.codigo}</p>
            <Badge tone={TONO[m.estado_registro] ?? 'gray'} className="mt-1">{ETIQUETA[m.estado_registro]}</Badge>
          </div>
        </div>
        <div className="mt-5 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
          {[['Exequátur', m.exequatur], ['Cédula', m.cedula ?? '—'], ['Correo', m.correo], ['WhatsApp', m.tel_whatsapp ?? '—'],
            ['Especialidades', m.especialidades.join(', ') || '—'], ['Regiones de interés', m.regiones_interes.join(', ') || '—'], ['Registrado', fecha(m.created_at)]].map(([l, v]) => (
            <div key={l} className="border-b border-[#eef2f8] py-1.5"><span className="text-slate-500">{l}: </span><span className="text-ink">{v}</span></div>
          ))}
        </div>
        <h4 className="mt-5 text-[14px] font-bold text-ink">Documentos</h4>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {m.medico_documentos.length === 0 && <p className="text-[13px] text-slate-400">No subió documentos.</p>}
          {m.medico_documentos.map((d) => (
            <button key={d.id} onClick={() => abrirDoc(d.archivo_path)} className="flex items-center gap-2 rounded-lg border border-[#e6edf8] p-2.5 text-left hover:bg-brand-50">
              <FileText size={18} className="shrink-0 text-brand-600" />
              <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-semibold text-ink">{DOC[d.tipo] ?? d.tipo}</span><span className="block truncate text-[11.5px] text-slate-500">{d.nombre_archivo}</span></span>
              <ExternalLink size={14} className="text-slate-400" />
            </button>
          ))}
        </div>

        {rechazando && (
          <div className="mt-4">
            <label className="label">Motivo del rechazo (se enviará al médico)</label>
            <textarea className="input" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: El documento de exequátur no es legible." />
          </div>
        )}
        {msg && <p className="mt-3 text-[13px] text-red-600">{msg}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {m.estado_registro !== 'rechazado' && (rechazando
            ? <button disabled={trabajando || !motivo.trim()} onClick={() => accion(() => rechazarMedico(m.id, motivo.trim()))} className="btn border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"><XCircle size={16} /> Confirmar rechazo</button>
            : <button disabled={trabajando} onClick={() => setRechazando(true)} className="btn border border-red-200 text-red-600 hover:bg-red-50"><XCircle size={16} /> Rechazar</button>)}
          {m.estado_registro !== 'aprobado'
            ? <button disabled={trabajando} onClick={() => accion(() => aprobarMedico(m))} className="btn-primary"><CheckCircle2 size={16} /> {trabajando ? 'Procesando…' : 'Aprobar y enviar acceso'}</button>
            : <button disabled={trabajando} onClick={() => accion(() => aprobarMedico(m))} className="btn-outline">Reenviar correo de acceso</button>}
        </div>
        <p className="mt-3 text-right text-[11.5px] text-slate-400">Al aprobar, el médico recibe un correo para crear su contraseña.</p>
      </div>
    </Modal>
  )
}
