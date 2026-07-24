/**
 * Contenido de texto de las pantallas informativas de "Mi cuenta":
 * Preguntas frecuentes y las páginas de prosa (Quiénes somos, Términos,
 * Privacidad, Sobre la app). Centralizado para editar en un solo lugar.
 */

export interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

export interface SeccionInfo {
  titulo: string;
  parrafos: string[];
}

export const FAQ: PreguntaFrecuente[] = [
  {
    pregunta: '¿Cómo hago un pedido?',
    respuesta:
      'Entrá a la pestaña Carrito, elegí tu sucursal, agregá los productos que querás (con su tamaño y extras si aplica) y tocá "Confirmar pedido". Al final se te muestra un código único con el que podés seguir tu pedido.',
  },
  {
    pregunta: '¿Necesito una cuenta para pedir?',
    respuesta:
      'No. Podés pedir como invitado: solo te pedimos tu nombre para identificar la orden y te damos un código. Con una cuenta, además, acumulás Roosters (puntos) en cada compra y llevás tu historial.',
  },
  {
    pregunta: '¿Cómo pago?',
    respuesta:
      'Por el momento todos los pedidos se pagan en caja, en la sucursal. Los pagos dentro de la app todavía no están activos. Tu pedido se prepara y se marca como listo, pero no se entrega hasta que se cancele en caja.',
  },
  {
    pregunta: '¿Qué son los Roosters?',
    respuesta:
      'Son tus puntos de fidelidad. Ganás el 5% de cada compra en Roosters (₡7.500 de compra = 375 Roosters) y 1 Rooster equivale a ₡1. Cuando querás, los podés canjear en el checkout para que tu pedido salga más barato.',
  },
  {
    pregunta: '¿Cómo sigo el estado de mi pedido?',
    respuesta:
      'Con tu código. Si tenés cuenta, mirá "Mis pedidos". Si pediste como invitado, usá "Buscar mi pedido" e ingresá el código que te dimos al confirmar.',
  },
  {
    pregunta: '¿Dónde están ubicados?',
    respuesta:
      'Estamos en La Fortuna de San Carlos, Alajuela, diagonal a la Iglesia Católica. Podés ver la ubicación exacta y abrirla en Google Maps desde la opción "Restaurantes".',
  },
  {
    pregunta: '¿Cómo los contacto?',
    respuesta:
      'Por teléfono o WhatsApp al 2479-1122, o al correo contacto@roosterpizza.cr. También podés visitar nuestra web informativa desde "Quiénes somos".',
  },
  {
    pregunta: '¿Puedo elegir comer en el restaurante o para llevar?',
    respuesta:
      'Sí. En el paso de "Confirmar pedido" elegís entre "Comer en el restaurante" o "Para llevar".',
  },
];

/** Páginas de prosa, indexadas por el parámetro de ruta :tema. */
export const INFO_TEMAS: Record<string, SeccionInfo> = {
  'quienes-somos': {
    titulo: 'Quiénes somos',
    parrafos: [
      'Rooster Pizza & Grill es una pizzería y parrilla tica nacida en La Fortuna de San Carlos, con el sueño de servir comida honesta, generosa y con sabor de casa.',
      'Combinamos pizzas horneadas al momento, cortes a la parrilla y pastas caseras, usando ingredientes frescos y locales siempre que se puede.',
      'Esta app es nuestra forma de acercarte el menú: pedí desde donde estés, seguí tu orden con un código y acumulá Roosters en cada compra.',
    ],
  },
  terminos: {
    titulo: 'Términos y condiciones',
    parrafos: [
      'Al usar la app aceptás estos términos. El servicio permite armar pedidos para retirar o consumir en la sucursal seleccionada; no incluye entrega a domicilio.',
      'Todo pedido debe pagarse en caja al momento de retirarlo. Un pedido se registra y comienza a prepararse cuando lo confirmás, pero no se considera entregado hasta que se realice el pago correspondiente en la sucursal.',
      'Los precios, tamaños y disponibilidad de productos pueden variar sin previo aviso. El monto final a pagar es el que se muestra al confirmar el pedido.',
      'Los Roosters (puntos de fidelidad) no tienen valor en efectivo, no son transferibles y solo pueden canjearse como descuento dentro de la app. El negocio puede ajustar las reglas del programa a futuro.',
      'Podemos cancelar un pedido por falta de existencias o por un uso indebido de la app; en ese caso no se cobra nada.',
    ],
  },
  privacidad: {
    titulo: 'Privacidad y protección de datos',
    parrafos: [
      'Tu privacidad nos importa. Solo pedimos los datos necesarios para operar: tu nombre para identificar el pedido y, si creás una cuenta, tu correo y teléfono para tu perfil e historial.',
      'No vendemos ni compartimos tus datos con terceros con fines publicitarios. Se usan únicamente para procesar tus pedidos y administrar tu programa de Roosters.',
      'Las contraseñas se almacenan cifradas (nunca en texto plano) y el acceso a tu cuenta está protegido por sesión. Estamos trabajando para que toda la comunicación viaje siempre sobre HTTPS.',
      'Podés solicitar la corrección o eliminación de tus datos escribiéndonos a contacto@roosterpizza.cr.',
      'Nota: esta es una versión en desarrollo (Proyecto Integrador III); las políticas definitivas se publicarán con el lanzamiento oficial.',
    ],
  },
  'sobre-app': {
    titulo: 'Sobre la app',
    parrafos: [
      'Rooster App es el canal digital de Rooster Pizza & Grill para pedir, seguir tu orden y acumular Roosters.',
      'Desarrollada como parte del Proyecto Integrador III.',
    ],
  },
};
