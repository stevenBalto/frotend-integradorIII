import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { Usuario } from '../core/models/usuario.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  readonly usuario$: Observable<Usuario | null>;

  constructor(private auth: AuthService) {
    this.usuario$ = this.auth.usuarioActual$;
  }
}
