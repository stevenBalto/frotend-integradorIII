import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertController, ToastController } from '@ionic/angular';
import { UsuarioAdminService } from '../../core/services/usuario-admin.service';
import { AdminUser, ModuloOpt, RolOpt } from '../../core/models/admin-user.model';

interface FilterOpt {
  id: string;
  label: string;
}

/** Usuarios y roles del panel admin — CRUD real, aislado por instancia. */
@Component({
  selector: 'app-admin-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: false,
})
export class AdminUsuariosPage implements OnInit {
  usuarios: AdminUser[] = [];
  roles: RolOpt[] = [];
  modulos: ModuloOpt[] = [];
  cargando = false;

  // KPIs (se recalculan al cargar la lista)
  totalUsuarios = 0;
  totalAdmins = 0;
  totalClientes = 0;

  activeFilter = 'todos';
  readonly filters: FilterOpt[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'admin', label: 'Administradores' },
    { id: 'cliente', label: 'Clientes' },
  ];

  // Modal crear/editar
  showModal = false;
  editandoId: number | null = null;
  guardando = false;
  showPassword = false;
  readonly form: FormGroup;
  modulosSel = new Set<number>();

  constructor(
    private fb: FormBuilder,
    private service: UsuarioAdminService,
    private toast: ToastController,
    private alert: AlertController,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      usuario: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      password: [''],
      role_id: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.cargar();
    this.cargarOpciones();
  }

  // ── Carga de datos ────────────────────────────────────────────────
  cargar(): void {
    this.cargando = true;
    this.service.listar().subscribe({
      next: (res) => {
        this.usuarios = res.data;
        this.recalcularKpis();
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        void this.notificar('No se pudo cargar la lista de usuarios.', 'danger');
      },
    });
  }

  cargarOpciones(): void {
    this.service.opciones().subscribe({
      next: (res) => {
        this.roles = res.roles;
        this.modulos = res.modulos;
      },
    });
  }

  // ── Filtros y KPIs ────────────────────────────────────────────────
  get usuariosFiltrados(): AdminUser[] {
    if (this.activeFilter === 'admin') {
      return this.usuarios.filter((u) => u.rol !== 'cliente');
    }
    if (this.activeFilter === 'cliente') {
      return this.usuarios.filter((u) => u.rol === 'cliente');
    }
    return this.usuarios;
  }

  private recalcularKpis(): void {
    this.totalUsuarios = this.usuarios.length;
    this.totalAdmins = this.usuarios.filter((u) => u.rol !== 'cliente').length;
    this.totalClientes = this.usuarios.filter((u) => u.rol === 'cliente').length;
  }

  /** El rol elegido en el modal es de staff (admin_sede) → muestra módulos. */
  get rolEsAdmin(): boolean {
    const rol = this.roles.find((r) => r.id === this.form.value.role_id);
    return rol?.nombre === 'admin_sede';
  }

  etiquetaRol(nombre: string): string {
    if (nombre === 'admin_sede') return 'Administrador';
    if (nombre === 'super_admin') return 'Administrador';
    if (nombre === 'cliente') return 'Cliente';
    return nombre;
  }

  // ── Modal ─────────────────────────────────────────────────────────
  abrirCrear(): void {
    this.editandoId = null;
    this.form.reset({ telefono: '', role_id: null });
    this.form.patchValue({ password: this.generarPassword() });
    this.modulosSel.clear();
    this.showPassword = false;
    this.showModal = true;
  }

  abrirEditar(u: AdminUser): void {
    this.editandoId = u.id;
    this.form.reset({
      nombre: u.nombre,
      usuario: u.usuario ?? '',
      email: u.email,
      telefono: u.telefono ?? '',
      password: '',
      role_id: u.role_id,
    });
    this.modulosSel = new Set(u.modulos);
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
  }

  regenerarPassword(): void {
    this.form.patchValue({ password: this.generarPassword() });
    this.showPassword = true;
  }

  toggleModulo(id: number): void {
    if (this.modulosSel.has(id)) {
      this.modulosSel.delete(id);
    } else {
      this.modulosSel.add(id);
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.notificar('Completá los campos obligatorios.', 'warning');
      return;
    }

    const v = this.form.getRawValue();
    const modulos = this.rolEsAdmin ? Array.from(this.modulosSel) : [];
    this.guardando = true;

    if (this.editandoId === null) {
      // Crear
      this.service
        .crear({
          nombre: v.nombre,
          usuario: v.usuario,
          email: v.email,
          telefono: v.telefono || null,
          password: v.password,
          role_id: v.role_id,
          modulos,
        })
        .subscribe({
          next: () => this.trasGuardar('Usuario creado. Contraseña temporal entregada.'),
          error: (err) => this.errorGuardar(err),
        });
    } else {
      // Editar
      this.service
        .actualizar(this.editandoId, {
          nombre: v.nombre,
          usuario: v.usuario,
          email: v.email,
          telefono: v.telefono || null,
          role_id: v.role_id,
          modulos,
        })
        .subscribe({
          next: () => this.trasGuardar('Usuario actualizado.'),
          error: (err) => this.errorGuardar(err),
        });
    }
  }

  async eliminar(u: AdminUser): Promise<void> {
    const a = await this.alert.create({
      header: 'Eliminar usuario',
      message: `¿Eliminar a "${u.nombre}"? Esta acción se puede revertir en la base (soft delete).`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.service.eliminar(u.id).subscribe({
              next: () => {
                void this.notificar('Usuario eliminado.', 'success');
                this.cargar();
              },
              error: (err: HttpErrorResponse) =>
                void this.notificar(this.primerError(err), 'danger'),
            });
          },
        },
      ],
    });
    await a.present();
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private trasGuardar(msg: string): void {
    this.guardando = false;
    this.showModal = false;
    void this.notificar(msg, 'success');
    this.cargar();
  }

  private errorGuardar(err: HttpErrorResponse): void {
    this.guardando = false;
    void this.notificar(this.primerError(err), 'danger');
  }

  private primerError(err: HttpErrorResponse): string {
    const errores = err.error?.errors;
    if (errores) {
      const primero = Object.values(errores)[0];
      if (Array.isArray(primero)) return primero[0] as string;
    }
    return err.error?.message ?? 'Ocurrió un error.';
  }

  /** Genera una contraseña temporal fuerte (12+, mayús/minús/número/símbolo). */
  private generarPassword(): string {
    const may = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const min = 'abcdefghijkmnpqrstuvwxyz';
    const num = '23456789';
    const sim = '#$%&*!?@';
    const todos = may + min + num + sim;
    const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
    let pass = pick(may) + pick(min) + pick(num) + pick(sim);
    for (let i = 0; i < 10; i++) pass += pick(todos);
    return pass
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  private async notificar(mensaje: string, color: string): Promise<void> {
    const t = await this.toast.create({ message: mensaje, duration: 2600, position: 'top', color });
    await t.present();
  }
}
