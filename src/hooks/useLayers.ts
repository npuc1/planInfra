import { useMemo } from 'react';
import { ScatterplotLayer, TextLayer, PathLayer } from '@deck.gl/layers';
import type { Layer, PickingInfo } from '@deck.gl/core';

import { HUBS } from '../data/hubs';
import { RAIL_SEGMENTS, type RailSegment } from '../data/railNetwork';

export type RailDatum = RailSegment & { _isRail: true };
import {
  HUB_TYPE_COLORS,
  type UIState,
  type Hub,
  type RGB,
  type RGBA,
} from '../types';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function withAlpha(rgb: RGB, a: number): RGBA {
  return [rgb[0], rgb[1], rgb[2], Math.round(a * 255)];
}

// ─── Hub visibility by view mode ─────────────────────────────────────────────
//
// production / balance  → ports + terminals (where grain moves through)
// consumption           → import_node + end_consumer (where it's demanded/used)
// storage               → terminals (where it's stored inland)

function isHubVisible(hub: Hub, state: UIState): boolean {
  // Visible if its type is enabled in the legend, regardless of view mode
  return state.hubTypeVisibility[hub.type] ?? true;
}

// ─── useLayers ────────────────────────────────────────────────────────────────

export function useLayers(
  state: UIState,
  onRailClick: (operator: string) => void,
): Layer[] {
  return useMemo(() => {
    const visibleHubs = HUBS.filter(h => isHubVisible(h, state));
    const layers: Layer[] = [];

    // ── Rail network (PathLayer) ────────────────────────────────────────
    if (state.showRailNetwork) {
      const sr = state.selectedRailOperator;

      const rawSegs = RAIL_SEGMENTS.filter(
        s => state.railOperatorVisibility[s.operator] !== false,
      );
      // Wrap with _isRail so tooltip/click can identify these objects
      const visibleSegs: RailDatum[] = rawSegs.map(s => ({ ...s, _isRail: true as const }));

      function railAlpha(s: RailDatum, base: number): number {
        if (!sr) return base;
        return s.operator === sr ? Math.min(1, base * 1.25) : base * 0.18;
      }
      function railWidth(s: RailDatum, base: number): number {
        return sr && s.operator === sr ? base * 1.6 : base;
      }
      function onRailSegClick(info: PickingInfo) {
        const seg = info.object as RailDatum | null;
        if (seg?._isRail) onRailClick(seg.operator);
      }

      // Core segments (solid lines)
      layers.push(
        new PathLayer<RailDatum>({
          id: 'rail-core',
          data: visibleSegs.filter(s => s.status === 'active'),
          getPath:  s => s.path,
          getColor: s => withAlpha(s.color, railAlpha(s, 0.85)),
          getWidth: s => railWidth(s, 2.25),
          widthUnits: 'pixels',
          widthMinPixels: 1.5,
          widthMaxPixels: 5,
          capRounded: true,
          jointRounded: true,
          pickable: true,
          onClick: onRailSegClick,
          updateTriggers: { getColor: sr, getWidth: sr },
        }),
      );

      // Extension / low-certainty segments (dimmer)
      layers.push(
        new PathLayer<RailDatum>({
          id: 'rail-extension',
          data: visibleSegs.filter(s => s.status === 'extension_low_certainty'),
          getPath:  s => s.path,
          getColor: s => withAlpha(s.color, railAlpha(s, 0.50)),
          getWidth: s => railWidth(s, 1.75),
          widthUnits: 'pixels',
          widthMinPixels: 1,
          capRounded: true,
          jointRounded: true,
          pickable: true,
          onClick: onRailSegClick,
          updateTriggers: { getColor: sr, getWidth: sr },
        }),
      );
    }

    // ── Hub scatter ────────────────────────────────────────────────────────
    const ss = state.selectedState;

    layers.push(
      new ScatterplotLayer({
        id: 'hubs',
        data: visibleHubs,
        getPosition: (h: Hub) => [h.lng, h.lat],
        getFillColor: (h: Hub) => {
          const stateActive = !ss || h.state === ss;
          if (h.id === state.selectedHubId) return [255, 255, 255, stateActive ? 240 : 80] as RGBA;
          return withAlpha(HUB_TYPE_COLORS[h.type], stateActive ? 0.9 : 0.12);
        },
        getLineColor: (h: Hub) => {
          const stateActive = !ss || h.state === ss;
          if (h.id === state.selectedHubId) return [255, 255, 255, stateActive ? 255 : 80] as RGBA;
          return withAlpha(HUB_TYPE_COLORS[h.type], stateActive ? 0.5 : 0.08);
        },
        getRadius: (h: Hub) =>
          h.id === state.selectedHubId ? 14_000 : (h.type === 'port' ? 11_000 : 7_000),
        stroked: true,
        lineWidthMinPixels: 1.5,
        lineWidthScale: 1,
        radiusUnits: 'meters',
        pickable: true,
        updateTriggers: {
          getFillColor: [state.selectedHubId, ss],
          getLineColor: [state.selectedHubId, ss],
          getRadius:    state.selectedHubId,
        },
      }),
    );

    // ── Labels (ports always; selected hub always) ────────────────────────
    layers.push(
      new TextLayer({
        id: 'hub-labels',
        data: visibleHubs.filter(h => h.type === 'port' || h.id === state.selectedHubId),
        getPosition: (h: Hub) => [h.lng, h.lat],
        getText:     (h: Hub) => h.name,
        getSize: 11,
        getColor: [255, 255, 255, 200] as RGBA,
        getAngle: 0,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'top',
        getPixelOffset: [0, 10],
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: '600',
        characterSet: 'auto',
        pickable: false,
      }),
    );

    return layers;
  }, [state.mode, state.selectedHubId, state.selectedState, state.selectedRailOperator, state.hubTypeVisibility, state.showRailNetwork, state.railOperatorVisibility, onRailClick]);
}
