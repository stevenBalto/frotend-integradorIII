import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { AdminSharedModule } from '../shared/admin-shared.module';
import { AdminClientesPage } from './clientes.page';
import { ClientesTopChartComponent } from './clientes-top-chart.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminSharedModule,
    ClientesTopChartComponent,
    RouterModule.forChild([{ path: '', component: AdminClientesPage }]),
  ],
  declarations: [AdminClientesPage],
})
export class AdminClientesPageModule {}
