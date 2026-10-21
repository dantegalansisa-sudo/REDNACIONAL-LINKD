import { useState } from 'react'
import {
  BarChart3, CalendarDays, CheckCircle2, ChevronDown, Clock, Database, FileBarChart, FileDown, FileSpreadsheet, FileText,
  Filter, Loader2, Map as MapIcon, PieChart, TrendingUp, UserRound, Building2, Table2,
} from 'lucide-react'
import { Badge, Bar, DotsButton, Kpi, Modal, MoreLink, PageHeader, Panel, Select, Table, clsx } from '../../components/ui'
import { Bars, Donut } from '../../components/charts'

/* ---------- Datos mock ---------- */
const modalidades = [
  { label: 'Tomografía (CT)', value: 512, pct: '23.8%', color: '#2f6bff' },
  { label: 'Resonancia (RM)', value: 333, pct: '15.5%', color: '#5cc49a' },
  { label: 'Rayos X (RX)', value: 218, pct: '10.2%', color: '#fbbf24' },
  { label: 'Ecografía (US)', value: 431, pct: '20.1%', color: '#a35cf0' },
  { label: 'Mamografía (MG)', value: 120, pct: '5.6%', color: '#f472b6' },
  { label: 'Otros', value: 534, pct: '24.8%', color: '#cbd5e1' },
]
const legendMod = ['#2f6bff', '#22b07d', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b']

const estados = [
  { label: 'Informados', value: 1652, pct: '76.9%', color: '#22a35a' },
  { label: 'En proceso', value: 312, pct: '14.5%', color: '#4f86f7' },
  { label: 'Sin asignar', value: 186, pct: '8.7%', color: '#fbbf24' },
]

const dias = Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0'))
const estudiosDia = [70, 90, 110, 105, 140, 170, 190, 220, 260, 290, 330, 210, 250, 270, 300, 260, 310, 240, 200, 280, 300, 240, 280, 320, 260, 230, 300, 250, 220, 310]
const informesDia = estudiosDia.map((v, i) => Math.round(v * (0.42 + ((i * 7) % 10) / 40)))

const topHospitales = [
  ['HPHM - Hosp. Hugo Mendoza', '512', '23.8%', '17.1'],
  ['HRA - Hosp. Dr. Fco. A. Gonzalvo', '333', '15.5%', '11.1'],
  ['HJM - Hosp. Juan de Herrera', '218', '10.2%', '7.3'],
  ['HRC - Hosp. Municipal Constanza', '69', '3.2%', '2.3'],
  ['HGA - Hosp. Municipal La Vega', '35', '1.6%', '1.2'],
]

const tiempos = [
  { label: 'Tomografía (CT)', value: 48, txt: '48 min', color: '#6a9bff' },
  { label: 'Resonancia (RM)', value: 65, txt: '1 h 05 min', color: '#5cc49a' },
  { label: 'Rayos X (RX)', value: 28, txt: '28 min', color: '#fcd34d' },
  { label: 'Ecografía (US)', value: 42, txt: '42 min', color: '#a37cf5' },
  { label: 'Mamografía (MG)', value: 110, txt: '1 h 50 min', color: '#f472b6' },
]

const regiones = [
  { label: 'Cibao Sur', value: '381,001', pct: '23.8%', color: '#2f6bff' },
  { label: 'Cibao Norte', value: '298,450', pct: '18.6%', color: '#22b07d' },
  { label: 'Santo Domingo', value: '272,118', pct: '17.0%', color: '#f59e0b' },
  { label: 'Este', value: '198,762', pct: '12.4%', color: '#8b5cf6' },
  { label: 'Sur', value: '150,443', pct: '9.4%', color: '#ec4899' },
  { label: 'Noroeste', value: '120,558', pct: '7.5%', color: '#fbbf24' },
  { label: 'Nordeste', value: '98,331', pct: '6.1%', color: '#64748b' },
]

type Reporte = { nombre: string; tipo: string; periodo: string; por: string; fecha: string; formato: string; estado: 'Completado' | 'Generando' }
const RECIENTES: Reporte[] = [
  { nombre: 'Estudios por hospital', tipo: 'Operativo', periodo: '01/03/2025 - 15/03/2025', por: 'Juan Pérez', fecha: '15/03/2025 10:24 a. m.', formato: 'PDF', estado: 'Completado' },
  { nombre: 'Tiempo de reporte por modalidad', tipo: 'Estadístico', periodo: '01/03/2025 - 15/03/2025', por: 'Juan Pérez', fecha: '15/03/2025 09:18 a. m.', formato: 'PDF', estado: 'Completado' },
  { nombre: 'Volumen de imágenes', tipo: 'Estadístico', periodo: '01/03/2025 - 15/03/2025', por: 'María López', fecha: '14/03/2025 06:12 p. m.', formato: 'Excel', estado: 'Completado' },
  { nombre: 'Actividad de radiólogos', tipo: 'Operativo', periodo: '01/03/2025 - 15/03/2025', por: 'Carlos Peña', fecha: '14/03/2025 11:43 a. m.', formato: 'PDF', estado: 'Completado' },
  { nombre: 'Estudios críticos', tipo: 'Seguridad', periodo: '14/03/2025 - 15/03/2025', por: 'Ana Rodríguez', fecha: '14/03/2025 08:02 a. m.', formato: 'CSV', estado: 'Completado' },
]

const TIPOS_REPORTE = [
  { nombre: 'Estudios por hospital', tipo: 'Operativo' },
  { nombre: 'Estudios por modalidad', tipo: 'Estadístico' },
  { nombre: 'Tiempo de reporte por modalidad', tipo: 'Estadístico' },
  { nombre: 'Volumen de imágenes', tipo: 'Estadístico' },
  { nombre: 'Actividad de radiólogos', tipo: 'Operativo' },
  { nombre: 'Estudios críticos', tipo: 'Seguridad' },
  { nombre: 'Estudios por región', tipo: 'Estadístico' },
]
const PERIODOS: Record<string, string> = {
  'Últimos 7 días': '09/03/2025 - 15/03/2025',
  'Últimos 30 días': '14/02/2025 - 15/03/2025',
  'Mes actual': '01/03/2025 - 15/03/2025',
  'Mes anterior': '01/02/2025 - 28/02/2025',
  'Año actual': '01/01/2025 - 15/03/2025',
}

/* ---------- Modal Generar reporte ---------- */
function GenerarModal({ open, onClose, onGenerate }: { open: boolean; onClose: () => void; onGenerate: (r: Reporte) => void }) {
  const [tipo, setTipo] = useState(TIPOS_REPORTE[0].nombre)
  const [periodo, setPeriodo] = useState('Mes actual')
  const [formato, setFormato] = useState('PDF')
  const [step, setStep] = useState<'form' | 'loading' | 'done'>('form')
  const close = () => { setStep('form'); onClose() }

  const generar = () => {
    setStep('loading')
    setTimeout(() => {
      const t = TIPOS_REPORTE.find((x) => x.nombre === tipo) ?? TIPOS_REPORTE[0]
      onGenerate({ nombre: t.nombre, tipo: t.tipo, periodo: PERIODOS[periodo], por: 'Juan Pérez', fecha: '15/03/2025 10:31 a. m.', formato, estado: 'Completado' })
      setStep('done')
    }, 1400)
  }

  const formatos = [
    { f: 'PDF', icon: FileText, d: 'Documento listo para imprimir' },
    { f: 'Excel', icon: FileSpreadsheet, d: 'Hoja de cálculo editable' },
    { f: 'CSV', icon: Table2, d: 'Datos planos separados por comas' },
  ]

  return (
    <Modal open={open} onClose={close} className="max-w-[620px]">
      <div className="flex items-center gap-3 border-b border-[#eef2f8] px-6 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white"><FileBarChart size={20} /></span>
        <div>
          <h2 className="text-[18px] font-bold text-ink">Generar reporte</h2>
          <p className="text-[12.5px] text-slate-500">Configure el tipo, el período y el formato de salida</p>
        </div>
      </div>

      {step === 'done' ? (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={30} /></span>
          <div className="text-[17px] font-bold text-ink">Reporte generado correctamente</div>
          <p className="mt-1 text-[13px] text-slate-500">“{tipo}” ({formato}) se agregó a Reportes recientes.</p>
          <div className="mt-5 flex gap-2">
            <button className="btn-outline" onClick={close}>Cerrar</button>
            <button className="btn-primary" onClick={close}><FileDown size={16} /> Descargar</button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4 px-6 py-5">
            <div>
              <span className="label">Tipo de reporte <span className="text-red-500">*</span></span>
              <Select options={TIPOS_REPORTE.map((t) => t.nombre)} onChange={setTipo} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="label">Período <span className="text-red-500">*</span></span>
                <Select options={Object.keys(PERIODOS)} value={periodo} onChange={setPeriodo} icon={CalendarDays} />
                <p className="mt-1 text-[11.5px] text-slate-500">{PERIODOS[periodo]}</p>
              </div>
              <div>
                <span className="label">Hospital / Región</span>
                <Select options={['Todos', 'Cibao Sur', 'Cibao Norte', 'Santo Domingo', 'HPHM', 'HRA', 'HJM']} />
              </div>
            </div>
            <div>
              <span className="label">Formato <span className="text-red-500">*</span></span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {formatos.map(({ f, icon: Icon, d }) => (
                  <button key={f} type="button" onClick={() => setFormato(f)}
                    className={clsx('flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition',
                      formato === f ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-100' : 'border-[#d7e1f2] hover:border-brand-300')}>
                    <Icon size={20} className={formato === f ? 'text-brand-600' : 'text-slate-500'} />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-ink">{f}</span>
                      <span className="block text-[11px] leading-tight text-slate-500">{d}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#eef2f8] px-6 py-4">
            <button className="btn-outline" onClick={close} disabled={step === 'loading'}>Cancelar</button>
            <button className="btn-primary min-w-[160px]" onClick={generar} disabled={step === 'loading'}>
              {step === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Generando…</> : <><FileBarChart size={16} /> Generar reporte</>}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ---------- Página ---------- */
export default function Reportes() {
  const [modal, setModal] = useState(false)
  const [recientes, setRecientes] = useState(RECIENTES)
  const [applied, setApplied] = useState(false)

  return (
    <div>
      <PageHeader
        icon={FileText}
        title="Reportes"
        subtitle="Generación de reportes estadísticos y operativos de la plataforma"
        actions={
          <button className="btn-primary min-w-[190px]" onClick={() => setModal(true)}>
            <FileText size={17} /> Generar reporte <ChevronDown size={16} className="ml-3" />
          </button>
        }
      />

      {/* Filtros */}
      <div className="card mb-4 grid grid-cols-1 items-center gap-3 px-4 py-3 sm:grid-cols-2 xl:grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto_1.3fr_auto]">
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink"><CalendarDays size={18} className="text-brand-600" /> Período</span>
        <Select options={['Últimos 30 días', 'Últimos 7 días', 'Mes actual', 'Mes anterior', 'Año actual']} />
        <span className="text-[13px] font-medium text-ink">Hospital / Región</span>
        <Select options={['Todos', 'Cibao Sur', 'Cibao Norte', 'Santo Domingo', 'HPHM', 'HRA', 'HJM']} />
        <span className="text-[13px] font-medium text-ink">Tipo de reporte</span>
        <Select options={['Todos', 'Operativo', 'Estadístico', 'Seguridad']} />
        <span className="text-[13px] font-medium text-ink">Modalidad</span>
        <Select options={['Todas', 'CT', 'RM', 'RX', 'US', 'MG']} />
        <button className={clsx('btn-primary min-w-[150px]', applied && '!bg-emerald-600')} onClick={() => { setApplied(true); setTimeout(() => setApplied(false), 1500) }}>
          <Filter size={16} /> {applied ? 'Filtros aplicados' : 'Aplicar filtros'}
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={FileText} tone="blue" value="2,148" label="Estudios realizados" sub="18% vs. período anterior" trend="up" />
        <Kpi icon={Database} tone="green" value="220,904" label="Imágenes de radiología" sub="12% vs. período anterior" trend="up" />
        <Kpi icon={UserRound} tone="purple" value="112,151" label="Imágenes de cardiología" sub="9% vs. período anterior" trend="up" />
        <Kpi icon={Clock} tone="red" value="1 h 26 min" label="Tiempo promedio de reporte" sub="22% vs. período anterior" trend="down" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1.15fr]">
        {/* Estudios por modalidad */}
        <Panel title="Estudios por modalidad" icon={PieChart} action={<MoreLink boxed />}>
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <Donut data={modalidades} size={170} thickness={36}
              center={<><span className="text-[19px] font-bold text-ink">2,148</span><span className="text-[12px] leading-tight text-ink/80">Estudios<br />totales</span></>} />
            <ul className="min-w-0 flex-1 space-y-2.5 text-[12.5px]">
              {modalidades.map((m, i) => (
                <li key={m.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: legendMod[i] }} />
                  <span className="min-w-0 flex-1 truncate text-ink">{m.label}</span>
                  <span className="w-10 text-right tabular-nums text-ink">{m.value}</span>
                  <span className="w-14 text-right tabular-nums text-ink/80">{m.pct}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        {/* Estudios por estado */}
        <Panel title="Estudios por estado" icon={BarChart3} action={<MoreLink boxed />}>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Donut data={estados} size={165} thickness={22}
              center={<><span className="text-[19px] font-bold text-ink">2,148</span><span className="text-[12px] leading-tight text-ink/80">Estudios<br />totales</span></>} />
            <ul className="min-w-0 flex-1 space-y-3 text-[12px]">
              {estados.map((s) => (
                <li key={s.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="min-w-0 flex-1 truncate text-ink">{s.label}</span>
                  <span className="tabular-nums text-ink">{s.value.toLocaleString('en-US')}</span>
                  <span className="tabular-nums text-ink/80">{s.pct}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        {/* Tendencia */}
        <Panel className="lg:col-span-2 xl:col-span-1" title="Tendencia de estudios" icon={TrendingUp} action={<MoreLink boxed />}>
          <div className="mb-1 flex gap-4 text-[12px] text-ink">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#2f6bff]" />Estudios</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#5cc49a]" />Informes completados</span>
          </div>
          <Bars
            labels={dias.map((d, i) => (i % 2 === 0 ? d : ''))}
            height={170}
            max={400}
            yTicks={4}
            barWidth={0.7}
            series={[
              { name: 'Estudios', color: '#2f6bff', values: estudiosDia },
              { name: 'Informes completados', color: '#5cc49a', values: informesDia },
            ]}
          />
        </Panel>

        {/* Top hospitales */}
        <Panel title="Top 5 hospitales por volumen de estudios" icon={Building2} action={<MoreLink boxed />} bodyClass="!px-2">
          <Table>
            <thead><tr className="bg-[#f5f8fd]">{['#', 'Hospital', 'Estudios', '% del total', 'Promedio/día'].map((h) => <th key={h} className="th text-brand-800">{h}</th>)}</tr></thead>
            <tbody>
              {topHospitales.map((h, i) => (
                <tr key={h[0]} className="tr">
                  <td className="td py-1.5">{i + 1}</td>
                  <td className="td whitespace-nowrap py-1.5 text-ink">{h[0]}</td>
                  {h.slice(1).map((c, j) => <td key={j} className="td py-1.5 tabular-nums text-ink">{c}</td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>

        {/* Tiempo promedio */}
        <Panel title="Tiempo promedio de reporte por modalidad" icon={Clock} action={<MoreLink boxed />}>
          <ul className="space-y-3.5 pt-1">
            {tiempos.map((t) => (
              <li key={t.label} className="grid grid-cols-[100px_1fr_74px] items-center gap-2 text-[12.5px]">
                <span className="truncate text-ink">{t.label}</span>
                <Bar value={t.value} max={115} color={t.color} height={18} />
                <span className="whitespace-nowrap font-bold text-ink">{t.txt}</span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Estudios por región */}
        <Panel className="lg:col-span-2 xl:col-span-1" title="Estudios por región" icon={MapIcon} action={<MoreLink boxed />}>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <img src="/img/crops/mapa-regiones.webp" alt="Mapa de regiones" className="w-full max-w-[170px] object-contain" />
            <ul className="min-w-0 flex-1 space-y-1.5 text-[12px]">
              {regiones.map((r) => (
                <li key={r.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                  <span className="min-w-0 flex-1 truncate text-ink">{r.label}</span>
                  <span className="tabular-nums text-ink">{r.value}</span>
                  <span className="w-11 text-right tabular-nums text-ink/80">{r.pct}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      {/* Reportes recientes */}
      <Panel title="Reportes recientes" icon={FileBarChart} action={<MoreLink boxed />} bodyClass="!px-2">
        <Table>
          <thead>
            <tr className="bg-[#f5f8fd]">{['#', 'Nombre del reporte', 'Tipo', 'Período', 'Generado por', 'Fecha / Hora', 'Estado', 'Acciones'].map((h) => <th key={h} className="th text-brand-800">{h}</th>)}</tr>
          </thead>
          <tbody>
            {recientes.map((r, i) => (
              <tr key={r.nombre + r.fecha + i} className="tr">
                <td className="td py-1.5">{i + 1}</td>
                <td className="td whitespace-nowrap py-1.5 text-ink">{r.nombre}</td>
                <td className="td py-1.5 text-ink">{r.tipo}</td>
                <td className="td whitespace-nowrap py-1.5 text-ink">{r.periodo}</td>
                <td className="td whitespace-nowrap py-1.5 text-ink">{r.por}</td>
                <td className="td whitespace-nowrap py-1.5 text-ink">{r.fecha}</td>
                <td className="td py-1.5"><Badge tone="green" icon>{r.estado}</Badge></td>
                <td className="td py-1.5">
                  <div className="flex items-center gap-2">
                    <button className="dots-btn" title={`Descargar ${r.formato}`} aria-label="Descargar"><FileDown size={15} /></button>
                    <DotsButton />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <GenerarModal open={modal} onClose={() => setModal(false)} onGenerate={(r) => setRecientes([r, ...recientes].slice(0, 6))} />
    </div>
  )
}
