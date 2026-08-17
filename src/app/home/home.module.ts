import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { HomePageRoutingModule } from './home-routing.module';
import { CrcCurrencyPipe } from '../shared/pipes/crc-currency.pipe';
import { QrCodeComponent } from '../shared/components/qr-code.component';
import { BuscarPedidoModalComponent } from '../shared/components/buscar-pedido-modal.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    HomePageRoutingModule,
    CrcCurrencyPipe,
    QrCodeComponent,
    BuscarPedidoModalComponent,
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
