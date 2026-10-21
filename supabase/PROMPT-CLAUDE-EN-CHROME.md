# Prompt para Claude en Chrome — Crear la base de datos de RedNacionalSalud.do en Supabase

> Copia TODO el bloque de abajo y pégalo en Claude en Chrome, con la pestaña de Supabase abierta y la sesión iniciada.
> Los pasos marcados **👤 (lo haces tú)** incluyen contraseñas: Claude en Chrome no debe escribirlas.

---

```
Eres mi asistente técnico. Vas a configurar la base de datos del proyecto "RedNacionalSalud.do" en Supabase,
usando el navegador. Sigue los pasos EN ORDEN, uno por uno, sin saltarte ninguno y sin inventar nada.

DATOS DEL PROYECTO
- Panel del proyecto: https://supabase.com/dashboard/project/upwkmovstlpjijrzmujn
- Archivos SQL (públicos, solo lectura). Son 3 y se ejecutan en este orden:
  1) https://raw.githubusercontent.com/dantegalansisa-sudo/REDNACIONAL-LINKD/main/supabase/001_esquema.sql
  2) https://raw.githubusercontent.com/dantegalansisa-sudo/REDNACIONAL-LINKD/main/supabase/002_seguridad.sql
  3) https://raw.githubusercontent.com/dantegalansisa-sudo/REDNACIONAL-LINKD/main/supabase/003_datos_iniciales.sql

REGLAS
- No modifiques el contenido de los archivos SQL. Cópialos completos, exactamente como están.
- No borres tablas, proyectos ni datos existentes. No cambies la región ni el plan.
- No escribas contraseñas, claves secretas ni la "service_role key" en ningún lugar.
- Si un paso da error, DETENTE y dime el mensaje de error exacto y en qué paso ocurrió. No intentes "arreglarlo".
- Al terminar cada paso, dime en una línea si salió bien.

PASO 1 — Ejecutar 001_esquema.sql
a) Abre en una pestaña nueva el archivo 1 (001_esquema.sql). Selecciona todo el texto (Ctrl+A) y cópialo (Ctrl+C).
b) Ve al panel del proyecto → menú izquierdo "SQL Editor" → botón "+ New query" (o "New SQL snippet").
c) Haz clic dentro del editor, borra cualquier texto que tenga y pega (Ctrl+V).
   Comprueba que el texto pegado empieza con "-- RedNacionalSalud.do — 001 ESQUEMA" y termina con "commit;".
d) Pulsa "Run" (o Ctrl+Enter). Si aparece un aviso de "destructive operation" o "Run this query?", confirma "Run".
e) Resultado esperado: "Success. No rows returned".

PASO 2 — Ejecutar 002_seguridad.sql
Repite exactamente el PASO 1 con el archivo 2, en una consulta NUEVA ("+ New query").
Debe empezar con "-- RedNacionalSalud.do — 002 SEGURIDAD" y terminar con "commit;".
Resultado esperado: "Success. No rows returned".

PASO 3 — Ejecutar 003_datos_iniciales.sql
Repite el PASO 1 con el archivo 3, en una consulta NUEVA.
Debe empezar con "-- RedNacionalSalud.do — 003 DATOS INICIALES".
Resultado esperado: "Success. No rows returned".

PASO 4 — Verificar
En una consulta NUEVA pega y ejecuta esto:

select (select count(*) from public.provincias)    as provincias,
       (select count(*) from public.hospitales)    as hospitales,
       (select count(*) from public.configuracion) as configuracion,
       (select count(*) from public.rol_permisos)  as permisos,
       (select count(*) from storage.buckets where id in ('documentos-medicos','fotos-perfil','informes','estudios-miniaturas','institucional')) as buckets,
       (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity) as tablas_sin_rls;

Resultado esperado: provincias 32, hospitales 10, configuracion 8, permisos 59, buckets 5, tablas_sin_rls 0.
Dime los números que salieron.

Luego ve a "Table Editor" y confirma que existen estas tablas en el esquema public:
accesos_portal, alertas, asignaciones, auditoria, citas, configuracion, convocatorias, equipos_imagen, estudios,
hospitales, informes, linkconnect_eventos, linkconnect_nodos, medico_documentos, medicos, mensajes_contacto,
municipios, notificaciones, pacientes, postulaciones, profiles, provincias, reportes, rol_permisos, solicitudes_estudio.
Y en "Storage" que existen los buckets: documentos-medicos, fotos-perfil, informes, estudios-miniaturas, institucional.

PASO 5 — Configurar el inicio de sesión (Authentication)
a) Menú "Authentication" → "Sign In / Providers" (o "Providers") → "Email":
   - Email: Habilitado (Enabled).
   - "Confirm email": DESACTIVADO (el paciente se registra con un correo interno; la verificación la hace el SNS).
   - "Allow new users to sign up": ACTIVADO.
   - Longitud mínima de contraseña (Minimum password length): 8.
   - Guarda ("Save").
b) Menú "Authentication" → "URL Configuration":
   - Site URL: https://rednacional-linkd.vercel.app
   - Redirect URLs → "Add URL" y agrega estas tres (una por una):
       https://rednacional-linkd.vercel.app/**
       http://localhost:5179/**
       http://localhost:5173/**
   - Guarda.

PASO 6 — Plantilla de correo para crear contraseña (médicos aprobados)
Menú "Authentication" → "Emails" (o "Email Templates") → plantilla "Reset Password":
- Subject (asunto): Crea tu contraseña — Red Nacional de Salud
- Message body (reemplaza todo el contenido por este HTML):

<h2>Bienvenido a la Red Nacional de Salud</h2>
<p>Su solicitud fue aprobada por el Sistema Nacional de Salud (SNS).</p>
<p>Para acceder al portal del médico, cree su contraseña haciendo clic en el siguiente enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Crear mi contraseña</a></p>
<p>Si usted no solicitó este acceso, ignore este correo.</p>
<p>— Red Nacional de Salud · RedNacionalSalud.do</p>

- Guarda.

PASO 7 — Avísame que terminaste
Dame un resumen: qué pasos salieron bien, los números del PASO 4 y cualquier error o aviso que hayas visto.
NO hagas el paso del administrador ni la configuración SMTP: esos los hago yo porque llevan contraseñas.
```

---

## 👤 Pasos que haces tú (llevan contraseñas)

### A. Crear el primer administrador
1. Supabase → **Authentication → Users → Add user → Create new user**.
2. Escribe el correo del administrador y una contraseña segura. Marca **Auto Confirm User** si aparece.
3. Ve a **SQL Editor → New query** y ejecuta (cambiando el correo):
   ```sql
   update public.profiles set rol = 'admin', nombre_completo = 'Nombre del Administrador'
   where correo = 'correo-del-admin@dominio.com';
   ```
   Debe decir `1 row affected`. Para crear coordinadores u operadores se hace igual, con `rol = 'coordinador'` o `rol = 'operador'`.

### B. Correos con el SMTP del cPanel (cuando el cliente entregue la cuenta `notificaciones@`)
Supabase → **Authentication → Emails → SMTP Settings** → activar **Custom SMTP**:
| Campo | Valor |
|---|---|
| Sender email | notificaciones@rednacionalsalud.do |
| Sender name | Red Nacional de Salud |
| Host | `mail.rednacionalsalud.do` (lo indica el cPanel en "Email Accounts → Connect Devices") |
| Port | `465` (SSL) |
| Username | notificaciones@rednacionalsalud.do |
| Password | la contraseña de esa cuenta de correo |

Sin SMTP propio, Supabase solo envía unos pocos correos por hora (sirve para pruebas).

### C. Variables en Vercel (para que la web en línea se conecte)
Vercel → proyecto → **Settings → Environment Variables** → agregar y luego **Redeploy**:
```
VITE_SUPABASE_URL = https://upwkmovstlpjijrzmujn.supabase.co
VITE_SUPABASE_ANON_KEY = (la anon public key)
```
Cuando se aloje en el cPanel del cliente, estas mismas variables se colocan al compilar (`npm run build`) y se sube la carpeta `dist`.

### D. Seguridad de las claves
- **Nunca** pongas la `service_role` ni la `sb_secret_...` en la web, en Vercel, en GitHub ni en un prompt. Solo van en el servidor.
- Como esas claves se compartieron en el chat, al pasar al proyecto definitivo del cliente se usan claves nuevas.
  Si este proyecto de prueba se mantiene: **Project Settings → API Keys → Rotate / Generate new secret key**.

---

## Qué queda creado (resumen)
- **25 tablas** con seguridad por fila (RLS): pacientes, médicos y sus documentos, hospitales, equipos, LINKConnect, asignaciones, convocatorias y postulaciones, solicitudes, estudios, informes, citas, accesos, notificaciones, alertas, contacto, auditoría, configuración, permisos y reportes.
- **Códigos automáticos**: pacientes `RNS-00000001`, radiólogos `RAD-0001`, referidores `MR-000001`, estudios `EST-2026-000001`, informes `INF-2026-000001`, convocatorias `CONV-2026-001`.
- **Registro automático**: cuando alguien se registra en la web, se crea su ficha de paciente o de médico (el médico queda *pendiente* hasta que el administrador lo apruebe).
- **Cola de correos** (`notificaciones`): registro recibido, código de paciente, cuenta aprobada/rechazada, informe publicado, mensajes de contacto y aviso al administrador. El envío real se activa en la siguiente fase con el SMTP del cPanel.
- **Auditoría automática** de cambios en pacientes, médicos, hospitales, estudios, informes, convocatorias, asignaciones, configuración y roles.
- **5 carpetas de archivos privadas** (Storage) para documentos de médicos, fotos, informes PDF, miniaturas de estudios y logos.
- **Datos iniciales**: 32 provincias con su región de salud, municipios principales, 10 hospitales de ejemplo, configuración y permisos por rol.
