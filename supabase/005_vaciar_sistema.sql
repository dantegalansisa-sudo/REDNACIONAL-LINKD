-- =====================================================================
-- RedNacionalSalud — 005 VACIAR EL SISTEMA (dejarlo "virgen")
-- Borra TODOS los datos: usuarios (incluidos administradores), pacientes,
-- médicos y sus documentos, hospitales, estudios, informes, citas,
-- convocatorias, asignaciones, notificaciones, mensajes, auditoría y reportes.
-- Reinicia los códigos automáticos (RNS-00000001, RAD-0001, MR-000001, EST-…, INF-…).
--
-- CONSERVA la estructura y la configuración del sistema:
--   tablas, seguridad (RLS), funciones, provincias, municipios,
--   configuracion y rol_permisos, y las carpetas (buckets) de archivos.
--
-- ⚠ No se puede deshacer. Los ARCHIVOS dentro de Storage (fotos y documentos)
--   se borran aparte desde el panel de Storage.
-- =====================================================================
begin;

-- 1. Usuarios (cuentas de acceso). Al borrarlos se borran sus perfiles.
delete from auth.users;

-- 2. Datos de la plataforma
truncate table
  public.informes,
  public.estudios,
  public.solicitudes_estudio,
  public.citas,
  public.postulaciones,
  public.convocatorias,
  public.asignaciones,
  public.medico_documentos,
  public.medicos,
  public.pacientes,
  public.linkconnect_eventos,
  public.linkconnect_nodos,
  public.equipos_imagen,
  public.alertas,
  public.hospitales,
  public.notificaciones,
  public.mensajes_contacto,
  public.reportes,
  public.accesos_portal,
  public.auditoria,
  public.profiles
restart identity cascade;

-- 3. Reiniciar los códigos automáticos
alter sequence public.seq_codigo_paciente     restart with 1;
alter sequence public.seq_codigo_radiologo    restart with 1;
alter sequence public.seq_codigo_referidor    restart with 1;
alter sequence public.seq_numero_estudio      restart with 1;
alter sequence public.seq_numero_informe      restart with 1;
alter sequence public.seq_codigo_convocatoria restart with 1;

commit;

-- =====================================================================
-- VERIFICACIÓN (ejecutar aparte): todos los conteos deben ser 0,
-- excepto provincias (32), configuracion (8) y permisos (59).
-- =====================================================================
-- select
--   (select count(*) from auth.users)          as usuarios,
--   (select count(*) from public.profiles)     as perfiles,
--   (select count(*) from public.pacientes)    as pacientes,
--   (select count(*) from public.medicos)      as medicos,
--   (select count(*) from public.hospitales)   as hospitales,
--   (select count(*) from public.estudios)     as estudios,
--   (select count(*) from public.notificaciones) as notificaciones,
--   (select count(*) from public.auditoria)    as auditoria,
--   (select count(*) from public.provincias)   as provincias,
--   (select count(*) from public.configuracion) as configuracion,
--   (select count(*) from public.rol_permisos) as permisos;
