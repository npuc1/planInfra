import { useMemo } from 'react';
import { ScatterplotLayer, TextLayer, PathLayer } from '@deck.gl/layers';
import type { Layer, PickingInfo } from '@deck.gl/core';

import { HUBS } from '../data/hubs';
import { REGION_STATES } from '../data/regions';
import { RAIL_OPERATORS, RAIL_OPERATOR_COLORS, RAIL_OPERATOR_NAMES, type RailSegment } from '../data/railNetwork';
import {
  HUB_TYPE_COLORS,
  type UIState,
  type Hub,
  type RGB,
  type RGBA,
} from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type RailDatum = RailSegment & {
  _isRail: true;
  color: RGB;
  operatorName: string;
  routeGroup: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function withAlpha(rgb: RGB, a: number): RGBA {
  return [rgb[0], rgb[1], rgb[2], Math.round(a * 255)];
}

// ─── Hub visibility ───────────────────────────────────────────────────────────

function isHubVisible(hub: Hub, state: UIState): boolean {
  return state.hubTypeVisibility[hub.type] ?? true;
}

// ─── useLayers ────────────────────────────────────────────────────────────────

export function useLayers(
  state: UIState,
  onRailClick: (operator: string) => void,
  segments: RailSegment[],
): Layer[] {
  return useMemo(() => {
    const visibleHubs = HUBS.filter(h => isHubVisible(h, state));
    const layers: Layer[] = [];

    // ── Rail network (PathLayer) ────────────────────────────────────────
    const anyRailOperatorOn = RAIL_OPERATORS.some(
      op => state.railOperatorVisibility[op] !== false,
    );
    if (anyRailOperatorOn) {
      const sr = state.selectedRailOperator;

      const rawSegs = segments.filter(
        s => state.railOperatorVisibility[s.operator] !== false,
      );

      // Enrich with color and tooltip fields
      const visibleSegs: RailDatum[] = rawSegs.map(s => ({
        ...s,
        _isRail: true as const,
        color: RAIL_OPERATOR_COLORS[s.operator] ?? [128, 128, 128],
        operatorName: RAIL_OPERATOR_NAMES[s.operator] ?? s.operator,
        routeGroup: s.linea,
      }));

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

      // Active segments (solid lines)
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

      // Inactive / disused segments (dimmer)
      layers.push(
        new PathLayer<RailDatum>({
          id: 'rail-inactive',
          data: visibleSegs.filter(s => s.status === 'inactive'),
          getPath:  s => s.path,
          getColor: s => withAlpha(s.color, railAlpha(s, 0.35)),
          getWidth: s => railWidth(s, 1.5),
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
    const sr2 = state.selectedRegion;
    const regionStates = sr2 ? REGION_STATES[sr2] : null;
    const isStateActive = (s: string) =>
      regionStates ? regionStates.includes(s) : (!ss || s === ss);

    const sharedFill = (h: Hub) => {
      const stateActive = isStateActive(h.state);
      if (h.id === state.selectedHubId) return [255, 255, 255, stateActive ? 240 : 80] as RGBA;
      return withAlpha(HUB_TYPE_COLORS[h.type], stateActive ? 0.9 : 0.12);
    };
    const sharedLine = (h: Hub) => {
      const stateActive = isStateActive(h.state);
      if (h.id === state.selectedHubId) return [255, 255, 255, stateActive ? 255 : 80] as RGBA;
      return withAlpha(HUB_TYPE_COLORS[h.type], stateActive ? 0.5 : 0.08);
    };
    const colorTriggers = [state.selectedHubId, ss, sr2];

    // Ports + terminals: pixel-sized (static across zoom levels)
    layers.push(
      new ScatterplotLayer({
        id: 'hubs-static',
        data: visibleHubs.filter(h => h.type === 'port' || h.type === 'terminal'),
        getPosition: (h: Hub) => [h.lng, h.lat],
        getFillColor: sharedFill,
        getLineColor: sharedLine,
        getRadius: (h: Hub) =>
          h.id === state.selectedHubId ? 11 : 8,
        stroked: true,
        lineWidthMinPixels: 1.5,
        lineWidthScale: 1,
        radiusUnits: 'pixels',
        pickable: true,
        updateTriggers: {
          getFillColor: colorTriggers,
          getLineColor: colorTriggers,
          getRadius:    state.selectedHubId,
        },
      }),
    );

    // Other hubs (import nodes, end consumers): geo-sized, scale with zoom
    layers.push(
      new ScatterplotLayer({
        id: 'hubs-geo',
        data: visibleHubs.filter(h => h.type !== 'port' && h.type !== 'terminal'),
        getPosition: (h: Hub) => [h.lng, h.lat],
        getFillColor: sharedFill,
        getLineColor: sharedLine,
        getRadius: (h: Hub) =>
          h.id === state.selectedHubId ? 14_000 : 7_000,
        stroked: true,
        lineWidthMinPixels: 1.5,
        lineWidthScale: 1,
        radiusUnits: 'meters',
        pickable: true,
        updateTriggers: {
          getFillColor: colorTriggers,
          getLineColor: colorTriggers,
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
  }, [
    state.mode, state.selectedHubId, state.selectedState, state.selectedRegion,
    state.selectedRailOperator, state.hubTypeVisibility,
    state.railOperatorVisibility,
    segments, onRailClick,
  ]);
}
