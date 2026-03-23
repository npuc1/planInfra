import { useMemo } from 'react';
import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import type { Layer, PickingInfo } from '@deck.gl/core';

import { HUBS, HUB_BY_ID } from '../data/hubs';
import { REGION_STATES } from '../data/regions';
import {
  US_ORIGIN,
  US_ORIGIN_ID,
  IMPORT_NODE_VOLUMES,
  CONSUMER_PROVIDER,
  CONSUMER_VOLUMES,
} from '../data/importFlows';
import { HUB_TYPE_COLORS, type UIState, type RGBA } from '../types';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAX_VOL   = 500_000;
const MIN_W     = 1.5;   // px
const MAX_W     = 7.0;   // px
const ARC_STEPS = 80;    // polyline resolution
const TIME_MAX  = 1000;  // TripsLayer time units

// Shared timestamp array (monotone 0 → TIME_MAX)
const TRIP_TIMESTAMPS: number[] = Array.from(
  { length: ARC_STEPS + 1 },
  (_, i) => (i / ARC_STEPS) * TIME_MAX,
);

// ─── Colours ──────────────────────────────────────────────────────────────────

const C_IMPORT   = HUB_TYPE_COLORS.import_node  as [number, number, number];
const C_CONSUMER = HUB_TYPE_COLORS.end_consumer as [number, number, number];
const C_US       = [255, 200, 60]               as [number, number, number];

function rgba(rgb: [number, number, number], a: number): RGBA {
  return [rgb[0], rgb[1], rgb[2], Math.round(a * 255)];
}

function arcWidth(tons: number): number {
  return MIN_W + (Math.min(tons, MAX_VOL) / MAX_VOL) * (MAX_W - MIN_W);
}

// ─── Arc path — matches ArcLayer's internal parabola exactly ─────────────────
//
// ArcLayer peak altitude formula (zoom-independent, 2ⁿ cancels):
//   alt(r) = √(r·(1−r)) · dist_deg · h · circumference · cos(avgLat) / 360
//
// Using the same formula for PathLayer + TripsLayer guarantees the animation
// rides the arc instead of floating beside it.

const EARTH_CIRC = 40_075_016; // metres

function computeArcPath(
  source: [number, number],
  target: [number, number],
  height = 0.4,
  steps  = ARC_STEPS,
): [number, number, number][] {
  const dx  = target[0] - source[0];
  const dy  = target[1] - source[1];
  const dist = Math.sqrt(dx * dx + dy * dy);              // degrees
  const avgLatRad = ((source[1] + target[1]) / 2) * (Math.PI / 180);
  // Peak altitude in metres — same as what ArcLayer renders at every zoom level
  const dh  = dist * height * EARTH_CIRC * Math.cos(avgLatRad) / 360;

  return Array.from({ length: steps + 1 }, (_, i) => {
    const r = i / steps;
    return [
      source[0] + dx * r,
      source[1] + dy * r,
      Math.sqrt(r * (1 - r)) * dh,   // paraboloid; peak at r = 0.5
    ] as [number, number, number];
  });
}

// ─── Arc datum ────────────────────────────────────────────────────────────────

export interface ImportArcDatum {
  _isArc:          true;
  id:              string;
  name:            string;
  tons:            number;
  width:           number;
  path:            [number, number, number][];
  timestamps:      number[];
  colorA:          RGBA;   // source end
  colorB:          RGBA;   // target end
  /** For branch arcs: the import-node arc id that "owns" this branch. */
  providerNodeId?: string;
}

// ─── useImportFlows ───────────────────────────────────────────────────────────

export function useImportFlows(
  state:         UIState,
  animTime:      number,
  hoveredArcId:  string | null,
  selectedArcId: string | null,
  onArcHover:    (id: string | null) => void,
  onArcClick:    (id: string) => void,
): Layer[] {

  // ── Datasets (recomputed only when visibility changes) ────────────────────

  const importArcs = useMemo<ImportArcDatum[]>(() => {
    if (!(state.hubTypeVisibility.import_node ?? true)) return [];
    return HUBS
      .filter(h => h.type === 'import_node')
      .map(hub => ({
        _isArc:     true as const,
        id:         hub.id,
        name:       hub.name,
        tons:       IMPORT_NODE_VOLUMES[hub.id] ?? 100_000,
        width:      arcWidth(IMPORT_NODE_VOLUMES[hub.id] ?? 100_000),
        path:       computeArcPath(US_ORIGIN, [hub.lng, hub.lat], 0.4),
        timestamps: TRIP_TIMESTAMPS,
        colorA:     rgba(C_US,     0.7),
        colorB:     rgba(C_IMPORT, 0.9),
      }));
  }, [state.hubTypeVisibility.import_node]);

  // Branch arcs: import_node → end_consumer (no US → provider arcs any more)
  const branchArcs = useMemo<ImportArcDatum[]>(() => {
    if (!(state.hubTypeVisibility.end_consumer ?? true)) return [];
    return HUBS
      .filter(h => h.type === 'end_consumer')
      .flatMap(c => {
        const pid = CONSUMER_PROVIDER[c.id];
        if (!pid) return [];
        const provider = HUB_BY_ID[pid];
        return [{
          _isArc:          true as const,
          id:              `branch-${c.id}`,
          name:            c.name,
          tons:            CONSUMER_VOLUMES[c.id] ?? 80_000,
          width:           arcWidth(CONSUMER_VOLUMES[c.id] ?? 80_000) * 0.7,
          path:            computeArcPath([provider.lng, provider.lat], [c.lng, c.lat], 0.25),
          timestamps:      TRIP_TIMESTAMPS,
          colorA:          rgba(C_CONSUMER, 0.7),
          colorB:          rgba(C_CONSUMER, 0.95),
          providerNodeId:  pid,   // e.g. 'I-012' or 'I-013'
        }];
      });
  }, [state.hubTypeVisibility.end_consumer]);

  // ── Layers ────────────────────────────────────────────────────────────────

  return useMemo(() => {
    const layers: Layer[] = [];
    // Selected arc takes precedence over hovered for the highlight logic
    const activeId    = selectedArcId ?? hoveredArcId;
    const hasActive   = activeId !== null;
    const currentTime = animTime * TIME_MAX;

    function onHover(info: PickingInfo) {
      const obj = info.object as ImportArcDatum | null;
      onArcHover(obj?._isArc ? obj.id : null);
    }
    function onClick(info: PickingInfo) {
      const obj = info.object as ImportArcDatum | null;
      if (obj?._isArc) onArcClick(obj.id);
    }

    // State/region filter: an arc is active if any of its endpoint hubs is in the selected state/region
    const ss = state.selectedState;
    const regionStates = state.selectedRegion ? (REGION_STATES[state.selectedRegion] ?? null) : null;
    const isHubStateActive = (s: string | undefined) =>
      s ? (regionStates ? regionStates.includes(s) : (!ss || s === ss)) : false;
    function isStateActive(d: ImportArcDatum): boolean {
      if (!ss && !regionStates) return true;
      if (d.id.startsWith('branch-')) {
        const consumerId = d.id.slice(7);
        const consumerState = HUB_BY_ID[consumerId]?.state;
        const providerState = d.providerNodeId ? HUB_BY_ID[d.providerNodeId]?.state : undefined;
        return isHubStateActive(consumerState) || isHubStateActive(providerState);
      }
      return isHubStateActive(HUB_BY_ID[d.id]?.state);
    }

    // Dim factor: a branch arc is also "active" when its parent import node is active.
    // US_ORIGIN_ID acts as "select all" — overrides both state filter and arc filter.
    // Otherwise both the state filter and the arc hover/selection must pass.
    function isActive(d: ImportArcDatum): boolean {
      if (activeId === US_ORIGIN_ID) return true;
      const stateOk = isStateActive(d);
      if (!hasActive) return stateOk;
      const arcOk = activeId === d.id || (!!d.providerNodeId && activeId === d.providerNodeId);
      return stateOk && arcOk;
    }
    function baseAlpha(d: ImportArcDatum): number {
      return isActive(d) ? 1 : 0.12;
    }
    function pathColor(d: ImportArcDatum): RGBA {
      const a = baseAlpha(d);
      // Blend colorA→colorB at midpoint; PathLayer is per-path so use midpoint colour
      const mid = d.colorB;
      return [mid[0], mid[1], mid[2], Math.round(mid[3] * a * 0.45)] as RGBA;
    }
    function pathWidth(d: ImportArcDatum): number {
      return hasActive && activeId === d.id ? d.width * 1.5 : d.width;
    }
    function tripColor(d: ImportArcDatum): RGBA {
      const a = baseAlpha(d);
      const c = d.colorB;
      // Comet head — brighter than the path underlay
      return [
        Math.min(255, c[0] + 60),
        Math.min(255, c[1] + 60),
        Math.min(255, c[2] + 60),
        Math.round(230 * a),
      ] as RGBA;
    }

    const updateActive = [activeId, ss];

    // Helper: emit PathLayer + TripsLayer pair sharing the same geometry
    function addArcGroup(
      id: string,
      data: ImportArcDatum[],
      trailLen: number,
    ) {
      if (data.length === 0) return;

      // ── Static underlay ──────────────────────────────────────────────────
      layers.push(
        new PathLayer<ImportArcDatum>({
          id: `${id}-path`,
          data,
          getPath:  d => d.path,
          getColor: d => pathColor(d),
          getWidth: d => pathWidth(d),
          widthUnits: 'pixels',
          widthMinPixels: 1,
          pickable: true,
          onHover,
          onClick,
          updateTriggers: {
            getColor: updateActive,
            getWidth: updateActive,
          },
        }),
      );

      // ── Flowing comet ────────────────────────────────────────────────────
      layers.push(
        new TripsLayer<ImportArcDatum>({
          id: `${id}-trips`,
          data,
          getPath:       d => d.path,
          getTimestamps: d => d.timestamps,
          getColor:      d => tripColor(d),
          widthMinPixels: 1.5,
          widthMaxPixels: 5,
          trailLength:   trailLen,
          fadeTrail:     true,
          currentTime,
          pickable: false,
          updateTriggers: { getColor: updateActive },
        }),
      );
    }

    addArcGroup('import',  importArcs,  240);
    addArcGroup('branch',  branchArcs,  160);

    // ── US origin node ────────────────────────────────────────────────────
    // A single pickable point at the US corn-belt origin. Clicking it
    // sets activeId = US_ORIGIN_ID, which lights up every import arc.
    const originSelected = activeId === US_ORIGIN_ID;
    const originHovered  = hoveredArcId === US_ORIGIN_ID;

    layers.push(
      new ScatterplotLayer({
        id: 'us-origin',
        data: [{ id: US_ORIGIN_ID }],
        getPosition: () => [...US_ORIGIN, 0] as [number, number, number],
        getRadius:    () => originSelected ? 90_000 : 60_000,
        getFillColor: () => originSelected
          ? ([255, 215, 70, 230] as RGBA)
          : originHovered
            ? ([255, 210, 80, 180] as RGBA)
            : ([255, 200, 60, 130] as RGBA),
        getLineColor: () => [255, 200, 60, 200] as RGBA,
        stroked: true,
        lineWidthMinPixels: originSelected ? 3 : 1.5,
        radiusUnits: 'meters',
        pickable: true,
        onHover: (info: PickingInfo) => onArcHover(info.object ? US_ORIGIN_ID : null),
        onClick: (info: PickingInfo) => { if (info.object) onArcClick(US_ORIGIN_ID); },
        updateTriggers: {
          getFillColor: [originSelected, originHovered],
          getRadius:    originSelected,
          lineWidthMinPixels: originSelected,
        },
      }),
    );

    // Text label beneath the origin node (non-interactive)
    layers.push(
      new TextLayer({
        id: 'us-origin-label',
        data: [{ text: 'Origen EE.UU.' }],
        getPosition: () => [...US_ORIGIN, 0],
        getText: (d: { text: string }) => d.text,
        getSize: 11,
        getColor: [255, 200, 60, originSelected ? 230 : 140] as RGBA,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'top',
        getPixelOffset: [0, 14],
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: '600',
        pickable: false,
        updateTriggers: { getColor: originSelected },
      }),
    );

    return layers;
  }, [importArcs, branchArcs, animTime, hoveredArcId, selectedArcId, state.selectedState, state.selectedRegion, onArcHover, onArcClick]);
}
