import { Component } from '@angular/core';

interface AdminUser {
  id: number; name: string; email: string; role: 'superadmin' | 'user';
  branch: string; active: boolean;
}
interface FilterOpt { id: string; label: string; }

/** Usuarios y roles + modal "Crear usuario" (toggle visual). */
@Component({
  selector: 'app-admin-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: false,
})
export class AdminUsuariosPage {
  activeFilter = 'todos';
  showCreate = false;
  /** Estado visual del selector de rol dentro del modal. */
  modalRole: 'user' | 'admin' = 'user';

  readonly filters: FilterOpt[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'superadmin', label: 'Superadministradores' },
    { id: 'user', label: 'Usuarios' },
  ];

  readonly users: AdminUser[] = [
    { id: 1, name: 'Admin Rooster',   email: 'admin@rooster.com',      role: 'superadmin', branch: 'Todas',   active: true },
    { id: 2, name: 'Reyman Barquero', email: 'reyman@rooster.com',     role: 'superadmin', branch: 'Liberia', active: true },
    { id: 3, name: 'Mechones B.',     email: 'mechones@correo.com',    role: 'user',       branch: '—',       active: true },
    { id: 4, name: 'Jorge Pérez',     email: 'jorge.perez@correo.com', role: 'user',       branch: '—',       active: false },
  ];

  openCreate(): void { this.showCreate = true; this.modalRole = 'user'; }
  closeCreate(): void { this.showCreate = false; }
}
