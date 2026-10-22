import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, CalendarCheck, CalendarDays, Check, CheckCircle2, ChevronDown, Clock, Download, Gauge as GaugeIcon, Hospital, Mail,
  MapPinned, Phone, Plus, UserRoundX, X,
} from 'lucide-react'
import {
  Badge, Bar, Checkbox, DotsButton, InfoRow, Kpi, Modality, MoreLink, PageHeader, Pagination, Panel, SearchInput, Select,
  Table, Tabs, UserSilhouette, clsx, type Tone,
} from '../../components/ui'
import { Donut } from '../../components/charts'
import { supabaseConfigurado } from '../../lib/admin-data'

/** En producción (Supabase configurado) la pantalla arranca vacía, sin datos de ejemplo */
const VACIO = supabaseConfigurado

/* ---------------- Datos mock ---------------- */
type Estado = 'Activa' | 'Pendiente' | 'Suspendida' | 'Finalizada'
const estadoTone: Record<Estado, Tone> = { Activa: 'green', Pendiente: 'orange', Suspendida: 'red', Finalizada: 'gray' }

type Asig = {
  id: string; rad: string; radId: string; hospital: string; codigo: string; region: string; mods: string[]; fecha: string
  carga: number; capacidad: number; estado: Estado; turno: string; email: string; tel: string; sla: string
}

const MOCK_ASIGS: Asig[] = [
  { id: 'ASG-0142', rad: 'Dr. Carlos Méndez', radId: 'RAD-001', hospital: 'Hospital Pediátrico Hugo Mendoza', codigo: 'H-001', region: 'Ozama', mods: ['CT', 'MR'], fecha: '12/01/2025', carga: 132, capacidad: 160, estado: 'Activa', turno: 'Lunes a viernes · 08:00 - 16:00', email: 'c.mendez@email.com', tel: '809-555-0202', sla: '6 horas' },
  { id: 'ASG-0151', rad: 'Dr. Carlos Méndez', radId: 'RAD-001', hospital: 'Hospital Dr. Marcelino Vélez', codigo: 'H-002', region: 'Ozama', mods: ['CT'], fecha: '05/03/2025', carga: 116, capacidad: 160, estado: 'Activa', turno: 'Guardia remota · 16:00 - 22:00', email: 'c.mendez@email.com', tel: '809-555-0202', sla: '8 horas' },
  { id: 'ASG-0137', rad: 'Dra. Ana Rodríguez', radId: 'RAD-002', hospital: 'Hospital Dr. Marcelino Vélez', codigo: 'H-002', region: 'Ozama', mods: ['RX', 'US'], fecha: '18/02/2025', carga: 188, capacidad: 200, estado: 'Activa', turno: 'Lunes a sábado · 07:00 - 15:00', email: 'a.rodriguez@email.com', tel: '829-555-0412', sla: '4 horas' },
  { id: 'ASG-0128', rad: 'Dra. María Gómez', radId: 'RAD-004', hospital: 'Hospital Regional Antonio Musa', codigo: 'H-010', region: 'Este', mods: ['MR', 'US'], fecha: '10/03/2025', carga: 98, capacidad: 150, estado: 'Activa', turno: 'Lunes a viernes · 08:00 - 18:00', email: 'm.gomez@email.com', tel: '809-555-0832', sla: '6 horas' },
  { id: 'ASG-0119', rad: 'Dra. María Gómez', radId: 'RAD-004', hospital: 'Hospital Padre Billini', codigo: 'H-003', region: 'Ozama', mods: ['MR'], fecha: '22/01/2025', carga: 121, capacidad: 140, estado: 'Activa', turno: 'Fines de semana · 08:00 - 20:00', email: 'm.gomez@email.com', tel: '809-555-0832', sla: '8 horas' },
  { id: 'ASG-0156', rad: 'Dra. Laura Sánchez', radId: 'RAD-006', hospital: 'Hospital Traumatológico Ney Arias Lora', codigo: 'H-005', region: 'Ozama', mods: ['CT', 'MR'], fecha: '28/02/2025', carga: 174, capacidad: 180, estado: 'Activa', turno: 'Lunes a viernes · 14:00 - 22:00', email: 'l.sanchez@email.com', tel: '809-555-1252', sla: '4 horas' },
  { id: 'ASG-0160', rad: 'Dr. Luis Santana', radId: 'RAD-003', hospital: 'Hospital Dr. Alejandro Cabral', codigo: 'H-009', region: 'El Valle', mods: ['CT'], fecha: '14/03/2025', carga: 0, capacidad: 120, estado: 'Pendiente', turno: 'Por definir', email: 'l.santana@email.com', tel: '849-555-0621', sla: '8 horas' },
  { id: 'ASG-0133', rad: 'Dra. Claudia Jiménez', radId: 'RAD-008', hospital: 'Hospital Regional San Juan de la Maguana', codigo: 'H-008', region: 'El Valle', mods: ['MR'], fecha: '14/01/2025', carga: 64, capacidad: 140, estado: 'Suspendida', turno: 'Lunes a viernes · 08:00 - 16:00', email: 'c.jimenez@email.com', tel: '809-555-1672', sla: '8 horas' },
  { id: 'ASG-0148', rad: 'Dr. Rafael Pineda', radId: 'RAD-009', hospital: 'Hospital Regional Taiwán 19 de Marzo', codigo: 'H-007', region: 'Valdesia', mods: ['CT', 'RX'], fecha: '06/03/2025', carga: 109, capacidad: 160, estado: 'Activa', turno: 'Lunes a viernes · 08:00 - 16:00', email: 'r.pineda@email.com', tel: '829-555-1882', sla: '6 horas' },
  { id: 'ASG-0098', rad: 'Dr. Pedro Martínez', radId: 'RAD-007', hospital: 'Hospital Juan Pablo Pina', codigo: 'H-006', region: 'Valdesia', mods: ['US'], fecha: '03/11/2024', carga: 0, capacidad: 120, estado: 'Finalizada', turno: 'Finalizada el 28/02/2025', email: 'p.martinez@email.com', tel: '849-555-1462', sla: '8 horas' },
]

const MOCK_RADIOLOGOS = ['Dr. Carlos Méndez', 'Dra. Ana Rodríguez', 'Dr. Luis Santana', 'Dra. María Gómez', 'Dr. José Castillo', 'Dra. Laura Sánchez', 'Dr. Pedro Martínez', 'Dra. Claudia Jiménez', 'Dr. Rafael Pineda', 'Dra. Isabel Torres']
const MOCK_HOSPITALES = ['Hospital Pediátrico Hugo Mendoza', 'Hospital Dr. Marcelino Vélez', 'Hospital Padre Billini', 'Hospital Dr. Francisco Moscoso Puello', 'Hospital Traumatológico Ney Arias Lora', 'Hospital Juan Pablo Pina', 'Hospital Regional Taiwán 19 de Marzo', 'Hospital Regional San Juan de la Maguana', 'Hospital Dr. Alejandro Cabral', 'Hospital Regional Antonio Musa']
const MODS = ['RX', 'CT', 'MR', 'US', 'MG']

const MOCK_COBERTURA = [
  { r: 'Metropolitana (Ozama)', h: 18, cub: 18, rad: 74 },
  { r: 'Norcentral (Cibao Central)', h: 9, cub: 8, rad: 31 },
  { r: 'Este', h: 7, cub: 6, rad: 18 },
  { r: 'Valdesia', h: 6, cub: 5, rad: 14 },
  { r: 'El Valle', h: 5, cub: 3, rad: 7 },
  { r: 'Enriquillo', h: 4, cub: 2, rad: 5 },
  { r: 'Nordeste', h: 5, cub: 4, rad: 11 },
  { r: 'Cibao Occidental', h: 4, cub: 3, rad: 8 },
]

const MOCK_PENDIENTES = [
  { h: 'Hospital Dr. Alejandro Cabral', m: ['CT'], f: '14/03/2025', p: 'Alta' },
  { h: 'Hospital Provincial de Azua', m: ['RX', 'US'], f: '13/03/2025', p: 'Media' },
  { h: 'Hospital Regional Jaime Mota', m: ['CT', 'MR'], f: '12/03/2025', p: 'Alta' },
  { h: 'Hospital San Vicente de Paúl', m: ['MG'], f: '11/03/2025', p: 'Baja' },
]

const ASIGS: Asig[] = VACIO ? [] : MOCK_ASIGS
const RADIOLOGOS: string[] = VACIO ? [] : MOCK_RADIOLOGOS
const HOSPITALES: string[] = VACIO ? [] : MOCK_HOSPITALES
const cobertura = VACIO ? [] : MOCK_COBERTURA
const pendientes = VACIO ? [] : MOCK_PENDIENTES
/** Regiones de salud para el filtro (catálogo, no datos de ejemplo) */
const REGIONES_FILTRO = MOCK_COBERTURA.map((c) => c.r)

const cargaColor = (pct: number) => (pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#16a34a')

/* ---------------- Panel lateral ---------------- */
function DetalleAsig({ a }: { a: Asig }) {
  const pct = Math.round((a.carga / a.capacidad) * 100)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <UserSilhouette size={48} className="!bg-brand-600 [&_circle]:fill-white [&_path]:fill-white" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h3 className="text-[16px] font-bold text-ink">{a.rad}</h3><Badge tone={estadoTone[a.estado]} icon={a.estado === 'Activa'}>{a.estado}</Badge></div>
          <p className="text-[12px] text-slate-500">{a.radId} · Asignación {a.id}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-[#e6edf8] bg-[#f6f9fe] p-3">
        <Donut size={84} thickness={11} data={[{ label: 'Carga', value: a.carga, color: cargaColor(pct) }, { label: 'Disponible', value: Math.max(0, a.capacidad - a.carga), color: '#e8eef8' }]}
          center={<span className="text-[15px] font-bold text-ink">{pct}%</span>} />
        <div className="text-[12.5px]">
          <div className="font-semibold text-ink">Carga de estudios (mes)</div>
          <div className="text-slate-500">{a.carga} de {a.capacidad} estudios</div>
          <div className="mt-1 text-slate-500">SLA de respuesta: <b className="text-ink">{a.sla}</b></div>
        </div>
      </div>
      <div className="rounded-lg bg-[#f6f9fe] px-3 py-2">
        <InfoRow label="Hospital"><span className="font-medium">{a.hospital}</span></InfoRow>
        <InfoRow label="Código">{a.codigo}</InfoRow>
        <InfoRow label="Región">{a.region}</InfoRow>
        <InfoRow label="Modalidades"><span className="flex gap-1">{a.mods.map((m) => <Modality key={m} m={m} />)}</span></InfoRow>
        <InfoRow label="Fecha de asignación">{a.fecha}</InfoRow>
        <InfoRow label="Horario">{a.turno}</InfoRow>
        <InfoRow label="Teléfono"><span className="flex items-center gap-1.5"><Phone size={13} />{a.tel}</span></InfoRow>
        <InfoRow label="Correo"><span className="flex items-center gap-1.5 break-all text-brand-600"><Mail size={13} className="shrink-0 text-ink" />{a.email}</span></InfoRow>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-outline justify-center gap-1.5"><CalendarDays size={15} /> Reprogramar</button>
        {a.estado === 'Suspendida' || a.estado === 'Pendiente'
          ? <button className="btn-primary justify-center gap-1.5"><Check size={15} /> Activar</button>
          : <button className="btn justify-center gap-1.5 border border-red-200 bg-white text-red-600 hover:bg-red-50"><X size={15} /> Suspender</button>}
      </div>
    </div>
  )
}

function NuevaAsignacion({ onDone }: { onDone: () => void }) {
  const [mods, setMods] = useState<string[]>(VACIO ? [] : ['CT'])
  const [ok, setOk] = useState(false)
  if (ok) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <CheckCircle2 size={48} className="text-emerald-500" />
        <h4 className="mt-2 text-[16px] font-bold text-ink">Asignación creada</h4>
        <p className="mt-1 text-[12.5px] text-slate-500">Se notificó al radiólogo y al hospital. La asignación queda <b>Pendiente</b> hasta su aceptación.</p>
        <button className="btn-primary mt-4" onClick={() => { setOk(false); onDone() }}>Ver detalle</button>
      </div>
    )
  }
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setOk(true) }}>
      <div><label className="label">Radiólogo <span className="text-red-500">*</span></label><Select placeholder="Seleccionar radiólogo" value="" options={RADIOLOGOS} /></div>
      <div><label className="label">Hospital <span className="text-red-500">*</span></label><Select placeholder="Seleccionar hospital" value="" options={HOSPITALES} /></div>
      <div>
        <label className="label">Modalidades <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {MODS.map((m) => {
            const on = mods.includes(m)
            return (
              <button type="button" key={m} onClick={() => setMods(on ? mods.filter((x) => x !== m) : [...mods, m])}
                className={clsx('rounded-lg border px-3 py-1.5 text-[12px] font-bold transition', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#d7e1f2] bg-white text-ink hover:border-brand-400')}>{m}</button>
            )
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Fecha de inicio</label><input type="date" className="input" defaultValue={VACIO ? undefined : '2025-03-17'} /></div>
        <div><label className="label">Fecha de fin</label><input type="date" className="input" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Capacidad mensual</label><input type="number" className="input" defaultValue={VACIO ? undefined : 150} min={1} placeholder="Ej. 150" /></div>
        <div><label className="label">SLA de respuesta</label><Select options={['4 horas', '6 horas', '8 horas', '12 horas', '24 horas']} value="6 horas" /></div>
      </div>
      <div><label className="label">Horario / turno</label><Select options={['Lunes a viernes · 08:00 - 16:00', 'Lunes a viernes · 14:00 - 22:00', 'Guardia remota · 16:00 - 22:00', 'Fines de semana · 08:00 - 20:00', 'Cobertura 24/7']} /></div>
      <div><label className="label">Observaciones</label><textarea className="input min-h-[64px] resize-y" placeholder="Notas para el hospital o el radiólogo..." /></div>
      <Checkbox checked label="Notificar al radiólogo y al hospital por correo" />
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onDone} className="btn-outline">Cancelar</button>
        <button type="submit" className="btn-primary gap-1.5"><Plus size={15} /> Crear asignación</button>
      </div>
    </form>
  )
}

/* ---------------- Página ---------------- */
export default function Asignaciones() {
  const navigate = useNavigate()
  const [sel, setSel] = useState(0)
  const [tab, setTab] = useState(0)
  const [estado, setEstado] = useState('Todos')
  const [fk, setFk] = useState(0)
  const [exp, setExp] = useState(false)

  const rows = ASIGS.map((a, i) => ({ a, i })).filter(({ a }) => estado === 'Todos' || a.estado === estado)

  return (
    <div>
      <PageHeader
        icon={CalendarCheck}
        title="Asignaciones"
        subtitle="Gestión de asignaciones de radiólogos a hospitales de la red"
        actions={
          <>
            <button onClick={() => setTab(1)} className="btn-primary gap-2"><Plus size={17} /> Nueva asignación</button>
            <button onClick={() => navigate('/admin/radiologos')} className="btn-outline gap-2"><Hospital size={16} /> Ver radiólogos</button>
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
        {VACIO ? (
          <>
            <Kpi icon={CalendarCheck} tone="blue" value="0" label="Asignaciones activas" sub="Sin datos aún" />
            <Kpi icon={UserRoundX} tone="orange" value="0" label="Radiólogos sin asignar" sub="Sin datos aún" />
            <Kpi icon={Building2} tone="green" value="0 / 0" label="Hospitales con cobertura" sub="Sin datos aún" />
            <Kpi icon={Clock} tone="purple" value="0" label="Solicitudes pendientes" sub="Sin datos aún" />
            <Kpi icon={GaugeIcon} tone="teal" value="—" label="Carga promedio" sub="Sin datos aún" />
          </>
        ) : (
          <>
            <Kpi icon={CalendarCheck} tone="blue" value="214" label="Asignaciones activas" sub="9% vs. mes anterior" trend="up" />
            <Kpi icon={UserRoundX} tone="orange" value="56" label="Radiólogos sin asignar" sub="19.5% del total" />
            <Kpi icon={Building2} tone="green" value="49 / 58" label="Hospitales con cobertura" sub="84.5% de la red" />
            <Kpi icon={Clock} tone="purple" value="17" label="Solicitudes pendientes" sub="5 con prioridad alta" />
            <Kpi icon={GaugeIcon} tone="teal" value="78%" label="Carga promedio" sub="de la capacidad asignada" />
          </>
        )}
      </div>

      {/* Filtros */}
      <div key={fk} className="card mt-3 grid grid-cols-1 items-end gap-3 px-4 py-3.5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
        <SearchInput placeholder="Buscar por radiólogo, hospital o código..." />
        <div><label className="label">Hospital</label><Select options={['Todos', ...HOSPITALES]} /></div>
        <div><label className="label">Modalidad</label><Select options={['Todas', ...MODS]} /></div>
        <div><label className="label">Región</label><Select options={['Todas', ...REGIONES_FILTRO]} /></div>
        <div><label className="label">Estado</label><Select options={['Todos', 'Activa', 'Pendiente', 'Suspendida', 'Finalizada']} onChange={setEstado} /></div>
        <button onClick={() => { setFk(fk + 1); setEstado('Todos') }} className="btn-outline justify-center px-10">Limpiar</button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-3 xl:col-span-8">
          <Panel title="Listado de asignaciones" subtitle={`${rows.length === ASIGS.length ? (VACIO ? 0 : 248) : rows.length} asignaciones encontradas`} bodyClass="px-0 pb-0">
            <Table>
              <thead className="bg-[#f6f9fe]">
                <tr>{['Radiólogo', 'Hospital', 'Modalidades', 'Fecha de asignación', 'Carga de estudios', 'Estado', ''].map((x) => <th key={x} className="th">{x}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map(({ a, i }) => {
                  const pct = Math.round((a.carga / a.capacidad) * 100)
                  return (
                    <tr key={a.id} onClick={() => { setSel(i); setTab(0) }} className={clsx('tr cursor-pointer', i === sel && tab === 0 && '!bg-brand-50 shadow-[inset_3px_0_0_#0b57f0]')}>
                      <td className="td">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <UserSilhouette size={26} className="!bg-brand-600 [&_circle]:fill-white [&_path]:fill-white" />
                          <div><div className="font-semibold text-ink">{a.rad}</div><div className="text-[11px] text-slate-500">{a.radId}</div></div>
                        </div>
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Building2 size={15} /></span>
                          <div><div className="whitespace-nowrap text-ink">{a.hospital}</div><div className="text-[11px] text-slate-500">{a.codigo} · {a.region}</div></div>
                        </div>
                      </td>
                      <td className="td"><span className="flex gap-1">{a.mods.map((m) => <Modality key={m} m={m} />)}</span></td>
                      <td className="td whitespace-nowrap">{a.fecha}</td>
                      <td className="td min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <Bar value={a.carga} max={a.capacidad} color={cargaColor(pct)} height={7} className="rounded-full" />
                          <span className="w-9 shrink-0 text-right tabular-nums text-ink">{pct}%</span>
                        </div>
                        <div className="text-[10.5px] text-slate-500">{a.carga} / {a.capacidad} estudios</div>
                      </td>
                      <td className="td"><Badge tone={estadoTone[a.estado]} icon={a.estado === 'Activa'}>{a.estado}</Badge></td>
                      <td className="td" onClick={(e) => e.stopPropagation()}><DotsButton /></td>
                    </tr>
                  )
                })}
                {rows.length === 0 && <tr><td colSpan={7} className="td py-6 text-center text-slate-400">{VACIO ? 'Aún no hay asignaciones registradas' : 'No hay asignaciones con ese estado'}</td></tr>}
              </tbody>
            </Table>
            {VACIO
              ? <Pagination text="Mostrando 0 de 0 asignaciones" page={1} totalPages={1} />
              : <Pagination text="Mostrando 1 a 10 de 248 asignaciones" pages={[1, 2, 3, 4, 5]} last={25} />}
          </Panel>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
            <Panel title="Cobertura por región" icon={MapPinned} subtitle="Hospitales con al menos un radiólogo asignado" action={<MoreLink onClick={() => navigate('/admin/operaciones')}>Ver mapa</MoreLink>} bodyClass="px-0 pb-2">
              <Table>
                <thead className="bg-[#f6f9fe]"><tr>{['Región de salud', 'Hospitales', 'Con cobertura', 'Radiólogos', 'Cobertura'].map((x) => <th key={x} className="th">{x}</th>)}</tr></thead>
                <tbody>
                  {cobertura.map((c) => {
                    const pct = Math.round((c.cub / c.h) * 100)
                    return (
                      <tr key={c.r} className="tr">
                        <td className="td whitespace-nowrap font-medium text-ink">{c.r}</td>
                        <td className="td text-center">{c.h}</td>
                        <td className="td text-center">{c.cub}</td>
                        <td className="td text-center">{c.rad}</td>
                        <td className="td min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <Bar value={pct} color={pct === 100 ? '#16a34a' : pct >= 75 ? '#2f6bff' : '#f59e0b'} height={7} className="rounded-full" />
                            <span className="w-9 shrink-0 text-right tabular-nums text-ink">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {cobertura.length === 0 && <tr><td colSpan={5} className="td py-6 text-center text-slate-400">Sin datos de cobertura aún</td></tr>}
                </tbody>
              </Table>
            </Panel>
            <Panel title="Hospitales sin cobertura" icon={Clock} subtitle="Solicitudes de radiólogo pendientes" action={<MoreLink>Ver todas</MoreLink>}>
              <ul className="divide-y divide-[#eef2f8]">
                {pendientes.map((p) => (
                  <li key={p.h} className="flex items-center gap-2.5 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500"><Building2 size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-semibold text-ink">{p.h}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">{p.m.map((m) => <Modality key={m} m={m} className="!py-0 !text-[10px]" />)} · {p.f}</div>
                    </div>
                    <Badge tone={p.p === 'Alta' ? 'red' : p.p === 'Media' ? 'orange' : 'gray'}>{p.p}</Badge>
                  </li>
                ))}
                {pendientes.length === 0 && <li className="py-6 text-center text-[12.5px] text-slate-400">No hay solicitudes pendientes</li>}
              </ul>
              <button onClick={() => setTab(1)} className="btn-outline mt-2 w-full justify-center gap-1.5 text-[12.5px]"><Plus size={15} /> Asignar radiólogo</button>
            </Panel>
          </div>
        </div>

        <section className="card self-start xl:col-span-4">
          <Tabs className="mx-4 mt-2" size="md" tabs={[{ label: 'Detalle de asignación', icon: CalendarCheck }, { label: 'Nueva asignación', icon: Plus }]} active={tab} onChange={setTab} />
          <div className="p-4">
            {tab === 0
              ? (ASIGS[sel] ? <DetalleAsig a={ASIGS[sel]} /> : <div className="py-10 text-center text-[12.5px] text-slate-400">Sin registros. Crea una asignación para ver aquí su detalle.</div>)
              : <NuevaAsignacion onDone={() => setTab(0)} />}
          </div>
        </section>
      </div>
    </div>
  )
}
