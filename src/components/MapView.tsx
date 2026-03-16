import { useCallback, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import type { PickingInfo, MapViewState } from '@deck.gl/core';
import type { Layer } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { Hub } from '../types';

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

  // ── Import arc ─────────────────────────────────────────────────────────────
  if (obj._isArc) {
    const name = String(obj.name);
    const tons = (obj.tons as number).toLocaleString('es-MX');
    return {
      html: `
        <div style="font-family:system-ui;font-size:12px;line-height:1.6">
          <strong style="display:block;font-size:13px;margin-bottom:3px">${name}</strong>
          <span style="opacity:0.65">Maíz importado:&nbsp;</span>
          <strong>${tons} T.M./año</strong>
        </div>
      `,
      style: { ...TOOLTIP_BASE_STYLE, border: '1px solid rgba(167,139,250,0.35)' },
    };
  }

  // ── Hub ────────────────────────────────────────────────────────────────────
  const hub = info.object as Hub;
  if (!('type' in hub && 'state' in hub && 'lat' in hub)) return null;

  return {
    html: `
      <div style="font-family:system-ui;font-size:12px;line-height:1.5">
        <strong style="display:block;font-size:13px;margin-bottom:2px">${hub.name}</strong>
        <span style="opacity:0.7">${hub.state}</span>
      </div>
    `,
    style: { ...TOOLTIP_BASE_STYLE, border: '1px solid rgba(255,255,255,0.12)' },
  };
}

// ─── MapView ─────────────────────────────────────────────────────────────────

interface MapViewProps {
  layers: Layer[];
  onHubClick: (hubId: string) => void;
  onClearArcSelection: () => void;
}

export function MapView({ layers, onHubClick, onClearArcSelection }: MapViewProps) {
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);

  const handleClick = useCallback(
    (info: PickingInfo) => {
      const obj = info.object as Record<string, unknown> | null;
      if (obj && 'type' in obj && 'lat' in obj) {
        // Hub clicked — clear any locked arc
        onClearArcSelection();
        onHubClick(obj.id as string);
      } else if (!obj || !obj._isArc) {
        // Empty space (arc clicks are handled by the layer's own onClick)
        onClearArcSelection();
      }
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

      {/* ── Attribution ── */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-slate-600 text-[10px] pointer-events-none select-none">
        Mapa base © CARTO · deck.gl · MapLibre GL
      </div>
    </div>
  );
}
