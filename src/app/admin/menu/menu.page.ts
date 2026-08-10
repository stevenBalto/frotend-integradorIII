import { Component, OnInit, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Categoria, Producto, TamanoPayload } from '../../core/models/producto.model';
import { Extra, ExtraPayload } from '../../core/models/extra.model';
import { CategoriaService } from '../../core/services/categoria.service';
import { ProductoService } from '../../core/services/producto.service';
import { ExtraService } from '../../core/services/extra.service';
import { ConfirmService } from '../../core/services/confirm.service';

/** Gestión de menú / catálogo, conectada a la API real. */
@Component({
  selector: 'app-admin-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false,
})
export class AdminMenuPage implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private extraService = inject(ExtraService);
  private toast = inject(ToastController);
  private confirm = inject(ConfirmService);

  activeCat = 'Todos';
  categories: string[] = ['Todos'];
  vistaTabla: 'productos' | 'extras' = 'productos';

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
  imagenNombreArchivo: string | null = null;

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
      descripcion: ['', [Validators.maxLength(40)]],
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
          descripcion: [t.descripcion ?? '', [Validators.maxLength(40)]],
        }));
      });
    }
  }

  // #11 Filtro de estado alimentado por los KPIs (todos/disponibles/agotados/destacados).
  filtroEstadoMenu: 'todos' | 'disponibles' | 'agotados' | 'destacados' = 'todos';

  get productosFiltrados(): Producto[] {
    let lista = this.activeCat === 'Todos'
      ? this.productos
      : this.productos.filter((p) => p.categoria === this.activeCat);

    if (this.filtroEstadoMenu === 'disponibles') lista = lista.filter((p) => p.disponible);
    else if (this.filtroEstadoMenu === 'agotados') lista = lista.filter((p) => !p.disponible);
    else if (this.filtroEstadoMenu === 'destacados') lista = lista.filter((p) => p.destacado);

    return lista;
  }

  /** #11 KPI como filtro: cambia a vista productos, filtra y enfoca la tabla. */
  filtrarMenu(f: 'todos' | 'disponibles' | 'agotados' | 'destacados'): void {
    this.filtroEstadoMenu = f;
    this.vistaTabla = 'productos';
    setTimeout(() => {
      document.getElementById('menu-tabla')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
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
      descripcion: t.descripcion,
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
    this.imagenNombreArchivo = archivo.name;
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
    this.imagenNombreArchivo = null;
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

  async eliminar(producto: Producto): Promise<void> {
    const confirmado = await this.confirm.preguntar({
      titulo: '¿Eliminar producto?',
      mensaje: `"${producto.nombre}" se quitará del catálogo. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      tono: 'peligro',
      icono: 'trash-outline',
    });
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

  /** Nombre de categoria de un extra para la tabla de gestion (o "General"). */
  nombreCategoriaExtra(extra: Extra): string {
    if (extra.es_general) {
      return 'General';
    }
    return this.categorias.find((c) => c.id === extra.categoria_id)?.nombre ?? 'Sin categoría';
  }

  /** Extras filtrados por la categoria seleccionada en el form de producto. */
  get extrasFiltrados(): Extra[] {
    const catId = this.form.get('categoria_id')?.value;
    if (!catId) {
      return this.extras;
    }
    return this.extras.filter((e) => e.categoria_id === catId);
  }

  /** Todos los extras, para la tabla principal (vista "Extras" — sin tabs de categoria). */
  get extrasFiltradosTabla(): Extra[] {
    return this.extras;
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

    // Al editar, conserva la categoria/generalidad propias del extra (no editables en este modal).
    // Al crear (solo alcanzable desde el form de producto), usa la categoria del producto en edicion.
    const esGeneral = this.editandoExtra?.es_general ?? false;
    const catId = this.editandoExtra
      ? this.editandoExtra.categoria_id
      : this.form.get('categoria_id')?.value;
    if (!esGeneral && !catId) {
      return;
    }

    this.guardandoExtra = true;
    this.extraError = null;

    const payload: ExtraPayload = {
      categoria_id: esGeneral ? null : catId,
      nombre: this.extraForm.value.nombre,
      precio: this.extraForm.value.precio,
      disponible: this.extraForm.value.disponible,
      es_general: esGeneral,
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

  async eliminarExtra(extra: Extra): Promise<void> {
    const confirmado = await this.confirm.preguntar({
      titulo: '¿Eliminar extra?',
      mensaje: `"${extra.nombre}" dejará de estar disponible. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      tono: 'peligro',
      icono: 'trash-outline',
    });
    if (!confirmado) {
      return;
    }

    this.extraService.eliminar(extra.id).subscribe({
      next: () => this.cargarExtras(),
      error: (err) => {
        // Si ya fue usado en un pedido, mostrar mensaje y sugerir desactivar
        const mensaje = err?.error?.message || 'No se pudo eliminar el extra.';
        void this.confirm.avisar({
          titulo: 'No se puede eliminar',
          mensaje: mensaje + ' Podés desactivarlo en lugar de eliminarlo.',
          icono: 'alert-circle-outline',
        });
      },
    });
  }

  toggleExtraDisponible(extra: Extra): void {
    const payload: ExtraPayload = {
      categoria_id: extra.categoria_id,
      nombre: extra.nombre,
      precio: extra.precio,
      disponible: !extra.disponible,
      es_general: extra.es_general,
    };
    this.extraService.actualizar(extra.id, payload).subscribe({
      next: () => this.cargarExtras(),
    });
  }

  // ── Modal gestion de extras (crear general/por categoria + asignar) ──

  extrasMgrOpen = false;

  // Seccion A: crear nueva extra
  guardandoExtraNueva = false;
  extraNuevaError: string | null = null;
  extraImagenSeleccionada: File | null = null;
  extraImagenPreview: string | null = null;
  extraNombreArchivo: string | null = null;
  readonly extraNuevaForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    precio: [null, [Validators.required, Validators.min(0)]],
    es_general: [false],
    categoria_id: [null],
  });

  // Seccion B: asignar extra existente a un producto
  extraAsignarId: number | null = null;
  productoAsignarId: number | null = null;
  asignando = false;
  asignarError: string | null = null;
  detalleExtraAsignar: Extra | null = null;
  cargandoDetalleAsignar = false;

  // #6 Modal selector de productos (multi-selección) para asignarle el extra.
  pickerProductosOpen = false;
  pickerBusqueda = '';
  pickerSeleccion = new Set<number>();

  /** Extras asignables puntualmente: solo las que NO son generales. */
  get extrasAsignables(): Extra[] {
    return this.extras.filter((e) => !e.es_general);
  }

  /** Productos del selector, filtrados por el buscador del modal. */
  get productosPicker() {
    const q = this.pickerBusqueda.trim().toLowerCase();
    return this.productos.filter((p) => !q || p.nombre.toLowerCase().includes(q));
  }

  productoYaAsignado(id: number): boolean {
    return !!this.detalleExtraAsignar?.productos_asignados?.some((pa) => pa.id === id);
  }

  abrirPickerProductos(): void {
    if (!this.extraAsignarId) {
      return;
    }
    this.pickerBusqueda = '';
    this.asignarError = null;
    this.pickerSeleccion.clear();
    this.pickerProductosOpen = true;
  }

  cerrarPickerProductos(): void {
    this.pickerProductosOpen = false;
  }

  /** Marca/desmarca un producto en el picker (los ya asignados no se tocan). */
  togglePickerProducto(id: number): void {
    if (this.productoYaAsignado(id)) {
      return;
    }
    if (this.pickerSeleccion.has(id)) {
      this.pickerSeleccion.delete(id);
    } else {
      this.pickerSeleccion.add(id);
    }
  }

  // #3 Modal para elegir un producto y luego editar sus extras.
  productosExtrasOpen = false;
  productosExtrasBusqueda = '';

  // #3 Chooser de extras de UN producto (desde: botón de Gestión de extras,
  // conteo en la fila de producto, o botón "Elegir extras" del form).
  elegirExtrasOpen = false;
  elegirExtrasBusqueda = '';
  productoParaExtras: Producto | null = null;
  private productoExtrasIds = new Set<number>();

  /** Productos para el modal "Elegí el producto" (filtrados por buscador). */
  get productosParaElegir(): Producto[] {
    const q = this.productosExtrasBusqueda.trim().toLowerCase();
    return this.productos.filter((p) => !q || p.nombre.toLowerCase().includes(q));
  }

  abrirProductosParaExtras(): void {
    this.productosExtrasBusqueda = '';
    this.productosExtrasOpen = true;
  }

  cerrarProductosParaExtras(): void {
    this.productosExtrasOpen = false;
  }

  /** Elegí un producto de la lista → abrir su chooser de extras. */
  elegirProductoParaExtras(producto: Producto): void {
    this.productosExtrasOpen = false;
    this.abrirElegirExtras(producto);
  }

  /** Todas las extras disponibles (todas las categorías), filtradas por el buscador. */
  get extrasParaProducto(): Extra[] {
    const q = this.elegirExtrasBusqueda.trim().toLowerCase();
    return this.extras.filter((e) => e.disponible && (!q || e.nombre.toLowerCase().includes(q)));
  }

  /** true si la extra ya está en el producto (por categoría, general o pivote). */
  extraYaEnProducto(id: number): boolean {
    return this.productoExtrasIds.has(id);
  }

  /** true si la extra es automática del producto (general o de su categoría; no se quita). */
  extraInherente(extra: Extra): boolean {
    const catId = this.productoParaExtras?.categoria_id ?? null;
    return extra.es_general || extra.categoria_id === catId;
  }

  /** Abre el chooser de extras para un producto (o el que se está editando en el form). */
  abrirElegirExtras(producto?: Producto): void {
    this.asignarError = null;
    this.formError = null;
    this.productoParaExtras = producto ?? this.editando;
    this.productoExtrasIds = new Set((this.productoParaExtras?.extras ?? []).map((e) => e.id));
    this.elegirExtrasBusqueda = '';
    this.elegirExtrasOpen = true;
  }

  cerrarElegirExtras(): void {
    this.elegirExtrasOpen = false;
    this.productoParaExtras = null;
  }

  /** Asigna (pivote) una extra al producto activo del chooser. */
  asignarExtraAlProducto(extra: Extra): void {
    const prod = this.productoParaExtras;
    if (!prod) {
      this.formError = 'Guardá el producto primero para poder asignarle extras.';
      this.elegirExtrasOpen = false;
      return;
    }
    if (this.extraYaEnProducto(extra.id)) {
      return;
    }
    this.asignando = true;
    this.extraService.asignarAProducto(extra.id, prod.id).subscribe({
      next: () => {
        this.asignando = false;
        this.productoExtrasIds.add(extra.id);
        this.reflejarExtraEnProducto(prod, extra, true);
      },
      error: (err) => {
        this.asignando = false;
        this.asignarError = err?.error?.message || 'No se pudo asignar el extra.';
      },
    });
  }

  /** Quita (pivote) una extra del producto activo del chooser. */
  quitarExtraDelProducto(extra: Extra): void {
    const prod = this.productoParaExtras;
    if (!prod) {
      return;
    }
    this.asignando = true;
    this.extraService.desasignarDeProducto(extra.id, prod.id).subscribe({
      next: () => {
        this.asignando = false;
        this.productoExtrasIds.delete(extra.id);
        this.reflejarExtraEnProducto(prod, extra, false);
      },
      error: (err) => {
        this.asignando = false;
        this.asignarError = err?.error?.message || 'No se pudo quitar el extra.';
      },
    });
  }

  /** Mantiene sincronizado producto.extras (para el conteo en la tabla) sin recargar todo. */
  private reflejarExtraEnProducto(prod: Producto, extra: Extra, agregar: boolean): void {
    const lista = prod.extras ?? [];
    const existe = lista.some((e) => e.id === extra.id);
    if (agregar && !existe) {
      prod.extras = [...lista, { id: extra.id, nombre: extra.nombre, precio: extra.precio, imagen_url: extra.imagen_url }];
    } else if (!agregar && existe) {
      prod.extras = lista.filter((e) => e.id !== extra.id);
    }
  }

  /** Asigna el extra a TODOS los productos seleccionados (uno o más) de una vez. */
  confirmarAsignacionProductos(): void {
    if (!this.extraAsignarId || this.pickerSeleccion.size === 0) {
      return;
    }
    const extraId = this.extraAsignarId;
    const ids = [...this.pickerSeleccion];
    this.asignando = true;
    this.asignarError = null;

    forkJoin(ids.map((pid) => this.extraService.asignarAProducto(extraId, pid))).subscribe({
      next: () => {
        this.asignando = false;
        this.pickerSeleccion.clear();
        this.pickerProductosOpen = false;
        this.cargarDetalleExtraAsignar();
        this.cargarExtras();
      },
      error: (err) => {
        this.asignando = false;
        this.asignarError = err?.error?.message || 'No se pudieron asignar algunos productos.';
      },
    });
  }

  abrirExtrasMgr(): void {
    this.extraNuevaError = null;
    this.asignarError = null;
    this.limpiarExtraImagen();
    this.extraNuevaForm.reset({
      nombre: '',
      precio: null,
      es_general: false,
      categoria_id: this.categorias[0]?.id ?? null,
    });
    this.extraAsignarId = null;
    this.productoAsignarId = null;
    this.detalleExtraAsignar = null;
    this.extrasMgrOpen = true;
  }

  cerrarExtrasMgr(): void {
    this.limpiarExtraImagen();
    this.extrasMgrOpen = false;
  }

  seleccionarExtraImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    if (!archivo) {
      return;
    }
    this.extraImagenSeleccionada = archivo;
    this.extraNombreArchivo = archivo.name;
    if (this.extraImagenPreview && this.extraImagenPreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.extraImagenPreview);
    }
    this.extraImagenPreview = URL.createObjectURL(archivo);
  }

  private limpiarExtraImagen(): void {
    if (this.extraImagenPreview && this.extraImagenPreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.extraImagenPreview);
    }
    this.extraImagenSeleccionada = null;
    this.extraImagenPreview = null;
    this.extraNombreArchivo = null;
  }

  onToggleEsGeneral(): void {
    const esGeneral = this.extraNuevaForm.get('es_general')?.value;
    if (esGeneral) {
      this.extraNuevaForm.patchValue({ categoria_id: null });
    } else {
      this.extraNuevaForm.patchValue({ categoria_id: this.categorias[0]?.id ?? null });
    }
  }

  guardarExtraNueva(): void {
    const esGeneral = !!this.extraNuevaForm.get('es_general')?.value;
    const catId = this.extraNuevaForm.get('categoria_id')?.value ?? null;

    if (this.extraNuevaForm.get('nombre')?.invalid || this.extraNuevaForm.get('precio')?.invalid) {
      this.extraNuevaForm.markAllAsTouched();
      return;
    }
    if (!esGeneral && !catId) {
      this.extraNuevaError = 'Elegí una categoría o marcá el extra como general.';
      return;
    }

    this.guardandoExtraNueva = true;
    this.extraNuevaError = null;

    const payload: ExtraPayload = {
      nombre: this.extraNuevaForm.value.nombre,
      precio: this.extraNuevaForm.value.precio,
      disponible: true,
      es_general: esGeneral,
      categoria_id: esGeneral ? null : catId,
    };

    this.extraService.crear(payload, this.extraImagenSeleccionada).subscribe({
      next: () => {
        this.guardandoExtraNueva = false;
        this.extraNuevaForm.patchValue({ nombre: '', precio: null });
        this.limpiarExtraImagen();
        this.cargarExtras();
      },
      error: (err) => {
        this.guardandoExtraNueva = false;
        this.extraNuevaError = err?.error?.message || 'No se pudo crear el extra.';
      },
    });
  }

  onSeleccionExtraAsignar(): void {
    this.detalleExtraAsignar = null;
    this.asignarError = null;
    if (!this.extraAsignarId) {
      return;
    }
    this.cargarDetalleExtraAsignar();
  }

  private cargarDetalleExtraAsignar(): void {
    if (!this.extraAsignarId) {
      return;
    }
    this.cargandoDetalleAsignar = true;
    this.extraService.obtenerDetalle(this.extraAsignarId).subscribe({
      next: (detalle) => {
        this.detalleExtraAsignar = detalle;
        this.cargandoDetalleAsignar = false;
      },
      error: () => {
        this.cargandoDetalleAsignar = false;
      },
    });
  }

  asignarExtraAProducto(productoId?: number): void {
    const pid = productoId ?? this.productoAsignarId;
    if (!this.extraAsignarId || !pid) {
      return;
    }
    this.asignando = true;
    this.asignarError = null;
    this.extraService.asignarAProducto(this.extraAsignarId, pid).subscribe({
      next: () => {
        this.asignando = false;
        this.productoAsignarId = null;
        this.cargarDetalleExtraAsignar();
        this.cargarExtras();
      },
      error: (err) => {
        this.asignando = false;
        this.asignarError = err?.error?.message || 'No se pudo asignar el extra.';
      },
    });
  }

  desasignarExtraDeProducto(productoId: number): void {
    if (!this.extraAsignarId) {
      return;
    }
    this.extraService.desasignarDeProducto(this.extraAsignarId, productoId).subscribe({
      next: () => {
        this.cargarDetalleExtraAsignar();
        this.cargarExtras();
      },
      error: (err) => {
        this.asignarError = err?.error?.message || 'No se pudo desasignar el extra.';
      },
    });
  }

  // ── Modal crear categoria ──

  catModalOpen = false;
  guardandoCat = false;
  catError: string | null = null;
  readonly catForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
  });

  abrirNuevaCategoria(): void {
    this.catError = null;
    this.catForm.reset({ nombre: '' });
    this.catModalOpen = true;
  }

  cerrarCatModal(): void {
    this.catModalOpen = false;
  }

  guardarCategoria(): void {
    if (this.catForm.invalid) {
      this.catForm.markAllAsTouched();
      return;
    }

    this.guardandoCat = true;
    this.catError = null;

    this.categoriaService
      .crear({ nombre: this.catForm.value.nombre })
      .subscribe({
        next: (categoria) => {
          this.guardandoCat = false;
          // Agregar a la lista local para que el <select> del form de producto
          // y las tabs de filtro la vean sin recargar.
          this.categorias = [...this.categorias, categoria];
          this.categories = ['Todos', ...this.categorias.map((c) => c.nombre)];
          this.cerrarCatModal();
          this.notificar(`Categoría "${categoria.nombre}" creada.`, 'success');
        },
        error: (err) => {
          this.guardandoCat = false;
          this.catError = err?.error?.message || 'No se pudo crear la categoría.';
        },
      });
  }

  private async notificar(mensaje: string, color: string): Promise<void> {
    const t = await this.toast.create({ message: mensaje, duration: 2600, position: 'top', color });
    await t.present();
  }
}
