-- =====================================================================
-- RedNacionalSalud.do — 003 DATOS INICIALES
-- Provincias (32), municipios principales, hospitales de ejemplo,
-- configuración por defecto y permisos por rol.
-- Ejecutar DESPUÉS de 002_seguridad.sql
-- =====================================================================
begin;

-- Provincias con su Región de Salud (SNS)
insert into public.provincias (id, nombre, region_salud) values
  (1,  'Distrito Nacional',      'Metropolitana'),
  (2,  'Santo Domingo',          'Metropolitana'),
  (3,  'Monte Plata',            'Metropolitana'),
  (4,  'San Cristóbal',          'Valdesia'),
  (5,  'Peravia',                'Valdesia'),
  (6,  'San José de Ocoa',       'Valdesia'),
  (7,  'Santiago',               'Norcentral'),
  (8,  'Puerto Plata',           'Norcentral'),
  (9,  'Espaillat',              'Norcentral'),
  (10, 'Duarte',                 'Nordeste'),
  (11, 'Hermanas Mirabal',       'Nordeste'),
  (12, 'María Trinidad Sánchez', 'Nordeste'),
  (13, 'Samaná',                 'Nordeste'),
  (14, 'Barahona',               'Enriquillo'),
  (15, 'Bahoruco',               'Enriquillo'),
  (16, 'Independencia',          'Enriquillo'),
  (17, 'Pedernales',             'Enriquillo'),
  (18, 'La Romana',              'Este'),
  (19, 'La Altagracia',          'Este'),
  (20, 'San Pedro de Macorís',   'Este'),
  (21, 'El Seibo',               'Este'),
  (22, 'Hato Mayor',             'Este'),
  (23, 'Azua',                   'El Valle'),
  (24, 'San Juan',               'El Valle'),
  (25, 'Elías Piña',             'El Valle'),
  (26, 'Valverde',               'Cibao Occidental'),
  (27, 'Monte Cristi',           'Cibao Occidental'),
  (28, 'Dajabón',                'Cibao Occidental'),
  (29, 'Santiago Rodríguez',     'Cibao Occidental'),
  (30, 'La Vega',                'Cibao Central'),
  (31, 'Monseñor Nouel',         'Cibao Central'),
  (32, 'Sánchez Ramírez',        'Cibao Central')
on conflict (id) do nothing;

-- Municipios principales (completar con el listado oficial cuando el cliente lo entregue)
insert into public.municipios (provincia_id, nombre) values
  (1, 'Distrito Nacional'),
  (2, 'Santo Domingo Este'), (2, 'Santo Domingo Oeste'), (2, 'Santo Domingo Norte'), (2, 'Boca Chica'), (2, 'Los Alcarrizos'), (2, 'Pedro Brand'), (2, 'San Antonio de Guerra'),
  (3, 'Monte Plata'),
  (4, 'San Cristóbal'), (4, 'Bajos de Haina'), (4, 'Villa Altagracia'),
  (5, 'Baní'),
  (7, 'Santiago de los Caballeros'), (7, 'Tamboril'), (7, 'Villa González'), (7, 'Licey al Medio'), (7, 'Puñal'),
  (8, 'Puerto Plata'),
  (10, 'San Francisco de Macorís'),
  (18, 'La Romana'),
  (19, 'Higüey'),
  (20, 'San Pedro de Macorís'),
  (23, 'Azua'),
  (24, 'San Juan de la Maguana'),
  (30, 'La Vega'), (30, 'Constanza'), (30, 'Jarabacoa'), (30, 'Jima Abajo'),
  (31, 'Bonao'),
  (32, 'Cotuí')
on conflict do nothing;

-- Hospitales de ejemplo (los del panel). Reemplazar por el listado oficial.
insert into public.hospitales (codigo, sigla, nombre, tipo, nivel, provincia_id, municipio, direccion, telefono, correo, servicios, estado) values
  ('H-001', 'HPHM', 'Hospital Pediátrico Hugo Mendoza',       'Hospital Especializado Pediátrico', 'III', 2,  'Santo Domingo Oeste',     'Av. San Vicente de Paúl esq. Carretera Los Alcarrizos', '809-530-1180', 'info@hugomendoza.gob.do',     '{RX,CT,MR,US,MG}', 'activo'),
  ('H-002', 'HMV',  'Hospital Dr. Marcelino Vélez',           'Hospital General Docente',          'III', 2,  'Santo Domingo Oeste',     'Av. Isabel Aguiar, Herrera',                            '809-530-6969', 'info@marcelinovelez.gob.do',  '{RX,CT,US}',       'activo'),
  ('H-003', 'HPB',  'Hospital Padre Billini',                 'Hospital General Docente',          'III', 1,  'Distrito Nacional',       'Calle Santomé No. 39, Ciudad Colonial',                 '809-333-5656', 'info@padrebillini.gob.do',    '{RX,CT,US,MG}',    'activo'),
  ('H-004', 'HFMP', 'Hospital Dr. Francisco Moscoso Puello',  'Hospital General Docente',          'III', 1,  'Distrito Nacional',       'Av. Nicolás de Ovando, Cristo Rey',                     '809-681-6922', 'info@moscosopuello.gob.do',   '{RX,CT,US}',       'activo'),
  ('H-005', 'HNAL', 'Hospital Traumatológico Ney Arias Lora', 'Hospital Especializado',            'III', 2,  'Santo Domingo Norte',     'Autopista Duarte Km 10 ½, Ciudad Juan Bosch',           '809-948-7777', 'info@neyariaslora.gob.do',    '{RX,CT,MR,US}',    'activo'),
  ('H-006', 'HJPP', 'Hospital Juan Pablo Pina',               'Hospital General',                  'II',  4,  'San Cristóbal',           'Av. Constitución, San Cristóbal',                       '809-528-3361', 'info@juanpablopina.gob.do',   '{RX,US}',          'activo'),
  ('H-007', 'HRT',  'Hospital Regional Taiwán 19 de Marzo',   'Hospital General',                  'II',  23, 'Azua',                    'Carretera Sánchez, Azua de Compostela',                 '809-521-3335', 'info@hospitaltaiwan.gob.do',  '{RX,CT,US}',       'activo'),
  ('H-008', 'HRSJ', 'Hospital Regional San Juan de la Maguana','Hospital General',                 'II',  24, 'San Juan de la Maguana',  'Calle Independencia, San Juan de la Maguana',           '809-557-2210', 'info@hrsanjuan.gob.do',       '{RX,CT,US}',       'activo'),
  ('H-009', 'HAC',  'Hospital Dr. Alejandro Cabral',          'Hospital General',                  'II',  24, 'San Juan de la Maguana',  'Av. Anacaona, San Juan de la Maguana',                  '809-557-2040', 'info@alejandrocabral.gob.do', '{RX,US}',          'en_proceso'),
  ('H-010', 'HRAM', 'Hospital Regional Antonio Musa',         'Hospital General',                  'II',  20, 'San Pedro de Macorís',    'Av. Independencia, San Pedro de Macorís',               '809-529-3567', 'info@antoniomusa.gob.do',     '{RX,CT,US,MG}',    'activo')
on conflict (codigo) do nothing;

-- Configuración general (la edita el administrador desde Configuración)
insert into public.configuracion (clave, valor, descripcion) values
  ('plataforma',          '{"nombre": "RedNacionalSalud.do", "siglas": "RNS", "descripcion": "Plataforma nacional para la coordinación de la atención diagnóstica.", "zona_horaria": "America/Santo_Domingo", "idioma": "es-DO"}', 'Información de la plataforma'),
  ('tiempos_objetivo',    '{"emergencia": "30 minutos", "urgencia": "2 horas", "hospitalizado": "48 horas", "ambulatorio": "7 días"}', 'Tiempos objetivo de lectura por prioridad'),
  ('notificaciones',      '{"correo": true, "estudios_criticos": true, "asignacion_estudios": true, "informes_completados": true, "sistema": false}', 'Qué notificaciones se envían'),
  ('correo_remitente',    '{"nombre": "Red Nacional de Salud", "correo": "notificaciones@rednacionalsalud.do", "soporte": "soporte@rednacionalsalud.do"}', 'Remitente de los correos automáticos'),
  ('soporte',             '{"telefono": "809-XXX-XXXX", "correo": "soporte@rednacionalsalud.do", "horario": "24/7"}', 'Datos de soporte técnico'),
  ('seguridad',           '{"longitud_minima_clave": 8, "bloqueo_intentos": 5, "dos_factores_admin": true, "duracion_sesion_horas": 8}', 'Políticas de seguridad'),
  ('respaldo',            '{"automatico": true, "hora": "02:00", "conservacion_dias": 30}', 'Copias de seguridad'),
  ('apariencia',          '{"tema": "claro", "color_principal": "#0d6efd"}', 'Apariencia del sistema')
on conflict (clave) do nothing;

-- Permisos por rol (matriz de "Roles y permisos")
insert into public.rol_permisos (rol, permiso)
select r.rol::public.app_rol, p.permiso
from (values
  ('admin',       array['dashboard.ver','hospitales.ver','hospitales.editar','linkconnect.ver','linkconnect.editar','radiologos.ver','radiologos.aprobar','convocatorias.ver','convocatorias.editar','asignaciones.editar','estudios.ver','estudios.asignar','informes.ver','pacientes.ver','pacientes.editar','referidores.ver','analitica.ver','operaciones.ver','seguridad.ver','usuarios.editar','configuracion.editar','auditoria.ver','reportes.generar']),
  ('coordinador', array['dashboard.ver','hospitales.ver','hospitales.editar','radiologos.ver','radiologos.aprobar','convocatorias.ver','convocatorias.editar','asignaciones.editar','estudios.ver','estudios.asignar','informes.ver','pacientes.ver','referidores.ver','analitica.ver','operaciones.ver','reportes.generar']),
  ('operador',    array['dashboard.ver','hospitales.ver','estudios.ver','estudios.asignar','pacientes.ver','pacientes.editar','operaciones.ver']),
  ('radiologo',   array['portal_medico.ver','estudios.leer','informes.redactar','informes.firmar','convocatorias.aplicar']),
  ('referidor',   array['portal_medico.ver','solicitudes.crear','pacientes_referidos.ver','informes.ver']),
  ('paciente',    array['portal_paciente.ver','estudios_propios.ver','informes_propios.ver','perfil.editar'])
) as r(rol, permisos)
cross join lateral unnest(r.permisos) as p(permiso)
on conflict do nothing;

commit;

-- =====================================================================
-- VERIFICACIÓN (ejecutar aparte; todos los conteos deben ser > 0)
-- =====================================================================
-- select (select count(*) from public.provincias)    as provincias,    -- 32
--        (select count(*) from public.hospitales)    as hospitales,    -- 10
--        (select count(*) from public.configuracion) as configuracion, -- 8
--        (select count(*) from public.rol_permisos)  as permisos,
--        (select count(*) from storage.buckets where id in ('documentos-medicos','fotos-perfil','informes','estudios-miniaturas','institucional')) as buckets; -- 5
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;  -- rowsecurity = true en todas
