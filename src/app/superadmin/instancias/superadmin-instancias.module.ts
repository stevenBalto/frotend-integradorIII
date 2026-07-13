import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SuperadminInstanciasPage } from './superadmin-instancias.page';
import { SuperadminInstanciasPageRoutingModule } from './superadmin-instancias-routing.module';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, SuperadminInstanciasPageRoutingModule],
  declarations: [SuperadminInstanciasPage],
})
export class SuperadminInstanciasPageModule {}
