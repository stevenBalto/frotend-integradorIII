import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { AdminKpiCardComponent } from './admin-kpi-card.component';
import { AdminSectionCardComponent } from './admin-section-card.component';
import { AdminPageHeaderComponent } from './admin-page-header.component';
import { AdminBtnComponent } from './admin-btn.component';
import { FilterTabComponent } from './filter-tab.component';
import { StatusBadgeComponent } from './status-badge.component';
import { ModalityPillComponent } from './modality-pill.component';
import { SearchInputComponent } from './search-input.component';
import { DropdownBtnComponent } from './dropdown-btn.component';
import { ProgressBarComponent } from './progress-bar.component';
import { DonutChartComponent } from './donut-chart.component';
import { MiniBarComponent } from './mini-bar.component';
import { BarChartComponent } from './bar-chart.component';
import { AreaChartComponent } from './area-chart.component';

const COMPONENTS = [
  AdminKpiCardComponent,
  AdminSectionCardComponent,
  AdminPageHeaderComponent,
  AdminBtnComponent,
  FilterTabComponent,
  StatusBadgeComponent,
  ModalityPillComponent,
  SearchInputComponent,
  DropdownBtnComponent,
  ProgressBarComponent,
  DonutChartComponent,
  MiniBarComponent,
  BarChartComponent,
  AreaChartComponent,
];

/**
 * Componentes de UI reutilizables del panel admin (KPIs, charts SVG, badges, etc.).
 * Cada página del panel importa este módulo.
 */
@NgModule({
  declarations: [...COMPONENTS],
  imports: [CommonModule, IonicModule],
  exports: [...COMPONENTS],
})
export class AdminSharedModule {}
