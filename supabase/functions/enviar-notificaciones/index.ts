// =====================================================================
// Supabase Edge Function: enviar-notificaciones
// Envía por correo (SMTP del cPanel) las notificaciones que la base de datos
// deja en la tabla public.notificaciones con estado "pendiente".
//
// Se ejecuta:
//   - Automáticamente con un Database Webhook (INSERT en public.notificaciones).
//   - Manualmente (POST sin cuerpo) para reintentar las pendientes.
//
// Por seguridad NO confía en el contenido que recibe: solo usa el "id" para
// buscar la notificación real en la base de datos.
//
// Secretos requeridos (Edge Functions → Secrets):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME, SITE_URL
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los provee Supabase automáticamente.
// =====================================================================
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import nodemailer from 'npm:nodemailer@6.9.16'

const env = (k: string, d = '') => Deno.env.get(k) ?? d
const SITE = env('SITE_URL', 'https://rednacionalsalud.com').replace(/\/$/, '')
const FROM_NAME = env('SMTP_FROM_NAME', 'Red Nacional de Salud')

const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })

const transporte = nodemailer.createTransport({
  host: env('SMTP_HOST'),
  port: Number(env('SMTP_PORT', '465')),
  secure: Number(env('SMTP_PORT', '465')) === 465,
  auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
})

type Datos = Record<string, string | null | undefined>
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

/** Plantilla base con la marca RNS */
function marco(titulo: string, cuerpo: string, boton?: { texto: string; url: string }) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f3f7fd;font-family:Segoe UI,Arial,sans-serif;color:#0a1f5c">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e3eaf6">
    <tr><td style="background:#0b3a9e;padding:18px 24px"><img src="${SITE}/img/logos/rns.png" alt="RNS — Red Nacional de Salud" height="44" style="background:#fff;border-radius:8px;padding:4px 8px"></td></tr>
    <tr><td style="padding:28px 28px 8px"><h1 style="margin:0 0 12px;font-size:22px;color:#0a1f5c">${titulo}</h1>
      <div style="font-size:15px;line-height:1.6;color:#334155">${cuerpo}</div>
      ${boton ? `<p style="margin:24px 0"><a href="${boton.url}" style="background:#0b57f0;color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:600;display:inline-block">${boton.texto}</a></p>` : ''}
    </td></tr>
    <tr><td style="padding:16px 28px 24px;font-size:12px;color:#64748b;border-top:1px solid #eef2f8">
      Red Nacional de Salud · ${esc(new URL(SITE).host)}<br>Este es un mensaje automático, por favor no responda a este correo.</td></tr>
  </table></td></tr></table></body></html>`
}

function plantilla(nombre: string, d: Datos): { asunto: string; html: string } | null {
  switch (nombre) {
    case 'registro_paciente':
      return { asunto: 'Bienvenido a la Red Nacional de Salud', html: marco(`¡Bienvenido, ${esc(d.nombre)}!`,
        `<p>Tu registro en la Red Nacional de Salud se completó correctamente.</p>
         <p style="font-size:13px;color:#64748b;margin-bottom:4px">TU CÓDIGO DE PACIENTE</p>
         <p style="font-size:28px;font-weight:700;margin:0 0 16px;color:#0a1f5c">${esc(d.codigo)}</p>
         <p><b>Cómo entrar a tu portal:</b><br>1. Usuario: tu código de paciente.<br>2. Clave: tu número de cédula o pasaporte.<br>3. Al entrar, el sistema te pedirá crear una contraseña personal.</p>`,
        { texto: 'Ir a mi portal', url: `${SITE}/paciente/login` }) }
    case 'recordar_codigo':
      return { asunto: 'Tu código de paciente', html: marco(`Hola, ${esc(d.nombre)}`,
        `<p>Recibimos una solicitud para recordar tu código de paciente:</p><p style="font-size:28px;font-weight:700;color:#0a1f5c">${esc(d.codigo)}</p>
         <p>Si no lo solicitaste, puedes ignorar este correo.</p>`, { texto: 'Iniciar sesión', url: `${SITE}/paciente/login` }) }
    case 'registro_medico_recibido':
      return { asunto: 'Hemos recibido su solicitud de registro', html: marco(`Gracias, ${esc(d.nombre)}`,
        `<p>Hemos recibido sus datos profesionales y documentos. Su solicitud será revisada por el equipo autorizado del <b>Sistema Nacional de Salud (SNS)</b>.</p>
         <p><b>Estado:</b> <span style="color:#d97706">Pendiente de revisión y aprobación</span></p>
         <p>Cuando su cuenta sea aprobada recibirá otro correo con el enlace para crear su contraseña.</p>`) }
    case 'medico_aprobado':
      return { asunto: 'Su cuenta ha sido aprobada', html: marco(`¡Bienvenido a la red, ${esc(d.nombre)}!`,
        `<p>Su solicitud fue <b style="color:#16a34a">aprobada</b>. Su código en la red es <b>${esc(d.codigo)}</b>.</p>
         <p>En un correo aparte recibirá el enlace <b>"Crear mi contraseña"</b>. Después podrá entrar al portal del médico con su correo o su número de exequátur.</p>`,
        { texto: 'Ir al portal del médico', url: `${SITE}/medico/login` }) }
    case 'medico_rechazado':
      return { asunto: 'Resultado de su solicitud de registro', html: marco(`Estimado(a) ${esc(d.nombre)}`,
        `<p>Su solicitud de registro no pudo ser aprobada en este momento.</p>${d.motivo ? `<p><b>Motivo:</b> ${esc(d.motivo)}</p>` : ''}
         <p>Puede comunicarse con soporte para más información o registrarse nuevamente con la documentación correcta.</p>`) }
    case 'nuevo_registro_medico':
      return { asunto: 'Nuevo registro de médico pendiente de aprobación', html: marco('Nuevo registro de médico',
        `<p><b>${esc(d.nombre)}</b> (${d.tipo === 'radiologo' ? 'Radiólogo' : 'Referidor'}, exequátur ${esc(d.exequatur)}) envió su solicitud.</p>
         <p>Revísela en el panel: <b>Radiólogos → Últimas solicitudes de registro</b>.</p>`, { texto: 'Abrir el panel', url: `${SITE}/admin/radiologos` }) }
    case 'informe_publicado':
      return { asunto: 'Su informe ya está disponible', html: marco('Informe disponible',
        `<p>El informe del estudio <b>${esc(d.estudio)}</b> (${esc(d.numero_acceso)}) ya está disponible en el portal.</p>`,
        { texto: 'Ver informe', url: `${SITE}/paciente/estudios` }) }
    case 'mensaje_contacto':
      return { asunto: 'Nuevo mensaje desde el formulario de contacto', html: marco('Nuevo mensaje de contacto',
        `<p><b>Nombre:</b> ${esc(d.nombre)}<br><b>Correo:</b> ${esc(d.correo)}<br><b>Tipo:</b> ${esc(d.tipo)}</p><p style="white-space:pre-wrap">${esc(d.mensaje)}</p>`) }
    default:
      return null
  }
}

async function enviar(id: string) {
  const { data: n } = await db.from('notificaciones').select('*').eq('id', id).maybeSingle()
  if (!n || n.estado !== 'pendiente' || n.canal !== 'email' || !n.destinatario_correo) return { id, omitida: true }
  const p = plantilla(n.plantilla, n.datos ?? {})
  if (!p) {
    await db.from('notificaciones').update({ estado: 'fallida', error: `Plantilla desconocida: ${n.plantilla}`, intentos: n.intentos + 1 }).eq('id', id)
    return { id, error: 'plantilla' }
  }
  try {
    await transporte.sendMail({ from: `"${FROM_NAME}" <${env('SMTP_USER')}>`, to: n.destinatario_correo, subject: n.asunto || p.asunto, html: p.html })
    await db.from('notificaciones').update({ estado: 'enviada', enviado_en: new Date().toISOString(), intentos: n.intentos + 1, error: null }).eq('id', id)
    return { id, enviada: true }
  } catch (e) {
    const intentos = n.intentos + 1
    await db.from('notificaciones').update({ estado: intentos >= 5 ? 'fallida' : 'pendiente', intentos, error: String(e).slice(0, 500) }).eq('id', id)
    return { id, error: String(e) }
  }
}

Deno.serve(async (req) => {
  let ids: string[] = []
  try {
    const body = await req.json()
    if (body?.record?.id) ids = [String(body.record.id)]       // llamado por el Database Webhook
  } catch { /* sin cuerpo: procesar pendientes */ }

  if (!ids.length) {
    const { data } = await db.from('notificaciones').select('id')
      .eq('estado', 'pendiente').eq('canal', 'email').not('destinatario_correo', 'is', null)
      .order('created_at').limit(25)
    ids = (data ?? []).map((r) => r.id as string)
  }
  const resultados = []
  for (const id of ids) resultados.push(await enviar(id))
  return new Response(JSON.stringify({ procesadas: resultados.length, resultados }), { headers: { 'Content-Type': 'application/json' } })
})
