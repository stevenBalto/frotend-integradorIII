import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { AdminSharedModule } from '../shared/admin-shared.module';
import { AdminAnaliticasPage } from './analiticas.page';
import { RankingListComponent } from './ranking-list.component';
import { ComparisonCardComponent } from './comparison-card.component';
import { ModalityCompactComponent } from './modality-compact.component';
import { PeakHoursChartComponent } from './peak-hours-chart.component';
import { TopProductsTableComponent } from './top-products-table.component';
import { PluralizePipe } from './pluralize.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminSharedModule,
    RankingListComponent,
    ComparisonCardComponent,
    ModalityCompactComponent,
    PeakHoursChartComponent,
    TopProductsTableComponent,
    PluralizePipe,
    RouterModule.forChild([{ path: '', component: AdminAnaliticasPage }]),
  ],
  declarations: [AdminAnaliticasPage],
})
export class AdminAnaliticasPageModule {}
