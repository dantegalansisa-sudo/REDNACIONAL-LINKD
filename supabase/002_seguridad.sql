-- =====================================================================
-- RedNacionalSalud.do — 002 SEGURIDAD
-- Funciones, códigos automáticos, registro de usuarios, notificaciones,
-- auditoría, políticas RLS y almacenamiento de archivos (Storage).
-- Ejecutar DESPUÉS de 001_esquema.sql
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1. Funciones de apoyo (security definer para evitar recursión en RLS)
-- ---------------------------------------------------------------------
create or replace function public.rol_actual() returns public.app_rol
language sql stable security definer set search_path = public as $$
  select rol from public.profiles where id = auth.uid() and estado = 'activo'
$$;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.rol_actual() = 'admin', false)
$$;

-- Personal del SNS con acceso al panel
create or replace function public.es_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.rol_actual() in ('admin', 'coordinador', 'operador'), false)
$$;

create or replace function public.es_gestor() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.rol_actual() in ('admin', 'coordinador'), false)
$$;

-- Médico aprobado vinculado al usuario actual (null si no aplica)
create or replace function public.mi_medico_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.medicos where user_id = auth.uid() and estado_registro = 'aprobado'
$$;

create or replace function public.mi_paciente_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.pacientes where user_id = auth.uid() and estado = 'activo'
$$;

-- ¿El usuario actual puede ver este estudio?
-- Recibe texto (p. ej. la carpeta de un archivo en Storage) para no fallar con valores que no son uuid.
create or replace function public.puede_ver_estudio(p_estudio text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.es_staff() or exists (
    select 1 from public.estudios e
    where e.id::text = p_estudio
      and (e.paciente_id = public.mi_paciente_id()
           or e.radiologo_id = public.mi_medico_id()
           or e.medico_referidor_id = public.mi_medico_id())
  )
$$;

-- IP del cliente desde las cabeceras de la API (puede ser null)
create or replace function public.ip_cliente() returns text
language sql stable as $$
  select split_part(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''), ',', 1)
$$;

-- ---------------------------------------------------------------------
-- 2. Códigos automáticos (RNS-, RAD-, MR-, EST-, INF-, CONV-)
-- ---------------------------------------------------------------------
create or replace function public.asignar_codigo_paciente() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo := 'RNS-' || lpad(nextval('public.seq_codigo_paciente')::text, 8, '0');
  end if;
  if new.tipo_documento = 'cedula' then
    new.documento := regexp_replace(new.documento, '\D', '', 'g');
  else
    new.documento := upper(regexp_replace(new.documento, '\s', '', 'g'));
  end if;
  return new;
end $$;
create trigger trg_pacientes_codigo before insert on public.pacientes for each row execute function public.asignar_codigo_paciente();

create or replace function public.asignar_codigo_medico() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo := case new.tipo
      when 'radiologo' then 'RAD-' || lpad(nextval('public.seq_codigo_radiologo')::text, 4, '0')
      else 'MR-' || lpad(nextval('public.seq_codigo_referidor')::text, 6, '0')
    end;
  end if;
  return new;
end $$;
create trigger trg_medicos_codigo before insert on public.medicos for each row execute function public.asignar_codigo_medico();

create or replace function public.asignar_numero_estudio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.numero_acceso is null or new.numero_acceso = '' then
    new.numero_acceso := 'EST-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.seq_numero_estudio')::text, 6, '0');
  end if;
  -- Fecha límite de lectura según prioridad (valores en configuracion.tiempos_objetivo)
  if new.vence_en is null then
    new.vence_en := new.recibido_en + case new.prioridad
      when 'emergencia'    then interval '30 minutes'
      when 'urgencia'      then interval '2 hours'
      when 'hospitalizado' then interval '48 hours'
      else                      interval '7 days'
    end;
  end if;
  return new;
end $$;
create trigger trg_estudios_numero before insert on public.estudios for each row execute function public.asignar_numero_estudio();

create or replace function public.asignar_numero_informe() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.numero is null or new.numero = '' then
    new.numero := 'INF-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.seq_numero_informe')::text, 6, '0');
  end if;
  return new;
end $$;
create trigger trg_informes_numero before insert on public.informes for each row execute function public.asignar_numero_informe();

create or replace function public.asignar_codigo_convocatoria() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo := 'CONV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.seq_codigo_convocatoria')::text, 3, '0');
  end if;
  return new;
end $$;
create trigger trg_convocatorias_codigo before insert on public.convocatorias for each row execute function public.asignar_codigo_convocatoria();

-- ---------------------------------------------------------------------
-- 3. Alta de usuarios: al crearse un usuario en auth.users se crea su perfil
--    y, según el rol enviado en los metadatos del signUp, su ficha de
--    paciente o de médico. Solo se permiten roles públicos.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m        jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_rol    text  := m ->> 'rol';
  v_pac    public.pacientes%rowtype;
  v_med    public.medicos%rowtype;
begin
  -- Usuarios creados desde el panel de Supabase (personal del SNS): perfil sin rol;
  -- el administrador le asigna el rol después.
  if v_rol is null then
    insert into public.profiles (id, correo, nombre_completo)
    values (new.id, new.email, coalesce(m ->> 'nombre_completo', new.email));
    return new;
  end if;

  if v_rol not in ('paciente', 'radiologo', 'referidor') then
    raise exception 'Rol no permitido en el registro público: %', v_rol;
  end if;

  if v_rol = 'paciente' then
    insert into public.pacientes (
      user_id, tipo_documento, documento, nombres, apellidos, fecha_nacimiento, sexo, nacionalidad,
      telefono, whatsapp, correo, provincia, municipio, sector, calle, numero, apartamento, referencia,
      ocupacion, estado_civil, emergencia_telefono, emergencia_parentesco
    ) values (
      new.id,
      coalesce(m ->> 'tipo_documento', 'cedula')::public.tipo_documento,
      m ->> 'documento', m ->> 'nombres', m ->> 'apellidos',
      nullif(m ->> 'fecha_nacimiento', '')::date, nullif(m ->> 'sexo', ''), coalesce(nullif(m ->> 'nacionalidad', ''), 'Dominicana'),
      m ->> 'telefono', m ->> 'whatsapp', nullif(m ->> 'correo', ''),
      m ->> 'provincia', m ->> 'municipio', m ->> 'sector', m ->> 'calle', m ->> 'numero', m ->> 'apartamento', m ->> 'referencia',
      m ->> 'ocupacion', m ->> 'estado_civil', m ->> 'emergencia_telefono', m ->> 'emergencia_parentesco'
    ) returning * into v_pac;

    insert into public.profiles (id, rol, correo, nombre_completo, telefono)
    values (new.id, 'paciente', v_pac.correo, v_pac.nombre_completo, v_pac.telefono);

  else
    insert into public.medicos (
      user_id, tipo, exequatur, tratamiento, nombres, apellidos, cedula, sexo, tel_residencia, tel_whatsapp, correo,
      provincia, municipio, sector, calle, casa, residencial, especialidades, otra_especialidad, regiones_interes
    ) values (
      new.id, v_rol::public.tipo_medico, m ->> 'exequatur', coalesce(nullif(m ->> 'tratamiento', ''), 'Dr.'),
      m ->> 'nombres', m ->> 'apellidos', m ->> 'cedula', nullif(m ->> 'sexo', ''),
      m ->> 'tel_residencia', m ->> 'tel_whatsapp', new.email,
      m ->> 'provincia', m ->> 'municipio', m ->> 'sector', m ->> 'calle', m ->> 'casa', m ->> 'residencial',
      coalesce(array(select jsonb_array_elements_text(m -> 'especialidades')), '{}'),
      nullif(m ->> 'otra_especialidad', ''),
      coalesce(array(select jsonb_array_elements_text(m -> 'regiones_interes')), '{}')
    ) returning * into v_med;

    insert into public.profiles (id, rol, correo, nombre_completo, telefono)
    values (new.id, v_rol::public.app_rol, new.email, v_med.tratamiento || ' ' || v_med.nombre_completo, v_med.tel_whatsapp);
  end if;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 4. Protección de campos sensibles (solo el personal autorizado los cambia).
--    auth.uid() es null cuando se ejecuta desde el SQL Editor o con la service_role.
-- ---------------------------------------------------------------------
create or replace function public.proteger_profiles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.es_admin()
     and (new.rol is distinct from old.rol or new.estado is distinct from old.estado or new.hospital_id is distinct from old.hospital_id) then
    raise exception 'No autorizado para cambiar rol, estado u hospital';
  end if;
  return new;
end $$;
create trigger trg_profiles_proteger before update on public.profiles for each row execute function public.proteger_profiles();

create or replace function public.proteger_pacientes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.es_staff()
     and (new.codigo is distinct from old.codigo or new.documento is distinct from old.documento
          or new.tipo_documento is distinct from old.tipo_documento or new.nombres is distinct from old.nombres
          or new.apellidos is distinct from old.apellidos or new.fecha_nacimiento is distinct from old.fecha_nacimiento
          or new.user_id is distinct from old.user_id or new.estado is distinct from old.estado) then
    raise exception 'Estos datos solo los puede corregir el personal autorizado';
  end if;
  return new;
end $$;
create trigger trg_pacientes_proteger before update on public.pacientes for each row execute function public.proteger_pacientes();

create or replace function public.proteger_medicos() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.es_gestor()
     and (new.estado_registro is distinct from old.estado_registro or new.exequatur is distinct from old.exequatur
          or new.tipo is distinct from old.tipo or new.codigo is distinct from old.codigo or new.user_id is distinct from old.user_id
          or new.rating is distinct from old.rating or new.aprobado_por is distinct from old.aprobado_por) then
    raise exception 'Estos datos solo los puede cambiar un administrador o coordinador';
  end if;
  if new.estado_registro = 'aprobado' and old.estado_registro is distinct from 'aprobado' then
    new.aprobado_por := coalesce(new.aprobado_por, auth.uid());
    new.aprobado_en  := now();
  end if;
  return new;
end $$;
create trigger trg_medicos_proteger before update on public.medicos for each row execute function public.proteger_medicos();

-- El radiólogo solo puede cambiar el estado de lectura de sus estudios
create or replace function public.proteger_estudios() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.es_staff()
     and (new.paciente_id is distinct from old.paciente_id or new.hospital_id is distinct from old.hospital_id
          or new.radiologo_id is distinct from old.radiologo_id or new.medico_referidor_id is distinct from old.medico_referidor_id
          or new.numero_acceso is distinct from old.numero_acceso or new.prioridad is distinct from old.prioridad
          or new.modalidad is distinct from old.modalidad or new.vence_en is distinct from old.vence_en) then
    raise exception 'Solo el personal autorizado puede modificar estos datos del estudio';
  end if;
  if new.radiologo_id is not null and old.radiologo_id is distinct from new.radiologo_id then
    new.asignado_en := now();
    if new.estado = 'nuevo' then new.estado := 'asignado'; end if;
  end if;
  return new;
end $$;
create trigger trg_estudios_proteger before update on public.estudios for each row execute function public.proteger_estudios();

-- Informe: al firmar/publicar se registran las fechas y se actualiza el estudio
create or replace function public.flujo_informe() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.estado = 'publicado' and auth.uid() is not null and not public.es_gestor()
     and (new.hallazgos is distinct from old.hallazgos or new.impresion is distinct from old.impresion or new.tecnica is distinct from old.tecnica) then
    raise exception 'Un informe publicado solo puede corregirse con autorización (estado "corregido")';
  end if;
  if new.estado in ('firmado', 'publicado') and new.firmado_en is null then
    new.firmado_en := now();
  end if;
  if new.estado = 'publicado' and new.publicado_en is null then
    new.publicado_en := now();
    update public.estudios set estado = 'informado' where id = new.estudio_id;
  elsif new.estado = 'borrador' then
    update public.estudios set estado = 'en_lectura' where id = new.estudio_id and estado in ('nuevo', 'asignado');
  end if;
  return new;
end $$;
create trigger trg_informes_flujo before insert or update on public.informes for each row execute function public.flujo_informe();

-- ---------------------------------------------------------------------
-- 5. Notificaciones automáticas (se encolan en public.notificaciones)
-- ---------------------------------------------------------------------
create or replace function public.notificar_admins(p_plantilla text, p_asunto text, p_datos jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.notificaciones (destinatario_user_id, destinatario_correo, canal, plantilla, asunto, datos)
  select p.id, p.correo, c.canal, p_plantilla, p_asunto, p_datos
  from public.profiles p
  cross join (values ('email'::public.canal_notificacion), ('portal'::public.canal_notificacion)) as c(canal)
  where p.rol = 'admin' and p.estado = 'activo'
$$;

create or replace function public.notificar_registro_paciente() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.correo is not null then
    insert into public.notificaciones (destinatario_user_id, destinatario_correo, plantilla, asunto, datos)
    values (new.user_id, new.correo, 'registro_paciente', 'Bienvenido a la Red Nacional de Salud',
            jsonb_build_object('nombre', new.nombres, 'codigo', new.codigo));
  end if;
  return new;
end $$;
create trigger trg_pacientes_notificar after insert on public.pacientes for each row execute function public.notificar_registro_paciente();

create or replace function public.notificar_medico() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notificaciones (destinatario_user_id, destinatario_correo, plantilla, asunto, datos)
    values (new.user_id, new.correo, 'registro_medico_recibido', 'Hemos recibido su solicitud de registro',
            jsonb_build_object('nombre', new.tratamiento || ' ' || new.nombre_completo, 'tipo', new.tipo));
    perform public.notificar_admins('nuevo_registro_medico', 'Nuevo registro de médico pendiente de aprobación',
            jsonb_build_object('medico_id', new.id, 'nombre', new.nombre_completo, 'tipo', new.tipo, 'exequatur', new.exequatur));
  elsif new.estado_registro is distinct from old.estado_registro and new.estado_registro in ('aprobado', 'rechazado') then
    insert into public.notificaciones (destinatario_user_id, destinatario_correo, plantilla, asunto, datos)
    values (new.user_id, new.correo,
            case new.estado_registro when 'aprobado' then 'medico_aprobado' else 'medico_rechazado' end,
            case new.estado_registro when 'aprobado' then 'Su cuenta ha sido aprobada' else 'Resultado de su solicitud de registro' end,
            jsonb_build_object('nombre', new.tratamiento || ' ' || new.nombre_completo, 'codigo', new.codigo, 'motivo', new.motivo_rechazo));
  end if;
  return new;
end $$;
create trigger trg_medicos_notificar after insert or update on public.medicos for each row execute function public.notificar_medico();

create or replace function public.notificar_informe_publicado() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  e record;
begin
  if new.estado = 'publicado' and (tg_op = 'INSERT' or old.estado is distinct from 'publicado') then
    select es.numero_acceso, es.descripcion, p.user_id as pac_user, p.correo as pac_correo, p.nombres as pac_nombre,
           m.user_id as ref_user, m.correo as ref_correo
      into e
      from public.estudios es
      join public.pacientes p on p.id = es.paciente_id
      left join public.medicos m on m.id = es.medico_referidor_id
     where es.id = new.estudio_id;

    insert into public.notificaciones (destinatario_user_id, destinatario_correo, canal, plantilla, asunto, datos)
    select x.u, x.c, x.canal, 'informe_publicado', 'Su informe ya está disponible',
           jsonb_build_object('numero_acceso', e.numero_acceso, 'estudio', e.descripcion, 'paciente', e.pac_nombre)
    from (values (e.pac_user, e.pac_correo, 'email'::public.canal_notificacion),
                 (e.pac_user, null, 'portal'::public.canal_notificacion),
                 (e.ref_user, e.ref_correo, 'email'::public.canal_notificacion),
                 (e.ref_user, null, 'portal'::public.canal_notificacion)) as x(u, c, canal)
    where x.u is not null and (x.canal = 'portal' or x.c is not null);
  end if;
  return new;
end $$;
create trigger trg_informes_notificar after insert or update on public.informes for each row execute function public.notificar_informe_publicado();

create or replace function public.notificar_contacto() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notificar_admins('mensaje_contacto', 'Nuevo mensaje desde el formulario de contacto',
          jsonb_build_object('nombre', new.nombre, 'correo', new.correo, 'tipo', new.tipo, 'mensaje', new.mensaje));
  return new;
end $$;
create trigger trg_contacto_notificar after insert on public.mensajes_contacto for each row execute function public.notificar_contacto();

-- ---------------------------------------------------------------------
-- 6. Auditoría automática de cambios en tablas clave
-- ---------------------------------------------------------------------
create or replace function public.registrar_auditoria() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_id     text;
  v_accion text := case tg_op when 'INSERT' then 'creacion' when 'UPDATE' then 'actualizacion' else 'eliminacion' end;
  v_fila   jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  v_id := coalesce(v_fila ->> 'codigo', v_fila ->> 'numero_acceso', v_fila ->> 'numero', v_fila ->> 'clave', v_fila ->> 'id');
  insert into public.auditoria (user_id, usuario, rol, accion, modulo, registro_afectado, ip, detalle)
  values (auth.uid(),
          (select correo from public.profiles where id = auth.uid()),
          public.rol_actual(), v_accion, tg_argv[0], v_id, public.ip_cliente(),
          case when tg_op = 'UPDATE' then jsonb_build_object('tabla', tg_table_name) else null end);
  return case when tg_op = 'DELETE' then old else new end;
end $$;

create trigger trg_aud_pacientes      after insert or update or delete on public.pacientes      for each row execute function public.registrar_auditoria('Pacientes');
create trigger trg_aud_medicos        after insert or update or delete on public.medicos        for each row execute function public.registrar_auditoria('Radiólogos y médicos');
create trigger trg_aud_hospitales     after insert or update or delete on public.hospitales     for each row execute function public.registrar_auditoria('Hospitales');
create trigger trg_aud_estudios       after insert or update or delete on public.estudios       for each row execute function public.registrar_auditoria('Estudios');
create trigger trg_aud_informes       after insert or update or delete on public.informes       for each row execute function public.registrar_auditoria('Informes');
create trigger trg_aud_convocatorias  after insert or update or delete on public.convocatorias  for each row execute function public.registrar_auditoria('Convocatorias');
create trigger trg_aud_asignaciones   after insert or update or delete on public.asignaciones   for each row execute function public.registrar_auditoria('Asignaciones');
create trigger trg_aud_configuracion  after insert or update or delete on public.configuracion  for each row execute function public.registrar_auditoria('Configuración');
create trigger trg_aud_profiles       after update of rol, estado, hospital_id or delete on public.profiles for each row execute function public.registrar_auditoria('Administración');

-- ---------------------------------------------------------------------
-- 7. Funciones que llama la web (RPC)
-- ---------------------------------------------------------------------

-- Registro de paciente, paso 1: ¿ya existe este documento?
create or replace function public.documento_registrado(p_tipo text, p_documento text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pacientes
    where tipo_documento = p_tipo::public.tipo_documento
      and documento = case when p_tipo = 'cedula' then regexp_replace(p_documento, '\D', '', 'g')
                           else upper(regexp_replace(p_documento, '\s', '', 'g')) end)
$$;

-- Registro de médico: ¿ya existe este exequátur?
create or replace function public.exequatur_registrado(p_exequatur text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.medicos where exequatur = trim(p_exequatur))
$$;

-- Login de paciente: el paciente escribe su código RNS-XXXXXXXX; la web obtiene
-- el correo interno de su cuenta para iniciar sesión (no expone datos personales).
create or replace function public.correo_login_paciente(p_codigo text) returns text
language sql stable security definer set search_path = public, auth as $$
  select u.email
  from public.pacientes p
  join auth.users u on u.id = p.user_id
  where p.codigo = upper(trim(p_codigo)) and p.estado = 'activo'
$$;

-- Primer acceso: el paciente ya creó su contraseña personal
create or replace function public.marcar_clave_cambiada() returns void
language sql security definer set search_path = public as $$
  update public.pacientes set debe_cambiar_clave = false where user_id = auth.uid()
$$;

-- Registrar inicio de sesión (tabla de accesos + auditoría)
create or replace function public.registrar_acceso(p_dispositivo text, p_navegador text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.accesos_portal (user_id, dispositivo, navegador, ip)
  values (auth.uid(), p_dispositivo, p_navegador, public.ip_cliente());
  update public.profiles set ultimo_acceso = now() where id = auth.uid();
  insert into public.auditoria (user_id, usuario, rol, accion, modulo, ip, navegador, dispositivo, observaciones)
  values (auth.uid(), (select correo from public.profiles where id = auth.uid()), public.rol_actual(),
          'inicio_sesion', 'Seguridad', public.ip_cliente(), p_navegador, p_dispositivo, 'Inicio de sesión correcto');
end $$;

-- Médico referidor: buscar paciente por documento para crear una solicitud
create or replace function public.buscar_paciente_por_documento(p_documento text)
returns table (id uuid, codigo text, nombre_completo text, sexo text, fecha_nacimiento date)
language sql stable security definer set search_path = public as $$
  select p.id, p.codigo, p.nombre_completo, p.sexo, p.fecha_nacimiento
  from public.pacientes p
  where (public.es_staff() or public.rol_actual() = 'referidor')
    and p.documento in (regexp_replace(p_documento, '\D', '', 'g'), upper(regexp_replace(p_documento, '\s', '', 'g')))
$$;

-- Indicadores públicos para la página de inicio y Estadísticas
create or replace function public.estadisticas_publicas() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'hospitales_conectados', (select count(*) from public.hospitales where estado = 'activo'),
    'radiologos',            (select count(*) from public.medicos where tipo = 'radiologo' and estado_registro = 'aprobado'),
    'estudios_anio',         (select count(*) from public.estudios where recibido_en >= date_trunc('year', now())),
    'imagenes',              (select coalesce(sum(num_imagenes), 0) from public.estudios)
  )
$$;

-- KPIs del Dashboard del panel de administración
create or replace function public.kpis_dashboard(p_desde date default (current_date - 30), p_hasta date default current_date)
returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_staff() then
    raise exception 'No autorizado';
  end if;
  return json_build_object(
    'hospitales',           (select count(*) from public.hospitales),
    'hospitales_activos',   (select count(*) from public.hospitales where estado = 'activo'),
    'estudios_recibidos',   (select count(*) from public.estudios where recibido_en::date between p_desde and p_hasta),
    'informes_emitidos',    (select count(*) from public.informes where publicado_en::date between p_desde and p_hasta),
    'estudios_pendientes',  (select count(*) from public.estudios where estado in ('nuevo', 'asignado', 'en_lectura')),
    'radiologos_activos',   (select count(*) from public.medicos where tipo = 'radiologo' and estado_registro = 'aprobado'),
    'medicos_pendientes',   (select count(*) from public.medicos where estado_registro = 'pendiente'),
    'incidencias_criticas', (select count(*) from public.alertas where tipo = 'critico' and not resuelta),
    'por_modalidad',        (select coalesce(json_object_agg(modalidad, n), '{}'::json) from (
                               select modalidad, count(*) n from public.estudios
                               where recibido_en::date between p_desde and p_hasta group by modalidad) t),
    'por_estado',           (select coalesce(json_object_agg(estado, n), '{}'::json) from (
                               select estado, count(*) n from public.estudios
                               where recibido_en::date between p_desde and p_hasta group by estado) t),
    'tiempo_promedio_horas',(select round(avg(extract(epoch from (i.publicado_en - e.recibido_en)) / 3600)::numeric, 1)
                               from public.informes i join public.estudios e on e.id = i.estudio_id
                              where i.publicado_en::date between p_desde and p_hasta)
  );
end $$;

-- El médico referidor califica un informe publicado (1 a 5)
create or replace function public.calificar_informe(p_informe uuid, p_calificacion smallint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_calificacion not between 1 and 5 then raise exception 'Calificación inválida'; end if;
  update public.informes i set calificacion = p_calificacion
   where i.id = p_informe and i.estado = 'publicado'
     and exists (select 1 from public.estudios e where e.id = i.estudio_id and e.medico_referidor_id = public.mi_medico_id());
  if not found then raise exception 'No autorizado'; end if;
end $$;

-- Permisos de ejecución: se quitan a todos y se conceden solo los necesarios
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.documento_registrado(text, text)        to anon, authenticated;
grant execute on function public.exequatur_registrado(text)              to anon, authenticated;
grant execute on function public.correo_login_paciente(text)             to anon, authenticated;
grant execute on function public.estadisticas_publicas()                 to anon, authenticated;
grant execute on function public.marcar_clave_cambiada()                 to authenticated;
grant execute on function public.registrar_acceso(text, text)            to authenticated;
grant execute on function public.buscar_paciente_por_documento(text)     to authenticated;
grant execute on function public.kpis_dashboard(date, date)              to authenticated;
grant execute on function public.calificar_informe(uuid, smallint)        to authenticated;
grant execute on function public.rol_actual()                            to authenticated;
grant execute on function public.es_admin()                              to anon, authenticated;
grant execute on function public.es_staff()                              to anon, authenticated;
grant execute on function public.es_gestor()                             to anon, authenticated;
grant execute on function public.mi_medico_id()                          to anon, authenticated;
grant execute on function public.mi_paciente_id()                        to anon, authenticated;
grant execute on function public.puede_ver_estudio(text)                 to anon, authenticated;
grant execute on function public.ip_cliente()                            to anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. Row Level Security (RLS): nadie ve nada salvo lo que permiten estas políticas
-- ---------------------------------------------------------------------
alter table public.provincias          enable row level security;
alter table public.municipios          enable row level security;
alter table public.profiles            enable row level security;
alter table public.hospitales          enable row level security;
alter table public.equipos_imagen      enable row level security;
alter table public.linkconnect_nodos   enable row level security;
alter table public.linkconnect_eventos enable row level security;
alter table public.pacientes           enable row level security;
alter table public.medicos             enable row level security;
alter table public.medico_documentos   enable row level security;
alter table public.asignaciones        enable row level security;
alter table public.convocatorias       enable row level security;
alter table public.postulaciones       enable row level security;
alter table public.solicitudes_estudio enable row level security;
alter table public.estudios            enable row level security;
alter table public.informes            enable row level security;
alter table public.citas               enable row level security;
alter table public.accesos_portal      enable row level security;
alter table public.notificaciones      enable row level security;
alter table public.alertas             enable row level security;
alter table public.mensajes_contacto   enable row level security;
alter table public.auditoria           enable row level security;
alter table public.configuracion       enable row level security;
alter table public.rol_permisos        enable row level security;
alter table public.reportes            enable row level security;

-- Catálogos: lectura pública (los usan los formularios de registro)
create policy "catalogo provincias lectura" on public.provincias for select to anon, authenticated using (true);
create policy "catalogo municipios lectura" on public.municipios for select to anon, authenticated using (true);
create policy "catalogo provincias admin"   on public.provincias for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "catalogo municipios admin"   on public.municipios for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Perfiles
create policy "perfil propio lectura"   on public.profiles for select to authenticated using (id = auth.uid() or public.es_staff());
create policy "perfil propio edicion"   on public.profiles for update to authenticated using (id = auth.uid() or public.es_admin()) with check (id = auth.uid() or public.es_admin());
create policy "perfil admin borrar"     on public.profiles for delete to authenticated using (public.es_admin());

-- Hospitales (todos los usuarios con sesión los ven; solo admin/coordinador los editan)
create policy "hospitales lectura"      on public.hospitales for select to authenticated using (true);
create policy "hospitales gestion"      on public.hospitales for all to authenticated using (public.es_gestor()) with check (public.es_gestor());
create policy "equipos lectura"         on public.equipos_imagen for select to authenticated using (true);
create policy "equipos gestion"         on public.equipos_imagen for all to authenticated using (public.es_gestor()) with check (public.es_gestor());
create policy "linkconnect lectura"     on public.linkconnect_nodos for select to authenticated using (public.es_staff());
create policy "linkconnect gestion"     on public.linkconnect_nodos for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "linkconnect ev lectura"  on public.linkconnect_eventos for select to authenticated using (public.es_staff());
create policy "linkconnect ev gestion"  on public.linkconnect_eventos for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Pacientes
create policy "pacientes lectura" on public.pacientes for select to authenticated using (
  user_id = auth.uid()
  or public.es_staff()
  or exists (select 1 from public.estudios e where e.paciente_id = pacientes.id
             and (e.radiologo_id = public.mi_medico_id() or e.medico_referidor_id = public.mi_medico_id()))
  or exists (select 1 from public.solicitudes_estudio s where s.paciente_id = pacientes.id and s.medico_id = public.mi_medico_id())
);
create policy "pacientes edicion" on public.pacientes for update to authenticated
  using (user_id = auth.uid() or public.es_staff()) with check (user_id = auth.uid() or public.es_staff());
create policy "pacientes alta staff" on public.pacientes for insert to authenticated with check (public.es_staff());
create policy "pacientes borrar"     on public.pacientes for delete to authenticated using (public.es_admin());

-- Médicos
create policy "medicos lectura" on public.medicos for select to authenticated using (
  user_id = auth.uid()
  or public.es_staff()
  or exists (select 1 from public.estudios e where e.paciente_id = public.mi_paciente_id()
             and (e.medico_referidor_id = medicos.id or e.radiologo_id = medicos.id))
);
create policy "medicos edicion" on public.medicos for update to authenticated
  using (user_id = auth.uid() or public.es_gestor()) with check (user_id = auth.uid() or public.es_gestor());
create policy "medicos borrar"  on public.medicos for delete to authenticated using (public.es_admin());

create policy "documentos medico lectura" on public.medico_documentos for select to authenticated using (
  public.es_staff() or exists (select 1 from public.medicos m where m.id = medico_id and m.user_id = auth.uid()));
create policy "documentos medico subir" on public.medico_documentos for insert to authenticated with check (
  public.es_staff() or exists (select 1 from public.medicos m where m.id = medico_id and m.user_id = auth.uid()));
create policy "documentos medico revisar" on public.medico_documentos for update to authenticated using (public.es_gestor()) with check (public.es_gestor());
create policy "documentos medico borrar" on public.medico_documentos for delete to authenticated using (
  public.es_admin() or exists (select 1 from public.medicos m where m.id = medico_id and m.user_id = auth.uid() and m.estado_registro = 'pendiente'));

-- Asignaciones
create policy "asignaciones lectura" on public.asignaciones for select to authenticated using (public.es_staff() or radiologo_id = public.mi_medico_id());
create policy "asignaciones gestion" on public.asignaciones for all to authenticated using (public.es_gestor()) with check (public.es_gestor());

-- Convocatorias y postulaciones
create policy "convocatorias lectura" on public.convocatorias for select to authenticated using (
  public.es_staff() or (estado = 'activa' and public.rol_actual() = 'radiologo' and public.mi_medico_id() is not null));
create policy "convocatorias gestion" on public.convocatorias for all to authenticated using (public.es_gestor()) with check (public.es_gestor());

create policy "postulaciones lectura" on public.postulaciones for select to authenticated using (public.es_staff() or medico_id = public.mi_medico_id());
create policy "postulaciones aplicar" on public.postulaciones for insert to authenticated with check (
  medico_id = public.mi_medico_id() and estado = 'aplicada'
  and exists (select 1 from public.convocatorias c where c.id = convocatoria_id and c.estado = 'activa'));
create policy "postulaciones gestion" on public.postulaciones for update to authenticated
  using (public.es_gestor() or medico_id = public.mi_medico_id())
  with check (public.es_gestor() or (medico_id = public.mi_medico_id() and estado in ('aplicada', 'retirada')));
create policy "postulaciones borrar" on public.postulaciones for delete to authenticated using (public.es_admin());

-- Solicitudes de estudio (referidor)
create policy "solicitudes lectura" on public.solicitudes_estudio for select to authenticated using (
  public.es_staff() or medico_id = public.mi_medico_id() or paciente_id = public.mi_paciente_id());
create policy "solicitudes crear" on public.solicitudes_estudio for insert to authenticated with check (
  public.es_staff() or (medico_id = public.mi_medico_id() and public.rol_actual() = 'referidor' and estado = 'enviada'));
create policy "solicitudes editar" on public.solicitudes_estudio for update to authenticated
  using (public.es_staff() or medico_id = public.mi_medico_id()) with check (public.es_staff() or medico_id = public.mi_medico_id());

-- Estudios
create policy "estudios lectura" on public.estudios for select to authenticated using (
  public.es_staff() or paciente_id = public.mi_paciente_id()
  or radiologo_id = public.mi_medico_id() or medico_referidor_id = public.mi_medico_id());
create policy "estudios alta"    on public.estudios for insert to authenticated with check (public.es_staff());
create policy "estudios editar"  on public.estudios for update to authenticated
  using (public.es_staff() or radiologo_id = public.mi_medico_id()) with check (public.es_staff() or radiologo_id = public.mi_medico_id());
create policy "estudios borrar"  on public.estudios for delete to authenticated using (public.es_admin());

-- Informes: el paciente y el referidor solo ven informes PUBLICADOS
create policy "informes lectura" on public.informes for select to authenticated using (
  public.es_staff() or radiologo_id = public.mi_medico_id()
  or (estado = 'publicado' and exists (select 1 from public.estudios e where e.id = estudio_id
       and (e.paciente_id = public.mi_paciente_id() or e.medico_referidor_id = public.mi_medico_id()))));
create policy "informes redactar" on public.informes for insert to authenticated with check (
  public.es_gestor() or (radiologo_id = public.mi_medico_id()
    and exists (select 1 from public.estudios e where e.id = estudio_id and e.radiologo_id = public.mi_medico_id())));
create policy "informes editar" on public.informes for update to authenticated
  using (public.es_gestor() or radiologo_id = public.mi_medico_id())
  with check (public.es_gestor() or radiologo_id = public.mi_medico_id());

-- Citas
create policy "citas lectura" on public.citas for select to authenticated using (
  public.es_staff() or paciente_id = public.mi_paciente_id() or medico_id = public.mi_medico_id());
create policy "citas gestion" on public.citas for all to authenticated using (public.es_staff()) with check (public.es_staff());

-- Accesos al portal
create policy "accesos lectura" on public.accesos_portal for select to authenticated using (user_id = auth.uid() or public.es_staff());

-- Notificaciones: cada usuario ve las suyas; el admin todas
create policy "notificaciones lectura" on public.notificaciones for select to authenticated using (destinatario_user_id = auth.uid() or public.es_admin());
create policy "notificaciones marcar leida" on public.notificaciones for update to authenticated
  using (destinatario_user_id = auth.uid() or public.es_admin()) with check (destinatario_user_id = auth.uid() or public.es_admin());

-- Alertas
create policy "alertas lectura" on public.alertas for select to authenticated using (public.es_staff());
create policy "alertas gestion" on public.alertas for all to authenticated using (public.es_staff()) with check (public.es_staff());

-- Formulario de contacto: cualquiera puede escribir; solo el personal lee
create policy "contacto enviar"  on public.mensajes_contacto for insert to anon, authenticated with check (true);
create policy "contacto lectura" on public.mensajes_contacto for select to authenticated using (public.es_staff());
create policy "contacto atender" on public.mensajes_contacto for update to authenticated using (public.es_staff()) with check (public.es_staff());

-- Auditoría: solo el administrador la consulta; nadie la edita ni la borra
create policy "auditoria lectura" on public.auditoria for select to authenticated using (public.es_admin());
create policy "auditoria registrar" on public.auditoria for insert to authenticated with check (user_id = auth.uid());

-- Configuración y permisos
create policy "configuracion lectura" on public.configuracion for select to authenticated using (true);
create policy "configuracion admin"   on public.configuracion for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "permisos lectura"      on public.rol_permisos for select to authenticated using (true);
create policy "permisos admin"        on public.rol_permisos for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Reportes
create policy "reportes lectura" on public.reportes for select to authenticated using (public.es_staff());
create policy "reportes generar" on public.reportes for insert to authenticated with check (public.es_staff() and generado_por = auth.uid());
create policy "reportes borrar"  on public.reportes for delete to authenticated using (public.es_admin());

-- ---------------------------------------------------------------------
-- 9. Almacenamiento de archivos (Storage) — todos los buckets son PRIVADOS
--    Estructura de rutas:
--      documentos-medicos/<user_id>/<archivo>
--      fotos-perfil/<user_id>/<archivo>
--      informes/<estudio_id>/<archivo>.pdf
--      estudios-miniaturas/<estudio_id>/<archivo>
--      institucional/<archivo>     (logos; lectura pública)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('documentos-medicos',  'documentos-medicos',  false, 5242880,  array['application/pdf', 'image/png', 'image/jpeg']),
  ('fotos-perfil',        'fotos-perfil',        false, 5242880,  array['image/png', 'image/jpeg', 'image/webp']),
  ('informes',            'informes',            false, 10485760, array['application/pdf']),
  ('estudios-miniaturas', 'estudios-miniaturas', false, 5242880,  array['image/png', 'image/jpeg', 'image/webp']),
  ('institucional',       'institucional',       true,  5242880,  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "docs medicos subir propios" on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos-medicos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "docs medicos ver" on storage.objects for select to authenticated
  using (bucket_id = 'documentos-medicos' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_staff()));
create policy "docs medicos borrar" on storage.objects for delete to authenticated
  using (bucket_id = 'documentos-medicos' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin()));

create policy "fotos subir propias" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos-perfil' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos actualizar propias" on storage.objects for update to authenticated
  using (bucket_id = 'fotos-perfil' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos ver" on storage.objects for select to authenticated
  using (bucket_id = 'fotos-perfil');

create policy "informes pdf ver" on storage.objects for select to authenticated
  using (bucket_id = 'informes' and public.puede_ver_estudio((storage.foldername(name))[1]));
create policy "informes pdf subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'informes' and (public.es_staff() or exists (
    select 1 from public.estudios e where e.id::text = (storage.foldername(name))[1] and e.radiologo_id = public.mi_medico_id())));

create policy "miniaturas ver" on storage.objects for select to authenticated
  using (bucket_id = 'estudios-miniaturas' and public.puede_ver_estudio((storage.foldername(name))[1]));
create policy "miniaturas subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'estudios-miniaturas' and public.es_staff());

create policy "institucional ver" on storage.objects for select to anon, authenticated using (bucket_id = 'institucional');
create policy "institucional gestionar" on storage.objects for all to authenticated
  using (bucket_id = 'institucional' and public.es_admin()) with check (bucket_id = 'institucional' and public.es_admin());

commit;
