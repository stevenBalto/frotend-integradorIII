/**
 * Formatea un monto en colones de forma COMPACTA para espacios chicos (p. ej. las
 * pastillas KPI del header): mismo significado, menos texto.
 *   1_250_000 → "₡1,3 M"   ·   8_900 → "₡8,9 k"   ·   950 → "₡950"
 */
export function montoCorto(n: number | null | undefined): string {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs >= 1_000_000) {
    const m = v / 1_000_000;
    return '₡' + (abs % 1_000_000 === 0 ? m.toFixed(0) : m.toFixed(1).replace('.', ',')) + ' M';
  }
  if (abs >= 10_000) {
    return '₡' + Math.round(v / 1000) + ' k';
  }
  if (abs >= 1_000) {
    return '₡' + (v / 1000).toFixed(1).replace('.', ',') + ' k';
  }
  return '₡' + v.toLocaleString('es-CR');
}
