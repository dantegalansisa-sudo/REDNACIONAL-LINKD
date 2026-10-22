import { useState } from 'react'
import {
  BarChart3, ChevronDown, KeyRound, Lock, MonitorSmartphone, PieChart, ShieldCheck, ShieldPlus, Upload, User,
  UserX, Users, Activity, type LucideIcon,
} from 'lucide-react'
import { Badge, Kpi, MoreLink, PageHeader, Pagination, Panel, Table, clsx } from '../../components/ui'
import { Bars, Donut } from '../../components/charts'
import { supabase } from '../../lib/supabase'
import { fFechaHora, num, pct, supabaseConfigurado, useDatos } from '../../lib/admin-data'

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

/* =====================================================================
 * Datos reales (Supabase). Sin Supabase configurado se usan los de ejemplo.
 * ===================================================================== */
const ROL_LABEL: Record<string, string> = {
  admin: 'Administrador', coordinador: 'Coordinador', operador: 'Operador', radiologo: 'Radiólogo', referidor: 'Médico referidor', paciente: 'Paciente',
}
const ORDEN_ROLES = ['admin', 'coordinador', 'operador', 'radiologo', 'referidor', 'paciente', 'sin_rol']
const COLOR_ROL: Record<string, string> = {
  admin: '#2f6bff', coordinador: '#ef4444', operador: '#60a5fa', radiologo: '#f59e0b', referidor: '#22b07d', paciente: '#8b5cf6', sin_rol: '#a5b4d4',
}
const ACCION_LABEL: Record<string, string> = {
  inicio_sesion: 'Inicio de sesión', consulta: 'Consulta', creacion: 'Creación', actualizacion: 'Actualización', eliminacion: 'Eliminación',
  asignacion: 'Asignación', cambio_rol: 'Cambio de rol', exportacion: 'Exportación', acceso_denegado: 'Acceso denegado',
}
const POR_PAGINA = 10

type ResumenSeg = {
  activos: number; roles: number; permisos: number; sesiones7: number; bloqueados24: number
  porRol: Record<string, number>; porHora: number[]
  perfiles: Record<string, { nombre: string; hospital: string }>
}
const RESUMEN_VACIO: ResumenSeg = { activos: 0, roles: 0, permisos: 0, sesiones7: 0, bloqueados24: 0, porRol: {}, porHora: Array(24).fill(0), perfiles: {} }

async function fetchResumenSeguridad(): Promise<ResumenSeg> {
  const ahora = Date.now()
  const hace7 = new Date(ahora - 7 * 86400000).toISOString()
  const hace24 = new Date(ahora - 86400000).toISOString()
  const [perf, rp, ses, bloq, hrs] = await Promise.all([
    supabase.from('profiles').select('id, rol, estado, nombre_completo, hospitales(nombre)'),
    supabase.from('rol_permisos').select('rol'),
    // La auditoría solo la ve el administrador; para otros roles llega vacía (conteos en 0)
    supabase.from('auditoria').select('id', { count: 'exact', head: true }).eq('accion', 'inicio_sesion').gte('created_at', hace7),
    supabase.from('auditoria').select('id', { count: 'exact', head: true }).eq('resultado', 'fallido').gte('created_at', hace24),
    supabase.from('auditoria').select('created_at').gte('created_at', hace24).limit(5000),
  ])
  const err = perf.error ?? rp.error
  if (err) throw new Error(err.message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ps = (perf.data ?? []) as any[]
  const porHora = Array(24).fill(0) as number[]
  for (const a of (hrs.error ? [] : hrs.data ?? []) as { created_at: string }[]) porHora[new Date(a.created_at).getHours()]++
  const roles = (rp.data ?? []) as { rol: string }[]
  return {
    activos: ps.filter((p) => p.estado === 'activo').length,
    roles: new Set(roles.map((r) => r.rol)).size, permisos: roles.length,
    sesiones7: ses.error ? 0 : ses.count ?? 0, bloqueados24: bloq.error ? 0 : bloq.count ?? 0,
    porRol: ps.reduce<Record<string, number>>((m, p) => { const k = p.rol ?? 'sin_rol'; return { ...m, [k]: (m[k] ?? 0) + 1 } }, {}),
    porHora,
    perfiles: Object.fromEntries(ps.map((p) => [p.id, {
      nombre: p.nombre_completo || '—', hospital: (Array.isArray(p.hospitales) ? p.hospitales[0]?.nombre : p.hospitales?.nombre) ?? '—',
    }])),
  }
}

type EventoSeg = { id: number; fecha: string; userId: string | null; usuario: string; rol: string; ip: string; accion: string; ok: boolean }
async function fetchUltimosAccesos(pagina: number): Promise<{ filas: EventoSeg[]; total: number }> {
  const desde = (pagina - 1) * POR_PAGINA
  const { data, count, error } = await supabase.from('auditoria')
    .select('id, created_at, user_id, usuario, rol, ip, accion, resultado', { count: 'exact' })
    .order('created_at', { ascending: false }).range(desde, desde + POR_PAGINA - 1)
  // Sin permiso de lectura (no administrador) la consulta vuelve vacía
  if (error) return { filas: [], total: 0 }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filas = ((data ?? []) as any[]).map((a) => ({
    id: a.id, fecha: fFechaHora(a.created_at), userId: a.user_id, usuario: a.usuario ?? 'Sistema', rol: a.rol ? ROL_LABEL[a.rol] ?? a.rol : '—',
    ip: a.ip || '—', accion: ACCION_LABEL[a.accion] ?? a.accion, ok: a.resultado !== 'fallido',
  }))
  return { filas, total: count ?? 0 }
}

function SinDatos({ children = 'Sin datos para mostrar', h = 180 }: { children?: string; h?: number }) {
  return <div className="flex items-center justify-center text-[12.5px] text-slate-400" style={{ minHeight: h }}>{children}</div>
}

function SeguridadReal() {
  const [exportOpen, setExportOpen] = useState(false)
  const [authState, setAuthState] = useState(auth.map((a) => a.on))
  const [sel, setSel] = useState<number | null>(null)
  const [pagina, setPagina] = useState(1)
  const { datos: r, cargando } = useDatos(fetchResumenSeguridad, RESUMEN_VACIO)
  const ult = useDatos(() => fetchUltimosAccesos(pagina), { filas: [] as EventoSeg[], total: 0 }, [pagina])
  const v = (n: number) => (cargando ? '…' : num(n))

  const totalUsuarios = Object.values(r.porRol).reduce((a, b) => a + b, 0)
  const rolesData = ORDEN_ROLES.filter((k) => r.porRol[k]).map((k) => ({
    label: k === 'sin_rol' ? 'Sin rol' : ROL_LABEL[k] ?? k, value: r.porRol[k], pct: pct(r.porRol[k], totalUsuarios), color: COLOR_ROL[k] ?? '#a5b4d4',
  }))
  const totalHoras = r.porHora.reduce((a, b) => a + b, 0)
  const maxHora = Math.max(...r.porHora)
  const totalPaginas = Math.max(1, Math.ceil(ult.datos.total / POR_PAGINA))
  const desde = (pagina - 1) * POR_PAGINA

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
        <Kpi icon={User} tone="blue" value={v(r.activos)} label="Usuarios activos" sub={r.activos ? `${num(totalUsuarios)} cuentas en total` : 'Sin datos aún'} />
        <Kpi icon={Users} tone="blue" value={v(r.roles)} label="Roles definidos" sub={`${num(r.permisos)} permisos`} />
        <Kpi icon={Lock} tone="green" value={v(r.sesiones7)} label="Inicios de sesión (últimos 7 días)" sub={r.sesiones7 ? 'Registrados en auditoría' : 'Sin datos aún'} />
        <Kpi icon={ShieldCheck} tone="green" value={v(r.bloqueados24)} label="Intentos de acceso bloqueados" sub="en las últimas 24 horas" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1.08fr]">
        {/* Usuarios por rol */}
        <Panel title="Usuarios por rol" icon={PieChart}>
          {cargando ? <SinDatos>Cargando…</SinDatos> : totalUsuarios === 0 ? <SinDatos /> : (
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <Donut data={rolesData} size={180} thickness={32}
                center={<><span className="text-[22px] font-bold text-ink">{num(totalUsuarios)}</span><span className="text-[12px] leading-tight text-ink/80">Usuarios<br />totales</span></>} />
              <ul className="min-w-0 flex-1 space-y-3 text-[12.5px]">
                {rolesData.map((d) => (
                  <li key={d.label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                    <span className="min-w-0 flex-1 truncate text-ink">{d.label}</span>
                    <span className="w-10 text-right tabular-nums text-ink">{num(d.value)}</span>
                    <span className="w-14 text-right tabular-nums text-ink/80">({d.pct})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        {/* Estado de autenticación (configuración del sistema) */}
        <Panel title="Estado de autenticación" icon={ShieldCheck}>
          <ul className="divide-y divide-[#eef2f8]">
            {auth.map((a, i) => (
              <li key={a.name} className="flex items-center gap-3 py-2.5 text-[12.5px]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600"><a.icon size={16} /></span>
                <span className="min-w-0 flex-1 text-ink">{a.name}</span>
                {a.icon === KeyRound
                  ? <Badge tone="orange">Pendiente</Badge>
                  : (
                    <button onClick={() => setAuthState(authState.map((x, j) => (j === i ? !x : x)))} title="Cambiar estado">
                      {authState[i] ? <Badge tone="green" icon>Activo</Badge> : <Badge tone="gray">Inactivo</Badge>}
                    </button>
                  )}
              </li>
            ))}
          </ul>
        </Panel>

        {/* Actividad de acceso */}
        <Panel className="lg:col-span-2 xl:col-span-1" title="Actividad de acceso (últimas 24 horas)" icon={BarChart3}>
          {cargando ? <SinDatos h={200}>Cargando…</SinDatos> : totalHoras === 0 ? <SinDatos h={200} /> : (
            <Bars
              labels={horas.map((h, i) => (i % 2 === 0 ? h : ''))}
              series={[{ name: 'Eventos', color: '#2f6bff', values: r.porHora }]}
              height={200}
              max={Math.max(4, Math.ceil(maxHora * 1.15))}
              yTicks={4}
              barWidth={0.45}
            />
          )}
        </Panel>
      </div>

      {/* Últimos accesos */}
      <Panel title="Últimos accesos y actividad" icon={Activity} bodyClass="!px-0 !pb-0">
        <Table className="px-2">
          <thead>
            <tr className="bg-[#f5f8fd]">
              {['#', 'Fecha / Hora', 'Usuario', 'Nombre completo', 'Rol', 'Hospital / Centro', 'IP', 'Acción', 'Estado'].map((h) => <th key={h} className="th text-brand-800">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {ult.cargando && <tr><td colSpan={9} className="td py-8 text-center text-slate-400">Cargando…</td></tr>}
            {!ult.cargando && ult.datos.filas.length === 0 && <tr><td colSpan={9} className="td py-8 text-center text-slate-400">Aún no hay accesos ni actividad registrados</td></tr>}
            {!ult.cargando && ult.datos.filas.map((e, i) => {
              const p = e.userId ? r.perfiles[e.userId] : undefined
              return (
                <tr key={e.id} onClick={() => setSel(e.id)} className={clsx('tr cursor-pointer', sel === e.id && 'bg-brand-50/70')}>
                  <td className="td">{desde + i + 1}</td>
                  <td className="td whitespace-nowrap">{e.fecha}</td>
                  <td className="td whitespace-nowrap">{e.usuario}</td>
                  <td className="td whitespace-nowrap">{p?.nombre ?? '—'}</td>
                  <td className="td whitespace-nowrap">{e.rol}</td>
                  <td className="td whitespace-nowrap">{p?.hospital ?? '—'}</td>
                  <td className="td whitespace-nowrap">{e.ip}</td>
                  <td className="td whitespace-nowrap">{e.accion}</td>
                  <td className="td">{e.ok ? <Badge tone="green" icon>Exitoso</Badge> : <Badge tone="red">Fallido</Badge>}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        <Pagination
          text={ult.datos.total === 0 ? 'Mostrando 0 de 0 registros' : `Mostrando ${num(desde + 1)} a ${num(Math.min(desde + POR_PAGINA, ult.datos.total))} de ${num(ult.datos.total)} registros`}
          page={pagina} onPage={setPagina} totalPages={totalPaginas} perPage={false} />
      </Panel>
    </div>
  )
}

/* ---------- Página ---------- */
export default function Seguridad() {
  return supabaseConfigurado ? <SeguridadReal /> : <SeguridadDemo />
}

function SeguridadDemo() {
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
