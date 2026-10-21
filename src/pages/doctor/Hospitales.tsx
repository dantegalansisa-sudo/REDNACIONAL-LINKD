import { useState } from 'react'
import { Building2, Clock, Mail, MapPin, Phone, Server, Wifi } from 'lucide-react'
import { Badge, InfoRow, Modality, clsx } from '../../components/ui'
import { PortalHeading } from '../patient/PatientPortal'
import { useDoctorRole } from './DoctorPortal'
import { useSesion } from '../../lib/session'
import {
  fetchMisHospitalesRadiologo, fetchMisHospitalesReferidor, supabaseConfigurado, useDatos, type HospitalAsignado,
} from '../../lib/portal-data'

type Hosp = (typeof HOSPITALS)[number] & { estado?: string }
const FOTO_GENERICA = '/img/banner-hospital.webp'

/** Hospital de la base → formato de la pantalla (las cifras de tiempo no existen aún en la base) */
const aHosp = (h: HospitalAsignado): Hosp => ({
  name: h.name, city: h.city || '—', region: h.region, img: FOTO_GENERICA, address: h.address, phone: h.phone, email: h.email, contact: h.contact,
  mods: h.mods, since: h.since, rad: { pending: h.pendientes, month: h.mes, tat: '—' }, ref: { sent: h.pendientes, results: h.mes }, pacs: h.pacs, estado: h.estado,
})

const HOSPITALS = [
  {
    name: 'Hospital Hugo Mendoza', city: 'Santo Domingo, Distrito Nacional', region: 'Región Ozama', img: '/img/crops/hospital-hugo.webp',
    address: 'Av. Hermanas Mirabal, Villa Mella, Santo Domingo Norte', phone: '809-568-2525', email: 'imagenes@hhm.gob.do', contact: 'Lic. Ramona Castillo · Coordinadora de Imágenes',
    mods: ['CT', 'RX', 'US', 'MG'], since: '01/2024', rad: { pending: 3, month: 412, tat: '34 min' }, ref: { sent: 96, results: 4 }, pacs: 'En línea',
  },
  {
    name: 'Hospital General', city: 'Santo Domingo, Distrito Nacional', region: 'Región Ozama', img: '/img/banner-hospital.webp',
    address: 'Av. Ortega y Gasset esq. Pepillo Salcedo, Ensanche La Fe', phone: '809-562-4040', email: 'radiologia@hospitalgeneral.gob.do', contact: 'Dr. Manuel Peralta · Jefe de Radiología',
    mods: ['RX', 'MR', 'US', 'MG'], since: '03/2024', rad: { pending: 3, month: 358, tat: '41 min' }, ref: { sent: 74, results: 3 }, pacs: 'En línea',
  },
  {
    name: 'Hospital Dr. Francisco A. Gonzalvo', city: 'Santiago de los Caballeros', region: 'Región Cibao Norte', img: '/img/paciente-sala.webp',
    address: 'Calle del Sol #120, Centro Ciudad, Santiago', phone: '809-582-3030', email: 'imagenes@hfag.gob.do', contact: 'Lic. Pedro Rosario · Coordinador de Imágenes',
    mods: ['CT', 'MR', 'US', 'RX'], since: '06/2024', rad: { pending: 2, month: 276, tat: '39 min' }, ref: { sent: 44, results: 2 }, pacs: 'Sincronizando',
  },
]

export default function Hospitales() {
  const { role } = useDoctorRole()
  const m = useSesion().sesion?.medico
  const { datos, cargando, error, recargar } = useDatos<HospitalAsignado[]>(
    () => (!m ? Promise.resolve([]) : m.tipo === 'radiologo' ? fetchMisHospitalesRadiologo(m.id) : fetchMisHospitalesReferidor(m.id)), [], [m?.id, m?.tipo])
  const real = supabaseConfigurado
  const [sel, setSel] = useState(0)
  const lista: Hosp[] = real ? datos.map(aHosp) : HOSPITALS
  const h: Hosp | undefined = lista[sel] ?? lista[0]
  const rad = role === 'radiologo'

  return (
    <div>
      <PortalHeading icon={Building2} title="Hospitales" subtitle={rad ? 'Hospitales de la red a los que estás asignado para lectura de estudios.' : 'Hospitales de la red donde refieres a tus pacientes.'} />
      {real && lista.length === 0 && (
        <section className="card p-8 text-center">
          <Building2 size={40} className="mx-auto text-brand-300" />
          {cargando ? <p className="mt-2 text-[14px] text-slate-500">Cargando hospitales…</p>
            : error ? <p className="mt-2 text-[14px] text-red-600">No se pudieron cargar los hospitales: {error} <button onClick={recargar} className="ml-1 font-semibold text-brand-600 hover:underline">Reintentar</button></p>
              : <>
                <p className="mt-2 text-[16px] font-bold text-navy-800">{rad ? 'Aún no tienes hospitales asignados' : 'Aún no has referido pacientes a hospitales de la red'}</p>
                <p className="mt-1 text-[13px] text-slate-500">{rad ? 'Cuando el SNS te asigne hospitales para lectura aparecerán aquí.' : 'Los hospitales aparecerán aquí cuando envíes solicitudes de estudio.'}</p>
              </>}
        </section>
      )}
      {h && <>
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        {lista.map((x, i) => (
          <button key={x.name} onClick={() => setSel(i)} className={clsx('card overflow-hidden text-left transition', x === h ? '!border-brand-500 ring-2 ring-brand-100' : 'hover:border-brand-200')}>
            <img src={x.img} alt="" className="h-28 w-full object-cover" />
            <div className="p-4">
              <p className="text-[15px] font-bold text-navy-800">{x.name}</p>
              <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600"><MapPin size={13} /> {x.city}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {x.mods.map((m) => <Modality key={m} m={m} />)}
                <span className="ml-auto text-[12px] font-semibold text-brand-700">{rad ? `${x.rad.pending} pendientes` : `${x.ref.sent} referencias`}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <section className="card grid min-w-0 gap-5 p-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[21px] font-bold text-navy-800">{h.name}</h2>
            <Badge tone={h.estado === 'pendiente' ? 'orange' : 'green'}>{rad ? (h.estado === 'pendiente' ? 'Asignación pendiente' : 'Asignado') : 'Hospital de la red'}</Badge>
          </div>
          <p className="mb-3 text-[13px] text-slate-500">{h.region} · {real && rad ? 'Asignado desde' : 'En la red desde'} {h.since}</p>
          <div className="grid gap-x-6 md:grid-cols-2">
            <div>
              <InfoRow label={<span className="flex items-center gap-1.5"><MapPin size={14} /> Dirección</span>}>{h.address}</InfoRow>
              <InfoRow label={<span className="flex items-center gap-1.5"><Phone size={14} /> Teléfono</span>}>{h.phone}</InfoRow>
              <InfoRow label={<span className="flex items-center gap-1.5"><Mail size={14} /> Correo</span>}>{h.email}</InfoRow>
            </div>
            <div>
              <InfoRow label="Contacto">{h.contact}</InfoRow>
              <InfoRow label={<span className="flex items-center gap-1.5"><Server size={14} /> PACS / LinkConnect</span>}>
                <span className={clsx('inline-flex items-center gap-1.5', h.pacs === 'En línea' ? 'text-emerald-600' : 'text-orange-500')}><Wifi size={14} /> {h.pacs}</span>
              </InfoRow>
              <InfoRow label="Modalidades"><span className="flex flex-wrap gap-1">{h.mods.length ? h.mods.map((x) => <Modality key={x} m={x} />) : '—'}</span></InfoRow>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 self-start lg:grid-cols-1">
          {(real
            ? rad
              ? [['Pendientes de lectura', String(h.rad.pending), 'text-orange-500'], ['Estudios recibidos este mes', String(h.rad.month), 'text-navy-800']]
              : [['Estudios referidos', String(h.ref.sent), 'text-navy-800'], ['Resultados disponibles', String(h.ref.results), 'text-emerald-600']]
            : rad
              ? [['Pendientes de lectura', String(h.rad.pending), 'text-orange-500'], ['Informes este mes', String(h.rad.month), 'text-navy-800'], ['Tiempo promedio', h.rad.tat, 'text-brand-600']]
              : [['Referencias enviadas', String(h.ref.sent), 'text-navy-800'], ['Resultados nuevos', String(h.ref.results), 'text-emerald-600'], ['Tiempo a resultado', '2.1 días', 'text-brand-600']]
          ).map(([l, v, c]) => (
            <div key={l} className="rounded-xl bg-[#f7faff] px-4 py-3">
              <p className={clsx('text-[22px] font-bold', c)}>{v}</p>
              <p className="flex items-center gap-1.5 text-[12.5px] text-slate-500"><Clock size={13} /> {l}</p>
            </div>
          ))}
        </div>
      </section>
      </>}
    </div>
  )
}
