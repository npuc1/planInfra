import type { RGB } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RailSegment {
  id: string;
  operator: string;
  /** Line name from RFN shapefile (LINEA field) */
  linea: string;
  path: [number, number][];
  status: 'active' | 'inactive';
}

// ─── Static operator metadata ──────────────────────────────────────────────────
// Derived from RFN_D_A_2024/VIA_FERREA.shp — ENTIDAD field

export const RAIL_OPERATOR_COLORS: Record<string, RGB> = {
  FERROMEX:   [220,  80,  40],
  FERROSUR:   [240, 150,  30],
  KCSM:       [ 50, 160, 220],
  LCD:        [160,  80, 200],
  FIT:        [ 40, 180, 120],
  FTVM:       [200, 200,  60],
  FSUB:       [100, 200, 255],
  TT:         [180, 120,  60],
  TIM:        [255, 120, 180],
  JAL:        [100, 180,  80],
  PUE:        [200, 100, 100],
  TRENMAYA:   [ 60, 220, 180],
  UNASSIGNED: [120, 120, 120],
};

export const RAIL_OPERATOR_NAMES: Record<string, string> = {
  FERROMEX:   'Ferrocarril Mexicano (Ferromex)',
  FERROSUR:   'Ferrosur',
  KCSM:       'Kansas City Southern de México',
  LCD:        'Línea Coahuila-Durango',
  FIT:        'Ferrocarril del Istmo de Tehuantepec',
  FTVM:       'Ferrocarril y Terminal del Valle de México',
  FSUB:       'Ferrocarriles Suburbanos',
  TT:         'Vía Corta Tijuana-Tecate',
  TIM:        'Tren Interurbano México-Toluca',
  JAL:        'Gobierno del Estado de Jalisco',
  PUE:        'Gobierno del Estado de Puebla',
  TRENMAYA:   'Tren Maya',
  UNASSIGNED: 'Sin concesionar / asignar',
};

export const RAIL_OPERATORS: string[] = Object.keys(RAIL_OPERATOR_COLORS);
