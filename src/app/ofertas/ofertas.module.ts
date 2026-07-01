import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfertasPage } from './ofertas.page';
import { OfertasPageRoutingModule } from './ofertas-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    OfertasPageRoutingModule
  ],
  declarations: [OfertasPage]
})
export class OfertasPageModule {}
