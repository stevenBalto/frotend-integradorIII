import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SuperadminPanelPage } from './superadmin-panel.page';
import { SuperadminPanelPageRoutingModule } from './superadmin-panel-routing.module';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, SuperadminPanelPageRoutingModule],
  declarations: [SuperadminPanelPage],
})
export class SuperadminPanelPageModule {}
