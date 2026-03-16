// ─── Rail Network Data ────────────────────────────────────────────────────────
// Sources: data/data/trenes/ferromex_schematic/ + fioc_schematic/
// All coordinates are schematic approximations, not engineering-grade.
// Positions are [longitude, latitude] for deck.gl compatibility.

import type { RGB } from '../types';

export interface RailSegment {
  id: string;
  operator: string;
  operatorName: string;
  routeGroup: string;
  path: [number, number][];  // [[lon, lat], [lon, lat]]
  color: RGB;
  /** 'active' | 'extension_low_certainty' */
  status: string;
}

// ─── Operator colours ────────────────────────────────────────────────────────

export const RAIL_OPERATOR_COLORS: Record<string, RGB> = {
  FMX: [255,  77,  77],   // #ff4d4d  Ferromex
  FSR: [183, 179,  26],   // #b7b31a  Ferrosur
  DP:  [127, 221, 227],   // #7fdde3  Derechos de Paso
  CM:  [115, 225, 200],   // #73e1c8  Chiapas Mayab
  FA:  [125,  29,  69],   // #7d1d45  FIOC Línea FA
  Z:   [ 11,  79,  87],   // #0b4f57  FIOC Línea Z
  K:   [178, 122,  31],   // #b27a1f  FIOC Línea K
};

export const RAIL_OPERATOR_NAMES: Record<string, string> = {
  FMX: 'Ferromex',
  FSR: 'Ferrosur',
  DP:  'Derechos de Paso',
  CM:  'Chiapas Mayab',
  FA:  'FIOC · Línea FA',
  Z:   'FIOC · Línea Z',
  K:   'FIOC · Línea K',
};

// ─── Node lookup [lon, lat] ───────────────────────────────────────────────────

const N: Record<string, [number, number]> = {
  // Ferromex / Ferrosur / DP / CM nodes
  MXL:  [-115.4523, 32.6245],
  NOG:  [-110.9381, 31.3012],
  HER:  [-110.9613, 29.0892],
  GMS:  [-110.8976, 27.9193],
  TBL:  [-109.0500, 25.6000],
  CUL:  [-107.3940, 24.8091],
  MZT:  [-106.4111, 23.2494],
  TEP:  [-104.8940, 21.5061],
  GDL:  [-103.3440, 20.6736],
  MNZ:  [-104.3188, 19.0501],
  CJS:  [-106.4245, 31.6904],
  CUU:  [-106.0889, 28.6353],
  OJI:  [-104.4167, 29.5667],
  PNG:  [-100.5231, 28.7000],
  FTR:  [-101.4521, 26.9281],
  TRC:  [-103.4068, 25.5428],
  MTY:  [-100.3161, 25.6866],
  ATM:  [ -97.9381, 22.3920],
  TAM:  [ -97.8570, 22.2160],
  ZCL:  [-102.5832, 22.7709],
  AGS:  [-102.2916, 21.8853],
  SIL:  [-101.4270, 20.9436],
  IRA:  [-101.3563, 20.6767],
  PNJ:  [-101.7222, 20.4311],
  CDMX: [ -99.1332, 19.4326],
  PUE:  [ -98.2063, 19.0414],
  VER:  [ -96.1342, 19.1738],
  COA:  [ -94.4586, 18.1345],
  SCZ:  [ -95.2000, 16.1670],
  // Synthetic junction nodes
  DPN:  [-102.3500, 24.9500],
  DPC:  [-101.0000, 22.9500],
  FSO:  [ -97.3000, 18.8500],
  CMT:  [ -93.2000, 17.9500],
  CMC:  [ -92.7000, 16.9000],
  CMY:  [ -89.6200, 20.9700],
  CMQ:  [ -88.3000, 18.5000],
  // FIOC nodes
  CUI:  [ -94.1700, 17.9800],
  LCH:  [ -93.9200, 17.8800],
  RAY:  [ -93.3900, 17.5000],
  JUA:  [ -93.2400, 17.4100],
  TEA:  [ -92.9500, 17.5500],
  PSU:  [ -92.6700, 17.6400],
  SDA:  [ -92.3400, 17.5600],
  PAK:  [ -92.0300, 17.4900],
  JAL:  [ -94.7100, 17.9600],
  MAG:  [ -95.0200, 17.7200],
  JCA:  [ -95.0300, 17.4300],
  DON:  [ -95.0900, 17.2300],
  MOG:  [ -95.0900, 17.0300],
  MRO:  [ -95.0300, 16.8800],
  CHI:  [ -95.1000, 16.6900],
  IXT:  [ -95.1000, 16.5600],
  SCR:  [ -95.2000, 16.1700],
  TEH:  [ -95.2400, 16.3200],
  COM:  [ -95.1600, 16.4800],
  ESP:  [ -95.0400, 16.4900],
  JUC:  [ -95.0200, 16.4400],
  UHI:  [ -94.8300, 16.4700],
  RPI:  [ -94.4600, 16.4200],
  CHA:  [ -94.1900, 16.2900],
  ARR:  [ -93.9000, 16.2400],
  TON:  [ -93.7600, 16.0900],
  PIJ:  [ -93.2100, 15.6900],
  MAP:  [ -92.9000, 15.4400],
  ACA:  [ -92.6900, 15.2800],
  HUI:  [ -92.4600, 15.1400],
  AOB:  [ -92.3500, 14.9600],
  LTO:  [ -92.2500, 14.8100],
  HID:  [ -92.1500, 14.6800],
};

function seg(
  id: string,
  operator: string,
  operatorName: string,
  routeGroup: string,
  from: string,
  to: string,
  status = 'active',
): RailSegment {
  return {
    id,
    operator,
    operatorName,
    routeGroup,
    path: [N[from], N[to]],
    color: RAIL_OPERATOR_COLORS[operator],
    status,
  };
}

// ─── Ferromex segments ────────────────────────────────────────────────────────

const FMX = 'FMX';
const FN  = RAIL_OPERATOR_NAMES.FMX;

const FERROMEX: RailSegment[] = [
  seg('FMX_001', FMX, FN, 'Ferromex Pacífico Norte',     'MXL', 'NOG'),
  seg('FMX_002', FMX, FN, 'Ferromex Pacífico Norte',     'NOG', 'HER'),
  seg('FMX_003', FMX, FN, 'Ferromex Pacífico Norte',     'HER', 'GMS'),
  seg('FMX_004', FMX, FN, 'Ferromex Pacífico Norte',     'HER', 'TBL'),
  seg('FMX_005', FMX, FN, 'Ferromex Pacífico Norte',     'TBL', 'CUL'),
  seg('FMX_006', FMX, FN, 'Ferromex Pacífico Norte',     'CUL', 'MZT'),
  seg('FMX_007', FMX, FN, 'Ferromex Pacífico Norte',     'MZT', 'TEP'),
  seg('FMX_008', FMX, FN, 'Ferromex Occidente',          'TEP', 'GDL'),
  seg('FMX_009', FMX, FN, 'Ferromex Occidente',          'GDL', 'MNZ'),
  seg('FMX_010', FMX, FN, 'Ferromex Bajío',              'GDL', 'PNJ'),
  seg('FMX_011', FMX, FN, 'Ferromex Bajío',              'PNJ', 'IRA'),
  seg('FMX_012', FMX, FN, 'Ferromex Bajío',              'PNJ', 'SIL'),
  seg('FMX_013', FMX, FN, 'Ferromex Bajío-Norte',        'SIL', 'AGS'),
  seg('FMX_014', FMX, FN, 'Ferromex Bajío-Norte',        'AGS', 'ZCL'),
  seg('FMX_015', FMX, FN, 'Ferromex Bajío-Norte',        'ZCL', 'TRC'),
  seg('FMX_016', FMX, FN, 'Ferromex Norte',              'TRC', 'CUU'),
  seg('FMX_017', FMX, FN, 'Ferromex Frontera',           'CUU', 'CJS'),
  seg('FMX_018', FMX, FN, 'Ferromex Frontera',           'CUU', 'OJI'),
  seg('FMX_019', FMX, FN, 'Ferromex Frontera',           'CUU', 'PNG'),
  seg('FMX_020', FMX, FN, 'Ferromex Frontera',           'PNG', 'FTR'),
  seg('FMX_021', FMX, FN, 'Ferromex Noreste',            'FTR', 'MTY'),
  seg('FMX_022', FMX, FN, 'Ferromex Noreste',            'TRC', 'MTY'),
  seg('FMX_023', FMX, FN, 'Ferromex Golfo',              'MTY', 'ATM'),
  seg('FMX_024', FMX, FN, 'Ferromex Golfo',              'ATM', 'TAM'),
  seg('FMX_025', FMX, FN, 'Ferromex Centro',             'PNJ', 'CDMX'),
  seg('FMX_026', FMX, FN, 'Ferromex Transversal Norte',  'CUL', 'CUU'),
];

// ─── Ferrosur segments ────────────────────────────────────────────────────────

const FSR_OP = 'FSR';
const FSR_N  = RAIL_OPERATOR_NAMES.FSR;

const FERROSUR: RailSegment[] = [
  seg('FSR_001', FSR_OP, FSR_N, 'Ferrosur Centro-Oriente',  'CDMX', 'PUE'),
  seg('FSR_002', FSR_OP, FSR_N, 'Ferrosur Centro-Oriente',  'PUE',  'FSO'),
  seg('FSR_003', FSR_OP, FSR_N, 'Ferrosur Golfo',           'FSO',  'VER'),
  seg('FSR_004', FSR_OP, FSR_N, 'Ferrosur Istmo',           'FSO',  'COA'),
  seg('FSR_005', FSR_OP, FSR_N, 'Ferrosur Centro-Golfo',    'CDMX', 'VER'),
  seg('FSR_006', FSR_OP, FSR_N, 'Ferrosur Centro-Istmo',    'CDMX', 'FSO'),
];

// ─── Derechos de Paso segments ────────────────────────────────────────────────

const DP_OP = 'DP';
const DP_N  = RAIL_OPERATOR_NAMES.DP;

const DERECHOS_PASO: RailSegment[] = [
  seg('DP_001', DP_OP, DP_N, 'Derechos de Paso Norte',  'TRC', 'DPN'),
  seg('DP_002', DP_OP, DP_N, 'Derechos de Paso Norte',  'DPN', 'FTR'),
  seg('DP_003', DP_OP, DP_N, 'Derechos de Paso Centro', 'DPN', 'ZCL'),
  seg('DP_004', DP_OP, DP_N, 'Derechos de Paso Centro', 'DPN', 'DPC'),
  seg('DP_005', DP_OP, DP_N, 'Derechos de Paso Centro', 'DPC', 'IRA'),
  seg('DP_006', DP_OP, DP_N, 'Derechos de Paso Golfo',  'DPC', 'ATM'),
  seg('DP_007', DP_OP, DP_N, 'Derechos de Paso Golfo',  'DPC', 'TAM'),
];

// ─── Chiapas Mayab segments ───────────────────────────────────────────────────

const CM_OP = 'CM';
const CM_N  = RAIL_OPERATOR_NAMES.CM;

const CHIAPAS_MAYAB: RailSegment[] = [
  seg('CM_001', CM_OP, CM_N, 'Chiapas Mayab Istmo',      'COA', 'SCZ'),
  seg('CM_002', CM_OP, CM_N, 'Chiapas Mayab Sureste',    'COA', 'CMT'),
  seg('CM_003', CM_OP, CM_N, 'Chiapas Mayab Sureste',    'CMT', 'CMC'),
  seg('CM_004', CM_OP, CM_N, 'Chiapas Mayab Sureste',    'CMC', 'SCZ'),
  seg('CM_005', CM_OP, CM_N, 'Chiapas Mayab Península',  'CMT', 'CMY'),
  seg('CM_006', CM_OP, CM_N, 'Chiapas Mayab Península',  'CMY', 'CMQ'),
];

// ─── FIOC Línea FA segments ───────────────────────────────────────────────────

const FA_OP = 'FA';
const FA_N  = RAIL_OPERATOR_NAMES.FA;

const FIOC_FA: RailSegment[] = [
  seg('FA_01', FA_OP, FA_N, 'Línea FA', 'COA', 'CUI'),
  seg('FA_02', FA_OP, FA_N, 'Línea FA', 'CUI', 'LCH'),
  seg('FA_03', FA_OP, FA_N, 'Línea FA', 'LCH', 'RAY'),
  seg('FA_04', FA_OP, FA_N, 'Línea FA', 'RAY', 'JUA'),
  seg('FA_05', FA_OP, FA_N, 'Línea FA', 'JUA', 'TEA'),
  seg('FA_06', FA_OP, FA_N, 'Línea FA', 'TEA', 'PSU'),
  seg('FA_07', FA_OP, FA_N, 'Línea FA', 'PSU', 'SDA'),
  seg('FA_08', FA_OP, FA_N, 'Línea FA', 'SDA', 'PAK'),
];

// ─── FIOC Línea Z segments ────────────────────────────────────────────────────

const Z_OP = 'Z';
const Z_N  = RAIL_OPERATOR_NAMES.Z;

const FIOC_Z: RailSegment[] = [
  seg('Z_01', Z_OP, Z_N, 'Línea Z', 'COA', 'JAL'),
  seg('Z_02', Z_OP, Z_N, 'Línea Z', 'JAL', 'MAG'),
  seg('Z_03', Z_OP, Z_N, 'Línea Z', 'MAG', 'JCA'),
  seg('Z_04', Z_OP, Z_N, 'Línea Z', 'JCA', 'DON'),
  seg('Z_05', Z_OP, Z_N, 'Línea Z', 'DON', 'MOG'),
  seg('Z_06', Z_OP, Z_N, 'Línea Z', 'MOG', 'MRO'),
  seg('Z_07', Z_OP, Z_N, 'Línea Z', 'MRO', 'CHI'),
  seg('Z_08', Z_OP, Z_N, 'Línea Z', 'CHI', 'IXT'),
  seg('Z_09', Z_OP, Z_N, 'Línea Z', 'IXT', 'SCR'),
];

// ─── FIOC Línea K segments ────────────────────────────────────────────────────

const K_OP = 'K';
const K_N  = RAIL_OPERATOR_NAMES.K;

const FIOC_K: RailSegment[] = [
  seg('K_01',  K_OP, K_N, 'Línea K', 'SCR', 'TEH'),
  seg('K_02',  K_OP, K_N, 'Línea K', 'TEH', 'COM'),
  seg('K_03',  K_OP, K_N, 'Línea K', 'COM', 'IXT'),
  seg('K_04',  K_OP, K_N, 'Línea K', 'IXT', 'ESP'),
  seg('K_05',  K_OP, K_N, 'Línea K', 'ESP', 'JUC'),
  seg('K_06',  K_OP, K_N, 'Línea K', 'JUC', 'UHI'),
  seg('K_07',  K_OP, K_N, 'Línea K', 'UHI', 'RPI'),
  seg('K_08',  K_OP, K_N, 'Línea K', 'RPI', 'CHA'),
  seg('K_09',  K_OP, K_N, 'Línea K', 'CHA', 'ARR'),
  seg('K_10',  K_OP, K_N, 'Línea K', 'ARR', 'TON'),
  // extension_low_certainty segments beyond Tonalá
  seg('K_11',  K_OP, K_N, 'Línea K', 'TON', 'PIJ', 'extension_low_certainty'),
  seg('K_12',  K_OP, K_N, 'Línea K', 'PIJ', 'MAP', 'extension_low_certainty'),
  seg('K_13',  K_OP, K_N, 'Línea K', 'MAP', 'ACA', 'extension_low_certainty'),
  seg('K_14',  K_OP, K_N, 'Línea K', 'ACA', 'HUI', 'extension_low_certainty'),
  seg('K_15',  K_OP, K_N, 'Línea K', 'HUI', 'AOB', 'extension_low_certainty'),
  seg('K_16',  K_OP, K_N, 'Línea K', 'AOB', 'LTO', 'extension_low_certainty'),
  seg('K_17',  K_OP, K_N, 'Línea K', 'LTO', 'HID', 'extension_low_certainty'),
];

// ─── Combined export ──────────────────────────────────────────────────────────

export const RAIL_SEGMENTS: RailSegment[] = [
  ...FERROMEX,
  ...FERROSUR,
  ...DERECHOS_PASO,
  ...CHIAPAS_MAYAB,
  ...FIOC_FA,
  ...FIOC_Z,
  ...FIOC_K,
];

/** Ordered list of operators for legend rendering */
export const RAIL_OPERATORS = ['FMX', 'FSR', 'DP', 'CM', 'FA', 'Z', 'K'] as const;
export type RailOperator = typeof RAIL_OPERATORS[number];
