import { useState } from 'react'
import {
  Building2, CheckCircle2, ChevronDown, Clock, Download, FileSpreadsheet, FileText, Mail, Phone, Plus,
  ScanEye, Scan, XCircle, Bone, Brain, Waves, HeartPulse, Monitor, ClipboardList, Network, UserRound, type LucideIcon,
} from 'lucide-react'
import {
  Badge, Checkbox, DotsButton, InfoRow, Kpi, Modal, MoreLink, PageHeader, Pagination, Panel, SearchInput, Select,
  Table, Tabs, Toggle, clsx, type Tone,
} from '../../components/ui'

/* ---------------- Datos mock ---------------- */
type Estado = 'Activo' | 'En proceso' | 'Inactivo'
type Hospital = {
  nombre: string; tipo: string; codigo: string; provincia: string; municipio: string; nivel: 'I' | 'II' | 'III'; estado: Estado
  direccion: string; telefono: string; email: string; registro: string; actualizado: string
}

const HOSPITALES: Hospital[] = [
  { nombre: 'Hospital Pediátrico Hugo Mendoza', tipo: 'Hospital Especializado Pediátrico', codigo: 'H-001', provincia: 'Santo Domingo', municipio: 'Santo Domingo Oeste', nivel: 'III', estado: 'Activo', direccion: 'Av. San Vicente de Paúl esq. Carretera Los Alcarrizos', telefono: '809-530-1180', email: 'info@hugomendoza.gob.do', registro: '15/03/2020', actualizado: '12/03/2025 10:24' },
  { nombre: 'Hospital Dr. Marcelino Vélez', tipo: 'Hospital General Docente', codigo: 'H-002', provincia: 'Santo Domingo', municipio: 'Santo Domingo Oeste', nivel: 'III', estado: 'Activo', direccion: 'Av. Isabel Aguiar, Herrera', telefono: '809-530-6969', email: 'info@marcelinovelez.gob.do', registro: '02/06/2020', actualizado: '11/03/2025 16:40' },
  { nombre: 'Hospital Padre Billini', tipo: 'Hospital General Docente', codigo: 'H-003', provincia: 'Santo Domingo', municipio: 'Santo Domingo', nivel: 'III', estado: 'Activo', direccion: 'Calle Santomé No. 39, Ciudad Colonial', telefono: '809-333-5656', email: 'info@padrebillini.gob.do', registro: '20/07/2020', actualizado: '10/03/2025 09:12' },
  { nombre: 'Hospital Dr. Francisco Moscoso Puello', tipo: 'Hospital General Docente', codigo: 'H-004', provincia: 'Santo Domingo', municipio: 'Santo Domingo', nivel: 'III', estado: 'Activo', direccion: 'Av. Nicolás de Ovando, Cristo Rey', telefono: '809-681-6922', email: 'info@moscosopuello.gob.do', registro: '11/09/2020', actualizado: '09/03/2025 14:05' },
  { nombre: 'Hospital Traumatológico Ney Arias Lora', tipo: 'Hospital Especializado', codigo: 'H-005', provincia: 'Santo Domingo', municipio: 'Santo Domingo Norte', nivel: 'III', estado: 'Activo', direccion: 'Autopista Duarte Km 10 ½, Ciudad Juan Bosch', telefono: '809-948-7777', email: 'info@neyariaslora.gob.do', registro: '05/01/2021', actualizado: '12/03/2025 08:30' },
  { nombre: 'Hospital Juan Pablo Pina', tipo: 'Hospital General', codigo: 'H-006', provincia: 'San Cristóbal', municipio: 'San Cristóbal', nivel: 'II', estado: 'Activo', direccion: 'Av. Constitución, San Cristóbal', telefono: '809-528-3361', email: 'info@juanpablopina.gob.do', registro: '18/03/2021', actualizado: '08/03/2025 11:20' },
  { nombre: 'Hospital Regional Taiwán 19 de Marzo', tipo: 'Hospital General', codigo: 'H-007', provincia: 'Azua', municipio: 'Azua', nivel: 'II', estado: 'Activo', direccion: 'Carretera Sánchez, Azua de Compostela', telefono: '809-521-3335', email: 'info@hospitaltaiwan.gob.do', registro: '22/04/2021', actualizado: '07/03/2025 15:47' },
  { nombre: 'Hospital Regional San Juan de la Maguana', tipo: 'Hospital General', codigo: 'H-008', provincia: 'San Juan', municipio: 'San Juan de la Maguana', nivel: 'II', estado: 'Activo', direccion: 'Calle Independencia, San Juan de la Maguana', telefono: '809-557-2210', email: 'info@hrsanjuan.gob.do', registro: '30/06/2021', actualizado: '12/03/2025 09:42' },
  { nombre: 'Hospital Dr. Alejandro Cabral', tipo: 'Hospital General', codigo: 'H-009', provincia: 'San Juan', municipio: 'San Juan de la Maguana', nivel: 'II', estado: 'En proceso', direccion: 'Av. Anacaona, San Juan de la Maguana', telefono: '809-557-2040', email: 'info@alejandrocabral.gob.do', registro: '14/02/2025', actualizado: '12/03/2025 10:08' },
  { nombre: 'Hospital Regional Antonio Musa', tipo: 'Hospital General', codigo: 'H-010', provincia: 'San Pedro de Macorís', municipio: 'San Pedro de Macoris', nivel: 'II', estado: 'Activo', direccion: 'Av. Independencia, San Pedro de Macorís', telefono: '809-529-3567', email: 'info@antoniomusa.gob.do', registro: '10/03/2025', actualizado: '10/03/2025 11:45' },
]

const estadoTone: Record<Estado, Tone> = { Activo: 'green', 'En proceso': 'orange', Inactivo: 'red' }

const SERVICIOS_IMG: { m: string; name: string; icon: LucideIcon; cls: string }[] = [
  { m: 'RX', name: 'Rayos X', icon: Bone, cls: 'bg-brand-50 text-brand-600' },
  { m: 'TC', name: 'Tomografía', icon: Scan, cls: 'bg-sky-50 text-sky-600' },
  { m: 'RM', name: 'Resonancia', icon: Brain, cls: 'bg-violet-50 text-violet-600' },
  { m: 'US', name: 'Ultrasonido', icon: Waves, cls: 'bg-emerald-50 text-emerald-600' },
  { m: 'MG', name: 'Mamografía', icon: HeartPulse, cls: 'bg-pink-50 text-pink-500' },
]

const ROW_ICONS: { icon: LucideIcon; title: string }[] = [
  { icon: ScanEye, title: 'Tomografía' }, { icon: ClipboardList, title: 'Rayos X' }, { icon: Waves, title: 'Ultrasonido' }, { icon: Monitor, title: 'PACS / Visor' },
]

const PROVINCIAS = ['Santo Domingo', 'Distrito Nacional', 'San Cristóbal', 'Azua', 'San Juan', 'San Pedro de Macorís', 'Santiago', 'La Vega']

function Nivel({ n }: { n: Hospital['nivel'] }) {
  return (
    <span className={clsx('inline-flex h-[20px] min-w-[26px] items-center justify-center rounded px-1 text-[10.5px] font-bold',
      n === 'III' ? 'bg-violet-100 text-violet-700' : n === 'II' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-600')}>{n}</span>
  )
}

/* ---------------- Modal registro ---------------- */
function RegistrarHospital({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [done, setDone] = useState(false)
  const [mods, setMods] = useState<string[]>(['RX', 'TC'])
  const close = () => { onClose(); setTimeout(() => setDone(false), 200) }
  return (
    <Modal open={open} onClose={close} className="max-w-[860px]">
      <div className="flex items-center gap-3 border-b border-[#eef2f8] px-6 py-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white"><Building2 size={22} /></span>
        <div>
          <h2 className="text-[19px] font-bold text-ink">Registrar hospital</h2>
          <p className="text-[12.5px] text-slate-500">Agrega un nuevo hospital o centro a la red nacional de imágenes médicas</p>
        </div>
      </div>
      {done ? (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <CheckCircle2 size={56} className="text-emerald-500" />
          <h3 className="mt-3 text-[18px] font-bold text-ink">Hospital registrado correctamente</h3>
          <p className="mt-1 max-w-md text-[13px] text-slate-500">El hospital quedó en estado <b>En proceso</b> hasta completar la instalación de LINKConnect y la validación de integración.</p>
          <button onClick={close} className="btn-primary mt-6">Aceptar</button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setDone(true) }}>
          <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-5">
            <section>
              <h4 className="mb-3 text-[13.5px] font-bold text-ink">Información general</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2"><label className="label">Nombre oficial <span className="req text-red-500">*</span></label><input required className="input" placeholder="Ej. Hospital Regional Dr. ..." /></div>
                <div><label className="label">Código</label><input className="input-ro" value="H-059" readOnly /></div>
                <div><label className="label">Tipo de centro <span className="text-red-500">*</span></label><Select options={['Hospital General', 'Hospital General Docente', 'Hospital Especializado', 'Hospital Especializado Pediátrico', 'Centro de Diagnóstico']} /></div>
                <div><label className="label">Nivel de atención <span className="text-red-500">*</span></label><Select options={['Nivel III', 'Nivel II', 'Nivel I']} /></div>
                <div><label className="label">Estado inicial</label><Select options={['En proceso', 'Activo', 'Inactivo']} /></div>
              </div>
            </section>
            <section>
              <h4 className="mb-3 text-[13.5px] font-bold text-ink">Ubicación y contacto</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div><label className="label">Provincia <span className="text-red-500">*</span></label><Select placeholder="Seleccionar" value="" options={PROVINCIAS} /></div>
                <div><label className="label">Municipio <span className="text-red-500">*</span></label><input required className="input" placeholder="Municipio" /></div>
                <div><label className="label">Región de salud</label><Select options={['Región 0 - Metropolitana', 'Región I - Valdesia', 'Región II - Norcentral', 'Región III - Nordeste', 'Región IV - Enriquillo', 'Región V - Este', 'Región VI - El Valle', 'Región VII - Cibao Occidental', 'Región VIII - Cibao Central']} /></div>
                <div className="sm:col-span-2 lg:col-span-3"><label className="label">Dirección <span className="text-red-500">*</span></label><input required className="input" placeholder="Calle, número, sector" /></div>
                <div><label className="label">Teléfono</label><input className="input" placeholder="809-000-0000" /></div>
                <div><label className="label">Email institucional</label><input type="email" className="input" placeholder="info@hospital.gob.do" /></div>
                <div><label className="label">Director(a) médico</label><input className="input" placeholder="Nombre completo" /></div>
              </div>
            </section>
            <section>
              <h4 className="mb-3 text-[13.5px] font-bold text-ink">Servicios de imágenes</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {SERVICIOS_IMG.map((s) => {
                  const on = mods.includes(s.m)
                  return (
                    <button type="button" key={s.m} onClick={() => setMods(on ? mods.filter((x) => x !== s.m) : [...mods, s.m])}
                      className={clsx('flex flex-col items-center gap-1 rounded-lg border px-2 py-3 transition', on ? 'border-brand-500 bg-brand-50' : 'border-[#e3eaf6] bg-white hover:border-brand-300')}>
                      <span className={clsx('flex h-9 w-9 items-center justify-center rounded-lg', s.cls)}><s.icon size={19} /></span>
                      <span className="text-[13px] font-bold text-ink">{s.m}</span>
                      <span className="text-[11px] text-slate-500">{s.name}</span>
                    </button>
                  )
                })}
              </div>
            </section>
            <section>
              <h4 className="mb-3 text-[13.5px] font-bold text-ink">Integración</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div><label className="label">Sistema PACS / RIS</label><input className="input" placeholder="Ej. dcm4chee, Orthanc" /></div>
                <div><label className="label">AETitle (DICOM)</label><input className="input" placeholder="HOSP_AE" /></div>
                <div><label className="label">Integración HL7</label><Select options={['Pendiente', 'Activa', 'No aplica']} /></div>
              </div>
              <Checkbox className="mt-3" checked label="Solicitar instalación de LINKConnect al registrar" />
            </section>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#eef2f8] bg-[#f8fafe] px-6 py-3.5">
            <button type="button" onClick={close} className="btn-outline">Cancelar</button>
            <button type="submit" className="btn-primary gap-2"><Plus size={16} /> Registrar hospital</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

/* ---------------- Panel detalle ---------------- */
function Detalle({ h }: { h: Hospital }) {
  const [tab, setTab] = useState(0)
  const [srv, setSrv] = useState<Record<string, boolean>>({ Emergencia: true, Hospitalización: true, 'Cuidados intensivos': h.nivel === 'III', Teleradiología: true, 'Lectura 24/7': h.nivel === 'III' })
  return (
    <section className="card overflow-hidden">
      <img src="/img/crops/hospital-hugo.webp" alt={h.nombre} className="h-[150px] w-full object-cover" />
      <div className="px-4 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[18px] font-bold leading-tight text-ink">{h.nombre}</h2>
          <Badge tone={estadoTone[h.estado]} icon={h.estado === 'Activo'}>{h.estado}</Badge>
        </div>
        <p className="text-[12.5px] text-slate-500">{h.tipo} · {h.codigo}</p>
      </div>
      <Tabs className="mx-4 mt-3" tabs={['Información', 'Servicios', 'Equipos', 'Contactos', 'Integración']} active={tab} onChange={setTab} />
      <div className="px-4 pb-4 pt-3">
        {tab === 0 && (
          <>
            <div className="rounded-lg bg-[#f6f9fe] px-3 py-2">
              <div className="mb-1 flex items-center justify-between"><h4 className="text-[13.5px] font-bold text-ink">Información general</h4><button className="text-[12px] font-semibold text-brand-600">Editar</button></div>
              <InfoRow label="Nombre oficial">{h.nombre}</InfoRow>
              <InfoRow label="Código">{h.codigo}</InfoRow>
              <InfoRow label="Nivel"><span className="flex items-center gap-1.5"><Nivel n={h.nivel} /> {h.tipo}</span></InfoRow>
              <InfoRow label="Provincia">{h.provincia}</InfoRow>
              <InfoRow label="Municipio">{h.municipio}</InfoRow>
              <InfoRow label="Dirección">{h.direccion}</InfoRow>
              <InfoRow label="Teléfono"><span className="flex items-center gap-1.5"><Phone size={13} className="text-ink" />{h.telefono}</span></InfoRow>
              <InfoRow label="Email"><span className="flex items-center gap-1.5 break-all"><Mail size={13} className="shrink-0 text-ink" />{h.email}</span></InfoRow>
              <InfoRow label="Estado"><Badge tone={estadoTone[h.estado]} icon={h.estado === 'Activo'}>{h.estado}</Badge></InfoRow>
              <InfoRow label="Fecha de registro">{h.registro}</InfoRow>
              <InfoRow label="Última actualización">{h.actualizado}</InfoRow>
            </div>
            <div className="mt-3 rounded-lg bg-[#f6f9fe] px-3 py-2.5">
              <div className="mb-2 flex items-center justify-between"><h4 className="text-[13.5px] font-bold text-ink">Servicios de imágenes</h4><MoreLink>Gestionar</MoreLink></div>
              <div className="grid grid-cols-5 gap-1.5">
                {SERVICIOS_IMG.map((s) => (
                  <div key={s.m} className="flex flex-col items-center rounded-lg border border-[#e6edf8] bg-white px-1 py-2 text-center">
                    <span className={clsx('flex h-8 w-8 items-center justify-center rounded-lg', s.cls)}><s.icon size={17} /></span>
                    <span className="mt-1 text-[12.5px] font-bold text-ink">{s.m}</span>
                    <span className="truncate text-[10.5px] text-slate-500">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {tab === 1 && (
          <ul className="divide-y divide-[#eef2f8]">
            {Object.entries(srv).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between py-2.5 text-[13px] text-ink">{k}<Toggle on={v} onChange={(x) => setSrv({ ...srv, [k]: x })} /></li>
            ))}
          </ul>
        )}
        {tab === 2 && (
          <Table>
            <thead><tr>{['Equipo', 'Modalidad', 'Marca / Modelo', 'Estado'].map((x) => <th key={x} className="th">{x}</th>)}</tr></thead>
            <tbody>
              {[['Tomógrafo 64 cortes', 'TC', 'Siemens Somatom go.Up', 'green'], ['Resonador 1.5T', 'RM', 'GE Signa Explorer', 'green'], ['Rayos X digital', 'RX', 'Philips DigitalDiagnost', 'green'], ['Ecógrafo', 'US', 'Mindray DC-70', 'orange'], ['Mamógrafo', 'MG', 'Hologic Selenia', 'green']].map(([e, m, mm, t]) => (
                <tr key={e} className="tr"><td className="td text-ink">{e}</td><td className="td">{m}</td><td className="td">{mm}</td><td className="td"><Badge tone={t as Tone}>{t === 'green' ? 'Operativo' : 'Mantenimiento'}</Badge></td></tr>
              ))}
            </tbody>
          </Table>
        )}
        {tab === 3 && (
          <ul className="space-y-2">
            {[['Dra. Rosa Almonte', 'Directora médica', '809-530-1180 ext. 201'], ['Dr. Manuel Peña', 'Jefe de Imágenes', '809-530-1180 ext. 310'], ['Ing. Pedro Valdez', 'Encargado TI', '809-530-1180 ext. 450']].map(([n, r, t]) => (
              <li key={n} className="flex items-center gap-3 rounded-lg border border-[#e6edf8] px-3 py-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600"><UserRound size={18} /></span>
                <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold text-ink">{n}</div><div className="text-[11.5px] text-slate-500">{r}</div></div>
                <span className="text-[11.5px] text-slate-600">{t}</span>
              </li>
            ))}
          </ul>
        )}
        {tab === 4 && (
          <div className="rounded-lg bg-[#f6f9fe] px-3 py-2">
            <InfoRow label="LINKConnect"><Badge tone={h.estado === 'Activo' ? 'green' : 'orange'}>{h.estado === 'Activo' ? 'Conectado' : 'En instalación'}</Badge></InfoRow>
            <InfoRow label="Protocolo">DICOM / HL7</InfoRow>
            <InfoRow label="AETitle (DICOM)">{h.codigo.replace('-', '')}_LC</InfoRow>
            <InfoRow label="Integración HL7">{h.estado === 'Activo' ? 'Activa' : 'Pendiente'}</InfoRow>
            <InfoRow label="Última sincronización">{h.actualizado}</InfoRow>
            <InfoRow label="Repositorio Nacional"><span className="flex items-center gap-1.5"><Network size={13} /> Activo</span></InfoRow>
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------------- Página ---------------- */
export default function Hospitales() {
  const [sel, setSel] = useState(0)
  const [modal, setModal] = useState(false)
  const [exp, setExp] = useState(false)
  const [filterKey, setFilterKey] = useState(0)

  return (
    <div>
      <PageHeader
        icon={Building2}
        title="Registro Nacional de Hospitales"
        subtitle="Directorio de hospitales y centros de la red de imágenes médicas"
        actions={
          <>
            <button onClick={() => setModal(true)} className="btn-primary gap-2"><Plus size={17} /> Registrar hospital</button>
            <div className="relative">
              <button onClick={() => setExp(!exp)} className="btn-outline gap-2"><Download size={16} /> Exportar <ChevronDown size={15} /></button>
              {exp && (
                <div className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-lg border border-[#e3eaf6] bg-white py-1 shadow-soft">
                  {[['Excel (.xlsx)', FileSpreadsheet], ['PDF', FileText], ['CSV', FileText]].map(([l, I]) => {
                    const Icon = I as LucideIcon
                    return <button key={l as string} onClick={() => setExp(false)} className="flex w-full items-center gap-2 px-3 py-2 text-[12.5px] hover:bg-brand-50"><Icon size={15} className="text-brand-600" />{l as string}</button>
                  })}
                </div>
              )}
            </div>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi icon={Building2} tone="blue" value="58" label="Hospitales registrados"><MoreLink>Ver todos</MoreLink></Kpi>
        <Kpi icon={CheckCircle2} tone="green" value="52" label="Activos" sub="89.7% del total" />
        <Kpi icon={Clock} tone="orange" value="4" label="En proceso" sub="6.9% del total" />
        <Kpi icon={XCircle} tone="red" value="2" label="Inactivos" sub="3.4% del total" />
        <Kpi icon={ScanEye} tone="purple" value="124" label="Equipos de imágenes" sub="En toda la red" />
      </div>

      {/* Filtros */}
      <div key={filterKey} className="card mt-3 grid grid-cols-1 items-end gap-3 px-4 py-3.5 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto]">
        <div><label className="label">Buscar hospital</label><SearchInput placeholder="Nombre, código o provincia..." /></div>
        <div><label className="label">Provincia</label><Select options={['Todas', ...PROVINCIAS]} /></div>
        <div><label className="label">Municipio</label><Select options={['Todos', 'Santo Domingo', 'Santo Domingo Oeste', 'Santo Domingo Norte', 'San Cristóbal', 'Azua', 'San Juan de la Maguana']} /></div>
        <div><label className="label">Nivel</label><Select options={['Todos', 'Nivel I', 'Nivel II', 'Nivel III']} /></div>
        <div><label className="label">Estado</label><Select options={['Todos', 'Activo', 'En proceso', 'Inactivo']} /></div>
        <button onClick={() => setFilterKey(filterKey + 1)} className="btn-outline justify-center px-7">Limpiar</button>
      </div>

      {/* Listado + detalle */}
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel title="Listado de hospitales" subtitle="58 hospitales encontrados" className="xl:col-span-8" bodyClass="px-0 pb-0 flex flex-col">
          <Table className="flex-1">
            <thead className="bg-[#f6f9fe]">
              <tr>{['Hospital / Centro', 'Código', 'Provincia', 'Municipio', 'Nivel', 'Estado', 'Servicios de imagen', ''].map((x) => <th key={x} className="th">{x}</th>)}</tr>
            </thead>
            <tbody>
              {HOSPITALES.map((h, i) => (
                <tr key={h.codigo} onClick={() => setSel(i)}
                  className={clsx('tr cursor-pointer', i === sel && '!bg-brand-50 shadow-[inset_3px_0_0_#0b57f0]')}>
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Building2 size={17} /></span>
                      <div className="min-w-0"><div className="whitespace-nowrap text-[12.5px] font-semibold text-ink">{h.nombre}</div><div className="whitespace-nowrap text-[11.5px] text-slate-500">{h.tipo}</div></div>
                    </div>
                  </td>
                  <td className="td">{h.codigo}</td>
                  <td className="td">{h.provincia}</td>
                  <td className="td">{h.municipio}</td>
                  <td className="td"><Nivel n={h.nivel} /></td>
                  <td className="td"><Badge tone={estadoTone[h.estado]} icon={h.estado === 'Activo'}>{h.estado}</Badge></td>
                  <td className="td">
                    <div className="flex gap-1.5">
                      {ROW_ICONS.map(({ icon: I, title }) => (
                        <span key={title} title={title} className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 text-brand-600"><I size={15} /></span>
                      ))}
                    </div>
                  </td>
                  <td className="td" onClick={(e) => e.stopPropagation()}><DotsButton /></td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination text="Mostrando 1 a 10 de 58 hospitales" pages={[1, 2, 3, 4, 5, 6]} />
        </Panel>
        <div className="xl:col-span-4">
          <Detalle key={sel} h={HOSPITALES[sel]} />
        </div>
      </div>

      <RegistrarHospital open={modal} onClose={() => setModal(false)} />
    </div>
  )
}
