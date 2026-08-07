import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AdminOptionComponent, AdminSelectComponent } from './admin-select.component';

@Component({
  standalone: false,
  template: `
    <admin-select [(ngModel)]="valor" placeholder="Elegí un rango">
      <admin-option [value]="null" [disabled]="true">No elegible</admin-option>
      <admin-option *ngFor="let op of opciones" [value]="op.v">{{ op.l }}</admin-option>
    </admin-select>
  `,
})
class HostComponent {
  valor: number | null = null;
  opciones = [
    { v: 7, l: 'Últimos 7 días' },
    { v: 14, l: 'Últimos 14 días' },
    { v: 30, l: 'Últimos 30 días' },
  ];
}

describe('AdminSelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HostComponent, AdminSelectComponent, AdminOptionComponent],
      imports: [FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  const disparador = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.sel__trigger');
  const panel = (): HTMLElement => fixture.nativeElement.querySelector('.sel__panel');
  const opciones = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('admin-option'));
  const estaAbierto = (): boolean => panel().classList.contains('sel__panel--abierto');

  it('muestra el placeholder mientras no hay valor', () => {
    expect(disparador().textContent).toContain('Elegí un rango');
  });

  it('muestra la etiqueta de la opción cuyo valor coincide', fakeAsync(() => {
    host.valor = 14;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(disparador().textContent).toContain('Últimos 14 días');
  }));

  it('abre y cierra el panel al tocar el disparador', () => {
    expect(estaAbierto()).toBeFalse();

    disparador().click();
    fixture.detectChanges();
    expect(estaAbierto()).toBeTrue();

    disparador().click();
    fixture.detectChanges();
    expect(estaAbierto()).toBeFalse();
  });

  it('al elegir una opción actualiza el ngModel y cierra el panel', fakeAsync(() => {
    disparador().click();
    fixture.detectChanges();

    // opciones()[0] es la deshabilitada; la de "30 días" es la última.
    opciones()[3].click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(host.valor).toBe(30);
    expect(estaAbierto()).toBeFalse();
    expect(disparador().textContent).toContain('Últimos 30 días');
  }));

  it('ignora las opciones deshabilitadas', fakeAsync(() => {
    host.valor = 7;
    fixture.detectChanges();
    tick();

    disparador().click();
    fixture.detectChanges();
    opciones()[0].click();
    fixture.detectChanges();
    tick();

    expect(host.valor).withContext('no debe cambiar').toBe(7);
    expect(estaAbierto()).withContext('sigue abierto').toBeTrue();
  }));

  it('cierra con Escape y con un clic fuera', () => {
    disparador().click();
    fixture.detectChanges();
    disparador().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(estaAbierto()).withContext('Escape').toBeFalse();

    disparador().click();
    fixture.detectChanges();
    document.body.click();
    fixture.detectChanges();
    expect(estaAbierto()).withContext('clic fuera').toBeFalse();
  });

  it('con el teclado: flecha abajo resalta y Enter elige', fakeAsync(() => {
    disparador().click();
    fixture.detectChanges();

    // Al abrir se resalta la primera seleccionable ("7 días"); una flecha abajo
    // pasa a "14 días".
    disparador().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    disparador().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(host.valor).toBe(14);
    expect(estaAbierto()).toBeFalse();
  }));

  it('refleja opciones que llegan después (datos de la API)', fakeAsync(() => {
    host.opciones = [...host.opciones, { v: 90, l: 'Últimos 90 días' }];
    host.valor = 90;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(disparador().textContent).toContain('Últimos 90 días');
  }));
});
