import { useMemo, useState } from 'react'
import { Calendar, FileText, FilePlus2, IdCard, Image as ImageIcon, Mail, Phone, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, Badge, InfoRow, Modality, SearchInput, Table, clsx, type Tone } from '../../components/ui'
import { PortalHeading, ReportModal, STUDIES, ViewerModal, type Study } from '../patient/PatientPortal'
import { RoleNotice, useDoctorRole } from './DoctorPortal'

type Pat = { name: string; record: string; cedula: string; age: number; sex: string; phone: string; email: string; last: string; status: string; tone: Tone; studies: Study[]; dx: string }

const PATIENTS: Pat[] = [
  { name: 'Juan Pérez Gómez', record: 'HN-00012345', cedula: '001-1567890-1', age: 45, sex: 'Masculino', phone: '809-555-1234', email: 'juan.perez@correo.com', last: '15/03/2025', status: 'Resultado disponible', tone: 'green', studies: STUDIES.slice(0, 4), dx: 'Cefalea recurrente · Hipertensión controlada' },
  { name: 'María Altagracia Rosario', record: 'HN-00045871', cedula: '001-0456789-3', age: 62, sex: 'Femenino', phone: '829-555-4410', email: 'maria.rosario@correo.com', last: '20/10/2026', status: 'En lectura', tone: 'blue', studies: [STUDIES[0]], dx: 'Cefalea súbita · Descartar HSA' },
  { name: 'Ana Lucía Martínez', record: 'HN-00051230', cedula: '402-2234567-8', age: 38, sex: 'Femenino', phone: '849-555-7720', email: 'ana.martinez@correo.com', last: '20/10/2026', status: 'En lectura', tone: 'blue', studies: [STUDIES[2]], dx: 'Gonalgia derecha postraumática' },
  { name: 'Luis Alberto Guzmán', record: 'HN-00033457', cedula: '031-0098765-2', age: 70, sex: 'Masculino', phone: '809-555-3302', email: 'lguzman@correo.com', last: '19/10/2026', status: 'Programado', tone: 'orange', studies: [STUDIES[5]], dx: 'Control oncológico' },
  { name: 'Rafael Antonio Mejía', record: 'HN-00058812', cedula: '001-1789012-4', age: 54, sex: 'Masculino', phone: '809-555-8891', email: 'rmejia@correo.com', last: '18/10/2026', status: 'Pendiente de cita', tone: 'yellow', studies: [STUDIES[3]], dx: 'Litiasis renal en estudio' },
  { name: 'Carmen Julia Santos', record: 'HN-00060012', cedula: '001-0345678-9', age: 49, sex: 'Femenino', phone: '829-555-1209', email: 'cjsantos@correo.com', last: '19/10/2026', status: 'Resultado disponible', tone: 'green', studies: [STUDIES[6]], dx: 'Tamizaje de mama' },
  { name: 'Pedro Antonio Reyes', record: 'HN-00028871', cedula: '001-0987654-1', age: 57, sex: 'Masculino', phone: '809-555-6650', email: 'preyes@correo.com', last: '19/10/2026', status: 'Resultado disponible', tone: 'green', studies: [STUDIES[3], STUDIES[1]], dx: 'Dolor abdominal en estudio' },
]

export default function Pacientes() {
  const { role } = useDoctorRole()
  const [sel, setSel] = useState(0)
  const [filter, setFilter] = useState('Todos')
  const [report, setReport] = useState<Study | null>(null)
  const [viewer, setViewer] = useState<Study | null>(null)
  const list = useMemo(() => PATIENTS.filter((p) => filter === 'Todos' || p.status === filter), [filter])

  if (role !== 'referidor') return <RoleNotice needed="referidor" />
  const p = PATIENTS[sel]

  return (
    <div>
      <PortalHeading icon={Users} title="Mis pacientes" subtitle="Pacientes que has referido a la red y el estado de sus estudios."
        actions={<Link to="/medico/solicitudes" className="btn-primary"><FilePlus2 size={16} /> Nueva solicitud</Link>} />
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <section className="card min-w-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#eef2f8] p-3">
            <SearchInput placeholder="Buscar por nombre, cédula o expediente" className="w-full sm:w-[300px]" />
            <div className="flex flex-wrap gap-1.5">
              {['Todos', 'Resultado disponible', 'En lectura', 'Programado', 'Pendiente de cita'].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={clsx('rounded-full border px-3 py-1 text-[12px] font-medium',
                  filter === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#d7e1f2] text-ink hover:border-brand-400')}>{f}</button>
              ))}
            </div>
          </div>
          <Table>
            <thead className="bg-[#f3f7fd]"><tr>{['Paciente', 'Edad', 'Última referencia', 'Estudios', 'Estado'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {list.map((x) => {
                const i = PATIENTS.indexOf(x)
                return (
                  <tr key={x.record} onClick={() => setSel(i)} className={clsx('tr cursor-pointer', i === sel && '!bg-brand-50')}>
                    <td className="td"><div className="flex items-center gap-2.5"><Avatar name={x.name} size={34} /><div><p className="whitespace-nowrap font-semibold text-ink">{x.name}</p><p className="text-[11px]">{x.record}</p></div></div></td>
                    <td className="td whitespace-nowrap">{x.age} años</td>
                    <td className="td whitespace-nowrap">{x.last}</td>
                    <td className="td">{x.studies.length}</td>
                    <td className="td"><Badge tone={x.tone}>{x.status}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </section>

        <section className="card min-w-0">
          <div className="flex items-center gap-4 border-b border-[#eef2f8] bg-gradient-to-r from-brand-50 to-white p-4">
            <Avatar name={p.name} size={64} />
            <div className="min-w-0">
              <p className="text-[19px] font-bold text-navy-800">{p.name}</p>
              <p className="text-[13px] font-semibold text-brand-700">{p.record}</p>
              <Badge tone={p.tone} className="mt-1">{p.status}</Badge>
            </div>
          </div>
          <div className="p-4">
            <InfoRow label={<span className="flex items-center gap-1.5"><IdCard size={14} /> Cédula</span>}>{p.cedula}</InfoRow>
            <InfoRow label="Edad / Sexo">{p.age} años · {p.sex}</InfoRow>
            <InfoRow label={<span className="flex items-center gap-1.5"><Phone size={14} /> Teléfono</span>}>{p.phone}</InfoRow>
            <InfoRow label={<span className="flex items-center gap-1.5"><Mail size={14} /> Correo</span>}>{p.email}</InfoRow>
            <InfoRow label="Diagnóstico de referencia">{p.dx}</InfoRow>
            <h4 className="mb-2 mt-4 text-[14px] font-bold text-navy-800">Estudios del paciente</h4>
            <div className="space-y-2">
              {p.studies.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e6edf8] p-2.5">
                  <img src={s.img} alt="" className="h-12 w-12 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[13.5px] font-semibold text-ink"><Modality m={s.mod} /> <span className="truncate">{s.name}</span></p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-500"><Calendar size={12} /> {s.date} · {s.hospital}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setReport(s)} className="btn-outline !px-2.5 !py-1 !text-[12px]"><FileText size={14} /> Informe</button>
                    <button onClick={() => setViewer(s)} className="btn-outline !px-2.5 !py-1 !text-[12px]"><ImageIcon size={14} /> Imágenes</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/medico/solicitudes" className="btn-primary"><FilePlus2 size={16} /> Solicitar nuevo estudio</Link>
              <a href={`tel:${p.phone}`} className="btn-outline"><Phone size={16} /> Contactar</a>
            </div>
          </div>
        </section>
      </div>
      <ReportModal study={report} onClose={() => setReport(null)} patient={p.name} record={p.record} />
      <ViewerModal study={viewer} onClose={() => setViewer(null)} />
    </div>
  )
}
