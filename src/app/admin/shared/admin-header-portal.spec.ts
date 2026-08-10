import { Component, TemplateRef, inject as inject_1 } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminHeaderService } from './admin-header.service';
import { AdminHeaderLeadDirective } from './admin-header-lead.directive';
import { AdminHeaderActionsDirective } from './admin-header-actions.directive';

/** Página de prueba que publica en ambos portales, como hace Pedidos. */
@Component({
  standalone: false,
  template: `
    <ng-template adminHeaderLead><span>kpis</span></ng-template>
    <ng-template adminHeaderActions><span>acciones</span></ng-template>
  `,
})
class PaginaConPortalesComponent {
  /** La ruta que el router le inyecta: es la que la directiva usa para re-publicar. */
  static ultimaRuta: ActivatedRoute | null = null;
  constructor() {
    const route = inject_1(ActivatedRoute);

    PaginaConPortalesComponent.ultimaRuta = route;
  }
}

@Component({ standalone: false, template: 'otra' })
class OtraPaginaComponent {}

@Component({ standalone: false, template: '<router-outlet></router-outlet>' })
class HostComponent {}

describe('Portales del header admin', () => {
  let router: Router;
  let header: AdminHeaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        HostComponent,
        PaginaConPortalesComponent,
        OtraPaginaComponent,
        AdminHeaderLeadDirective,
        AdminHeaderActionsDirective,
      ],
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'admin/pedidos', component: PaginaConPortalesComponent },
          { path: 'admin/pedidos-mostrador', component: OtraPaginaComponent },
          { path: 'admin/clientes', component: OtraPaginaComponent },
        ]),
      ],
    });

    router = TestBed.inject(Router);
    header = TestBed.inject(AdminHeaderService);
    PaginaConPortalesComponent.ultimaRuta = null;

    // Simula al shell: limpia los portales en cada NavigationStart. Ésta es la
    // limpieza que dejaba el header vacío al volver al módulo.
    router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        header.setActions(null);
        header.setLead(null);
      }
    });
  });

  /** Arranca el host con el outlet y navega a la página de portales. */
  function entrarAPedidos(): void {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    router.navigateByUrl('/admin/pedidos');
    tick();
    fixture.detectChanges();
    tick();
  }

  const lead = (): TemplateRef<unknown> | null => header['leadSubject'].value?.tpl ?? null;
  const acciones = (): TemplateRef<unknown> | null => header['actionsSubject'].value;

  it('publica el lead y las acciones al entrar a la página', fakeAsync(() => {
    entrarAPedidos();

    expect(lead()).withContext('lead').not.toBeNull();
    expect(acciones()).withContext('acciones').not.toBeNull();
  }));

  it('re-publica al volver aunque la página esté cacheada (ngOnInit no re-corre)', fakeAsync(() => {
    entrarAPedidos();

    // Directiva "cacheada": misma ruta que el router le dio a la página, instancia
    // viva que NO se vuelve a inicializar al regresar (lo que hace IonicRouteStrategy).
    const ruta = PaginaConPortalesComponent.ultimaRuta!;
    const tplCacheado = { cacheado: true } as unknown as TemplateRef<unknown>;
    const cacheada = new AdminHeaderLeadDirective(tplCacheado, header, router, ruta);
    cacheada.ngOnInit();
    tick();
    expect(lead()).withContext('publica al inicializar').toBe(tplCacheado);

    // Salgo del módulo: el shell limpia en NavigationStart.
    router.navigateByUrl('/admin/clientes');
    tick();
    expect(lead()).withContext('limpiado al salir').toBeNull();

    // Vuelvo SIN recrear la directiva: solo la navegación debe re-publicar.
    router.navigateByUrl('/admin/pedidos');
    tick();
    expect(lead()).withContext('lead al volver').toBe(tplCacheado);

    cacheada.ngOnDestroy();
  }));

  it('propaga conservaTitulo (Configuración muestra su chip a la par del título)', fakeAsync(() => {
    entrarAPedidos();

    const ruta = PaginaConPortalesComponent.ultimaRuta!;
    const tpl = { chipEstado: true } as unknown as TemplateRef<unknown>;
    const conTitulo = new AdminHeaderLeadDirective(tpl, header, router, ruta);
    conTitulo.conservaTitulo = true;
    conTitulo.ngOnInit();
    tick();

    expect(header['leadSubject'].value?.conservaTitulo).withContext('al publicar').toBeTrue();

    // También al volver: el flag no se pierde en la re-publicación por navegación.
    router.navigateByUrl('/admin/clientes');
    tick();
    router.navigateByUrl('/admin/pedidos');
    tick();

    expect(header['leadSubject'].value?.conservaTitulo).withContext('al volver').toBeTrue();
    conTitulo.ngOnDestroy();
  }));

  it('no re-publica en rutas hermanas de nombre parecido (pedidos-mostrador)', fakeAsync(() => {
    entrarAPedidos();

    const ruta = PaginaConPortalesComponent.ultimaRuta!;
    const tplCacheado = { cacheado: true } as unknown as TemplateRef<unknown>;
    const cacheada = new AdminHeaderLeadDirective(tplCacheado, header, router, ruta);
    cacheada.ngOnInit();
    tick();

    router.navigateByUrl('/admin/pedidos-mostrador');
    tick();

    expect(lead()).toBeNull();
    cacheada.ngOnDestroy();
  }));
});
