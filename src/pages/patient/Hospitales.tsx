import { useState } from 'react'
import { Building2, Calendar, Clock, ExternalLink, FileText, Mail, MapPin, Navigation, Phone, Stethoscope } from 'lucide-react'
import { Badge, InfoRow, Modality, clsx } from '../../components/ui'
import { PortalHeading, STUDIES } from './PatientPortal'

const HOSPITALS = [
  {
    name: 'Hospital Hugo Mendoza', short: 'Hosp. Hugo Mendoza', city: 'Santo Domingo, Distrito Nacional', last: '15/03/2025',
    address: 'Av. Hermanas Mirabal, Villa Mella, Santo Domingo Norte', phone: '809-568-2525', email: 'contacto@hhm.gob.do',
    type: 'Hospital pediátrico y general · Tercer nivel', hours: 'Imágenes: lunes a domingo, 24 horas', img: '/img/crops/hospital-hugo.webp',
    services: ['Tomografía', 'Rayos X', 'Ecografía', 'Mamografía', 'Emergencias'],
  },
  {
    name: 'Hospital General', short: 'Hospital General', city: 'Santo Domingo, Distrito Nacional', last: '02/03/2025',
    address: 'Av. Ortega y Gasset esq. Pepillo Salcedo, Ensanche La Fe', phone: '809-562-4040', email: 'info@hospitalgeneral.gob.do',
    type: 'Hospital general · Tercer nivel', hours: 'Imágenes: lunes a sábado, 7:00 a. m. – 9:00 p. m.', img: '/img/banner-hospital.webp',
    services: ['Rayos X', 'Resonancia magnética', 'Ecografía', 'Laboratorio'],
  },
  {
    name: 'Hospital Dr. Francisco A. Gonzalvo', short: 'Hospital Dr. Francisco A. Gonzalvo', city: 'Santiago de los Caballeros', last: '28/01/2025',
    address: 'Calle del Sol #120, Centro Ciudad, Santiago', phone: '809-582-3030', email: 'citas@hfag.gob.do',
    type: 'Hospital regional · Segundo nivel', hours: 'Imágenes: lunes a viernes, 7:00 a. m. – 7:00 p. m.', img: '/img/paciente-sala.webp',
    services: ['Tomografía', 'Resonancia magnética', 'Ecografía', 'Rayos X'],
  },
]

export default function Hospitales() {
  const [sel, setSel] = useState(0)
  const h = HOSPITALS[sel]
  const studies = STUDIES.filter((s) => s.hospital === h.short)

  return (
    <div>
      <PortalHeading icon={Building2} title="Hospitales" subtitle="Centros de salud de la red donde te has realizado estudios." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,400px)_1fr]">
        <div className="min-w-0 space-y-3">
          {HOSPITALS.map((x, i) => (
            <button key={x.name} onClick={() => setSel(i)}
              className={clsx('card flex w-full items-center gap-3 p-4 text-left transition', i === sel ? '!border-brand-500 ring-2 ring-brand-100' : 'hover:border-brand-200')}>
              <span className={clsx('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', i === sel ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700')}><Building2 size={24} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold text-navy-800">{x.name}</span>
                <span className="flex items-center gap-1.5 truncate text-[12.5px] text-slate-600"><MapPin size={13} /> {x.city}</span>
                <span className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-500"><Calendar size={13} /> Última visita: {x.last}</span>
              </span>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11.5px] font-semibold text-brand-700">{STUDIES.filter((s) => s.hospital === x.short).length} estudios</span>
            </button>
          ))}
        </div>

        <section className="card min-w-0 overflow-hidden">
          <div className="relative h-48 sm:h-56">
            <img src={h.img} alt={h.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <Badge tone="green" className="!bg-emerald-500 !text-white">Hospital de la red</Badge>
              <h2 className="mt-1.5 text-[22px] font-bold text-white sm:text-[26px]">{h.name}</h2>
              <p className="text-[13px] text-white/85">{h.type}</p>
            </div>
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-[15px] font-bold text-navy-800">Información de contacto</h3>
              <InfoRow label={<span className="flex items-center gap-1.5"><MapPin size={14} /> Dirección</span>}>{h.address}</InfoRow>
              <InfoRow label={<span className="flex items-center gap-1.5"><Navigation size={14} /> Ciudad</span>}>{h.city}</InfoRow>
              <InfoRow label={<span className="flex items-center gap-1.5"><Phone size={14} /> Teléfono</span>}>{h.phone}</InfoRow>
              <InfoRow label={<span className="flex items-center gap-1.5"><Mail size={14} /> Correo</span>}>{h.email}</InfoRow>
              <InfoRow label={<span className="flex items-center gap-1.5"><Clock size={14} /> Horario</span>}>{h.hours}</InfoRow>
              <h3 className="mb-2 mt-5 flex items-center gap-2 text-[15px] font-bold text-navy-800"><Stethoscope size={17} className="text-brand-600" /> Servicios disponibles</h3>
              <div className="flex flex-wrap gap-2">{h.services.map((s) => <span key={s} className="rounded-full bg-brand-50 px-3 py-1 text-[12.5px] text-brand-700">{s}</span>)}</div>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href={`tel:${h.phone}`} className="btn-primary"><Phone size={16} /> Llamar</a>
                <button className="btn-outline"><ExternalLink size={16} /> Cómo llegar</button>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-[15px] font-bold text-navy-800">Mis estudios en este centro</h3>
              <div className="space-y-2">
                {studies.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg border border-[#e6edf8] p-2.5">
                    <img src={s.img} alt="" className="h-12 w-12 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink">{s.name}</p>
                      <p className="text-[12px] text-slate-500">{s.date} · {s.region}</p>
                    </div>
                    <Modality m={s.mod} />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-brand-50 p-3 text-[12.5px] text-brand-800">
                <FileText size={18} className="shrink-0" /> Tus informes de este centro están disponibles en la sección «Mis estudios».
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
