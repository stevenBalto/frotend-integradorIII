import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Categoria, Producto, TamanoPayload } from '../../core/models/producto.model';
import { Extra, ExtraPayload } from '../../core/models/extra.model';
import { CategoriaService } from '../../core/services/categoria.service';
import { ProductoService } from '../../core/services/producto.service';
import { ExtraService } from '../../core/services/extra.service';

/** Gestión de menú / catálogo, conectada a la API real. */
@Component({
  selector: 'app-admin-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false,
})
export class AdminMenuPage implements OnInit {
  activeCat = 'Todos';
  categories: string[] = ['Todos'];

  productos: Producto[] = [];
  categorias: Categoria[] = [];
  cargando = false;
  error: string | null = null;

  modalOpen = false;
  editando: Producto | null = null;
  guardando = false;
  formError: string | null = null;

  detalleAbierto = false;
  productoDetalle: Producto | null = null;

  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;

  // Extras (acompañamientos) - gestion por categoria
  extras: Extra[] = [];
  cargandoExtras = false;
  extraModalOpen = false;
  editandoExtra: Extra | null = null;
  guardandoExtra = false;
  extraError: string | null = null;

  readonly form: FormGroup = this.fb.group({
    categoria_id: [null, [Validators.required]],
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: [''],
    precio_base: [null, [Validators.required, Validators.min(0)]],
    destacado: [false],
    disponible: [true],
    tamanos: this.fb.array([]),
  });

  readonly extraForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    precio: [null, [Validators.required, Validators.min(0)]],
    disponible: [true],
  });

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private extraService: ExtraService,
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
    this.cargarExtras();
  }

  // ── Tamanos FormArray ──

  get tamanos(): FormArray {
    return this.form.get('tamanos') as FormArray;
  }

  agregarTamano(): void {
    this.tamanos.push(this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(30)]],
      precio: [null, [Validators.required, Validators.min(0)]],
    }));
  }

  quitarTamano(index: number): void {
    this.tamanos.removeAt(index);
  }

  private resetTamanos(tamanosDatos?: TamanoPayload[]): void {
    this.tamanos.clear();
    if (tamanosDatos) {
      tamanosDatos.forEach((t) => {
        this.tamanos.push(this.fb.group({
          nombre: [t.nombre, [Validators.required, Validators.maxLength(30)]],
          precio: [t.precio, [Validators.required, Validators.min(0)]],
        }));
      });
    }
  }

  get productosFiltrados(): Producto[] {
    if (this.activeCat === 'Todos') {
      return this.productos;
    }
    return this.productos.filter((p) => p.categoria === this.activeCat);
  }

  get totalDisponibles(): number {
    return this.productos.filter((p) => p.disponible).length;
  }

  get totalAgotados(): number {
    return this.productos.filter((p) => !p.disponible).length;
  }

  get totalDestacados(): number {
    return this.productos.filter((p) => p.destacado).length;
  }

  cargarCategorias(): void {
    this.categoriaService.listarAdmin().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.categories = ['Todos', ...categorias.map((c) => c.nombre)];
      },
    });
  }

  cargarProductos(): void {
    this.cargando = true;
    this.error = null;
    this.productoService.listarTodos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el catálogo. Intentá de nuevo.';
        this.cargando = false;
      },
    });
  }

  abrirDetalle(producto: Producto): void {
    this.productoDetalle = producto;
    this.detalleAbierto = true;
  }

  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.productoDetalle = null;
  }

  editarDesdeDetalle(): void {
    const producto = this.productoDetalle;
    this.cerrarDetalle();
    if (producto) {
      this.abrirEditar(producto);
    }
  }

  abrirNuevo(): void {
    this.editando = null;
    this.formError = null;
    this.limpiarImagen();
    this.resetTamanos();
    this.form.reset({
      categoria_id: this.categorias[0]?.id ?? null,
      nombre: '',
      descripcion: '',
      precio_base: null,
      destacado: false,
      disponible: true,
    });
    this.modalOpen = true;
  }

  abrirEditar(producto: Producto): void {
    this.editando = producto;
    this.formError = null;
    this.limpiarImagen();
    this.imagenPreview = producto.imagen_url;
    // Cargar tamanos existentes
    const tamanosExistentes = producto.tamanos?.map((t) => ({
      nombre: t.nombre,
      precio: t.precio,
    })) ?? [];
    this.resetTamanos(tamanosExistentes);
    this.form.reset({
      categoria_id: producto.categoria_id,
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
      precio_base: producto.precio_base,
      destacado: producto.destacado,
      disponible: producto.disponible,
    });
    this.modalOpen = true;
  }

  cerrarModal(): void {
    this.modalOpen = false;
    this.editando = null;
    this.limpiarImagen();
  }

  seleccionarImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    if (!archivo) {
      return;
    }
    this.imagenSeleccionada = archivo;
    if (this.imagenPreview && this.imagenPreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagenPreview);
    }
    this.imagenPreview = URL.createObjectURL(archivo);
  }

  private limpiarImagen(): void {
    if (this.imagenPreview && this.imagenPreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagenPreview);
    }
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.formError = null;

    // Construir payload con tamanos
    const formValue = this.form.value;
    const payload = {
      categoria_id: formValue.categoria_id,
      nombre: formValue.nombre,
      descripcion: formValue.descripcion,
      precio_base: formValue.precio_base,
      destacado: formValue.destacado,
      disponible: formValue.disponible,
      tamanos: formValue.tamanos as TamanoPayload[],
    };

    const request$ = this.editando
      ? this.productoService.actualizar(this.editando.id, payload, this.imagenSeleccionada)
      : this.productoService.crear(payload, this.imagenSeleccionada);

    request$.subscribe({
      next: () => {
        this.guardando = false;
        this.limpiarImagen();
        this.cerrarModal();
        this.cargarProductos();
      },
      error: () => {
        this.guardando = false;
        this.formError = 'No se pudo guardar el producto. Revisa los datos e intenta de nuevo.';
      },
    });
  }

  eliminar(producto: Producto): void {
    const confirmado = window.confirm(`Eliminar "${producto.nombre}" del catalogo?`);
    if (!confirmado) {
      return;
    }

    this.productoService.eliminar(producto.id).subscribe({
      next: () => this.cargarProductos(),
      error: () => {
        this.error = 'No se pudo eliminar el producto.';
      },
    });
  }

  // ── Extras (acompañamientos) ──

  cargarExtras(): void {
    this.cargandoExtras = true;
    this.extraService.listarTodos().subscribe({
      next: (extras) => {
        this.extras = extras;
        this.cargandoExtras = false;
      },
      error: () => {
        this.cargandoExtras = false;
      },
    });
  }

  /** Extras filtrados por la categoria seleccionada en el form de producto. */
  get extrasFiltrados(): Extra[] {
    const catId = this.form.get('categoria_id')?.value;
    if (!catId) {
      return this.extras;
    }
    return this.extras.filter((e) => e.categoria_id === catId);
  }

  abrirNuevoExtra(): void {
    const catId = this.form.get('categoria_id')?.value;
    if (!catId) {
      return;
    }
    this.editandoExtra = null;
    this.extraError = null;
    this.extraForm.reset({
      nombre: '',
      precio: null,
      disponible: true,
    });
    this.extraModalOpen = true;
  }

  abrirEditarExtra(extra: Extra): void {
    this.editandoExtra = extra;
    this.extraError = null;
    this.extraForm.reset({
      nombre: extra.nombre,
      precio: extra.precio,
      disponible: extra.disponible,
    });
    this.extraModalOpen = true;
  }

  cerrarExtraModal(): void {
    this.extraModalOpen = false;
    this.editandoExtra = null;
  }

  guardarExtra(): void {
    if (this.extraForm.invalid) {
      this.extraForm.markAllAsTouched();
      return;
    }

    const catId = this.form.get('categoria_id')?.value;
    if (!catId) {
      return;
    }

    this.guardandoExtra = true;
    this.extraError = null;

    const payload: ExtraPayload = {
      categoria_id: catId,
      nombre: this.extraForm.value.nombre,
      precio: this.extraForm.value.precio,
      disponible: this.extraForm.value.disponible,
    };

    const request$ = this.editandoExtra
      ? this.extraService.actualizar(this.editandoExtra.id, payload)
      : this.extraService.crear(payload);

    request$.subscribe({
      next: () => {
        this.guardandoExtra = false;
        this.cerrarExtraModal();
        this.cargarExtras();
      },
      error: () => {
        this.guardandoExtra = false;
        this.extraError = 'No se pudo guardar el extra.';
      },
    });
  }

  eliminarExtra(extra: Extra): void {
    const confirmado = window.confirm(`Eliminar el extra "${extra.nombre}"?`);
    if (!confirmado) {
      return;
    }

    this.extraService.eliminar(extra.id).subscribe({
      next: () => this.cargarExtras(),
      error: (err) => {
        // Si ya fue usado en un pedido, mostrar mensaje y sugerir desactivar
        const mensaje = err?.error?.message || 'No se pudo eliminar el extra.';
        window.alert(mensaje + ' Puedes desactivarlo en lugar de eliminarlo.');
      },
    });
  }

  toggleExtraDisponible(extra: Extra): void {
    const payload: ExtraPayload = {
      categoria_id: extra.categoria_id,
      nombre: extra.nombre,
      precio: extra.precio,
      disponible: !extra.disponible,
    };
    this.extraService.actualizar(extra.id, payload).subscribe({
      next: () => this.cargarExtras(),
    });
  }
}
