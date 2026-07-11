import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { HomePageRoutingModule } from './home-routing.module';
import { CrcCurrencyPipe } from '../shared/pipes/crc-currency.pipe';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    HomePageRoutingModule,
    CrcCurrencyPipe,
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
