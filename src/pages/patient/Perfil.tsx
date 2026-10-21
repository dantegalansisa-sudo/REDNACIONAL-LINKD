import { useState, type ReactNode } from 'react'
import { CheckCircle2, Home, Laptop, Mail, MessageCircle, Pencil, Phone, Save, Shield, ShieldCheck, Smartphone, User, UserRound, type LucideIcon } from 'lucide-react'
import { Badge, InfoRow, Toggle, UserSilhouette } from '../../components/ui'
import { ChangePasswordForm, PortalHeading } from './PatientPortal'

function Card({ icon: Icon, title, action, children }: { icon: LucideIcon; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card min-w-0">
      <div className="card-head border-b border-[#eef2f8] !pb-3">
        <h3 className="card-title"><Icon size={18} className="text-brand-600" /> {title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

type Editable = Record<string, string>

function EditableCard({ icon, title, fields, initial }: { icon: LucideIcon; title: string; fields: { key: string; label: string; type?: string }[]; initial: Editable }) {
  const [edit, setEdit] = useState(false)
  const [data, setData] = useState(initial)
  const [draft, setDraft] = useState(initial)
  const [saved, setSaved] = useState(false)
  return (
    <Card icon={icon} title={title} action={!edit && <button onClick={() => { setDraft(data); setEdit(true); setSaved(false) }} className="btn-ghost !px-2.5 !py-1 !text-[12.5px]"><Pencil size={14} /> Editar</button>}>
      {edit ? (
        <form onSubmit={(e) => { e.preventDefault(); setData(draft); setEdit(false); setSaved(true) }} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input type={f.type ?? 'text'} className="input" value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEdit(false)} className="btn-outline">Cancelar</button>
            <button className="btn-primary"><Save size={15} /> Guardar cambios</button>
          </div>
        </form>
      ) : (
        <>
          {fields.map((f) => <InfoRow key={f.key} label={f.label}>{data[f.key] || '—'}</InfoRow>)}
          {saved && <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-700"><CheckCircle2 size={16} /> Cambios guardados correctamente.</p>}
        </>
      )}
    </Card>
  )
}

const SESSIONS = [
  { icon: Smartphone, device: 'Celular · Chrome / Android', place: 'Santo Domingo · 186.21.45.78', when: 'Sesión actual', current: true },
  { icon: Laptop, device: 'PC · Edge / Windows', place: 'Santo Domingo · 201.200.15.33', when: '10/03/2025 07:15 p. m.', current: false },
]

export default function Perfil() {
  const [twoFA, setTwoFA] = useState(false)
  const [alerts, setAlerts] = useState(true)
  return (
    <div>
      <PortalHeading icon={User} title="Mi perfil" subtitle="Administra tus datos personales, de contacto y la seguridad de tu cuenta." />

      <section className="card mb-4 flex flex-col items-center gap-5 p-5 sm:flex-row">
        <UserSilhouette size={110} />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="text-[24px] font-bold text-navy-800">Juan Pérez Gómez</h2>
          <p className="text-[16px] font-semibold text-brand-700">HN-00012345</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Badge tone="green" icon>Cuenta activa</Badge>
            <Badge tone="blue">Paciente desde 15/01/2023</Badge>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[['8', 'Estudios'], ['3', 'Hospitales'], ['12', 'Accesos']].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-brand-50 px-4 py-2.5"><p className="text-[22px] font-bold text-navy-800">{v}</p><p className="text-[12px] text-brand-800/80">{l}</p></div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card icon={UserRound} title="Datos personales">
          <InfoRow label="Nombre completo">Juan Pérez Gómez</InfoRow>
          <InfoRow label="Cédula">001-1567890-1</InfoRow>
          <InfoRow label="Fecha de nacimiento">12/05/1980 (45 años)</InfoRow>
          <InfoRow label="Sexo">Masculino</InfoRow>
          <InfoRow label="Nacionalidad">Dominicana</InfoRow>
          <InfoRow label="Seguro médico">SENASA · Contributivo</InfoRow>
          <p className="mt-3 text-[12px] text-slate-500">Para corregir datos de identidad, acude al área de admisión de cualquier hospital de la red con tu cédula.</p>
        </Card>

        <EditableCard icon={Phone} title="Contacto"
          fields={[{ key: 'phone', label: 'Teléfono', type: 'tel' }, { key: 'wa', label: 'WhatsApp', type: 'tel' }, { key: 'mail', label: 'Correo electrónico', type: 'email' }, { key: 'alt', label: 'Teléfono alternativo', type: 'tel' }]}
          initial={{ phone: '809-555-1234', wa: '809-555-1234', mail: 'juan.perez@correo.com', alt: '' }} />

        <EditableCard icon={Home} title="Dirección"
          fields={[{ key: 'street', label: 'Calle y número' }, { key: 'sector', label: 'Sector' }, { key: 'city', label: 'Municipio' }, { key: 'prov', label: 'Provincia' }]}
          initial={{ street: 'C/ Duarte #45, Apto. 2B', sector: 'Ensanche La Fe', city: 'Santo Domingo de Guzmán', prov: 'Distrito Nacional' }} />

        <EditableCard icon={MessageCircle} title="Contacto de emergencia"
          fields={[{ key: 'name', label: 'Nombre' }, { key: 'rel', label: 'Parentesco' }, { key: 'phone', label: 'Teléfono', type: 'tel' }, { key: 'mail', label: 'Correo', type: 'email' }]}
          initial={{ name: 'María Gómez de Pérez', rel: 'Esposa', phone: '809-555-7788', mail: 'maria.gomez@correo.com' }} />
      </div>

      <section className="card mt-4">
        <div className="card-head border-b border-[#eef2f8] !pb-3">
          <h3 className="card-title"><Shield size={18} className="text-brand-600" /> Seguridad</h3>
          <Badge tone="green" icon>Contraseña establecida</Badge>
        </div>
        <div className="grid gap-6 p-4 lg:grid-cols-[1.2fr_1fr] lg:p-5">
          <div>
            <h4 className="mb-3 text-[15px] font-bold text-navy-800">Cambiar contraseña</h4>
            <ChangePasswordForm />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-[#e6edf8] p-4">
              <div className="flex items-center justify-between gap-3">
                <div><p className="flex items-center gap-2 text-[14px] font-semibold text-ink"><ShieldCheck size={17} className="text-brand-600" /> Verificación en dos pasos</p><p className="text-[12.5px] text-slate-500">Recibe un código por WhatsApp al iniciar sesión.</p></div>
                <Toggle on={twoFA} onChange={setTwoFA} />
              </div>
            </div>
            <div className="rounded-xl border border-[#e6edf8] p-4">
              <div className="flex items-center justify-between gap-3">
                <div><p className="flex items-center gap-2 text-[14px] font-semibold text-ink"><Mail size={17} className="text-brand-600" /> Alertas de acceso</p><p className="text-[12.5px] text-slate-500">Te avisamos si se inicia sesión desde un dispositivo nuevo.</p></div>
                <Toggle on={alerts} onChange={setAlerts} />
              </div>
            </div>
            <div className="rounded-xl border border-[#e6edf8] p-4">
              <p className="mb-2 text-[14px] font-semibold text-ink">Sesiones activas</p>
              {SESSIONS.map((s) => (
                <div key={s.device} className="flex items-center gap-3 border-b border-[#eef2f8] py-2 last:border-0">
                  <s.icon size={20} className="text-brand-700" />
                  <div className="min-w-0 flex-1 text-[12.5px]"><p className="font-medium text-ink">{s.device}</p><p className="text-slate-500">{s.place} · {s.when}</p></div>
                  {s.current ? <Badge tone="green">Actual</Badge> : <button className="text-[12px] font-semibold text-red-600 hover:underline">Cerrar</button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
