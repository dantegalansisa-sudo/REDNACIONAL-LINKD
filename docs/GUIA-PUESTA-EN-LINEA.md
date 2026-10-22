# RedNacionalSalud — Guía para ponerla en línea (rednacionalsalud.com)

**Orden de trabajo:** 1 → 2 → 3 → 4 → 5. Cada paso dice quién lo hace:
- 🤖 **Claude Code**: ya está hecho o lo pides en el chat de Claude Code.
- 🌐 **Claude en Chrome**: copias el prompt y lo pegas con la pestaña correcta abierta.
- 👤 **Tú, a mano**: son los pasos con contraseñas (Claude en Chrome no debe escribirlas).

---

## 1. 🤖 Web conectada y paquete listo — HECHO
- Los registros, logins, portales, aprobación de médicos y el formulario de contacto ya guardan en Supabase.
- El paquete para el cPanel está en **`entregables/rns-web-cpanel.zip`** (carpeta del proyecto, fuera de `app`).
- Si cambias algo en la web, pide a Claude Code: *"genera de nuevo el paquete del cPanel"* (`npm run paquete:cpanel`).

---

## 2. 🌐 Supabase: dominio real, SQL 004 y función de correos

Abre https://supabase.com/dashboard/project/upwkmovstlpjijrzmujn y pega esto en Claude en Chrome:

```
Eres mi asistente técnico. Vas a hacer ajustes en el proyecto de Supabase de "RedNacionalSalud",
que ya tiene la base de datos creada. Sigue los pasos EN ORDEN. Si algo da error, DETENTE y dime el
mensaje exacto. No borres nada existente. No escribas contraseñas ni claves secretas en ningún campo.

Proyecto: https://supabase.com/dashboard/project/upwkmovstlpjijrzmujn

PASO 1 — Ejecutar el SQL 004
a) Abre en otra pestaña: https://raw.githubusercontent.com/dantegalansisa-sudo/REDNACIONAL-LINKD/main/supabase/004_login_medico.sql
   Copia TODO el texto sin modificarlo.
b) En Supabase: SQL Editor → "+ New query" → pega → Run. Si sale un aviso de confirmación, confirma.
c) Esperado: "Success. No rows returned".

PASO 2 — Dominio real en Authentication → URL Configuration
a) Site URL: cámbiala a  https://rednacionalsalud.com   y guarda.
b) En "Redirect URLs" agrega (sin borrar las que ya existen):
     https://rednacionalsalud.com/**
     https://www.rednacionalsalud.com/**
   Guarda.

PASO 3 — Crear la función que envía los correos
a) Abre en otra pestaña:
   https://raw.githubusercontent.com/dantegalansisa-sudo/REDNACIONAL-LINKD/main/supabase/functions/enviar-notificaciones/index.ts
   y copia TODO el texto.
b) En Supabase: menú "Edge Functions" → "Deploy a new function" → "Via Editor".
c) Nombre de la función: enviar-notificaciones   (exactamente así).
d) Borra el código de ejemplo del editor, pega el código copiado y pulsa "Deploy function".
e) Esperado: la función aparece en la lista con estado activo.

PASO 4 — Secretos de la función (SIN la contraseña)
Menú "Edge Functions" → "Secrets" (o "Manage secrets"). Agrega estos 5 (nombre = valor):
   SMTP_HOST       = smtp.rednacionalsalud.com
   SMTP_PORT       = 465
   SMTP_USER       = notificaciones@rednacionalsalud.com
   SMTP_FROM_NAME  = Red Nacional de Salud
   SITE_URL        = https://rednacionalsalud.com
Guarda. NO agregues SMTP_PASS: ese lo escribe el usuario a mano.

PASO 5 — Webhook que dispara los correos
a) Menú "Database" → "Webhooks" (si aparece "Enable webhooks", actívalo primero).
b) "Create a new hook":
   - Name: enviar_correos
   - Table: public.notificaciones
   - Events: marca SOLO "Insert"
   - Type: "Supabase Edge Functions"
   - Edge Function: enviar-notificaciones   · Method: POST · Timeout: 5000
   - En "HTTP Headers", si hay un botón "Add auth header with service key", púlsalo (agrega Authorization).
c) Pulsa "Create webhook".

PASO 6 — Resumen
Dime qué pasos salieron bien y cualquier error o aviso. No hagas nada de SMTP con contraseñas.
```

### 👤 Tú, a mano en Supabase (llevan contraseña)
1. **Contraseña del correo para la función:** Edge Functions → Secrets → agrega `SMTP_PASS` = contraseña de `notificaciones@rednacionalsalud.com`.
2. **SMTP de Authentication** (para el correo "Crea tu contraseña" de los médicos): Authentication → Emails → **SMTP Settings** → activar *Custom SMTP*:
   | Campo | Valor |
   |---|---|
   | Sender email | notificaciones@rednacionalsalud.com |
   | Sender name | Red Nacional de Salud |
   | Host | smtp.rednacionalsalud.com |
   | Port | 465 |
   | Username | notificaciones@rednacionalsalud.com |
   | Password | (la contraseña del correo) |
3. Después del SMTP ya se puede editar la plantilla **Reset Password** (el paso 6 que quedó pendiente): pídele a Claude en Chrome *"haz el PASO 6 del archivo PROMPT-ASISTENTE-NAVEGADOR.md"* o cópiala de ese archivo.
4. **Primer administrador:** Authentication → Users → Add user → Create new user (correo + contraseña, marcar *Auto Confirm User*). Luego en SQL Editor:
   ```sql
   update public.profiles set rol = 'admin', nombre_completo = 'Nombre del Administrador'
   where correo = 'correo-del-admin@dominio.com';
   ```
   Debe decir `1 row affected`.

> Las contraseñas de los correos que el cliente mandó por WhatsApp no se guardaron en el proyecto. Recomiéndale cambiarlas después de configurar todo, ya que viajaron por chat.

---

## 3. 🌐 cPanel de LinkXpace: publicar la web y preparar el correo

Abre https://panel.linkxpace.com → servicio **rednacionalsalud.com**, y pega esto en Claude en Chrome:

```
Eres mi asistente técnico. Vas a publicar una web en el hosting cPanel de LinkXpace del dominio
rednacionalsalud.com. Sigue los pasos EN ORDEN. Si algo da error, DETENTE y dime el mensaje exacto.
No borres archivos: si hace falta quitar algo, muévelo a una carpeta de respaldo. No cambies contraseñas.

PASO 1 — Certificado SSL
En el panel del servicio rednacionalsalud.com abre "SSL/TLS". Dime si rednacionalsalud.com y
www.rednacionalsalud.com tienen certificado activo y su fecha de vencimiento. Si existe un botón
"Run AutoSSL" / "Ejecutar AutoSSL" y NO hay certificado, púlsalo y espera a que termine.

PASO 2 — Respaldar lo que haya en public_html
a) Abre "Administrador de archivos" y entra a la carpeta public_html.
b) Activa "Mostrar archivos ocultos" (en Configuración/Settings del administrador de archivos).
c) Si public_html tiene archivos (por ejemplo index.html, default.htm, cgi-bin), crea dentro de public_html
   una carpeta llamada  _respaldo_inicial  y mueve allí TODOS los archivos existentes, excepto la carpeta
   cgi-bin y la carpeta .well-known (esas se quedan donde están).

PASO 3 — Subir la web
a) Dentro de public_html pulsa "Cargar" / "Upload" y sube el archivo:
   entregables/rns-web-cpanel.zip (en la carpeta del proyecto)
b) Cuando termine la carga, vuelve a public_html, selecciona rns-web-cpanel.zip y pulsa "Extraer" / "Extract"
   dentro de public_html (no en una subcarpeta).
c) Comprueba que en public_html quedaron: index.html, .htaccess, favicon.png y las carpetas assets e img.
d) Borra solo el archivo rns-web-cpanel.zip (ya no hace falta).

PASO 4 — Correo: autenticación para que no llegue a spam
a) En el panel busca "Claves de dominio (DKIM)": si DKIM no está activo para rednacionalsalud.com, actívalo.
b) Si existe "Entregabilidad del correo" / "Email Deliverability", ábrelo y dime el estado de DKIM y SPF.
   Si ofrece "Reparar" / "Repair" para SPF o DKIM, púlsalo.
c) Abre "Asistente DMARC" y, si no hay registro DMARC, crea uno con política "none" (solo monitoreo).

PASO 5 — Comprobar la web
Abre en pestañas nuevas y dime qué se ve en cada una:
   https://rednacionalsalud.com
   https://rednacionalsalud.com/paciente/login
   https://rednacionalsalud.com/registro/medico
   http://rednacionalsalud.com   (debe redirigir sola a https)
La primera debe mostrar la página de inicio de RedNacionalSalud; las otras deben cargar sin "404".

PASO 6 — Resumen
Dame un resumen de cada paso, incluido el estado del SSL, DKIM, SPF y DMARC.
```

---

## 4. 👤 Pruebas completas (en https://rednacionalsalud.com)

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Registro de **paciente** con tu correo real | Pantalla "¡Registro completado!" con código `RNS-…` y te llega el correo de bienvenida |
| 2 | Login de paciente con el código + cédula | Pide crear contraseña nueva; luego muestra tu nombre en el portal |
| 3 | Salir y entrar con la contraseña nueva | Entra directo, sin volver a pedir cambio |
| 4 | "¿Olvidaste tu código?" con tu cédula | Llega el correo con el código |
| 5 | Registro de **médico** con tu correo real (sube foto y 3 documentos) | "¡Registro recibido!"; te llega "Hemos recibido su solicitud" y al admin "Nuevo registro de médico" |
| 6 | Login del médico antes de aprobarlo | No entra |
| 7 | Entrar a `/admin/login` con el administrador | Entra al panel con su nombre arriba |
| 8 | Admin → **Radiólogos** → "Últimas solicitudes de registro" → abrir la solicitud → ver documentos → **Aprobar y enviar acceso** | Al médico le llegan "Su cuenta ha sido aprobada" y "Crea tu contraseña" |
| 9 | Abrir el enlace "Crear mi contraseña" | Página para crearla; luego login del médico con correo **o exequátur** |
| 10 | Formulario de **Contacto** | "¡Mensaje enviado!"; al admin le llega el correo |

Si un correo no llega: Supabase → Table Editor → `notificaciones` → columna `error` dice el motivo.

---

## 5. 🤖 Dejar el sistema vacío antes de las pruebas de integración

El script `supabase/005_vaciar_sistema.sql` borra todos los datos (usuarios, pacientes, médicos, hospitales,
estudios, notificaciones, auditoría…) y reinicia los códigos, conservando la estructura, provincias,
configuración y permisos. Los archivos de Storage se vacían desde el panel. Para las pruebas se usan
siempre nombres genéricos ("Radiologo Demo1", "Paciente Demo1"…), nunca nombres reales.

---

## Qué queda para fases siguientes
- Datos reales en el resto de pantallas del panel y portales (estudios, informes, hospitales, analítica): hoy muestran datos de ejemplo.
- Verificación en dos pasos (2FA) para administradores.
- Imágenes médicas (DICOM) y LINKConnect con LINKDICOM.
- Cuando el SNS apruebe el dominio `.do`: cambiar `SITE_URL`, la Site URL de Supabase y subir el paquete al nuevo hosting.
