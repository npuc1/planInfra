import { useMemo } from 'react';
import { ScatterplotLayer, TextLayer, PathLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';

import { HUBS } from '../data/hubs';
import { RAIL_SEGMENTS, type RailSegment } from '../data/railNetwork';
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

export function useLayers(state: UIState): Layer[] {
  return useMemo(() => {
    const visibleHubs = HUBS.filter(h => isHubVisible(h, state));
    const layers: Layer[] = [];

    // ── Rail network (PathLayer) ────────────────────────────────────────
    if (state.showRailNetwork) {
      const visibleSegs = RAIL_SEGMENTS.filter(
        s => state.railOperatorVisibility[s.operator] !== false,
      );

      // Core segments (solid lines)
      layers.push(
        new PathLayer<RailSegment>({
          id: 'rail-core',
          data: visibleSegs.filter(s => s.status === 'active'),
          getPath: (s: RailSegment) => s.path,
          // Slightly brighter and thicker for better contrast on dark basemap
          getColor: (s: RailSegment) => withAlpha(s.color, 0.85),
          getWidth: 2.25,
          widthUnits: 'pixels',
          widthMinPixels: 1.5,
          widthMaxPixels: 4,
          capRounded: true,
          jointRounded: true,
          pickable: false,
        }),
      );

      // Extension / low-certainty segments (dimmer)
      layers.push(
        new PathLayer<RailSegment>({
          id: 'rail-extension',
          data: visibleSegs.filter(s => s.status === 'extension_low_certainty'),
          getPath: (s: RailSegment) => s.path,
          // Keep visually distinct but not as faint
          getColor: (s: RailSegment) => withAlpha(s.color, 0.50),
          getWidth: 1.75,
          widthUnits: 'pixels',
          widthMinPixels: 1,
          capRounded: true,
          jointRounded: true,
          pickable: false,
        }),
      );
    }

    // ── Hub scatter ────────────────────────────────────────────────────────
    layers.push(
      new ScatterplotLayer({
        id: 'hubs',
        data: visibleHubs,
        getPosition: (h: Hub) => [h.lng, h.lat],
        getFillColor: (h: Hub) =>
          h.id === state.selectedHubId
            ? [255, 255, 255, 240] as RGBA
            : withAlpha(HUB_TYPE_COLORS[h.type], 0.9),
        getLineColor: (h: Hub) =>
          h.id === state.selectedHubId
            ? [255, 255, 255, 255] as RGBA
            : withAlpha(HUB_TYPE_COLORS[h.type], 0.5),
        getRadius: (h: Hub) =>
          h.id === state.selectedHubId ? 14_000 : (h.type === 'port' ? 11_000 : 7_000),
        stroked: true,
        lineWidthMinPixels: 1.5,
        lineWidthScale: 1,
        radiusUnits: 'meters',
        pickable: true,
        updateTriggers: {
          getFillColor: state.selectedHubId,
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
  }, [state.mode, state.selectedHubId, state.hubTypeVisibility, state.showRailNetwork, state.railOperatorVisibility]);
}
