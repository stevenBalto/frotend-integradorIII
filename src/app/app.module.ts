import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { SuperAdminAuthService } from './core/services/superadmin-auth.service';
import { CarritoService } from './core/services/carrito.service';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot(),
    AppRoutingModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.init(),
      deps: [AuthService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (sa: SuperAdminAuthService) => () => sa.init(),
      deps: [SuperAdminAuthService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (carrito: CarritoService) => () => carrito.init(),
      deps: [CarritoService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
