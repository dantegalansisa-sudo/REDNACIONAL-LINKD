# RedNacionalSalud.do

Plataforma de la Red Nacional de Salud Dominicana: sitio público, registro de médicos (radiólogo / referidor) y pacientes, portal del paciente, portal del médico y panel de administración.

**Fase 1 (actual):** interfaces completas con datos simulados. La integración con base de datos, correos y WhatsApp está descrita en [docs/PLAN-PRODUCCION.md](docs/PLAN-PRODUCCION.md).

## Stack
React 19 · TypeScript · Vite · Tailwind CSS 3 · React Router · lucide-react (gráficos en SVG propio, sin dependencias pesadas).

## Desarrollo
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
Despliegue en Vercel: importar el repositorio, framework **Vite**, comando `npm run build`, carpeta `dist`. `vercel.json` ya redirige las rutas al SPA.

## Rutas principales
| Área | Ruta |
|------|------|
| Inicio | `/` |
| Registro de médico / paciente | `/registro/medico`, `/registro/paciente` |
| Sobre el proyecto, Servicios, Estadísticas, Contacto | `/sobre-el-proyecto`, `/servicios`, `/estadisticas`, `/contacto` |
| Portal del paciente | `/paciente/login` → `/paciente` |
| Portal del médico | `/medico/login` → `/medico` |
| Panel de administración | `/admin/login` → `/admin` (17 módulos) |

### Datos de prueba (demo)
- **Paciente:** usuario `RNS-00012345`, clave cualquier valor de 6+ caracteres. El primer acceso pide crear una contraseña nueva.
- **Médico:** elegir Radiólogo o Referidor, cualquier usuario y contraseña de 6+ caracteres. En el portal hay un selector "DEMO" para cambiar de rol.
- **Admin:** cualquier usuario y contraseña de 6+ caracteres, luego un código de 6 dígitos (2FA simulado).
- **Registro de médico:** cualquier exequátur de 4+ dígitos autocompleta los datos.
- **Registro de paciente:** cualquier cédula de 11 dígitos.

## Estructura
```
src/
  components/   ui.tsx (componentes), charts.tsx (gráficos), Logo.tsx
  config/       brand.ts (nombre, dominio, soporte)
  data/         geo.ts (provincias, regiones, especialidades)
  layouts/      PublicLayout, PortalLayout, AdminLayout
  pages/        public/ patient/ doctor/ admin/
public/img/     fotos, logos y recortes de las maquetas
```
