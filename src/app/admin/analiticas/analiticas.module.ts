import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { AdminSharedModule } from '../shared/admin-shared.module';
import { AdminAnaliticasPage } from './analiticas.page';
import { SalesBarChartComponent } from '../shared/sales-bar-chart.component';
import { ModalityDonutChartComponent } from '../shared/modality-donut-chart.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminSharedModule,
    SalesBarChartComponent,
    ModalityDonutChartComponent,
    RouterModule.forChild([{ path: '', component: AdminAnaliticasPage }]),
  ],
  declarations: [AdminAnaliticasPage],
})
export class AdminAnaliticasPageModule {}
