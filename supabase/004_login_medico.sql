-- =====================================================================
-- RedNacionalSalud.do — 004 LOGIN DE MÉDICO POR EXEQUÁTUR
-- Permite que el médico inicie sesión escribiendo su número de exequátur
-- (además de su correo). Solo devuelve el correo de médicos APROBADOS.
-- Ejecutar DESPUÉS de 003_datos_iniciales.sql
-- =====================================================================
begin;

create or replace function public.correo_login_medico(p_exequatur text) returns text
language sql stable security definer set search_path = public, auth as $$
  select u.email
  from public.medicos m
  join auth.users u on u.id = m.user_id
  where m.exequatur = trim(p_exequatur) and m.estado_registro = 'aprobado'
$$;

revoke execute on function public.correo_login_medico(text) from public;
grant execute on function public.correo_login_medico(text) to anon, authenticated;

commit;

-- "¿Olvidaste tu código de paciente?": encola un correo con el código si el paciente
-- registró un correo. Siempre responde igual para no revelar si el documento existe.
begin;

create or replace function public.solicitar_codigo_paciente(p_documento text) returns void
language plpgsql security definer set search_path = public as $$
declare
  p record;
begin
  select codigo, nombres, correo, user_id into p
  from public.pacientes
  where documento in (regexp_replace(p_documento, '\D', '', 'g'), upper(regexp_replace(p_documento, '\s', '', 'g')))
    and estado = 'activo' and correo is not null
  limit 1;
  if found then
    -- máximo un envío cada 10 minutos por paciente
    if not exists (select 1 from public.notificaciones where destinatario_user_id = p.user_id
                   and plantilla = 'recordar_codigo' and created_at > now() - interval '10 minutes') then
      insert into public.notificaciones (destinatario_user_id, destinatario_correo, plantilla, asunto, datos)
      values (p.user_id, p.correo, 'recordar_codigo', 'Tu código de paciente', jsonb_build_object('nombre', p.nombres, 'codigo', p.codigo));
    end if;
  end if;
end $$;

revoke execute on function public.solicitar_codigo_paciente(text) from public;
grant execute on function public.solicitar_codigo_paciente(text) to anon, authenticated;

commit;
