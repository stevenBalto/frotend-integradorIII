/**
 * Datos del negocio Rooster Pizza & Grill usados por las pantallas informativas
 * de "Mi cuenta" (Quiénes somos, FAQ, Restaurantes, Sobre la app, etc.).
 *
 * Son datos de MARCADOR (placeholder) realistas: para cambiarlos por los reales
 * basta editar este archivo — es el único lugar del que se leen.
 */

export interface Desarrollador {
  nombre: string;
  /** Resumen corto: es lo que se lee bajo la foto en la cuadrícula. */
  rol: string;
  /** Detalle de su aporte: se muestra al abrir la foto en el modal. */
  aporte: string;
  /** Ruta de la foto en assets (nombres sin espacios ni tildes: una URL con
      ambos se percent-codifica y se rompe fácil segun quien sirva el archivo). */
  foto: string;
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
  stack: 'Ionic + Angular · Laravel · PostgreSQL',

  // Contexto academico (se muestra en "Sobre la app").
  proyecto: 'Proyecto Integrador III',
  universidad: 'Universidad Técnica Nacional (UTN)',
  campus: 'Sede Guanacaste · Recinto Liberia',
  carrera: 'Bachillerato',
  /** Naturaleza del entregable. Redactado como intencion y no como hecho: la
      app todavia no esta publicada en las tiendas -- cuando lo este, cambiar a
      "Disponible en App Store y Google Play". */
  plataformas: 'Aplicación híbrida (móvil y web), preparada para distribuirse en App Store y Google Play',
} as const;

/** Equipo de desarrollo. El orden es el que se muestra en "Sobre la app". */
export const DESARROLLADORES: Desarrollador[] = [
  {
    nombre: 'Christian Paniagua Castro',
    rol: 'Líder del proyecto · Backend y frontend',
    aporte:
      'Lideró el proyecto y trabajó tanto en el backend como en el frontend, ' +
      'con foco en las validaciones y en el detalle de cada pantalla.',
    foto: 'assets/Desarrolladores/christian.jpg',
  },
  {
    nombre: 'Steven Baltodano Ugarte',
    rol: 'Base de datos · Prototipos · Frontend',
    aporte:
      'Diseñó la base de datos y los prototipos de todo el sistema, y ' +
      'trabajó en el frontend de la aplicación.',
    foto: 'assets/Desarrolladores/steven.jpg',
  },
  {
    nombre: 'Reyman Barquero Ramírez',
    rol: 'Documentación y pruebas · Backend',
    aporte:
      'Se encargó de la documentación y las pruebas, de instalar los ' +
      'servicios de terceros que usa el sistema, y trabajó en el backend y ' +
      'en la optimización del código.',
    foto: 'assets/Desarrolladores/reyman.jpg',
  },
  {
    nombre: 'Bryan Vega Ordóñez',
    rol: 'Web informativa · Notificaciones push',
    aporte:
      'Desarrolló la web informativa del negocio e hizo posible el sistema ' +
      'de notificaciones push, con el que te avisamos cuando tu pedido ' +
      'cambia de estado.',
    foto: 'assets/Desarrolladores/bryan.jpg',
  },
];
