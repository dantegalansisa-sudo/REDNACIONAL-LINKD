import { useState } from 'react'
import {
  BarChart3, ChevronDown, KeyRound, Lock, MonitorSmartphone, PieChart, ShieldCheck, ShieldPlus, Upload, User,
  UserX, Users, Activity, type LucideIcon,
} from 'lucide-react'
import { Badge, Kpi, MoreLink, PageHeader, Pagination, Panel, Table, clsx } from '../../components/ui'
import { Bars, Donut } from '../../components/charts'

/* ---------- Datos mock ---------- */
const roles = [
  { label: 'Administrador', value: 12, pct: '1.4%', color: '#2f6bff' },
  { label: 'Coordinador', value: 48, pct: '5.7%', color: '#ef4444' },
  { label: 'Radiólogo', value: 126, pct: '15.0%', color: '#f59e0b' },
  { label: 'Médico referidor', value: 214, pct: '25.4%', color: '#22b07d' },
  { label: 'Operador', value: 198, pct: '23.5%', color: '#60a5fa' },
  { label: 'Otros', value: 244, pct: '29.0%', color: '#a5b4d4' },
]
const legendColors = ['#2f6bff', '#ef4444', '#f59e0b', '#94a3b8', '#7dd3fc', '#60a5fa']

const auth: { name: string; icon: LucideIcon; on: boolean }[] = [
  { name: 'Autenticación estándar', icon: ShieldCheck, on: true },
  { name: 'Autenticación de dos factores (TOTP)', icon: KeyRound, on: true },
  { name: 'Control de sesiones', icon: MonitorSmartphone, on: true },
  { name: 'Política de contraseñas', icon: Lock, on: true },
  { name: 'Bloqueo por intentos fallidos', icon: UserX, on: true },
]

const horas = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const accesos = [58, 30, 32, 30, 60, 38, 75, 78, 115, 132, 182, 112, 95, 62, 70, 85, 60, 40, 38, 30, 55, 32, 70, 62]

const actividad = [
  ['15/03/2025 10:24 a. m.', 'jperez', 'Juan Pérez', 'Administrador', 'SNS - Nivel Nacional', '186.21.45.78', 'Inicio de sesión'],
  ['15/03/2025 09:18 a. m.', 'mlopez', 'María López', 'Radiólogo', 'HPHM', '201.200.15.33', 'Visualización de estudio'],
  ['15/03/2025 08:41 a. m.', 'cpeña', 'Carlos Peña', 'Operador', 'HJM', '190.118.22.11', 'Registro de informe'],
  ['15/03/2025 08:32 a. m.', 'a.rodriguez', 'Ana Rodríguez', 'Coordinador', 'HRC', '181.176.44.21', 'Actualización de hospital'],
  ['15/03/2025 07:55 a. m.', 'p.martinez', 'Pedro Martínez', 'Médico referidor', 'HRA', '186.21.90.12', 'Consulta de paciente'],
  ['15/03/2025 06:12 a. m.', 'l.vargas', 'Luis Vargas', 'Radiólogo', 'HGA', '201.200.88.45', 'Descarga de imágenes'],
  ['14/03/2025 11:43 p. m.', 's.mendez', 'Sofía Méndez', 'Operador', 'HMC', '190.118.65.22', 'Edición de informe'],
  ['14/03/2025 10:28 p. m.', 'r.diaz', 'Roberto Díaz', 'Administrador', 'HJM', '186.21.77.91', 'Gestión de usuario'],
  ['14/03/2025 09:15 p. m.', 'l.jimenez', 'Lucía Jiménez', 'Coordinador', 'HPHM', '181.176.90.14', 'Cambio de configuración'],
  ['14/03/2025 08:02 p. m.', 't.nunez', 'Tomás Núñez', 'Radiólogo', 'HRA', '200.89.12.44', 'Visualización de estudio'],
]

/* ---------- Página ---------- */
export default function Seguridad() {
  const [exportOpen, setExportOpen] = useState(false)
  const [authState, setAuthState] = useState(auth.map((a) => a.on))
  const [sel, setSel] = useState<number | null>(null)

  return (
    <div>
      <PageHeader
        icon={ShieldPlus}
        title="Seguridad"
        subtitle="Control de accesos, auditoría, roles y monitoreo de actividad en la plataforma"
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
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1.45fr_1.4fr]">
        <Kpi icon={User} tone="blue" value="842" label="Usuarios activos" sub="6% vs. mes anterior" trend="up" />
        <Kpi icon={Users} tone="blue" value="12" label="Roles definidos" sub="78 permisos" />
        <Kpi icon={Lock} tone="green" value="2,341" label="Inicios de sesión (últimos 7 días)" sub="14% vs. semana anterior" trend="up" />
        <Kpi icon={ShieldCheck} tone="green" value="0" label="Intentos de acceso bloqueados" sub="en las últimas 24 horas" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1.08fr]">
        {/* Usuarios por rol */}
        <Panel title="Usuarios por rol" icon={PieChart} action={<MoreLink boxed />}>
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <Donut data={roles} size={180} thickness={32}
              center={<><span className="text-[22px] font-bold text-ink">842</span><span className="text-[12px] leading-tight text-ink/80">Usuarios<br />totales</span></>} />
            <ul className="min-w-0 flex-1 space-y-3 text-[12.5px]">
              {roles.map((r, i) => (
                <li key={r.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: legendColors[i] }} />
                  <span className="min-w-0 flex-1 truncate text-ink">{r.label}</span>
                  <span className="w-10 text-right tabular-nums text-ink">{r.value}</span>
                  <span className="w-14 text-right tabular-nums text-ink/80">({r.pct})</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        {/* Estado de autenticación */}
        <Panel title="Estado de autenticación" icon={ShieldCheck} action={<MoreLink boxed />}>
          <ul className="divide-y divide-[#eef2f8]">
            {auth.map((a, i) => (
              <li key={a.name} className="flex items-center gap-3 py-2.5 text-[12.5px]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600"><a.icon size={16} /></span>
                <span className="min-w-0 flex-1 text-ink">{a.name}</span>
                <button onClick={() => setAuthState(authState.map((v, j) => (j === i ? !v : v)))} title="Cambiar estado">
                  {authState[i] ? <Badge tone="green" icon>Activo</Badge> : <Badge tone="gray">Inactivo</Badge>}
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Actividad de acceso */}
        <Panel className="lg:col-span-2 xl:col-span-1" title="Actividad de acceso (últimas 24 horas)" icon={BarChart3} action={<MoreLink boxed />}>
          <Bars
            labels={horas.map((h, i) => (i % 2 === 0 ? h : ''))}
            series={[{ name: 'Accesos', color: '#2f6bff', values: accesos }]}
            height={200}
            max={200}
            yTicks={4}
            barWidth={0.45}
          />
        </Panel>
      </div>

      {/* Últimos accesos */}
      <Panel title="Últimos accesos y actividad" icon={Activity} action={<MoreLink boxed />} bodyClass="!px-0 !pb-0">
        <Table className="px-2">
          <thead>
            <tr className="bg-[#f5f8fd]">
              {['#', 'Fecha / Hora', 'Usuario', 'Nombre completo', 'Rol', 'Hospital / Centro', 'IP', 'Acción', 'Estado'].map((h) => <th key={h} className="th text-brand-800">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {actividad.map((r, i) => (
              <tr key={r[1]} onClick={() => setSel(i)} className={clsx('tr cursor-pointer', sel === i && 'bg-brand-50/70')}>
                <td className="td">{i + 1}</td>
                {r.map((c, j) => <td key={j} className="td whitespace-nowrap">{c}</td>)}
                <td className="td"><Badge tone="green" icon>Exitoso</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination text="Mostrando 1 a 10 de 2,341 registros" last={235} />
      </Panel>
    </div>
  )
}
