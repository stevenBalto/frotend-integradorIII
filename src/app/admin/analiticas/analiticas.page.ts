import { Component } from '@angular/core';

interface Bar { day: string; val: number; }
interface TopProduct { name: string; units: number; color: string; }
interface Legend { label: string; pct: string; value: string; c: string; bg: string; }

/** Reportes y analíticas: KPIs, barras por día / horas pico, top productos, modalidad. */
@Component({
  selector: 'app-admin-analiticas',
  templateUrl: './analiticas.page.html',
  styleUrls: ['./analiticas.page.scss'],
  standalone: false,
})
export class AdminAnaliticasPage {
  readonly dailySales: Bar[] = [
    { day: 'L', val: 280 }, { day: 'M', val: 390 }, { day: 'M', val: 320 },
    { day: 'J', val: 450 }, { day: 'V', val: 370 }, { day: 'S', val: 680 },
    { day: 'D', val: 760 }, { day: 'L', val: 310 }, { day: 'M', val: 400 },
    { day: 'J', val: 355 }, { day: 'S', val: 620 }, { day: 'D', val: 785 },
  ];

  readonly peakHours: Bar[] = [
    { day: '11a', val: 12 }, { day: '1p', val: 28 }, { day: '3p', val: 35 },
    { day: '5p', val: 65 }, { day: '7p', val: 58 }, { day: '9p', val: 32 }, { day: '11p', val: 15 },
  ];

  readonly topProducts: TopProduct[] = [
    { name: 'Pizza Pepperoni', units: 312, color: '#E13642' },
    { name: 'Costillas BBQ',   units: 248, color: '#374151' },
    { name: 'Pizza 4 Quesos',  units: 201, color: '#6B7280' },
    { name: 'Pasta Alfredo',   units: 156, color: '#9CA3AF' },
  ];
  readonly maxUnits = 312;

  readonly legend: Legend[] = [
    { label: 'Comer aquí',  pct: '58%', value: '558', c: '#E13642', bg: 'rgba(225,54,66,0.05)' },
    { label: 'Para llevar', pct: '42%', value: '404', c: '#374151', bg: '#E5E7EB' },
  ];
}
