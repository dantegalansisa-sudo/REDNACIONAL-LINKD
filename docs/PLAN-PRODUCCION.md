# RedNacionalSalud.do — Qué falta para llevarlo a producción

Estado actual (Fase 1, terminada): **interfaces completas** (sitio público, registros de médico y paciente, portal del paciente, portal del médico, panel de administración con 17 módulos). Todo funciona con **datos simulados** en el navegador; ningún formulario guarda información todavía.

Este documento lista lo necesario para que la plataforma funcione de punta a punta.

---

## 1. Herramientas y servicios a contratar / configurar

| # | Necesidad | Recomendación | Alternativas | Notas |
|---|-----------|---------------|--------------|-------|
| 1 | **Base de datos** | **Supabase** (PostgreSQL administrado) | Neon, AWS RDS, PostgreSQL propio | Plan Pro o superior; región más cercana (us-east). Activar RLS (seguridad por fila). |
| 2 | **Autenticación y roles** | Supabase Auth | Auth0, Clerk, Keycloak | Roles: paciente, radiólogo, referidor, operador, coordinador, administrador. 2FA (TOTP) obligatorio para administradores. |
| 3 | **Almacenamiento de archivos** (fotos, títulos, exequátur, cédulas, informes PDF) | Supabase Storage (buckets privados) | AWS S3, Cloudflare R2 | URLs firmadas de corta duración; nunca públicas. |
| 4 | **Correos transaccionales** (registro recibido, cuenta aprobada, informe publicado, convocatorias) | **Resend** | SendGrid, Amazon SES, Brevo | Requiere configurar SPF, DKIM y DMARC en el DNS del dominio. |
| 5 | **WhatsApp** (código de paciente, aprobación de cuenta, recordatorios) | **WhatsApp Business Cloud API (Meta)** | Twilio, 360dialog | Verificar el negocio en Meta Business, número dedicado y **plantillas aprobadas** por Meta. |
| 6 | **Backend / API** | Supabase Edge Functions + funciones de Vercel | NestJS/Node en Railway, Render o AWS | Lógica: registros, aprobación, asignaciones, notificaciones, auditoría. |
| 7 | **Hosting del frontend** | **Vercel** | Netlify, Cloudflare Pages | Ya incluido `vercel.json` para las rutas. |
| 8 | **Dominio** | `rednacionalsalud.do` en **NIC.DO** | — | Apuntar DNS a Vercel; subdominios sugeridos: `admin.` y `api.` |
| 9 | **Imágenes médicas (DICOM)** | **Orthanc** (PACS) + **OHIF Viewer** (visor web) | dcm4chee, PACS comercial | Necesario para "Ver imágenes" real y el visor del radiólogo. Servidor propio o en la nube con buen almacenamiento. |
| 10 | **LINKConnect / interoperabilidad** | Servicio de LINKDICOM (HL7 v2 / DICOM / FHIR) | Mirth Connect | Envía los estudios de cada hospital al Repositorio Nacional. |
| 11 | **Validación de identidad** | Convenio con **JCE** (cédula) | Validación manual | El registro de paciente hoy simula esta consulta. |
| 12 | **Validación de exequátur** | Convenio con **MESCyT / MSP / SNS** | Carga y revisión manual | El registro de médico hoy simula el autocompletado. |
| 13 | **Monitoreo de errores** | Sentry | LogRocket | Alertas cuando algo falla en producción. |
| 14 | **Respaldos** | Backups diarios automáticos (Supabase PITR) | Snapshot propio | El panel ya muestra "Respaldo programado diario 02:00". |
| 15 | **Firma digital de informes** (opcional) | Certificado digital (INDOTEL / Avansi) | Firma simple con registro de auditoría | Para validez legal del informe radiológico. |

## 2. Estructura de base de datos (tablas principales)

- `usuarios` (id, rol, correo, teléfono, estado, 2fa, último acceso)
- `pacientes` (código RNS/HN, cédula/pasaporte, nombres, nacimiento, sexo, contacto, dirección, contacto de emergencia)
- `medicos` (tipo radiólogo/referidor, exequátur, especialidades, regiones de interés, foto, estado de aprobación)
- `documentos_medico` (tipo, archivo, estado de verificación)
- `hospitales` (código, nivel, provincia, municipio, servicios de imágenes, contactos, estado)
- `equipos` y `linkconnect` (servidor, IP, AETitle, puerto, estado, métricas)
- `estudios` (número de acceso, paciente, hospital, modalidad, prioridad, estado, radiólogo asignado, tiempos)
- `informes` (estudio, hallazgos, impresión, firma, estado, calificación)
- `referencias` / `solicitudes` (médico referidor → paciente → estudio)
- `asignaciones` (radiólogo ↔ hospital, modalidades, carga)
- `convocatorias` y `postulaciones` (requisitos, criterios, cronograma, notificaciones)
- `citas`
- `notificaciones` (canal correo/WhatsApp/portal, plantilla, estado de envío)
- `auditoria` (usuario, acción, módulo, registro afectado, IP, navegador, resultado)
- `configuracion` y catálogos (`provincias`, `municipios`, `sectores`, `especialidades`, `modalidades`)

## 3. Flujos a conectar (qué hace cada formulario cuando se integre)

1. **Registro de paciente** → validar cédula → crear paciente + usuario → generar código `RNS-XXXXXXXX` → enviar WhatsApp + correo con instrucciones → primer acceso obliga a cambiar contraseña (ya diseñado).
2. **Registro de médico** → validar exequátur → subir documentos al almacenamiento privado → estado "Pendiente de revisión" → aviso al administrador → al aprobar: correo + WhatsApp con credenciales.
3. **Login** paciente / médico / administrador (admin con 2FA) contra la base de datos real.
4. **Estudios**: LINKConnect recibe el estudio → se crea en `estudios` → asignación automática o manual a radiólogo → el radiólogo redacta y firma el informe → se notifica al referidor y al paciente.
5. **Convocatorias**: publicar → enviar a médicos filtrados por correo/WhatsApp/portal → recibir postulaciones → evaluar → asignar.
6. **Contacto** del sitio público → guardar mensaje y enviar correo al equipo.
7. **Panel admin**: reemplazar los datos simulados por consultas reales (KPIs, tablas, gráficos, auditoría, reportes exportables a PDF/Excel/CSV).

## 4. Variables de entorno que se configurarán en Vercel

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # solo en el servidor
RESEND_API_KEY=
EMAIL_FROM=notificaciones@rednacionalsalud.do
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
ORTHANC_URL= / OHIF_URL=
SENTRY_DSN=
```

## 5. Seguridad y cumplimiento (datos de salud)

- Ley **172-13** de protección de datos personales (RD): política de privacidad y términos definitivos (hoy hay texto provisional en `/contacto#terminos`).
- Cifrado en tránsito (HTTPS, incluido en Vercel) y en reposo (base de datos y archivos).
- Control de acceso por rol y por hospital; registro de auditoría de cada consulta a datos clínicos.
- Contraseñas con política mínima (ya diseñado en el portal) y bloqueo por intentos fallidos.
- Copias de seguridad diarias y plan de recuperación.

## 6. Lo que necesitamos del cliente

- [ ] **Marca final del panel**: las maquetas del admin dicen "HospitalNacional.do"; se construyó con **RedNacionalSalud.do + logo RNS** (se cambia en `src/config/brand.ts`). Confirmar.
- [ ] Logo del sitio (icono "H") en vector (SVG/AI) — hoy se usa un recorte de la maqueta.
- [ ] Logos de **HDCO** y **LINKDICOM** en vector (hoy están recreados en código).
- [ ] Video institucional (botón "Ver video institucional").
- [ ] Teléfono y correo reales de soporte (hoy `809-XXX-XXXX`).
- [ ] Textos legales: Términos de Uso y Política de Privacidad.
- [ ] Listado oficial de hospitales, provincias/municipios/sectores y especialidades.
- [ ] Acceso o convenio para validar cédulas (JCE) y exequátur (MESCyT/SNS).
- [ ] Cuenta de Meta Business verificada y número de WhatsApp para la API.
- [ ] Acceso al DNS del dominio `rednacionalsalud.do`.
- [ ] Plantillas de correo y WhatsApp aprobadas (textos).

## 7. Orden sugerido de trabajo

**Fase 2 — Datos y cuentas (2–4 semanas)**: Supabase (tablas + RLS), autenticación por roles, almacenamiento de documentos, registros reales de paciente y médico, aprobación desde el admin, correos (Resend) y WhatsApp (Meta).

**Fase 3 — Operación clínica**: estudios, asignaciones, lista de trabajo e informes reales, visor DICOM (Orthanc + OHIF), convocatorias con postulaciones, auditoría real.

**Fase 4 — Integración nacional y analítica**: LINKConnect en hospitales, Repositorio Nacional, tableros con datos reales, reportes exportables, monitoreo y respaldos.
