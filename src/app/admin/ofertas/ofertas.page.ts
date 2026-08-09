import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { OfertaService } from '../../core/services/oferta.service';
import { CuponService } from '../../core/services/cupon.service';
import { ProductoService } from '../../core/services/producto.service';
import { ClienteService } from '../../core/services/cliente.service';
import { Oferta, OfertaPayload, OfertaImagenOpts, AlcanceOferta } from '../../core/models/oferta.model';
import { Cupon, CuponPayload, CuponImagenOpts, AlcanceCupon } from '../../core/models/cupon.model';
import { Cliente } from '../../core/models/cliente.model';
import { ConfirmService } from '../../core/services/confirm.service';

interface ProductoOpt {
  id: number;
  nombre: string;
}

type FiltroOferta = 'todos' | 'activas' | 'por_vencer' | 'vencidas';
type FiltroCupon = 'todos' | 'activos' | 'agotados';

/** Imagen por defecto disponible en el sistema. */
interface ImagenPorDefecto {
  url: string;
  nombre: string;
}

/** Grupo de imagenes del sistema: un icono en sus variantes de color. */
interface GrupoImagenes {
  titulo: string;
  items: ImagenPorDefecto[];
}

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
  ofertaClientesSel = new Set<number>();

  // Imagen oferta
  ofertaImagenArchivo: File | null = null;
  ofertaImagenPreview: string | null = null;
  ofertaImagenNombre: string | null = null;
  ofertaImagenUrlDefault: string | null = null;

  // Modal cupon
  modalCuponOpen = false;
  editandoCupon = false;
  guardandoCupon = false;
  formCuponError: string | null = null;
  readonly formCupon: FormGroup;
  private cuponEditId: number | null = null;
  cuponClientesSel = new Set<number>();

  // Imagen cupon
  cuponImagenArchivo: File | null = null;
  cuponImagenPreview: string | null = null;
  cuponImagenNombre: string | null = null;
  cuponImagenUrlDefault: string | null = null;

  // Canje por QR (scanner)
  canjearOpen = false;
  canjeCargando = false;
  canjeError: string | null = null;
  canjeCupon: Cupon | null = null;
  canjeOferta: Oferta | null = null;

  // Detalle (imagen en modal, igual que el detalle de productos en Menu)
  detalleOfertaAbierta = false;
  ofertaDetalle: Oferta | null = null;
  detalleCuponAbierto = false;
  cuponDetalle: Cupon | null = null;

  // Imagenes del sistema para ofertas/cupones: logo Rooster + iconos (cubiertos,
  // pizza, grill, bebidas, pastas, etiqueta) en la misma secuencia de colores que
  // la vista cliente. Se eligen desde un modal; se guardan como imagen_url (ruta corta).
  private static readonly COLORES_SIS: ReadonlyArray<{ key: string; label: string }> = [
    { key: 'rojo', label: 'rojo' },
    { key: 'naranja', label: 'naranja' },
    { key: 'cafe', label: 'café' },
    { key: 'ambar', label: 'ámbar' },
    { key: 'verde', label: 'verde' },
    { key: 'teal', label: 'teal' },
    { key: 'azul', label: 'azul' },
    { key: 'morado', label: 'morado' },
    { key: 'terracota', label: 'terracota' },
  ];
  private static grupoIcono(key: string, titulo: string): GrupoImagenes {
    return {
      titulo,
      items: AdminOfertasPage.COLORES_SIS.map((c) => ({
        url: `assets/sistema/${key}-${c.key}.svg`,
        nombre: `${titulo} ${c.label}`,
      })),
    };
  }
  private static readonly ROOSTER: GrupoImagenes = {
    titulo: 'Rooster',
    items: [{ url: 'assets/logo/rooster-logo.png', nombre: 'Logo Rooster' }],
  };
  // Ofertas: iconos de comida.
  readonly imagenesOferta: GrupoImagenes[] = [
    AdminOfertasPage.ROOSTER,
    AdminOfertasPage.grupoIcono('cubiertos', 'Cubiertos'),
    AdminOfertasPage.grupoIcono('pizza', 'Pizza'),
    AdminOfertasPage.grupoIcono('grill', 'Grill'),
    AdminOfertasPage.grupoIcono('bebidas', 'Bebidas'),
    AdminOfertasPage.grupoIcono('pastas', 'Pastas'),
    AdminOfertasPage.grupoIcono('etiqueta', 'Etiqueta'),
  ];
  // Cupones: iconos de cupon / descuento.
  readonly imagenesCupon: GrupoImagenes[] = [
    AdminOfertasPage.ROOSTER,
    AdminOfertasPage.grupoIcono('etiqueta', 'Etiqueta'),
    AdminOfertasPage.grupoIcono('tarjeta', 'Tarjeta'),
    AdminOfertasPage.grupoIcono('regalo', 'Regalo'),
    AdminOfertasPage.grupoIcono('ticket', 'Ticket'),
  ];

  // Modal selector de imagen del sistema (contextual segun oferta/cupon)
  modalImagenOpen = false;
  private imagenTarget: 'oferta' | 'cupon' = 'oferta';

  // Picker de clientes especificos (contextual segun oferta/cupon).
  modalClientesOpen = false;
  private clientesTarget: 'oferta' | 'cupon' = 'oferta';
  clientes: Cliente[] = [];
  cargandoClientes = false;
  clientesCargados = false;
  busquedaCliente = '';
  ordenCliente: 'gasto' | 'pedidos' | 'nombre' = 'gasto';

  /** Grupos a mostrar en el modal segun desde donde se abrio (oferta/cupon). */
  get imagenesSistema(): GrupoImagenes[] {
    return this.imagenTarget === 'oferta' ? this.imagenesOferta : this.imagenesCupon;
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private ofertaService: OfertaService,
    private cuponService: CuponService,
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private confirm: ConfirmService,
  ) {
    this.formOferta = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: [''],
      tipo_descuento: ['porcentaje', [Validators.required]],
      valor: [null, [Validators.required, Validators.min(0)]],
      fecha_inicio: [''],
      fecha_fin: [''],
      activa: [true],
      alcance: ['todos' as AlcanceOferta],
    });
    this.formCupon = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[A-Za-z0-9]+$/)]],
      tipo: ['porcentaje', [Validators.required]],
      valor: [null, [Validators.required, Validators.min(0)]],
      monto_minimo: [null],
      fecha_inicio: [''],
      fecha_fin: [''],
      usos_max: [null],
      activo: [true],
      alcance: ['todos' as AlcanceCupon],
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

  // ── Imagen oferta ─────────────────────────────────────────────────
  seleccionarImagenOferta(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    if (!archivo) return;
    this.ofertaImagenArchivo = archivo;
    this.ofertaImagenNombre = archivo.name;
    this.ofertaImagenUrlDefault = null;
    if (this.ofertaImagenPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.ofertaImagenPreview);
    }
    this.ofertaImagenPreview = URL.createObjectURL(archivo);
  }

  seleccionarImagenOfertaDefault(img: ImagenPorDefecto): void {
    this.limpiarImagenOferta();
    this.ofertaImagenUrlDefault = img.url;
    this.ofertaImagenPreview = img.url;
    this.ofertaImagenNombre = img.nombre;
  }

  quitarImagenOferta(): void {
    this.limpiarImagenOferta();
  }

  private limpiarImagenOferta(): void {
    if (this.ofertaImagenPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.ofertaImagenPreview);
    }
    this.ofertaImagenArchivo = null;
    this.ofertaImagenPreview = null;
    this.ofertaImagenNombre = null;
    this.ofertaImagenUrlDefault = null;
  }

  // ── Imagen cupon ──────────────────────────────────────────────────
  seleccionarImagenCupon(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    if (!archivo) return;
    this.cuponImagenArchivo = archivo;
    this.cuponImagenNombre = archivo.name;
    this.cuponImagenUrlDefault = null;
    if (this.cuponImagenPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.cuponImagenPreview);
    }
    this.cuponImagenPreview = URL.createObjectURL(archivo);
  }

  seleccionarImagenCuponDefault(img: ImagenPorDefecto): void {
    this.limpiarImagenCupon();
    this.cuponImagenUrlDefault = img.url;
    this.cuponImagenPreview = img.url;
    this.cuponImagenNombre = img.nombre;
  }

  quitarImagenCupon(): void {
    this.limpiarImagenCupon();
  }

  private limpiarImagenCupon(): void {
    if (this.cuponImagenPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.cuponImagenPreview);
    }
    this.cuponImagenArchivo = null;
    this.cuponImagenPreview = null;
    this.cuponImagenNombre = null;
    this.cuponImagenUrlDefault = null;
  }

  // ── Modal selector de imagen del sistema (compartido) ─────────────
  abrirPickerImagen(target: 'oferta' | 'cupon'): void {
    this.imagenTarget = target;
    this.modalImagenOpen = true;
  }

  cerrarPickerImagen(): void {
    this.modalImagenOpen = false;
  }

  /** URL de la imagen del sistema activa segun el formulario en curso (para resaltar el tile). */
  get imagenSistemaActivaUrl(): string | null {
    return this.imagenTarget === 'oferta' ? this.ofertaImagenUrlDefault : this.cuponImagenUrlDefault;
  }

  seleccionarImagenSistema(img: ImagenPorDefecto): void {
    if (this.imagenTarget === 'oferta') {
      this.seleccionarImagenOfertaDefault(img);
    } else {
      this.seleccionarImagenCuponDefault(img);
    }
    this.modalImagenOpen = false;
  }

  // ── Picker de clientes especificos (compartido oferta/cupon) ──────
  abrirPickerClientes(target: 'oferta' | 'cupon'): void {
    this.clientesTarget = target;
    this.modalClientesOpen = true;
    if (!this.clientesCargados) {
      this.cargarClientes();
    }
  }

  cerrarPickerClientes(): void {
    this.modalClientesOpen = false;
  }

  private cargarClientes(): void {
    this.cargandoClientes = true;
    this.clienteService.listarConEstadisticas().subscribe({
      next: (data) => {
        this.clientes = data;
        this.clientesCargados = true;
        this.cargandoClientes = false;
      },
      error: () => {
        this.cargandoClientes = false;
      },
    });
  }

  /** Set de seleccion activo segun desde donde se abrio el picker (oferta/cupon). */
  private get clientesSelActivo(): Set<number> {
    return this.clientesTarget === 'oferta' ? this.ofertaClientesSel : this.cuponClientesSel;
  }

  isClienteSelected(id: number): boolean {
    return this.clientesSelActivo.has(id);
  }

  toggleCliente(id: number): void {
    const sel = this.clientesSelActivo;
    if (sel.has(id)) {
      sel.delete(id);
    } else {
      sel.add(id);
    }
  }

  get cantidadClientesSel(): number {
    return this.clientesTarget === 'oferta' ? this.ofertaClientesSel.size : this.cuponClientesSel.size;
  }

  /** Lista visible en el picker: busqueda por nombre/email + orden elegido. */
  get clientesFiltrados(): Cliente[] {
    const texto = this.busquedaCliente.trim().toLowerCase();
    const lista = this.clientes.filter(
      (c) => !texto || c.nombre.toLowerCase().includes(texto) || c.email.toLowerCase().includes(texto),
    );
    const copia = [...lista];
    if (this.ordenCliente === 'gasto') {
      copia.sort((a, b) => b.total_gastado - a.total_gastado);
    } else if (this.ordenCliente === 'pedidos') {
      copia.sort((a, b) => b.cantidad_pedidos - a.cantidad_pedidos);
    } else {
      copia.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    return copia;
  }

  setOrdenCliente(orden: 'gasto' | 'pedidos' | 'nombre'): void {
    this.ordenCliente = orden;
  }

  // ── Modal oferta ──────────────────────────────────────────────────
  abrirNuevaOferta(): void {
    this.editandoOferta = false;
    this.ofertaEditId = null;
    this.formOfertaError = null;
    this.productosSel.clear();
    this.ofertaClientesSel.clear();
    this.limpiarImagenOferta();
    this.formOferta.reset({ tipo_descuento: 'porcentaje', activa: true, alcance: 'todos' });
    this.modalOfertaOpen = true;
  }

  abrirEditarOferta(o: Oferta): void {
    this.editandoOferta = true;
    this.ofertaEditId = o.id;
    this.formOfertaError = null;
    this.productosSel = new Set((o.productos ?? []).map((p) => p.id));
    this.ofertaClientesSel = new Set((o.clientes ?? []).map((c) => c.id));
    this.limpiarImagenOferta();
    // Precargar imagen existente
    if (o.imagen_url) {
      this.ofertaImagenPreview = o.imagen_url;
      // No es archivo ni default nuevo, solo preview
    }
    this.formOferta.reset({
      nombre: o.nombre,
      descripcion: o.descripcion ?? '',
      tipo_descuento: o.tipo_descuento,
      valor: o.valor,
      fecha_inicio: o.fecha_inicio ?? '',
      fecha_fin: o.fecha_fin ?? '',
      activa: o.activa,
      alcance: o.alcance,
    });
    this.modalOfertaOpen = true;
  }

  cerrarModalOferta(): void {
    this.modalOfertaOpen = false;
    this.modalImagenOpen = false;
    this.modalClientesOpen = false;
    this.limpiarImagenOferta();
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
      this.formOfertaError = 'Revisa los campos obligatorios.';
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
      alcance: v.alcance,
      cliente_ids: v.alcance === 'especifico' ? Array.from(this.ofertaClientesSel) : [],
    };

    const imagenOpts: OfertaImagenOpts = {
      imagen: this.ofertaImagenArchivo,
      imagen_url: this.ofertaImagenUrlDefault,
    };

    this.guardandoOferta = true;
    this.formOfertaError = null;
    const req =
      this.editandoOferta && this.ofertaEditId !== null
        ? this.ofertaService.actualizar(this.ofertaEditId, payload, imagenOpts)
        : this.ofertaService.crear(payload, imagenOpts);

    req.subscribe({
      next: () => {
        this.guardandoOferta = false;
        this.modalOfertaOpen = false;
        this.limpiarImagenOferta();
        this.cargarOfertas();
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoOferta = false;
        this.formOfertaError = this.primerError(err);
      },
    });
  }

  async eliminarOferta(o: Oferta): Promise<void> {
    const confirmado = await this.confirm.preguntar({
      titulo: '¿Eliminar oferta?',
      mensaje: `"${o.nombre}" dejará de estar disponible para los clientes. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      tono: 'peligro',
      icono: 'trash-outline',
    });
    if (!confirmado) {
      return;
    }
    this.ofertaService.eliminar(o.id).subscribe({ next: () => this.cargarOfertas() });
  }

  // ── Modal cupon ───────────────────────────────────────────────────
  abrirNuevoCupon(): void {
    this.editandoCupon = false;
    this.cuponEditId = null;
    this.formCuponError = null;
    this.cuponClientesSel.clear();
    this.limpiarImagenCupon();
    this.formCupon.reset({ tipo: 'porcentaje', activo: true, alcance: 'todos' });
    this.modalCuponOpen = true;
  }

  abrirEditarCupon(c: Cupon): void {
    this.editandoCupon = true;
    this.cuponEditId = c.id;
    this.formCuponError = null;
    this.cuponClientesSel = new Set((c.clientes ?? []).map((cl) => cl.id));
    this.limpiarImagenCupon();
    // Precargar imagen existente
    if (c.imagen_url) {
      this.cuponImagenPreview = c.imagen_url;
    }
    this.formCupon.reset({
      codigo: c.codigo,
      tipo: c.tipo,
      valor: c.valor,
      monto_minimo: c.monto_minimo,
      fecha_inicio: c.fecha_inicio ?? '',
      fecha_fin: c.fecha_fin ?? '',
      usos_max: c.usos_max,
      activo: c.activo,
      alcance: c.alcance,
    });
    this.modalCuponOpen = true;
  }

  cerrarModalCupon(): void {
    this.modalCuponOpen = false;
    this.modalImagenOpen = false;
    this.modalClientesOpen = false;
    this.limpiarImagenCupon();
  }

  guardarCupon(): void {
    if (this.formCupon.invalid) {
      this.formCupon.markAllAsTouched();
      this.formCuponError = 'Revisa los campos obligatorios.';
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
      alcance: v.alcance,
      cliente_ids: v.alcance === 'especifico' ? Array.from(this.cuponClientesSel) : [],
    };

    const imagenOpts: CuponImagenOpts = {
      imagen: this.cuponImagenArchivo,
      imagen_url: this.cuponImagenUrlDefault,
    };

    this.guardandoCupon = true;
    this.formCuponError = null;
    const req =
      this.editandoCupon && this.cuponEditId !== null
        ? this.cuponService.actualizar(this.cuponEditId, payload, imagenOpts)
        : this.cuponService.crear(payload, imagenOpts);

    req.subscribe({
      next: () => {
        this.guardandoCupon = false;
        this.modalCuponOpen = false;
        this.limpiarImagenCupon();
        this.cargarCupones();
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoCupon = false;
        this.formCuponError = this.primerError(err);
      },
    });
  }

  async eliminarCupon(c: Cupon): Promise<void> {
    const confirmado = await this.confirm.preguntar({
      titulo: '¿Eliminar cupón?',
      mensaje: `El cupón "${c.codigo}" dejará de poder canjearse. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      tono: 'peligro',
      icono: 'trash-outline',
    });
    if (!confirmado) {
      return;
    }
    this.cuponService.eliminar(c.id).subscribe({ next: () => this.cargarCupones() });
  }

  // ── Detalle (click en la fila abre modal con la imagen en grande) ──
  abrirDetalleOferta(o: Oferta): void {
    this.ofertaDetalle = o;
    this.detalleOfertaAbierta = true;
  }

  cerrarDetalleOferta(): void {
    this.detalleOfertaAbierta = false;
    this.ofertaDetalle = null;
  }

  editarDesdeDetalleOferta(): void {
    const o = this.ofertaDetalle;
    this.cerrarDetalleOferta();
    if (o) this.abrirEditarOferta(o);
  }

  abrirDetalleCupon(c: Cupon): void {
    this.cuponDetalle = c;
    this.detalleCuponAbierto = true;
  }

  cerrarDetalleCupon(): void {
    this.detalleCuponAbierto = false;
    this.cuponDetalle = null;
  }

  editarDesdeDetalleCupon(): void {
    const c = this.cuponDetalle;
    this.cerrarDetalleCupon();
    if (c) this.abrirEditarCupon(c);
  }

  // ── Canje por QR ──────────────────────────────────────────────────
  abrirCanjear(): void {
    this.canjeError = null;
    this.canjeCupon = null;
    this.canjeOferta = null;
    this.canjearOpen = true;
  }

  cerrarCanjear(): void {
    this.canjearOpen = false;
  }

  /** Se dispara al decodificar el QR (o al tipear el codigo manualmente en el scanner). */
  onCodigoDecodificado(valor: string): void {
    this.canjeError = null;
    this.canjeCupon = null;
    this.canjeOferta = null;

    if (valor.startsWith('ROOSTER-CUPON:')) {
      this.validarCuponEscaneado(valor.substring('ROOSTER-CUPON:'.length));
      return;
    }

    if (valor.startsWith('ROOSTER-OFERTA:')) {
      this.validarOfertaEscaneada(Number(valor.substring('ROOSTER-OFERTA:'.length)));
      return;
    }

    // Codigo corto de oferta mostrado al cliente (ej. "OF-0003").
    const matchOferta = valor.trim().match(/^OF-0*(\d+)$/i);
    if (matchOferta) {
      this.validarOfertaEscaneada(Number(matchOferta[1]));
      return;
    }

    // Codigo corto de cupon mostrado al cliente (ej. "CU-0005") — ya no se muestra/codifica el nombre del cupon.
    const matchCupon = valor.trim().match(/^CU-0*(\d+)$/i);
    if (matchCupon) {
      this.validarCuponEscaneadoPorId(Number(matchCupon[1]));
      return;
    }

    // Fallback: si escanean/tipean el codigo "pelado" (sin prefijo), asumimos que es el codigo real del cupon.
    this.validarCuponEscaneado(valor.trim());
  }

  private validarCuponEscaneado(codigo: string): void {
    this.canjeCargando = true;
    this.cuponService.validar(codigo).subscribe({
      next: (res) => {
        this.canjeCupon = res.data;
        this.canjeCargando = false;
      },
      error: (err: HttpErrorResponse) => {
        this.canjeError = this.primerError(err);
        this.canjeCargando = false;
      },
    });
  }

  /** El codigo corto ("CU-0005") solo identifica el cupon por id — se resuelve a su codigo real y se valida igual. */
  private validarCuponEscaneadoPorId(id: number): void {
    const cupon = this.cupones.find((c) => c.id === id) ?? null;
    if (!cupon) {
      this.canjeError = 'Este cupon no existe.';
      return;
    }
    this.validarCuponEscaneado(cupon.codigo);
  }

  private validarOfertaEscaneada(id: number): void {
    this.canjeCargando = true;
    this.ofertaService.listarTodos().subscribe({
      next: (ofertas) => {
        const oferta = ofertas.find((o) => o.id === id) ?? null;
        this.canjeOferta = oferta;
        this.canjeError = oferta ? null : 'Esta oferta ya no existe.';
        this.canjeCargando = false;
      },
      error: () => {
        this.canjeError = 'No se pudo validar la oferta.';
        this.canjeCargando = false;
      },
    });
  }

  get canjeOfertaProductosTexto(): string {
    const nombres = this.canjeOferta?.productos.map((p) => p.nombre) ?? [];
    return nombres.length > 0 ? nombres.join(', ') : 'todos los productos';
  }

  /** Arma el pedido de mostrador con el cupon ya validado. */
  irAPedidoDeMostrador(): void {
    if (!this.canjeCupon) {
      return;
    }
    void this.router.navigate(['/admin/pedidos-mostrador'], { queryParams: { cupon: this.canjeCupon.codigo } });
  }

  /** Arma el pedido de mostrador con la oferta ya validada. */
  irAPedidoDeMostradorOferta(): void {
    if (!this.canjeOferta) {
      return;
    }
    void this.router.navigate(['/admin/pedidos-mostrador'], { queryParams: { oferta: this.canjeOferta.id } });
  }

  // ── Formateo / helpers de vista ───────────────────────────────────
  formatValorOferta(o: Oferta): string {
    return o.tipo_descuento === 'porcentaje' ? `${o.valor}% de descuento` : `${this.num(o.valor)} precio fijo`;
  }
  formatTipoDescuento(tipo: string): string {
    return tipo === 'porcentaje' ? '% descuento' : 'Precio fijo';
  }
  formatTipoCupon(tipo: string): string {
    return tipo === 'porcentaje' ? 'Porcentaje' : 'Monto fijo';
  }
  formatValorCupon(c: Cupon): string {
    return c.tipo === 'porcentaje' ? `${c.valor}%` : `${this.num(c.valor)}`;
  }
  formatMontoMinimo(monto: number | null): string {
    return monto === null ? 'Sin minimo' : `${this.num(monto)}`;
  }
  formatUsosLabel(c: Cupon): string {
    return c.usos_max === null ? `${c.usos_actuales} / infinito` : `${c.usos_actuales} / ${c.usos_max}`;
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
    return err.error?.message ?? 'Ocurrio un error.';
  }
}
