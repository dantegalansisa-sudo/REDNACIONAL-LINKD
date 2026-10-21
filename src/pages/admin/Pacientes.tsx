import { useMemo, useState, type ReactNode } from 'react'
import {
  Building2, Calendar, ChevronDown, Clock, CreditCard, FileText, Filter, History, Hospital,
  Monitor, MoreHorizontal, Search, Tag, Upload, User, UserRound, Users, type LucideIcon,
} from 'lucide-react'
import { Badge, Checkbox, IconCircle, Kpi, Modality, PageHeader, Pagination, Select, Table, Tabs, UserSilhouette, clsx, type Tone } from '../../components/ui'
import {
  contarAccesos, fetchAccesos, fetchEstudiosPaciente, fetchPacientes, num, pct, useDatos,
  type Acceso, type EstudioResumen, type PacienteReal,
} from '../../lib/admin-data'
import { supabase } from '../../lib/supabase'

/* ---------------- Datos mock ---------------- */
type Paciente = {
  n: number; hn: string; cedula: string; nombre: string; tel: string; edad: number; sexo: 'M' | 'F'; ultimo: string
  estado: 'Con estudios' | 'Sin estudios'; dob: string; dir: string; email: string; emergencia: string
  estudios: number; hospitales: number; accesos: number; referidores: number
}

const PACIENTES: Paciente[] = [
  { n: 1, hn: 'HN-00012345', cedula: '001-1567890-1', nombre: 'Juan Pérez Gómez', tel: '809-555-1234', edad: 45, sexo: 'M', ultimo: '15/03/2025', estado: 'Con estudios', dob: '12/05/1980', dir: 'Av. Independencia #123, Santo Domingo', email: 'juan.perez@email.com', emergencia: 'Ana Pérez (829-555-5678)', estudios: 8, hospitales: 3, accesos: 2, referidores: 1 },
  { n: 2, hn: 'HN-00012344', cedula: '001-2345678-2', nombre: 'María López Díaz', tel: '829-555-9876', edad: 62, sexo: 'F', ultimo: '15/03/2025', estado: 'Con estudios', dob: '03/09/1962', dir: 'C/ Duarte #45, La Romana', email: 'maria.lopez@email.com', emergencia: 'José López (809-555-1122)', estudios: 12, hospitales: 2, accesos: 5, referidores: 2 },
  { n: 3, hn: 'HN-00012343', cedula: '402-1234567-8', nombre: 'Carlos Peña Rojas', tel: '809-555-4567', edad: 37, sexo: 'M', ultimo: '14/03/2025', estado: 'Con estudios', dob: '21/01/1988', dir: 'C/ Sánchez #12, San Juan de la Maguana', email: 'carlos.pena@email.com', emergencia: 'Rosa Rojas (829-555-3344)', estudios: 4, hospitales: 1, accesos: 1, referidores: 1 },
  { n: 4, hn: 'HN-00012342', cedula: '001-9876543-2', nombre: 'Ana Rodríguez Soto', tel: '829-555-2345', edad: 28, sexo: 'F', ultimo: '14/03/2025', estado: 'Con estudios', dob: '14/07/1996', dir: 'Av. Las Américas #88, Boca Chica', email: 'ana.rodriguez@email.com', emergencia: 'Pedro Soto (809-555-7788)', estudios: 3, hospitales: 1, accesos: 4, referidores: 1 },
  { n: 5, hn: 'HN-00012341', cedula: '001-3456789-0', nombre: 'Pedro Martínez Cruz', tel: '809-555-7654', edad: 70, sexo: 'M', ultimo: '13/03/2025', estado: 'Con estudios', dob: '30/11/1954', dir: 'C/ del Sol #210, Santiago', email: 'pedro.martinez@email.com', emergencia: 'Luisa Cruz (829-555-9900)', estudios: 15, hospitales: 4, accesos: 0, referidores: 3 },
  { n: 6, hn: 'HN-00012340', cedula: '223-4567890-1', nombre: 'Lucía Jiménez Vargas', tel: '829-555-8765', edad: 50, sexo: 'F', ultimo: '13/03/2025', estado: 'Con estudios', dob: '08/02/1975', dir: 'C/ Mella #34, Barahona', email: 'lucia.jimenez@email.com', emergencia: 'Mario Vargas (809-555-4455)', estudios: 6, hospitales: 2, accesos: 3, referidores: 1 },
  { n: 7, hn: 'HN-00012339', cedula: '001-5678901-2', nombre: 'Roberto Díaz Méndez', tel: '809-555-3456', edad: 61, sexo: 'M', ultimo: '12/03/2025', estado: 'Con estudios', dob: '17/06/1963', dir: 'Av. España #5, Higüey', email: 'roberto.diaz@email.com', emergencia: 'Carmen Méndez (829-555-6677)', estudios: 9, hospitales: 2, accesos: 1, referidores: 2 },
  { n: 8, hn: 'HN-00012338', cedula: '001-6789012-3', nombre: 'Carmen Vargas Peña', tel: '829-555-6543', edad: 33, sexo: 'F', ultimo: '12/03/2025', estado: 'Con estudios', dob: '25/10/1991', dir: 'C/ Principal #19, Constanza', email: 'carmen.vargas@email.com', emergencia: 'Luis Peña (809-555-2233)', estudios: 2, hospitales: 1, accesos: 2, referidores: 1 },
  { n: 9, hn: 'HN-00012337', cedula: '402-7654321-9', nombre: 'Luis Santana Blanco', tel: '809-555-9876', edad: 56, sexo: 'M', ultimo: '11/03/2025', estado: 'Sin estudios', dob: '02/04/1969', dir: 'C/ Colón #77, Azua', email: 'luis.santana@email.com', emergencia: 'Marta Blanco (829-555-8899)', estudios: 0, hospitales: 1, accesos: 0, referidores: 0 },
  { n: 10, hn: 'HN-00012336', cedula: '001-8901234-5', nombre: 'Sofía Méndez Castillo', tel: '829-555-4321', edad: 41, sexo: 'F', ultimo: '11/03/2025', estado: 'Con estudios', dob: '19/12/1983', dir: 'Av. Circunvalación #3, San Pedro de Macorís', email: 'sofia.mendez@email.com', emergencia: 'Jorge Castillo (809-555-1010)', estudios: 5, hospitales: 2, accesos: 2, referidores: 1 },
]

const ACCESOS = [
  { f: '14/03/2025 08:32 a. m.', d: 'Celular', nav: 'Chrome / Android', ip: '186.21.45.78', a: 'Ver informe' },
  { f: '10/03/2025 07:15 p. m.', d: 'PC', nav: 'Edge / Windows', ip: '201.200.15.33', a: 'Ver estudio' },
  { f: '28/02/2025 09:41 a. m.', d: 'Tablet', nav: 'Safari / iPadOS', ip: '190.118.22.11', a: 'Ver resultados' },
]

const ESTUDIOS_PAC = [
  { id: 'EST-2025-000892', m: 'CT', d: 'Tomografía Computarizada', f: '15/03/2025', h: 'Hosp. Hugo Mendoza', e: 'Informe publicado' },
  { id: 'EST-2025-000731', m: 'RX', d: 'Radiografía de Tórax', f: '02/02/2025', h: 'Hosp. Dr. Fco. A. Gonzalvo', e: 'Informe publicado' },
  { id: 'EST-2024-004512', m: 'US', d: 'Ecografía Abdominal', f: '18/11/2024', h: 'Hosp. Juan de Herrera', e: 'Informe publicado' },
]

/** Paciente con la forma de los datos reales; `accesos` solo existe en los de ejemplo */
type Pac = PacienteReal & { accesos?: number }
const MOCK: Pac[] = PACIENTES.map((p) => ({ ...p, id: p.hn, userId: null, activo: true, registrado: '—' }))
const POR_PAGINA = 10

/** Minúsculas y sin tildes, para búsquedas */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
/** dd/mm/aaaa → Date (las fechas ya vienen formateadas desde la capa de datos) */
const leerFecha = (f: string) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(f)
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null
}

type ReferenciaPaciente = { id: string; nombre: string; estudios: number }

/** Médicos referidores de los estudios del paciente */
async function fetchReferidoresPaciente(pacienteId: string): Promise<ReferenciaPaciente[]> {
  const { data, error } = await supabase.from('estudios')
    .select('medico_referidor_id, referidor:medicos!estudios_medico_referidor_id_fkey(tratamiento, nombre_completo)')
    .eq('paciente_id', pacienteId).not('medico_referidor_id', 'is', null)
  if (error) throw new Error(error.message)
  const m = new Map<string, ReferenciaPaciente>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const e of (data ?? []) as any[]) {
    const r = Array.isArray(e.referidor) ? e.referidor[0] : e.referidor
    const prev = m.get(e.medico_referidor_id)
    if (prev) prev.estudios++
    else m.set(e.medico_referidor_id, { id: e.medico_referidor_id, nombre: r ? `${r.tratamiento ?? 'Dr.'} ${r.nombre_completo}` : 'Médico referidor', estudios: 1 })
  }
  return [...m.values()]
}

function ExportButton() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button className="btn-primary px-5 py-2.5" onClick={() => setOpen(!open)}><Upload size={17} /> Exportar <ChevronDown size={16} className="ml-4" /></button>
      {open && (
        <div className="absolute right-0 top-12 z-20 w-44 overflow-hidden rounded-lg border border-[#e3eaf6] bg-white py-1 shadow-soft">
          {['Exportar a PDF', 'Exportar a Excel', 'Exportar a CSV'].map((o) => (
            <button key={o} onClick={() => setOpen(false)} className="block w-full px-4 py-2 text-left text-[12.5px] text-ink hover:bg-brand-50">{o}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Página ---------------- */
export default function Pacientes() {
  const { datos, cargando, error, recargar, real } = useDatos<Pac[]>(fetchPacientes, MOCK)
  const [q, setQ] = useState('')
  const [applied, setApplied] = useState('')
  const [fEstado, setFEstado] = useState('Todos los estados')
  const [sel, setSel] = useState<string | null>(real ? null : PACIENTES[0].hn)
  const [tab, setTab] = useState(0)
  const [checked, setChecked] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [ahora] = useState(() => Date.now())

  // Accesos al portal por usuario (para el KPI y el resumen)
  const userIds = useMemo(() => datos.map((p) => p.userId).filter((u): u is string => !!u), [datos])
  const idsKey = userIds.join(',')
  const accesosPorUsuario = useDatos(() => contarAccesos(userIds), {} as Record<string, number>, [idsKey])

  const list = useMemo(() => datos.filter((p) => {
    const t = norm(`${p.hn} ${p.cedula} ${p.cedula.replace(/\D/g, '')} ${p.nombre} ${p.tel} ${p.tel.replace(/\D/g, '')}`)
    return (!applied || t.includes(norm(applied.trim()))) && (fEstado === 'Todos los estados' || p.estado === fEstado)
  }), [datos, applied, fEstado])

  const totalPages = Math.max(1, Math.ceil(list.length / POR_PAGINA))
  const pagina = Math.min(page, totalPages)
  const filas = real ? list.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA) : list

  const p: Pac | undefined = real ? (list.find((x) => x.id === sel) ?? filas[0]) : (MOCK.find((x) => x.id === sel) ?? MOCK[0])
  const allChecked = filas.length > 0 && filas.every((x) => checked.includes(x.id))

  // Detalle del paciente seleccionado (solo con datos reales)
  const pid = p?.id ?? ''
  const tieneEstudios = (p?.estudios ?? 0) > 0
  const estudios = useDatos<EstudioResumen[]>(() => (pid && tieneEstudios ? fetchEstudiosPaciente(pid) : Promise.resolve([])), [], [pid, tieneEstudios])
  const accesos = useDatos<Acceso[]>(() => fetchAccesos(p?.userId ?? null), [], [p?.userId])
  const referencias = useDatos<ReferenciaPaciente[]>(() => (pid && (p?.referidores ?? 0) > 0 ? fetchReferidoresPaciente(pid) : Promise.resolve([])), [], [pid, p?.referidores])

  // KPIs reales
  const total = datos.length
  const conEstudios = datos.filter((x) => x.estudios > 0).length
  const totalEstudios = datos.reduce((s, x) => s + x.estudios, 0)
  const conAcceso = datos.filter((x) => x.userId && (accesosPorUsuario.datos[x.userId] ?? 0) > 0).length
  const hace30 = new Date(ahora - 30 * 86400000)
  const nuevos30 = datos.filter((x) => { const d = leerFecha(x.registrado); return d && d >= hace30 }).length
  const v = (n: number, carga = cargando) => (carga ? '…' : num(n))

  const desde = list.length ? (pagina - 1) * POR_PAGINA + 1 : 0
  const hasta = Math.min(pagina * POR_PAGINA, list.length)
  const nAccesos = real ? (p?.userId ? accesosPorUsuario.datos[p.userId] ?? 0 : 0) : p?.accesos ?? 0

  /** Hospitales visitados según los estudios cargados (últimos 10) */
  const hospitalesVisitados = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of estudios.datos) m.set(e.hospital, (m.get(e.hospital) ?? 0) + 1)
    return [...m.entries()]
  }, [estudios.datos])
  const ultimo = estudios.datos[0]

  return (
    <>
      <PageHeader icon={Users} title="Pacientes"
        subtitle="Registro nacional de pacientes, historial de estudios, acceso al portal y trazabilidad de su actividad" actions={<ExportButton />} />

      {real ? (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <Kpi icon={User} tone="blue" value={v(total)} label="Pacientes registrados" sub={`${num(datos.filter((x) => x.activo).length)} con cuenta activa`} />
          <Kpi icon={FileText} tone="blue" value={v(totalEstudios)} label="Estudios realizados" sub="En toda la red" />
          <Kpi icon={UserRound} tone="orange" value={v(conEstudios)} label="Pacientes con estudios" sub={`${pct(conEstudios, total)} del total`} />
          <Kpi icon={Monitor} tone="green" value={v(conAcceso, cargando || accesosPorUsuario.cargando)} label="Han accedido al portal" sub={`${pct(conAcceso, total)} del total`} />
          <Kpi icon={Clock} tone="blue" value={v(nuevos30)} label="Pacientes nuevos (30 días)" sub="Registrados en los últimos 30 días" />
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <Kpi icon={User} tone="blue" value="24,893" label="Pacientes registrados" sub="8% vs. mes anterior" trend="up" />
          <Kpi icon={FileText} tone="blue" value="58,214" label="Estudios realizados" sub="12% vs. mes anterior" trend="down" trendTone="good" />
          <Kpi icon={UserRound} tone="orange" value="18,642" label="Pacientes únicos" sub="75% del total" />
          <Kpi icon={Monitor} tone="green" value="6,381" label="Han accedido al portal" sub="25.6% del total" />
          <Kpi icon={Clock} tone="blue" value="923" label="Pacientes nuevos (hoy)" sub="14% vs. ayer" trend="up" />
        </div>
      )}

      <form className="card mb-4 grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.6fr_1.1fr_1fr_1fr_0.75fr_1.1fr]"
        onSubmit={(e) => { e.preventDefault(); setApplied(q); setPage(1) }}>
        <label className="relative flex items-center">
          <Search size={16} className="pointer-events-none absolute left-3 text-slate-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); if (!e.target.value) { setApplied(''); setPage(1) } }} className="input pl-9" placeholder="Buscar por HN, cédula, nombre, teléfono..." />
        </label>
        <Select icon={Building2} options={['Todos los hospitales', 'Hosp. Hugo Mendoza', 'Hosp. Dr. Fco. A. Gonzalvo', 'Hosp. Juan de Herrera', 'Hosp. Jaime Mota']} />
        <Select icon={Tag} options={['Todos los estados', 'Con estudios', 'Sin estudios']} onChange={(x) => { setFEstado(x); setPage(1) }} />
        <Select icon={Calendar} options={['Últimos 6 meses', 'Últimos 30 días', 'Último año', 'Todo el historial']} />
        <button type="button" className="btn-outline"><Filter size={16} /> Más filtros</button>
        <button type="submit" className="btn-primary"><Search size={17} /> Buscar</button>
      </form>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="card min-w-0 xl:col-span-7">
          <div className="flex items-center gap-3 px-4 pb-2 pt-3.5">
            <FileText size={24} className="text-brand-600" />
            <h3 className="text-[16px] font-bold text-ink">Listado de pacientes</h3>
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11.5px] text-brand-700">
              {real ? (cargando ? 'Cargando…' : `${num(list.length)} registro${list.length === 1 ? '' : 's'}`) : '24,893 registros'}
            </span>
          </div>
          <Table className="[&_.td]:px-2 [&_.th]:px-2">
            <thead>
              <tr className="bg-[#f6f9fe]">
                <th className="th !pl-4"><Checkbox checked={allChecked} onChange={(c) => setChecked(c ? filas.map((x) => x.id) : [])} /></th>
                <th className="th">#</th><th className="th">Código HN</th><th className="th">Cédula</th><th className="th">Nombre completo</th>
                <th className="th">Teléfono</th><th className="th">Edad</th><th className="th">Sexo</th><th className="th">Último estudio</th>
                <th className="th">Estado</th><th className="th pr-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {real && cargando && <tr><td colSpan={11} className="td py-8 text-center">Cargando…</td></tr>}
              {real && !cargando && error && (
                <tr><td colSpan={11} className="td py-8 text-center text-red-600">No se pudieron cargar los pacientes: {error} <button onClick={recargar} className="ml-2 font-semibold text-brand-600 hover:underline">Reintentar</button></td></tr>
              )}
              {!(real && cargando) && filas.map((x) => (
                <tr key={x.id} onClick={() => { setSel(x.id); setTab(0) }} className={clsx('tr h-[44px] cursor-pointer', x.id === p?.id && '!bg-brand-50/70')}>
                  <td className="td !pl-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={checked.includes(x.id)} onChange={() => setChecked(checked.includes(x.id) ? checked.filter((h) => h !== x.id) : [...checked, x.id])} />
                  </td>
                  <td className="td text-ink">{x.n}</td>
                  <td className="td whitespace-nowrap text-brand-700">{x.hn}</td>
                  <td className="td whitespace-nowrap">{x.cedula}</td>
                  <td className="td whitespace-nowrap text-ink">{x.nombre}</td>
                  <td className="td whitespace-nowrap">{x.tel}</td>
                  <td className="td">{x.edad}</td>
                  <td className="td">{x.sexo}</td>
                  <td className="td">{x.ultimo}</td>
                  <td className="td"><Badge tone={x.estado === 'Con estudios' ? 'green' : 'gray'} icon className="rounded-full">{x.estado}</Badge></td>
                  <td className="td pr-4 text-center" onClick={(e) => e.stopPropagation()}><button className="dots-btn" aria-label="Acciones"><MoreHorizontal size={16} /></button></td>
                </tr>
              ))}
              {!(real && (cargando || error)) && list.length === 0 && (
                <tr><td colSpan={11} className="td py-8 text-center">{real && total === 0 ? 'Aún no hay pacientes registrados.' : 'No se encontraron pacientes.'}</td></tr>
              )}
            </tbody>
          </Table>
          {real
            ? <Pagination text={`Mostrando ${num(desde)} a ${num(hasta)} de ${num(list.length)} paciente${list.length === 1 ? '' : 's'}`} page={pagina} onPage={setPage} totalPages={totalPages} />
            : <Pagination text="Mostrando 1 a 10 de 24,893 pacientes" pages={[1, 2, 3, 4, 5]} last={2490} />}
        </section>

        <div className="min-w-0 space-y-4 xl:col-span-5">
          {!p ? (
            <section className="card flex flex-col items-center px-6 py-12 text-center">
              <UserRound size={36} className="text-slate-300" />
              <p className="mt-3 text-[13.5px] font-semibold text-ink">
                {cargando ? 'Cargando…' : total === 0 ? 'Aún no hay pacientes registrados' : 'Ningún paciente coincide con la búsqueda'}
              </p>
              <p className="mt-1 text-[12.5px] text-slate-500">{total === 0 && !cargando ? 'Los pacientes aparecerán aquí cuando se registren en el portal o en un hospital de la red.' : 'Selecciona un paciente del listado para ver su detalle.'}</p>
            </section>
          ) : (<>
          <section className="card">
            <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-3.5">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-ink"><UserRound size={19} className="text-brand-600" /> Detalle del paciente</h3>
              <button className="btn-outline px-2.5 py-1 text-[12px]"><History size={14} /> Ver historial completo</button>
            </div>
            <div className="flex flex-wrap items-start gap-4 px-4 py-3">
              <UserSilhouette size={100} />
              <div className="min-w-0 flex-1 space-y-0.5 text-[12.5px] text-ink/90">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[17px] font-bold text-ink">{p.nombre}</div>
                    <div className="mb-1 text-slate-600">{p.hn}</div>
                  </div>
                  {real
                    ? <Badge tone={p.activo ? 'green' : 'gray'} icon className="rounded-full px-3 py-1 text-[12.5px]">{p.activo ? 'Activo' : 'Inactivo'}</Badge>
                    : <Badge tone={p.estado === 'Con estudios' ? 'green' : 'gray'} icon className="rounded-full px-3 py-1 text-[12.5px]">Activo</Badge>}
                </div>
                <InfoLine icon={CreditCard}>Cédula: {p.cedula}</InfoLine>
                <InfoLine icon={Users}>Teléfono: {p.tel}</InfoLine>
                <InfoLine icon={Calendar}>Fecha de nacimiento: {p.dob}{p.dob !== '—' && ` (${p.edad} años)`}</InfoLine>
                <InfoLine icon={User}>Sexo: {p.sexo === 'M' ? 'Masculino' : p.sexo === 'F' ? 'Femenino' : 'No especificado'}</InfoLine>
              </div>
            </div>
            <Tabs className="mx-4 [&>button]:flex-1 [&>button]:justify-center" active={tab} onChange={setTab}
              tabs={['Resumen', 'Estudios', 'Hospitales', 'Accesos al portal', 'Referencias']} />
            <div className="p-4">
              {tab === 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <Mini icon={FileText} tone="blue" v={p.estudios} l="Estudios realizados" />
                    <Mini icon={Building2} tone="green" v={p.hospitales} l="Hospitales visitados" />
                    <Mini icon={Monitor} tone="blue" v={nAccesos} l="Accesos al portal" />
                    <Mini icon={User} tone="purple" v={p.referidores} l="Médicos referidores" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-[#eef2f8] p-2.5">
                      <h4 className="mb-1.5 text-[12.5px] font-bold text-ink">Información de contacto</h4>
                      <div className="space-y-1.5 text-[11px]">
                        <Contact l="Dirección:">{p.dir}</Contact>
                        <Contact l="Correo:">{p.email}</Contact>
                        <Contact l="Teléfono:">{p.tel}</Contact>
                        <Contact l="Contacto de emergencia:">{p.emergencia}</Contact>
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#eef2f8] p-2.5">
                      <h4 className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold text-ink"><FileText size={15} className="text-brand-600" /> Último estudio</h4>
                      {real ? (
                        estudios.cargando ? <p className="text-[11.5px] text-slate-500">Cargando…</p>
                          : estudios.error ? <p className="text-[11.5px] text-red-600">No se pudo cargar: {estudios.error}</p>
                            : ultimo ? (
                              <div className="flex gap-2.5">
                                <img src="/img/crops/ct-cerebro.webp" alt={ultimo.modalidad} className="h-[76px] w-[72px] shrink-0 rounded-md bg-black object-cover" />
                                <div className="min-w-0 flex-1 text-[11px] leading-snug text-slate-600">
                                  <div className="flex items-center justify-between gap-1"><b className="text-[12px] text-ink">{ultimo.numero}</b><Modality m={ultimo.modalidad} className="text-[9.5px]" /></div>
                                  <div>{ultimo.descripcion}</div>
                                  <div>{ultimo.fecha}</div>
                                  <div>{ultimo.hospital}</div>
                                  <div className="mt-1 flex items-center justify-between gap-1">
                                    <EstadoEstudio e={ultimo} />
                                    <button className="dots-btn" aria-label="Acciones"><MoreHorizontal size={15} /></button>
                                  </div>
                                </div>
                              </div>
                            ) : <p className="text-[11.5px] text-slate-500">El paciente aún no tiene estudios registrados.</p>
                      ) : p.estudios > 0 ? (
                        <div className="flex gap-2.5">
                          <img src="/img/crops/ct-cerebro.webp" alt="CT" className="h-[76px] w-[72px] shrink-0 rounded-md bg-black object-cover" />
                          <div className="min-w-0 flex-1 text-[11px] leading-snug text-slate-600">
                            <div className="flex items-center justify-between gap-1"><b className="text-[12px] text-ink">EST-2025-000892</b><Modality m="CT" className="text-[9.5px]" /></div>
                            <div>Tomografía Computarizada</div>
                            <div>{p.ultimo} 10:24 a. m.</div>
                            <div>Hosp. Hugo Mendoza</div>
                            <div className="mt-1 flex items-center justify-between gap-1">
                              <Badge tone="green" icon className="rounded-full">Informe publicado</Badge>
                              <button className="dots-btn" aria-label="Acciones"><MoreHorizontal size={15} /></button>
                            </div>
                          </div>
                        </div>
                      ) : <p className="text-[11.5px] text-slate-500">El paciente aún no tiene estudios registrados.</p>}
                    </div>
                  </div>
                </div>
              )}
              {tab === 1 && (
                <ul className="divide-y divide-[#eef2f8] rounded-lg border border-[#eef2f8]">
                  {real ? (
                    estudios.cargando ? <li className="px-3 py-4 text-center text-[12px] text-slate-500">Cargando…</li>
                      : estudios.error ? <li className="px-3 py-4 text-center text-[12px] text-red-600">No se pudieron cargar los estudios: {estudios.error}</li>
                        : estudios.datos.length === 0 ? <li className="px-3 py-4 text-center text-[12px] text-slate-500">Sin estudios registrados.</li>
                          : estudios.datos.map((e) => (
                            <li key={e.id} className="flex items-center justify-between gap-2 px-3 py-2 text-[12px]">
                              <span className="flex items-center gap-2"><Modality m={e.modalidad} /><span><b className="text-ink">{e.numero}</b><br /><span className="text-[11px] text-slate-500">{e.descripcion} · {e.fecha} · {e.hospital}</span></span></span>
                              <EstadoEstudio e={e} />
                            </li>
                          ))
                  ) : (<>
                    {(p.estudios ? ESTUDIOS_PAC : []).map((e) => (
                      <li key={e.id} className="flex items-center justify-between gap-2 px-3 py-2 text-[12px]">
                        <span className="flex items-center gap-2"><Modality m={e.m} /><span><b className="text-ink">{e.id}</b><br /><span className="text-[11px] text-slate-500">{e.d} · {e.f} · {e.h}</span></span></span>
                        <Badge tone="green" icon className="rounded-full">{e.e}</Badge>
                      </li>
                    ))}
                    {!p.estudios && <li className="px-3 py-4 text-center text-[12px] text-slate-500">Sin estudios registrados.</li>}
                  </>)}
                </ul>
              )}
              {tab === 2 && (
                <ul className="space-y-2">
                  {real ? (
                    estudios.cargando ? <li className="text-[12px] text-slate-500">Cargando…</li>
                      : hospitalesVisitados.length === 0 ? <li className="text-[12px] text-slate-500">Sin hospitales visitados.</li>
                        : hospitalesVisitados.map(([h, n]) => (
                          <li key={h} className="flex items-center gap-2.5 rounded-lg border border-[#eef2f8] px-3 py-2 text-[12px]">
                            <Hospital size={18} className="text-brand-600" /><span className="flex-1 text-ink">{h}</span><span className="text-slate-500">{n} estudio{n === 1 ? '' : 's'}</span>
                          </li>
                        ))
                  ) : ['Hosp. Hugo Mendoza', 'Hosp. Dr. Fco. A. Gonzalvo', 'Hosp. Juan de Herrera', 'Hosp. Jaime Mota'].slice(0, p.hospitales).map((h, i) => (
                    <li key={h} className="flex items-center gap-2.5 rounded-lg border border-[#eef2f8] px-3 py-2 text-[12px]">
                      <Hospital size={18} className="text-brand-600" /><span className="flex-1 text-ink">{h}</span><span className="text-slate-500">{Math.max(1, p.estudios - i * 3)} estudios</span>
                    </li>
                  ))}
                </ul>
              )}
              {tab === 3 && <AccesosTable rows={real ? accesos.datos : ACCESOS} aviso={real ? avisoAccesos(p, accesos) : ''} />}
              {tab === 4 && (
                <ul className="space-y-2">
                  {real ? (
                    referencias.cargando ? <li className="text-[12px] text-slate-500">Cargando…</li>
                      : referencias.error ? <li className="text-[12px] text-red-600">No se pudieron cargar las referencias: {referencias.error}</li>
                        : referencias.datos.length === 0 ? <li className="text-[12px] text-slate-500">Sin referencias registradas.</li>
                          : referencias.datos.map((r) => (
                            <li key={r.id} className="flex items-center gap-2.5 rounded-lg border border-[#eef2f8] px-3 py-2 text-[12px]">
                              <User size={17} className="text-violet-600" /><span className="flex-1 text-ink">{r.nombre}</span><Badge tone="blue">{r.estudios} estudio{r.estudios === 1 ? '' : 's'}</Badge>
                            </li>
                          ))
                  ) : p.referidores ? ['Dr. Luis Fernández Gómez', 'Dra. Ana Torres Mejía', 'Dr. Roberto Castillo'].slice(0, p.referidores).map((r) => (
                    <li key={r} className="flex items-center gap-2.5 rounded-lg border border-[#eef2f8] px-3 py-2 text-[12px]">
                      <User size={17} className="text-violet-600" /><span className="flex-1 text-ink">{r}</span><Badge tone="blue">Referencia activa</Badge>
                    </li>
                  )) : <li className="text-[12px] text-slate-500">Sin referencias registradas.</li>}
                </ul>
              )}
            </div>
          </section>

          <section className="card">
            <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-3.5">
              <h3 className="flex items-center gap-2 text-[14px] font-bold text-ink"><FileText size={17} className="text-brand-600" /> Últimos accesos al portal</h3>
              <button className="btn-outline px-2.5 py-1 text-[12px]" onClick={() => setTab(3)}>Ver todos</button>
            </div>
            <div className="px-2 pb-2"><AccesosTable rows={real ? accesos.datos : ACCESOS} aviso={real ? avisoAccesos(p, accesos) : ''} /></div>
          </section>
          </>)}
        </div>
      </div>
    </>
  )
}

/** Mensaje a mostrar en lugar de la tabla de accesos (vacío = mostrar filas) */
function avisoAccesos(p: Pac, a: { cargando: boolean; error: string; datos: Acceso[] }) {
  if (!p.userId) return 'El paciente no tiene cuenta en el portal.'
  if (a.cargando) return 'Cargando…'
  if (a.error) return `No se pudieron cargar los accesos: ${a.error}`
  if (!a.datos.length) return 'El paciente aún no ha accedido al portal.'
  return ''
}

function EstadoEstudio({ e }: { e: EstudioResumen }) {
  return e.informePublicado
    ? <Badge tone="green" icon className="rounded-full">Informe publicado</Badge>
    : <Badge tone="blue" className="rounded-full">{e.estado}</Badge>
}

function AccesosTable({ rows, aviso }: { rows: (Acceso & { a?: string })[]; aviso: string }) {
  return (
    <Table>
      <thead><tr><th className="th">Fecha / Hora</th><th className="th">Dispositivo</th><th className="th">Navegador / SO</th><th className="th">IP</th><th className="th">Acción</th></tr></thead>
      <tbody>
        {aviso ? <tr><td colSpan={5} className="td py-4 text-center text-[11.5px] text-slate-500">{aviso}</td></tr> : rows.map((a, i) => (
          <tr key={`${a.f}-${i}`} className="tr">
            <td className="td whitespace-nowrap text-[11.5px]">{a.f}</td>
            <td className="td text-[11.5px]">{a.d}</td>
            <td className="td whitespace-nowrap text-[11.5px]">{a.nav}</td>
            <td className="td text-[11.5px]">{a.ip}</td>
            <td className="td whitespace-nowrap text-[11.5px]">{a.a ? <button className="text-brand-600 hover:underline">{a.a}</button> : 'Inicio de sesión'}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

function InfoLine({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return <div className="flex items-center gap-2"><Icon size={14} className="shrink-0 text-slate-500" />{children}</div>
}

function Contact({ l, children }: { l: string; children: ReactNode }) {
  return <div className="flex gap-2"><span className="shrink-0 text-ink">{l}</span><span className="min-w-0 text-slate-600">{children}</span></div>
}

function Mini({ icon, tone, v, l }: { icon: LucideIcon; tone: Tone; v: number; l: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#eef2f8] p-2">
      <IconCircle icon={icon} tone={tone} size="md" />
      <div className="min-w-0 leading-tight">
        <div className="text-[17px] font-bold text-ink">{v}</div>
        <div className="text-[10.5px] text-slate-600">{l}</div>
      </div>
    </div>
  )
}
