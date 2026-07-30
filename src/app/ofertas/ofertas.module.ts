import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfertasPage } from './ofertas.page';
import { OfertasPageRoutingModule } from './ofertas-routing.module';
import { QrCodeComponent } from '../shared/components/qr-code.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    OfertasPageRoutingModule,
    QrCodeComponent,
  ],
  declarations: [OfertasPage]
})
export class OfertasPageModule {}
