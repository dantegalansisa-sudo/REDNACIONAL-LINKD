import { CircleHelp, Database, Hospital, ShieldCheck, Users } from 'lucide-react'
import { Modal } from '../../components/ui'
import { PartnersMark, RnsLogo } from '../../components/Logo'

const FEATURES = [
  { icon: Hospital, title: 'Red nacional', text: 'Conectando hospitales en todo el país' },
  { icon: Database, title: 'Gestión centralizada', text: 'Información integrada y segura' },
  { icon: Users, title: 'Mejores decisiones', text: 'Datos para una atención más eficiente' },
  { icon: ShieldCheck, title: 'Salud para todos', text: 'Tecnología al servicio de la gente' },
]

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-[860px]">
      <div className="flex items-center gap-4 border-b border-[#e6edf8] px-6 py-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30"><CircleHelp size={30} /></span>
        <div>
          <h2 className="text-[26px] font-bold leading-tight">Ayuda</h2>
          <p className="text-[15px] text-ink/80">Información sobre el proyecto y soporte</p>
        </div>
      </div>
      <div className="relative bg-gradient-to-br from-white via-[#f3f7ff] to-[#dfeaff] px-6 pb-6 pt-8 text-center">
        <PartnersMark className="mx-auto w-fit scale-[1.35] sm:scale-[1.6]" />
        <span className="mt-9 inline-block rounded-full bg-brand-600 px-8 py-1.5 text-[16px] font-semibold text-white">Versión 1.0</span>
        <p className="mx-auto mt-3 max-w-[560px] text-[16px] leading-snug text-ink">
          Este proyecto ha sido potenciado por la alianza entre <b>HDCO</b> y <b>LINKDICOM</b> para el Sistema Nacional de Salud (SNS)
          y la administración hospitalaria de la República Dominicana.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 md:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl bg-[#f3f7fe] p-4 text-center">
            <f.icon size={34} className="mx-auto text-brand-600" />
            <div className="mt-2 text-[14px] font-bold text-ink">{f.title}</div>
            <div className="text-[13px] text-ink/75">{f.text}</div>
          </div>
        ))}
      </div>
      <div className="mx-6 mb-5 flex flex-col items-center justify-between gap-4 border-t border-brand-200 pt-4 sm:flex-row">
        <RnsLogo className="h-14 w-auto" />
        <p className="border-brand-200 text-center text-[15px] text-ink sm:border-l sm:pl-8 sm:text-left">
          Una iniciativa para fortalecer<br className="hidden sm:block" /> la red hospitalaria del país.
        </p>
      </div>
    </Modal>
  )
}
