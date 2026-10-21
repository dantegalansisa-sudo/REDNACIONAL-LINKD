/** Provincias de la República Dominicana y algunos municipios/sectores de referencia.
 *  En la fase de integración esto vendrá de una tabla de catálogo en la base de datos. */
export const PROVINCIAS = [
  'Distrito Nacional', 'Santo Domingo', 'Santiago', 'La Vega', 'San Cristóbal', 'Puerto Plata', 'Duarte', 'La Romana',
  'San Pedro de Macorís', 'La Altagracia', 'Espaillat', 'San Juan', 'Azua', 'Peravia', 'Monseñor Nouel', 'Sánchez Ramírez',
  'María Trinidad Sánchez', 'Monte Plata', 'Valverde', 'Barahona', 'Hato Mayor', 'El Seibo', 'Samaná', 'Hermanas Mirabal',
  'Monte Cristi', 'Bahoruco', 'Dajabón', 'Santiago Rodríguez', 'San José de Ocoa', 'Elías Piña', 'Independencia', 'Pedernales',
]

export const MUNICIPIOS: Record<string, string[]> = {
  'Distrito Nacional': ['Distrito Nacional'],
  'Santo Domingo': ['Distrito Nacional', 'Santo Domingo Este', 'Santo Domingo Oeste', 'Santo Domingo Norte', 'Boca Chica', 'Los Alcarrizos', 'Pedro Brand'],
  Santiago: ['Santiago de los Caballeros', 'Tamboril', 'Villa González', 'Licey al Medio', 'Puñal'],
  'La Vega': ['La Vega', 'Constanza', 'Jarabacoa', 'Jima Abajo'],
  'San Cristóbal': ['San Cristóbal', 'Bajos de Haina', 'Villa Altagracia'],
}

export const SECTORES: Record<string, string[]> = {
  'Distrito Nacional': ['Ens. Naco', 'Piantini', 'Gazcue', 'Bella Vista', 'Los Prados', 'Evaristo Morales', 'Zona Colonial'],
  'Santiago de los Caballeros': ['La Trinitaria', 'Los Jardines', 'Cerros de Gurabo', 'Villa Olga', 'Los Pepines'],
}

export const municipiosDe = (p: string) => MUNICIPIOS[p] ?? [p]
export const sectoresDe = (m: string) => SECTORES[m] ?? ['Centro', 'Ensanche', 'Los Jardines', 'Villa Progreso']

export const REGIONES = ['Sur', 'SurEste', 'SurOeste', 'Norte', 'NorEste', 'NorOeste', 'Este', 'Oeste']

export const MODALIDADES_RAD = ['CT', 'MR', 'RX', 'US', 'MG', 'PET', 'NM', 'Otros']

export const ESPECIALIDADES_MED = [
  'Medicina Interna', 'Pediatría', 'Ginecología', 'Obstetricia', 'Cirugía General',
  'Ortopedia', 'Cardiología', 'Endocrinología', 'Neurología', 'Urología',
  'Gastroenterología', 'Neumología', 'Oncología', 'Medicina Familiar', 'Medicina General',
]
