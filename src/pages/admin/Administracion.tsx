import { useState } from 'react'
import {
  Building2, CalendarDays, ChevronDown, Lock, Mail, Pencil, Phone, Plus, Save, Settings, ShieldCheck, Upload, User,
  UserPlus, Users, Hospital, ListChecks,
} from 'lucide-react'
import {
  Badge, Checkbox, DotsButton, InfoRow, Kpi, Modal, MoreLink, PageHeader, Pagination, Panel, SearchInput, Select,
  Table, Tabs, Toggle, UserSilhouette, clsx, type Tone,
} from '../../components/ui'
import { BRAND } from '../../config/brand'
import { supabase } from '../../lib/supabase'
import { fFecha, fFechaHora, hace, num, supabaseConfigurado, useDatos } from '../../lib/admin-data'

/* ---------- Datos mock ---------- */
type Usuario = {
  nombre: string; email: string; rol: string; hospital: string; activo: boolean; fecha: string; hora: string
  cedula: string; telefono: string; registrado: string; dosFA: boolean
}
const USUARIOS: Usuario[] = [
  { nombre: 'Juan Pérez', email: 'jperez@sns.gob.do', rol: 'Administrador', hospital: 'SNS - Nivel Nacional', activo: true, fecha: '15/03/2025', hora: '10:24 a. m.', cedula: '001-1234567-8', telefono: '809-555-1234', registrado: '12/01/2022', dosFA: true },
  { nombre: 'María López', email: 'mlopez@hphm.gob.do', rol: 'Radiólogo', hospital: 'HPHM', activo: true, fecha: '15/03/2025', hora: '09:18 a. m.', cedula: '001-2345678-9', telefono: '809-555-2345', registrado: '03/05/2022', dosFA: true },
  { nombre: 'Carlos Peña', email: 'cpena@hjm.gob.do', rol: 'Operador', hospital: 'HJM', activo: true, fecha: '15/03/2025', hora: '08:41 a. m.', cedula: '047-3456789-0', telefono: '809-555-3456', registrado: '21/07/2022', dosFA: false },
  { nombre: 'Ana Rodríguez', email: 'arodriguez@hrc.gob.do', rol: 'Coordinador', hospital: 'HRC', activo: true, fecha: '15/03/2025', hora: '08:32 a. m.', cedula: '031-4567890-1', telefono: '809-555-4567', registrado: '10/09/2022', dosFA: true },
  { nombre: 'Pedro Martínez', email: 'pmartinez@hra.gob.do', rol: 'Médico referidor', hospital: 'HRA', activo: true, fecha: '15/03/2025', hora: '07:55 a. m.', cedula: '056-5678901-2', telefono: '809-555-5678', registrado: '02/11/2022', dosFA: false },
  { nombre: 'Luis Vargas', email: 'lvargas@hga.gob.do', rol: 'Radiólogo', hospital: 'HGA', activo: true, fecha: '15/03/2025', hora: '06:12 a. m.', cedula: '001-6789012-3', telefono: '809-555-6789', registrado: '15/01/2023', dosFA: true },
  { nombre: 'Sofía Méndez', email: 'smendez@hmc.gob.do', rol: 'Operador', hospital: 'HMC', activo: false, fecha: '14/03/2025', hora: '11:43 p. m.', cedula: '402-7890123-4', telefono: '809-555-7890', registrado: '28/02/2023', dosFA: false },
  { nombre: 'Roberto Díaz', email: 'rdiaz@hjm.gob.do', rol: 'Administrador', hospital: 'HJM', activo: true, fecha: '14/03/2025', hora: '10:28 p. m.', cedula: '001-8901234-5', telefono: '809-555-8901', registrado: '06/04/2023', dosFA: true },
  { nombre: 'Lucía Jiménez', email: 'ljimenez@hphm.gob.do', rol: 'Coordinador', hospital: 'HPHM', activo: true, fecha: '14/03/2025', hora: '09:15 p. m.', cedula: '031-9012345-6', telefono: '809-555-9012', registrado: '19/06/2023', dosFA: true },
  { nombre: 'Tomás Núñez', email: 'tnunez@hra.gob.do', rol: 'Radiólogo', hospital: 'HRA', activo: true, fecha: '14/03/2025', hora: '08:02 p. m.', cedula: '056-0123456-7', telefono: '809-555-0123', registrado: '30/08/2023', dosFA: true },
]

const rolStyle: Record<string, string> = {
  Administrador: 'bg-brand-50 text-brand-700',
  Radiólogo: 'bg-violet-50 text-violet-700',
  Operador: 'bg-emerald-50 text-emerald-700',
  Coordinador: 'bg-orange-50 text-orange-600',
  'Médico referidor': 'bg-amber-50 text-amber-700',
}
const ROLES = ['Administrador', 'Coordinador', 'Radiólogo', 'Médico referidor', 'Operador']
const HOSPITALES = ['SNS - Nivel Nacional', 'HPHM', 'HJM', 'HRC', 'HRA', 'HGA', 'HMC']

const PERMISOS = [
  'Ver dashboard', 'Gestionar hospitales', 'Gestionar radiólogos', 'Asignar estudios', 'Ver estudios',
  'Emitir informes', 'Ver pacientes', 'Gestionar usuarios', 'Ver analítica', 'Exportar reportes', 'Configuración del sistema', 'Ver auditoría',
]
const MATRIZ_INICIAL: boolean[][] = [
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, false, true, false, true, true, false, true],
  [true, false, false, false, true, true, true, false, false, false, false, false],
  [true, false, false, false, true, false, true, false, false, false, false, false],
  [true, false, false, true, true, false, true, false, false, false, false, false],
]

const HOSP_LIST: { cod: string; nombre: string; prov: string; usuarios: number; estado: string; tone: Tone }[] = [
  { cod: 'HPHM', nombre: 'Hosp. Hugo Mendoza', prov: 'Santo Domingo', usuarios: 64, estado: 'Operativo', tone: 'green' },
  { cod: 'HRA', nombre: 'Hosp. Dr. Fco. A. Gonzalvo', prov: 'La Romana', usuarios: 41, estado: 'Operativo', tone: 'green' },
  { cod: 'HJM', nombre: 'Hosp. Juan de Herrera', prov: 'Santo Domingo', usuarios: 38, estado: 'Operativo', tone: 'green' },
  { cod: 'HRC', nombre: 'Hosp. Municipal Constanza', prov: 'La Vega', usuarios: 17, estado: 'Con incidencias', tone: 'orange' },
  { cod: 'HGA', nombre: 'Hosp. Municipal La Vega', prov: 'La Vega', usuarios: 22, estado: 'Operativo', tone: 'green' },
  { cod: 'HMC', nombre: 'Hosp. Municipal Cotuí', prov: 'Sánchez Ramírez', usuarios: 14, estado: 'Sin conexión', tone: 'red' },
  { cod: 'HRS', nombre: 'Hosp. Regional José María Cabral', prov: 'Santiago', usuarios: 57, estado: 'Operativo', tone: 'green' },
  { cod: 'HSF', nombre: 'Hosp. San Vicente de Paúl', prov: 'Duarte', usuarios: 29, estado: 'Operativo', tone: 'green' },
]

/* ---------- Pestaña Usuarios ---------- */
function UsuariosTab({ onNew }: { onNew: () => void }) {
  const [sel, setSel] = useState(0)
  const [checked, setChecked] = useState<boolean[]>(USUARIOS.map(() => false))
  const [subTab, setSubTab] = useState(0)
  const u = USUARIOS[sel]
  const all = checked.every(Boolean)

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Panel className="xl:col-span-8" bodyClass="!px-0 !pb-0"
        title={<span className="flex items-center gap-3">Listado de usuarios <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[12px] font-medium text-brand-700">842 registros</span></span>}
        icon={Users}>
        <div className="flex flex-wrap items-center gap-3 px-4 pb-3">
          <SearchInput placeholder="Buscar por nombre, correo o rol..." className="w-full sm:w-[260px]" />
          <Select options={['Todos los roles', ...ROLES]} className="w-full sm:w-[190px]" />
          <Select options={['Todos los hospitales', ...HOSPITALES]} className="w-full sm:w-[190px]" />
          <button onClick={onNew} className="btn-primary ml-auto"><Plus size={17} /> Nuevo usuario</button>
        </div>
        <Table className="px-2">
          <thead>
            <tr className="bg-[#f5f8fd]">
              <th className="th w-8"><Checkbox checked={all} onChange={(v) => setChecked(checked.map(() => v))} /></th>
              {['#', 'Nombre completo', 'Correo electrónico', 'Rol', 'Hospital / Centro', 'Estado', 'Último acceso', 'Acciones'].map((h) => <th key={h} className="th text-brand-800">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {USUARIOS.map((r, i) => (
              <tr key={r.email} onClick={() => setSel(i)} className={clsx('tr cursor-pointer', sel === i && '!bg-brand-50/80')}>
                <td className="td" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={checked[i]} onChange={(v) => setChecked(checked.map((c, j) => (j === i ? v : c)))} />
                </td>
                <td className="td">{i + 1}</td>
                <td className="td whitespace-nowrap text-ink">{r.nombre}</td>
                <td className="td whitespace-nowrap text-ink">{r.email}</td>
                <td className="td"><span className={clsx('chip whitespace-nowrap px-2.5 py-1 text-[12px] font-medium', rolStyle[r.rol])}>{r.rol}</span></td>
                <td className="td whitespace-nowrap">{r.hospital}</td>
                <td className="td">{r.activo ? <Badge tone="green" icon>Activo</Badge> : <Badge tone="red" icon={false} dot>Inactivo</Badge>}</td>
                <td className="td whitespace-nowrap leading-tight">{r.fecha}<br />{r.hora}</td>
                <td className="td" onClick={(e) => e.stopPropagation()}><DotsButton /></td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination text="Mostrando 1 a 10 de 842 usuarios" last={85} />
      </Panel>

      {/* Detalle */}
      <Panel className="xl:col-span-4" title="Detalle del usuario" icon={User}
        action={<button className="btn-outline px-3 py-1.5"><Pencil size={15} /> Editar</button>}>
        <div className="flex items-start gap-4">
          <UserSilhouette size={96} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="text-[18px] font-bold text-ink">{u.nombre}</div>
              {u.activo ? <Badge tone="green" icon>Activo</Badge> : <Badge tone="red">Inactivo</Badge>}
            </div>
            <div className="mb-1.5 text-[13px] text-ink/80">{u.rol}</div>
            <ul className="space-y-0.5 text-[12px] text-brand-800/90">
              <li className="flex items-center gap-2"><Mail size={13} />{u.email}</li>
              <li className="flex items-center gap-2"><Phone size={13} />{u.telefono}</li>
              <li className="flex items-center gap-2"><Building2 size={13} />{u.hospital}</li>
              <li className="flex items-center gap-2"><CalendarDays size={13} />Registrado: {u.registrado}</li>
            </ul>
          </div>
        </div>
        <Tabs tabs={['Información', 'Roles y permisos', 'Actividad reciente']} active={subTab} onChange={setSubTab} className="mb-2 mt-4" />
        {subTab === 0 && (
          <div>
            <InfoRow label="Nombre completo">{u.nombre}</InfoRow>
            <InfoRow label="Cédula">{u.cedula}</InfoRow>
            <InfoRow label="Teléfono">{u.telefono}</InfoRow>
            <InfoRow label="Correo electrónico">{u.email}</InfoRow>
            <InfoRow label="Rol">{u.rol}</InfoRow>
            <InfoRow label="Hospital / Centro">{u.hospital}</InfoRow>
            <InfoRow label="Estado">{u.activo ? <Badge tone="green" icon>Activo</Badge> : <Badge tone="red">Inactivo</Badge>}</InfoRow>
            <InfoRow label="Último acceso">{u.fecha} {u.hora}</InfoRow>
            <InfoRow label="Autenticación 2FA">{u.dosFA ? <Badge tone="green" icon>Activada</Badge> : <Badge tone="gray">Desactivada</Badge>}</InfoRow>
            <InfoRow label="Observaciones">-</InfoRow>
          </div>
        )}
        {subTab === 1 && (
          <ul className="space-y-2 text-[12.5px]">
            {PERMISOS.map((p, j) => {
              const ok = MATRIZ_INICIAL[Math.max(0, ROLES.indexOf(u.rol))][j]
              return (
                <li key={p} className="flex items-center justify-between border-b border-[#eef2f8] pb-1.5">
                  <span className="text-ink">{p}</span>
                  {ok ? <Badge tone="green" icon>Permitido</Badge> : <Badge tone="gray">Sin acceso</Badge>}
                </li>
              )
            })}
          </ul>
        )}
        {subTab === 2 && (
          <ul className="space-y-2.5 text-[12.5px]">
            {[
              ['Inicio de sesión', `${u.fecha} ${u.hora}`],
              ['Visualización de estudio', '14/03/2025 04:10 p. m.'],
              ['Descarga de imágenes', '14/03/2025 11:32 a. m.'],
              ['Cambio de contraseña', '10/03/2025 09:05 a. m.'],
              ['Inicio de sesión', '10/03/2025 08:58 a. m.'],
            ].map(([a, f], k) => (
              <li key={k} className="flex items-start gap-2.5 border-b border-[#eef2f8] pb-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                <span className="flex-1 text-ink">{a}</span>
                <span className="text-slate-500">{f}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

/* ---------- Pestaña Roles y permisos ---------- */
function RolesTab() {
  const [m, setM] = useState(MATRIZ_INICIAL)
  const [saved, setSaved] = useState(false)
  return (
    <Panel title="Matriz de roles y permisos" icon={Lock} subtitle="Marque los permisos asignados a cada rol del sistema" bodyClass="!px-0"
      action={<button className={clsx('btn-primary', saved && '!bg-emerald-600')} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800) }}><Save size={16} /> {saved ? 'Cambios guardados' : 'Guardar cambios'}</button>}>
      <Table className="px-2">
        <thead>
          <tr className="bg-[#f5f8fd]">
            <th className="th">Permiso</th>
            {ROLES.map((r) => <th key={r} className="th text-center"><span className={clsx('chip px-2.5 py-1 text-[12px]', rolStyle[r])}>{r}</span></th>)}
          </tr>
        </thead>
        <tbody>
          {PERMISOS.map((p, j) => (
            <tr key={p} className="tr">
              <td className="td whitespace-nowrap font-medium text-ink">{p}</td>
              {ROLES.map((r, i) => (
                <td key={r} className="td text-center">
                  <Checkbox checked={m[i][j]} onChange={(v) => setM(m.map((row, ri) => (ri === i ? row.map((c, ci) => (ci === j ? v : c)) : row)))} />
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-[#e6edf8] bg-[#f9fbfe]">
            <td className="td font-semibold text-ink">Total de permisos</td>
            {ROLES.map((r, i) => <td key={r} className="td text-center font-semibold text-brand-700">{m[i].filter(Boolean).length} / {PERMISOS.length}</td>)}
          </tr>
        </tbody>
      </Table>
    </Panel>
  )
}

/* ---------- Pestaña Hospitales ---------- */
function HospitalesTab() {
  return (
    <Panel title={<span className="flex items-center gap-3">Hospitales registrados <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[12px] font-medium text-brand-700">128 hospitales</span></span>}
      icon={Hospital} action={<MoreLink boxed>Ir a Hospitales</MoreLink>} bodyClass="!px-0 !pb-0">
      <div className="flex flex-wrap gap-3 px-4 pb-3">
        <SearchInput placeholder="Buscar hospital por nombre o código..." className="w-full sm:w-[280px]" />
        <Select options={['Todas las provincias', 'Santo Domingo', 'Santiago', 'La Vega', 'La Romana', 'Duarte', 'Sánchez Ramírez']} className="w-full sm:w-[200px]" />
        <Select options={['Todos los estados', 'Operativo', 'Con incidencias', 'Sin conexión']} className="w-full sm:w-[180px]" />
      </div>
      <Table className="px-2">
        <thead>
          <tr className="bg-[#f5f8fd]">{['Código', 'Hospital', 'Provincia', 'Usuarios', 'Estado', 'Acciones'].map((h) => <th key={h} className="th text-brand-800">{h}</th>)}</tr>
        </thead>
        <tbody>
          {HOSP_LIST.map((h) => (
            <tr key={h.cod} className="tr">
              <td className="td font-semibold text-brand-700">{h.cod}</td>
              <td className="td whitespace-nowrap text-ink">{h.nombre}</td>
              <td className="td">{h.prov}</td>
              <td className="td tabular-nums">{h.usuarios}</td>
              <td className="td"><Badge tone={h.tone} icon={h.tone === 'green'}>{h.estado}</Badge></td>
              <td className="td"><DotsButton /></td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination text="Mostrando 1 a 8 de 128 hospitales" pages={[1, 2, 3]} last={16} />
    </Panel>
  )
}

/* ---------- Pestaña Configuración general ---------- */
function ConfigTab() {
  const [opts, setOpts] = useState({ registro: true, dosFA: true, notifs: true, mantenimiento: false })
  const [saved, setSaved] = useState(false)
  const set = (k: keyof typeof opts) => (v: boolean) => setOpts({ ...opts, [k]: v })
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Panel className="xl:col-span-7" title="Datos de la plataforma" icon={Settings}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><span className="label">Nombre de la plataforma</span><input className="input" defaultValue={BRAND.domain} /></div>
          <div><span className="label">Institución</span><input className="input" defaultValue="Sistema Nacional de Salud (SNS)" /></div>
          <div><span className="label">Correo de soporte</span><input className="input" defaultValue={BRAND.supportEmail} /></div>
          <div><span className="label">Teléfono de soporte</span><input className="input" defaultValue={BRAND.supportPhone} /></div>
          <div><span className="label">Zona horaria</span><Select options={['(GMT-4) Santo Domingo', '(GMT-5) Bogotá', '(GMT-4) Caracas']} /></div>
          <div><span className="label">Idioma predeterminado</span><Select options={['Español', 'English']} /></div>
          <div><span className="label">Tiempo de sesión (minutos)</span><input className="input" type="number" defaultValue={30} /></div>
          <div><span className="label">Retención de auditoría (meses)</span><input className="input" type="number" defaultValue={24} /></div>
        </div>
      </Panel>
      <Panel className="xl:col-span-5" title="Opciones generales" icon={ListChecks}>
        <ul className="divide-y divide-[#eef2f8]">
          {([
            ['registro', 'Permitir autorregistro de médicos referidores', 'Las solicitudes requieren aprobación del administrador'],
            ['dosFA', 'Exigir autenticación de dos factores', 'Obligatorio para administradores y coordinadores'],
            ['notifs', 'Notificaciones por correo electrónico', 'Alertas de estudios críticos y vencidos'],
            ['mantenimiento', 'Modo mantenimiento', 'Restringe el acceso a usuarios no administradores'],
          ] as const).map(([k, t, d]) => (
            <li key={k} className="flex items-center justify-between gap-4 py-3">
              <div><div className="text-[13px] font-medium text-ink">{t}</div><div className="text-[11.5px] text-slate-500">{d}</div></div>
              <Toggle on={opts[k]} onChange={set(k)} />
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-end gap-2">
          <button className="btn-outline">Cancelar</button>
          <button className={clsx('btn-primary', saved && '!bg-emerald-600')} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800) }}>
            <Save size={16} /> {saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </Panel>
    </div>
  )
}

/* ---------- Modal nuevo usuario ---------- */
function NuevoUsuarioModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [done, setDone] = useState(false)
  const [dosFA, setDosFA] = useState(true)
  const [activo, setActivo] = useState(true)
  const close = () => { setDone(false); onClose() }
  return (
    <Modal open={open} onClose={close} className="max-w-[640px]">
      <div className="flex items-center gap-3 border-b border-[#eef2f8] px-6 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white"><UserPlus size={20} /></span>
        <div>
          <h2 className="text-[18px] font-bold text-ink">Nuevo usuario</h2>
          <p className="text-[12.5px] text-slate-500">Complete los datos para crear un usuario en la plataforma</p>
        </div>
      </div>
      {done ? (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><ShieldCheck size={30} /></span>
          <div className="text-[17px] font-bold text-ink">Usuario creado correctamente</div>
          <p className="mt-1 text-[13px] text-slate-500">Se envió un correo con las credenciales de acceso temporales.</p>
          <button className="btn-primary mt-5" onClick={close}>Aceptar</button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setDone(true) }}>
          <div className="grid grid-cols-1 gap-3 px-6 py-5 sm:grid-cols-2">
            <div><span className="label">Nombre(s) <span className="req text-red-500">*</span></span><input required className="input" placeholder="Ej. Juan" /></div>
            <div><span className="label">Apellido(s) <span className="req text-red-500">*</span></span><input required className="input" placeholder="Ej. Pérez" /></div>
            <div><span className="label">Cédula <span className="req text-red-500">*</span></span><input required className="input" placeholder="000-0000000-0" /></div>
            <div><span className="label">Teléfono</span><input className="input" placeholder="809-000-0000" /></div>
            <div className="sm:col-span-2"><span className="label">Correo electrónico <span className="req text-red-500">*</span></span><input required type="email" className="input" placeholder="usuario@sns.gob.do" /></div>
            <div><span className="label">Rol <span className="req text-red-500">*</span></span><Select options={ROLES} placeholder="Seleccione un rol" /></div>
            <div><span className="label">Hospital / Centro <span className="req text-red-500">*</span></span><Select options={HOSPITALES} placeholder="Seleccione un hospital" /></div>
            <div className="flex items-center justify-between rounded-lg border border-[#e6edf8] px-3 py-2.5">
              <span className="text-[12.5px] text-ink">Autenticación 2FA</span><Toggle on={dosFA} onChange={setDosFA} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#e6edf8] px-3 py-2.5">
              <span className="text-[12.5px] text-ink">Usuario activo</span><Toggle on={activo} onChange={setActivo} />
            </div>
            <div className="sm:col-span-2"><span className="label">Observaciones</span><textarea className="input min-h-[70px]" placeholder="Notas internas (opcional)" /></div>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#eef2f8] px-6 py-4">
            <button type="button" className="btn-outline" onClick={close}>Cancelar</button>
            <button type="submit" className="btn-primary"><UserPlus size={16} /> Crear usuario</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

/* =====================================================================
 * Datos reales (Supabase). Sin Supabase configurado se usan los de ejemplo de arriba.
 * ===================================================================== */
const ROL_LABEL: Record<string, string> = {
  admin: 'Administrador', coordinador: 'Coordinador', operador: 'Operador', radiologo: 'Radiólogo', referidor: 'Médico referidor', paciente: 'Paciente',
}
const ORDEN_ROLES = ['admin', 'coordinador', 'operador', 'radiologo', 'referidor', 'paciente']
const rolLabel = (r: string | null) => (r ? ROL_LABEL[r] ?? r : 'Sin rol')
const rolChip = (r: string | null) => rolStyle[rolLabel(r)] ?? 'bg-slate-100 text-slate-600'
const ESTADO_CUENTA: Record<string, { t: string; tone: Tone }> = {
  activo: { t: 'Activo', tone: 'green' }, inactivo: { t: 'Inactivo', tone: 'gray' }, bloqueado: { t: 'Bloqueado', tone: 'red' },
}
const ACCION_LABEL: Record<string, string> = {
  inicio_sesion: 'Inicio de sesión', consulta: 'Consulta', creacion: 'Creación', actualizacion: 'Actualización', eliminacion: 'Eliminación',
  asignacion: 'Asignación', cambio_rol: 'Cambio de rol', exportacion: 'Exportación', acceso_denegado: 'Acceso denegado',
}
/** hospitales.editar → Hospitales · editar */
const permisoLabel = (p: string) => {
  const [a, b] = p.split('.')
  const t = a.replace(/_/g, ' ')
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}${b ? ` · ${b.replace(/_/g, ' ')}` : ''}`
}
const POR_PAGINA = 10

type Perfil = {
  id: string; rol: string | null; nombre: string; correo: string; telefono: string; hospital: string; estado: string
  dosFA: boolean; ultimo: string | null; registrado: string
}
type RolPermiso = { rol: string; permiso: string }

async function fetchPerfiles(): Promise<Perfil[]> {
  const { data, error } = await supabase.from('profiles')
    .select('id, rol, nombre_completo, correo, telefono, estado, dos_factores, ultimo_acceso, created_at, hospitales(nombre)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((p) => ({
    id: p.id, rol: p.rol, nombre: p.nombre_completo || '—', correo: p.correo ?? '—', telefono: p.telefono ?? '—',
    hospital: (Array.isArray(p.hospitales) ? p.hospitales[0]?.nombre : p.hospitales?.nombre) ?? '—',
    estado: p.estado, dosFA: Boolean(p.dos_factores), ultimo: p.ultimo_acceso, registrado: fFecha(p.created_at),
  }))
}

async function fetchRolPermisos(): Promise<RolPermiso[]> {
  const { data, error } = await supabase.from('rol_permisos').select('rol, permiso')
  if (error) throw new Error(error.message)
  return (data ?? []) as RolPermiso[]
}

async function fetchResumen() {
  const [u, rp, h, c] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('rol_permisos').select('rol'),
    supabase.from('hospitales').select('id', { count: 'exact', head: true }).eq('estado', 'activo'),
    supabase.from('configuracion').select('clave', { count: 'exact', head: true }),
  ])
  const err = u.error ?? rp.error ?? h.error ?? c.error
  if (err) throw new Error(err.message)
  const filas = (rp.data ?? []) as { rol: string }[]
  return { usuarios: u.count ?? 0, roles: new Set(filas.map((r) => r.rol)).size, permisos: filas.length, hospitales: h.count ?? 0, config: c.count ?? 0 }
}

type Actividad = { accion: string; modulo: string; fecha: string }
async function fetchActividadUsuario(userId: string | undefined): Promise<Actividad[]> {
  if (!userId) return []
  // La auditoría solo la ve el administrador; para otros roles llega vacía
  const { data, error } = await supabase.from('auditoria').select('accion, modulo, created_at')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
  if (error) return []
  return ((data ?? []) as { accion: string; modulo: string; created_at: string }[])
    .map((a) => ({ accion: ACCION_LABEL[a.accion] ?? a.accion, modulo: a.modulo, fecha: fFechaHora(a.created_at) }))
}

/** Fila de estado (cargando / error / vacío) para las tablas con datos reales */
function FilaEstado({ cols, cargando, error, vacio, recargar }: { cols: number; cargando: boolean; error: string; vacio: string | null; recargar: () => void }) {
  if (cargando) return <tr><td colSpan={cols} className="td py-8 text-center text-slate-400">Cargando…</td></tr>
  if (error) return <tr><td colSpan={cols} className="td py-8 text-center text-red-600">No se pudieron cargar los datos: {error} <button onClick={recargar} className="ml-2 font-semibold text-brand-600 hover:underline">Reintentar</button></td></tr>
  if (vacio) return <tr><td colSpan={cols} className="td py-8 text-center text-slate-400">{vacio}</td></tr>
  return null
}

function Buscar({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={clsx('relative flex items-center', className)}>
      <svg className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input className="input pl-9" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

const unicos = (xs: string[]) => [...new Set(xs.filter((x) => x && x !== '—'))].sort((a, b) => a.localeCompare(b, 'es'))
const textoPaginacion = (pagina: number, total: number, nombre: string) =>
  total === 0 ? `Mostrando 0 de 0 ${nombre}` : `Mostrando ${num((pagina - 1) * POR_PAGINA + 1)} a ${num(Math.min(pagina * POR_PAGINA, total))} de ${num(total)} ${nombre}`

function UsuariosTabReal({ onNew, permisos }: { onNew: () => void; permisos: RolPermiso[] }) {
  const { datos, cargando, error, recargar } = useDatos(fetchPerfiles, [] as Perfil[])
  const [q, setQ] = useState('')
  const [fRol, setFRol] = useState('Todos los roles')
  const [fHosp, setFHosp] = useState('Todos los hospitales')
  const [pagina, setPagina] = useState(1)
  const [selId, setSelId] = useState<string | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [subTab, setSubTab] = useState(0)

  const t = q.trim().toLowerCase()
  const lista = datos.filter((u) =>
    (!t || [u.nombre, u.correo, rolLabel(u.rol)].some((x) => x.toLowerCase().includes(t)))
    && (fRol === 'Todos los roles' || rolLabel(u.rol) === fRol)
    && (fHosp === 'Todos los hospitales' || u.hospital === fHosp))
  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const pag = Math.min(pagina, totalPaginas)
  const filas = lista.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA)
  const u = datos.find((x) => x.id === selId) ?? filas[0]
  const all = filas.length > 0 && filas.every((r) => checked[r.id])
  const roles = unicos(datos.map((x) => rolLabel(x.rol)))
  const hospitales = unicos(datos.map((x) => x.hospital))
  const actividad = useDatos(() => fetchActividadUsuario(u?.id), [] as Actividad[], [u?.id])
  const permisosRol = u?.rol ? permisos.filter((p) => p.rol === u.rol).map((p) => p.permiso).sort() : []
  const filtro = (fn: (v: string) => void) => (v: string) => { fn(v); setPagina(1) }
  const estado = (e: string) => { const s = ESTADO_CUENTA[e] ?? { t: e, tone: 'gray' as Tone }; return <Badge tone={s.tone} icon={s.tone === 'green'}>{s.t}</Badge> }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Panel className="xl:col-span-8" bodyClass="!px-0 !pb-0"
        title={<span className="flex items-center gap-3">Listado de usuarios <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[12px] font-medium text-brand-700">{cargando ? '…' : num(lista.length)} registros</span></span>}
        icon={Users}>
        <div className="flex flex-wrap items-center gap-3 px-4 pb-3">
          <Buscar value={q} onChange={filtro(setQ)} placeholder="Buscar por nombre, correo o rol..." className="w-full sm:w-[260px]" />
          <Select key={`r${roles.length}`} options={['Todos los roles', ...roles]} onChange={filtro(setFRol)} className="w-full sm:w-[190px]" />
          <Select key={`h${hospitales.length}`} options={['Todos los hospitales', ...hospitales]} onChange={filtro(setFHosp)} className="w-full sm:w-[190px]" />
          <button onClick={onNew} className="btn-primary ml-auto"><Plus size={17} /> Nuevo usuario</button>
        </div>
        <Table className="px-2">
          <thead>
            <tr className="bg-[#f5f8fd]">
              <th className="th w-8"><Checkbox checked={all} onChange={(v) => setChecked({ ...checked, ...Object.fromEntries(filas.map((r) => [r.id, v])) })} /></th>
              {['#', 'Nombre completo', 'Correo electrónico', 'Rol', 'Hospital / Centro', 'Estado', 'Último acceso', 'Acciones'].map((h) => <th key={h} className="th text-brand-800">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            <FilaEstado cols={9} cargando={cargando} error={error} recargar={recargar}
              vacio={datos.length === 0 ? 'Aún no hay usuarios registrados' : lista.length === 0 ? 'No se encontraron usuarios con los filtros seleccionados' : null} />
            {!cargando && !error && filas.map((r, i) => (
              <tr key={r.id} onClick={() => setSelId(r.id)} className={clsx('tr cursor-pointer', u?.id === r.id && '!bg-brand-50/80')}>
                <td className="td" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={!!checked[r.id]} onChange={(v) => setChecked({ ...checked, [r.id]: v })} />
                </td>
                <td className="td">{(pag - 1) * POR_PAGINA + i + 1}</td>
                <td className="td whitespace-nowrap text-ink">{r.nombre}</td>
                <td className="td whitespace-nowrap text-ink">{r.correo}</td>
                <td className="td"><span className={clsx('chip whitespace-nowrap px-2.5 py-1 text-[12px] font-medium', rolChip(r.rol))}>{rolLabel(r.rol)}</span></td>
                <td className="td whitespace-nowrap">{r.hospital}</td>
                <td className="td">{estado(r.estado)}</td>
                <td className="td whitespace-nowrap leading-tight">{r.ultimo ? <>{fFechaHora(r.ultimo)}<br /><span className="text-[11.5px] text-slate-400">{hace(r.ultimo)}</span></> : <span className="text-slate-400">Nunca</span>}</td>
                <td className="td" onClick={(e) => e.stopPropagation()}><DotsButton onClick={() => setSelId(r.id)} /></td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination text={textoPaginacion(pag, lista.length, 'usuarios')} page={pag} onPage={setPagina} totalPages={totalPaginas} perPage={false} />
      </Panel>

      {/* Detalle */}
      <Panel className="xl:col-span-4" title="Detalle del usuario" icon={User}>
        {!u ? (
          <div className="py-10 text-center text-[12.5px] text-slate-400">{cargando ? 'Cargando…' : datos.length ? 'Selecciona un usuario' : 'Sin registros'}</div>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <UserSilhouette size={96} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="break-words text-[18px] font-bold text-ink">{u.nombre}</div>
                  {estado(u.estado)}
                </div>
                <div className="mb-1.5 text-[13px] text-ink/80">{rolLabel(u.rol)}</div>
                <ul className="space-y-0.5 text-[12px] text-brand-800/90">
                  <li className="flex items-center gap-2 break-all"><Mail size={13} className="shrink-0" />{u.correo}</li>
                  <li className="flex items-center gap-2"><Phone size={13} />{u.telefono}</li>
                  <li className="flex items-center gap-2"><Building2 size={13} />{u.hospital}</li>
                  <li className="flex items-center gap-2"><CalendarDays size={13} />Registrado: {u.registrado}</li>
                </ul>
              </div>
            </div>
            <Tabs tabs={['Información', 'Roles y permisos', 'Actividad reciente']} active={subTab} onChange={setSubTab} className="mb-2 mt-4" />
            {subTab === 0 && (
              <div>
                <InfoRow label="Nombre completo">{u.nombre}</InfoRow>
                <InfoRow label="Teléfono">{u.telefono}</InfoRow>
                <InfoRow label="Correo electrónico">{u.correo}</InfoRow>
                <InfoRow label="Rol">{rolLabel(u.rol)}</InfoRow>
                <InfoRow label="Hospital / Centro">{u.hospital}</InfoRow>
                <InfoRow label="Estado">{estado(u.estado)}</InfoRow>
                <InfoRow label="Último acceso">{u.ultimo ? fFechaHora(u.ultimo) : 'Nunca'}</InfoRow>
                <InfoRow label="Autenticación 2FA">{u.dosFA ? <Badge tone="green" icon>Activada</Badge> : <Badge tone="gray">Desactivada</Badge>}</InfoRow>
              </div>
            )}
            {subTab === 1 && (
              permisosRol.length === 0
                ? <div className="py-6 text-center text-[12.5px] text-slate-400">{u.rol ? 'Este rol no tiene permisos asignados' : 'El usuario aún no tiene un rol asignado'}</div>
                : (
                  <ul className="space-y-2 text-[12.5px]">
                    {permisosRol.map((p) => (
                      <li key={p} className="flex items-center justify-between border-b border-[#eef2f8] pb-1.5">
                        <span className="text-ink">{permisoLabel(p)}</span>
                        <Badge tone="green" icon>Permitido</Badge>
                      </li>
                    ))}
                  </ul>
                )
            )}
            {subTab === 2 && (
              actividad.cargando ? <div className="py-6 text-center text-[12.5px] text-slate-400">Cargando…</div>
                : actividad.datos.length === 0 ? <div className="py-6 text-center text-[12.5px] text-slate-400">Sin actividad registrada</div>
                  : (
                    <ul className="space-y-2.5 text-[12.5px]">
                      {actividad.datos.map((a, k) => (
                        <li key={k} className="flex items-start gap-2.5 border-b border-[#eef2f8] pb-2">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                          <span className="flex-1 text-ink">{a.accion} <span className="text-slate-400">· {a.modulo}</span></span>
                          <span className="text-slate-500">{a.fecha}</span>
                        </li>
                      ))}
                    </ul>
                  )
            )}
          </>
        )}
      </Panel>
    </div>
  )
}

function RolesTabReal({ permisos, cargando, error, recargar }: { permisos: RolPermiso[]; cargando: boolean; error: string; recargar: () => void }) {
  const presentes = new Set(permisos.map((p) => p.rol))
  const roles = [...ORDEN_ROLES.filter((r) => presentes.has(r)), ...[...presentes].filter((r) => !ORDEN_ROLES.includes(r))]
  const lista = [...new Set(permisos.map((p) => p.permiso))].sort()
  const tiene = new Set(permisos.map((p) => `${p.rol}|${p.permiso}`))
  return (
    <Panel title="Matriz de roles y permisos" icon={Lock} subtitle="Permisos asignados a cada rol del sistema (solo lectura)" bodyClass="!px-0">
      <Table className="px-2">
        <thead>
          <tr className="bg-[#f5f8fd]">
            <th className="th">Permiso</th>
            {roles.map((r) => <th key={r} className="th text-center"><span className={clsx('chip whitespace-nowrap px-2.5 py-1 text-[12px]', rolChip(r))}>{rolLabel(r)}</span></th>)}
          </tr>
        </thead>
        <tbody>
          <FilaEstado cols={roles.length + 1} cargando={cargando} error={error} recargar={recargar} vacio={lista.length === 0 ? 'Aún no hay permisos definidos' : null} />
          {!cargando && !error && lista.map((p) => (
            <tr key={p} className="tr">
              <td className="td whitespace-nowrap font-medium text-ink">{permisoLabel(p)}</td>
              {roles.map((r) => <td key={r} className="td text-center"><Checkbox checked={tiene.has(`${r}|${p}`)} /></td>)}
            </tr>
          ))}
          {!cargando && !error && lista.length > 0 && (
            <tr className="border-t border-[#e6edf8] bg-[#f9fbfe]">
              <td className="td font-semibold text-ink">Total de permisos</td>
              {roles.map((r) => <td key={r} className="td text-center font-semibold text-brand-700">{permisos.filter((p) => p.rol === r).length} / {lista.length}</td>)}
            </tr>
          )}
        </tbody>
      </Table>
    </Panel>
  )
}

type HospitalFila = { id: string; cod: string; nombre: string; prov: string; usuarios: number; estado: string }
const ESTADO_HOSP: Record<string, { t: string; tone: Tone }> = {
  activo: { t: 'Activo', tone: 'green' }, en_proceso: { t: 'En proceso', tone: 'orange' }, inactivo: { t: 'Inactivo', tone: 'gray' },
}
async function fetchHospitalesAdmin(): Promise<HospitalFila[]> {
  const [h, p] = await Promise.all([
    supabase.from('hospitales').select('id, codigo, sigla, nombre, estado, provincias(nombre)').order('codigo'),
    supabase.from('profiles').select('hospital_id').not('hospital_id', 'is', null),
  ])
  if (h.error) throw new Error(h.error.message)
  const cuenta = ((p.data ?? []) as { hospital_id: string }[]).reduce<Record<string, number>>((m, r) => ({ ...m, [r.hospital_id]: (m[r.hospital_id] ?? 0) + 1 }), {})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((h.data ?? []) as any[]).map((x) => ({
    id: x.id, cod: x.sigla || x.codigo, nombre: x.nombre,
    prov: (Array.isArray(x.provincias) ? x.provincias[0]?.nombre : x.provincias?.nombre) ?? '—', usuarios: cuenta[x.id] ?? 0, estado: x.estado,
  }))
}

function HospitalesTabReal() {
  const { datos, cargando, error, recargar } = useDatos(fetchHospitalesAdmin, [] as HospitalFila[])
  const [q, setQ] = useState('')
  const [fProv, setFProv] = useState('Todas las provincias')
  const [fEst, setFEst] = useState('Todos los estados')
  const [pagina, setPagina] = useState(1)
  const t = q.trim().toLowerCase()
  const lista = datos.filter((h) =>
    (!t || h.nombre.toLowerCase().includes(t) || h.cod.toLowerCase().includes(t))
    && (fProv === 'Todas las provincias' || h.prov === fProv)
    && (fEst === 'Todos los estados' || (ESTADO_HOSP[h.estado]?.t ?? h.estado) === fEst))
  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const pag = Math.min(pagina, totalPaginas)
  const filas = lista.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA)
  const provincias = unicos(datos.map((h) => h.prov))
  const filtro = (fn: (v: string) => void) => (v: string) => { fn(v); setPagina(1) }
  return (
    <Panel title={<span className="flex items-center gap-3">Hospitales registrados <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[12px] font-medium text-brand-700">{cargando ? '…' : num(datos.length)} hospitales</span></span>}
      icon={Hospital} action={<MoreLink boxed>Ir a Hospitales</MoreLink>} bodyClass="!px-0 !pb-0">
      <div className="flex flex-wrap gap-3 px-4 pb-3">
        <Buscar value={q} onChange={filtro(setQ)} placeholder="Buscar hospital por nombre o código..." className="w-full sm:w-[280px]" />
        <Select key={provincias.length} options={['Todas las provincias', ...provincias]} onChange={filtro(setFProv)} className="w-full sm:w-[200px]" />
        <Select options={['Todos los estados', 'Activo', 'En proceso', 'Inactivo']} onChange={filtro(setFEst)} className="w-full sm:w-[180px]" />
      </div>
      <Table className="px-2">
        <thead>
          <tr className="bg-[#f5f8fd]">{['Código', 'Hospital', 'Provincia', 'Usuarios', 'Estado', 'Acciones'].map((h) => <th key={h} className="th text-brand-800">{h}</th>)}</tr>
        </thead>
        <tbody>
          <FilaEstado cols={6} cargando={cargando} error={error} recargar={recargar}
            vacio={datos.length === 0 ? 'Aún no hay hospitales registrados' : lista.length === 0 ? 'No se encontraron hospitales con los filtros seleccionados' : null} />
          {!cargando && !error && filas.map((h) => {
            const s = ESTADO_HOSP[h.estado] ?? { t: h.estado, tone: 'gray' as Tone }
            return (
              <tr key={h.id} className="tr">
                <td className="td font-semibold text-brand-700">{h.cod}</td>
                <td className="td whitespace-nowrap text-ink">{h.nombre}</td>
                <td className="td">{h.prov}</td>
                <td className="td tabular-nums">{num(h.usuarios)}</td>
                <td className="td"><Badge tone={s.tone} icon={s.tone === 'green'}>{s.t}</Badge></td>
                <td className="td"><DotsButton /></td>
              </tr>
            )
          })}
        </tbody>
      </Table>
      <Pagination text={textoPaginacion(pag, lista.length, 'hospitales')} page={pag} onPage={setPagina} totalPages={totalPaginas} perPage={false} />
    </Panel>
  )
}

/** En producción los usuarios del personal se crean en Supabase; aquí solo se explica el procedimiento */
function NuevoUsuarioInfoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-[560px]">
      <div className="flex items-center gap-3 border-b border-[#eef2f8] px-6 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white"><UserPlus size={20} /></span>
        <div>
          <h2 className="text-[18px] font-bold text-ink">Nuevo usuario</h2>
          <p className="text-[12.5px] text-slate-500">Cómo dar de alta a un usuario del personal</p>
        </div>
      </div>
      <div className="space-y-3 px-6 py-5 text-[13px] text-ink/90">
        <p>Por seguridad, las cuentas del personal (administradores, coordinadores y operadores) se crean directamente en Supabase y no desde esta pantalla.</p>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>En el panel de Supabase, abra <b>Authentication → Users</b> y pulse <b>Add user</b>.</li>
          <li>Indique el correo electrónico y una contraseña temporal (o envíe una invitación).</li>
          <li>El usuario aparecerá en este listado sin rol asignado.</li>
          <li>Asígnele el rol y el hospital en la tabla <b>profiles</b> (columnas <code>rol</code> y <code>hospital_id</code>).</li>
        </ol>
        <p className="text-[12px] text-slate-500">Los radiólogos, médicos referidores y pacientes se registran por sus propios formularios y quedan pendientes de aprobación.</p>
      </div>
      <div className="flex justify-end border-t border-[#eef2f8] px-6 py-4">
        <button className="btn-primary" onClick={onClose}>Entendido</button>
      </div>
    </Modal>
  )
}

/* ---------- Página ---------- */
export default function Administracion() {
  const [tab, setTab] = useState(0)
  const [exportOpen, setExportOpen] = useState(false)
  const [modal, setModal] = useState(false)
  const resumen = useDatos(fetchResumen, { usuarios: 0, roles: 0, permisos: 0, hospitales: 0, config: 0 })
  const permisos = useDatos(fetchRolPermisos, [] as RolPermiso[])
  const r = resumen.datos
  const v = (n: number) => (resumen.cargando ? '…' : num(n))

  return (
    <div>
      <PageHeader
        icon={Settings}
        title="Administración"
        subtitle="Gestión de usuarios, roles, hospitales y configuraciones básicas de la plataforma"
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

      {supabaseConfigurado ? (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_0.97fr_1fr_1fr]">
          <Kpi icon={User} tone="blue" value={v(r.usuarios)} label="Usuarios registrados" sub={r.usuarios ? 'Cuentas en la plataforma' : 'Sin datos aún'} />
          <Kpi icon={Users} tone="blue" value={v(r.roles)} label="Roles de usuario" sub={`${num(r.permisos)} permisos`} />
          <Kpi icon={Building2} tone="blue" value={v(r.hospitales)} label="Hospitales activos" sub={r.hospitales ? 'Con estado activo' : 'Sin datos aún'} />
          <Kpi icon={Settings} tone="blue" value={v(r.config)} label="Configuraciones del sistema" sub="Parámetros guardados" />
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_0.97fr_1fr_1fr]">
          <Kpi icon={User} tone="blue" value="842" label="Usuarios registrados" sub="6% vs. mes anterior" trend="up" />
          <Kpi icon={Users} tone="blue" value="12" label="Roles de usuario" sub="78 permisos" />
          <Kpi icon={Building2} tone="blue" value="128" label="Hospitales activos" sub="4 nuevos este mes" trend="up" />
          <Kpi icon={Settings} tone="blue" value="6" label="Configuraciones del sistema" sub="Operativas" />
        </div>
      )}

      <div className="card mb-4 px-3">
        <Tabs size="md" active={tab} onChange={setTab} className="border-b-0"
          tabs={[{ label: 'Usuarios', icon: User }, { label: 'Roles y permisos', icon: Lock }, { label: 'Hospitales', icon: Building2 }, { label: 'Configuración general', icon: Settings }]} />
      </div>

      {tab === 0 && (supabaseConfigurado ? <UsuariosTabReal onNew={() => setModal(true)} permisos={permisos.datos} /> : <UsuariosTab onNew={() => setModal(true)} />)}
      {tab === 1 && (supabaseConfigurado
        ? <RolesTabReal permisos={permisos.datos} cargando={permisos.cargando} error={permisos.error} recargar={permisos.recargar} />
        : <RolesTab />)}
      {tab === 2 && (supabaseConfigurado ? <HospitalesTabReal /> : <HospitalesTab />)}
      {tab === 3 && <ConfigTab />}

      {supabaseConfigurado
        ? <NuevoUsuarioInfoModal open={modal} onClose={() => setModal(false)} />
        : <NuevoUsuarioModal open={modal} onClose={() => setModal(false)} />}
    </div>
  )
}
