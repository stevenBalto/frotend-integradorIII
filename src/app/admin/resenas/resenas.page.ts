import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AlertController, ToastController } from '@ionic/angular';
import { ResenaService } from '../../core/services/resena.service';
import { ResenaAdmin } from '../../core/models/resena.model';

type FiltroEstado = 'todas' | 'publicada' | 'oculta';
type FiltroTipo = 'todas' | 'general' | 'producto';

/** Gestión de reseñas del admin: listado, filtros, stats y moderación (conectado a API real). */
@Component({
  selector: 'app-admin-resenas',
  templateUrl: './resenas.page.html',
  styleUrls: ['./resenas.page.scss'],
  standalone: false,
})
export class AdminResenasPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  readonly stars = [1, 2, 3, 4, 5];

  resenas: ResenaAdmin[] = [];
  cargando = true;
  error: string | null = null;
  accionandoId: number | null = null;

  // Filtros
  filtroEstrella = 0; // 0 = todas
  filtroEstado: FiltroEstado = 'todas';
  filtroTipo: FiltroTipo = 'todas';
  filtroProductoId: number | 'todas' = 'todas';
  busqueda = '';
  desde = '';
  hasta = '';
  // Caching helpers to avoid returning new arrays on every CD cycle
  private _resenasCacheKey = '';
  private _resenasFiltradasCache: ResenaAdmin[] = [];
  // Derived caches
  private _baseResenasKey = '';
  private _publicadasCache: ResenaAdmin[] = [];
  private _distribucionCache: { estrella: number; cantidad: number }[] = [];
  private _productosCache: { id: number; nombre: string }[] = [];
  private _promedioCache: number | null = null;

  constructor(
    private resenaService: ResenaService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.cargando = true;
    this.error = null;
    this.resenaService.listarAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.resenas = r;
          // clear derived caches when new data arrives
          this._resenasCacheKey = '';
          this._resenasFiltradasCache = [];
          this._baseResenasKey = this.resenas.map((x) => x.id).join(',');
          this._publicadasCache = [];
          this._distribucionCache = [];
          this._productosCache = [];
          this._promedioCache = null;
          this.cargando = false;
        },
        error: () => {
          this.error = 'No se pudieron cargar las reseñas.';
          this.cargando = false;
        },
      });
  }

  // ── Derivados / KPIs ──

  private get publicadas(): ResenaAdmin[] {
    const key = this._baseResenasKey;
    if (key === this._baseResenasKey && this._publicadasCache.length > 0) {
      return this._publicadasCache;
    }
    this._publicadasCache = this.resenas.filter((r) => r.estado === 'publicada');
    return this._publicadasCache;
  }

  get total(): number {
    return this.resenas.length;
  }

  get promedioGeneral(): number {
    if (this._promedioCache !== null) return this._promedioCache;
    const pub = this.publicadas;
    if (pub.length === 0) {
      this._promedioCache = 0;
      return 0;
    }
    this._promedioCache = Math.round((pub.reduce((s, r) => s + r.calificacion, 0) / pub.length) * 10) / 10;
    return this._promedioCache;
  }

  get ocultasCount(): number {
    return this.resenas.filter((r) => r.estado === 'oculta').length;
  }

  /** Distribución 1..5 sobre las reseñas publicadas (lo que ven los clientes). */
  get distribucion(): { estrella: number; cantidad: number }[] {
    if (this._distribucionCache.length > 0) return this._distribucionCache;
    const pub = this.publicadas;
    this._distribucionCache = [5, 4, 3, 2, 1].map((estrella) => ({
      estrella,
      cantidad: pub.filter((r) => r.calificacion === estrella).length,
    }));
    return this._distribucionCache;
  }

  get maxDistribucion(): number {
    return Math.max(1, ...this.distribucion.map((d) => d.cantidad));
  }

  /** Productos presentes en las reseñas (para el filtro por producto). */
  get productos(): { id: number; nombre: string }[] {
    if (this._productosCache.length > 0) return this._productosCache;
    const map = new Map<number, string>();
    this.resenas.forEach((r) => {
      if (r.producto) map.set(r.producto.id, r.producto.nombre);
    });
    this._productosCache = [...map.entries()].map(([id, nombre]) => ({ id, nombre }));
    return this._productosCache;
  }

  // ── Filtrado (en memoria) ──

  get resenasFiltradas(): ResenaAdmin[] {
    const q = this.busqueda.trim().toLowerCase();
    const key = `${this.resenas.map((x) => x.id).join(',')}|${this.filtroEstrella}|${this.filtroEstado}|${this.filtroTipo}|${this.filtroProductoId}|${q}|${this.desde}|${this.hasta}`;
    if (key === this._resenasCacheKey) {
      return this._resenasFiltradasCache;
    }

    const result = this.resenas.filter((r) => {
      if (this.filtroEstrella !== 0 && r.calificacion !== this.filtroEstrella) return false;
      if (this.filtroEstado !== 'todas' && r.estado !== this.filtroEstado) return false;
      if (this.filtroTipo !== 'todas' && r.tipo !== this.filtroTipo) return false;
      if (this.filtroProductoId !== 'todas' && r.producto?.id !== this.filtroProductoId) return false;
      if (q) {
        const c = `${r.cliente?.nombre ?? ''} ${r.cliente?.email ?? ''}`.toLowerCase();
        if (!c.includes(q)) return false;
      }
      if (this.desde && (!r.created_at || r.created_at.slice(0, 10) < this.desde)) return false;
      if (this.hasta && (!r.created_at || r.created_at.slice(0, 10) > this.hasta)) return false;
      return true;
    });

    this._resenasCacheKey = key;
    this._resenasFiltradasCache = result;
    return result;
  }

  hayFiltros(): boolean {
    return this.filtroEstrella !== 0 || this.filtroEstado !== 'todas' || this.filtroTipo !== 'todas'
      || this.filtroProductoId !== 'todas' || this.busqueda.trim() !== '' || this.desde !== '' || this.hasta !== '';
  }

  limpiarFiltros(): void {
    this.filtroEstrella = 0;
    this.filtroEstado = 'todas';
    this.filtroTipo = 'todas';
    this.filtroProductoId = 'todas';
    this.busqueda = '';
    this.desde = '';
    this.hasta = '';
  }

  // ── Acciones ──

  toggleVisibilidad(r: ResenaAdmin): void {
    this.accionandoId = r.id;
    const req = r.estado === 'oculta'
      ? this.resenaService.mostrar(r.id)
      : this.resenaService.ocultar(r.id);
    req.pipe(takeUntil(this.destroy$)).subscribe({
      next: (actualizada) => {
        r.estado = actualizada.estado;
        r.oculta = actualizada.oculta;
        this.accionandoId = null;
        void this.toast(r.estado === 'oculta' ? 'Reseña ocultada' : 'Reseña visible');
      },
      error: () => {
        this.accionandoId = null;
        void this.toast('No se pudo cambiar la visibilidad', true);
      },
    });
  }

  async eliminar(r: ResenaAdmin): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar reseña',
      message: '¿Seguro que querés eliminar esta reseña? No se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.accionandoId = r.id;
            this.resenaService.eliminar(r.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.resenas = this.resenas.filter((x) => x.id !== r.id);
                  this.accionandoId = null;
                  void this.toast('Reseña eliminada');
                },
                error: () => {
                  this.accionandoId = null;
                  void this.toast('No se pudo eliminar', true);
                },
              });
          },
        },
      ],
    });
    await alert.present();
  }

  // ── Helpers UI ──

  iniciales(nombre?: string | null): string {
    return (nombre?.trim()?.[0] ?? '?').toUpperCase();
  }

  fecha(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private async toast(msg: string, error = false): Promise<void> {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2200,
      position: 'top',
      color: error ? 'danger' : 'dark',
    });
    await t.present();
  }

  // trackBy for *ngFor
  trackByResena(index: number, item: ResenaAdmin): number {
    return item.id;
  }
}
