import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MiCuentaPage } from './mi-cuenta.page';
import { MiCuentaPageRoutingModule } from './mi-cuenta-routing.module';
import { CrcCurrencyPipe } from '../shared/pipes/crc-currency.pipe';
import { FaqPage } from './pages/faq.page';
import { InfoPage } from './pages/info.page';
import { ProductosPage } from './pages/productos.page';
import { RoostersPage } from './pages/roosters.page';
import { PerfilPage } from './pages/perfil.page';
import { HistorialPage } from './pages/historial.page';
import { RestaurantesPage } from './pages/restaurantes.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule,
    MiCuentaPageRoutingModule,
    CrcCurrencyPipe,
  ],
  declarations: [
    MiCuentaPage,
    FaqPage,
    InfoPage,
    ProductosPage,
    RoostersPage,
    PerfilPage,
    HistorialPage,
    RestaurantesPage,
  ],
})
export class MiCuentaPageModule {}
