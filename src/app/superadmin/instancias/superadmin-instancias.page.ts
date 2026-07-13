import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertController, ToastController } from '@ionic/angular';
import { InstanciaService } from '../../core/services/instancia.service';
import { SuperAdminAuthService } from '../../core/services/superadmin-auth.service';
import { CredencialesTemporales, Instancia } from '../../core/models/instancia.model';

@Component({
  selector: 'app-superadmin-instancias',
  templateUrl: './superadmin-instancias.page.html',
  styleUrls: ['./superadmin-instancias.page.scss'],
  standalone: false,
})
export class SuperadminInstanciasPage implements OnInit {
  instancias: Instancia[] = [];
  cargando = false;

  showModal = false;
  editandoId: number | null = null;
  guardando = false;
  readonly form: FormGroup;

  // Credenciales temporales mostradas UNA sola vez tras crear.
  credenciales: CredencialesTemporales | null = null;
  instanciaCreada = '';

  constructor(
    private fb: FormBuilder,
    private service: InstanciaService,
    private superAuth: SuperAdminAuthService,
    private router: Router,
    private toast: ToastController,
    private alert: AlertController,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      correo_principal: ['', [Validators.required, Validators.email]],
      estado: ['activa'],
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.service.listar().subscribe({
      next: (res) => {
        this.instancias = res.data;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        void this.notificar('No se pudo cargar la lista de instancias.', 'danger');
      },
    });
  }

  abrirCrear(): void {
    this.editandoId = null;
    this.form.reset({ estado: 'activa' });
    this.showModal = true;
  }

  abrirEditar(i: Instancia): void {
    this.editandoId = i.id;
    this.form.reset({
      nombre: i.nombre,
      correo_principal: i.correo_principal ?? '',
      estado: i.estado,
    });
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.notificar('Completá nombre y correo principal.', 'warning');
      return;
    }
    const v = this.form.getRawValue();
    this.guardando = true;

    if (this.editandoId === null) {
      this.service.crear({ nombre: v.nombre, correo_principal: v.correo_principal }).subscribe({
        next: (res) => {
          this.guardando = false;
          this.showModal = false;
          // Mostrar credenciales temporales una sola vez.
          this.instanciaCreada = res.data.nombre;
          this.credenciales = res.credenciales;
          this.cargar();
        },
        error: (err) => this.errorGuardar(err),
      });
    } else {
      this.service
        .actualizar(this.editandoId, {
          nombre: v.nombre,
          correo_principal: v.correo_principal,
          estado: v.estado,
        })
        .subscribe({
          next: () => {
            this.guardando = false;
            this.showModal = false;
            void this.notificar('Instancia actualizada.', 'success');
            this.cargar();
          },
          error: (err) => this.errorGuardar(err),
        });
    }
  }

  toggleEstado(i: Instancia): void {
    const nuevo = i.estado === 'activa' ? 'inactiva' : 'activa';
    this.service.cambiarEstado(i.id, nuevo).subscribe({
      next: () => {
        void this.notificar(nuevo === 'activa' ? 'Instancia activada.' : 'Instancia desactivada.', 'success');
        this.cargar();
      },
      error: (err: HttpErrorResponse) => void this.notificar(this.primerError(err), 'danger'),
    });
  }

  async eliminar(i: Instancia): Promise<void> {
    const a = await this.alert.create({
      header: 'Eliminar instancia',
      message: `¿Eliminar la instancia "${i.nombre}"? Sus datos quedan en la base (soft delete).`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.service.eliminar(i.id).subscribe({
              next: () => {
                void this.notificar('Instancia eliminada.', 'success');
                this.cargar();
              },
              error: (err: HttpErrorResponse) => void this.notificar(this.primerError(err), 'danger'),
            });
          },
        },
      ],
    });
    await a.present();
  }

  cerrarCredenciales(): void {
    this.credenciales = null;
    this.instanciaCreada = '';
  }

  async copiar(texto: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      void this.notificar('Copiado.', 'success');
    } catch {
      void this.notificar('No se pudo copiar.', 'warning');
    }
  }

  cerrarSesion(): void {
    this.superAuth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
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

  private async notificar(mensaje: string, color: string): Promise<void> {
    const t = await this.toast.create({ message: mensaje, duration: 2600, position: 'top', color });
    await t.present();
  }
}
