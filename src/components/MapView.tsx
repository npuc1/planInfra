import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import type { PickingInfo, MapViewState } from '@deck.gl/core';
import { FlyToInterpolator } from '@deck.gl/core';
import type { Layer } from '@deck.gl/core';
import type { Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  COMMODITY_LABELS,
  HUB_TYPE_COLORS,
  HUB_TYPE_LABELS,
  MODE_LABELS,
  PRODUCTION_BUBBLE_LABELS,
  STORAGE_BUBBLE_LABELS,
  type Commodity,
  type Hub,
  type ProductionBubbleMetric,
  type StorageBubbleMetric,
  type ViewMode,
} from '../types';
import { HUB_BY_ID } from '../data/hubs';
import { REGIONS, REGION_STATES, REGION_VIEW } from '../data/regions';
import {
  US_ORIGIN_ID,
  IMPORT_NODE_VOLUMES,
  CONSUMER_VOLUMES,
  CONSUMER_PROVIDER,
} from '../data/importFlows';
import { STATE_BALANCE } from '../data/stateBalance';
import { RAIL_OPERATOR_COLORS, RAIL_OPERATOR_NAMES } from '../data/railNetwork';

// ─── Basemap definitions ───────────────────────────────────────────────────────

export type BasemapId = 'dark' | 'light' | 'gray';

const GRAYSCALE_STYLE = {
  version: 8 as const,
  sources: {
    otm: {
      type: 'raster' as const,
      tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenTopoMap (CC-BY-SA) | © OpenStreetMap contributors',
    },
  },
  layers: [{
    id: 'otm',
    type: 'raster' as const,
    source: 'otm',
    paint: { 'raster-saturation': -1 },
  }],
};

export const BASEMAP_STYLES: Record<BasemapId, string | typeof GRAYSCALE_STYLE> = {
  dark:  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  gray:  GRAYSCALE_STYLE,
};

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -101.5,
  latitude: 22.5,
  zoom: 5.1,
  pitch: 30,
  bearing: 0,
};

/** MapLibre built-in UI (controls, cooperative gestures, etc.) */
const MAPLIBRE_LOCALE_ES: Record<string, string> = {
  'AttributionControl.ToggleAttribution': 'Mostrar u ocultar atribución',
  'AttributionControl.MapFeedback': 'Comentarios sobre el mapa',
  'FullscreenControl.Enter': 'Pantalla completa',
  'FullscreenControl.Exit': 'Salir de pantalla completa',
  'GeolocateControl.FindMyLocation': 'Mostrar mi ubicación',
  'GeolocateControl.LocationNotAvailable': 'Ubicación no disponible',
  'LogoControl.Title': 'Logotipo de MapLibre',
  'Map.Title': 'Mapa',
  'Marker.Title': 'Marcador en el mapa',
  'NavigationControl.ResetBearing': 'Arrastra para rotar el mapa; clic para restablecer el norte',
  'NavigationControl.ZoomIn': 'Acercar',
  'NavigationControl.ZoomOut': 'Alejar',
  'Popup.Close': 'Cerrar ventana',
  'ScaleControl.Feet': 'pies',
  'ScaleControl.Meters': 'm',
  'ScaleControl.Kilometers': 'km',
  'ScaleControl.Miles': 'mi',
  'ScaleControl.NauticalMiles': 'nm',
  'GlobeControl.Enable': 'Activar vista de globo',
  'GlobeControl.Disable': 'Desactivar vista de globo',
  'TerrainControl.Enable': 'Activar relieve',
  'TerrainControl.Disable': 'Desactivar relieve',
  'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rueda para acercar o alejar el mapa',
  'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rueda para acercar o alejar el mapa',
  'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa',
};

/** Prefer Spanish `name:es` from OpenMapTiles-style data (CARTO basemap). */
const LABEL_ES_COALESCE = ['coalesce', ['get', 'name:es'], ['get', 'name'], ['get', 'name_en']] as const;

const LABEL_ES_COALESCE_NO_EN = ['coalesce', ['get', 'name:es'], ['get', 'name']] as const;

function localizeCartoTextField(field: unknown): unknown {
  if (field === '{name_en}') return LABEL_ES_COALESCE;
  if (field === '{name}') return LABEL_ES_COALESCE_NO_EN;
  if (field === '{housenumber}') return field;
  if (field && typeof field === 'object' && 'stops' in field) {
    const o = field as { stops: [number, unknown][] };
    return {
      ...field,
      stops: o.stops.map(([z, v]) => [z, localizeCartoTextField(v)] as [number, unknown]),
    };
  }
  return field;
}

function applySpanishBasemapLabels(map: MaplibreMap) {
  const style = map.getStyle();
  if (!style?.layers) return;
  for (const layer of style.layers) {
    if (layer.type !== 'symbol') continue;
    const tf = layer.layout?.['text-field' as keyof typeof layer.layout];
    if (tf === undefined) continue;
    const next = localizeCartoTextField(tf);
    if (next !== tf) {
      try {
        map.setLayoutProperty(layer.id, 'text-field', next as never);
      } catch {
        /* layer not ready */
      }
    }
  }
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const TOOLTIP_BASE_STYLE = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  color: '#f1f5f9',
  padding: '8px 12px',
  borderRadius: '8px',
  pointerEvents: 'none',
} as const;

function getTooltipContent(
  info: PickingInfo,
  bubbleUi: {
    mode: ViewMode;
    productionBubbleMetric: ProductionBubbleMetric;
    storageBubbleMetric: StorageBubbleMetric;
  } | null,
): { html: string; style: object } | null {
  if (!info.object) return null;
  const obj = info.object as Record<string, unknown>;

  // ── Import arc / US origin ──────────────────────────────────────────────────
  if (obj._isArc) {
    const name = String(obj.name);
    const tons = (obj.tons as number).toLocaleString('es-MX');
    return {
      html: `<div style="font-family:system-ui;font-size:12px;line-height:1.6">
        <strong style="display:block;font-size:13px;margin-bottom:3px">${name}</strong>
        <span style="opacity:0.65">Maíz importado:&nbsp;</span><strong>${tons} T.M./año</strong>
      </div>`,
      style: { ...TOOLTIP_BASE_STYLE, border: '1px solid rgba(167,139,250,0.35)' },
    };
  }
  if (obj.id === US_ORIGIN_ID) {
    return {
      html: `<div style="font-family:system-ui;font-size:12px;line-height:1.6">
        <strong style="display:block;font-size:13px;margin-bottom:3px">Origen EE.UU.</strong>
        <span style="opacity:0.65">Clic para ver todos los flujos de importación</span>
      </div>`,
      style: { ...TOOLTIP_BASE_STYLE, border: '1px solid rgba(255,200,60,0.4)' },
    };
  }

  // ── State bubble ───────────────────────────────────────────────────────────
  if (obj._isBubble && bubbleUi) {
    const stateName = String(obj.state);
    const prodN = obj.productionTons as number;
    const demN = obj.demandTons as number;
    const storN = obj.storageCapacityTons as number;
    const { mode: bm, productionBubbleMetric, storageBubbleMetric } = bubbleUi;

    let line = '';
    let border = '1px solid rgba(255,255,255,0.15)';

    if (bm === 'production') {
      if (productionBubbleMetric === 'total') {
        line = `<span style="opacity:0.65">Producción:&nbsp;</span><strong>${prodN.toLocaleString('es-MX')} T.M.</strong>`;
      } else if (productionBubbleMetric === 'consumption') {
        line = `<span style="opacity:0.65">Consumo estimado:&nbsp;</span><strong>${demN.toLocaleString('es-MX')} T.M.</strong>`;
      } else {
        const net = prodN - demN;
        const sign = net >= 0 ? '+' : '−';
        const abs = Math.abs(net).toLocaleString('es-MX');
        border = net >= 0 ? '1px solid rgba(74,222,128,0.45)' : '1px solid rgba(248,113,113,0.45)';
        line = `<span style="opacity:0.65">Producción − consumo:&nbsp;</span><strong>${sign}${abs} T.M.</strong>`;
      }
    } else if (bm === 'storage') {
      if (storageBubbleMetric === 'balance') {
        const net = storN - prodN;
        const sign = net >= 0 ? '+' : '−';
        const abs = Math.abs(net).toLocaleString('es-MX');
        border = net >= 0 ? '1px solid rgba(74,222,128,0.45)' : '1px solid rgba(248,113,113,0.45)';
        line = `<span style="opacity:0.65">Almacén − producción:&nbsp;</span><strong>${sign}${abs} T.M.</strong>`;
      } else {
        line = `<span style="opacity:0.65">Capacidad de almacenamiento:&nbsp;</span><strong>${storN.toLocaleString('es-MX')} T.M.</strong>`;
      }
    }

    return {
      html: `<div style="font-family:system-ui;font-size:12px;line-height:1.6">
        <strong style="display:block;font-size:13px;margin-bottom:2px">${stateName}</strong>
        ${line}
      </div>`,
      style: { ...TOOLTIP_BASE_STYLE, border },
    };
  }

  // ── Rail segment ───────────────────────────────────────────────────────────
  if (obj._isRail) {
    const name  = String(obj.operatorName);
    const route = String(obj.routeGroup);
    return {
      html: `<div style="font-family:system-ui;font-size:12px;line-height:1.6">
        <strong style="display:block;font-size:13px;margin-bottom:2px">${name}</strong>
        <span style="opacity:0.65">${route}</span>
      </div>`,
      style: { ...TOOLTIP_BASE_STYLE, border: '1px solid rgba(255,255,255,0.12)' },
    };
  }

  // ── Hub ────────────────────────────────────────────────────────────────────
  const hub = info.object as Hub;
  if (!('type' in hub && 'state' in hub && 'lat' in hub)) return null;
  return {
    html: `<div style="font-family:system-ui;font-size:12px;line-height:1.5">
      <strong style="display:block;font-size:13px;margin-bottom:2px">${hub.name}</strong>
      <span style="opacity:0.7">${hub.state}</span>
    </div>`,
    style: { ...TOOLTIP_BASE_STYLE, border: '1px solid rgba(255,255,255,0.12)' },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTons(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M T.M.`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)} K T.M.`;
  return `${n} T.M.`;
}

// ─── InfoTile ─────────────────────────────────────────────────────────────────

const TOTAL_IMPORT_TONS = Object.values(IMPORT_NODE_VOLUMES).reduce((a, b) => a + b, 0);

function StorageMinusProdRow({ storageTons, productionTons }: { storageTons: number; productionTons: number }) {
  const net = storageTons - productionTons;
  const netColor = net >= 0 ? 'rgb(74,222,128)' : 'rgb(248,113,113)';
  const netText = net >= 0 ? `+${fmtTons(net)}` : `−${fmtTons(Math.abs(net))}`;
  return (
    <div className="col-span-2 bg-slate-800/60 rounded-md px-2.5 py-2">
      <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-1">
        Almacén − producción
      </p>
      <p className="text-sm font-bold leading-tight" style={{ color: netColor }}>{netText}</p>
    </div>
  );
}

interface InfoTileProps {
  selectedHubId: string | null;
  selectedArcId: string | null;
  selectedRailOperator: string | null;
  selectedState: string | null;
  selectedRegion: string | null;
  commodity: Commodity;
  mode: ViewMode | null;
  productionBubbleMetric: ProductionBubbleMetric;
  storageBubbleMetric: StorageBubbleMetric;
  onClearHub: () => void;
  onClearArc: () => void;
  onClearRailOperator: () => void;
  onClearState: () => void;
  onClearRegion: () => void;
}

function InfoTile({
  selectedHubId, selectedArcId, selectedRailOperator, selectedState, selectedRegion,
  commodity, mode, productionBubbleMetric, storageBubbleMetric,
  onClearHub, onClearArc, onClearRailOperator, onClearState, onClearRegion,
}: InfoTileProps) {
  const hasAny = selectedArcId || selectedRailOperator || selectedHubId || selectedState || selectedRegion;
  if (!hasAny) return null;

  // ── US origin ────────────────────────────────────────────────────────────
  if (selectedArcId === US_ORIGIN_ID) {
    return (
      <TileShell accentColor="rgb(255,200,60)" onClose={onClearArc}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgb(255,200,60)' }}>
          Origen de importaciones
        </p>
        <p className="text-sm font-bold text-white leading-tight">EE.UU. · Cinturón maicero</p>
        <p className="text-xs text-slate-400 mt-0.5">Kansas / Oklahoma · origen agregado</p>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <InfoStat label="Volumen total estimado" value={fmtTons(TOTAL_IMPORT_TONS)} />
          <InfoStat label="Nodos importadores" value={String(Object.keys(IMPORT_NODE_VOLUMES).length)} />
        </div>
      </TileShell>
    );
  }

  // ── Branch arc (import_node → end_consumer) ──────────────────────────────
  if (selectedArcId?.startsWith('branch-')) {
    const consumerId = selectedArcId.slice(7);
    const consumer   = HUB_BY_ID[consumerId] as Hub | undefined;
    const providerId = CONSUMER_PROVIDER[consumerId];
    const provider   = HUB_BY_ID[providerId] as Hub | undefined;
    const tons       = CONSUMER_VOLUMES[consumerId];
    const [r, g, b]  = HUB_TYPE_COLORS.end_consumer;
    if (!consumer) return null;
    return (
      <TileShell accentColor={`rgb(${r},${g},${b})`} onClose={onClearArc}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: `rgb(${r},${g},${b})` }}>
          {HUB_TYPE_LABELS.end_consumer}
        </p>
        <p className="text-sm font-bold text-white leading-tight">{consumer.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{consumer.state}</p>
        {consumer.notes && (
          <p className="text-xs text-slate-500 italic mt-1.5 leading-snug">{consumer.notes}</p>
        )}
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <InfoStat label="Volumen estimado" value={fmtTons(tons ?? 0)} />
          {provider && <InfoStat label="Proveedor" value={provider.name} />}
        </div>
      </TileShell>
    );
  }

  // ── Import arc (US → import_node) ────────────────────────────────────────
  if (selectedArcId) {
    const hub   = HUB_BY_ID[selectedArcId] as Hub | undefined;
    const tons  = IMPORT_NODE_VOLUMES[selectedArcId];
    const [r, g, b] = HUB_TYPE_COLORS.import_node;
    if (!hub) return null;
    return (
      <TileShell accentColor={`rgb(${r},${g},${b})`} onClose={onClearArc}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: `rgb(${r},${g},${b})` }}>
          {HUB_TYPE_LABELS.import_node}
        </p>
        <p className="text-sm font-bold text-white leading-tight">{hub.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{hub.state}</p>
        {hub.notes && (
          <p className="text-xs text-slate-500 italic mt-1.5 leading-snug">{hub.notes}</p>
        )}
        <div className="mt-2.5 grid grid-cols-1 gap-1.5">
          <InfoStat label="Volumen importado estimado" value={fmtTons(tons ?? 0)} sub="por año" />
        </div>
      </TileShell>
    );
  }

  // ── Rail operator ────────────────────────────────────────────────────────
  if (selectedRailOperator) {
    const name  = RAIL_OPERATOR_NAMES[selectedRailOperator] ?? selectedRailOperator;
    const [r, g, b] = RAIL_OPERATOR_COLORS[selectedRailOperator] ?? [180, 180, 180];
    const accent = `rgb(${r},${g},${b})`;
    return (
      <TileShell accentColor={accent} onClose={onClearRailOperator}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: accent }}>
          Red ferroviaria · {selectedRailOperator}
        </p>
        <p className="text-sm font-bold text-white leading-tight">{name}</p>
      </TileShell>
    );
  }

  // ── Hub ──────────────────────────────────────────────────────────────────
  if (selectedHubId) {
    const hub = HUB_BY_ID[selectedHubId] as Hub | undefined;
    if (!hub) return null;
    const [r, g, b] = HUB_TYPE_COLORS[hub.type];
    return (
      <TileShell accentColor={`rgb(${r},${g},${b})`} onClose={onClearHub}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: `rgb(${r},${g},${b})` }}>
          {HUB_TYPE_LABELS[hub.type]}
        </p>
        <p className="text-sm font-bold text-white leading-tight">{hub.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{hub.state}</p>
        {hub.notes && (
          <p className="text-xs text-slate-500 italic mt-1.5 leading-snug">{hub.notes}</p>
        )}
        {hub.capacityTons !== undefined && (
          <div className="mt-2.5">
            <InfoStat label="Capacidad de manejo" value={fmtTons(hub.capacityTons)} sub="por año" />
          </div>
        )}
      </TileShell>
    );
  }

  // ── State balance ─────────────────────────────────────────────────────────
  if (selectedState) {
    const row = STATE_BALANCE.find(r => r.state === selectedState && r.commodity === commodity);
    const [cr, cg, cb] = [148, 163, 184]; // slate-400
    const accent = `rgb(${cr},${cg},${cb})`;
    const modeLabel = mode ? MODE_LABELS[mode] : 'Ninguna';
    const surplus = row?.surplusDeficitTons ?? 0;
    const surplusColor = surplus >= 0 ? 'rgb(74,222,128)' : 'rgb(248,113,113)';
    const surplusLabel = surplus >= 0 ? `+${fmtTons(surplus)} superávit` : `${fmtTons(Math.abs(surplus))} déficit`;
    return (
      <TileShell accentColor={accent} onClose={onClearState}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: accent }}>
          Balance estatal · {COMMODITY_LABELS[commodity]}
        </p>
        <p className="text-sm font-bold text-white leading-tight">{selectedState}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Vista: {modeLabel}
          {mode === 'production' && (
            <span className="text-slate-500"> · {PRODUCTION_BUBBLE_LABELS[productionBubbleMetric]}</span>
          )}
          {mode === 'storage' && (
            <span className="text-slate-500"> · {STORAGE_BUBBLE_LABELS[storageBubbleMetric]}</span>
          )}
        </p>
        {row ? (
          <>
            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
              <InfoStat label="Producción" value={fmtTons(row.productionTons)} />
              <InfoStat label="Consumo estimado" value={fmtTons(row.demandTons)} />
              <InfoStat label="Almacenamiento" value={fmtTons(row.storageCapacityTons)} />
              <div className="bg-slate-800/60 rounded-md px-2.5 py-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-1">Balance</p>
                <p className="text-sm font-bold leading-tight" style={{ color: surplusColor }}>{surplusLabel}</p>
              </div>
              {mode === 'storage' && storageBubbleMetric === 'balance' && (
                <StorageMinusProdRow
                  storageTons={row.storageCapacityTons}
                  productionTons={row.productionTons}
                />
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500 mt-2">Sin datos para este grano.</p>
        )}
      </TileShell>
    );
  }

  // ── Region balance ────────────────────────────────────────────────────────
  if (selectedRegion) {
    const members = REGION_STATES[selectedRegion] ?? [];
    const rows = STATE_BALANCE.filter(r => members.includes(r.state) && r.commodity === commodity);
    const production = rows.reduce((s, r) => s + r.productionTons, 0);
    const demand     = rows.reduce((s, r) => s + r.demandTons, 0);
    const storage    = rows.reduce((s, r) => s + r.storageCapacityTons, 0);
    const balance    = rows.reduce((s, r) => s + r.surplusDeficitTons, 0);
    const balanceColor = balance >= 0 ? 'rgb(74,222,128)' : 'rgb(248,113,113)';
    const balanceLabel = balance >= 0
      ? `+${fmtTons(balance)} superávit`
      : `−${fmtTons(Math.abs(balance))} déficit`;
    const accent = 'rgb(148,163,184)';
    return (
      <TileShell accentColor={accent} onClose={onClearRegion}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: accent }}>
          Región · {COMMODITY_LABELS[commodity]}
        </p>
        <p className="text-sm font-bold text-white leading-tight">{selectedRegion}</p>
        <p className="text-xs text-slate-400 mt-0.5">{members.length} estados</p>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <InfoStat label="Producción" value={fmtTons(production)} />
          <InfoStat label="Consumo est." value={fmtTons(demand)} />
          <InfoStat label="Almacenamiento" value={fmtTons(storage)} />
          <div className="bg-slate-800/60 rounded-md px-2.5 py-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-1">Balance neto</p>
            <p className="text-sm font-bold leading-tight" style={{ color: balanceColor }}>{balanceLabel}</p>
          </div>
        </div>
      </TileShell>
    );
  }

  return null;
}

function TileShell({
  accentColor,
  onClose,
  children,
}: {
  accentColor: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute bottom-6 left-4 z-10 w-64 bg-slate-900/95 backdrop-blur-sm rounded-xl p-4 shadow-xl pointer-events-auto"
      style={{ border: `1px solid ${accentColor}40` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">{children}</div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 text-base leading-none flex-shrink-0 mt-0.5 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function InfoStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-800/60 rounded-md px-2.5 py-2">
      <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-1">{label}</p>
      <p className="text-sm font-bold text-white leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── MapView ─────────────────────────────────────────────────────────────────

interface MapViewProps {
  layers: Layer[];
  onHubClick: (hubId: string) => void;
  onClearArcSelection: () => void;
  onClearHub: () => void;
  selectedState: string | null;
  onSelectState: (stateName: string | null) => void;
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
  selectedHubId: string | null;
  selectedArcId: string | null;
  selectedRailOperator: string | null;
  onClearRailOperator: () => void;
  commodity: Commodity;
  mode: ViewMode | null;
  productionBubbleMetric: ProductionBubbleMetric;
  storageBubbleMetric: StorageBubbleMetric;
  basemap: BasemapId;
}

export function MapView({
  layers,
  onHubClick,
  onClearArcSelection,
  onClearHub,
  selectedState,
  onSelectState,
  selectedRegion,
  onSelectRegion,
  selectedHubId,
  selectedArcId,
  selectedRailOperator,
  onClearRailOperator,
  commodity,
  mode,
  productionBubbleMetric,
  storageBubbleMetric,
  basemap,
}: MapViewProps) {
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const mapRef       = useRef<MaplibreMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMapLoad = useCallback((e: { target: MaplibreMap }) => {
    mapRef.current = e.target;
    applySpanishBasemapLabels(e.target);
    e.target.on('style.load', () => applySpanishBasemapLabels(e.target));
  }, []);

  // Export: flag triggers a deck.gl re-render; we capture inside onAfterRender
  // while the WebGL buffer is still populated (before browser compositor clears it).
  const exportPendingRef = useRef(false);
  const [, setExportTick] = useState(0);

  const handleExport = useCallback(() => {
    exportPendingRef.current = true;
    setExportTick(t => t + 1);
  }, []);

  const handleAfterRender = useCallback(() => {
    if (!exportPendingRef.current) return;
    exportPendingRef.current = false;

    const map = mapRef.current;
    if (!map || !containerRef.current) return;

    const mapCanvas  = map.getCanvas();
    const w = mapCanvas.width;
    const h = mapCanvas.height;

    const allCanvases = Array.from(containerRef.current.querySelectorAll('canvas'));
    const deckCanvas  = allCanvases.find(c => c !== mapCanvas) ?? null;

    const out = document.createElement('canvas');
    out.width  = w;
    out.height = h;
    const ctx  = out.getContext('2d')!;
    ctx.drawImage(mapCanvas, 0, 0);
    if (deckCanvas) ctx.drawImage(deckCanvas, 0, 0, w, h);

    out.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `mapa_granos_${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, []);

  useEffect(() => {
    if (!selectedRegion) return;
    const v = REGION_VIEW[selectedRegion];
    if (!v) return;
    setViewState(prev => ({
      ...prev,
      ...v,
      transitionDuration: 800,
      transitionInterpolator: new FlyToInterpolator(),
    }));
  }, [selectedRegion]);

  const getTooltip = useCallback(
    (info: PickingInfo) =>
      getTooltipContent(
        info,
        mode ? { mode, productionBubbleMetric, storageBubbleMetric } : null,
      ),
    [mode, productionBubbleMetric, storageBubbleMetric],
  );

  const handleClick = useCallback(
    (info: PickingInfo) => {
      const obj = info.object as Record<string, unknown> | null;
      if (obj && 'type' in obj && 'lat' in obj) {
        // Hub clicked — clear any locked arc
        onClearArcSelection();
        onHubClick(obj.id as string);
      } else if (!obj) {
        // Empty space — clear arc selection only; other tiles stay until explicitly closed
        onClearArcSelection();
      }
      // _isArc, id===US_ORIGIN_ID, _isBubble, _isRail: handled by their layer's own onClick
    },
    [onHubClick, onClearArcSelection],
  );

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => setViewState(vs as MapViewState)}
        controller={true}
        layers={layers}
        onClick={handleClick}
        getTooltip={getTooltip}
        style={{ position: 'absolute', inset: '0' }}
        onAfterRender={handleAfterRender}
      >
        <Map
          mapStyle={BASEMAP_STYLES[basemap] as never}
          reuseMaps
          locale={MAPLIBRE_LOCALE_ES}
          onLoad={handleMapLoad}
          preserveDrawingBuffer={true}
        />
      </DeckGL>

      {/* ── Region filter ── */}
      <div className="absolute top-3 right-3 z-10 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedRegion ?? ''}
              onChange={e => onSelectRegion(e.target.value || null)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-3 py-1.5 pr-7 focus:outline-none focus:border-slate-500 cursor-pointer"
            >
              <option value="">Todas las regiones</option>
              {REGIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
          </div>
          {selectedRegion && (
            <button
              onClick={() => onSelectRegion(null)}
              className="text-slate-500 hover:text-slate-300 text-sm leading-none transition-colors"
              title="Limpiar filtro"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Info tile ── */}
      <InfoTile
        selectedHubId={selectedHubId}
        selectedArcId={selectedArcId}
        selectedRailOperator={selectedRailOperator}
        selectedState={selectedState}
        selectedRegion={selectedRegion}
        commodity={commodity}
        mode={mode}
        productionBubbleMetric={productionBubbleMetric}
        storageBubbleMetric={storageBubbleMetric}
        onClearHub={onClearHub}
        onClearArc={onClearArcSelection}
        onClearRailOperator={onClearRailOperator}
        onClearState={() => onSelectState(null)}
        onClearRegion={() => onSelectRegion(null)}
      />

      {/* ── Export button ── */}
      <button
        onClick={handleExport}
        title="Exportar mapa como PNG"
        className="absolute bottom-8 right-3 z-10 flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs rounded-md px-2.5 py-1.5 shadow-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Exportar mapa
      </button>

      {/* ── Attribution ── */}
      <div className="absolute bottom-2 right-3 text-slate-600 text-[10px] pointer-events-none select-none">
        Mapa base © CARTO · deck.gl · MapLibre GL
      </div>
    </div>
  );
}
