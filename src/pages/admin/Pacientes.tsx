import { useMemo, useState, type ReactNode } from 'react'
import {
  Building2, Calendar, ChevronDown, Clock, CreditCard, FileText, Filter, History, Hospital,
  Monitor, MoreHorizontal, Search, Tag, Upload, User, UserRound, Users, type LucideIcon,
} from 'lucide-react'
import { Badge, Checkbox, IconCircle, Kpi, Modality, PageHeader, Pagination, Select, Table, Tabs, UserSilhouette, clsx, type Tone } from '../../components/ui'

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
  const [q, setQ] = useState('')
  const [applied, setApplied] = useState('')
  const [fEstado, setFEstado] = useState('Todos los estados')
  const [sel, setSel] = useState(PACIENTES[0].hn)
  const [tab, setTab] = useState(0)
  const [checked, setChecked] = useState<string[]>([])

  const list = useMemo(() => PACIENTES.filter((p) => {
    const t = `${p.hn} ${p.cedula} ${p.nombre} ${p.tel}`.toLowerCase()
    return (!applied || t.includes(applied.toLowerCase())) && (fEstado === 'Todos los estados' || p.estado === fEstado)
  }), [applied, fEstado])

  const p = PACIENTES.find((x) => x.hn === sel) ?? PACIENTES[0]
  const allChecked = list.length > 0 && list.every((x) => checked.includes(x.hn))

  return (
    <>
      <PageHeader icon={Users} title="Pacientes"
        subtitle="Registro nacional de pacientes, historial de estudios, acceso al portal y trazabilidad de su actividad" actions={<ExportButton />} />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <Kpi icon={User} tone="blue" value="24,893" label="Pacientes registrados" sub="8% vs. mes anterior" trend="up" />
        <Kpi icon={FileText} tone="blue" value="58,214" label="Estudios realizados" sub="12% vs. mes anterior" trend="down" trendTone="good" />
        <Kpi icon={UserRound} tone="orange" value="18,642" label="Pacientes únicos" sub="75% del total" />
        <Kpi icon={Monitor} tone="green" value="6,381" label="Han accedido al portal" sub="25.6% del total" />
        <Kpi icon={Clock} tone="blue" value="923" label="Pacientes nuevos (hoy)" sub="14% vs. ayer" trend="up" />
      </div>

      <form className="card mb-4 grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.6fr_1.1fr_1fr_1fr_0.75fr_1.1fr]"
        onSubmit={(e) => { e.preventDefault(); setApplied(q) }}>
        <label className="relative flex items-center">
          <Search size={16} className="pointer-events-none absolute left-3 text-slate-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); if (!e.target.value) setApplied('') }} className="input pl-9" placeholder="Buscar por HN, cédula, nombre, teléfono..." />
        </label>
        <Select icon={Building2} options={['Todos los hospitales', 'Hosp. Hugo Mendoza', 'Hosp. Dr. Fco. A. Gonzalvo', 'Hosp. Juan de Herrera', 'Hosp. Jaime Mota']} />
        <Select icon={Tag} options={['Todos los estados', 'Con estudios', 'Sin estudios']} onChange={setFEstado} />
        <Select icon={Calendar} options={['Últimos 6 meses', 'Últimos 30 días', 'Último año', 'Todo el historial']} />
        <button type="button" className="btn-outline"><Filter size={16} /> Más filtros</button>
        <button type="submit" className="btn-primary"><Search size={17} /> Buscar</button>
      </form>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="card min-w-0 xl:col-span-7">
          <div className="flex items-center gap-3 px-4 pb-2 pt-3.5">
            <FileText size={24} className="text-brand-600" />
            <h3 className="text-[16px] font-bold text-ink">Listado de pacientes</h3>
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11.5px] text-brand-700">24,893 registros</span>
          </div>
          <Table className="[&_.td]:px-2 [&_.th]:px-2">
            <thead>
              <tr className="bg-[#f6f9fe]">
                <th className="th !pl-4"><Checkbox checked={allChecked} onChange={(v) => setChecked(v ? list.map((x) => x.hn) : [])} /></th>
                <th className="th">#</th><th className="th">Código HN</th><th className="th">Cédula</th><th className="th">Nombre completo</th>
                <th className="th">Teléfono</th><th className="th">Edad</th><th className="th">Sexo</th><th className="th">Último estudio</th>
                <th className="th">Estado</th><th className="th pr-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.hn} onClick={() => { setSel(x.hn); setTab(0) }} className={clsx('tr h-[44px] cursor-pointer', x.hn === sel && '!bg-brand-50/70')}>
                  <td className="td !pl-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={checked.includes(x.hn)} onChange={() => setChecked(checked.includes(x.hn) ? checked.filter((h) => h !== x.hn) : [...checked, x.hn])} />
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
              {list.length === 0 && <tr><td colSpan={11} className="td py-8 text-center">No se encontraron pacientes.</td></tr>}
            </tbody>
          </Table>
          <Pagination text="Mostrando 1 a 10 de 24,893 pacientes" pages={[1, 2, 3, 4, 5]} last={2490} />
        </section>

        <div className="min-w-0 space-y-4 xl:col-span-5">
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
                  <Badge tone={p.estado === 'Con estudios' ? 'green' : 'gray'} icon className="rounded-full px-3 py-1 text-[12.5px]">Activo</Badge>
                </div>
                <InfoLine icon={CreditCard}>Cédula: {p.cedula}</InfoLine>
                <InfoLine icon={Users}>Teléfono: {p.tel}</InfoLine>
                <InfoLine icon={Calendar}>Fecha de nacimiento: {p.dob} ({p.edad} años)</InfoLine>
                <InfoLine icon={User}>Sexo: {p.sexo === 'M' ? 'Masculino' : 'Femenino'}</InfoLine>
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
                    <Mini icon={Monitor} tone="blue" v={p.accesos} l="Accesos al portal" />
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
                      {p.estudios > 0 ? (
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
                  {(p.estudios ? ESTUDIOS_PAC : []).map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 px-3 py-2 text-[12px]">
                      <span className="flex items-center gap-2"><Modality m={e.m} /><span><b className="text-ink">{e.id}</b><br /><span className="text-[11px] text-slate-500">{e.d} · {e.f} · {e.h}</span></span></span>
                      <Badge tone="green" icon className="rounded-full">{e.e}</Badge>
                    </li>
                  ))}
                  {!p.estudios && <li className="px-3 py-4 text-center text-[12px] text-slate-500">Sin estudios registrados.</li>}
                </ul>
              )}
              {tab === 2 && (
                <ul className="space-y-2">
                  {['Hosp. Hugo Mendoza', 'Hosp. Dr. Fco. A. Gonzalvo', 'Hosp. Juan de Herrera', 'Hosp. Jaime Mota'].slice(0, p.hospitales).map((h, i) => (
                    <li key={h} className="flex items-center gap-2.5 rounded-lg border border-[#eef2f8] px-3 py-2 text-[12px]">
                      <Hospital size={18} className="text-brand-600" /><span className="flex-1 text-ink">{h}</span><span className="text-slate-500">{Math.max(1, p.estudios - i * 3)} estudios</span>
                    </li>
                  ))}
                </ul>
              )}
              {tab === 3 && <AccesosTable />}
              {tab === 4 && (
                <ul className="space-y-2">
                  {p.referidores ? ['Dr. Luis Fernández Gómez', 'Dra. Ana Torres Mejía', 'Dr. Roberto Castillo'].slice(0, p.referidores).map((r) => (
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
            <div className="px-2 pb-2"><AccesosTable /></div>
          </section>
        </div>
      </div>
    </>
  )
}

function AccesosTable() {
  return (
    <Table>
      <thead><tr><th className="th">Fecha / Hora</th><th className="th">Dispositivo</th><th className="th">Navegador / SO</th><th className="th">IP</th><th className="th">Acción</th></tr></thead>
      <tbody>
        {ACCESOS.map((a) => (
          <tr key={a.f} className="tr">
            <td className="td whitespace-nowrap text-[11.5px]">{a.f}</td>
            <td className="td text-[11.5px]">{a.d}</td>
            <td className="td whitespace-nowrap text-[11.5px]">{a.nav}</td>
            <td className="td text-[11.5px]">{a.ip}</td>
            <td className="td whitespace-nowrap text-[11.5px]"><button className="text-brand-600 hover:underline">{a.a}</button></td>
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

