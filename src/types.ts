// ─── Domain enums ─────────────────────────────────────────────────────────────

export type Commodity = 'maize' | 'beans' | 'wheat' | 'rice';

/** What the choropleth / panel focuses on. */
export type ViewMode = 'production' | 'storage';

/** Sub-metric when Vista = Producción (bubbles). */
export type ProductionBubbleMetric = 'total' | 'consumption' | 'balance';

/** Sub-metric when Vista = Almacenamiento (bubbles). */
export type StorageBubbleMetric = 'total' | 'balance';

/**
 * port        — SCT-registered grain port
 * terminal    — SCT-licensed bulk-cargo rail terminal (inland)
 * import_node — corporate node of a maize importer / trader
 * end_consumer — identified industrial end-consumer of imported grain
 */
export type HubType = 'port' | 'terminal' | 'import_node' | 'end_consumer';

// ─── Data contracts ────────────────────────────────────────────────────────────

export interface Hub {
  id: string;
  name: string;
  type: HubType;
  state: string;
  lat: number;
  lng: number;
  /** Annual grain handling capacity in metric tons (ports only) */
  capacityTons?: number;
  notes?: string;
}

export interface StateBalance {
  state: string;
  commodity: Commodity;
  productionTons: number;
  /** Total consumption (human + livestock + industrial) */
  demandTons: number;
  /** Estimated net imports to cover any deficit */
  importsTons: number;
  storageCapacityTons: number;
  storageUtilizationRate: number;
  /** production − demand (positive = surplus, negative = deficit) */
  surplusDeficitTons: number;
  lat: number;
  lng: number;
}

// ─── UI state ─────────────────────────────────────────────────────────────────

export interface UIState {
  commodity: Commodity;
  /** When null, state balance bubbles are hidden. */
  mode: ViewMode | null;
  /** Only applies when `mode === 'production'`: total production, consumption, or surplus/deficit. */
  productionBubbleMetric: ProductionBubbleMetric;
  /** Only applies when `mode === 'storage'`: total capacity vs. capacity − production. */
  storageBubbleMetric: StorageBubbleMetric;
  selectedHubId: string | null;
  selectedState: string | null;
  selectedRegion: string | null;
  selectedRailOperator: string | null;
  hubTypeVisibility: Record<HubType, boolean>;
  railOperatorVisibility: Record<string, boolean>;
  showMaritimeRoutes: boolean;
  /** Active movement group for a selected port (Altura / Cabotaje). */
  portMovGroup: import('./data/puertoMovimientos').PortMovGroup | null;
  /** Active movement sub-metric for a selected port. */
  portMovMetric: import('./data/puertoMovimientos').PortMovMetric | null;
}

// ─── Viz helpers ───────────────────────────────────────────────────────────────

export type RGB  = [number, number, number];
export type RGBA = [number, number, number, number];

export const COMMODITY_COLORS: Record<Commodity, RGB> = {
  maize: [245, 158,  11],   // amber-500
  beans: [180,  83,   9],   // amber-800
  wheat: [253, 224,  71],   // yellow-300
  rice:  [ 16, 185, 129],   // emerald-500
};

export const COMMODITY_LABELS: Record<Commodity, string> = {
  maize: 'Maíz',
  beans: 'Frijol',
  wheat: 'Trigo',
  rice:  'Arroz',
};

export const HUB_TYPE_COLORS: Record<HubType, RGB> = {
  // Chosen to avoid confusion with rail line hues (e.g. KCSM/FSUB cyan, Ferrosur orange).
  port:         [ 37,  99, 235],   // blue-600 — maritime blue, not cyan like many lines
  terminal:     [217,  70, 239],   // fuchsia-500 — inland hubs vs orange/red rail corridors
  import_node:  [167, 139, 250],   // violet-400
  end_consumer: [ 74, 222, 128],   // green-400
};

export const HUB_TYPE_LABELS: Record<HubType, string> = {
  port:         'Puerto granelero',
  terminal:     'Terminal ferroviaria permisionada',
  import_node:  'Nodo importador / comercializador',
  end_consumer: 'Consumidor industrial final',
};

export const MODE_LABELS: Record<ViewMode, string> = {
  production: 'Producción',
  storage:      'Almacenamiento',
};

export const PRODUCTION_BUBBLE_LABELS: Record<ProductionBubbleMetric, string> = {
  total:       'Total',
  consumption: 'Consumo',
  balance:     'Balance',
};

export const STORAGE_BUBBLE_LABELS: Record<StorageBubbleMetric, string> = {
  total:   'Total',
  balance: 'Balance',
};
