import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SucursalService } from '../../core/services/sucursal.service';
import { Sucursal, SucursalPayload } from '../../core/models/sucursal.model';

interface ConfigField { label: string; value: string; icon?: string; }
interface NotifToggle { label: string; sub: string; on: boolean; }

/**
 * Configuración general del panel. Todo es maqueta estática EXCEPTO la tarjeta
 * de "Sucursales", conectada a la API real (GET/POST/PUT /admin/sucursales).
 */
@Component({
  selector: 'app-admin-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: false,
})
export class AdminConfiguracionPage implements OnInit {
  readonly generalFields: ConfigField[] = [
    { label: 'Nombre del restaurante', value: 'Rooster',             icon: 'storefront-outline' },
    { label: 'Teléfono de contacto',   value: '8888-8888',           icon: 'call-outline' },
    { label: 'Dirección',              value: 'Liberia, Guanacaste', icon: 'globe-outline' },
    { label: 'Sitio web',              value: 'rooster.cr',          icon: 'globe-outline' },
  ];

  readonly notifToggles: NotifToggle[] = [
    { label: 'Nuevos pedidos', sub: 'Recibir alerta al llegar un pedido',   on: true },
    { label: 'Reseñas nuevas', sub: 'Recibir alerta cuando hay reseñas',    on: true },
    { label: 'Stock bajo',     sub: 'Alertar cuando un producto se agota',  on: true },
  ];

  // ── Sucursales (datos reales) ──
  branches: Sucursal[] = [];
  cargandoSucursales = false;
  errorSucursales: string | null = null;

  // Modal crear/editar sucursal
  sucursalModalOpen = false;
  editandoSucursal: Sucursal | null = null;
  guardandoSucursal = false;
  sucursalError: string | null = null;
  togglingId: number | null = null;

  readonly sucursalForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    direccion: ['', [Validators.required, Validators.maxLength(200)]],
    telefono: [''],
    activa: [true],
  });

  constructor(
    private fb: FormBuilder,
    private sucursalService: SucursalService,
  ) {}

  ngOnInit(): void {
    this.cargarSucursales();
  }

  cargarSucursales(): void {
    this.cargandoSucursales = true;
    this.errorSucursales = null;
    this.sucursalService.listarAdmin().subscribe({
      next: (sucursales) => {
        this.branches = sucursales;
        this.cargandoSucursales = false;
      },
      error: () => {
        this.errorSucursales = 'No se pudieron cargar las sucursales.';
        this.cargandoSucursales = false;
      },
    });
  }

  abrirNuevaSucursal(): void {
    this.editandoSucursal = null;
    this.sucursalError = null;
    this.sucursalForm.reset({
      nombre: '',
      direccion: '',
      telefono: '',
      activa: true,
    });
    this.sucursalModalOpen = true;
  }

  abrirEditarSucursal(sucursal: Sucursal): void {
    this.editandoSucursal = sucursal;
    this.sucursalError = null;
    this.sucursalForm.reset({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion ?? '',
      telefono: sucursal.telefono ?? '',
      activa: sucursal.activa,
    });
    this.sucursalModalOpen = true;
  }

  cerrarSucursalModal(): void {
    this.sucursalModalOpen = false;
    this.editandoSucursal = null;
  }

  guardarSucursal(): void {
    if (this.sucursalForm.invalid) {
      this.sucursalForm.markAllAsTouched();
      return;
    }

    this.guardandoSucursal = true;
    this.sucursalError = null;

    const valor = this.sucursalForm.value;
    const payload: SucursalPayload = {
      nombre: valor.nombre,
      direccion: valor.direccion?.trim() || null,
      telefono: valor.telefono?.trim() || null,
      activa: valor.activa,
    };

    const request$ = this.editandoSucursal
      ? this.sucursalService.actualizar(this.editandoSucursal.id, payload)
      : this.sucursalService.crear(payload);

    request$.subscribe({
      next: () => {
        this.guardandoSucursal = false;
        this.cerrarSucursalModal();
        this.cargarSucursales();
      },
      error: (err) => {
        this.guardandoSucursal = false;
        this.sucursalError = err?.error?.message || 'No se pudo guardar la sucursal.';
      },
    });
  }

  toggleActiva(sucursal: Sucursal): void {
    this.togglingId = sucursal.id;
    const payload: SucursalPayload = {
      nombre: sucursal.nombre,
      direccion: sucursal.direccion ?? null,
      telefono: sucursal.telefono ?? null,
      activa: !sucursal.activa,
    };
    this.sucursalService.actualizar(sucursal.id, payload).subscribe({
      next: (actualizada) => {
        sucursal.activa = actualizada.activa;
        this.togglingId = null;
      },
      error: () => {
        this.togglingId = null;
        this.errorSucursales = 'No se pudo cambiar el estado de la sucursal.';
      },
    });
  }
}
