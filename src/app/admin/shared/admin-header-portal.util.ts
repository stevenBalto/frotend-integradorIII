import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Observable, filter, map } from 'rxjs';

/**
 * Utilidades compartidas por las directivas de portal del header
 * ([adminHeaderActions] y [adminHeaderLead]).
 *
 * PROBLEMA QUE RESUELVEN (bug: al volver a Pedidos el header queda vacío)
 * ----------------------------------------------------------------------
 * El shell limpia los portales en cada NavigationStart (para que no queden
 * "pegados" los de la página saliente), así que cada página debe RE-publicar su
 * template al entrar. El problema es que `IonicRouteStrategy` cachea las páginas:
 * al volver, el componente no se recrea y `ngOnInit` NO vuelve a correr.
 *
 * Intento previo que NO funciona de forma confiable: escuchar 'ionViewWillEnter'
 * sobre el `.ion-page`. Ionic agrega esa clase de forma asíncrona (dentro de
 * `StackController.transition()`), después del ngOnInit, y despacha el evento con
 * `bubbles: false`, así que todo depende de encontrar el elemento exacto en el
 * momento exacto.
 *
 * SOLUCIÓN: no depender del ciclo de vida de Ionic ni del DOM. Cada portal
 * recuerda la ruta de SU página (leída del ActivatedRoute al construirse, que no
 * sufre el desfase de `router.url` durante la navegación) y se re-publica en cada
 * NavigationEnd cuyo destino sea esa misma página. El router es determinista,
 * corre dentro de la zona de Angular y funciona igual si la página se recreó o si
 * vino del caché.
 */

/** Quita query string y fragmento de una URL de router. */
function rutaBase(url: string): string {
  return url.split('?')[0].split('#')[0];
}

/**
 * Ruta absoluta ('/admin/pedidos') de la página que contiene a esta directiva.
 *
 * Se prefiere el ActivatedRoute porque `router.url` todavía apunta a la URL
 * ANTERIOR mientras corre la activación (urlUpdateStrategy 'deferred'). Si el
 * snapshot no diera segmentos (caso raro con el proxy de ruta de Ionic), se cae a
 * la navegación en curso, que sí conoce la URL destino.
 */
function rutaDeLaPagina(router: Router, route: ActivatedRoute): string {
  const segmentos: string[] = [];
  for (const tramo of route.snapshot.pathFromRoot) {
    for (const segmento of tramo.url) {
      if (segmento.path.length > 0) {
        segmentos.push(segmento.path);
      }
    }
  }

  if (segmentos.length > 0) {
    return `/${segmentos.join('/')}`;
  }

  const enCurso = router.getCurrentNavigation()?.finalUrl;
  return rutaBase(enCurso ? router.serializeUrl(enCurso) : router.url);
}

/**
 * Emite cada vez que una navegación termina en la página dada (misma ruta, o una
 * hija de ella para no romper con sub-rutas o parámetros).
 */
export function alEntrarALaPagina(router: Router, route: ActivatedRoute): Observable<void> {
  const propia = rutaDeLaPagina(router, route);

  return router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    map((e) => rutaBase(e.urlAfterRedirects)),
    filter((url) => url === propia || url.startsWith(`${propia}/`)),
    map(() => undefined),
  );
}
