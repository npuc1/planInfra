import { useCallback, useState, type ReactNode } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import type { PickingInfo, MapViewState } from '@deck.gl/core';
import type { Layer } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';

import { COMMODITY_LABELS, HUB_TYPE_COLORS, HUB_TYPE_LABELS, MODE_LABELS, type Commodity, type Hub, type ViewMode } from '../types';
import { HUB_BY_ID, HUB_STATES } from '../data/hubs';
import {
  US_ORIGIN_ID,
  IMPORT_NODE_VOLUMES,
  CONSUMER_VOLUMES,
  CONSUMER_PROVIDER,
} from '../data/importFlows';
import { STATE_BALANCE } from '../data/stateBalance';
import { RAIL_OPERATOR_COLORS, RAIL_OPERATOR_NAMES } from '../data/railNetwork';

// ─── Constants ─────────────────────────────────────────────────────────────────

// CARTO Dark Matter — free, no API key required
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -101.5,
  latitude: 22.5,
  zoom: 5.1,
  pitch: 30,
  bearing: 0,
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const TOOLTIP_BASE_STYLE = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  color: '#f1f5f9',
  padding: '8px 12px',
  borderRadius: '8px',
  pointerEvents: 'none',
} as const;

function getTooltipContent(info: PickingInfo): { html: string; style: object } | null {
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
  if (obj._isBubble) {
    const state = String(obj.state);
    const prod  = (obj.productionTons as number).toLocaleString('es-MX');
    return {
      html: `<div style="font-family:system-ui;font-size:12px;line-height:1.6">
        <strong style="display:block;font-size:13px;margin-bottom:2px">${state}</strong>
        <span style="opacity:0.65">Producción:&nbsp;</span><strong>${prod} T.M.</strong>
      </div>`,
      style: { ...TOOLTIP_BASE_STYLE, border: '1px solid rgba(255,255,255,0.15)' },
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

interface InfoTileProps {
  selectedHubId: string | null;
  selectedArcId: string | null;
  selectedRailOperator: string | null;
  selectedState: string | null;
  commodity: Commodity;
  mode: ViewMode;
  onClearHub: () => void;
  onClearArc: () => void;
  onClearRailOperator: () => void;
  onClearState: () => void;
}

function InfoTile({
  selectedHubId, selectedArcId, selectedRailOperator, selectedState,
  commodity, mode,
  onClearHub, onClearArc, onClearRailOperator, onClearState,
}: InfoTileProps) {
  const hasAny = selectedArcId || selectedRailOperator || selectedHubId || selectedState;
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
        <p className="text-xs text-slate-400 mt-0.5">Clic en cualquier tramo para más contexto</p>
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
    const modeLabel = MODE_LABELS[mode];
    const surplus = row?.surplusDeficitTons ?? 0;
    const surplusColor = surplus >= 0 ? 'rgb(74,222,128)' : 'rgb(248,113,113)';
    const surplusLabel = surplus >= 0 ? `+${fmtTons(surplus)} superávit` : `${fmtTons(Math.abs(surplus))} déficit`;
    return (
      <TileShell accentColor={accent} onClose={onClearState}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: accent }}>
          Balance estatal · {COMMODITY_LABELS[commodity]}
        </p>
        <p className="text-sm font-bold text-white leading-tight">{selectedState}</p>
        <p className="text-xs text-slate-400 mt-0.5">Vista: {modeLabel}</p>
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
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500 mt-2">Sin datos para este grano.</p>
        )}
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
  selectedHubId: string | null;
  selectedArcId: string | null;
  selectedRailOperator: string | null;
  onClearRailOperator: () => void;
  commodity: Commodity;
  mode: ViewMode;
}

export function MapView({
  layers,
  onHubClick,
  onClearArcSelection,
  onClearHub,
  selectedState,
  onSelectState,
  selectedHubId,
  selectedArcId,
  selectedRailOperator,
  onClearRailOperator,
  commodity,
  mode,
}: MapViewProps) {
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);

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
    <div className="flex-1 relative overflow-hidden">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => setViewState(vs as MapViewState)}
        controller={true}
        layers={layers}
        onClick={handleClick}
        getTooltip={getTooltipContent}
        style={{ position: 'absolute', inset: '0' }}
      >
        <Map
          mapStyle={MAP_STYLE}
          reuseMaps
        />
      </DeckGL>

      {/* ── State filter ── */}
      <div className="absolute top-3 right-3 z-10 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedState ?? ''}
              onChange={e => onSelectState(e.target.value || null)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-3 py-1.5 pr-7 focus:outline-none focus:border-slate-500 cursor-pointer"
            >
              <option value="">Todos los estados</option>
              {HUB_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
          </div>
          {selectedState && (
            <button
              onClick={() => onSelectState(null)}
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
        commodity={commodity}
        mode={mode}
        onClearHub={onClearHub}
        onClearArc={onClearArcSelection}
        onClearRailOperator={onClearRailOperator}
        onClearState={() => onSelectState(null)}
      />

      {/* ── Attribution ── */}
      <div className="absolute bottom-2 right-3 text-slate-600 text-[10px] pointer-events-none select-none">
        Mapa base © CARTO · deck.gl · MapLibre GL
      </div>
    </div>
  );
}
