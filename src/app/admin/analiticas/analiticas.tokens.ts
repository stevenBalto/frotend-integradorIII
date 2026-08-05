/**
 * Tokens de diseño y helpers de formato para el módulo de Analíticas.
 * Paleta específica para este módulo (reemplaza la anterior de Tailwind).
 */

// Colores del ranking por posición (índice 0 = líder, etc.)
export const RANKING_COLORS: string[] = [
  '#E11D2E', // índice 0: rojo (líder)
  '#2E2E2C', // índice 1
  '#484845', // índice 2
  '#5F5E5A', // índice 3
  '#76756F', // índice 4
  '#8D8C85', // índice 5+
];

/**
 * Devuelve el color de barra para una posición en el ranking.
 * @param index Posición en el ranking (0 = líder).
 */
export function getRankingColor(index: number): string {
  if (index < 0) return RANKING_COLORS[RANKING_COLORS.length - 1];
  if (index >= RANKING_COLORS.length) return RANKING_COLORS[RANKING_COLORS.length - 1];
  return RANKING_COLORS[index];
}

// Colores de comparativo
export const COLOR_ACTUAL = '#E11D2E';
export const COLOR_ANTERIOR = '#2E2E2C';

// Colores de badge de variación
export const BADGE_UP = { text: '#3B6D11', bg: '#EAF3DE' };
export const BADGE_DOWN = { text: '#A32D2D', bg: '#FCEBEB' };

// Colores de modalidad
export const COLOR_MODALIDAD_LIDER = '#E11D2E';
export const COLOR_MODALIDAD_SECUNDARIA = '#2E2E2C';

// Border de cards
export const CARD_BORDER = '0.5px solid #E5E5E0';

/**
 * Formatea un monto en colones costarricenses.
 * @param value Monto a formatear.
 * @returns String formateado, ej: "₡1.234.567"
 */
export function formatCRC(value: number): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formatea un monto en colones de forma abreviada para ejes de gráficos.
 * @param value Monto a formatear.
 * @returns String formateado, ej: "₡123k" o "₡500"
 */
export function formatCRCShort(value: number): string {
  if (value >= 1000) {
    return `₡${Math.round(value / 1000)}k`;
  }
  return formatCRC(value);
}

/**
 * Formatea un porcentaje con coma decimal (estilo español/CR).
 * @param value Porcentaje a formatear.
 * @returns String formateado, ej: "41,1 %"
 */
export function formatPctES(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('es-CR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${formatted} %`;
}

/**
 * Pluraliza "pedido" según la cantidad.
 * @param count Número de pedidos.
 * @returns "pedido" o "pedidos"
 */
export function pluralizePedido(count: number): string {
  return count === 1 ? 'pedido' : 'pedidos';
}

/**
 * Devuelve el nombre del mes actual en español.
 */
export function getMesActual(): string {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return meses[new Date().getMonth()];
}
