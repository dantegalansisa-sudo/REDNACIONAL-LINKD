-- =====================================================================
-- RedNacionalSalud.do — 001 ESQUEMA (tipos, tablas, índices)
-- Ejecutar en: Supabase → SQL Editor → New query → pegar todo → Run
-- Orden: 001_esquema.sql → 002_seguridad.sql → 003_datos_iniciales.sql
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1. Tipos (enums)
-- ---------------------------------------------------------------------
create type public.app_rol as enum ('admin', 'coordinador', 'operador', 'radiologo', 'referidor', 'paciente');
create type public.estado_cuenta as enum ('activo', 'inactivo', 'bloqueado');
create type public.tipo_medico as enum ('radiologo', 'referidor');
create type public.estado_registro_medico as enum ('pendiente', 'aprobado', 'rechazado', 'suspendido');
create type public.tipo_documento as enum ('cedula', 'pasaporte');
create type public.modalidad as enum ('CT', 'MR', 'RX', 'US', 'MG', 'PET', 'NM', 'XA', 'OTROS');
create type public.prioridad_estudio as enum ('emergencia', 'urgencia', 'hospitalizado', 'ambulatorio');
create type public.estado_estudio as enum ('nuevo', 'asignado', 'en_lectura', 'informado', 'en_revision', 'cancelado');
create type public.estado_informe as enum ('borrador', 'firmado', 'publicado', 'corregido');
create type public.estado_hospital as enum ('activo', 'en_proceso', 'inactivo');
create type public.estado_linkconnect as enum ('conectado', 'sincronizando', 'desconectado');
create type public.estado_convocatoria as enum ('borrador', 'activa', 'en_evaluacion', 'en_pausa', 'cerrada', 'cancelada');
create type public.estado_postulacion as enum ('aplicada', 'preseleccionada', 'aceptada', 'rechazada', 'retirada');
create type public.estado_asignacion as enum ('activa', 'pendiente', 'suspendida', 'finalizada');
create type public.estado_solicitud as enum ('enviada', 'programada', 'realizada', 'cancelada');
create type public.estado_cita as enum ('programada', 'confirmada', 'completada', 'cancelada', 'no_asistio');
create type public.estado_notificacion as enum ('pendiente', 'enviada', 'fallida');
create type public.canal_notificacion as enum ('email', 'portal');
create type public.resultado_auditoria as enum ('exitoso', 'fallido');
create type public.tipo_documento_medico as enum ('titulo', 'exequatur', 'cedula', 'especialidad', 'otros');
create type public.estado_documento as enum ('cargado', 'verificado', 'rechazado');
create type public.tipo_alerta as enum ('critico', 'incidencia', 'sistema', 'sla', 'info');

-- ---------------------------------------------------------------------
-- 2. Utilidad: updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Secuencias para códigos legibles
create sequence public.seq_codigo_paciente;
create sequence public.seq_codigo_radiologo;
create sequence public.seq_codigo_referidor;
create sequence public.seq_numero_estudio;
create sequence public.seq_numero_informe;
create sequence public.seq_codigo_convocatoria;

-- ---------------------------------------------------------------------
-- 3. Catálogos geográficos
-- ---------------------------------------------------------------------
create table public.provincias (
  id            smallint primary key,
  nombre        text not null unique,
  region_salud  text not null   -- Región de Salud del SNS (Metropolitana, Valdesia, Norcentral, ...)
);

create table public.municipios (
  id            serial primary key,
  provincia_id  smallint not null references public.provincias(id) on delete cascade,
  nombre        text not null,
  unique (provincia_id, nombre)
);

-- ---------------------------------------------------------------------
-- 4. Perfiles de usuario (1:1 con auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  rol              public.app_rol,                 -- null = usuario creado en el panel sin rol asignado aún
  nombre_completo  text not null default '',
  correo           text,
  telefono         text,
  hospital_id      uuid,                           -- FK se agrega después de crear hospitales
  estado           public.estado_cuenta not null default 'activo',
  dos_factores     boolean not null default false,
  ultimo_acceso    timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. Hospitales, equipos y LINKConnect
-- ---------------------------------------------------------------------
create table public.hospitales (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique,               -- H-001
  sigla           text,                               -- HPHM
  nombre          text not null,
  tipo            text,                               -- Hospital General Docente, Especializado...
  nivel           text check (nivel in ('I', 'II', 'III')),
  provincia_id    smallint references public.provincias(id),
  municipio       text,
  direccion       text,
  telefono        text,
  correo          text,
  director        text,
  servicios       public.modalidad[] not null default '{}',
  latitud         numeric(9,6),
  longitud        numeric(9,6),
  foto_path       text,
  estado          public.estado_hospital not null default 'en_proceso',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_hospitales_updated before update on public.hospitales for each row execute function public.set_updated_at();
create index on public.hospitales (provincia_id);
create index on public.hospitales (estado);

alter table public.profiles
  add constraint profiles_hospital_fk foreign key (hospital_id) references public.hospitales(id) on delete set null;

create table public.equipos_imagen (
  id            uuid primary key default gen_random_uuid(),
  hospital_id   uuid not null references public.hospitales(id) on delete cascade,
  modalidad     public.modalidad not null,
  marca         text,
  modelo        text,
  serial        text,
  estado        text not null default 'operativo' check (estado in ('operativo', 'mantenimiento', 'fuera_de_servicio')),
  created_at    timestamptz not null default now()
);
create index on public.equipos_imagen (hospital_id);

create table public.linkconnect_nodos (
  id                 uuid primary key default gen_random_uuid(),
  hospital_id        uuid not null unique references public.hospitales(id) on delete cascade,
  marca              text,
  modelo             text,
  serial             text,
  memoria_ram        text,
  procesador         text,
  almacenamiento     text,
  sistema_operativo  text,
  version            text,
  host_dicom         text,
  ip_dicom           inet,
  puerto_dicom       integer,
  aetitle            text,
  integracion_hl7    boolean not null default false,
  velocidad_mbps     numeric(8,2),
  estado             public.estado_linkconnect not null default 'desconectado',
  ultima_conexion    timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_linkconnect_updated before update on public.linkconnect_nodos for each row execute function public.set_updated_at();

create table public.linkconnect_eventos (
  id           bigint generated always as identity primary key,
  nodo_id      uuid not null references public.linkconnect_nodos(id) on delete cascade,
  evento       text not null,              -- envio_estudio, recepcion, error_transmision, reenvio...
  detalle      text,
  exitoso      boolean not null default true,
  created_at   timestamptz not null default now()
);
create index on public.linkconnect_eventos (nodo_id, created_at desc);

-- ---------------------------------------------------------------------
-- 6. Pacientes
-- ---------------------------------------------------------------------
create table public.pacientes (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid unique references auth.users(id) on delete set null,
  codigo                     text not null unique,               -- RNS-00012345 (se genera solo)
  tipo_documento             public.tipo_documento not null default 'cedula',
  documento                  text not null,                      -- solo dígitos para cédula
  nombres                    text not null,
  apellidos                  text not null,
  nombre_completo            text generated always as (nombres || ' ' || apellidos) stored,
  fecha_nacimiento           date,
  sexo                       text check (sexo in ('Masculino', 'Femenino')),
  nacionalidad               text default 'Dominicana',
  telefono                   text,
  whatsapp                   text,
  correo                     text,                               -- correo real de contacto (opcional)
  provincia                  text,
  municipio                  text,
  sector                     text,
  calle                      text,
  numero                     text,
  apartamento                text,
  referencia                 text,
  ocupacion                  text,
  estado_civil               text,
  emergencia_telefono        text,
  emergencia_parentesco      text,
  foto_path                  text,
  debe_cambiar_clave         boolean not null default true,      -- obliga a crear contraseña en el primer acceso
  estado                     public.estado_cuenta not null default 'activo',
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  unique (tipo_documento, documento)
);
create trigger trg_pacientes_updated before update on public.pacientes for each row execute function public.set_updated_at();
create index on public.pacientes (nombre_completo);

-- ---------------------------------------------------------------------
-- 7. Médicos (radiólogos y referidores) y sus documentos
-- ---------------------------------------------------------------------
create table public.medicos (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid unique references auth.users(id) on delete set null,
  codigo               text not null unique,                 -- RAD-0001 / MR-000156 (se genera solo)
  tipo                 public.tipo_medico not null,
  exequatur            text not null unique,
  tratamiento          text default 'Dr.',
  nombres              text not null,
  apellidos            text not null,
  nombre_completo      text generated always as (nombres || ' ' || apellidos) stored,
  cedula               text,
  sexo                 text check (sexo in ('Masculino', 'Femenino')),
  tel_residencia       text,
  tel_whatsapp         text,
  correo               text not null,
  provincia            text,
  municipio            text,
  sector               text,
  calle                text,
  casa                 text,
  residencial          text,
  especialidades       text[] not null default '{}',         -- modalidades (radiólogo) o especialidades (referidor)
  otra_especialidad    text,
  regiones_interes     text[] not null default '{}'
                       check (regiones_interes <@ array['Sur','SurEste','SurOeste','Norte','NorEste','NorOeste','Este','Oeste']),
  region_reside        text,
  centro_trabajo       text,
  foto_path            text,
  bio                  text,
  disponible           boolean not null default true,
  rating               numeric(2,1) check (rating between 0 and 5),
  estado_registro      public.estado_registro_medico not null default 'pendiente',
  motivo_rechazo       text,
  aprobado_por         uuid references auth.users(id),
  aprobado_en          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger trg_medicos_updated before update on public.medicos for each row execute function public.set_updated_at();
create index on public.medicos (tipo, estado_registro);

create table public.medico_documentos (
  id               uuid primary key default gen_random_uuid(),
  medico_id        uuid not null references public.medicos(id) on delete cascade,
  tipo             public.tipo_documento_medico not null,
  archivo_path     text not null,          -- ruta en el bucket "documentos-medicos": <user_id>/<archivo>
  nombre_archivo   text,
  tamano_bytes     bigint,
  estado           public.estado_documento not null default 'cargado',
  observacion      text,
  created_at       timestamptz not null default now()
);
create index on public.medico_documentos (medico_id);

-- ---------------------------------------------------------------------
-- 8. Asignaciones radiólogo ↔ hospital
-- ---------------------------------------------------------------------
create table public.asignaciones (
  id                    uuid primary key default gen_random_uuid(),
  radiologo_id          uuid not null references public.medicos(id) on delete cascade,
  hospital_id           uuid not null references public.hospitales(id) on delete cascade,
  modalidades           public.modalidad[] not null default '{}',
  horario               text,
  sla_horas             integer default 6,
  carga_mensual_max     integer default 160,
  fecha_asignacion      date not null default current_date,
  fecha_fin             date,
  estado                public.estado_asignacion not null default 'activa',
  creado_por            uuid references auth.users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (radiologo_id, hospital_id)
);
create trigger trg_asignaciones_updated before update on public.asignaciones for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 9. Convocatorias de radiólogos y postulaciones
-- ---------------------------------------------------------------------
create table public.convocatorias (
  id                     uuid primary key default gen_random_uuid(),
  codigo                 text not null unique,                     -- CONV-2025-001 (se genera solo)
  titulo                 text not null,
  hospital_id            uuid references public.hospitales(id) on delete set null,
  modalidad_servicio     text[] not null default '{}'
                         check (modalidad_servicio <@ array['teleradiologia','presencial','hibrido']),
  descripcion            text,
  posiciones             integer not null default 1 check (posiciones > 0),
  tipo_contratacion      text,
  aplica_a               text not null default 'todos'
                         check (aplica_a in ('todos', 'sin_hospital', 'un_hospital', 'dos_o_mas')),
  regiones_interes       text[] not null default '{}',
  regiones_residencia    text[] not null default '{}',
  excluir_hospitales     uuid[] not null default '{}',
  rating_minimo          numeric(2,1),
  experiencia_minima     text,
  especialidades         public.modalidad[] not null default '{}',
  requisitos             jsonb not null default '{}'::jsonb,       -- requisitos y perfil (paso 2 del asistente)
  condiciones            jsonb not null default '{}'::jsonb,       -- condiciones y cronograma (paso 3)
  fecha_inicio           date,
  fecha_cierre           date,
  canales                public.canal_notificacion[] not null default '{email,portal}',
  asunto_mensaje         text,
  mensaje                text,
  estado                 public.estado_convocatoria not null default 'borrador',
  publicada_en           timestamptz,
  creado_por             uuid references auth.users(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (fecha_cierre is null or fecha_inicio is null or fecha_cierre >= fecha_inicio)
);
create trigger trg_convocatorias_updated before update on public.convocatorias for each row execute function public.set_updated_at();
create index on public.convocatorias (estado);

create table public.postulaciones (
  id                uuid primary key default gen_random_uuid(),
  convocatoria_id   uuid not null references public.convocatorias(id) on delete cascade,
  medico_id         uuid not null references public.medicos(id) on delete cascade,
  estado            public.estado_postulacion not null default 'aplicada',
  comentario        text,
  evaluacion        jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (convocatoria_id, medico_id)
);
create trigger trg_postulaciones_updated before update on public.postulaciones for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 10. Solicitudes de estudio (médico referidor), estudios e informes
-- ---------------------------------------------------------------------
create table public.solicitudes_estudio (
  id                 uuid primary key default gen_random_uuid(),
  medico_id          uuid not null references public.medicos(id) on delete cascade,
  paciente_id        uuid not null references public.pacientes(id) on delete cascade,
  hospital_id        uuid references public.hospitales(id) on delete set null,
  modalidad          public.modalidad not null,
  descripcion        text not null,
  prioridad          public.prioridad_estudio not null default 'ambulatorio',
  indicacion         text,
  estado             public.estado_solicitud not null default 'enviada',
  estudio_id         uuid,                       -- FK se agrega después de crear estudios
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_solicitudes_updated before update on public.solicitudes_estudio for each row execute function public.set_updated_at();
create index on public.solicitudes_estudio (medico_id);
create index on public.solicitudes_estudio (paciente_id);

create table public.estudios (
  id                    uuid primary key default gen_random_uuid(),
  numero_acceso         text not null unique,              -- EST-2025-000892 (se genera solo)
  paciente_id           uuid not null references public.pacientes(id) on delete restrict,
  hospital_id           uuid not null references public.hospitales(id) on delete restrict,
  medico_referidor_id   uuid references public.medicos(id) on delete set null,
  radiologo_id          uuid references public.medicos(id) on delete set null,
  solicitud_id          uuid references public.solicitudes_estudio(id) on delete set null,
  modalidad             public.modalidad not null,
  descripcion           text not null,                     -- Tomografía de cráneo simple
  prioridad             public.prioridad_estudio not null default 'ambulatorio',
  estado                public.estado_estudio not null default 'nuevo',
  indicacion_clinica    text,
  fecha_estudio         timestamptz not null default now(),
  recibido_en           timestamptz not null default now(),
  asignado_en           timestamptz,
  vence_en              timestamptz,                       -- fecha límite según prioridad (SLA)
  dicom_study_uid       text unique,                       -- identificador DICOM (fase de imágenes)
  num_imagenes          integer,
  miniatura_path        text,                              -- bucket "estudios-miniaturas"
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger trg_estudios_updated before update on public.estudios for each row execute function public.set_updated_at();
create index on public.estudios (paciente_id);
create index on public.estudios (hospital_id);
create index on public.estudios (radiologo_id, estado);
create index on public.estudios (medico_referidor_id);
create index on public.estudios (estado, prioridad);
create index on public.estudios (recibido_en desc);

alter table public.solicitudes_estudio
  add constraint solicitudes_estudio_fk foreign key (estudio_id) references public.estudios(id) on delete set null;

create table public.informes (
  id                 uuid primary key default gen_random_uuid(),
  numero             text not null unique,                 -- INF-2025-000567 (se genera solo)
  estudio_id         uuid not null unique references public.estudios(id) on delete cascade,
  radiologo_id       uuid not null references public.medicos(id) on delete restrict,
  plantilla          text,
  tecnica            text,
  hallazgos          text,
  impresion          text,
  hallazgo_critico   boolean not null default false,
  estado             public.estado_informe not null default 'borrador',
  firmado_en         timestamptz,
  publicado_en       timestamptz,
  pdf_path           text,                                 -- bucket "informes"
  calificacion       smallint check (calificacion between 1 and 5),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_informes_updated before update on public.informes for each row execute function public.set_updated_at();
create index on public.informes (radiologo_id, estado);

-- ---------------------------------------------------------------------
-- 11. Citas y seguimiento del paciente
-- ---------------------------------------------------------------------
create table public.citas (
  id             uuid primary key default gen_random_uuid(),
  paciente_id    uuid not null references public.pacientes(id) on delete cascade,
  hospital_id    uuid references public.hospitales(id) on delete set null,
  medico_id      uuid references public.medicos(id) on delete set null,
  estudio_id     uuid references public.estudios(id) on delete set null,
  tipo           text not null,                 -- Consulta, Estudio, Seguimiento
  fecha_hora     timestamptz not null,
  estado         public.estado_cita not null default 'programada',
  notas          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_citas_updated before update on public.citas for each row execute function public.set_updated_at();
create index on public.citas (paciente_id, fecha_hora);

-- ---------------------------------------------------------------------
-- 12. Accesos, notificaciones, alertas, contacto, auditoría
-- ---------------------------------------------------------------------
create table public.accesos_portal (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  dispositivo   text,          -- Celular, PC, Tablet
  navegador     text,          -- Chrome / Android
  ip            text,
  created_at    timestamptz not null default now()
);
create index on public.accesos_portal (user_id, created_at desc);

-- Cola de correos/avisos. Un proceso (Edge Function con el SMTP del cPanel) envía los "pendiente".
create table public.notificaciones (
  id                      uuid primary key default gen_random_uuid(),
  destinatario_user_id    uuid references auth.users(id) on delete cascade,
  destinatario_correo     text,
  canal                   public.canal_notificacion not null default 'email',
  plantilla               text not null,        -- registro_paciente, registro_medico, medico_aprobado, informe_publicado...
  asunto                  text,
  datos                   jsonb not null default '{}'::jsonb,
  estado                  public.estado_notificacion not null default 'pendiente',
  intentos                integer not null default 0,
  error                   text,
  leida                   boolean not null default false,
  enviado_en              timestamptz,
  created_at              timestamptz not null default now()
);
create index on public.notificaciones (estado, created_at);
create index on public.notificaciones (destinatario_user_id, leida);

create table public.alertas (
  id            uuid primary key default gen_random_uuid(),
  tipo          public.tipo_alerta not null,
  mensaje       text not null,
  hospital_id   uuid references public.hospitales(id) on delete cascade,
  estudio_id    uuid references public.estudios(id) on delete cascade,
  resuelta      boolean not null default false,
  resuelta_por  uuid references auth.users(id),
  created_at    timestamptz not null default now()
);
create index on public.alertas (resuelta, created_at desc);

create table public.mensajes_contacto (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  correo       text not null,
  telefono     text,
  tipo         text,
  mensaje      text not null,
  atendido     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table public.auditoria (
  id                 bigint generated always as identity primary key,
  user_id            uuid references auth.users(id) on delete set null,
  usuario            text,
  rol                public.app_rol,
  accion             text not null,      -- inicio_sesion, consulta, creacion, actualizacion, eliminacion, asignacion, cambio_rol, exportacion, acceso_denegado
  modulo             text not null,      -- Seguridad, Estudios, Pacientes, Informes, Configuración...
  registro_afectado  text,
  detalle            jsonb,
  ip                 text,
  navegador          text,
  dispositivo        text,
  resultado          public.resultado_auditoria not null default 'exitoso',
  observaciones      text,
  created_at         timestamptz not null default now()
);
create index on public.auditoria (created_at desc);
create index on public.auditoria (user_id, created_at desc);
create index on public.auditoria (modulo, accion);

-- ---------------------------------------------------------------------
-- 13. Configuración, permisos por rol y reportes
-- ---------------------------------------------------------------------
create table public.configuracion (
  clave          text primary key,
  valor          jsonb not null,
  descripcion    text,
  updated_at     timestamptz not null default now(),
  updated_by     uuid references auth.users(id)
);
create trigger trg_configuracion_updated before update on public.configuracion for each row execute function public.set_updated_at();

create table public.rol_permisos (
  rol        public.app_rol not null,
  permiso    text not null,           -- ej. pacientes.ver, informes.firmar, configuracion.editar
  primary key (rol, permiso)
);

create table public.reportes (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  tipo            text not null check (tipo in ('Operativo', 'Estadístico', 'Seguridad')),
  formato         text not null default 'PDF' check (formato in ('PDF', 'Excel', 'CSV')),
  filtros         jsonb not null default '{}'::jsonb,
  periodo_inicio  date,
  periodo_fin     date,
  estado          text not null default 'en_proceso' check (estado in ('en_proceso', 'completado', 'fallido')),
  archivo_path    text,
  generado_por    uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

commit;
