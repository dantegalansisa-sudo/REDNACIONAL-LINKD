/**
 * Datos de marca centralizados. Cambiar aquí si el cliente decide otro nombre/dominio
 * (p. ej. las maquetas del panel usan "HospitalNacional.do").
 * El dominio en línea es temporalmente rednacionalsalud.com; los datos de contacto
 * son los de LINKDICOM hasta que el SNS entregue los definitivos.
 */
export const BRAND = {
  domain: 'RedNacionalSalud.do',
  url: 'https://rednacionalsalud.com',
  name: 'Red Nacional de Salud Dominicana',
  short: 'RNS',
  supportPhone: '+1 (809) 792-9763',
  supportEmail: 'soporte@rednacionalsalud.com',
  contactEmail: 'info@linkdicom.com',
  address: 'C/ Puerto Rico casi esq. San Vicente de Paúl (Alma Rosa I), Santo Domingo Este, República Dominicana',
  hours: 'Lunes a viernes 8:00 a. m. – 6:00 p. m. · Sábados 8:00 a. m. – 1:00 p. m.',
  /** Dominio interno de las cuentas de pacientes (no recibe correos; el paciente entra con su código RNS) */
  patientAuthDomain: 'pacientes.rednacionalsalud.com',
  year: 2025,
}
