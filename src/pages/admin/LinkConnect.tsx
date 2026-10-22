import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowDownToLine, ArrowUpFromLine, BarChart3, Building2, CalendarDays, Check, ChevronDown, ChevronLeft,
  ChevronRight, Clock, CloudUpload, Info, Link2, Network, RefreshCw, Search, Server, Settings, ShieldCheck, TriangleAlert, X,
  type LucideIcon,
} from 'lucide-react'
import { Badge, DotsButton, IconCircle, InfoRow, Kpi, MoreLink, PageHeader, Panel, Table, clsx, type Tone } from '../../components/ui'
import { Gauge, Lines } from '../../components/charts'
import { supabaseConfigurado } from '../../lib/admin-data'

/* ---------------- Datos mock ---------------- */
type Estado = 'Conectado' | 'En sincronización' | 'Desconectado'
const estadoTone: Record<Estado, Tone> = { Conectado: 'green', 'En sincronización': 'orange', Desconectado: 'red' }

type LC = {
  hospital: string; codigo: string; ubicacion: string; estado: Estado; conexion: string; velocidad: number
  marca: string; modelo: string; serial: string; ram: string; cpu: string; disco: string; so: string; version: string
  host: string; ip: string; aet: string; uso: [number, number, number]; bajada: number; subida: number
}

const mk = (i: number, hospital: string, ubicacion: string, estado: Estado, conexion: string, velocidad: number, uso: [number, number, number], marca = 'Dell', modelo = 'PowerEdge R740'): LC => {
  const code = `H-${String(i).padStart(3, '0')}`
  return {
    hospital, codigo: code, ubicacion, estado, conexion, velocidad, marca, modelo,
    serial: ['5Y3F2K1', '7H2K9L3', '3M8P1Q7', '9D4R6T2', '2B7N5V8', '6C1X3Z9', '8F5G2H4', '4J9K7L1', '1P6Q3R8', '5S2T9U4'][i - 1],
    ram: i % 3 === 0 ? '64 GB' : '128 GB', cpu: 'Intel Xeon Silver 4210 (10 núcleos)', disco: '2 x 1.92 TB SSD (RAID 1)',
    so: 'Ubuntu Server 22.04 LTS', version: i === 5 ? 'v2.7.9' : 'v2.8.1', host: i === 1 ? 'hphm-linkconnect' : `${code.toLowerCase().replace('-', '')}-linkconnect`,
    ip: `192.168.10.${14 + i}`, aet: i === 1 ? 'HPHM_LC' : `${code.replace('-', '')}_LC`, uso,
    bajada: velocidad === 0 ? 0 : Math.round(velocidad * 2.5), subida: velocidad === 0 ? 0 : Math.round(velocidad * 2.5) - 1,
  }
}

const MOCK_LINKS: LC[] = [
  mk(1, 'Hospital Pediátrico Hugo Mendoza', 'Santo Domingo, DN', 'Conectado', '12/03/2025 10:24', 98, [18, 42, 31]),
  mk(2, 'Hospital Dr. Marcelino Vélez', 'Santo Domingo, DN', 'Conectado', '12/03/2025 10:22', 78, [24, 51, 44]),
  mk(3, 'Hospital Padre Billini', 'Santo Domingo, DN', 'Conectado', '12/03/2025 10:20', 65, [12, 38, 27], 'HPE', 'ProLiant DL380 Gen10'),
  mk(4, 'Hospital Dr. Francisco Moscoso Puello', 'Santo Domingo, DN', 'Conectado', '12/03/2025 10:18', 72, [31, 47, 52]),
  mk(5, 'Hospital Traumatológico Ney Arias Lora', 'Santo Domingo Norte', 'En sincronización', '12/03/2025 10:15', 54, [67, 72, 58]),
  mk(6, 'Hospital Juan Pablo Pina', 'San Cristóbal', 'Conectado', '12/03/2025 10:12', 63, [21, 40, 36], 'Lenovo', 'ThinkSystem SR650'),
  mk(7, 'Hospital Regional Taiwán 19 de Marzo', 'Azua', 'Conectado', '12/03/2025 10:10', 49, [15, 33, 29]),
  mk(8, 'Hospital Regional San Juan de la Maguana', 'San Juan', 'Desconectado', '12/03/2025 09:42', 0, [0, 0, 41]),
  mk(9, 'Hospital Dr. Alejandro Cabral', 'San Juan', 'Conectado', '12/03/2025 10:08', 58, [19, 36, 22], 'HPE', 'ProLiant DL360 Gen10'),
  mk(10, 'Hospital Regional Antonio Musa', 'San Pedro de Macoris', 'Conectado', '12/03/2025 10:06', 67, [14, 30, 18]),
]

const LINKS: LC[] = supabaseConfigurado ? [] : MOCK_LINKS

const ACTION_ICONS: LucideIcon[] = [RefreshCw, BarChart3, ShieldCheck, BarChart3, RefreshCw, BarChart3, BarChart3, BarChart3, RefreshCw, BarChart3]

const MOCK_ALERTAS: { icon: LucideIcon; tone: Tone; t: string; s?: string; d: string }[] = [
  { icon: AlertTriangle, tone: 'red', t: 'Error de conexión', s: 'Hospital Regional San Juan de la Maguana', d: '12/03/2025 09:42' },
  { icon: TriangleAlert, tone: 'orange', t: 'Retraso en sincronización', s: 'Hospital Traumatológico Ney Arias Lora', d: '12/03/2025 08:15' },
  { icon: Info, tone: 'blue', t: 'Reinicio del servicio LINKConnect', d: '11/03/2025 22:30' },
  { icon: ShieldCheck, tone: 'green', t: 'Actualización de seguridad aplicada', d: '10/03/2025 16:20' },
  { icon: Info, tone: 'blue', t: 'Alta de nuevo hospital', s: 'Hospital Regional Antonio Musa', d: '10/03/2025 11:45' },
]
const alertas = supabaseConfigurado ? [] : MOCK_ALERTAS

type Mov = { f: string; h: string; e: string; st: 'Exitoso' | 'Fallido' | 'Reenviado' }
const MOCK_MOVIMIENTOS: Mov[] = [
  { f: '12/03/2025 10:24', h: 'H-001', e: 'Envío de estudio', st: 'Exitoso' },
  { f: '12/03/2025 10:18', h: 'H-004', e: 'Recepción de estudio', st: 'Exitoso' },
  { f: '12/03/2025 09:42', h: 'H-008', e: 'Error de transmisión', st: 'Fallido' },
  { f: '12/03/2025 08:15', h: 'H-005', e: 'Reenvío de estudio', st: 'Reenviado' },
  { f: '12/03/2025 07:32', h: 'H-002', e: 'Envío de estudio', st: 'Exitoso' },
]
const movimientos: Mov[] = supabaseConfigurado ? [] : MOCK_MOVIMIENTOS
const movStyle: Record<Mov['st'], { tone: Tone; icon: LucideIcon }> = {
  Exitoso: { tone: 'green', icon: Check }, Fallido: { tone: 'red', icon: X }, Reenviado: { tone: 'blue', icon: RefreshCw },
}

const dias = Array.from({ length: 31 }, (_, i) => i)
const wave = (base: number, amp: number, seed: number) => dias.map((d) => Math.round(base + amp * Math.sin(d / 2.3 + seed) + amp * 0.6 * Math.cos(d / 1.3 + seed * 2)))
const enviados = wave(1050, 230, 0.4)
const fallidos = wave(70, 30, 1.7)
const reenviados = wave(45, 20, 2.6)

const MOCK_CONFIG: [string, ReactNode][] = [
  ['Protocolo de integración', 'DICOM / HL7'],
  ['Repositorio Nacional', 'Activo (https://repo.sns.gob.do)'],
  ['Nombre Host (DICOM)', 'hphm-linkconnect'],
  ['IP Address (DICOM)', '192.168.10.15'],
  ['Puerto (DICOM)', '104'],
  ['AETitle (DICOM)', 'HPHM_LC'],
  ['Integración HL7', <Badge key="hl7" tone="green" dot={false}>Activo</Badge>],
  ['Integración XRoad', <span key="xr" className="font-medium text-red-500">No</span>],
  ['Tiempo de espera (timeout)', '60 seg'],
  ['Reintentos automáticos', '3'],
  ['Horario de operación', '24/7'],
  ['Servidor de respaldo', <Badge key="bk" tone="green" dot={false}>Activo</Badge>],
  ['Certificado SSL', 'Válido (hasta 01/2026)'],
]
const CONFIG_VACIA: [string, ReactNode][] = [
  ['Protocolo de integración', 'DICOM / HL7'],
  ['Repositorio Nacional', '—'],
  ['Nombre Host (DICOM)', '—'],
  ['IP Address (DICOM)', '—'],
  ['Puerto (DICOM)', '—'],
  ['AETitle (DICOM)', '—'],
  ['Integración HL7', '—'],
  ['Integración XRoad', '—'],
  ['Tiempo de espera (timeout)', '—'],
  ['Reintentos automáticos', '—'],
  ['Horario de operación', '—'],
  ['Servidor de respaldo', '—'],
  ['Certificado SSL', '—'],
]
const config = supabaseConfigurado ? CONFIG_VACIA : MOCK_CONFIG

function SinDatos({ texto = 'Sin datos para mostrar', className }: { texto?: string; className?: string }) {
  return <div className={clsx('flex min-h-[120px] items-center justify-center text-center text-[12.5px] text-slate-400', className)}>{texto}</div>
}

/* ---------------- Página ---------------- */
export default function LinkConnect() {
  const navigate = useNavigate()
  const [sel, setSel] = useState(0)
  const [q, setQ] = useState('')
  const lc: LC | undefined = LINKS[sel]
  const rows = LINKS.map((l, i) => ({ l, i })).filter(({ l }) => (l.hospital + l.codigo + l.ubicacion).toLowerCase().includes(q.toLowerCase()))
  const online = lc ? lc.estado !== 'Desconectado' : false

  return (
    <div>
      <PageHeader
        icon={Server}
        breadcrumb={
          <span className="flex items-center gap-1.5">
            <ChevronLeft size={13} />
            <button onClick={() => navigate('/admin/linkconnect')} className="text-brand-600 hover:underline">LINKConnect</button>
            <ChevronRight size={13} /> Interoperabilidad
          </span>
        }
        title="LINKConnect e Interoperabilidad"
        subtitle="Gestión de conexiones, recepción y envío de estudios al Repositorio Nacional"
        actions={
          <button className="flex items-center gap-3 rounded-lg border border-[#d7e1f2] bg-white px-3.5 py-2.5 text-[13px] text-ink shadow-sm hover:border-brand-400">
            <CalendarDays size={17} className="text-brand-600" /> {supabaseConfigurado ? 'Seleccionar período' : '01/03/2025 - 31/03/2025'} <ChevronDown size={15} />
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {supabaseConfigurado ? (
          <>
            <Kpi icon={Link2} tone="blue" value="0" label="Hospitales conectados" sub="Sin datos aún" />
            <Kpi icon={CloudUpload} tone="blue" value="0" label="Estudios enviados" sub="Sin datos aún" />
            <Kpi icon={AlertTriangle} tone="red" value="0" label="Estudios fallidos" sub="Sin datos aún" />
            <Kpi icon={RefreshCw} tone="blue" value="0" label="Estudios reenviados" sub="Sin datos aún" />
            <Kpi icon={Clock} tone="blue" value="—" label="Tiempo promedio de envío" sub="Sin datos aún" />
          </>
        ) : (
          <>
            <Kpi icon={Link2} tone="blue" value={<span className="flex items-center gap-2">12 <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">100%</span></span>} label="Hospitales conectados" sub="de 12 registrados" />
            <Kpi icon={CloudUpload} tone="blue" value="8,432" label="Estudios enviados" sub="12% vs. mes anterior" trend="up" />
            <Kpi icon={AlertTriangle} tone="red" value="214" label="Estudios fallidos" sub="-32% vs. mes anterior" trend="down" />
            <Kpi icon={RefreshCw} tone="blue" value="367" label="Estudios reenviados" sub="-18% vs. mes anterior" trend="down" />
            <Kpi icon={Clock} tone="blue" value="2.8 min" label="Tiempo promedio de envío" sub="-45% vs. mes anterior" trend="down" />
          </>
        )}
      </div>

      {/* Tabla + detalle */}
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel
          title="LINKConnects instalados"
          className="xl:col-span-7"
          bodyClass="px-0 pb-2"
          action={
            <label className="relative hidden w-full max-w-[310px] items-center sm:flex">
              <Search size={15} className="pointer-events-none absolute left-3 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} className="input py-1.5 pl-9 text-[12px]" placeholder="Buscar LINKConnect por hospital, código o ubicación..." />
            </label>
          }
        >
          <Table>
            <thead className="bg-[#f6f9fe]">
              <tr>{['Hospital / Centro', 'Ubicación', 'Estado', 'Última conexión', 'Velocidad Internet', 'Acciones'].map((x) => <th key={x} className="th">{x}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map(({ l, i }) => {
                const A = ACTION_ICONS[i]
                return (
                  <tr key={l.codigo} onClick={() => setSel(i)} className={clsx('tr cursor-pointer', i === sel && '!bg-brand-50 shadow-[inset_3px_0_0_#0b57f0]')}>
                    <td className="td">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Building2 size={16} /></span>
                        <div><div className="whitespace-nowrap text-[12px] font-semibold text-ink">{l.hospital}</div><div className="text-[11px] text-slate-500">{l.codigo}</div></div>
                      </div>
                    </td>
                    <td className="td whitespace-nowrap">{l.ubicacion}</td>
                    <td className="td"><Badge tone={estadoTone[l.estado]} icon={l.estado === 'Conectado'}>{l.estado}</Badge></td>
                    <td className="td whitespace-nowrap tabular-nums">{l.conexion}</td>
                    <td className="td whitespace-nowrap">{l.velocidad} Mbps</td>
                    <td className="td" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 text-brand-600 hover:bg-brand-100" title="Sincronizar"><A size={14} /></button>
                        <DotsButton />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="td py-6 text-center text-slate-400">{LINKS.length === 0 ? 'Aún no hay LINKConnect instalados' : 'Sin resultados'}</td></tr>
              )}
            </tbody>
          </Table>
        </Panel>

        <div className="flex flex-col gap-3 xl:col-span-5">
          {!lc ? (
            <section className="card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="card-title"><Server size={20} className="text-brand-600" /> Detalle del LINKConnect</h3>
              </div>
              <SinDatos texto="Aún no hay LINKConnect instalados" className="min-h-[200px]" />
            </section>
          ) : (
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="card-title"><Server size={20} className="text-brand-600" /> LINKConnect de {lc.hospital.replace('Hospital Pediátrico', 'Hospital P.')}</h3>
              <Badge tone={online ? 'green' : 'red'} icon={online}>{online ? 'En línea' : 'Fuera de línea'}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px]">
              <div className="rounded-lg border border-[#eef2f8] px-3 py-1">
                <InfoRow label="Ubicación">{lc.ubicacion}</InfoRow>
                <InfoRow label="Marca">{lc.marca}</InfoRow>
                <InfoRow label="Modelo">{lc.modelo}</InfoRow>
                <InfoRow label="Serial">{lc.serial}</InfoRow>
                <InfoRow label="Memoria RAM">{lc.ram}</InfoRow>
                <InfoRow label="Procesador">{lc.cpu}</InfoRow>
                <InfoRow label="Almacenamiento">{lc.disco}</InfoRow>
                <InfoRow label="Sistema Operativo">{lc.so}</InfoRow>
                <InfoRow label="Versión de LINKConnect">{lc.version}</InfoRow>
                <InfoRow label="Nombre Host (DICOM)">{lc.host}</InfoRow>
                <InfoRow label="IP Address (DICOM)">{lc.ip}</InfoRow>
                <InfoRow label="Puerto (DICOM)">104</InfoRow>
                <InfoRow label="AETitle (DICOM)">{lc.aet}</InfoRow>
                <InfoRow label="Integración">HL7 <span className={online ? 'text-emerald-600' : 'text-red-500'}>({online ? 'Activo' : 'Inactivo'})</span></InfoRow>
              </div>
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-[#eef2f8] p-3">
                  <div className="mb-2 text-[13px] font-bold text-ink">Rendimiento</div>
                  <div className="flex flex-wrap justify-around gap-2">
                    <Gauge value={lc.uso[0]} label="CPU" color="#2f8cff" size={72} />
                    <Gauge value={lc.uso[1]} label="RAM" color="#16a34a" size={72} />
                    <Gauge value={lc.uso[2]} label="Disco" color="#a855f7" size={72} />
                  </div>
                </div>
                <div className="rounded-lg border border-[#eef2f8] p-3">
                  <div className="mb-2 text-[13px] font-bold text-ink">Conectividad</div>
                  {[{ i: ArrowDownToLine, l: 'Velocidad de bajada', v: lc.bajada }, { i: ArrowUpFromLine, l: 'Velocidad de subida', v: lc.subida }].map(({ i: I, l, v }) => (
                    <div key={l} className="flex items-center gap-2.5 py-1.5">
                      <IconCircle icon={I} tone="blue" size="sm" />
                      <div><div className="text-[10.5px] text-slate-500">{l}</div><div className="text-[14px] font-bold text-ink">{v} Mbps</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          )}

          <Panel title="Últimas alertas" icon={Clock} action={<MoreLink onClick={() => navigate('/admin/operaciones')}>Ver todas</MoreLink>}>
            {alertas.length === 0 && <SinDatos texto="Aún no hay alertas registradas" className="min-h-[80px]" />}
            <ul className="space-y-1">
              {alertas.map((a) => (
                <li key={a.t} className="flex items-start gap-2.5 py-1">
                  <IconCircle icon={a.icon} tone={a.tone} size="sm" className="!h-7 !w-7" />
                  <div className="min-w-0 text-[12px] leading-snug">
                    <div className="text-ink">{a.t}{a.s && <span className="text-ink/80"> · {a.s}</span>}</div>
                    <div className="text-[11px] text-slate-500">{a.d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {/* Estadísticas + movimientos + configuración */}
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:col-span-7">
          <Panel
            title="Estadísticas de transmisión"
            action={
              <div className="hidden items-center gap-3 text-[11px] text-slate-600 sm:flex">
                {[['Enviados', '#2f8cff'], ['Fallidos', '#ef4444'], ['Reenviados', '#f59e0b']].map(([n, c]) => (
                  <span key={n} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{n}</span>
                ))}
              </div>
            }
          >
            {supabaseConfigurado ? <SinDatos className="min-h-[190px]" /> : <Lines
              labels={['01/03', '05/03', '10/03', '15/03', '20/03', '25/03', '31/03']}
              series={[
                { name: 'Enviados', color: '#2f8cff', values: enviados },
                { name: 'Fallidos', color: '#ef4444', values: fallidos },
                { name: 'Reenviados', color: '#f59e0b', values: reenviados },
              ]}
              max={2000}
              height={190}
            />}
          </Panel>
          <Panel title="Últimos movimientos" action={<MoreLink>Ver todas</MoreLink>} bodyClass="px-0 pb-2">
            <Table>
              <thead className="bg-[#f6f9fe]"><tr>{['Fecha y hora', 'Hospital', 'Evento', 'Estado'].map((x) => <th key={x} className="th">{x}</th>)}</tr></thead>
              <tbody>
                {movimientos.map((m) => {
                  const s = movStyle[m.st]
                  return (
                    <tr key={m.f} className="tr">
                      <td className="td whitespace-nowrap tabular-nums">{m.f}</td>
                      <td className="td">{m.h}</td>
                      <td className="td whitespace-nowrap">{m.e}</td>
                      <td className="td"><Badge tone={s.tone} dot={false}><s.icon size={12} />{m.st}</Badge></td>
                    </tr>
                  )
                })}
                {movimientos.length === 0 && <tr><td colSpan={4} className="td py-6 text-center text-slate-400">Aún no hay movimientos registrados</td></tr>}
              </tbody>
            </Table>
          </Panel>
        </div>
        <Panel title="Configuración y servicios" icon={Settings} action={<button className="text-[12px] font-semibold text-brand-600 hover:underline">Editar</button>} className="xl:col-span-5">
          <div className="rounded-lg border border-[#eef2f8] px-3 py-1">
            {config.map(([k, v]) => <InfoRow key={k} label={k} className="py-1">{v}</InfoRow>)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><Network size={13} /> Configuración global aplicada a todos los LINKConnect de la red.</div>
        </Panel>
      </div>
    </div>
  )
}
