// ─── Domain enums ─────────────────────────────────────────────────────────────

export type Commodity = 'maize' | 'beans' | 'wheat' | 'rice';

/** What the choropleth / panel focuses on. */
export type ViewMode = 'production' | 'consumption' | 'storage';

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
  mode: ViewMode;
  selectedHubId: string | null;
  selectedState: string | null;
  selectedRailOperator: string | null;
  hubTypeVisibility: Record<HubType, boolean>;
  showRailNetwork: boolean;
  railOperatorVisibility: Record<string, boolean>;
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
  port:         [ 56, 189, 248],   // sky-400
  terminal:     [251, 146,  60],   // orange-400
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
  production:  'Producción',
  consumption: 'Consumo',
  storage:     'Almacenamiento',
};
