import { useState } from 'react'
import { Building2, Clock, Mail, MapPin, Phone, Server, Wifi } from 'lucide-react'
import { Badge, InfoRow, Modality, clsx } from '../../components/ui'
import { PortalHeading } from '../patient/PatientPortal'
import { useDoctorRole } from './DoctorPortal'

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
  const [sel, setSel] = useState(0)
  const h = HOSPITALS[sel]
  const rad = role === 'radiologo'

  return (
    <div>
      <PortalHeading icon={Building2} title="Hospitales" subtitle={rad ? 'Hospitales de la red a los que estás asignado para lectura de estudios.' : 'Hospitales de la red donde refieres a tus pacientes.'} />
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        {HOSPITALS.map((x, i) => (
          <button key={x.name} onClick={() => setSel(i)} className={clsx('card overflow-hidden text-left transition', i === sel ? '!border-brand-500 ring-2 ring-brand-100' : 'hover:border-brand-200')}>
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
            <Badge tone="green">{rad ? 'Asignado' : 'Hospital de la red'}</Badge>
          </div>
          <p className="mb-3 text-[13px] text-slate-500">{h.region} · En la red desde {h.since}</p>
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
              <InfoRow label="Modalidades"><span className="flex flex-wrap gap-1">{h.mods.map((m) => <Modality key={m} m={m} />)}</span></InfoRow>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 self-start lg:grid-cols-1">
          {(rad
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
    </div>
  )
}
