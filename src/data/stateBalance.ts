import type { StateBalance, Commodity } from '../types';

// ─── Data sources ─────────────────────────────────────────────────────────────
// Production:  data/data/produccion/*.xlsx — SIAP, Año agrícola 2025.
// Consumption: data/data/consumo_estado.xlsx — Total demanda estatal de MAÍZ
//              (humano + pecuario + industrial) en miles de toneladas.
//              For beans/wheat/rice, demand is estimated from national balances
//              (no per-state breakdown is available).
// Storage:     data/data/Capacidad de almacenamiento al 2019.xlsx — Capacidad
//              total por estado, en miles de toneladas (SIAP 2019).
//
// Field notes:
//   demandTons            ← total state consumption for the commodity
//   importsTons           ← max(0, demand − production)
//   surplusDeficitTons    ← production − demand  (positive = surplus)
//   storageCapacityTons   ← total installed capacity (2019 SIAP census)
//   storageUtilizationRate ← 0.85 default (no per-state 2026 data)

// ─── State centroids ──────────────────────────────────────────────────────────
const COORDS: Record<string, [number, number]> = {
  'Aguascalientes':       [22.00,  -102.30],
  'Baja California':      [30.00,  -115.20],
  'Baja California Sur':  [25.00,  -111.00],
  'Campeche':             [19.30,   -90.50],
  'Chiapas':              [16.75,   -93.10],
  'Chihuahua':            [28.60,  -106.10],
  'Ciudad de México':     [19.43,   -99.13],
  'Coahuila':             [27.30,  -102.00],
  'Colima':               [18.90,  -103.90],
  'Durango':              [24.00,  -104.70],
  'Estado de México':     [19.29,   -99.65],
  'Guanajuato':           [21.00,  -101.30],
  'Guerrero':             [17.50,   -99.50],
  'Hidalgo':              [20.50,   -98.70],
  'Jalisco':              [20.66,  -103.35],
  'Michoacán':            [19.70,  -101.20],
  'Morelos':              [18.70,   -99.10],
  'Nayarit':              [22.00,  -104.90],
  'Nuevo León':           [25.69,   -99.50],
  'Oaxaca':               [17.00,   -96.70],
  'Puebla':               [19.04,   -98.20],
  'Querétaro':            [20.90,  -100.00],
  'Quintana Roo':         [19.80,   -87.70],
  'San Luis Potosí':      [22.50,  -100.50],
  'Sinaloa':              [24.80,  -107.40],
  'Sonora':               [29.10,  -110.90],
  'Tabasco':              [17.90,   -92.90],
  'Tamaulipas':           [23.70,   -99.10],
  'Tlaxcala':             [19.30,   -98.20],
  'Veracruz':             [19.20,   -96.10],
  'Yucatán':              [20.97,   -89.60],
  'Zacatecas':            [23.00,  -102.50],
};

// ─── Storage capacity by state — SIAP 2019, miles de ton → tons ──────────────
const STORAGE_TONS: Record<string, number> = {
  'Aguascalientes':        73_000,
  'Baja California':    1_330_000,
  'Baja California Sur':   33_000,
  'Campeche':             168_000,
  'Chiapas':              746_000,
  'Chihuahua':          3_451_000,
  'Ciudad de México':      87_000,
  'Coahuila':             152_000,
  'Colima':                23_000,
  'Durango':              951_000,
  'Estado de México':     288_000,
  'Guanajuato':         3_721_000,
  'Guerrero':             186_000,
  'Hidalgo':              188_000,
  'Jalisco':            5_168_000,
  'Michoacán':          1_611_000,
  'Morelos':              390_000,
  'Nayarit':              497_000,
  'Nuevo León':           171_000,
  'Oaxaca':                63_000,
  'Puebla':               715_000,
  'Querétaro':            301_000,
  'Quintana Roo':               0,
  'San Luis Potosí':       77_000,
  'Sinaloa':            7_506_000,
  'Sonora':             4_491_000,
  'Tabasco':               50_000,
  'Tamaulipas':         4_807_000,
  'Tlaxcala':             415_000,
  'Veracruz':             670_000,
  'Yucatán':              341_000,
  'Zacatecas':            919_000,
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function row(
  state: string,
  commodity: Commodity,
  productionTons: number,
  demandTons: number,
  storageCapacityTons: number,
  storageUtilizationRate = 0.85,
): StateBalance {
  const [lat, lng] = COORDS[state]!;
  const importsTons        = Math.max(0, demandTons - productionTons);
  const surplusDeficitTons = Math.round(productionTons - demandTons);
  return {
    state, commodity,
    productionTons:        Math.round(productionTons),
    demandTons:            Math.round(demandTons),
    importsTons:           Math.round(importsTons),
    storageCapacityTons:   Math.round(storageCapacityTons),
    storageUtilizationRate,
    surplusDeficitTons,
    lat, lng,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIZE — SIAP 2025 production; per-state consumption from consumo_estado.xlsx
// "Otros 8 estados" total (3 300 000 t) divided equally:
//   Morelos, Quintana Roo, Zacatecas, Tlaxcala, Nayarit, Campeche, BCS, Colima
// ═══════════════════════════════════════════════════════════════════════════════
const MAIZE: StateBalance[] = [
  row('Aguascalientes',       'maize',      41_676,  1_460_000, STORAGE_TONS['Aguascalientes']!),
  row('Baja California',      'maize',      10_576,    850_000, STORAGE_TONS['Baja California']!),
  row('Baja California Sur',  'maize',      27_574,    412_500, STORAGE_TONS['Baja California Sur']!),
  row('Campeche',             'maize',     224_435,    412_500, STORAGE_TONS['Campeche']!),
  row('Chiapas',              'maize',     753_954,  1_600_000, STORAGE_TONS['Chiapas']!),
  row('Chihuahua',            'maize',   1_554_422,  1_350_000, STORAGE_TONS['Chihuahua']!),
  row('Ciudad de México',     'maize',       3_951,  1_650_000, STORAGE_TONS['Ciudad de México']!),
  row('Coahuila',             'maize',      33_654,  1_750_000, STORAGE_TONS['Coahuila']!),
  row('Colima',               'maize',      58_258,    412_500, STORAGE_TONS['Colima']!),
  row('Durango',              'maize',     245_813,  1_470_000, STORAGE_TONS['Durango']!),
  row('Estado de México',     'maize',   1_258_802,  4_050_000, STORAGE_TONS['Estado de México']!),
  row('Guanajuato',           'maize',   1_579_210,  2_400_000, STORAGE_TONS['Guanajuato']!),
  row('Guerrero',             'maize',   1_215_919,    850_000, STORAGE_TONS['Guerrero']!),
  row('Hidalgo',              'maize',     469_670,    910_000, STORAGE_TONS['Hidalgo']!),
  row('Jalisco',              'maize',   2_380_785,  7_090_000, STORAGE_TONS['Jalisco']!),
  row('Michoacán',            'maize',   1_818_434,  1_400_000, STORAGE_TONS['Michoacán']!),
  row('Morelos',              'maize',      49_517,    412_500, STORAGE_TONS['Morelos']!),
  row('Nayarit',              'maize',      94_072,    412_500, STORAGE_TONS['Nayarit']!),
  row('Nuevo León',           'maize',      34_209,  1_550_000, STORAGE_TONS['Nuevo León']!),
  row('Oaxaca',               'maize',     652_116,  1_000_000, STORAGE_TONS['Oaxaca']!),
  row('Puebla',               'maize',   1_095_904,  3_150_000, STORAGE_TONS['Puebla']!),
  row('Querétaro',            'maize',     245_110,  1_850_000, STORAGE_TONS['Querétaro']!),
  row('Quintana Roo',         'maize',      51_646,    412_500, STORAGE_TONS['Quintana Roo']!),
  row('San Luis Potosí',      'maize',     241_780,    900_000, STORAGE_TONS['San Luis Potosí']!),
  row('Sinaloa',              'maize',   2_319_880,  1_050_000, STORAGE_TONS['Sinaloa']!),
  row('Sonora',               'maize',     100_651,  2_220_000, STORAGE_TONS['Sonora']!),
  row('Tabasco',              'maize',     184_783,    620_000, STORAGE_TONS['Tabasco']!),
  row('Tamaulipas',           'maize',     403_415,    930_000, STORAGE_TONS['Tamaulipas']!),
  row('Tlaxcala',             'maize',     248_531,    412_500, STORAGE_TONS['Tlaxcala']!),
  row('Veracruz',             'maize',   1_065_057,  3_700_000, STORAGE_TONS['Veracruz']!),
  row('Yucatán',              'maize',      77_685,  1_250_000, STORAGE_TONS['Yucatán']!),
  row('Zacatecas',            'maize',     457_283,    412_500, STORAGE_TONS['Zacatecas']!),
];

// ═══════════════════════════════════════════════════════════════════════════════
// BEANS — SIAP 2025 production; demand estimated at production × 1.25
// (Mexico is a slight net importer of beans nationally)
// ═══════════════════════════════════════════════════════════════════════════════
function bRow(state: string, prod: number) {
  return row(state, 'beans', prod, Math.round(prod * 1.25), STORAGE_TONS[state]! * 0.05);
}
const BEANS: StateBalance[] = [
  bRow('Aguascalientes',        1_266),
  bRow('Baja California Sur',     534),
  bRow('Campeche',                985),
  bRow('Chiapas',              65_784),
  bRow('Chihuahua',            75_442),
  bRow('Ciudad de México',         32),
  bRow('Coahuila',                189),
  bRow('Colima',                    6),
  bRow('Durango',              51_668),
  bRow('Estado de México',      2_945),
  bRow('Guanajuato',           46_600),
  bRow('Guerrero',             13_849),
  bRow('Hidalgo',              12_103),
  bRow('Jalisco',               6_116),
  bRow('Michoacán',             2_701),
  bRow('Morelos',                 433),
  bRow('Nayarit',              69_744),
  bRow('Nuevo León',              119),
  bRow('Oaxaca',               22_611),
  bRow('Puebla',               32_239),
  bRow('Querétaro',             2_067),
  bRow('Quintana Roo',          8_659),
  bRow('San Luis Potosí',      62_188),
  bRow('Sinaloa',             222_031),
  bRow('Sonora',                6_181),
  bRow('Tabasco',               2_035),
  bRow('Tamaulipas',            2_152),
  bRow('Tlaxcala',              1_254),
  bRow('Veracruz',             26_554),
  bRow('Yucatán',                 131),
  bRow('Zacatecas',           382_895),
];

// ═══════════════════════════════════════════════════════════════════════════════
// WHEAT — SIAP 2025 production; demand estimated at production × 2.9
// (Mexico produces ~1.7 M ton, consumes ~5 M ton — large net importer)
// ═══════════════════════════════════════════════════════════════════════════════
function wRow(state: string, prod: number) {
  return row(state, 'wheat', prod, Math.round(prod * 2.9), STORAGE_TONS[state]! * 0.04);
}
const WHEAT: StateBalance[] = [
  wRow('Baja California',    201_779),
  wRow('Baja California Sur', 29_325),
  wRow('Chiapas',                  7),
  wRow('Chihuahua',           98_353),
  wRow('Coahuila',            16_808),
  wRow('Durango',              3_822),
  wRow('Guanajuato',         413_036),
  wRow('Hidalgo',              2_391),
  wRow('Jalisco',            101_863),
  wRow('Estado de México',     8_020),
  wRow('Michoacán',          153_245),
  wRow('Nuevo León',          23_202),
  wRow('Oaxaca',               8_995),
  wRow('Puebla',               1_790),
  wRow('Querétaro',            2_513),
  wRow('San Luis Potosí',         11),
  wRow('Sinaloa',            192_382),
  wRow('Sonora',             422_420),
  wRow('Tamaulipas',           1_932),
  wRow('Tlaxcala',            35_043),
  wRow('Veracruz',               980),
  wRow('Zacatecas',            7_482),
];

// ═══════════════════════════════════════════════════════════════════════════════
// RICE (Arroz palay) — SIAP 2025 production; demand estimated at production × 1.3
// (Mexico is a modest net importer of rice)
// ═══════════════════════════════════════════════════════════════════════════════
function rRow(state: string, prod: number) {
  return row(state, 'rice', prod, Math.round(prod * 1.3), STORAGE_TONS[state]! * 0.02);
}
const RICE: StateBalance[] = [
  rRow('Campeche',   56_288),
  rRow('Chiapas',       178),
  rRow('Colima',     14_849),
  rRow('Guerrero',    2_356),
  rRow('Jalisco',    11_700),
  rRow('Estado de México', 84),
  rRow('Michoacán',  29_026),
  rRow('Morelos',     6_310),
  rRow('Nayarit',    78_177),
  rRow('Tabasco',     7_014),
  rRow('Tamaulipas', 15_063),
  rRow('Veracruz',   13_908),
];

// ─── Unified export ───────────────────────────────────────────────────────────
export const STATE_BALANCE: StateBalance[] = [
  ...MAIZE,
  ...BEANS,
  ...WHEAT,
  ...RICE,
];

/** Return rows filtered by commodity. */
export function getStateBalance(commodity: Commodity): StateBalance[] {
  return STATE_BALANCE.filter(r => r.commodity === commodity);
}

/** Aggregate KPIs across all states for a commodity. */
export function computeKPIs(commodity: Commodity) {
  const rows = getStateBalance(commodity);
  return {
    totalProduction: rows.reduce((s, r) => s + r.productionTons, 0),
    totalDemand:     rows.reduce((s, r) => s + r.demandTons, 0),
    totalImports:    rows.reduce((s, r) => s + r.importsTons, 0),
    totalSurplus:    rows.filter(r => r.surplusDeficitTons > 0).reduce((s, r) => s + r.surplusDeficitTons, 0),
    totalDeficit:    rows.filter(r => r.surplusDeficitTons < 0).reduce((s, r) => s + Math.abs(r.surplusDeficitTons), 0),
  };
}
