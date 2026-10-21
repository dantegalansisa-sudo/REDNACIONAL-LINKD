import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ClipboardList, FilePlus2, FileText, Home, Megaphone, Repeat, User, Users } from 'lucide-react'
import PortalLayout, { type PortalConfig } from '../../layouts/PortalLayout'
import { clsx } from '../../components/ui'
import { lsGet, lsSet } from '../patient/PatientPortal'
import { RequiereSesion, useSesion } from '../../lib/session'
import { supabaseConfigurado, urlArchivo } from '../../lib/api'

export type DoctorRole = 'radiologo' | 'referidor'
const ROLE_KEY = 'rns-medico-rol'

/** Lee el rol del médico desde localStorage (por defecto: radiólogo) */
export function getDoctorRole(): DoctorRole {
  return lsGet(ROLE_KEY) === 'referidor' ? 'referidor' : 'radiologo'
}

type Ctx = { role: DoctorRole; setRole: (r: DoctorRole) => void }
const RoleContext = createContext<Ctx>({ role: 'radiologo', setRole: () => {} })

/** Hook para que las páginas del portal conozcan (y cambien) el rol actual */
export function useDoctorRole() {
  return useContext(RoleContext)
}

export const DOCTORS = {
  radiologo: {
    name: 'Dr. Carlos Andrés Méndez Rodríguez', first: 'Carlos', code: 'RAD-001', exequatur: '12345', photo: '/img/crops/dr-carlos.webp',
    specialty: 'Médico radiólogo', email: 'cmendez@rednacionalsalud.com', phone: '809-555-2020',
  },
  referidor: {
    name: 'Dr. Luis Fernando González Santana', first: 'Luis', code: 'MR-000156', exequatur: '45678', photo: '/img/crops/dr-luis.webp',
    specialty: 'Medicina Interna · Médico referidor', email: 'lgonzalez@rednacionalsalud.com', phone: '809-555-1098',
  },
} as const

type DoctorInfo = { name: string; first: string; code: string; exequatur: string; photo: string | null; specialty: string; email: string; phone: string }

/** Datos del médico conectado (con Supabase) o del médico de demostración */
export function useDoctorInfo(): DoctorInfo {
  const { role } = useDoctorRole()
  const m = useSesion().sesion?.medico
  const [foto, setFoto] = useState<string | null>(null)
  useEffect(() => {
    if (m?.foto_path) urlArchivo('fotos-perfil', m.foto_path).then(setFoto).catch(() => setFoto(null))
  }, [m?.foto_path])
  if (!m) return DOCTORS[role]
  return {
    name: `${m.tratamiento} ${m.nombre_completo}`, first: m.nombres.split(' ')[0], code: m.codigo, exequatur: m.exequatur, photo: foto,
    specialty: m.tipo === 'radiologo' ? 'Médico radiólogo' : `${m.especialidades.join(', ') || 'Médico'} · Médico referidor`,
    email: m.correo, phone: m.tel_whatsapp ?? '—',
  }
}

function buildConfig(role: DoctorRole, info?: DoctorInfo): PortalConfig {
  const base = { home: '/medico', profilePath: '/medico/perfil', logoutPath: '/medico/login' }
  if (role === 'radiologo') {
    return {
      ...base,
      topLinks: [
        { to: '/medico', label: 'Inicio', end: true },
        { to: '/medico/lista-de-trabajo', label: 'Lista de trabajo' },
        { to: '/medico/informes', label: 'Informes' },
        { to: '/medico/convocatorias', label: 'Convocatorias' },
        { to: '/medico/perfil', label: 'Mi perfil' },
      ],
      side: [
        { to: '/medico', label: 'Resumen', icon: Home, end: true },
        { to: '/medico/lista-de-trabajo', label: 'Lista de trabajo', icon: ClipboardList },
        { to: '/medico/informes', label: 'Informes', icon: FileText },
        { to: '/medico/hospitales', label: 'Hospitales', icon: Building2 },
        { to: '/medico/convocatorias', label: 'Convocatorias', icon: Megaphone },
        { to: '/medico/perfil', label: 'Mi perfil', icon: User },
      ],
      user: { name: (info ?? DOCTORS.radiologo).name, code: `${(info ?? DOCTORS.radiologo).code} / Exequátur ${(info ?? DOCTORS.radiologo).exequatur}` },
    }
  }
  return {
    ...base,
    topLinks: [
      { to: '/medico', label: 'Inicio', end: true },
      { to: '/medico/pacientes', label: 'Mis pacientes' },
      { to: '/medico/solicitudes', label: 'Solicitudes' },
      { to: '/medico/hospitales', label: 'Hospitales' },
      { to: '/medico/perfil', label: 'Mi perfil' },
    ],
    side: [
      { to: '/medico', label: 'Resumen', icon: Home, end: true },
      { to: '/medico/pacientes', label: 'Mis pacientes', icon: Users },
      { to: '/medico/solicitudes', label: 'Solicitudes', icon: FilePlus2 },
      { to: '/medico/hospitales', label: 'Hospitales', icon: Building2 },
      { to: '/medico/perfil', label: 'Mi perfil', icon: User },
    ],
    user: { name: (info ?? DOCTORS.referidor).name, code: (info ?? DOCTORS.referidor).code },
  }
}

/** Selector de rol para modo demostración */
export function RoleSwitcher({ className }: { className?: string }) {
  const { role, setRole } = useDoctorRole()
  const navigate = useNavigate()
  if (supabaseConfigurado) return null
  const change = (r: DoctorRole) => { if (r !== role) { setRole(r); navigate('/medico') } }
  return (
    <div className={clsx('inline-flex items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/60 px-2.5 py-1.5', className)}>
      <span className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-brand-700"><Repeat size={14} /> Demo</span>
      <div className="flex rounded-lg bg-white p-0.5 shadow-sm">
        {([['radiologo', 'Radiólogo'], ['referidor', 'Referidor']] as const).map(([r, l]) => (
          <button key={r} onClick={() => change(r)}
            className={clsx('rounded-md px-3 py-1 text-[12.5px] font-semibold transition', role === r ? 'bg-brand-600 text-white' : 'text-ink/70 hover:text-ink')}>
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Aviso para páginas que no aplican al rol actual */
export function RoleNotice({ needed }: { needed: DoctorRole }) {
  const { setRole } = useDoctorRole()
  return (
    <div className="card mx-auto mt-8 max-w-[520px] p-8 text-center">
      <p className="text-[18px] font-bold text-navy-800">Sección disponible para el perfil de {needed === 'radiologo' ? 'médico radiólogo' : 'médico referidor'}</p>
      <p className="mt-1 text-[13.5px] text-slate-600">Tu sesión actual corresponde a otro perfil.{!supabaseConfigurado && ' En modo demostración puedes cambiar de rol.'}</p>
      {!supabaseConfigurado && <button onClick={() => setRole(needed)} className="btn-primary mt-4">Cambiar a {needed === 'radiologo' ? 'radiólogo' : 'referidor'}</button>}
    </div>
  )
}

function PortalMedico() {
  const tipoReal = useSesion().sesion?.medico?.tipo
  const [roleDemo, setRoleState] = useState<DoctorRole>(getDoctorRole)
  // Con Supabase el rol lo define la cuenta del médico; en demostración se puede cambiar
  const role = tipoReal ?? roleDemo
  const setRole = (r: DoctorRole) => { if (tipoReal) return; lsSet(ROLE_KEY, r); setRoleState(r) }
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <PortalConInfo role={role} />
    </RoleContext.Provider>
  )
}

function PortalConInfo({ role }: { role: DoctorRole }) {
  const info = useDoctorInfo()
  return <PortalLayout config={buildConfig(role, info)} />
}

export default function DoctorPortal() {
  return (
    <RequiereSesion roles={['radiologo', 'referidor']} login="/medico/login">
      <PortalMedico />
    </RequiereSesion>
  )
}
