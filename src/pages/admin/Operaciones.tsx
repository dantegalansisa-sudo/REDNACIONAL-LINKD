import { useState } from 'react'
import {
  AlertTriangle, ArrowRight, BarChart3, Building2, Clock, Database, FileText, Hospital, LayoutGrid, Map as MapIcon,
  Minus, Network, Plus, Radio, Server, ShieldPlus, Upload, UserRound, Wifi, ChevronDown, Bell, type LucideIcon,
} from 'lucide-react'
import { Badge, Bar, DotsButton, Kpi, MoreLink, PageHeader, Panel, Table, clsx, type Tone } from '../../components/ui'
import { Bars } from '../../components/charts'
import { supabaseConfigurado } from '../../lib/admin-data'

/* ---------- Datos mock ---------- */
type Estudio = { hora: string; paciente: string; hospital: string; mod: string; estado: string; tone: Tone; tiempo: string; dot: string }

const MOCK_ESTUDIOS: Record<string, Estudio[]> = {
  'En proceso': [
    { hora: '10:24 a. m.', paciente: 'Juan Pérez', hospital: 'HPHM', mod: 'CT', estado: 'En lectura', tone: 'green', tiempo: '12 min', dot: '#16a34a' },
    { hora: '10:18 a. m.', paciente: 'María López', hospital: 'HGA', mod: 'RX', estado: 'Crítico', tone: 'red', tiempo: '28 min', dot: '#ef4444' },
    { hora: '09:55 a. m.', paciente: 'Carlos Peña', hospital: 'HJM', mod: 'RM', estado: 'Asignado', tone: 'blue', tiempo: '45 min', dot: '#ef4444' },
    { hora: '09:32 a. m.', paciente: 'Ana Rodríguez', hospital: 'HRC', mod: 'US', estado: 'Informe', tone: 'orange', tiempo: '1 h 12 min', dot: '#ef4444' },
    { hora: '08:41 a. m.', paciente: 'Pedro Martínez', hospital: 'HRA', mod: 'CT', estado: 'Pendiente', tone: 'gray', tiempo: '2 h 05 min', dot: '#f59e0b' },
  ],
  'Críticos': [
    { hora: '10:18 a. m.', paciente: 'María López', hospital: 'HGA', mod: 'RX', estado: 'Crítico', tone: 'red', tiempo: '28 min', dot: '#ef4444' },
    { hora: '10:02 a. m.', paciente: 'Rafael Gómez', hospital: 'HPHM', mod: 'CT', estado: 'Crítico', tone: 'red', tiempo: '44 min', dot: '#ef4444' },
    { hora: '09:47 a. m.', paciente: 'Lucía Fernández', hospital: 'HJM', mod: 'RM', estado: 'Crítico', tone: 'red', tiempo: '59 min', dot: '#ef4444' },
    { hora: '09:15 a. m.', paciente: 'José Ramírez', hospital: 'HRC', mod: 'CT', estado: 'Sin acuse', tone: 'orange', tiempo: '1 h 31 min', dot: '#ef4444' },
    { hora: '08:58 a. m.', paciente: 'Carmen Díaz', hospital: 'HGA', mod: 'US', estado: 'Sin acuse', tone: 'orange', tiempo: '1 h 48 min', dot: '#ef4444' },
  ],
  'Sin asignar': [
    { hora: '10:31 a. m.', paciente: 'Miguel Santos', hospital: 'HRA', mod: 'RX', estado: 'Sin asignar', tone: 'gray', tiempo: '5 min', dot: '#f59e0b' },
    { hora: '10:27 a. m.', paciente: 'Rosa Castillo', hospital: 'HGA', mod: 'US', estado: 'Sin asignar', tone: 'gray', tiempo: '9 min', dot: '#f59e0b' },
    { hora: '10:12 a. m.', paciente: 'Luis Herrera', hospital: 'HPHM', mod: 'CT', estado: 'Sin asignar', tone: 'gray', tiempo: '24 min', dot: '#f59e0b' },
    { hora: '09:58 a. m.', paciente: 'Elena Vargas', hospital: 'HJM', mod: 'MG', estado: 'Sin asignar', tone: 'gray', tiempo: '38 min', dot: '#ef4444' },
    { hora: '09:40 a. m.', paciente: 'Andrés Reyes', hospital: 'HRC', mod: 'RX', estado: 'Sin asignar', tone: 'gray', tiempo: '56 min', dot: '#ef4444' },
  ],
  'Vencidos': [
    { hora: '07:12 a. m.', paciente: 'Sofía Medina', hospital: 'HRA', mod: 'RM', estado: 'Vencido', tone: 'red', tiempo: '3 h 24 min', dot: '#ef4444' },
    { hora: '06:50 a. m.', paciente: 'Héctor Núñez', hospital: 'HGA', mod: 'CT', estado: 'Vencido', tone: 'red', tiempo: '3 h 46 min', dot: '#ef4444' },
    { hora: '06:21 a. m.', paciente: 'Patricia Rosario', hospital: 'HJM', mod: 'MG', estado: 'Vencido', tone: 'red', tiempo: '4 h 15 min', dot: '#ef4444' },
    { hora: '05:44 a. m.', paciente: 'Francisco Mejía', hospital: 'HPHM', mod: 'US', estado: 'Vencido', tone: 'red', tiempo: '4 h 52 min', dot: '#ef4444' },
    { hora: '04:30 a. m.', paciente: 'Daniela Cruz', hospital: 'HRC', mod: 'RX', estado: 'Vencido', tone: 'red', tiempo: '6 h 06 min', dot: '#ef4444' },
  ],
}
const ESTUDIOS: Record<string, Estudio[]> = supabaseConfigurado ? {} : MOCK_ESTUDIOS
const TABS = [
  { label: 'En proceso', count: supabaseConfigurado ? '0' : '2,148' },
  { label: 'Críticos', count: supabaseConfigurado ? '0' : '24' },
  { label: 'Sin asignar', count: supabaseConfigurado ? '0' : '186' },
  { label: 'Vencidos', count: supabaseConfigurado ? '0' : '312' },
]

const sistemas: { name: string; icon: LucideIcon; ok: boolean }[] = [
  { name: 'Repositorio Nacional', icon: Database, ok: true },
  { name: 'LINKConnect', icon: Network, ok: true },
  { name: 'PACS', icon: Server, ok: true },
  { name: 'RIS', icon: FileText, ok: true },
  { name: 'Interoperabilidad (HL7)', icon: Radio, ok: false },
  { name: 'Red y comunicaciones', icon: Wifi, ok: true },
]

const MOCK_RESPUESTA = [
  { label: 'Tomografía (CT)', value: 48, max: 60, txt: '48 min', obj: 'Objetivo < 60 min', color: '#2f6bff' },
  { label: 'Resonancia (RM)', value: 65, max: 120, txt: '1 h 05 min', obj: 'Objetivo < 2 h', color: '#22b07d' },
  { label: 'Rayos X (RX)', value: 28, max: 120, txt: '28 min', obj: 'Objetivo < 30 min', color: '#f59e0b' },
  { label: 'Ecografía (US)', value: 42, max: 90, txt: '42 min', obj: 'Objetivo < 60 min', color: '#2f6bff' },
  { label: 'Mamografía (MG)', value: 110, max: 110, txt: '1 h 50 min', obj: 'Objetivo < 24 h', color: '#8b5cf6' },
]

const respuesta = supabaseConfigurado
  ? MOCK_RESPUESTA.map((r) => ({ ...r, value: 0, txt: '—' }))
  : MOCK_RESPUESTA

const horas = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const recibidos = [70, 55, 40, 32, 48, 60, 75, 110, 170, 200, 215, 190, 205, 220, 195, 230, 240, 210, 200, 185, 160, 140, 120, 95]
const completados = [35, 30, 20, 18, 25, 30, 38, 55, 85, 100, 108, 95, 100, 110, 98, 115, 120, 105, 98, 92, 80, 70, 60, 48]
const criticos = [10, 8, 6, 5, 7, 9, 12, 15, 22, 25, 28, 24, 26, 30, 27, 31, 33, 29, 26, 24, 20, 18, 15, 12]

const MOCK_TOP_HOSPITALES: [string, string, string, boolean][] = [
  ['HPHM - Hosp. Hugo Mendoza', '133,098', '512', true],
  ['HRA - Hosp. Dr. Fco. A. Gonzalvo', '86,644', '333', true],
  ['HJM - Hosp. Juan de Herrera', '56,760', '218', true],
  ['HRC - Hosp. Municipal Constanza', '18,020', '69', false],
  ['HGA - Hosp. Municipal La Vega', '9,148', '35', true],
]
const MOCK_TOP_PROVINCIAS = [
  ['La Vega', '229,559', '21.2%'],
  ['Santiago', '198,762', '18.3%'],
  ['Santo Domingo', '120,558', '11.1%'],
  ['Sánchez Ramírez', '72,239', '6.7%'],
  ['Monseñor Nouel', '62,118', '5.7%'],
]
const MOCK_ALERTAS: { hora: string; tipo: string; tone: Tone; msg: string }[] = [
  { hora: '10:15 a. m.', tipo: 'Crítico', tone: 'red', msg: 'Estudio CT sin acuse de recepción - HPHM' },
  { hora: '09:42 a. m.', tipo: 'Incidencia', tone: 'red', msg: 'Error de envío HL7 - HRC' },
  { hora: '09:18 a. m.', tipo: 'Sistema', tone: 'red', msg: 'Hospital HJM sin conexión' },
  { hora: '08:55 a. m.', tipo: 'SLA', tone: 'orange', msg: 'Estudio RM próximo a vencer - HRA' },
  { hora: '08:22 a. m.', tipo: 'Info', tone: 'blue', msg: 'Nuevo hospital conectado - Hospital de Constanza' },
]
const topHospitales = supabaseConfigurado ? [] : MOCK_TOP_HOSPITALES
const topProvincias = supabaseConfigurado ? [] : MOCK_TOP_PROVINCIAS
const alertas = supabaseConfigurado ? [] : MOCK_ALERTAS

const RESUMEN = supabaseConfigurado
  ? { total: '0', operativos: ['0', '—'], incidencias: ['0', '—'], sinConexion: ['0', '—'] }
  : { total: '128', operativos: ['102', '79.7%'], incidencias: ['18', '14.1%'], sinConexion: ['8', '6.2%'] }

function FilaVacia({ colSpan, texto }: { colSpan: number; texto: string }) {
  return <tr><td colSpan={colSpan} className="td py-6 text-center text-slate-400">{texto}</td></tr>
}

/* ---------- Página ---------- */
export default function Operaciones() {
  const [tab, setTab] = useState(0)
  const [exportOpen, setExportOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const rows = ESTUDIOS[TABS[tab].label] ?? []

  return (
    <div>
      <PageHeader
        icon={ShieldPlus}
        title="Centro de Operaciones"
        subtitle="Monitoreo en tiempo real de la red de hospitales, flujo de estudios, tiempos de respuesta y alertas críticas"
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

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {supabaseConfigurado ? (
          <>
            <Kpi icon={Hospital} tone="blue" value="0" label="Hospitales conectados" sub="Sin datos aún" />
            <Kpi icon={FileText} tone="blue" value="0" label="Estudios en proceso" sub="Sin datos aún" />
            <Kpi icon={AlertTriangle} tone="red" value="0" label="Estudios críticos" sub="Sin datos aún" />
            <Kpi icon={Clock} tone="blue" value="—" label="Tiempo promedio de reporte" sub="Sin datos aún" />
            <Kpi icon={UserRound} tone="blue" value="0" label="Radiólogos activos" sub="Sin datos aún" />
          </>
        ) : (
          <>
            <Kpi icon={Hospital} tone="blue" value="128" label="Hospitales conectados" sub="6 nuevos este mes" trend="up" />
            <Kpi icon={FileText} tone="blue" value="2,148" label="Estudios en proceso" sub="18% vs. ayer" trend="down" />
            <Kpi icon={AlertTriangle} tone="red" value="24" label="Estudios críticos" sub="11 sin acuse (≤ 15 min)" trend="up" trendTone="bad" />
            <Kpi icon={Clock} tone="blue" value="1 h 26 min" label="Tiempo promedio de reporte" sub="22% vs. mes anterior" trend="down" />
            <Kpi icon={UserRound} tone="blue" value="142" label="Radiólogos activos" sub="78% de disponibilidad" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
        {/* Mapa */}
        <Panel className="lg:col-span-2 xl:col-span-7" title="Mapa de hospitales y estado en tiempo real" icon={Building2}
          action={<button className="link-more rounded-md border border-brand-200 px-2 py-1"><MapIcon size={14} /> Ver todos los hospitales <ArrowRight size={13} /></button>}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_170px]">
            <div className="relative min-h-[260px] overflow-hidden rounded-lg bg-[#f5f8fd]">
              <img src="/img/crops/mapa-operaciones.webp" alt="Mapa de hospitales"
                className="h-full w-full object-contain transition-transform" style={{ transform: `scale(${zoom})` }} />
              <div className="absolute left-2 top-2 flex flex-col overflow-hidden rounded-md border border-[#d7e1f2] bg-white">
                <button className="p-1.5 hover:bg-brand-50" onClick={() => setZoom(Math.min(2, zoom + 0.2))} aria-label="Acercar"><Plus size={15} /></button>
                <button className="border-t border-[#d7e1f2] p-1.5 hover:bg-brand-50" onClick={() => setZoom(Math.max(1, zoom - 0.2))} aria-label="Alejar"><Minus size={15} /></button>
              </div>
              <ul className="absolute right-2 top-2 space-y-1 rounded-md bg-white/90 px-2.5 py-2 text-[12px] text-ink shadow-sm">
                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />Operativo ({RESUMEN.operativos[0]})</li>
                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Con incidencias ({RESUMEN.incidencias[0]})</li>
                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Sin conexión ({RESUMEN.sinConexion[0]})</li>
              </ul>
            </div>
            <div className="rounded-lg border border-[#e6edf8] p-3">
              <div className="text-[20px] font-bold leading-tight text-ink">{RESUMEN.total}</div>
              <div className="mb-3 text-[12px] text-ink/80">Total hospitales</div>
              {[
                { n: RESUMEN.operativos[0], l: 'Operativos', p: RESUMEN.operativos[1], c: 'bg-emerald-600' },
                { n: RESUMEN.incidencias[0], l: 'Con incidencias', p: RESUMEN.incidencias[1], c: 'bg-amber-500' },
                { n: RESUMEN.sinConexion[0], l: 'Sin conexión', p: RESUMEN.sinConexion[1], c: 'bg-red-500' },
              ].map((s) => (
                <div key={s.l} className="flex gap-2.5 border-t border-[#eef2f8] py-2.5">
                  <span className={clsx('mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white', s.c)}><Hospital size={11} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[17px] font-bold leading-tight text-ink">{s.n}</div>
                    <div className="flex justify-between gap-1 text-[11.5px] text-ink/80"><span>{s.l}</span><span>{s.p}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Estudios en tiempo real */}
        <Panel className="lg:col-span-2 xl:col-span-5" title="Estudios en tiempo real" icon={LayoutGrid} bodyClass="!px-0 !pb-0"
          action={<span className="flex items-center gap-1.5 text-[11.5px] text-slate-500"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />Actualización: en tiempo real</span>}>
          <div className="px-4">
            <div className="scroll-soft flex gap-1 overflow-x-auto border-b border-[#e6edf8]">
              {TABS.map((t, i) => (
                <button key={t.label} onClick={() => setTab(i)}
                  className={clsx('-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-[12.5px] font-medium',
                    i === tab ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-600 hover:text-brand-700')}>
                  {t.label}
                  <span className={clsx('rounded-md px-1.5 text-[11.5px] font-semibold', i === 0 ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600')}>{t.count}</span>
                </button>
              ))}
            </div>
          </div>
          <Table className="px-2">
            <thead>
              <tr>
                {['#', 'Hora', 'Paciente', 'Hospital', 'Modalidad', 'Estado', 'Tiempo', 'Acciones'].map((h) => <th key={h} className="th">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.paciente + i} className="tr">
                  <td className="td whitespace-nowrap"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: r.dot }} />{i + 1}</td>
                  <td className="td whitespace-nowrap">{r.hora}</td>
                  <td className="td whitespace-nowrap text-ink">{r.paciente}</td>
                  <td className="td">{r.hospital}</td>
                  <td className="td"><Badge tone="blue" dot={false} className="border border-brand-100 bg-white">{r.mod}</Badge></td>
                  <td className="td"><Badge tone={r.tone} icon={r.tone === 'green'}>{r.estado}</Badge></td>
                  <td className="td whitespace-nowrap">{r.tiempo}</td>
                  <td className="td"><DotsButton /></td>
                </tr>
              ))}
              {rows.length === 0 && <FilaVacia colSpan={8} texto="Aún no hay estudios registrados" />}
            </tbody>
          </Table>
          <div className="flex justify-end px-4 py-3"><MoreLink boxed>Ver todos los estudios</MoreLink></div>
        </Panel>

        {/* Estado de sistemas */}
        <Panel className="xl:col-span-4" title="Estado de los sistemas" icon={Server} action={<MoreLink boxed />}>
          <ul className="divide-y divide-[#eef2f8]">
            {sistemas.map((s) => (
              <li key={s.name} className="flex items-center gap-3 py-1.5 text-[12.5px]">
                <span className={clsx('flex h-5 w-5 items-center justify-center rounded', supabaseConfigurado ? 'bg-slate-100 text-slate-400' : s.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500')}><s.icon size={12} /></span>
                <span className="flex-1 text-ink">{s.name}</span>
                <span className="w-[140px]">{supabaseConfigurado ? <Badge tone="gray">Sin datos</Badge> : s.ok ? <Badge tone="green" icon>Operativo</Badge> : <Badge tone="orange">Con incidencias</Badge>}</span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Tiempo de respuesta */}
        <Panel className="xl:col-span-4" title="Tiempo de respuesta por modalidad" icon={Clock} action={<MoreLink boxed />}>
          <ul className="space-y-3.5 pt-1">
            {respuesta.map((r) => (
              <li key={r.label} className="grid grid-cols-[110px_1fr_70px_auto] items-center gap-2 text-[12.5px]">
                <span className="truncate text-ink">{r.label}</span>
                <Bar value={r.value} max={r.max} color={r.color} height={14} />
                <span className="font-bold text-ink">{r.txt}</span>
                <span className="whitespace-nowrap text-[11px] text-slate-500">{r.obj}</span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Actividad por hora */}
        <Panel className="lg:col-span-2 xl:col-span-4" title="Actividad por hora (últimas 24 horas)" icon={BarChart3} action={<MoreLink boxed />}>
          <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#2f6bff]" />Estudios recibidos</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#22b07d]" />Informes completados</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />Críticos</span>
          </div>
          {supabaseConfigurado ? (
            <div className="flex min-h-[150px] items-center justify-center text-[12.5px] text-slate-400">Sin datos para mostrar</div>
          ) : <Bars
            labels={horas.map((h, i) => (i % 2 === 0 ? h : ''))}
            height={150}
            max={300}
            yTicks={3}
            barWidth={0.8}
            series={[
              { name: 'Estudios recibidos', color: '#2f6bff', values: recibidos },
              { name: 'Informes completados', color: '#22b07d', values: completados },
              { name: 'Críticos', color: '#ef4444', values: criticos },
            ]}
          />}
        </Panel>

        {/* Top hospitales */}
        <Panel className="lg:col-span-2 xl:col-span-5" title="Top 5 hospitales por volumen de estudios" icon={Building2} action={<MoreLink boxed />} bodyClass="!px-2">
          <Table>
            <thead><tr className="bg-[#f5f8fd]">{['#', 'Hospital', 'Estudios (año)', 'Promedio/día', 'Estado'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {topHospitales.map((h, i) => (
                <tr key={h[0]} className="tr">
                  <td className="td py-1.5">{i + 1}</td>
                  <td className="td whitespace-nowrap py-1.5 text-ink">{h[0]}</td>
                  <td className="td py-1.5 tabular-nums text-ink">{h[1]}</td>
                  <td className="td py-1.5 tabular-nums text-ink">{h[2]}</td>
                  <td className="td py-1.5">{h[3] ? <Badge tone="green" icon>Operativo</Badge> : <Badge tone="orange">Con incidencias</Badge>}</td>
                </tr>
              ))}
              {topHospitales.length === 0 && <FilaVacia colSpan={5} texto="Aún no hay hospitales con estudios" />}
            </tbody>
          </Table>
        </Panel>

        {/* Top provincias */}
        <Panel className="xl:col-span-3" title="Top 5 provincias por estudios" icon={MapIcon} action={<MoreLink boxed />} bodyClass="!px-2">
          <Table>
            <thead><tr className="bg-[#f5f8fd]">{['#', 'Provincia', 'Estudios (año)', '% del total'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {topProvincias.map((p, i) => (
                <tr key={p[0]} className="tr">
                  <td className="td py-1.5">{i + 1}</td>
                  <td className="td whitespace-nowrap py-1.5 text-ink">{p[0]}</td>
                  <td className="td py-1.5 text-right tabular-nums text-ink">{p[1]}</td>
                  <td className="td py-1.5 text-right tabular-nums text-ink">{p[2]}</td>
                </tr>
              ))}
              {topProvincias.length === 0 && <FilaVacia colSpan={4} texto="Aún no hay estudios por provincia" />}
            </tbody>
          </Table>
        </Panel>

        {/* Alertas */}
        <Panel className="xl:col-span-4" title="Alertas y notificaciones" icon={Bell} action={<MoreLink boxed />} bodyClass="!px-2">
          <Table>
            <thead><tr>{['Hora', 'Tipo', 'Mensaje'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {alertas.map((a) => (
                <tr key={a.hora} className="tr">
                  <td className="td whitespace-nowrap py-1.5">{a.hora}</td>
                  <td className="td py-1.5"><Badge tone={a.tone}>{a.tipo}</Badge></td>
                  <td className={clsx('td py-1.5', a.tone === 'red' ? 'text-red-600' : a.tone === 'orange' ? 'text-orange-600' : 'text-brand-700')}>{a.msg}</td>
                </tr>
              ))}
              {alertas.length === 0 && <FilaVacia colSpan={3} texto="Aún no hay alertas registradas" />}
            </tbody>
          </Table>
        </Panel>
      </div>
    </div>
  )
}
