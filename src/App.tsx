import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'

const Home = lazy(() => import('./pages/public/Home'))
const About = lazy(() => import('./pages/public/About'))
const Services = lazy(() => import('./pages/public/Services'))
const Stats = lazy(() => import('./pages/public/Stats'))
const Contact = lazy(() => import('./pages/public/Contact'))
const PatientLogin = lazy(() => import('./pages/public/PatientLogin'))
const DoctorLogin = lazy(() => import('./pages/public/DoctorLogin'))
const AdminLogin = lazy(() => import('./pages/public/AdminLogin'))
const CrearClave = lazy(() => import('./pages/public/CrearClave'))

const PatientPortal = lazy(() => import('./pages/patient/PatientPortal'))
const PResumen = lazy(() => import('./pages/patient/Resumen'))
const PEstudios = lazy(() => import('./pages/patient/Estudios'))
const PHospitales = lazy(() => import('./pages/patient/Hospitales'))
const PMedicos = lazy(() => import('./pages/patient/Medicos'))
const PHistoria = lazy(() => import('./pages/patient/Historia'))
const PCitas = lazy(() => import('./pages/patient/Citas'))
const PPerfil = lazy(() => import('./pages/patient/Perfil'))

const DoctorPortal = lazy(() => import('./pages/doctor/DoctorPortal'))
const DResumen = lazy(() => import('./pages/doctor/Resumen'))
const DWorklist = lazy(() => import('./pages/doctor/Worklist'))
const DInformes = lazy(() => import('./pages/doctor/Informes'))
const DPacientes = lazy(() => import('./pages/doctor/Pacientes'))
const DSolicitudes = lazy(() => import('./pages/doctor/Solicitudes'))
const DHospitales = lazy(() => import('./pages/doctor/Hospitales'))
const DConvocatorias = lazy(() => import('./pages/doctor/Convocatorias'))
const DPerfil = lazy(() => import('./pages/doctor/Perfil'))

const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Hospitales = lazy(() => import('./pages/admin/Hospitales'))
const LinkConnect = lazy(() => import('./pages/admin/LinkConnect'))
const Radiologos = lazy(() => import('./pages/admin/Radiologos'))
const Convocatorias = lazy(() => import('./pages/admin/Convocatorias'))
const Asignaciones = lazy(() => import('./pages/admin/Asignaciones'))
const Estudios = lazy(() => import('./pages/admin/Estudios'))
const Informes = lazy(() => import('./pages/admin/Informes'))
const Pacientes = lazy(() => import('./pages/admin/Pacientes'))
const Referidores = lazy(() => import('./pages/admin/Referidores'))
const Analitica = lazy(() => import('./pages/admin/Analitica'))
const Operaciones = lazy(() => import('./pages/admin/Operaciones'))
const Seguridad = lazy(() => import('./pages/admin/Seguridad'))
const Administracion = lazy(() => import('./pages/admin/Administracion'))
const Configuracion = lazy(() => import('./pages/admin/Configuracion'))
const Auditoria = lazy(() => import('./pages/admin/Auditoria'))
const Reportes = lazy(() => import('./pages/admin/Reportes'))

function Loader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Sitio público */}
        <Route path="/" element={<Home />} />
        <Route path="/registro/medico" element={<Home modal="medico" />} />
        <Route path="/registro/paciente" element={<Home modal="paciente" />} />
        <Route path="/sobre-el-proyecto" element={<About />} />
        <Route path="/servicios" element={<Services />} />
        <Route path="/estadisticas" element={<Stats />} />
        <Route path="/contacto" element={<Contact />} />

        {/* Portal del paciente */}
        <Route path="/paciente/login" element={<PatientLogin />} />
        <Route path="/paciente" element={<PatientPortal />}>
          <Route index element={<PResumen />} />
          <Route path="estudios" element={<PEstudios />} />
          <Route path="hospitales" element={<PHospitales />} />
          <Route path="medicos" element={<PMedicos />} />
          <Route path="historia" element={<PHistoria />} />
          <Route path="citas" element={<PCitas />} />
          <Route path="perfil" element={<PPerfil />} />
        </Route>

        {/* Portal del médico (radiólogo / referidor) */}
        <Route path="/medico/login" element={<DoctorLogin />} />
        <Route path="/medico/crear-clave" element={<CrearClave />} />
        <Route path="/medico" element={<DoctorPortal />}>
          <Route index element={<DResumen />} />
          <Route path="lista-de-trabajo" element={<DWorklist />} />
          <Route path="informes" element={<DInformes />} />
          <Route path="pacientes" element={<DPacientes />} />
          <Route path="solicitudes" element={<DSolicitudes />} />
          <Route path="hospitales" element={<DHospitales />} />
          <Route path="convocatorias" element={<DConvocatorias />} />
          <Route path="perfil" element={<DPerfil />} />
        </Route>

        {/* Panel de administración */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="hospitales" element={<Hospitales />} />
          <Route path="linkconnect" element={<LinkConnect />} />
          <Route path="radiologos" element={<Radiologos />} />
          <Route path="convocatorias" element={<Convocatorias />} />
          <Route path="asignaciones" element={<Asignaciones />} />
          <Route path="estudios" element={<Estudios />} />
          <Route path="informes" element={<Informes />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="referidores" element={<Referidores />} />
          <Route path="analitica" element={<Analitica />} />
          <Route path="operaciones" element={<Operaciones />} />
          <Route path="seguridad" element={<Seguridad />} />
          <Route path="administracion" element={<Administracion />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="auditoria" element={<Auditoria />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
