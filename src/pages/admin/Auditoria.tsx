import { useState } from 'react'
import { AlertCircle, CalendarDays, CheckCircle2, ChevronDown, FileText, Filter, KeyRound, ShieldAlert, Upload, User, ClipboardList } from 'lucide-react'
import { Badge, Checkbox, DotsButton, InfoRow, Kpi, PageHeader, Pagination, Panel, Select, Table, clsx, type Tone } from '../../components/ui'
import { supabase } from '../../lib/supabase'
import { fFecha, fFechaHora, num, supabaseConfigurado, useDatos } from '../../lib/admin-data'

/* ---------- Datos mock ---------- */
type Evento = {
  fecha: string; hora: string; segundos: string; usuario: string; nombre: string; accion: string; accionTone: Tone
  modulo: string; registro: string; ip: string; ok: boolean; ubicacion: string; navegador: string; dispositivo: string; obs: string
}
const EVENTOS: Evento[] = [
  { fecha: '15/03/2025', hora: '10:24 a. m.', segundos: '10:24:36 a. m.', usuario: 'jperez', nombre: 'Juan Pérez', accion: 'Inicio de sesión', accionTone: 'blue', modulo: 'Seguridad', registro: '-', ip: '186.21.45.78', ok: true, ubicacion: 'Santo Domingo, República Dominicana', navegador: 'Chrome 122.0.6261.69', dispositivo: 'PC - Windows', obs: 'Inicio de sesión correcto' },
  { fecha: '15/03/2025', hora: '09:18 a. m.', segundos: '09:18:12 a. m.', usuario: 'mlopez', nombre: 'María López', accion: 'Consulta', accionTone: 'blue', modulo: 'Estudios', registro: 'EST-2025-000892', ip: '201.200.15.33', ok: true, ubicacion: 'Santo Domingo, República Dominicana', navegador: 'Edge 122.0.2365.66', dispositivo: 'PC - Windows', obs: 'Consulta de estudio CT de cráneo' },
  { fecha: '15/03/2025', hora: '08:41 a. m.', segundos: '08:41:05 a. m.', usuario: 'cpena', nombre: 'Carlos Peña', accion: 'Actualización', accionTone: 'orange', modulo: 'Pacientes', registro: 'HN-0001234', ip: '190.118.22.11', ok: true, ubicacion: 'Santiago, República Dominicana', navegador: 'Chrome 122.0.6261.69', dispositivo: 'PC - Windows', obs: 'Actualización de teléfono de contacto del paciente' },
  { fecha: '15/03/2025', hora: '08:32 a. m.', segundos: '08:32:47 a. m.', usuario: 'arodriguez', nombre: 'Ana Rodríguez', accion: 'Creación', accionTone: 'green', modulo: 'Informes', registro: 'INF-2025-000567', ip: '181.176.44.21', ok: true, ubicacion: 'La Vega, República Dominicana', navegador: 'Firefox 123.0', dispositivo: 'PC - macOS', obs: 'Creación de informe radiológico' },
  { fecha: '15/03/2025', hora: '07:55 a. m.', segundos: '07:55:19 a. m.', usuario: 'pmartinez', nombre: 'Pedro Martínez', accion: 'Eliminación', accionTone: 'red', modulo: 'Configuración', registro: 'Plantilla informe', ip: '186.21.90.12', ok: false, ubicacion: 'La Romana, República Dominicana', navegador: 'Chrome 121.0.6167.184', dispositivo: 'PC - Windows', obs: 'Permisos insuficientes para eliminar la plantilla' },
  { fecha: '15/03/2025', hora: '06:12 a. m.', segundos: '06:12:58 a. m.', usuario: 'lvargas', nombre: 'Luis Vargas', accion: 'Asignación', accionTone: 'purple', modulo: 'Estudios', registro: 'EST-2025-000891', ip: '201.200.88.45', ok: true, ubicacion: 'La Vega, República Dominicana', navegador: 'Safari 17.3', dispositivo: 'iPad - iPadOS', obs: 'Asignación de estudio a radiólogo de turno' },
  { fecha: '14/03/2025', hora: '11:43 p. m.', segundos: '11:43:21 p. m.', usuario: 's.mendez', nombre: 'Sofía Méndez', accion: 'Cambio de rol', accionTone: 'orange', modulo: 'Administración', registro: 'Usuario: r.diaz', ip: '190.118.65.22', ok: true, ubicacion: 'Cotuí, República Dominicana', navegador: 'Chrome 122.0.6261.69', dispositivo: 'PC - Windows', obs: 'Cambio de rol de Coordinador a Administrador' },
  { fecha: '14/03/2025', hora: '10:28 p. m.', segundos: '10:28:03 p. m.', usuario: 'r.diaz', nombre: 'Roberto Díaz', accion: 'Configuración', accionTone: 'gray', modulo: 'Sistema', registro: 'Tiempo objetivo CT', ip: '186.21.77.91', ok: true, ubicacion: 'Santo Domingo, República Dominicana', navegador: 'Chrome 122.0.6261.69', dispositivo: 'PC - Windows', obs: 'Tiempo objetivo CT cambiado de 45 a 60 min' },
  { fecha: '14/03/2025', hora: '09:15 p. m.', segundos: '09:15:44 p. m.', usuario: 'l.jimenez', nombre: 'Lucía Jiménez', accion: 'Acceso denegado', accionTone: 'red', modulo: 'Seguridad', registro: '-', ip: '181.176.90.14', ok: false, ubicacion: 'Santo Domingo, República Dominicana', navegador: 'Chrome 122.0.6261.69', dispositivo: 'Móvil - Android', obs: 'Contraseña incorrecta (3 intentos)' },
  { fecha: '14/03/2025', hora: '08:02 p. m.', segundos: '08:02:10 p. m.', usuario: 't.nunez', nombre: 'Tomás Núñez', accion: 'Exportación', accionTone: 'blue', modulo: 'Reportes', registro: 'Reporte estudios', ip: '200.89.12.44', ok: true, ubicacion: 'La Romana, República Dominicana', navegador: 'Edge 122.0.2365.66', dispositivo: 'PC - Windows', obs: 'Exportación de reporte de estudios en Excel' },
]

const moduloStyle: Record<string, string> = {
  Seguridad: 'bg-slate-100 text-ink',
  Estudios: 'bg-brand-50 text-brand-700',
  Pacientes: 'bg-emerald-50 text-emerald-700',
  Informes: 'bg-emerald-50 text-emerald-700',
  Configuración: 'bg-slate-100 text-ink',
  Administración: 'bg-brand-50 text-brand-700',
  Sistema: 'bg-slate-100 text-ink',
  Reportes: 'bg-slate-100 text-ink',
}

function Resultado({ ok }: { ok: boolean }) {
  return ok
    ? <Badge tone="green" icon>Exitoso</Badge>
    : <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-red-50 px-2 py-0.5 text-[11.5px] font-medium text-red-600"><AlertCircle size={13} />Fallido</span>
}

/* =====================================================================
 * Datos reales (Supabase). La auditoría solo la ve el administrador:
 * para otros roles las consultas vuelven vacías y se muestran los mensajes vacíos.
 * ===================================================================== */
const ACCION_LABEL: Record<string, string> = {
  inicio_sesion: 'Inicio de sesión', consulta: 'Consulta', creacion: 'Creación', actualizacion: 'Actualización', eliminacion: 'Eliminación',
  asignacion: 'Asignación', cambio_rol: 'Cambio de rol', exportacion: 'Exportación', acceso_denegado: 'Acceso denegado',
}
const ACCION_TONE: Record<string, Tone> = {
  inicio_sesion: 'blue', consulta: 'blue', creacion: 'green', actualizacion: 'orange', eliminacion: 'red',
  asignacion: 'purple', cambio_rol: 'orange', exportacion: 'blue', acceso_denegado: 'red',
}
const ROL_LABEL: Record<string, string> = {
  admin: 'Administrador', coordinador: 'Coordinador', operador: 'Operador', radiologo: 'Radiólogo', referidor: 'Médico referidor', paciente: 'Paciente',
}
const MODULOS = ['Seguridad', 'Administración', 'Configuración', 'Hospitales', 'Pacientes', 'Radiólogos y médicos', 'Estudios', 'Informes', 'Convocatorias', 'Asignaciones']
const PERIODOS = ['Últimos 30 días', 'Últimos 7 días', 'Hoy', 'Últimos 90 días', 'Este año']
const POR_PAGINA = 10

function desdePeriodo(p: string) {
  const hoy = new Date()
  if (p === 'Hoy') return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()
  if (p === 'Este año') return new Date(hoy.getFullYear(), 0, 1).toISOString()
  const dias = p === 'Últimos 7 días' ? 7 : p === 'Últimos 90 días' ? 90 : 30
  return new Date(hoy.getTime() - dias * 86400000).toISOString()
}

type EventoReal = {
  id: number; fecha: string; fechaSeg: string; usuario: string; rol: string; accion: string; accionRaw: string; modulo: string
  registro: string; ip: string; ok: boolean; navegador: string; dispositivo: string; obs: string; detalle: string
}

async function fetchEventos(periodo: string): Promise<EventoReal[]> {
  const { data, error } = await supabase.from('auditoria')
    .select('id, created_at, usuario, rol, accion, modulo, registro_afectado, detalle, ip, navegador, dispositivo, resultado, observaciones')
    .gte('created_at', desdePeriodo(periodo)).order('created_at', { ascending: false }).limit(1000)
  if (error) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((a) => {
    const d = new Date(a.created_at)
    return {
      id: a.id, fecha: fFechaHora(a.created_at),
      fechaSeg: `${fFecha(a.created_at)} ${d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
      usuario: a.usuario ?? 'Sistema', rol: a.rol ? ROL_LABEL[a.rol] ?? a.rol : '—',
      accion: ACCION_LABEL[a.accion] ?? a.accion, accionRaw: a.accion, modulo: a.modulo, registro: a.registro_afectado || '—',
      ip: a.ip || '—', ok: a.resultado !== 'fallido', navegador: a.navegador || '—', dispositivo: a.dispositivo || '—',
      obs: a.observaciones || '—', detalle: a.detalle ? JSON.stringify(a.detalle) : '',
    }
  })
}

async function fetchKpisAuditoria() {
  const desde = new Date(Date.now() - 30 * 86400000).toISOString()
  const base = () => supabase.from('auditoria').select('id', { count: 'exact', head: true }).gte('created_at', desde)
  const [t, s, c, g] = await Promise.all([
    base(),
    base().eq('accion', 'inicio_sesion'),
    base().in('accion', ['creacion', 'actualizacion', 'eliminacion']),
    base().or('resultado.eq.fallido,modulo.eq.Seguridad'),
  ])
  const n = (r: { count: number | null; error: unknown }) => (r.error ? 0 : r.count ?? 0)
  return { total: n(t), sesiones: n(s), cambios: n(c), seguridad: n(g) }
}

const unicos = (xs: string[]) => [...new Set(xs.filter((x) => x && x !== '—'))].sort((a, b) => a.localeCompare(b, 'es'))

function AuditoriaReal() {
  const [exportOpen, setExportOpen] = useState(false)
  const [moreFilters, setMoreFilters] = useState(false)
  const [periodo, setPeriodo] = useState(PERIODOS[0])
  const [fUsuario, setFUsuario] = useState('Todos los usuarios')
  const [fAccion, setFAccion] = useState('Todas las acciones')
  const [fModulo, setFModulo] = useState('Todos los módulos')
  const [fResultado, setFResultado] = useState('Todos')
  const [fIp, setFIp] = useState('')
  const [fRegistro, setFRegistro] = useState('')
  const [fDisp, setFDisp] = useState('Todos')
  const [pagina, setPagina] = useState(1)
  const [selId, setSelId] = useState<number | null>(null)
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  const kpis = useDatos(fetchKpisAuditoria, { total: 0, sesiones: 0, cambios: 0, seguridad: 0 })
  const { datos, cargando } = useDatos(() => fetchEventos(periodo), [] as EventoReal[], [periodo])
  const k = kpis.datos
  const v = (n: number) => (kpis.cargando ? '…' : num(n))

  const ip = fIp.trim().toLowerCase(), reg = fRegistro.trim().toLowerCase()
  const lista = datos.filter((e) =>
    (fUsuario === 'Todos los usuarios' || e.usuario === fUsuario)
    && (fAccion === 'Todas las acciones' || e.accion === fAccion)
    && (fModulo === 'Todos los módulos' || e.modulo === fModulo)
    && (fResultado === 'Todos' || (fResultado === 'Exitoso') === e.ok)
    && (!ip || e.ip.toLowerCase().includes(ip))
    && (!reg || e.registro.toLowerCase().includes(reg))
    && (fDisp === 'Todos' || e.dispositivo === fDisp))
  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const pag = Math.min(pagina, totalPaginas)
  const desde = (pag - 1) * POR_PAGINA
  const filas = lista.slice(desde, desde + POR_PAGINA)
  const e = lista.find((x) => x.id === selId) ?? filas[0]
  const all = filas.length > 0 && filas.every((r) => checked[r.id])
  const usuarios = unicos(datos.map((x) => x.usuario))
  const modulos = unicos([...MODULOS, ...datos.map((x) => x.modulo)])
  const dispositivos = unicos(datos.map((x) => x.dispositivo))
  const filtro = (fn: (v: string) => void) => (val: string) => { fn(val); setPagina(1) }

  return (
    <div>
      <PageHeader
        icon={FileText}
        title="Auditoría"
        subtitle="Registro de eventos del sistema, accesos, cambios y actividades importantes"
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
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={User} tone="blue" value={v(k.total)} label="Eventos registrados (últimos 30 días)" sub={k.total ? undefined : 'Sin datos aún'} />
        <Kpi icon={KeyRound} tone="green" value={v(k.sesiones)} label="Inicios de sesión" sub="Últimos 30 días" />
        <Kpi icon={FileText} tone="orange" value={v(k.cambios)} label="Cambios en registros" sub="Creaciones, actualizaciones y eliminaciones" />
        <Kpi icon={ShieldAlert} tone="red" value={v(k.seguridad)} label="Eventos de seguridad" sub="Fallidos o del módulo Seguridad" />
      </div>

      {/* Filtros */}
      <div className="card mb-4 grid grid-cols-1 items-center gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[auto_1fr_1fr_1fr_1fr_auto]">
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink"><CalendarDays size={18} className="text-brand-600" /> Periodo</span>
        <Select options={PERIODOS} onChange={filtro(setPeriodo)} />
        <Select key={`u${usuarios.length}`} options={['Todos los usuarios', ...usuarios]} onChange={filtro(setFUsuario)} />
        <Select options={['Todas las acciones', ...Object.values(ACCION_LABEL)]} onChange={filtro(setFAccion)} />
        <Select key={`m${modulos.length}`} options={['Todos los módulos', ...modulos]} onChange={filtro(setFModulo)} />
        <button onClick={() => setMoreFilters(!moreFilters)} className={clsx('btn-outline min-w-[130px]', moreFilters && 'bg-brand-50')}><Filter size={16} /> Más filtros</button>
      </div>
      {moreFilters && (
        <div className="card mb-4 grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 xl:grid-cols-4">
          <div><span className="label">Resultado</span><Select options={['Todos', 'Exitoso', 'Fallido']} value={fResultado} onChange={filtro(setFResultado)} /></div>
          <div><span className="label">Dirección IP</span><input className="input" placeholder="Ej. 192.168.0.1" value={fIp} onChange={(ev) => { setFIp(ev.target.value); setPagina(1) }} /></div>
          <div><span className="label">Registro afectado</span><input className="input" placeholder="Código o identificador" value={fRegistro} onChange={(ev) => { setFRegistro(ev.target.value); setPagina(1) }} /></div>
          <div><span className="label">Dispositivo</span><Select key={`d${dispositivos.length}`} options={['Todos', ...dispositivos]} value={fDisp} onChange={filtro(setFDisp)} /></div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-8 2xl:col-span-9" icon={ClipboardList} bodyClass="!px-0 !pb-0"
          title={<span className="flex items-center gap-3">Registro de auditoría <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[12px] font-medium text-brand-700">{cargando ? '…' : num(lista.length)} registros</span></span>}>
          <Table className="px-2">
            <thead>
              <tr className="bg-[#f5f8fd]">
                <th className="th w-8"><Checkbox checked={all} onChange={(val) => setChecked({ ...checked, ...Object.fromEntries(filas.map((r) => [r.id, val])) })} /></th>
                {['#', 'Fecha / Hora', 'Usuario', 'Acción', 'Módulo', 'Registro afectado', 'IP', 'Resultado', ''].map((h, i) => <th key={i} className="th text-brand-800">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan={10} className="td py-8 text-center text-slate-400">Cargando…</td></tr>}
              {!cargando && lista.length === 0 && (
                <tr><td colSpan={10} className="td py-8 text-center text-slate-400">
                  {datos.length === 0 ? 'Aún no hay eventos registrados en este período' : 'No se encontraron eventos con los filtros seleccionados'}
                </td></tr>
              )}
              {!cargando && filas.map((r, i) => (
                <tr key={r.id} onClick={() => setSelId(r.id)} className={clsx('tr cursor-pointer', e?.id === r.id && '!bg-brand-50/80')}>
                  <td className="td" onClick={(ev) => ev.stopPropagation()}>
                    <Checkbox checked={!!checked[r.id]} onChange={(val) => setChecked({ ...checked, [r.id]: val })} />
                  </td>
                  <td className="td">{desde + i + 1}</td>
                  <td className="td whitespace-nowrap">{r.fecha}</td>
                  <td className="td text-ink">{r.usuario}</td>
                  <td className="td"><Badge tone={ACCION_TONE[r.accionRaw] ?? 'gray'} icon={false}>{r.accion}</Badge></td>
                  <td className="td"><span className={clsx('chip whitespace-nowrap px-2.5 py-1 text-[11.5px] font-medium', moduloStyle[r.modulo] ?? 'bg-slate-100 text-ink')}>{r.modulo}</span></td>
                  <td className="td whitespace-nowrap text-ink">{r.registro}</td>
                  <td className="td whitespace-nowrap">{r.ip}</td>
                  <td className="td"><Resultado ok={r.ok} /></td>
                  <td className="td" onClick={(ev) => ev.stopPropagation()}><DotsButton onClick={() => setSelId(r.id)} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination
            text={lista.length === 0 ? 'Mostrando 0 de 0 registros' : `Mostrando ${num(desde + 1)} a ${num(Math.min(desde + POR_PAGINA, lista.length))} de ${num(lista.length)} registros`}
            page={pag} onPage={setPagina} totalPages={totalPaginas} perPage={false} />
        </Panel>

        <Panel className="xl:col-span-4 2xl:col-span-3" title="Detalle del evento" icon={FileText} action={e ? <Resultado ok={e.ok} /> : undefined}>
          {!e ? (
            <div className="py-10 text-center text-[12.5px] text-slate-400">{cargando ? 'Cargando…' : datos.length ? 'Selecciona un registro' : 'Sin registros'}</div>
          ) : (
            <>
              <div className="[&>div]:py-2.5">
                <InfoRow label="Fecha / Hora">{e.fechaSeg}</InfoRow>
                <InfoRow label="Usuario">{e.usuario}</InfoRow>
                <InfoRow label="Rol">{e.rol}</InfoRow>
                <InfoRow label="Acción">{e.accion}</InfoRow>
                <InfoRow label="Módulo">{e.modulo}</InfoRow>
                <InfoRow label="Registro afectado">{e.registro}</InfoRow>
                <InfoRow label="Dirección IP">{e.ip}</InfoRow>
                <InfoRow label="Navegador">{e.navegador}</InfoRow>
                <InfoRow label="Dispositivo">{e.dispositivo}</InfoRow>
                <InfoRow label="Resultado"><Resultado ok={e.ok} /></InfoRow>
                <InfoRow label="Observaciones">{e.obs}</InfoRow>
                {e.detalle && <InfoRow label="Detalle"><code className="break-all text-[11.5px]">{e.detalle}</code></InfoRow>}
              </div>
              {e.ok ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> Evento registrado sin incidencias.
                </div>
              ) : (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" /> Evento fallido: revíselo con el equipo de seguridad.
                </div>
              )}
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}

/* ---------- Página ---------- */
export default function Auditoria() {
  return supabaseConfigurado ? <AuditoriaReal /> : <AuditoriaDemo />
}

function AuditoriaDemo() {
  const [exportOpen, setExportOpen] = useState(false)
  const [moreFilters, setMoreFilters] = useState(false)
  const [sel, setSel] = useState(0)
  const [checked, setChecked] = useState<boolean[]>(EVENTOS.map(() => false))
  const e = EVENTOS[sel]
  const all = checked.every(Boolean)

  return (
    <div>
      <PageHeader
        icon={FileText}
        title="Auditoría"
        subtitle="Registro de eventos del sistema, accesos, cambios y actividades importantes"
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
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={User} tone="blue" value="2,341" label="Eventos registrados (últimos 30 días)" sub="12% vs. mes anterior" trend="up" />
        <Kpi icon={KeyRound} tone="green" value="842" label="Inicios de sesión" sub="8% vs. mes anterior" trend="up" />
        <Kpi icon={FileText} tone="orange" value="321" label="Cambios en registros" sub="15% vs. mes anterior" trend="up" />
        <Kpi icon={ShieldAlert} tone="red" value="24" label="Eventos de seguridad" sub="3% vs. mes anterior" trend="up" trendTone="bad" />
      </div>

      {/* Filtros */}
      <div className="card mb-4 grid grid-cols-1 items-center gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_auto]">
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink"><CalendarDays size={18} className="text-brand-600" /> Periodo</span>
        <Select options={['Últimos 30 días', 'Últimos 7 días', 'Hoy', 'Últimos 90 días', 'Este año']} />
        <Select options={['Todos los usuarios', ...EVENTOS.map((x) => x.usuario)]} />
        <Select options={['Todas las acciones', 'Inicio de sesión', 'Consulta', 'Actualización', 'Creación', 'Eliminación', 'Asignación', 'Cambio de rol', 'Configuración', 'Acceso denegado', 'Exportación']} />
        <Select options={['Todos los módulos', 'Seguridad', 'Estudios', 'Pacientes', 'Informes', 'Configuración', 'Administración', 'Sistema', 'Reportes']} />
        <Select options={['Todos los hospitales', 'SNS - Nivel Nacional', 'HPHM', 'HJM', 'HRC', 'HRA', 'HGA', 'HMC']} />
        <button onClick={() => setMoreFilters(!moreFilters)} className={clsx('btn-outline min-w-[130px]', moreFilters && 'bg-brand-50')}><Filter size={16} /> Más filtros</button>
      </div>
      {moreFilters && (
        <div className="card mb-4 grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 xl:grid-cols-4">
          <div><span className="label">Resultado</span><Select options={['Todos', 'Exitoso', 'Fallido']} /></div>
          <div><span className="label">Dirección IP</span><input className="input" placeholder="Ej. 186.21.45.78" /></div>
          <div><span className="label">Registro afectado</span><input className="input" placeholder="Ej. EST-2025-000892" /></div>
          <div><span className="label">Dispositivo</span><Select options={['Todos', 'PC - Windows', 'PC - macOS', 'Móvil - Android', 'iPad - iPadOS']} /></div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-8 2xl:col-span-9" icon={ClipboardList} bodyClass="!px-0 !pb-0"
          title={<span className="flex items-center gap-3">Registro de auditoría <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[12px] font-medium text-brand-700">2,341 registros</span></span>}>
          <Table className="px-2">
            <thead>
              <tr className="bg-[#f5f8fd]">
                <th className="th w-8"><Checkbox checked={all} onChange={(v) => setChecked(checked.map(() => v))} /></th>
                {['#', 'Fecha / Hora', 'Usuario', 'Acción', 'Módulo', 'Registro afectado', 'IP', 'Resultado', ''].map((h, i) => <th key={i} className="th text-brand-800">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {EVENTOS.map((r, i) => (
                <tr key={i} onClick={() => setSel(i)} className={clsx('tr cursor-pointer', sel === i && '!bg-brand-50/80')}>
                  <td className="td" onClick={(ev) => ev.stopPropagation()}>
                    <Checkbox checked={checked[i]} onChange={(v) => setChecked(checked.map((c, j) => (j === i ? v : c)))} />
                  </td>
                  <td className="td">{i + 1}</td>
                  <td className="td whitespace-nowrap leading-tight">{r.fecha}<br />{r.hora}</td>
                  <td className="td text-ink">{r.usuario}</td>
                  <td className="td"><Badge tone={r.accionTone} icon={false}>{r.accion}</Badge></td>
                  <td className="td"><span className={clsx('chip whitespace-nowrap px-2.5 py-1 text-[11.5px] font-medium', moduloStyle[r.modulo])}>{r.modulo}</span></td>
                  <td className="td whitespace-nowrap text-ink">{r.registro}</td>
                  <td className="td whitespace-nowrap">{r.ip}</td>
                  <td className="td"><Resultado ok={r.ok} /></td>
                  <td className="td" onClick={(ev) => ev.stopPropagation()}><DotsButton onClick={() => setSel(i)} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination text="Mostrando 1 a 10 de 2,341 registros" last={235} />
        </Panel>

        <Panel className="xl:col-span-4 2xl:col-span-3" title="Detalle del evento" icon={FileText} action={<Resultado ok={e.ok} />}>
          <div className="[&>div]:py-2.5">
            <InfoRow label="Fecha / Hora">{e.fecha} {e.segundos}</InfoRow>
            <InfoRow label="Usuario">{e.usuario} ({e.nombre})</InfoRow>
            <InfoRow label="Acción">{e.accion}</InfoRow>
            <InfoRow label="Módulo">{e.modulo}</InfoRow>
            <InfoRow label="Registro afectado">{e.registro}</InfoRow>
            <InfoRow label="Dirección IP">{e.ip}</InfoRow>
            <InfoRow label="Ubicación">{e.ubicacion}</InfoRow>
            <InfoRow label="Navegador">{e.navegador}</InfoRow>
            <InfoRow label="Dispositivo">{e.dispositivo}</InfoRow>
            <InfoRow label="Resultado"><Resultado ok={e.ok} /></InfoRow>
            <InfoRow label="Observaciones">{e.obs}</InfoRow>
          </div>
          {!e.ok && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">
              <AlertCircle size={15} className="mt-0.5 shrink-0" /> Evento marcado para revisión por el equipo de seguridad.
            </div>
          )}
          {e.ok && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> Evento verificado sin incidencias.
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
