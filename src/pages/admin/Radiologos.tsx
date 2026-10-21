import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SolicitudesRegistro } from './SolicitudesRegistro'
import {
  AlertCircle, Building2, CheckCircle2, ChevronDown, Clock, Download, FileCheck2, FileText, Hospital, LineChart,
  Mail, Megaphone, MoreVertical, Pencil, Plus, Star, UserRound, ClipboardList,
} from 'lucide-react'
import {
  Badge, Checkbox, DotsButton, InfoRow, Kpi, Modality, MoreLink, PageHeader, Pagination, Panel, SearchInput, Select,
  Stars, Table, Tabs, UserSilhouette, clsx, type Tone,
} from '../../components/ui'

/* ---------------- Datos mock ---------------- */
type Estado = 'Activo' | 'Sin asignación' | 'En convocatoria'
const estadoTone: Record<Estado, Tone> = { Activo: 'green', 'Sin asignación': 'orange', 'En convocatoria': 'purple' }

type Rad = {
  nombre: string; id: string; cedula: string; esp: string[]; region: string; hosp: number; rating: number; estado: Estado
  exequatur: string; telRes: string; telPer: string; email: string; vive: string; dir: string; interes: string[]
  stats: [number, number, number, number]; hospitales: [string, string][]
}

const RADS: Rad[] = [
  { nombre: 'Dr. Carlos Méndez', id: 'RAD-001', cedula: '001-1234567-1', esp: ['CT', 'MR'], region: 'Sur', hosp: 2, rating: 4.8, estado: 'Activo', exequatur: '12345', telRes: '809-555-0101', telPer: '809-555-0202', email: 'c.mendez@email.com', vive: 'Santo Domingo (Distrito Nacional)', dir: 'Santo Domingo, Distrito Nacional\nEns. Naco, Calle Principal, Torre Médica, Apto 4B', interes: ['Sur', 'Oeste'], stats: [248, 235, 8, 5], hospitales: [['Hospital Pediátrico Hugo Mendoza', '12/01/2025'], ['Hospital Dr. Marcelino Vélez', '05/03/2025']] },
  { nombre: 'Dra. Ana Rodríguez', id: 'RAD-002', cedula: '001-2345678-2', esp: ['RX', 'US'], region: 'Oeste', hosp: 1, rating: 4.6, estado: 'Activo', exequatur: '13872', telRes: '809-555-0311', telPer: '829-555-0412', email: 'a.rodriguez@email.com', vive: 'Santo Domingo Oeste', dir: 'Santo Domingo Oeste\nLas Caobas, Calle 5 No. 12', interes: ['Oeste'], stats: [196, 188, 4, 6], hospitales: [['Hospital Dr. Marcelino Vélez', '18/02/2025']] },
  { nombre: 'Dr. Luis Santana', id: 'RAD-003', cedula: '001-3456789-3', esp: ['CT'], region: 'Norte', hosp: 0, rating: 4.2, estado: 'Sin asignación', exequatur: '14520', telRes: '809-555-0520', telPer: '849-555-0621', email: 'l.santana@email.com', vive: 'Santiago', dir: 'Santiago de los Caballeros\nLos Jardines Metropolitanos', interes: ['Norte'], stats: [0, 0, 0, 0], hospitales: [] },
  { nombre: 'Dra. María Gómez', id: 'RAD-004', cedula: '001-4567890-4', esp: ['MR', 'US'], region: 'Este', hosp: 3, rating: 4.9, estado: 'Activo', exequatur: '11098', telRes: '809-555-0731', telPer: '809-555-0832', email: 'm.gomez@email.com', vive: 'La Romana', dir: 'La Romana\nVilla Verde, Calle B No. 8', interes: ['Este', 'SurEste'], stats: [312, 305, 3, 4], hospitales: [['Hospital Regional Antonio Musa', '10/03/2025'], ['Hospital Padre Billini', '22/01/2025'], ['Hospital Juan Pablo Pina', '03/02/2025']] },
  { nombre: 'Dr. José Castillo', id: 'RAD-005', cedula: '001-5678901-5', esp: ['RX'], region: 'SurEste', hosp: 0, rating: 4.0, estado: 'En convocatoria', exequatur: '15633', telRes: '809-555-0941', telPer: '829-555-1042', email: 'j.castillo@email.com', vive: 'San Pedro de Macorís', dir: 'San Pedro de Macorís\nVilla Velásquez, Calle 3', interes: ['SurEste'], stats: [0, 0, 0, 0], hospitales: [] },
  { nombre: 'Dra. Laura Sánchez', id: 'RAD-006', cedula: '001-6789012-6', esp: ['CT', 'MR'], region: 'Norte', hosp: 1, rating: 4.7, estado: 'Activo', exequatur: '12987', telRes: '809-555-1151', telPer: '809-555-1252', email: 'l.sanchez@email.com', vive: 'Santiago', dir: 'Santiago de los Caballeros\nCerros de Gurabo', interes: ['Norte', 'NorOeste'], stats: [174, 170, 2, 5], hospitales: [['Hospital Traumatológico Ney Arias Lora', '28/02/2025']] },
  { nombre: 'Dr. Pedro Martínez', id: 'RAD-007', cedula: '001-7890123-7', esp: ['US'], region: 'SurOeste', hosp: 0, rating: 3.9, estado: 'Sin asignación', exequatur: '16210', telRes: '809-555-1361', telPer: '849-555-1462', email: 'p.martinez@email.com', vive: 'Barahona', dir: 'Santa Cruz de Barahona\nPalmarito, Calle 2', interes: ['SurOeste'], stats: [0, 0, 0, 0], hospitales: [] },
  { nombre: 'Dra. Claudia Jiménez', id: 'RAD-008', cedula: '001-8901234-8', esp: ['MR'], region: 'Oeste', hosp: 2, rating: 4.5, estado: 'Activo', exequatur: '13340', telRes: '809-555-1571', telPer: '809-555-1672', email: 'c.jimenez@email.com', vive: 'San Juan de la Maguana', dir: 'San Juan de la Maguana\nCentro, Calle Duarte 44', interes: ['Oeste'], stats: [152, 147, 5, 6], hospitales: [['Hospital Regional San Juan de la Maguana', '14/01/2025'], ['Hospital Dr. Alejandro Cabral', '20/02/2025']] },
  { nombre: 'Dr. Rafael Pineda', id: 'RAD-009', cedula: '001-9012345-9', esp: ['CT', 'RX'], region: 'NorEste', hosp: 1, rating: 4.3, estado: 'Activo', exequatur: '14780', telRes: '809-555-1781', telPer: '829-555-1882', email: 'r.pineda@email.com', vive: 'San Francisco de Macorís', dir: 'San Francisco de Macorís\nUrb. Almánzar', interes: ['NorEste'], stats: [131, 126, 4, 7], hospitales: [['Hospital Regional Taiwán 19 de Marzo', '06/03/2025']] },
  { nombre: 'Dra. Isabel Torres', id: 'RAD-010', cedula: '001-0123456-0', esp: ['US'], region: 'NorOeste', hosp: 0, rating: 4.1, estado: 'En convocatoria', exequatur: '16955', telRes: '809-555-1991', telPer: '809-555-2092', email: 'i.torres@email.com', vive: 'Mao, Valverde', dir: 'Mao, Valverde\nLos Multis, Calle 7', interes: ['NorOeste'], stats: [0, 0, 0, 0], hospitales: [] },
]

const convocatorias = [
  { t: 'Radiólogos para Hospital Regional Azua', esp: ['CT', 'MR'], region: 'Sur', aplica: 'Todos', fecha: '20/03/2025', post: 12, estado: 'Abierta' },
  { t: 'Médicos para área de Ultrasonido', esp: ['US'], region: 'Este', aplica: 'Sin hospitales', fecha: '18/03/2025', post: 8, estado: 'Abierta' },
  { t: 'Convocatoria Tomografía - NorOeste', esp: ['CT'], region: 'NorOeste', aplica: 'Con 1 hospital', fecha: '25/03/2025', post: 5, estado: 'En evaluación' },
]

const solicitudes = [
  { f: '12/03/2025 14:32', n: 'Dr. Javier Rosario', e: 'RX', s: 'Pendiente' },
  { f: '12/03/2025 11:20', n: 'Dra. Melissa Peña', e: 'US', s: 'Pendiente' },
  { f: '11/03/2025 16:45', n: 'Dr. Antonio Vargas', e: 'CT', s: 'Aprobado' },
  { f: '11/03/2025 10:18', n: 'Dra. Elena Cruz', e: 'MR', s: 'Pendiente' },
  { f: '10/03/2025 09:32', n: 'Dr. Manuel Rivas', e: 'RX', s: 'Aprobado' },
]

const SPECS = ['Todos', 'CT', 'MR', 'RX', 'US', 'MG']
const REGIONES = ['Todos', 'Norte', 'Sur', 'Este', 'Oeste', 'NorEste', 'NorOeste', 'SurEste', 'SurOeste']

function RegionChip({ r }: { r: string }) {
  return <span className="inline-flex rounded-md border border-red-100 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">{r}</span>
}

/* ---------------- Detalle ---------------- */
function Detalle({ r }: { r: Rad }) {
  const [tab, setTab] = useState(0)
  const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) : '0.0')
  return (
    <section className="card flex flex-col">
      <div className="flex items-start gap-3 px-4 pt-4">
        <UserSilhouette size={52} className="!bg-brand-600 [&_circle]:fill-white [&_path]:fill-white" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[19px] font-bold leading-tight text-ink">{r.nombre}</h2>
            <Badge tone={estadoTone[r.estado]}>{r.estado}</Badge>
          </div>
          <p className="text-[12.5px] text-slate-500">{r.id} <span className="mx-1.5">|</span> Exequátur: {r.exequatur}</p>
        </div>
        <button className="btn-primary gap-1.5 px-3 py-1.5 text-[12.5px]"><Pencil size={14} /> Editar</button>
        <button className="rounded-md p-1 text-ink hover:bg-slate-100" aria-label="Más"><MoreVertical size={18} /></button>
      </div>
      <Tabs className="mx-4 mt-3" tabs={['Información', 'Asignaciones', 'Rendimiento', 'Actividad', 'Documentos']} active={tab} onChange={setTab} />
      <div className="space-y-3 px-4 py-3">
        {tab === 0 && (
          <div className="rounded-lg bg-[#f6f9fe] px-3 py-2">
            <h4 className="mb-1 flex items-center gap-2 text-[13.5px] font-bold text-ink"><UserRound size={16} className="text-brand-600" /> Información personal</h4>
            <InfoRow label="Nombre completo">{r.nombre}</InfoRow>
            <InfoRow label="Cédula">{r.cedula}</InfoRow>
            <InfoRow label="Exequátur">{r.exequatur}</InfoRow>
            <InfoRow label="Tel. Residencia">{r.telRes}</InfoRow>
            <InfoRow label="Tel. Personal (WhatsApp)">
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-emerald-500"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.2Z" /></svg>
                {r.telPer}
              </span>
            </InfoRow>
            <InfoRow label="Correo electrónico"><span className="flex items-center gap-1.5 break-all text-brand-600"><Mail size={13} className="shrink-0 text-ink" />{r.email}</span></InfoRow>
            <InfoRow label="Dirección actual"><span className="whitespace-pre-line">{r.dir}</span></InfoRow>
            <InfoRow label="Especialidades"><span className="flex gap-1.5">{r.esp.map((e) => <Modality key={e} m={e} />)}</span></InfoRow>
            <InfoRow label="Región donde vive">{r.vive}</InfoRow>
            <InfoRow label="Región de interés"><span className="flex gap-1.5">{r.interes.map((x) => <RegionChip key={x} r={x} />)}</span></InfoRow>
            <InfoRow label="Bio / Observaciones">-</InfoRow>
          </div>
        )}
        {tab === 1 && (
          <ul className="space-y-2">
            {r.hospitales.length === 0 && <li className="rounded-lg border border-dashed border-[#d7e1f2] px-3 py-6 text-center text-[12.5px] text-slate-500">Sin hospitales asignados</li>}
            {r.hospitales.map(([h, f]) => (
              <li key={h} className="flex items-center gap-3 rounded-lg border border-[#e6edf8] px-3 py-2.5">
                <Building2 size={18} className="text-brand-600" />
                <div className="min-w-0 flex-1 text-[12.5px]"><div className="font-semibold text-ink">{h}</div><div className="text-slate-500">Asignado el {f} · {r.esp.join(', ')}</div></div>
                <Badge tone="green" icon>Activo</Badge>
              </li>
            ))}
          </ul>
        )}
        {tab === 2 && (
          <div className="space-y-2 text-[12.5px]">
            {[['Informes a tiempo', 92], ['Calidad (revisión por pares)', 96], ['Aceptación de estudios', 88]].map(([l, v]) => (
              <div key={l as string}>
                <div className="mb-1 flex justify-between"><span className="text-ink">{l}</span><b className="text-ink">{r.stats[0] ? v : 0}%</b></div>
                <div className="h-2 overflow-hidden rounded bg-[#e8eef8]"><div className="h-full rounded bg-brand-500" style={{ width: `${r.stats[0] ? v : 0}%` }} /></div>
              </div>
            ))}
          </div>
        )}
        {tab === 3 && (
          <ul className="space-y-2 text-[12.5px]">
            {[['Informe emitido · TC de Cráneo', 'Hace 15 min'], ['Estudio aceptado · RM de Rodilla', 'Hace 1 hora'], ['Inicio de sesión', 'Hoy 08:02'], ['Actualizó su perfil', '10/03/2025']].map(([a, t]) => (
              <li key={a} className="flex justify-between border-b border-[#eef2f8] pb-2"><span className="text-ink">{a}</span><span className="text-slate-500">{t}</span></li>
            ))}
          </ul>
        )}
        {tab === 4 && (
          <ul className="space-y-2">
            {['Exequátur.pdf', 'Cédula de identidad.pdf', 'Título de especialidad.pdf', 'Curriculum vitae.pdf'].map((d) => (
              <li key={d} className="flex items-center gap-3 rounded-lg border border-[#e6edf8] px-3 py-2 text-[12.5px]">
                <FileText size={17} className="text-red-500" /><span className="flex-1 text-ink">{d}</span><Badge tone="green" icon>Verificado</Badge>
              </li>
            ))}
          </ul>
        )}

        {/* Estadísticas */}
        <div className="rounded-lg bg-[#f6f9fe] px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-[13.5px] font-bold text-ink"><LineChart size={16} className="text-brand-600" /> Estadísticas de rendimiento</h4>
            <Select options={['Últimos 6 meses', 'Últimos 3 meses', 'Último año']} className="w-[140px] [&_select]:py-1 [&_select]:text-[11.5px]" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { i: ClipboardList, c: 'text-violet-600', v: r.stats[0], l: 'Estudios asignados', s: '' },
              { i: FileCheck2, c: 'text-emerald-600', v: r.stats[1], l: 'Informes emitidos', s: `${pct(r.stats[1], r.stats[0])}%`, sc: 'text-emerald-600' },
              { i: AlertCircle, c: 'text-red-500', v: r.stats[2], l: 'Estudios vencidos', s: `${pct(r.stats[2], r.stats[0])}%`, sc: 'text-red-500', vc: 'text-red-500' },
              { i: Clock, c: 'text-violet-600', v: r.stats[3], l: 'Promedio (horas)', s: '' },
            ].map((x) => (
              <div key={x.l} className="rounded-lg border border-[#e6edf8] bg-white p-2">
                <div className="flex items-center gap-1.5"><x.i size={15} className={x.c} /><span className={clsx('text-[17px] font-bold', x.vc ?? 'text-brand-700')}>{x.v}</span></div>
                <div className="text-[11px] leading-tight text-slate-500">{x.l}</div>
                {x.s && <div className={clsx('text-[11.5px] font-semibold', x.sc)}>{x.s}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Hospitales asignados */}
        <div className="rounded-lg bg-[#f6f9fe] px-3 py-2.5">
          <div className="mb-1 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-[13.5px] font-bold text-ink"><Hospital size={16} className="text-brand-600" /> Hospitales asignados ({r.hospitales.length})</h4>
            <button className="rounded-md border border-brand-200 bg-white px-2 py-1 text-[11.5px] font-semibold text-brand-600 hover:bg-brand-50">Gestionar</button>
          </div>
          <Table>
            <thead><tr>{['Hospital / Centro', 'Fecha de asignación', 'Estado'].map((x) => <th key={x} className="th px-1">{x}</th>)}</tr></thead>
            <tbody>
              {r.hospitales.map(([h, f]) => (
                <tr key={h} className="border-t border-[#e6edf8]">
                  <td className="td px-1 font-medium text-ink">{h}</td><td className="td px-1">{f}</td><td className="td px-1"><Badge tone="green" icon>Abierto</Badge></td>
                </tr>
              ))}
              {r.hospitales.length === 0 && <tr><td colSpan={3} className="td px-1 text-center">Sin hospitales asignados</td></tr>}
            </tbody>
          </Table>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Página ---------------- */
export default function Radiologos() {
  const navigate = useNavigate()
  const [sel, setSel] = useState(0)
  const [checked, setChecked] = useState<string[]>([])
  const [fk, setFk] = useState(0)
  const [exp, setExp] = useState(false)
  const allChecked = checked.length === RADS.length

  return (
    <div>
      <PageHeader
        icon={UserRound}
        title="Radiólogos"
        subtitle="Registro, gestión y asignación de médicos radiólogos"
        actions={
          <>
            <button onClick={() => navigate('/admin/convocatorias?nueva=1')} className="btn-primary gap-2"><Plus size={17} /> Nueva convocatoria</button>
            <button onClick={() => navigate('/admin/asignaciones')} className="btn-outline gap-2"><Building2 size={16} /> Asignar a hospital</button>
            <div className="relative">
              <button onClick={() => setExp(!exp)} className="btn-outline gap-2"><Download size={16} /> Exportar <ChevronDown size={15} /></button>
              {exp && (
                <div className="absolute right-0 top-11 z-30 w-40 overflow-hidden rounded-lg border border-[#e3eaf6] bg-white py-1 shadow-soft">
                  {['Excel (.xlsx)', 'PDF', 'CSV'].map((l) => <button key={l} onClick={() => setExp(false)} className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-brand-50">{l}</button>)}
                </div>
              )}
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi icon={Building2} tone="blue" value="287" label="Médicos registrados" sub="12% vs. mes anterior" trend="up" />
        <Kpi icon={CheckCircle2} tone="green" value="198" label="Activos" sub="69.0% del total" />
        <Kpi icon={UserRound} tone="orange" value="56" label="Sin asignación" sub="19.5% del total" />
        <Kpi icon={Megaphone} tone="purple" value="33" label="En convocatoria" sub="11.5% del total" />
        <Kpi icon={Star} tone="yellow" value="4.6" label="Rating promedio" sub="de 5.0" />
      </div>

      {/* Filtros */}
      <div key={fk} className="card mt-3 grid grid-cols-1 items-end gap-3 px-4 py-3.5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
        <SearchInput placeholder="Buscar radiólogo por nombre, exequátur, cédula..." />
        <div><label className="label">Especialidad</label><Select options={SPECS} /></div>
        <div><label className="label">Región donde vive</label><Select options={REGIONES} /></div>
        <div><label className="label">Región de interés</label><Select options={REGIONES} /></div>
        <div><label className="label">Estado</label><Select options={['Todos', 'Activo', 'Sin asignación', 'En convocatoria']} /></div>
        <button onClick={() => setFk(fk + 1)} className="btn-outline justify-center px-10">Limpiar</button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-3 xl:col-span-8">
          <Panel title="Listado de radiólogos" subtitle="287 registros encontrados" bodyClass="px-0 pb-0">
            <Table>
              <thead className="bg-[#f6f9fe]">
                <tr>
                  <th className="th w-8"><Checkbox checked={allChecked} onChange={(v) => setChecked(v ? RADS.map((r) => r.id) : [])} /></th>
                  {['Nombre', 'Exequátur', 'Cédula', 'Especialidad', 'Región de interés', 'Hospitales asignados', 'Rating', 'Estado', 'Acciones'].map((x) => <th key={x} className="th">{x}</th>)}
                </tr>
              </thead>
              <tbody>
                {RADS.map((r, i) => (
                  <tr key={r.id} onClick={() => setSel(i)} className={clsx('tr cursor-pointer', i === sel && '!bg-brand-50 shadow-[inset_3px_0_0_#0b57f0]')}>
                    <td className="td" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={checked.includes(r.id)} onChange={(v) => setChecked(v ? [...checked, r.id] : checked.filter((x) => x !== r.id))} />
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <UserSilhouette size={24} className="!bg-brand-600 [&_circle]:fill-white [&_path]:fill-white" />
                        <span className="font-semibold text-ink">{r.nombre}</span>
                      </div>
                    </td>
                    <td className="td">{r.id}</td>
                    <td className="td whitespace-nowrap">{r.cedula}</td>
                    <td className="td"><span className="flex gap-1">{r.esp.map((e) => <Modality key={e} m={e} />)}</span></td>
                    <td className="td">{r.region}</td>
                    <td className="td text-center">{r.hosp}</td>
                    <td className="td"><span className="flex items-center gap-1.5 whitespace-nowrap"><Stars value={r.rating} size={12} /><span className="text-ink">{r.rating.toFixed(1)}</span></span></td>
                    <td className="td"><Badge tone={estadoTone[r.estado]} icon={r.estado === 'Activo'}>{r.estado}</Badge></td>
                    <td className="td" onClick={(e) => e.stopPropagation()}><DotsButton /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination text="Mostrando 1 a 10 de 287 radiólogos" pages={[1, 2, 3, 4, 5]} last={29} />
          </Panel>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Panel title="Convocatorias activas" icon={Megaphone} subtitle="3 convocatorias en proceso" action={<MoreLink onClick={() => navigate('/admin/convocatorias')}>Ver todas</MoreLink>} bodyClass="px-0 pb-2">
              <Table>
                <thead className="bg-[#f6f9fe]"><tr>{['Título', 'Especialidad', 'Región', 'Aplican a', 'Fecha límite', 'Postulaciones', 'Estado'].map((x) => <th key={x} className="th">{x}</th>)}</tr></thead>
                <tbody>
                  {convocatorias.map((c) => (
                    <tr key={c.t} className="tr">
                      <td className="td min-w-[150px] text-ink">{c.t}</td>
                      <td className="td"><span className="flex gap-1">{c.esp.map((e) => <Modality key={e} m={e} />)}</span></td>
                      <td className="td">{c.region}</td>
                      <td className="td whitespace-nowrap">{c.aplica}</td>
                      <td className="td">{c.fecha}</td>
                      <td className="td text-center">{c.post}</td>
                      <td className="td"><Badge tone={c.estado === 'Abierta' ? 'green' : 'orange'} icon={c.estado === 'Abierta'}>{c.estado}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Panel>
            <SolicitudesRegistro demo={solicitudes} />
          </div>
        </div>

        <div className="xl:col-span-4">
          <Detalle key={sel} r={RADS[sel]} />
        </div>
      </div>
    </div>
  )
}
