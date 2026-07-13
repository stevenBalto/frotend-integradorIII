import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Categoria, Producto } from '../../core/models/producto.model';
import { CategoriaService } from '../../core/services/categoria.service';
import { ProductoService } from '../../core/services/producto.service';

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

  readonly form: FormGroup = this.fb.group({
    categoria_id: [null, [Validators.required]],
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: [''],
    precio_base: [null, [Validators.required, Validators.min(0)]],
    destacado: [false],
    disponible: [true],
  });

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
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
    const payload = this.form.value;

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
        this.formError = 'No se pudo guardar el producto. Revisá los datos e intentá de nuevo.';
      },
    });
  }

  eliminar(producto: Producto): void {
    const confirmado = window.confirm(`¿Eliminar "${producto.nombre}" del catálogo?`);
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
}
