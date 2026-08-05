import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe reutilizable para pluralización de "pedido/pedidos".
 * Uso: {{ cantidad | pluralize:'pedido':'pedidos' }}
 * Si no se pasan argumentos, asume "pedido"/"pedidos" por defecto.
 */
@Pipe({
  name: 'pluralize',
  standalone: true,
})
export class PluralizePipe implements PipeTransform {
  transform(count: number, singular = 'pedido', plural = 'pedidos'): string {
    return count === 1 ? singular : plural;
  }
}
