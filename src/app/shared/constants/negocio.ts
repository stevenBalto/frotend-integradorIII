/**
 * Datos del negocio Rooster Pizza & Grill usados por las pantallas informativas
 * de "Mi cuenta" (Quiénes somos, FAQ, Restaurantes, Sobre la app, etc.).
 *
 * Son datos de MARCADOR (placeholder) realistas: para cambiarlos por los reales
 * basta editar este archivo — es el único lugar del que se leen.
 */

export interface Desarrollador {
  nombre: string;
  rol: string;
  contacto?: string;
}

export const NEGOCIO = {
  nombre: 'Rooster Pizza & Grill',
  eslogan: 'El sabor tico que te hace cacaraquear.',

  // Contacto (marcador)
  telefono: '2479-1122',
  whatsapp: '8888-1122',
  correo: 'contacto@roosterpizza.cr',
  horario: 'Todos los días de 11:00 a. m. a 10:00 p. m.',

  // Web informativa oficial del negocio (provista por el cliente).
  webInformativa: 'https://chitobryan.github.io/WEB_ROOSTER/',

  // Redes (marcador)
  instagram: 'https://instagram.com/roosterpizzacr',
  facebook: 'https://facebook.com/roosterpizzacr',

  // App
  version: '1.0.0',
  anio: 2026,
  proyecto: 'Proyecto Integrador III',
  stack: 'Ionic + Angular · Laravel · PostgreSQL',
} as const;

/**
 * Equipo de desarrollo (PLACEHOLDER — pendiente de reemplazar con los datos que
 * pase el usuario: nombre + rol de cada integrante, y correo/GitHub si aplica).
 */
export const DESARROLLADORES: Desarrollador[] = [
  { nombre: 'Christian Paniagua', rol: 'Desarrollo' },
  { nombre: 'Steven (stevenBalto)', rol: 'Desarrollo' },
];
