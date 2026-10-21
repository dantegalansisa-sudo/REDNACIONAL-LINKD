import { useState, type ReactNode } from 'react'
import {
  Bell, Building2, ChevronDown, Clock, Database, Download, HardDrive, Link2, Palette, RefreshCw, Save, Settings,
  ShieldCheck, SlidersHorizontal, Upload, Wrench, Info, BellRing, Mail, MessageSquare, Smartphone, type LucideIcon,
} from 'lucide-react'
import { Badge, DotsButton, Kpi, Modal, PageHeader, Panel, Select, Table, Tabs, Toggle, clsx, type Tone } from '../../components/ui'
import { RnsLogo } from '../../components/Logo'
import { BRAND } from '../../config/brand'

/* ---------- Helpers ---------- */
function SaveButton({ label = 'Guardar cambios', className }: { label?: string; className?: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" onClick={() => { setOk(true); setTimeout(() => setOk(false), 1800) }}
      className={clsx('btn-primary py-1.5', ok && '!bg-emerald-600', className)}>
      <Save size={16} /> {ok ? 'Cambios guardados' : label}
    </button>
  )
}

function ToggleRow({ icon: Icon = Settings, title, desc, on, onChange }: {
  icon?: LucideIcon; title: string; desc?: string; on: boolean; onChange: (v: boolean) => void
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-brand-600"><Icon size={17} /></span>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium text-ink">{title}</div>
        {desc && <div className="text-[11.5px] text-slate-500">{desc}</div>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </li>
  )
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-center gap-1 sm:grid-cols-[150px_1fr] sm:gap-3">
      <span className="text-[12.5px] text-ink/80">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/* ---------- Datos mock ---------- */
const INTEGRACIONES: { sistema: string; estado: string; tone: Tone; fecha: string; tipo: string; endpoint: string }[] = [
  { sistema: 'Repositorio Nacional', estado: 'Conectado', tone: 'green', fecha: '15/03/2025 10:24 a. m.', tipo: 'DICOMweb', endpoint: 'https://repo.sns.gob.do/dicomweb' },
  { sistema: 'LINKConnect (HL7)', estado: 'Conectado', tone: 'green', fecha: '15/03/2025 09:18 a. m.', tipo: 'HL7 v2.5', endpoint: 'mllp://linkconnect.sns.gob.do:2575' },
  { sistema: 'PACS', estado: 'Conectado', tone: 'green', fecha: '15/03/2025 08:41 a. m.', tipo: 'DICOM C-STORE', endpoint: 'pacs.sns.gob.do:104' },
  { sistema: 'RIS', estado: 'Conectado', tone: 'green', fecha: '15/03/2025 08:32 a. m.', tipo: 'REST API', endpoint: 'https://ris.sns.gob.do/api/v2' },
  { sistema: 'eFactura (DGII)', estado: 'En configuración', tone: 'orange', fecha: '14/03/2025 11:43 p. m.', tipo: 'REST API', endpoint: 'https://ecf.dgii.gov.do/api' },
]

const NOTIFS = [
  { title: 'Notificaciones por correo electrónico', desc: 'Envío de alertas del sistema', on: true },
  { title: 'Notificaciones de estudios críticos', desc: 'Alertas inmediatas a radiólogos y administradores', on: true },
  { title: 'Notificaciones de asignación de estudios', desc: 'Aviso al radiólogo asignado', on: true },
  { title: 'Notificaciones de informes completados', desc: 'Aviso a médicos referidores y hospitales', on: true },
  { title: 'Notificaciones del sistema', desc: 'Mantenimiento, actualizaciones y eventos importantes', on: false },
]

const PARAMS = [
  { label: 'Tiempo objetivo - Emergencia crítica', options: ['< 30 minutos', '< 15 minutos', '< 60 minutos'] },
  { label: 'Tiempo objetivo - Urgencias', options: ['1 - 2 horas', '< 1 hora', '2 - 4 horas'] },
  { label: 'Tiempo objetivo - Hospitalizado', options: ['24 - 48 horas', '12 - 24 horas', '48 - 72 horas'] },
  { label: 'Tiempo objetivo - Ambulatorio', options: ['3 - 7 días', '1 - 3 días', '7 - 15 días'] },
]

/* ---------- Bloques ---------- */
function InfoPlataforma() {
  return (
    <Panel title="Información de la plataforma" icon={Building2}>
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 items-center gap-1 sm:grid-cols-[150px_1fr_auto_110px] sm:gap-3">
          <span className="text-[12.5px] text-ink/80">Nombre de la plataforma</span>
          <input className="input" defaultValue={BRAND.domain} />
          <span className="text-[12.5px] text-ink/80">Siglas</span>
          <input className="input" defaultValue={BRAND.short} />
        </div>
        <FieldRow label="Descripción"><textarea className="input min-h-[46px] resize-none" defaultValue="Plataforma nacional para la coordinación de la atención diagnóstica." /></FieldRow>
        <FieldRow label="Zona horaria"><Select options={['(UTC-04:00) Santo Domingo', '(UTC-05:00) Bogotá', '(UTC-04:00) Caracas']} /></FieldRow>
        <FieldRow label="Idioma"><Select options={['Español (República Dominicana)', 'English (United States)']} /></FieldRow>
        <div className="flex justify-end pt-1"><SaveButton /></div>
      </div>
    </Panel>
  )
}

function IntegracionesTabla({ full = false }: { full?: boolean }) {
  return (
    <Table>
      <thead>
        <tr className="bg-[#f5f8fd]">
          {['Sistema', ...(full ? ['Tipo', 'Endpoint'] : []), 'Estado', 'Última conexión', 'Acciones'].map((h) => <th key={h} className="th">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {INTEGRACIONES.map((i) => (
          <tr key={i.sistema} className="tr">
            <td className="td whitespace-nowrap py-1.5 text-ink">{i.sistema}</td>
            {full && <><td className="td py-1.5">{i.tipo}</td><td className="td py-1.5 font-mono text-[11.5px]">{i.endpoint}</td></>}
            <td className="td py-1.5"><Badge tone={i.tone} icon={i.tone === 'green'}>{i.estado}</Badge></td>
            <td className="td whitespace-nowrap py-1.5">{i.fecha}</td>
            <td className="td py-1.5"><DotsButton /></td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

function Notificaciones({ title = 'Configuración de notificaciones' }: { title?: string }) {
  const [state, setState] = useState(NOTIFS.map((n) => n.on))
  return (
    <Panel title={title} icon={Bell}>
      <ul className="divide-y divide-transparent">
        {NOTIFS.map((n, i) => (
          <ToggleRow key={n.title} icon={Settings} title={n.title} desc={n.desc} on={state[i]}
            onChange={(v) => setState(state.map((s, j) => (j === i ? v : s)))} />
        ))}
      </ul>
      <div className="flex justify-end pt-1"><SaveButton /></div>
    </Panel>
  )
}

function Parametros() {
  return (
    <Panel title="Parámetros clínicos" icon={SlidersHorizontal}>
      <div className="space-y-2.5">
        {PARAMS.map((p) => (
          <div key={p.label} className="grid grid-cols-1 items-center gap-1 sm:grid-cols-[1fr_minmax(160px,0.85fr)] sm:gap-3">
            <span className="text-[12.5px] text-ink/80">{p.label}</span>
            <Select options={p.options} />
          </div>
        ))}
        <div className="flex justify-end pt-1"><SaveButton /></div>
      </div>
    </Panel>
  )
}

function Mantenimiento() {
  const [backup, setBackup] = useState(true)
  const [maint, setMaint] = useState(false)
  return (
    <Panel title="Mantenimiento y respaldo" icon={Database}>
      <ul>
        <ToggleRow icon={ShieldCheck} title="Respaldo automático de la base de datos" desc="Último respaldo: 15/03/2025 02:00 a. m." on={backup} onChange={setBackup} />
        <li className="flex flex-wrap items-center gap-3 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center text-brand-600"><Settings size={17} /></span>
          <span className="flex-1 text-[12.5px] font-medium text-ink">Conservación de respaldos</span>
          <Select options={['30 días', '60 días', '90 días', '180 días']} className="w-full sm:w-[280px]" />
        </li>
        <ToggleRow icon={ShieldCheck} title="Modo de mantenimiento" desc="Solo administradores pueden acceder al sistema" on={maint} onChange={setMaint} />
      </ul>
    </Panel>
  )
}

function Apariencia() {
  const [color, setColor] = useState('#0d6efd')
  const [logoModal, setLogoModal] = useState(false)
  return (
    <Panel title="Apariencia y visualización" icon={Palette}>
      <div className="space-y-3">
        <FieldRow label="Tema del sistema"><Select options={['Claro (por defecto)', 'Oscuro', 'Automático']} className="max-w-[280px]" /></FieldRow>
        <FieldRow label="Logo institucional">
          <div className="flex flex-wrap items-center gap-4">
            <RnsLogo className="h-11 w-auto" />
            <button className="btn-outline py-1.5" onClick={() => setLogoModal(true)}>Cambiar logo</button>
          </div>
        </FieldRow>
        <div className="grid grid-cols-1 items-center gap-1 sm:grid-cols-[150px_1fr_auto] sm:gap-3">
          <span className="text-[12.5px] text-ink/80">Color principal</span>
          <label className="relative flex max-w-[150px] items-center">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute left-2 h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0" />
            <input className="input pl-9" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
          <SaveButton />
        </div>
      </div>
      <Modal open={logoModal} onClose={() => setLogoModal(false)} className="max-w-[460px]">
        <div className="p-6">
          <h2 className="mb-1 text-[18px] font-bold text-ink">Cambiar logo institucional</h2>
          <p className="mb-4 text-[12.5px] text-slate-500">Formatos admitidos: PNG o SVG, fondo transparente, máximo 2 MB.</p>
          <div className="mb-4 flex justify-center rounded-lg border border-[#e6edf8] bg-[#f7f9fd] p-4"><RnsLogo className="h-16 w-auto" /></div>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-brand-200 px-4 py-6 text-center text-[12.5px] text-brand-700 hover:bg-brand-50">
            <Upload size={22} /> Arrastre el archivo aquí o haga clic para seleccionarlo
            <input type="file" accept="image/png,image/svg+xml" className="hidden" />
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-outline" onClick={() => setLogoModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={() => setLogoModal(false)}>Guardar logo</button>
          </div>
        </div>
      </Modal>
    </Panel>
  )
}

/* ---------- Pestañas ---------- */
function GeneralTab() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-4 xl:col-span-6">
        <InfoPlataforma />
        <Panel title="Integraciones principales" icon={Link2} bodyClass="!px-2"><IntegracionesTabla /></Panel>
        <Mantenimiento />
      </div>
      <div className="flex min-w-0 flex-col gap-4 xl:col-span-6">
        <Notificaciones />
        <Parametros />
        <Apariencia />
      </div>
    </div>
  )
}

function IntegracionesTab() {
  const [hl7, setHl7] = useState(true)
  const [dicom, setDicom] = useState(true)
  const [retry, setRetry] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Panel className="xl:col-span-8" title="Sistemas integrados" icon={Link2} bodyClass="!px-2"
        action={<button className="btn-primary py-1.5"><Link2 size={16} /> Nueva integración</button>}>
        <IntegracionesTabla full />
      </Panel>
      <div className="flex flex-col gap-4 xl:col-span-4">
        <Panel title="Opciones de interoperabilidad" icon={SlidersHorizontal}>
          <ul>
            <ToggleRow icon={MessageSquare} title="Mensajería HL7 (ADT/ORM/ORU)" desc="Recepción de órdenes y envío de resultados" on={hl7} onChange={setHl7} />
            <ToggleRow icon={HardDrive} title="Enrutamiento DICOM automático" desc="Envío de estudios al repositorio nacional" on={dicom} onChange={setDicom} />
            <ToggleRow icon={RefreshCw} title="Reintento automático" desc="Reintentar envíos fallidos cada 5 minutos" on={retry} onChange={setRetry} />
          </ul>
          <div className="flex justify-end pt-1"><SaveButton /></div>
        </Panel>
        <Panel title="Probar conexión" icon={RefreshCw}>
          <div className="space-y-2">
            {INTEGRACIONES.map((i) => (
              <div key={i.sistema} className="flex items-center justify-between gap-2 text-[12.5px]">
                <span className="text-ink">{i.sistema}</span>
                <button className="btn-outline px-2.5 py-1 text-[12px]" onClick={() => { setTesting(i.sistema); setTimeout(() => setTesting(null), 1200) }}>
                  <RefreshCw size={13} className={clsx(testing === i.sistema && 'animate-spin')} /> {testing === i.sistema ? 'Probando…' : 'Probar'}
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function NotificacionesTab() {
  const [canales, setCanales] = useState({ email: true, sms: false, push: true, inapp: true })
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="xl:col-span-7"><Notificaciones title="Eventos notificados" /></div>
      <div className="flex flex-col gap-4 xl:col-span-5">
        <Panel title="Canales de envío" icon={BellRing}>
          <ul>
            <ToggleRow icon={Mail} title="Correo electrónico" desc={`Remitente: ${BRAND.supportEmail}`} on={canales.email} onChange={(v) => setCanales({ ...canales, email: v })} />
            <ToggleRow icon={Smartphone} title="SMS" desc="Solo para estudios críticos" on={canales.sms} onChange={(v) => setCanales({ ...canales, sms: v })} />
            <ToggleRow icon={BellRing} title="Notificaciones push" desc="Aplicación móvil del radiólogo" on={canales.push} onChange={(v) => setCanales({ ...canales, push: v })} />
            <ToggleRow icon={Bell} title="Notificaciones en la plataforma" desc="Campana de alertas del panel" on={canales.inapp} onChange={(v) => setCanales({ ...canales, inapp: v })} />
          </ul>
        </Panel>
        <Panel title="Escalamiento de alertas críticas" icon={Clock}>
          <div className="space-y-2.5">
            <FieldRow label="Escalar si no hay acuse"><Select options={['15 minutos', '10 minutos', '30 minutos']} /></FieldRow>
            <FieldRow label="Escalar a"><Select options={['Coordinador regional', 'Administrador nacional', 'Director del hospital']} /></FieldRow>
            <div className="flex justify-end pt-1"><SaveButton /></div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function ParametrosTab() {
  const mods = [
    { m: 'Tomografía (CT)', t: '60 min' }, { m: 'Resonancia (RM)', t: '2 h' }, { m: 'Rayos X (RX)', t: '30 min' },
    { m: 'Ecografía (US)', t: '60 min' }, { m: 'Mamografía (MG)', t: '24 h' },
  ]
  const [dobleLectura, setDoble] = useState(false)
  const [plantillas, setPlantillas] = useState(true)
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="flex flex-col gap-4 xl:col-span-6">
        <Parametros />
        <Panel title="Reglas de lectura" icon={ShieldCheck}>
          <ul>
            <ToggleRow icon={ShieldCheck} title="Doble lectura en mamografía" desc="Requiere validación por un segundo radiólogo" on={dobleLectura} onChange={setDoble} />
            <ToggleRow icon={Settings} title="Plantillas estructuradas obligatorias" desc="Para informes de CT y RM" on={plantillas} onChange={setPlantillas} />
          </ul>
        </Panel>
      </div>
      <Panel className="xl:col-span-6" title="Tiempo objetivo por modalidad" icon={Clock} bodyClass="!px-2">
        <Table>
          <thead><tr className="bg-[#f5f8fd]">{['Modalidad', 'Tiempo objetivo', 'Alerta previa', 'Prioridad'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {mods.map((m) => (
              <tr key={m.m} className="tr">
                <td className="td whitespace-nowrap text-ink">{m.m}</td>
                <td className="td"><input className="input max-w-[110px] py-1" defaultValue={m.t} /></td>
                <td className="td"><Select options={['80% del tiempo', '90% del tiempo', '70% del tiempo']} className="max-w-[160px]" /></td>
                <td className="td"><Select options={['Normal', 'Alta', 'Urgente']} className="max-w-[120px]" /></td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="flex justify-end px-2 pt-3"><SaveButton /></div>
      </Panel>
    </div>
  )
}

function MantenimientoTab() {
  const [running, setRunning] = useState(false)
  const respaldos = [
    ['15/03/2025 02:00 a. m.', 'Automático', '48.2 GB', 'Completado'],
    ['14/03/2025 02:00 a. m.', 'Automático', '48.0 GB', 'Completado'],
    ['13/03/2025 02:00 a. m.', 'Automático', '47.8 GB', 'Completado'],
    ['12/03/2025 04:15 p. m.', 'Manual', '47.7 GB', 'Completado'],
    ['12/03/2025 02:00 a. m.', 'Automático', '47.6 GB', 'Completado'],
  ]
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="flex flex-col gap-4 xl:col-span-5">
        <Mantenimiento />
        <Panel title="Acciones de mantenimiento" icon={Wrench}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button className="btn-primary" onClick={() => { setRunning(true); setTimeout(() => setRunning(false), 1800) }}>
              <Database size={16} className={clsx(running && 'animate-pulse')} /> {running ? 'Respaldando…' : 'Respaldar ahora'}
            </button>
            <button className="btn-outline"><RefreshCw size={16} /> Limpiar caché</button>
            <button className="btn-outline"><Download size={16} /> Descargar logs</button>
            <button className="btn-outline"><Info size={16} /> Información del sistema</button>
          </div>
        </Panel>
      </div>
      <Panel className="xl:col-span-7" title="Historial de respaldos" icon={HardDrive} bodyClass="!px-2">
        <Table>
          <thead><tr className="bg-[#f5f8fd]">{['Fecha', 'Tipo', 'Tamaño', 'Estado', 'Acciones'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {respaldos.map((r) => (
              <tr key={r[0]} className="tr">
                <td className="td whitespace-nowrap text-ink">{r[0]}</td>
                <td className="td">{r[1]}</td>
                <td className="td tabular-nums">{r[2]}</td>
                <td className="td"><Badge tone="green" icon>{r[3]}</Badge></td>
                <td className="td"><button className="link-more"><Download size={13} /> Descargar</button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  )
}

/* ---------- Página ---------- */
export default function Configuracion() {
  const [tab, setTab] = useState(0)
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <div>
      <PageHeader
        icon={Settings}
        title="Configuración"
        subtitle="Parámetros generales de la plataforma, integraciones y opciones de operación"
        actions={
          <div className="relative">
            <button className="btn-primary min-w-[160px]" onClick={() => setExportOpen(!exportOpen)}>
              <Upload size={17} /> Exportar <ChevronDown size={16} className="ml-3" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-lg border border-[#e3eaf6] bg-white py-1 shadow-lg">
                {['Exportar PDF', 'Exportar Excel', 'Exportar CSV'].map((o) => (
                  <button key={o} onClick={() => setExportOpen(false)} className="block w-full px-4 py-2 text-left text-[13px] hover:bg-brand-50">{o}</button>
                ))}
              </div>
            )}
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi icon={Building2} tone="blue" value="128" label="Hospitales configurados" />
        <Kpi icon={Database} tone="blue" value="6" label="Integraciones activas" />
        <Kpi icon={Settings} tone="blue" value="12" label="Parámetros del sistema" />
        <Kpi icon={ShieldCheck} tone="blue" value="3" label="Políticas de seguridad" />
        <Kpi icon={Clock} tone="blue" value="1" label="Respaldo programado" sub="Diario - 02:00 a. m." />
      </div>

      <div className="card mb-4 px-3">
        <Tabs size="md" active={tab} onChange={setTab} className="border-b-0"
          tabs={[
            { label: 'General', icon: Settings }, { label: 'Integraciones', icon: Link2 }, { label: 'Notificaciones', icon: Bell },
            { label: 'Parámetros clínicos', icon: SlidersHorizontal }, { label: 'Mantenimiento', icon: Wrench },
          ]} />
      </div>

      {tab === 0 && <GeneralTab />}
      {tab === 1 && <IntegracionesTab />}
      {tab === 2 && <NotificacionesTab />}
      {tab === 3 && <ParametrosTab />}
      {tab === 4 && <MantenimientoTab />}
    </div>
  )
}
