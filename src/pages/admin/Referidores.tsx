import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Building2, Calendar, ChevronDown, Clock, CreditCard, FileText, FilterX, History, Hospital, IdCard, Mail,
  MapPin, MoreHorizontal, Phone, Search, Stethoscope, Tag, Upload, UserRound, Users, type LucideIcon,
} from 'lucide-react'
import { Badge, Bar, Checkbox, IconCircle, Kpi, PageHeader, Pagination, Select, Table, Tabs, UserSilhouette, clsx, type Tone } from '../../components/ui'
import {
  cambiarEstadoMedico, fetchAccesos, fetchReferenciasMedico, fetchReferidores, num, pct, useDatos,
  type Acceso, type ReferenciaReal, type ReferidorReal,
} from '../../lib/admin-data'
import { supabase } from '../../lib/supabase'

/* ---------------- Tipos ---------------- */
type Medico = ReferidorReal

/* ---------------- Datos mock (sin Supabase) ---------------- */
type MedicoMock = Omit<Medico, 'id' | 'userId' | 'estado' | 'especialidades'>

const MEDICOS_MOCK: MedicoMock[] = [
  { n: 1, nombre: 'Dr. Luis Fernández Gómez', cedula: '001-1234567-8', esp: 'Medicina Interna', refs: 482, ultima: '15/03/2025', activo: true, codigo: 'MR-000156', tel: '809-555-1234', email: 'luis.fernandez@clinica.com', centro: 'Centro Médico Real', dir: 'Av. Tiradentes #123, Santo Domingo', registrado: '12/01/2022 (3 años, 2 meses)', pacientes: 376, hospitales: 24 },
  { n: 2, nombre: 'Dra. Ana Torres Mejía', cedula: '001-2345678-9', esp: 'Pediatría', refs: 416, ultima: '15/03/2025', activo: true, codigo: 'MR-000189', tel: '829-555-2211', email: 'ana.torres@clinica.com', centro: 'Hospital Infantil Dr. Robert Reid Cabral', dir: 'Av. Abraham Lincoln #45, Santo Domingo', registrado: '05/03/2022 (3 años)', pacientes: 341, hospitales: 18 },
  { n: 3, nombre: 'Dr. Roberto Castillo', cedula: '402-1234567-1', esp: 'Medicina Familiar', refs: 398, ultima: '14/03/2025', activo: true, codigo: 'MR-000204', tel: '809-555-3322', email: 'roberto.castillo@clinica.com', centro: 'Hospital Regional Universitario', dir: 'C/ del Sol #210, Santiago', registrado: '20/06/2022 (2 años, 9 meses)', pacientes: 322, hospitales: 15 },
  { n: 4, nombre: 'Dra. María López Díaz', cedula: '001-3456789-0', esp: 'Ginecología', refs: 356, ultima: '14/03/2025', activo: true, codigo: 'MR-000231', tel: '829-555-4433', email: 'maria.lopez@clinica.com', centro: 'Hospital Materno Infantil San Lorenzo', dir: 'Av. Charles de Gaulle #9, Santo Domingo Este', registrado: '11/08/2022 (2 años, 7 meses)', pacientes: 290, hospitales: 12 },
  { n: 5, nombre: 'Dr. Carlos Jiménez', cedula: '001-4567890-1', esp: 'Ortopedia', refs: 332, ultima: '14/03/2025', activo: true, codigo: 'MR-000247', tel: '809-555-5544', email: 'carlos.jimenez@clinica.com', centro: 'Hospital Dr. Ney Arias Lora', dir: 'Av. Hermanas Mirabal #77, Santo Domingo Norte', registrado: '02/09/2022 (2 años, 6 meses)', pacientes: 271, hospitales: 11 },
  { n: 6, nombre: 'Dr. Pedro Vásquez', cedula: '223-4567890-5', esp: 'Medicina General', refs: 298, ultima: '13/03/2025', activo: true, codigo: 'MR-000262', tel: '829-555-6655', email: 'pedro.vasquez@clinica.com', centro: 'Hospital Municipal Boca Chica', dir: 'C/ Duarte #12, Boca Chica', registrado: '15/10/2022 (2 años, 5 meses)', pacientes: 244, hospitales: 9 },
  { n: 7, nombre: 'Dra. Rosa Martínez', cedula: '001-5678901-2', esp: 'Medicina Interna', refs: 276, ultima: '13/03/2025', activo: true, codigo: 'MR-000285', tel: '809-555-7766', email: 'rosa.martinez@clinica.com', centro: 'Hospital Jaime Mota', dir: 'C/ Mella #34, Barahona', registrado: '23/11/2022 (2 años, 4 meses)', pacientes: 230, hospitales: 8 },
  { n: 8, nombre: 'Dr. Miguel Santos', cedula: '001-6789012-3', esp: 'Cardiología', refs: 251, ultima: '12/03/2025', activo: true, codigo: 'MR-000301', tel: '829-555-8877', email: 'miguel.santos@clinica.com', centro: 'Centro Cardio-Neuro Oftalmológico', dir: 'Av. Núñez de Cáceres #5, Santo Domingo', registrado: '08/01/2023 (2 años, 2 meses)', pacientes: 209, hospitales: 7 },
  { n: 9, nombre: 'Dra. Laura Peña', cedula: '402-7654321-0', esp: 'Pediatría', refs: 240, ultima: '12/03/2025', activo: false, codigo: 'MR-000318', tel: '809-555-9988', email: 'laura.pena@clinica.com', centro: 'Hospital Regional Antonio Musa', dir: 'Av. Circunvalación #3, San Pedro de Macorís', registrado: '19/02/2023 (2 años, 1 mes)', pacientes: 198, hospitales: 6 },
  { n: 10, nombre: 'Dr. Tomás Núñez', cedula: '001-8901234-5', esp: 'Urología', refs: 218, ultima: '11/03/2025', activo: true, codigo: 'MR-000334', tel: '829-555-1100', email: 'tomas.nunez@clinica.com', centro: 'Hospital Dr. Francisco Moscoso Puello', dir: 'Av. Nicolás de Ovando #2, Santo Domingo', registrado: '04/04/2023 (1 año, 11 meses)', pacientes: 181, hospitales: 6 },
]
const MEDICOS: Medico[] = MEDICOS_MOCK.map((m) => ({
  ...m, id: String(m.n), userId: null, estado: m.activo ? 'Aprobado' : 'Suspendido', especialidades: [m.esp],
}))

const ACCESOS: Acceso[] = [
  { f: '14/03/2025 08:21 a. m.', d: 'PC / Windows', nav: '—', ip: '201.200.15.44' },
  { f: '10/03/2025 07:12 p. m.', d: 'Celular / Android', nav: '—', ip: '186.21.45.78' },
  { f: '05/03/2025 11:43 a. m.', d: 'Tablet / iPadOS', nav: '—', ip: '190.118.22.11' },
]

const REFERENCIAS: ReferenciaReal[] = [
  { f: '15/03/2025', p: 'HN-00012345', e: 'Tomografía Computarizada', h: 'Hosp. Hugo Mendoza', s: 'Informado' },
  { f: '14/03/2025', p: 'HN-00012334', e: 'Radiografía de Tórax', h: 'Hosp. Dr. Fco. A. Gonzalvo', s: 'En lectura' },
  { f: '14/03/2025', p: 'HN-00012321', e: 'Ecografía Abdominal', h: 'Hosp. Juan de Herrera', s: 'Completado' },
  { f: '13/03/2025', p: 'HN-00012298', e: 'Resonancia Magnética', h: 'Hosp. Municipal Constanza', s: 'En proceso' },
  { f: '12/03/2025', p: 'HN-00012287', e: 'Tomografía Computarizada', h: 'Centro Médico Real', s: 'Informado' },
]
const HOSPITALES_MOCK = ['Centro Médico Real', 'Hosp. Hugo Mendoza', 'Hosp. Juan de Herrera', 'Hosp. Municipal Constanza']

const tonoReferencia = (s: string): Tone => ({
  Informado: 'green', Completado: 'green', 'En lectura': 'orange', 'En revisión': 'purple', Cancelado: 'red',
} as Record<string, Tone>)[s] ?? 'blue'

/** Etiqueta del estado: Activo = aprobado; Pendiente; el resto Inactivo */
const etiqueta = (m: Medico) => (m.activo ? 'Activo' : m.estado === 'Pendiente' ? 'Pendiente' : 'Inactivo')
const tonoEstado = (m: Medico): Tone => (m.activo ? 'green' : m.estado === 'Pendiente' ? 'orange' : 'red')

/* ---------------- Consultas propias de la página ---------------- */
type HospRefs = { porMedico: Record<string, Record<string, number>>; totalHospitales: number }

/** Hospitales donde cada médico ha referido estudios (+ total de hospitales de la red) */
async function fetchHospitalesReferencias(): Promise<HospRefs> {
  const [est, hosp] = await Promise.all([
    supabase.from('estudios').select('medico_referidor_id, hospitales(nombre)').not('medico_referidor_id', 'is', null),
    supabase.from('hospitales').select('id', { count: 'exact', head: true }),
  ])
  if (est.error) throw new Error(est.error.message)
  if (hosp.error) throw new Error(hosp.error.message)
  const porMedico: HospRefs['porMedico'] = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const e of (est.data ?? []) as any[]) {
    const h = (Array.isArray(e.hospitales) ? e.hospitales[0]?.nombre : e.hospitales?.nombre) ?? '—'
    const m = (porMedico[e.medico_referidor_id] ??= {})
    m[h] = (m[h] ?? 0) + 1
  }
  return { porMedico, totalHospitales: hosp.count ?? 0 }
}

/** dd/mm/aaaa → Date (las fechas ya vienen formateadas por la capa de datos) */
const parseFecha = (s: string) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s)
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null
}
const PERIODOS: Record<string, number> = { 'Últimos 30 días': 30, 'Últimos 6 meses': 183, 'Último año': 365 }
const POR_PAGINA = 10

/** Carga asíncrona ligada a una clave (médico seleccionado) */
function useCarga<T>(fn: (() => Promise<T>) | null, inicial: T, clave: string) {
  const [estado, setEstado] = useState<{ clave: string; datos: T; cargando: boolean; error: string }>({ clave, datos: inicial, cargando: Boolean(fn), error: '' })
  useEffect(() => {
    if (!fn) return
    let vivo = true
    setEstado({ clave, datos: inicial, cargando: true, error: '' })
    fn().then((datos) => { if (vivo) setEstado({ clave, datos, cargando: false, error: '' }) })
      .catch((e: unknown) => { if (vivo) setEstado({ clave, datos: inicial, cargando: false, error: (e as Error).message ?? String(e) }) })
    return () => { vivo = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
  return estado
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
export default function Referidores() {
  const { datos, cargando, error, recargar, real } = useDatos(fetchReferidores, MEDICOS)
  const hr = useDatos(fetchHospitalesReferencias, { porMedico: {}, totalHospitales: 0 } as HospRefs)
  const [q, setQ] = useState('')
  const [fEsp, setFEsp] = useState('Todas las especialidades')
  const [fHosp, setFHosp] = useState('Todos los hospitales')
  const [fEstado, setFEstado] = useState('Todos los estados')
  const [fPeriodo, setFPeriodo] = useState('Todo el historial')
  const [fk, setFk] = useState(0)
  const [page, setPage] = useState(1)
  const [selId, setSelId] = useState<string | null>(real ? null : '2')
  const [tab, setTab] = useState(0)
  const [checked, setChecked] = useState<string[]>([])
  const [procesando, setProcesando] = useState(false)
  const [errAccion, setErrAccion] = useState('')
  const [ahora] = useState(() => Date.now())

  const optEsp = ['Todas las especialidades', ...Array.from(new Set(datos.flatMap((x) => x.especialidades))).sort()]
  const optHosp = ['Todos los hospitales', ...(real ? Array.from(new Set(Object.values(hr.datos.porMedico).flatMap((m) => Object.keys(m)))).sort() : HOSPITALES_MOCK)]

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    const dias = PERIODOS[fPeriodo]
    const desde = dias ? ahora - dias * 86400000 : null
    return datos.filter((m) => {
      const reg = desde ? parseFecha(m.registrado) : null
      return (!t || `${m.nombre} ${m.cedula} ${m.esp} ${m.codigo}`.toLowerCase().includes(t))
        && (fEsp === 'Todas las especialidades' || m.especialidades.includes(fEsp))
        && (fHosp === 'Todos los hospitales' || !real || Object.keys(hr.datos.porMedico[m.id] ?? {}).includes(fHosp))
        && (fEstado === 'Todos los estados' || etiqueta(m) === fEstado)
        && (!desde || (reg !== null && reg.getTime() >= desde))
    })
  }, [datos, q, fEsp, fHosp, fEstado, fPeriodo, real, hr.datos, ahora])

  const totalPages = Math.max(1, Math.ceil(list.length / POR_PAGINA))
  const pagina = Math.min(page, totalPages)
  const filas = list.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const m: Medico | null = datos.find((x) => x.id === selId) ?? filas[0] ?? datos[0] ?? null
  const allChecked = filas.length > 0 && filas.every((x) => checked.includes(x.id))

  const refs = useCarga<ReferenciaReal[]>(real && m ? () => fetchReferenciasMedico(m.id) : null, real ? [] : REFERENCIAS, `ref-${m?.id ?? ''}`)
  const accesos = useCarga<Acceso[]>(real && m ? () => fetchAccesos(m.userId) : null, real ? [] : ACCESOS, `acc-${m?.id ?? ''}`)

  const filtro = (fn: (v: string) => void) => (v: string) => { fn(v); setPage(1) }
  const limpiar = () => {
    setQ(''); setFEsp('Todas las especialidades'); setFHosp('Todos los hospitales'); setFEstado('Todos los estados'); setFPeriodo('Todo el historial')
    setPage(1); setFk(fk + 1)
  }

  // KPIs reales
  const totalRefs = datos.reduce((s, x) => s + x.refs, 0)
  const hospConRefs = new Set(Object.values(hr.datos.porMedico).flatMap((x) => Object.keys(x))).size
  const especialidades = new Set(datos.flatMap((x) => x.especialidades)).size
  const hace30 = ahora - 30 * 86400000
  const nuevos = datos.filter((x) => (parseFecha(x.registrado)?.getTime() ?? 0) >= hace30).length
  const kv = (n: number, c = cargando) => (c ? '—' : num(n))

  const puedeCambiar = real && m && (m.estado === 'Aprobado' || m.estado === 'Suspendido')
  const cambiarEstado = async () => {
    if (!m) return
    setProcesando(true); setErrAccion('')
    try { await cambiarEstadoMedico(m.id, m.activo ? 'suspendido' : 'aprobado'); await recargar() }
    catch (e) { setErrAccion((e as Error).message ?? String(e)) }
    finally { setProcesando(false) }
  }
  const seleccionar = (id: string) => { setSelId(id); setTab(0); setErrAccion('') }

  const mensajeTabla = cargando ? 'Cargando médicos referidores…'
    : error ? null
    : datos.length === 0 ? 'Aún no hay médicos referidores registrados'
    : list.length === 0 ? 'No se encontraron médicos referidores.' : null

  // Hospitales del médico seleccionado (real: desde los estudios; mock: desde las referencias de ejemplo)
  const hospitalesSel: [string, number][] = m
    ? real ? Object.entries(hr.datos.porMedico[m.id] ?? {}).sort((a, b) => b[1] - a[1])
      : Array.from(new Set(REFERENCIAS.map((r) => r.h))).map((h, i) => [h, Math.round(m.refs / (i + 3))])
    : []

  return (
    <>
      <PageHeader icon={Users} title="Médicos referidores"
        subtitle="Registro de médicos referidores, actividad de referencias, especialidades y trazabilidad" actions={<ExportButton />} />

      {real ? (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <Kpi icon={Users} tone="blue" value={kv(datos.length)} label="Médicos referidores" sub="registrados en la red" />
          <Kpi icon={FileText} tone="blue" value={kv(totalRefs)} label="Referencias realizadas" sub="estudios referidos" />
          <Kpi icon={Building2} tone="orange" value={kv(hospConRefs, hr.cargando)} label="Hospitales con referencias"
            sub={hr.error ? 'No disponible' : `${pct(hospConRefs, hr.datos.totalHospitales)} del total`} />
          <Kpi icon={Stethoscope} tone="green" value={kv(especialidades)} label="Especialidades" sub="registradas" />
          <Kpi icon={Clock} tone="blue" value={kv(nuevos)} label="Nuevos médicos (30 días)" sub="registrados recientemente" />
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <Kpi icon={Users} tone="blue" value="3,842" label="Médicos referidores" sub="7% vs. mes anterior" trend="up" />
          <Kpi icon={FileText} tone="blue" value="18,256" label="Referencias realizadas" sub="14% vs. mes anterior" trend="down" trendTone="good" />
          <Kpi icon={Building2} tone="orange" value="126" label="Hospitales con referencias" sub="65% del total" />
          <Kpi icon={Stethoscope} tone="green" value="28" label="Especialidades" sub="registradas" />
          <Kpi icon={Clock} tone="blue" value="412" label="Nuevos médicos (hoy)" sub="9% vs. ayer" trend="up" />
        </div>
      )}

      <div key={fk} className="card mb-4 grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.6fr_1.05fr_1fr_0.9fr_0.85fr_0.7fr]">
        <label className="relative flex items-center">
          <Search size={16} className="pointer-events-none absolute left-3 text-slate-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} className="input pl-9" placeholder="Buscar por nombre, cédula, especialidad, código..." />
        </label>
        <Select icon={UserRound} value={fEsp} options={optEsp} onChange={filtro(setFEsp)} />
        <Select icon={Building2} value={fHosp} options={optHosp} onChange={filtro(setFHosp)} />
        <Select icon={Tag} value={fEstado} options={['Todos los estados', 'Activo', 'Pendiente', 'Inactivo']} onChange={filtro(setFEstado)} />
        <Select icon={Calendar} value={fPeriodo} options={['Todo el historial', 'Últimos 30 días', 'Últimos 6 meses', 'Último año']} onChange={filtro(setFPeriodo)} />
        <button onClick={limpiar} className="btn-outline"><FilterX size={16} /> Limpiar</button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="card min-w-0 xl:col-span-7">
          <div className="flex items-center gap-3 px-4 pb-2 pt-3.5">
            <FileText size={24} className="text-brand-600" />
            <h3 className="text-[16px] font-bold text-ink">Listado de médicos referidores</h3>
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11.5px] text-brand-700">{real ? `${num(list.length)} registro${list.length === 1 ? '' : 's'}` : '3,842 registros'}</span>
          </div>
          <Table>
            <thead>
              <tr className="bg-[#f6f9fe]">
                <th className="th pl-4"><Checkbox checked={allChecked} onChange={(v) => setChecked(v ? filas.map((x) => x.id) : [])} /></th>
                <th className="th">#</th><th className="th">Nombre completo</th><th className="th">Cédula</th><th className="th">Especialidades</th>
                <th className="th text-center">Referencias</th><th className="th">Última referencia</th><th className="th">Estado</th><th className="th pr-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {error && !cargando && (
                <tr><td colSpan={9} className="td py-8 text-center">
                  <span className="text-red-600">No se pudieron cargar los médicos referidores: {error}</span>{' '}
                  <button onClick={recargar} className="font-semibold text-brand-600 hover:underline">Reintentar</button>
                </td></tr>
              )}
              {mensajeTabla && <tr><td colSpan={9} className="td py-8 text-center">{mensajeTabla}</td></tr>}
              {!cargando && !error && filas.map((x, i) => (
                <tr key={x.id} onClick={() => seleccionar(x.id)} className={clsx('tr h-[44px] cursor-pointer', x.id === m?.id && '!bg-brand-50/70')}>
                  <td className="td pl-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={checked.includes(x.id)} onChange={() => setChecked(checked.includes(x.id) ? checked.filter((h) => h !== x.id) : [...checked, x.id])} />
                  </td>
                  <td className="td text-ink">{real ? (pagina - 1) * POR_PAGINA + i + 1 : x.n}</td>
                  <td className="td whitespace-nowrap text-ink">{x.nombre}</td>
                  <td className="td whitespace-nowrap">{x.cedula}</td>
                  <td className="td whitespace-nowrap">{x.esp}</td>
                  <td className="td text-center">{num(x.refs)}</td>
                  <td className="td">{x.ultima}</td>
                  <td className="td"><Badge tone={tonoEstado(x)} icon={x.activo} className="rounded-full">{etiqueta(x)}</Badge></td>
                  <td className="td pr-4 text-center" onClick={(e) => e.stopPropagation()}><button className="dots-btn" aria-label="Acciones"><MoreHorizontal size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </Table>
          {real ? (
            <Pagination
              text={list.length ? `Mostrando ${num((pagina - 1) * POR_PAGINA + 1)} a ${num((pagina - 1) * POR_PAGINA + filas.length)} de ${num(list.length)} médicos` : 'Mostrando 0 de 0 médicos'}
              page={pagina} onPage={setPage} totalPages={totalPages} />
          ) : (
            <Pagination text="Mostrando 1 a 10 de 3,842 médicos" pages={[1, 2, 3, 4, 5]} last={385} />
          )}
        </section>

        <div className="min-w-0 space-y-4 xl:col-span-5">
          <section className="card">
            <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-3.5">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-ink"><UserRound size={19} className="text-brand-600" /> Detalle del médico referidor</h3>
              <div className="flex items-center gap-2">
                {puedeCambiar && (
                  <button onClick={cambiarEstado} disabled={procesando}
                    className={clsx('btn-outline px-2.5 py-1 text-[12px] disabled:opacity-60', m.activo ? 'text-red-600' : 'text-emerald-700')}>
                    {procesando ? 'Guardando…' : m.activo ? 'Suspender' : 'Reactivar'}
                  </button>
                )}
                <button className="btn-outline px-2.5 py-1 text-[12px]"><History size={14} /> Ver historial completo</button>
              </div>
            </div>
            {errAccion && <p className="mx-4 mt-1 rounded-md bg-red-50 px-3 py-1.5 text-[12px] text-red-600">{errAccion}</p>}
            {!m ? (
              <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                <UserSilhouette size={80} />
                <p className="text-[13px] text-slate-500">{cargando ? 'Cargando médicos referidores…' : error ? 'No se pudo cargar el detalle.' : 'Aún no hay médicos referidores registrados'}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start gap-4 px-4 py-3">
                  <UserSilhouette size={100} />
                  <div className="min-w-0 flex-1 space-y-0.5 text-[12.5px] text-ink/90">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[17px] font-bold text-ink">{m.nombre}</div>
                      <Badge tone={tonoEstado(m)} icon={m.activo} className="rounded-full px-3 py-1 text-[12.5px]">{etiqueta(m)}</Badge>
                    </div>
                    <Line icon={CreditCard}>Cédula: {m.cedula}</Line>
                    <Line icon={IdCard}>Código: {m.codigo}</Line>
                    <Line icon={Stethoscope}>Especialidades: {m.esp}</Line>
                    <Line icon={Phone}>Teléfono: {m.tel}</Line>
                    <Line icon={Mail}>Correo: {m.email}</Line>
                    <Line icon={Hospital}>Centro de trabajo: {m.centro}</Line>
                    <Line icon={MapPin}>Dirección: {m.dir}</Line>
                    <Line icon={Calendar}>Registrado: {m.registrado}</Line>
                  </div>
                </div>
                <Tabs className="mx-4 [&>button]:flex-1 [&>button]:justify-center" active={tab} onChange={setTab}
                  tabs={['Resumen', 'Referencias', 'Pacientes', 'Hospitales', 'Actividad', 'Notas']} />
                <div className="p-4">
                  {tab === 0 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        <Mini icon={FileText} tone="blue" v={m.refs} l="Referencias realizadas" />
                        <Mini icon={Users} tone="purple" v={m.pacientes} l="Pacientes referidos" />
                        <Mini icon={Building2} tone="green" v={m.hospitales} l="Hospitales diferentes" />
                        <Mini icon={Calendar} tone="blue" v={m.ultima} l="Última referencia" />
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[0.8fr_1.2fr]">
                        <div className="rounded-lg border border-[#eef2f8] p-2.5">
                          <h4 className="mb-2 text-[12.5px] font-bold text-ink">Especialidades</h4>
                          {m.especialidades.length === 0 && <div className="border-t border-[#eef2f8] pt-2 text-[11.5px] text-slate-500">Sin especialidades registradas</div>}
                          {m.especialidades.map((e) => (
                            <div key={e}>
                              <div className="border-t border-[#eef2f8] pt-2 text-[11.5px] text-slate-600">{e}</div>
                              <div className="mt-2 flex items-center gap-2"><Bar value={100 / m.especialidades.length} height={9} className="rounded-full" /><span className="text-[11px] text-slate-600">{Math.round(100 / m.especialidades.length)}%</span></div>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-lg border border-[#eef2f8] p-2.5">
                          <div className="mb-1 flex items-center justify-between">
                            <h4 className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink"><FileText size={15} className="text-brand-600" /> Últimos accesos al portal</h4>
                            <button className="btn-outline px-2 py-0.5 text-[11.5px]">Ver todos</button>
                          </div>
                          <Table>
                            <thead><tr><th className="th px-1.5">Fecha / Hora</th><th className="th px-1.5">Dispositivo</th><th className="th px-1.5">IP</th></tr></thead>
                            <tbody>
                              <EstadoFilas carga={accesos} cols={3} vacio="Sin accesos registrados al portal" />
                              {!accesos.cargando && accesos.datos.map((a, i) => (
                                <tr key={`${a.f}-${i}`} className="tr">
                                  <td className="td whitespace-nowrap px-1.5 py-1 text-[11px]">{a.f}</td>
                                  <td className="td whitespace-nowrap px-1.5 py-1 text-[11px]">{a.d}</td>
                                  <td className="td px-1.5 py-1 text-[11px]">{a.ip}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}
                  {tab === 1 && <RefTable carga={refs} />}
                  {tab === 2 && (
                    <ul className="divide-y divide-[#eef2f8] rounded-lg border border-[#eef2f8] text-[12px]">
                      {refs.cargando && <li className="px-3 py-4 text-center text-slate-500">Cargando…</li>}
                      {!refs.cargando && refs.datos.length === 0 && <li className="px-3 py-4 text-center text-slate-500">Aún no ha referido pacientes</li>}
                      {!refs.cargando && Array.from(new Map(refs.datos.map((r) => [r.p, r])).values()).map((r) => (
                        <li key={r.p} className="flex items-center justify-between px-3 py-2"><span className="text-brand-700">{r.p}</span><span className="text-slate-500">Última referencia: {r.f}</span></li>
                      ))}
                    </ul>
                  )}
                  {tab === 3 && (
                    <ul className="space-y-2 text-[12px]">
                      {hospitalesSel.length === 0 && <li className="rounded-lg border border-dashed border-[#d7e1f2] px-3 py-4 text-center text-slate-500">{hr.cargando ? 'Cargando…' : 'Aún no tiene referencias en hospitales'}</li>}
                      {hospitalesSel.map(([h, c]) => (
                        <li key={h} className="flex items-center gap-2.5 rounded-lg border border-[#eef2f8] px-3 py-2">
                          <Hospital size={17} className="text-brand-600" /><span className="flex-1 text-ink">{h}</span><span className="text-slate-500">{c} referencia{c === 1 ? '' : 's'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {tab === 4 && (
                    refs.datos.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-[#d7e1f2] px-3 py-4 text-center text-[12px] text-slate-500">{refs.cargando ? 'Cargando…' : 'Sin actividad de referencias'}</p>
                    ) : (
                      <ol className="relative ml-2 space-y-3 border-l-2 border-brand-100 pl-4 text-[12px]">
                        {refs.datos.map((r, i) => (
                          <li key={`${r.p}-${i}`} className="relative">
                            <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500 shadow" />
                            <div className="text-ink">Referencia de {r.e} para {r.p}</div><div className="text-[11px] text-slate-500">{r.f} · {r.h}</div>
                          </li>
                        ))}
                      </ol>
                    )
                  )}
                  {tab === 5 && (
                    <div>
                      <textarea className="input h-24 resize-none" placeholder="Agregar una nota sobre este médico referidor..." />
                      <div className="mt-2 text-right"><button className="btn-primary py-1.5 text-[12px]">Guardar nota</button></div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          <section className="card">
            <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-3.5">
              <h3 className="flex items-center gap-2 text-[14px] font-bold text-ink"><FileText size={17} className="text-brand-600" /> Últimas referencias realizadas</h3>
              <button className="btn-outline px-2.5 py-1 text-[12px]" onClick={() => setTab(1)}>Ver todas</button>
            </div>
            <div className="px-2 pb-2"><RefTable carga={m ? refs : { datos: [], cargando: false, error: '' }} /></div>
          </section>
        </div>
      </div>
    </>
  )
}

type Carga<T> = { datos: T; cargando: boolean; error: string }

/** Filas de estado (cargando / error / vacío) dentro de una tabla */
function EstadoFilas<T>({ carga, cols, vacio }: { carga: Carga<T[]>; cols: number; vacio: string }) {
  const msg = carga.cargando ? 'Cargando…' : carga.error ? carga.error : carga.datos.length === 0 ? vacio : ''
  if (!msg) return null
  return <tr><td colSpan={cols} className={clsx('td py-3 text-center text-[11.5px]', carga.error && !carga.cargando ? 'text-red-600' : 'text-slate-500')}>{msg}</td></tr>
}

function RefTable({ carga }: { carga: Carga<ReferenciaReal[]> }) {
  return (
    <Table className="[&_.td]:px-2 [&_.th]:px-2">
      <thead><tr><th className="th">Fecha</th><th className="th">Paciente (HN)</th><th className="th">Estudio</th><th className="th">Hospital</th><th className="th">Estado</th></tr></thead>
      <tbody>
        <EstadoFilas carga={carga} cols={5} vacio="Aún no hay referencias realizadas" />
        {!carga.cargando && carga.datos.map((r, i) => {
          const tone = tonoReferencia(r.s)
          return (
            <tr key={`${r.p}-${i}`} className="tr">
              <td className="td text-[11.5px]">{r.f}</td>
              <td className="td text-[11.5px]">{r.p}</td>
              <td className="td whitespace-nowrap text-[11.5px]">{r.e}</td>
              <td className="td whitespace-nowrap text-[11.5px]">{r.h}</td>
              <td className="td"><Badge tone={tone} icon={tone === 'green'} className="rounded-full">{r.s}</Badge></td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}

function Line({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return <div className="flex items-center gap-2"><Icon size={14} className="shrink-0 text-slate-500" /><span className="min-w-0">{children}</span></div>
}

function Mini({ icon, tone, v, l }: { icon: LucideIcon; tone: Tone; v: ReactNode; l: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#eef2f8] p-2">
      <IconCircle icon={icon} tone={tone} size="sm" />
      <div className="min-w-0 leading-tight">
        <div className={clsx('whitespace-nowrap font-bold text-ink', typeof v === 'string' ? 'text-[13px]' : 'text-[15px]')}>{v}</div>
        <div className="text-[10.5px] text-slate-600">{l}</div>
      </div>
    </div>
  )
}
