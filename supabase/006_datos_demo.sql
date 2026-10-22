-- =====================================================================
-- RedNacionalSalud — 006 DATOS DEMO (un registro de referencia por sección)
-- Ejecutar DESPUÉS de 005_vaciar_sistema.sql, en una base vacía.
-- Todos los registros usan nombres genéricos "… Demo" (sin datos de personas reales).
-- Los registros no tienen cuenta de acceso (user_id vacío); ver la guía para
-- vincular cuentas de prueba si se desea entrar a los portales como ellos.
-- =====================================================================
begin;

do $$
declare
  v_hosp   uuid;
  v_nodo   uuid;
  v_rad    uuid;
  v_ref    uuid;
  v_pac    uuid;
  v_conv   uuid;
  v_sol    uuid;
  v_est    uuid;
begin
  -- Hospital Demo
  insert into public.hospitales (codigo, sigla, nombre, tipo, nivel, provincia_id, municipio, direccion, telefono, correo, director, servicios, estado)
  values ('H-001', 'HDEMO', 'Hospital Demo', 'Hospital General', 'II', 1, 'Distrito Nacional',
          'Calle Demo #1, Sector Demo', '809-000-0001', 'hospital.demo@rednacionalsalud.com', 'Director Demo',
          '{RX,CT,US}', 'activo')
  returning id into v_hosp;

  insert into public.equipos_imagen (hospital_id, modalidad, marca, modelo, serial, estado)
  values (v_hosp, 'CT', 'Equipo Demo', 'Modelo Demo', 'SN-DEMO-0001', 'operativo');

  -- LINKConnect Demo
  insert into public.linkconnect_nodos (hospital_id, marca, modelo, serial, memoria_ram, procesador, almacenamiento, sistema_operativo,
                                        version, host_dicom, ip_dicom, puerto_dicom, aetitle, integracion_hl7, velocidad_mbps, estado, ultima_conexion)
  values (v_hosp, 'Servidor Demo', 'LINKConnect Demo', 'LC-DEMO-0001', '16 GB', '8 núcleos', '1 TB', 'Linux',
          '1.0.0', 'linkconnect-demo.local', '10.0.0.10', 104, 'RNS_DEMO', true, 100, 'conectado', now())
  returning id into v_nodo;

  insert into public.linkconnect_eventos (nodo_id, evento, detalle, exitoso)
  values (v_nodo, 'envio_estudio', 'Evento Demo: estudio enviado al Repositorio Nacional', true);

  -- Radiólogo Demo (aprobado)
  insert into public.medicos (tipo, exequatur, tratamiento, nombres, apellidos, cedula, sexo, tel_whatsapp, correo,
                              provincia, municipio, especialidades, regiones_interes, rating, estado_registro, aprobado_en)
  values ('radiologo', 'DEMO-0001', 'Dr.', 'Radiologo', 'Demo', '000-0000001-0', 'Masculino', '809-000-0002',
          'radiologo.demo@rednacionalsalud.com', 'Distrito Nacional', 'Distrito Nacional', '{CT,RX}', '{Sur}', 5.0, 'aprobado', now())
  returning id into v_rad;

  -- Médico Referidor Demo (aprobado)
  insert into public.medicos (tipo, exequatur, tratamiento, nombres, apellidos, cedula, sexo, tel_whatsapp, correo,
                              provincia, municipio, especialidades, centro_trabajo, regiones_interes, estado_registro, aprobado_en)
  values ('referidor', 'DEMO-0002', 'Dr.', 'Referidor', 'Demo', '000-0000002-0', 'Masculino', '809-000-0003',
          'referidor.demo@rednacionalsalud.com', 'Distrito Nacional', 'Distrito Nacional', '{Medicina Interna}', 'Hospital Demo', '{Sur}', 'aprobado', now())
  returning id into v_ref;

  -- Paciente Demo
  insert into public.pacientes (tipo_documento, documento, nombres, apellidos, fecha_nacimiento, sexo, telefono,
                                provincia, municipio, sector, calle, numero, emergencia_telefono, emergencia_parentesco)
  values ('cedula', '00000000003', 'Paciente', 'Demo', '1980-01-01', 'Masculino', '809-000-0004',
          'Distrito Nacional', 'Distrito Nacional', 'Sector Demo', 'Calle Demo', '1', '809-000-0005', 'Familiar')
  returning id into v_pac;

  -- Asignación Demo (radiólogo ↔ hospital)
  insert into public.asignaciones (radiologo_id, hospital_id, modalidades, horario, sla_horas, carga_mensual_max, estado)
  values (v_rad, v_hosp, '{CT,RX}', 'Lunes a viernes, 8:00 a. m. – 4:00 p. m.', 6, 150, 'activa');

  -- Convocatoria Demo (activa) y su postulación
  insert into public.convocatorias (titulo, hospital_id, modalidad_servicio, descripcion, posiciones, tipo_contratacion,
                                    regiones_interes, especialidades, fecha_inicio, fecha_cierre, asunto_mensaje, mensaje, estado, publicada_en)
  values ('Convocatoria Demo', v_hosp, '{teleradiologia}', 'Convocatoria de referencia para las pruebas de integración.', 1, 'Por estudio',
          '{Sur}', '{CT}', current_date, current_date + 30, 'Convocatoria Demo', 'Mensaje de la Convocatoria Demo.', 'activa', now())
  returning id into v_conv;

  insert into public.postulaciones (convocatoria_id, medico_id, estado, comentario)
  values (v_conv, v_rad, 'aplicada', 'Postulación Demo');

  -- Solicitud Demo (del referidor)
  insert into public.solicitudes_estudio (medico_id, paciente_id, hospital_id, modalidad, descripcion, prioridad, indicacion, estado)
  values (v_ref, v_pac, v_hosp, 'CT', 'Estudio Demo: tomografía de cráneo simple', 'ambulatorio', 'Indicación Demo', 'realizada')
  returning id into v_sol;

  -- Estudio Demo
  insert into public.estudios (paciente_id, hospital_id, medico_referidor_id, radiologo_id, solicitud_id, modalidad, descripcion,
                               prioridad, estado, indicacion_clinica, num_imagenes, asignado_en)
  values (v_pac, v_hosp, v_ref, v_rad, v_sol, 'CT', 'Estudio Demo: tomografía de cráneo simple',
          'ambulatorio', 'asignado', 'Indicación Demo', 120, now())
  returning id into v_est;

  update public.solicitudes_estudio set estudio_id = v_est where id = v_sol;

  -- Informe Demo (publicado: el estudio pasa a "informado")
  insert into public.informes (estudio_id, radiologo_id, plantilla, tecnica, hallazgos, impresion, estado, calificacion)
  values (v_est, v_rad, 'Plantilla Demo', 'Técnica Demo.', 'Hallazgos Demo.', 'Impresión Demo.', 'publicado', 5);

  -- Cita Demo
  insert into public.citas (paciente_id, hospital_id, medico_id, tipo, fecha_hora, estado, notas)
  values (v_pac, v_hosp, v_ref, 'Consulta Demo', now() + interval '7 days', 'programada', 'Cita Demo');

  -- Alerta Demo
  insert into public.alertas (tipo, mensaje, hospital_id)
  values ('info', 'Alerta Demo', v_hosp);

  -- Reporte Demo
  insert into public.reportes (nombre, tipo, formato, periodo_inicio, periodo_fin, estado)
  values ('Reporte Demo', 'Operativo', 'PDF', current_date - 30, current_date, 'completado');
end $$;

-- Los registros demo no deben enviar correos ni dejar rastro en la auditoría
delete from public.notificaciones;
delete from public.auditoria;

commit;

-- VERIFICACIÓN (ejecutar aparte): cada conteo debe ser 1
-- select (select count(*) from public.hospitales) hospitales, (select count(*) from public.linkconnect_nodos) linkconnect,
--        (select count(*) from public.medicos where tipo='radiologo') radiologos, (select count(*) from public.medicos where tipo='referidor') referidores,
--        (select count(*) from public.pacientes) pacientes, (select count(*) from public.convocatorias) convocatorias,
--        (select count(*) from public.asignaciones) asignaciones, (select count(*) from public.estudios) estudios,
--        (select count(*) from public.informes) informes, (select count(*) from public.citas) citas;
