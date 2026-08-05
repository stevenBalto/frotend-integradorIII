import { Pipe, PipeTransform } from '@angular/core';

/** Carpeta pública de Laravel (`php artisan storage:link`) donde caen las subidas. */
const STORAGE_PREFIX = '/storage/';

/**
 * Normaliza el `imagen_url` que manda el backend a una URL que el navegador
 * pueda pedir, sin importar en qué formato esté guardado en la base.
 *
 * Casos que resuelve:
 * - Absoluta (`https://…`, `//cdn…`, `data:`, `blob:`) → se deja igual.
 * - Ya con el prefijo público (`/storage/productos/x.jpg`) → se deja igual.
 * - Ruta cruda de disco (`productos/x.jpg`, `public/productos/x.jpg`) → se le
 *   antepone `/storage/`, que es donde Laravel las publica.
 *
 * Devuelve `null` si no hay imagen, para que la vista muestre su placeholder.
 *
 * OJO (desarrollo): las peticiones a `/storage/**` las tiene que reenviar el
 * dev-server al backend. Eso está configurado en `proxy.conf.json`, igual que
 * `/api`. Sin esa regla, una ruta local devuelve el index.html de Angular.
 *
 * Uso: `[src]="producto.imagen_url | imagenUrl"`
 */
@Pipe({
  name: 'imagenUrl',
  standalone: true,
})
export class ImagenUrlPipe implements PipeTransform {
  transform(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const url = value.trim();
    if (url === '') {
      return null;
    }

    // Absolutas y esquemas embebidos: se usan tal cual.
    if (/^(https?:)?\/\//i.test(url) || /^(data|blob):/i.test(url)) {
      return url;
    }

    if (url.startsWith(STORAGE_PREFIX)) {
      return url;
    }

    // Rutas relativas del disco público: `public/x.jpg` y `storage/x.jpg` son la
    // misma carpeta que `/storage/x.jpg`, así que se normaliza el prefijo.
    const limpia = url
      .replace(/^\/+/, '')
      .replace(/^(public|storage)\//i, '');

    return `${STORAGE_PREFIX}${limpia}`;
  }
}
