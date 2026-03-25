// Source: data/data/puertos_movimientos.xlsx
// Columns: Puerto | Litoral | Altura (Exportación, Importación) | Cabotaje (Salida, Entrada)
// Keyed by hub ID from hubs.ts

export type PortMovGroup  = 'altura' | 'cabotaje' | 'proporcion';
export type PortMovMetric = 'exportacion' | 'importacion' | 'salida' | 'entrada';

export interface PortMovData {
  altura:   { exportacion: number; importacion: number };
  cabotaje: { salida: number; entrada: number };
}

/** Movement data (T.M./year) for each port hub ID. */
export const PUERTO_MOVIMIENTOS: Record<string, PortMovData> = {
  // Veracruz, Veracruz
  'P-001': { altura: { exportacion: 68_832, importacion: 9_178_404 }, cabotaje: { salida: 0, entrada: 0 } },
  // Topolobampo, Sinaloa
  'P-002': { altura: { exportacion: 0, importacion: 0 }, cabotaje: { salida: 591_671, entrada: 0 } },
  // Manzanillo, Colima
  'P-003': { altura: { exportacion: 0, importacion: 1_690_486 }, cabotaje: { salida: 0, entrada: 0 } },
  // Tuxpan, Veracruz
  'P-004': { altura: { exportacion: 0, importacion: 1_813_598 }, cabotaje: { salida: 0, entrada: 0 } },
  // Lázaro Cárdenas, Michoacán
  'P-005': { altura: { exportacion: 0, importacion: 0 }, cabotaje: { salida: 0, entrada: 0 } },
  // Coatzacoalcos, Veracruz
  'P-006': { altura: { exportacion: 91_498, importacion: 1_044_375 }, cabotaje: { salida: 0, entrada: 182_232 } },
  // Progreso, Yucatán
  'P-007': { altura: { exportacion: 17_678, importacion: 2_554_562 }, cabotaje: { salida: 0, entrada: 107_087 } },
  // Guaymas, Sonora
  'P-008': { altura: { exportacion: 381_245, importacion: 0 }, cabotaje: { salida: 0, entrada: 0 } },
  // Altamira, Tamaulipas
  'P-009': { altura: { exportacion: 0, importacion: 1_306_559 }, cabotaje: { salida: 0, entrada: 43_286 } },
  // Puerto de Ensenada — not in dataset, zeroed
  'P-010': { altura: { exportacion: 0, importacion: 0 }, cabotaje: { salida: 0, entrada: 0 } },
  // Salina Cruz, Oaxaca
  'P-011': { altura: { exportacion: 0, importacion: 6_215 }, cabotaje: { salida: 0, entrada: 52_087 } },
  // Tampico, Tamaulipas
  'P-012': { altura: { exportacion: 76_868, importacion: 0 }, cabotaje: { salida: 0, entrada: 0 } },
  // Puerto Chiapas, Chiapas
  'P-013': { altura: { exportacion: 27_000, importacion: 0 }, cabotaje: { salida: 0, entrada: 88_924 } },
};

export const PORT_MOV_GROUP_LABELS: Record<PortMovGroup, string> = {
  altura:    'Altura',
  cabotaje:  'Cabotaje',
  proporcion: 'Proporción',
};

export const PORT_MOV_METRIC_LABELS: Record<PortMovMetric, string> = {
  exportacion: 'Exportación',
  importacion: 'Importación',
  salida:      'Salida',
  entrada:     'Entrada',
};

export const GROUP_METRICS: Record<PortMovGroup, PortMovMetric[]> = {
  altura:    ['exportacion', 'importacion'],
  cabotaje:  ['salida', 'entrada'],
  proporcion: [],
};

export function getPortMovValue(data: PortMovData, group: PortMovGroup, metric: PortMovMetric): number {
  if (group === 'altura') {
    return metric === 'exportacion' ? data.altura.exportacion : data.altura.importacion;
  }
  return metric === 'salida' ? data.cabotaje.salida : data.cabotaje.entrada;
}
