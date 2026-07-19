import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { OfertaService } from '../../core/services/oferta.service';
import { CuponService } from '../../core/services/cupon.service';
import { ProductoService } from '../../core/services/producto.service';
import { Oferta, OfertaPayload } from '../../core/models/oferta.model';
import { Cupon, CuponPayload } from '../../core/models/cupon.model';

interface ProductoOpt {
  id: number;
  nombre: string;
}

type FiltroOferta = 'todos' | 'activas' | 'por_vencer' | 'vencidas';
type FiltroCupon = 'todos' | 'activos' | 'agotados';

/**
 * Ofertas (combos) y cupones (codigos) del panel admin, conectado a la API.
 * Reconstruido para acompañar el HTML conectado (el .ts original no se subió).
 */
@Component({
  selector: 'app-admin-ofertas',
  templateUrl: './ofertas.page.html',
  styleUrls: ['./ofertas.page.scss'],
  standalone: false,
})
export class AdminOfertasPage implements OnInit {
  tab: 'ofertas' | 'cupones' = 'ofertas';

  // Datos
  ofertas: Oferta[] = [];
  cupones: Cupon[] = [];
  productos: ProductoOpt[] = [];

  // Estado de carga / error
  cargandoOfertas = false;
  cargandoCupones = false;
  errorOfertas: string | null = null;
  errorCupones: string | null = null;

  // Busqueda + filtro por KPI
  busquedaOferta = '';
  filtroOferta: FiltroOferta = 'todos';
  busquedaCupon = '';
  filtroCupon: FiltroCupon = 'todos';

  // Modal oferta
  modalOfertaOpen = false;
  editandoOferta = false;
  guardandoOferta = false;
  formOfertaError: string | null = null;
  readonly formOferta: FormGroup;
  private ofertaEditId: number | null = null;
  private productosSel = new Set<number>();

  // Modal cupon
  modalCuponOpen = false;
  editandoCupon = false;
  guardandoCupon = false;
  formCuponError: string | null = null;
  readonly formCupon: FormGroup;
  private cuponEditId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private ofertaService: OfertaService,
    private cuponService: CuponService,
    private productoService: ProductoService,
  ) {
    this.formOferta = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: [''],
      tipo_descuento: ['porcentaje', [Validators.required]],
      valor: [null, [Validators.required, Validators.min(0)]],
      fecha_inicio: [''],
      fecha_fin: [''],
      activa: [true],
    });
    this.formCupon = this.fb.group({
      codigo: ['', [Validators.required]],
      tipo: ['porcentaje', [Validators.required]],
      valor: [null, [Validators.required, Validators.min(0)]],
      monto_minimo: [null],
      fecha_inicio: [''],
      fecha_fin: [''],
      usos_max: [null],
      activo: [true],
    });
  }

  ngOnInit(): void {
    this.cargarOfertas();
    this.cargarCupones();
    this.cargarProductos();
  }

  // ── Carga ─────────────────────────────────────────────────────────
  cargarOfertas(): void {
    this.cargandoOfertas = true;
    this.errorOfertas = null;
    this.ofertaService.listarTodos().subscribe({
      next: (data) => {
        this.ofertas = data;
        this.cargandoOfertas = false;
      },
      error: () => {
        this.errorOfertas = 'No se pudieron cargar las ofertas.';
        this.cargandoOfertas = false;
      },
    });
  }

  cargarCupones(): void {
    this.cargandoCupones = true;
    this.errorCupones = null;
    this.cuponService.listarTodos().subscribe({
      next: (data) => {
        this.cupones = data;
        this.cargandoCupones = false;
      },
      error: () => {
        this.errorCupones = 'No se pudieron cargar los cupones.';
        this.cargandoCupones = false;
      },
    });
  }

  cargarProductos(): void {
    this.productoService.listarTodos().subscribe({
      next: (data) => (this.productos = data.map((p) => ({ id: p.id, nombre: p.nombre }))),
    });
  }

  // ── KPIs ──────────────────────────────────────────────────────────
  get totalOfertas(): number {
    return this.ofertas.length;
  }
  get ofertasActivas(): number {
    return this.ofertas.filter((o) => o.activa).length;
  }
  get ofertasPorVencer(): number {
    return this.ofertas.filter((o) => this.isOfertaUrgent(o)).length;
  }
  get ofertasVencidas(): number {
    return this.ofertas.filter((o) => {
      const d = this.diasHastaFin(o.fecha_fin);
      return d !== null && d < 0;
    }).length;
  }
  get totalCupones(): number {
    return this.cupones.length;
  }
  get cuponesActivos(): number {
    return this.cupones.filter((c) => c.activo).length;
  }
  get usosTotales(): number {
    return this.cupones.reduce((acc, c) => acc + (c.usos_actuales ?? 0), 0);
  }
  get cuponesAgotados(): number {
    return this.cupones.filter((c) => c.usos_max !== null && c.usos_actuales >= c.usos_max).length;
  }

  setFiltroOferta(filtro: FiltroOferta): void {
    this.filtroOferta = this.filtroOferta === filtro ? 'todos' : filtro;
  }

  setFiltroCupon(filtro: FiltroCupon): void {
    this.filtroCupon = this.filtroCupon === filtro ? 'todos' : filtro;
  }

  /** Lista visible de ofertas: aplica busqueda por nombre + filtro de KPI seleccionado. */
  get ofertasFiltradas(): Oferta[] {
    const texto = this.busquedaOferta.trim().toLowerCase();
    return this.ofertas.filter((o) => {
      const coincideTexto = !texto || o.nombre.toLowerCase().includes(texto);
      const coincideFiltro =
        this.filtroOferta === 'todos' ||
        (this.filtroOferta === 'activas' && o.activa) ||
        (this.filtroOferta === 'por_vencer' && this.isOfertaUrgent(o)) ||
        (this.filtroOferta === 'vencidas' && (this.diasHastaFin(o.fecha_fin) ?? 0) < 0);
      return coincideTexto && coincideFiltro;
    });
  }

  /** Lista visible de cupones: aplica busqueda por codigo + filtro de KPI seleccionado. */
  get cuponesFiltrados(): Cupon[] {
    const texto = this.busquedaCupon.trim().toLowerCase();
    return this.cupones.filter((c) => {
      const coincideTexto = !texto || c.codigo.toLowerCase().includes(texto);
      const coincideFiltro =
        this.filtroCupon === 'todos' ||
        (this.filtroCupon === 'activos' && c.activo) ||
        (this.filtroCupon === 'agotados' && this.isUsosBarFull(c));
      return coincideTexto && coincideFiltro;
    });
  }

  // ── Modal oferta ──────────────────────────────────────────────────
  abrirNuevaOferta(): void {
    this.editandoOferta = false;
    this.ofertaEditId = null;
    this.formOfertaError = null;
    this.productosSel.clear();
    this.formOferta.reset({ tipo_descuento: 'porcentaje', activa: true });
    this.modalOfertaOpen = true;
  }

  abrirEditarOferta(o: Oferta): void {
    this.editandoOferta = true;
    this.ofertaEditId = o.id;
    this.formOfertaError = null;
    this.productosSel = new Set((o.productos ?? []).map((p) => p.id));
    this.formOferta.reset({
      nombre: o.nombre,
      descripcion: o.descripcion ?? '',
      tipo_descuento: o.tipo_descuento,
      valor: o.valor,
      fecha_inicio: o.fecha_inicio ?? '',
      fecha_fin: o.fecha_fin ?? '',
      activa: o.activa,
    });
    this.modalOfertaOpen = true;
  }

  cerrarModalOferta(): void {
    this.modalOfertaOpen = false;
  }

  isProductoSelected(id: number): boolean {
    return this.productosSel.has(id);
  }

  toggleProducto(id: number): void {
    if (this.productosSel.has(id)) {
      this.productosSel.delete(id);
    } else {
      this.productosSel.add(id);
    }
  }

  guardarOferta(): void {
    if (this.formOferta.invalid) {
      this.formOferta.markAllAsTouched();
      this.formOfertaError = 'Revisá los campos obligatorios.';
      return;
    }
    const v = this.formOferta.getRawValue();
    const payload: OfertaPayload = {
      nombre: v.nombre,
      descripcion: v.descripcion || null,
      tipo_descuento: v.tipo_descuento,
      valor: Number(v.valor),
      fecha_inicio: v.fecha_inicio || null,
      fecha_fin: v.fecha_fin || null,
      activa: !!v.activa,
      producto_ids: Array.from(this.productosSel),
    };

    this.guardandoOferta = true;
    this.formOfertaError = null;
    const req =
      this.editandoOferta && this.ofertaEditId !== null
        ? this.ofertaService.actualizar(this.ofertaEditId, payload)
        : this.ofertaService.crear(payload);

    req.subscribe({
      next: () => {
        this.guardandoOferta = false;
        this.modalOfertaOpen = false;
        this.cargarOfertas();
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoOferta = false;
        this.formOfertaError = this.primerError(err);
      },
    });
  }

  eliminarOferta(o: Oferta): void {
    if (!confirm(`¿Eliminar la oferta "${o.nombre}"?`)) {
      return;
    }
    this.ofertaService.eliminar(o.id).subscribe({ next: () => this.cargarOfertas() });
  }

  // ── Modal cupon ───────────────────────────────────────────────────
  abrirNuevoCupon(): void {
    this.editandoCupon = false;
    this.cuponEditId = null;
    this.formCuponError = null;
    this.formCupon.reset({ tipo: 'porcentaje', activo: true });
    this.modalCuponOpen = true;
  }

  abrirEditarCupon(c: Cupon): void {
    this.editandoCupon = true;
    this.cuponEditId = c.id;
    this.formCuponError = null;
    this.formCupon.reset({
      codigo: c.codigo,
      tipo: c.tipo,
      valor: c.valor,
      monto_minimo: c.monto_minimo,
      fecha_inicio: c.fecha_inicio ?? '',
      fecha_fin: c.fecha_fin ?? '',
      usos_max: c.usos_max,
      activo: c.activo,
    });
    this.modalCuponOpen = true;
  }

  cerrarModalCupon(): void {
    this.modalCuponOpen = false;
  }

  guardarCupon(): void {
    if (this.formCupon.invalid) {
      this.formCupon.markAllAsTouched();
      this.formCuponError = 'Revisá los campos obligatorios.';
      return;
    }
    const v = this.formCupon.getRawValue();
    const payload: CuponPayload = {
      codigo: v.codigo,
      tipo: v.tipo,
      valor: Number(v.valor),
      monto_minimo: v.monto_minimo === null || v.monto_minimo === '' ? null : Number(v.monto_minimo),
      fecha_inicio: v.fecha_inicio || null,
      fecha_fin: v.fecha_fin || null,
      usos_max: v.usos_max === null || v.usos_max === '' ? null : Number(v.usos_max),
      activo: !!v.activo,
    };

    this.guardandoCupon = true;
    this.formCuponError = null;
    const req =
      this.editandoCupon && this.cuponEditId !== null
        ? this.cuponService.actualizar(this.cuponEditId, payload)
        : this.cuponService.crear(payload);

    req.subscribe({
      next: () => {
        this.guardandoCupon = false;
        this.modalCuponOpen = false;
        this.cargarCupones();
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoCupon = false;
        this.formCuponError = this.primerError(err);
      },
    });
  }

  eliminarCupon(c: Cupon): void {
    if (!confirm(`¿Eliminar el cupón "${c.codigo}"?`)) {
      return;
    }
    this.cuponService.eliminar(c.id).subscribe({ next: () => this.cargarCupones() });
  }

  // ── Formateo / helpers de vista ───────────────────────────────────
  formatValorOferta(o: Oferta): string {
    return o.tipo_descuento === 'porcentaje' ? `${o.valor}% de descuento` : `₡${this.num(o.valor)} precio fijo`;
  }
  formatTipoDescuento(tipo: string): string {
    return tipo === 'porcentaje' ? '% descuento' : 'Precio fijo';
  }
  formatTipoCupon(tipo: string): string {
    return tipo === 'porcentaje' ? 'Porcentaje' : 'Monto fijo';
  }
  formatValorCupon(c: Cupon): string {
    return c.tipo === 'porcentaje' ? `${c.valor}%` : `₡${this.num(c.valor)}`;
  }
  formatMontoMinimo(monto: number | null): string {
    return monto === null ? 'Sin mínimo' : `₡${this.num(monto)}`;
  }
  formatUsosLabel(c: Cupon): string {
    return c.usos_max === null ? `${c.usos_actuales} / ∞` : `${c.usos_actuales} / ${c.usos_max}`;
  }
  formatVigencia(fecha: string | null): string {
    const d = this.diasHastaFin(fecha);
    if (fecha === null || d === null) return 'Sin fecha fin';
    if (d < 0) return 'Vencida';
    const f = new Date(fecha);
    return 'Hasta ' + f.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit' });
  }
  isOfertaUrgent(o: Oferta): boolean {
    const d = this.diasHastaFin(o.fecha_fin);
    return o.activa && d !== null && d >= 0 && d <= 7;
  }
  isUsosBarFull(c: Cupon): boolean {
    return c.usos_max !== null && c.usos_actuales >= c.usos_max;
  }
  getUsosBarPct(c: Cupon): number {
    if (c.usos_max === null || c.usos_max === 0) return 0;
    return Math.min(100, Math.round((c.usos_actuales / c.usos_max) * 100));
  }
  getOfertaBadgeType(o: Oferta): 'active' | 'inactive' | 'expired' {
    const d = this.diasHastaFin(o.fecha_fin);
    if (d !== null && d < 0) return 'expired';
    return o.activa ? 'active' : 'inactive';
  }
  getCuponBadgeType(c: Cupon): 'active' | 'inactive' {
    return c.activo ? 'active' : 'inactive';
  }

  private diasHastaFin(fecha: string | null): number | null {
    if (!fecha) return null;
    const fin = new Date(fecha);
    if (isNaN(fin.getTime())) return null;
    fin.setHours(0, 0, 0, 0);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((fin.getTime() - hoy.getTime()) / 86400000);
  }

  private num(v: number): string {
    return new Intl.NumberFormat('es-CR').format(v);
  }

  private primerError(err: HttpErrorResponse): string {
    const errores = err.error?.errors;
    if (errores) {
      const primero = Object.values(errores)[0];
      if (Array.isArray(primero)) return primero[0] as string;
    }
    return err.error?.message ?? 'Ocurrió un error.';
  }
}
