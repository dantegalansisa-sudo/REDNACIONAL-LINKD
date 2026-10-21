import { useMemo, useState } from 'react'
import { Calendar, CheckCircle2, FileText, Image as ImageIcon, LayoutGrid, List, MapPin, UserRound } from 'lucide-react'
import { Modality, Select, Table, clsx } from '../../components/ui'
import { PortalHeading, ReportModal, STUDIES, ViewerModal, type Study } from './PatientPortal'

const MODS = ['Todos', 'CT', 'RX', 'MR', 'US']
const MOD_NAME: Record<string, string> = { Todos: 'Todos', CT: 'Tomografía', RX: 'Radiografía', MR: 'Resonancia', US: 'Ecografía' }

export default function Estudios() {
  const [mod, setMod] = useState('Todos')
  const [hosp, setHosp] = useState('Todos los hospitales')
  const [year, setYear] = useState('Todos los años')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [report, setReport] = useState<Study | null>(null)
  const [viewer, setViewer] = useState<Study | null>(null)

  const list = useMemo(() => STUDIES.filter((s) =>
    (mod === 'Todos' || s.mod === mod) &&
    (hosp === 'Todos los hospitales' || s.hospital === hosp) &&
    (year === 'Todos los años' || s.date.endsWith(year))), [mod, hosp, year])

  const count = (m: string) => (m === 'Todos' ? STUDIES.length : STUDIES.filter((s) => s.mod === m).length)

  return (
    <div>
      <PortalHeading icon={FileText} title="Mis estudios" subtitle="Consulta tus estudios de imágenes, informes radiológicos e imágenes diagnósticas." />

      <div className="card mb-4 flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <div className="scroll-soft flex gap-2 overflow-x-auto">
          {MODS.map((m) => (
            <button key={m} onClick={() => setMod(m)}
              className={clsx('flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition',
                mod === m ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#d7e1f2] bg-white text-ink hover:border-brand-400')}>
              {MOD_NAME[m]}
              <span className={clsx('rounded-full px-1.5 text-[11px]', mod === m ? 'bg-white/20' : 'bg-brand-50 text-brand-700')}>{count(m)}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
          <Select options={['Todos los hospitales', 'Hosp. Hugo Mendoza', 'Hospital General', 'Hospital Dr. Francisco A. Gonzalvo']} onChange={setHosp} className="w-full sm:w-[240px]" />
          <Select options={['Todos los años', '2025', '2024']} onChange={setYear} className="w-full sm:w-[150px]" />
          <div className="flex rounded-lg border border-[#d7e1f2] p-0.5">
            <button onClick={() => setView('grid')} className={clsx('rounded-md p-1.5', view === 'grid' ? 'bg-brand-600 text-white' : 'text-slate-500')} aria-label="Vista en cuadrícula"><LayoutGrid size={17} /></button>
            <button onClick={() => setView('list')} className={clsx('rounded-md p-1.5', view === 'list' ? 'bg-brand-600 text-white' : 'text-slate-500')} aria-label="Vista en lista"><List size={17} /></button>
          </div>
        </div>
      </div>

      <p className="mb-3 text-[13px] text-brand-800/80">Mostrando <b className="text-ink">{list.length}</b> de {STUDIES.length} estudios</p>

      {list.length === 0 && <div className="card p-10 text-center text-[14px] text-slate-500">No hay estudios que coincidan con los filtros seleccionados.</div>}

      {view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((s) => (
            <article key={s.id} className="card flex flex-col overflow-hidden">
              <button onClick={() => setViewer(s)} className="group relative h-44 overflow-hidden bg-black">
                <img src={s.img} alt={s.name} className="h-full w-full object-cover opacity-90 transition group-hover:scale-105 group-hover:opacity-100" />
                <Modality m={s.mod} className="absolute left-3 top-3 !bg-white" />
                <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">{s.images} imágenes</span>
              </button>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-[15px] font-bold text-navy-800">{s.name}</p>
                <p className="text-[12.5px] text-slate-500">{s.region} · {s.id}</p>
                <div className="mt-2 space-y-1 text-[12.5px] text-slate-600">
                  <p className="flex items-center gap-2"><Calendar size={14} className="text-brand-700" /> {s.date} {s.time}</p>
                  <p className="flex items-center gap-2"><MapPin size={14} className="text-brand-700" /> {s.hospital}</p>
                  <p className="flex items-center gap-2"><UserRound size={14} className="text-brand-700" /> <span className="truncate">{s.radiologist}</span></p>
                </div>
                <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] text-emerald-700"><CheckCircle2 size={14} className="fill-emerald-600 text-white" /> {s.status}</span>
                <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                  <button onClick={() => setReport(s)} className="btn-outline !px-2"><FileText size={15} /> Ver informe</button>
                  <button onClick={() => setViewer(s)} className="btn-outline !px-2"><ImageIcon size={15} /> Ver imágenes</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        list.length > 0 && (
          <div className="card overflow-hidden">
            <Table>
              <thead className="bg-[#f3f7fd]">
                <tr>{['', 'Estudio', 'Modalidad', 'Fecha', 'Hospital', 'Radiólogo', 'Estado', 'Acciones'].map((h) => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} className="tr">
                    <td className="td"><img src={s.img} alt="" className="h-11 w-11 rounded object-cover" /></td>
                    <td className="td"><p className="font-semibold text-ink">{s.name}</p><p className="text-[11px]">{s.id}</p></td>
                    <td className="td"><Modality m={s.mod} /></td>
                    <td className="td whitespace-nowrap">{s.date}<br /><span className="text-[11px]">{s.time}</span></td>
                    <td className="td whitespace-nowrap">{s.hospital}</td>
                    <td className="td whitespace-nowrap">{s.radiologist}</td>
                    <td className="td"><span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11.5px] text-emerald-700"><CheckCircle2 size={13} /> {s.status}</span></td>
                    <td className="td">
                      <div className="flex gap-1.5">
                        <button onClick={() => setReport(s)} className="btn-outline !px-2.5 !py-1 !text-[12px]"><FileText size={14} /> Informe</button>
                        <button onClick={() => setViewer(s)} className="btn-outline !px-2.5 !py-1 !text-[12px]"><ImageIcon size={14} /> Imágenes</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )
      )}

      <ReportModal study={report} onClose={() => setReport(null)} />
      <ViewerModal study={viewer} onClose={() => setViewer(null)} />
    </div>
  )
}
