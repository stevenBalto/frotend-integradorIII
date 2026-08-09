import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertController, ToastController } from '@ionic/angular';
import { UsuarioAdminService } from '../../core/services/usuario-admin.service';
import { AdminUser, ModuloOpt, RolOpt } from '../../core/models/admin-user.model';

/** Usuarios y roles del panel admin - CRUD real, aislado por instancia. */
@Component({
  selector: 'app-admin-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: false,
})
export class AdminUsuariosPage implements OnInit {
  usuarios: AdminUser[] = [];
  usuariosFiltrados: AdminUser[] = [];
  roles: RolOpt[] = [];
  modulos: ModuloOpt[] = [];
  cargando = false;
  busqueda = '';

  // Modal crear/editar
  showModal = false;
  editandoId: number | null = null;
  guardando = false;
  showPassword = false;
  readonly form: FormGroup;

  // Item 16: Map de modulos seleccionados con su nivel de permiso
  modulosSel = new Map<number, 'lectura' | 'editor'>();
  showModulosModal = false;

  // Item 19: opciones de expiracion de password
  readonly opcionesExpiracion = [
    { value: 15, label: '15 dias' },
    { value: 30, label: '30 dias' },
    { value: 60, label: '60 dias' },
  ];

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
      dias_expiracion_password: [30, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.cargar();
    this.cargarOpciones();
  }

  // -- Carga de datos --
  cargar(): void {
    this.cargando = true;
    this.service.listar().subscribe({
      next: (res) => {
        this.usuarios = res.data;
        this.aplicarFiltro();
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

  // -- Busqueda --
  onBuscar(valor: string): void {
    this.busqueda = valor.toLowerCase().trim();
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    if (!this.busqueda) {
      this.usuariosFiltrados = [...this.usuarios];
    } else {
      this.usuariosFiltrados = this.usuarios.filter(
        (u) =>
          u.nombre.toLowerCase().includes(this.busqueda) ||
          (u.usuario?.toLowerCase() || '').includes(this.busqueda) ||
          u.email.toLowerCase().includes(this.busqueda)
      );
    }
  }

  get totalUsuarios(): number {
    return this.usuarios.length;
  }

  // -- ID del rol admin_sede (se setea automaticamente) --
  private get roleIdAdminSede(): number | null {
    const rol = this.roles.find((r) => r.nombre === 'admin_sede');
    return rol?.id ?? null;
  }

  // -- Modal crear/editar --
  abrirCrear(): void {
    this.editandoId = null;
    this.form.reset({
      telefono: '',
      dias_expiracion_password: 30,
    });
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
      dias_expiracion_password: u.dias_expiracion_password || 30,
    });
    // Cargar modulos desde el usuario (ahora es array de objetos con permiso)
    this.modulosSel.clear();
    for (const m of u.modulos) {
      this.modulosSel.set(m.id, m.permiso);
    }
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
  }

  regenerarPassword(): void {
    this.form.patchValue({ password: this.generarPassword() });
    this.showPassword = true;
  }

  // -- Modal de modulos y permisos --
  abrirModulosModal(): void {
    this.showModulosModal = true;
  }

  cerrarModulosModal(): void {
    this.showModulosModal = false;
  }

  toggleModulo(id: number): void {
    if (this.modulosSel.has(id)) {
      this.modulosSel.delete(id);
    } else {
      this.modulosSel.set(id, 'lectura'); // Default: lectura
    }
  }

  setPermisoModulo(id: number, permiso: 'lectura' | 'editor'): void {
    if (this.modulosSel.has(id)) {
      this.modulosSel.set(id, permiso);
    }
  }

  get modulosSelCount(): number {
    return this.modulosSel.size;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.notificar('Completa los campos obligatorios.', 'warning');
      return;
    }

    const v = this.form.getRawValue();
    const modulos = Array.from(this.modulosSel.entries()).map(([id, permiso]) => ({
      modulo_id: id,
      permiso,
    }));
    const roleId = this.roleIdAdminSede;

    if (roleId === null) {
      void this.notificar('No se encontro el rol admin_sede.', 'danger');
      return;
    }

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
          role_id: roleId,
          dias_expiracion_password: v.dias_expiracion_password,
          modulos,
        })
        .subscribe({
          next: () => this.trasGuardar('Usuario creado correctamente.'),
          error: (err) => this.errorGuardar(err),
        });
    } else {
      // Editar (nunca envia password)
      this.service
        .actualizar(this.editandoId, {
          nombre: v.nombre,
          usuario: v.usuario,
          email: v.email,
          telefono: v.telefono || null,
          role_id: roleId,
          dias_expiracion_password: v.dias_expiracion_password,
          modulos,
        })
        .subscribe({
          next: () => this.trasGuardar('Usuario actualizado.'),
          error: (err) => this.errorGuardar(err),
        });
    }
  }

  // -- Item 20: Deshabilitar/habilitar cuenta --
  async toggleEstado(u: AdminUser): Promise<void> {
    const nuevoEstado = !u.activo;
    const accion = nuevoEstado ? 'habilitar' : 'deshabilitar';

    const a = await this.alert.create({
      header: nuevoEstado ? 'Habilitar usuario' : 'Deshabilitar usuario',
      message: `¿Deseas ${accion} a "${u.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: nuevoEstado ? 'Habilitar' : 'Deshabilitar',
          role: nuevoEstado ? 'confirm' : 'destructive',
          handler: () => {
            this.service.cambiarEstado(u.id, nuevoEstado).subscribe({
              next: (res) => {
                // Actualizar el usuario en la lista
                const idx = this.usuarios.findIndex((x) => x.id === u.id);
                if (idx !== -1) {
                  this.usuarios[idx] = res.data;
                  this.aplicarFiltro();
                }
                void this.notificar(
                  nuevoEstado ? 'Usuario habilitado.' : 'Usuario deshabilitado.',
                  'success'
                );
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

  async eliminar(u: AdminUser): Promise<void> {
    const a = await this.alert.create({
      header: 'Eliminar usuario',
      message: `¿Eliminar a "${u.nombre}"? Esta accion se puede revertir en la base (soft delete).`,
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

  // -- Helpers --
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
    return err.error?.message ?? 'Ocurrio un error.';
  }

  /** Genera una contrasena fuerte (12+, mayus/minus/numero/simbolo). */
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
