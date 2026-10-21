import { useMemo, useState } from 'react'
import {
  AlertTriangle, CheckCircle2, ClipboardList, Clock, Contrast, Eye, FileSignature, Maximize2, Minus, Plus, RotateCw, Save, Sun, Timer,
} from 'lucide-react'
import { Badge, Modal, Modality, Select, Table, clsx, type Tone } from '../../components/ui'
import { PortalHeading } from '../patient/PatientPortal'
import { RoleNotice, useDoctorRole, useDoctorInfo } from './DoctorPortal'

export type Priority = 'Urgente' | 'Alta' | 'Normal'
export type WorkItem = {
  id: string; patient: string; record: string; age: string; study: string; mod: string; hospital: string; received: string
  priority: Priority; remaining: string; pct: number; img: string; referrer: string; indication: string
  status: 'Pendiente' | 'En lectura' | 'Borrador' | 'Firmado'
}

export const WORKLIST: WorkItem[] = [
  { id: 'EST-2025-001204', patient: 'María Altagracia Rosario', record: 'HN-00045871', age: '62 F', study: 'TC de cráneo simple', mod: 'CT', hospital: 'Hospital Hugo Mendoza', received: '20/10/2026 08:12 a. m.', priority: 'Urgente', remaining: '00:38 min', pct: 82, img: '/img/crops/ct-cerebro.webp', referrer: 'Dr. Luis Fernando González Santana', indication: 'Cefalea súbita intensa, descartar sangrado.', status: 'Pendiente' },
  { id: 'EST-2025-001198', patient: 'José Miguel Peña', record: 'HN-00039214', age: '45 M', study: 'Radiografía de tórax PA', mod: 'RX', hospital: 'Hospital General', received: '20/10/2026 07:55 a. m.', priority: 'Urgente', remaining: '01:05 h', pct: 64, img: '/img/crops/rx-torax.webp', referrer: 'Dra. Carmen Batista', indication: 'Disnea y fiebre de 3 días.', status: 'Pendiente' },
  { id: 'EST-2025-001187', patient: 'Ana Lucía Martínez', record: 'HN-00051230', age: '38 F', study: 'RM de rodilla derecha', mod: 'MR', hospital: 'Hospital Dr. Francisco A. Gonzalvo', received: '20/10/2026 07:20 a. m.', priority: 'Alta', remaining: '03:20 h', pct: 45, img: '/img/crops/mr.webp', referrer: 'Dr. Luis Fernando González Santana', indication: 'Dolor y bloqueo articular tras trauma deportivo.', status: 'En lectura' },
  { id: 'EST-2025-001176', patient: 'Pedro Antonio Reyes', record: 'HN-00028871', age: '57 M', study: 'Ecografía abdominal', mod: 'US', hospital: 'Hospital Hugo Mendoza', received: '19/10/2026 05:40 p. m.', priority: 'Alta', remaining: '04:10 h', pct: 38, img: '/img/crops/us.webp', referrer: 'Dra. Carmen Batista', indication: 'Dolor en hipocondrio derecho.', status: 'Pendiente' },
  { id: 'EST-2025-001169', patient: 'Carmen Julia Santos', record: 'HN-00060012', age: '49 F', study: 'Mamografía bilateral', mod: 'MG', hospital: 'Hospital General', received: '19/10/2026 03:15 p. m.', priority: 'Normal', remaining: '18:45 h', pct: 22, img: '/img/crops/mg.webp', referrer: 'Dr. Ramón Almánzar', indication: 'Tamizaje anual.', status: 'Borrador' },
  { id: 'EST-2025-001158', patient: 'Luis Alberto Guzmán', record: 'HN-00033457', age: '70 M', study: 'TC de abdomen con contraste', mod: 'CT', hospital: 'Hospital Dr. Francisco A. Gonzalvo', received: '19/10/2026 11:02 a. m.', priority: 'Normal', remaining: '20:30 h', pct: 15, img: '/img/crops/ct-cerebro.webp', referrer: 'Dr. Luis Fernando González Santana', indication: 'Control oncológico.', status: 'Pendiente' },
  { id: 'EST-2025-001149', patient: 'Rosa Elena Jiménez', record: 'HN-00047719', age: '33 F', study: 'Radiografía de columna lumbar', mod: 'RX', hospital: 'Hospital Hugo Mendoza', received: '19/10/2026 09:48 a. m.', priority: 'Normal', remaining: '22:10 h', pct: 10, img: '/img/crops/rx-torax.webp', referrer: 'Dra. Carmen Batista', indication: 'Lumbalgia crónica.', status: 'Pendiente' },
  { id: 'EST-2025-001137', patient: 'Juan Pérez Gómez', record: 'HN-00012345', age: '45 M', study: 'Ecografía tiroidea', mod: 'US', hospital: 'Hospital General', received: '18/10/2026 04:30 p. m.', priority: 'Normal', remaining: '23:05 h', pct: 6, img: '/img/crops/us.webp', referrer: 'Dr. Luis Fernando González Santana', indication: 'Seguimiento de quiste tiroideo.', status: 'Pendiente' },
]

export const PRIORITY_TONE: Record<Priority, Tone> = { Urgente: 'red', Alta: 'orange', Normal: 'blue' }
const STATUS_TONE: Record<WorkItem['status'], Tone> = { Pendiente: 'gray', 'En lectura': 'blue', Borrador: 'yellow', Firmado: 'green' }

/* ---------- Modal: redactar informe ---------- */
export function ReportEditor({ item, onClose, onSaved }: { item: WorkItem | null; onClose: () => void; onSaved?: (id: string, status: WorkItem['status']) => void }) {
  const firma = useDoctorInfo()
  const [tech, setTech] = useState('')
  const [find, setFind] = useState('')
  const [imp, setImp] = useState('')
  const [zoom, setZoom] = useState(1)
  const [rot, setRot] = useState(0)
  const [inv, setInv] = useState(false)
  const [bright, setBright] = useState(1)
  const [msg, setMsg] = useState<'' | 'draft' | 'signed'>('')
  const [confirm, setConfirm] = useState(false)
  const [lastId, setLastId] = useState<string | null>(null)

  if (item && item.id !== lastId) {
    setLastId(item.id)
    setTech(`Estudio de ${item.study.toLowerCase()} realizado según protocolo institucional.`)
    setFind('')
    setImp('')
    setZoom(1); setRot(0); setInv(false); setBright(1); setMsg(''); setConfirm(false)
  }

  const template = () => {
    setFind('1. \n2. \n3. Sin otros hallazgos significativos.')
    setImp('1. ')
  }
  const canSign = find.trim().length > 5 && imp.trim().length > 3

  return (
    <Modal open={!!item} onClose={onClose} className="max-w-[1280px]" closeOnBackdrop={false}>
      {item && (
        <div className="flex max-h-[94vh] flex-col">
          <div className="flex flex-wrap items-center gap-3 border-b border-[#e6edf8] px-5 py-3 pr-14">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white"><FileSignature size={20} /></span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[18px] font-bold text-navy-800">Redactar informe</h2>
              <p className="truncate text-[12.5px] text-slate-500">{item.id} · {item.patient} ({item.age}) · {item.record}</p>
            </div>
            <Badge tone={PRIORITY_TONE[item.priority]}>{item.priority}</Badge>
            <span className="flex items-center gap-1 text-[12.5px] font-semibold text-red-600"><Timer size={15} /> {item.remaining}</span>
          </div>
          <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
            {/* Visor */}
            <div className="flex min-h-[340px] flex-col bg-[#0b1220] text-white">
              <div className="flex flex-wrap items-center gap-1 border-b border-white/10 px-3 py-2">
                {[
                  { i: Plus, l: 'Acercar', f: () => setZoom((z) => Math.min(3, z + 0.25)) },
                  { i: Minus, l: 'Alejar', f: () => setZoom((z) => Math.max(0.5, z - 0.25)) },
                  { i: RotateCw, l: 'Rotar', f: () => setRot((r) => r + 90) },
                  { i: Contrast, l: 'Invertir', f: () => setInv((v) => !v) },
                  { i: Sun, l: 'Brillo', f: () => setBright((b) => (b >= 1.6 ? 0.8 : b + 0.2)) },
                  { i: Maximize2, l: 'Restablecer', f: () => { setZoom(1); setRot(0); setInv(false); setBright(1) } },
                ].map((t) => (
                  <button key={t.l} onClick={t.f} title={t.l} className="rounded-md bg-white/5 p-2 hover:bg-white/15"><t.i size={16} /></button>
                ))}
                <Modality m={item.mod} className="ml-auto" />
              </div>
              <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
                <img src={item.img} alt={item.study} className="h-[56vh] w-auto max-w-full object-contain transition-transform"
                  style={{ transform: `scale(${zoom}) rotate(${rot}deg)`, filter: `${inv ? 'invert(1) ' : ''}brightness(${bright})` }} />
                <div className="pointer-events-none absolute left-3 top-3 text-[11px] text-white/80"><p>{item.patient}</p><p>{item.record} · {item.age}</p></div>
                <div className="pointer-events-none absolute right-3 top-3 text-right text-[11px] text-white/80"><p>{item.hospital}</p><p>{item.received}</p></div>
                <div className="pointer-events-none absolute bottom-3 left-3 text-[11px] text-white/80"><p>{item.study}</p><p>Zoom {Math.round(zoom * 100)}%</p></div>
              </div>
            </div>
            {/* Editor */}
            <div className="flex min-h-0 flex-col lg:overflow-y-auto">
              <div className="space-y-3 p-5">
                <div className="grid gap-2 rounded-lg bg-[#f7faff] p-3 text-[12.5px] sm:grid-cols-2">
                  <p><span className="text-slate-500">Estudio: </span><b className="text-ink">{item.study}</b></p>
                  <p><span className="text-slate-500">Centro: </span><span className="text-ink">{item.hospital}</span></p>
                  <p><span className="text-slate-500">Referidor: </span><span className="text-ink">{item.referrer}</span></p>
                  <p className="sm:col-span-2"><span className="text-slate-500">Indicación clínica: </span><span className="text-ink">{item.indication}</span></p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-ink">Plantilla</p>
                  <div className="flex gap-2">
                    <select className="input !w-auto !py-1.5"><option>Plantilla estándar {item.mod}</option><option>Normal</option><option>Hallazgos múltiples</option></select>
                    <button onClick={template} className="btn-outline !py-1.5">Aplicar</button>
                  </div>
                </div>
                <div><label className="label">Técnica</label><textarea rows={2} value={tech} onChange={(e) => setTech(e.target.value)} className="input resize-y" /></div>
                <div><label className="label">Hallazgos <span className="req">*</span></label><textarea rows={7} value={find} onChange={(e) => setFind(e.target.value)} className="input resize-y" placeholder="Describe los hallazgos del estudio…" /></div>
                <div><label className="label">Impresión diagnóstica <span className="req">*</span></label><textarea rows={3} value={imp} onChange={(e) => setImp(e.target.value)} className="input resize-y" placeholder="Conclusión diagnóstica…" /></div>
                <label className="flex items-center gap-2 text-[12.5px] text-ink"><input type="checkbox" className="accent-brand-600" /> Marcar como hallazgo crítico y notificar al referidor</label>
                {msg === 'draft' && <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] text-amber-700"><Save size={15} /> Borrador guardado a las {new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}.</p>}
                {msg === 'signed' && <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-700"><CheckCircle2 size={15} /> Informe firmado y publicado. El paciente y el referidor fueron notificados.</p>}
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#e6edf8] bg-[#f7faff] px-5 py-3">
                <p className="text-[12px] text-slate-500">Firma: {firma.name} · Exequátur {firma.exequatur}</p>
                <div className="flex gap-2">
                  <button disabled={msg === 'signed'} onClick={() => { setMsg('draft'); onSaved?.(item.id, 'Borrador') }} className="btn-outline"><Save size={16} /> Guardar borrador</button>
                  <button disabled={!canSign || msg === 'signed'} onClick={() => setConfirm(true)} className="btn-primary"><FileSignature size={16} /> Firmar y publicar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirm && item && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-navy-950/40 p-4">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 text-center shadow-2xl">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600"><FileSignature size={26} /></span>
            <h3 className="mt-3 text-[18px] font-bold text-navy-800">¿Firmar y publicar el informe?</h3>
            <p className="mt-1 text-[13px] text-slate-600">Una vez publicado, el informe quedará disponible para el paciente y el médico referidor. Las correcciones posteriores se registran como adenda.</p>
            <div className="mt-5 flex justify-center gap-2">
              <button onClick={() => setConfirm(false)} className="btn-outline">Cancelar</button>
              <button onClick={() => { setConfirm(false); setMsg('signed'); onSaved?.(item.id, 'Firmado') }} className="btn-primary">Firmar ahora</button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function Worklist() {
  const { role } = useDoctorRole()
  const [items, setItems] = useState(WORKLIST)
  const [prio, setPrio] = useState('Todas las prioridades')
  const [mod, setMod] = useState('Todas las modalidades')
  const [hosp, setHosp] = useState('Todos los hospitales')
  const [open, setOpen] = useState<WorkItem | null>(null)

  const list = useMemo(() => items.filter((w) =>
    (prio === 'Todas las prioridades' || w.priority === prio) &&
    (mod === 'Todas las modalidades' || w.mod === mod) &&
    (hosp === 'Todos los hospitales' || w.hospital === hosp)), [items, prio, mod, hosp])

  if (role !== 'radiologo') return <RoleNotice needed="radiologo" />

  const pending = items.filter((i) => i.status !== 'Firmado')
  const stats = [
    { label: 'Pendientes', value: pending.length, cls: 'text-ink', icon: ClipboardList },
    { label: 'Urgentes', value: pending.filter((i) => i.priority === 'Urgente').length, cls: 'text-red-600', icon: AlertTriangle },
    { label: 'Prioridad alta', value: pending.filter((i) => i.priority === 'Alta').length, cls: 'text-orange-500', icon: Clock },
    { label: 'Firmados hoy', value: items.filter((i) => i.status === 'Firmado').length + 14, cls: 'text-emerald-600', icon: CheckCircle2 },
  ]

  return (
    <div>
      <PortalHeading icon={ClipboardList} title="Lista de trabajo" subtitle="Estudios asignados pendientes de lectura, ordenados por prioridad y tiempo de respuesta." />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-3 px-4 py-3">
            <s.icon size={22} className={s.cls} />
            <div><p className={clsx('text-[22px] font-bold leading-none', s.cls)}>{s.value}</p><p className="text-[12.5px] text-slate-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <section className="card min-w-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#eef2f8] p-3">
          <Select options={['Todas las prioridades', 'Urgente', 'Alta', 'Normal']} onChange={setPrio} className="w-full sm:w-[200px]" />
          <Select options={['Todas las modalidades', 'CT', 'MR', 'RX', 'US', 'MG']} onChange={setMod} className="w-full sm:w-[200px]" />
          <Select options={['Todos los hospitales', 'Hospital Hugo Mendoza', 'Hospital General', 'Hospital Dr. Francisco A. Gonzalvo']} onChange={setHosp} className="w-full sm:w-[260px]" />
          <span className="ml-auto text-[12.5px] text-slate-500">{list.length} estudios</span>
        </div>
        <Table>
          <thead className="bg-[#f3f7fd]">
            <tr>{['Prioridad', 'Paciente', 'Estudio', 'Mod.', 'Hospital', 'Recibido', 'Tiempo restante', 'Estado', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {list.map((w) => (
              <tr key={w.id} className={clsx('tr', w.priority === 'Urgente' && w.status !== 'Firmado' && 'bg-red-50/40')}>
                <td className="td"><Badge tone={PRIORITY_TONE[w.priority]}>{w.priority}</Badge></td>
                <td className="td"><p className="whitespace-nowrap font-semibold text-ink">{w.patient}</p><p className="text-[11px]">{w.record} · {w.age}</p></td>
                <td className="td"><p className="whitespace-nowrap text-ink">{w.study}</p><p className="text-[11px]">{w.id}</p></td>
                <td className="td"><Modality m={w.mod} /></td>
                <td className="td whitespace-nowrap">{w.hospital}</td>
                <td className="td whitespace-nowrap">{w.received}</td>
                <td className="td">
                  {w.status === 'Firmado' ? <span className="text-emerald-600">Completado</span> : (
                    <div className="w-28">
                      <p className={clsx('text-[12px] font-semibold', w.priority === 'Urgente' ? 'text-red-600' : w.priority === 'Alta' ? 'text-orange-500' : 'text-ink')}>{w.remaining}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e8eef8]"><div className="h-full rounded-full" style={{ width: `${w.pct}%`, background: w.pct > 60 ? '#ef4444' : w.pct > 30 ? '#f59e0b' : '#2f6bff' }} /></div>
                    </div>
                  )}
                </td>
                <td className="td"><Badge tone={STATUS_TONE[w.status]}>{w.status}</Badge></td>
                <td className="td">
                  <button onClick={() => setOpen(w)} className={clsx('whitespace-nowrap !px-3 !py-1.5 !text-[12px]', w.status === 'Firmado' ? 'btn-outline' : 'btn-primary')}>
                    <Eye size={14} /> {w.status === 'Firmado' ? 'Ver informe' : 'Leer estudio'}
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={9} className="td py-8 text-center">No hay estudios con los filtros seleccionados.</td></tr>}
          </tbody>
        </Table>
      </section>

      <ReportEditor item={open} onClose={() => setOpen(null)}
        onSaved={(id, status) => setItems((xs) => xs.map((x) => x.id === id ? { ...x, status } : x))} />
    </div>
  )
}
