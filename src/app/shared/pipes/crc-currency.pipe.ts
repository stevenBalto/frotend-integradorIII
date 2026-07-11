import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formatea un numero como colones costarricenses (₡), ej. 4900 -> "₡4.900".
 * Uso: {{ producto.precio_base | crcCurrency }}
 */
@Pipe({
  name: 'crcCurrency',
  standalone: true,
})
export class CrcCurrencyPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  });

  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return this.formatter.format(0);
    }

    return this.formatter.format(Number(value));
  }
}
