import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Insumo, InsumoMovimiento } from '../../core/models/insumo.model';
import { InsumoService } from '../../core/services/insumo.service';

type FiltroInventario = 'todos' | 'bajo_stock' | 'normal' | 'sin_minimo';

/** Inventario de insumos/ingredientes (panel admin), conectado a la API real. */
@Component({
  selector: 'app-admin-inventario',
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss'],
  standalone: false,
})
export class AdminInventarioPage implements OnInit {
  /** Presets comunes de unidad de medida (el backend acepta cualquier string). */
  private readonly unidadesBase: string[] = ['kg', 'g', 'l', 'ml', 'unidad', 'docena', 'caja', 'paquete'];

  /**
   * Unidades para el datalist: presets + las que ya existan en insumos guardados
   * (si alguien inventa una unidad nueva, queda disponible para la próxima vez
   * porque se deriva de datos reales, sin necesidad de una tabla aparte).
   */
  get unidades(): string[] {
    const usadas = this.insumos.map((i) => i.unidad_medida);
    return Array.from(new Set([...this.unidadesBase, ...usadas])).sort();
  }

  private static readonly CANTIDAD_MAX = 999999;

  insumos: Insumo[] = [];
  cargando = false;
  error: string | null = null;

  // Busqueda + filtro por KPI
  busqueda = '';
  filtro: FiltroInventario = 'todos';

  // Modal Nuevo/Editar
  modalOpen = false;
  editando: Insumo | null = null;
  guardando = false;
  formError: string | null = null;

  readonly form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    unidad_medida: ['', [Validators.required, Validators.maxLength(20)]],
    cantidad_actual: [0, [Validators.min(0), Validators.max(AdminInventarioPage.CANTIDAD_MAX)]],
    stock_minimo: [null as number | null, [Validators.min(0), Validators.max(AdminInventarioPage.CANTIDAD_MAX)]],
  });

  // Modal Toma fisica
  tomaOpen = false;
  tomaInsumo: Insumo | null = null;
  guardandoToma = false;
  tomaError: string | null = null;

  readonly tomaForm: FormGroup = this.fb.group({
    cantidad_contada: [null as number | null, [Validators.required, Validators.min(0), Validators.max(AdminInventarioPage.CANTIDAD_MAX)]],
    nota: ['', [Validators.maxLength(255)]],
  });

  // Modal Historial
  historialOpen = false;
  historialInsumo: Insumo | null = null;
  historialMovimientos: InsumoMovimiento[] = [];
  cargandoHistorial = false;
  historialError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private insumoService: InsumoService,
  ) {}

  ngOnInit(): void {
    this.cargarInsumos();
  }

  // ---- KPIs ----
  get totalInsumos(): number {
    return this.insumos.length;
  }
  get totalBajoStock(): number {
    return this.insumos.filter((i) => i.bajo_stock).length;
  }
  get totalNormal(): number {
    return this.insumos.length - this.totalBajoStock;
  }
  get totalSinMinimo(): number {
    return this.insumos.filter((i) => i.stock_minimo === null).length;
  }

  setFiltro(filtro: FiltroInventario): void {
    this.filtro = this.filtro === filtro ? 'todos' : filtro;
  }

  /** Lista visible: aplica busqueda por nombre + filtro de KPI seleccionado. */
  get insumosFiltrados(): Insumo[] {
    const texto = this.busqueda.trim().toLowerCase();
    return this.insumos.filter((i) => {
      const coincideTexto = !texto || i.nombre.toLowerCase().includes(texto);
      const coincideFiltro =
        this.filtro === 'todos' ||
        (this.filtro === 'bajo_stock' && i.bajo_stock) ||
        (this.filtro === 'normal' && !i.bajo_stock) ||
        (this.filtro === 'sin_minimo' && i.stock_minimo === null);
      return coincideTexto && coincideFiltro;
    });
  }

  // ---- Formato / estado ----
  formatCantidad(insumo: Insumo): string {
    return `${insumo.cantidad_actual} ${insumo.unidad_medida}`;
  }
  formatStockMinimo(insumo: Insumo): string {
    return insumo.stock_minimo === null
      ? 'Sin definir'
      : `${insumo.stock_minimo} ${insumo.unidad_medida}`;
  }
  getBadgeType(insumo: Insumo): 'stock_bajo' | 'stock_ok' {
    return insumo.bajo_stock ? 'stock_bajo' : 'stock_ok';
  }

  // ---- Carga ----
  cargarInsumos(): void {
    this.cargando = true;
    this.error = null;
    this.insumoService.listarTodos().subscribe({
      next: (insumos) => {
        this.insumos = insumos;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el inventario. Intentá de nuevo.';
        this.cargando = false;
      },
    });
  }

  // ---- Modal Nuevo/Editar ----
  abrirNuevo(): void {
    this.editando = null;
    this.formError = null;
    this.form.reset({
      nombre: '',
      unidad_medida: '',
      cantidad_actual: 0,
      stock_minimo: null,
    });
    this.form.get('cantidad_actual')?.enable();
    this.modalOpen = true;
  }

  abrirEditar(insumo: Insumo): void {
    this.editando = insumo;
    this.formError = null;
    this.form.reset({
      nombre: insumo.nombre,
      unidad_medida: insumo.unidad_medida,
      cantidad_actual: insumo.cantidad_actual,
      stock_minimo: insumo.stock_minimo,
    });
    // En edicion, cantidad_actual es de solo lectura (solo se cambia por toma fisica).
    this.form.get('cantidad_actual')?.disable();
    this.modalOpen = true;
  }

  cerrarModal(): void {
    this.modalOpen = false;
    this.editando = null;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = 'Revisá el nombre y la unidad de medida (y que las cantidades sean válidas).';
      return;
    }

    const valor = this.form.getRawValue();
    // cantidad_actual: la inicial si se esta creando, o la actual (solo lectura) si se esta editando.
    const cantidadReferencia = Number(valor.cantidad_actual ?? 0);
    if (valor.stock_minimo !== null && valor.stock_minimo !== undefined && Number(valor.stock_minimo) > cantidadReferencia) {
      this.formError = this.editando
        ? 'El stock mínimo no puede ser mayor a la cantidad actual.'
        : 'El stock mínimo no puede ser mayor a la cantidad inicial.';
      return;
    }

    this.guardando = true;
    this.formError = null;

    if (this.editando) {
      // No se envia cantidad_actual en la edicion normal.
      const payload = {
        nombre: valor.nombre,
        unidad_medida: valor.unidad_medida,
        stock_minimo: valor.stock_minimo,
      };
      this.insumoService.actualizar(this.editando.id, payload).subscribe({
        next: () => this.onGuardadoOk(),
        error: () => this.onGuardadoError(),
      });
    } else {
      const payload = {
        nombre: valor.nombre,
        unidad_medida: valor.unidad_medida,
        cantidad_actual: valor.cantidad_actual ?? 0,
        stock_minimo: valor.stock_minimo,
      };
      this.insumoService.crear(payload).subscribe({
        next: () => this.onGuardadoOk(),
        error: () => this.onGuardadoError(),
      });
    }
  }

  private onGuardadoOk(): void {
    this.guardando = false;
    this.cerrarModal();
    this.cargarInsumos();
  }

  private onGuardadoError(): void {
    this.guardando = false;
    this.formError = 'No se pudo guardar el insumo. Revisá los datos e intentá de nuevo.';
  }

  eliminar(insumo: Insumo): void {
    const confirmado = window.confirm(`¿Eliminar "${insumo.nombre}" del inventario?`);
    if (!confirmado) {
      return;
    }
    this.insumoService.eliminar(insumo.id).subscribe({
      next: () => this.cargarInsumos(),
      error: () => {
        this.error = 'No se pudo eliminar el insumo.';
      },
    });
  }

  // ---- Modal Toma fisica ----
  abrirToma(insumo: Insumo): void {
    this.tomaInsumo = insumo;
    this.tomaError = null;
    this.tomaForm.reset({ cantidad_contada: null, nota: '' });
    this.tomaOpen = true;
  }

  cerrarToma(): void {
    this.tomaOpen = false;
    this.tomaInsumo = null;
  }

  /** Diferencia en vivo: cantidad contada - cantidad del sistema. */
  get tomaDiferencia(): number | null {
    const contada = this.tomaForm.get('cantidad_contada')?.value;
    if (contada === null || contada === undefined || contada === '' || !this.tomaInsumo) {
      return null;
    }
    return Number(contada) - this.tomaInsumo.cantidad_actual;
  }

  guardarToma(): void {
    if (this.tomaForm.invalid || !this.tomaInsumo) {
      this.tomaForm.markAllAsTouched();
      this.tomaError = 'Ingresá una cantidad contada válida.';
      return;
    }

    this.guardandoToma = true;
    this.tomaError = null;
    const valor = this.tomaForm.value;
    const nota = (valor.nota as string)?.trim();

    this.insumoService
      .registrarTomaFisica(this.tomaInsumo.id, {
        cantidad_contada: Number(valor.cantidad_contada),
        nota: nota ? nota : undefined,
      })
      .subscribe({
        next: () => {
          this.guardandoToma = false;
          this.cerrarToma();
          this.cargarInsumos();
        },
        error: () => {
          this.guardandoToma = false;
          this.tomaError = 'No se pudo registrar la toma física. Intentá de nuevo.';
        },
      });
  }

  // ---- Modal Historial (solo si el insumo tiene movimientos) ----
  abrirHistorial(insumo: Insumo): void {
    this.historialInsumo = insumo;
    this.historialMovimientos = [];
    this.historialError = null;
    this.historialOpen = true;
    this.cargandoHistorial = true;
    this.insumoService.listarMovimientos(insumo.id).subscribe({
      next: (movimientos) => {
        this.historialMovimientos = movimientos;
        this.cargandoHistorial = false;
      },
      error: () => {
        this.historialError = 'No se pudo cargar el historial.';
        this.cargandoHistorial = false;
      },
    });
  }

  cerrarHistorial(): void {
    this.historialOpen = false;
    this.historialInsumo = null;
  }
}
