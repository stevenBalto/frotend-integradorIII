import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SuperadminSedesPage } from './superadmin-sedes.page';
import { SuperadminSedesPageRoutingModule } from './superadmin-sedes-routing.module';
import { IdleSessionModalComponent } from '../../shared/components/idle-session-modal.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    SuperadminSedesPageRoutingModule,
    IdleSessionModalComponent,
  ],
  declarations: [SuperadminSedesPage],
})
export class SuperadminSedesPageModule {}
