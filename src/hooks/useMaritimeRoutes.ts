import { useMemo } from 'react';
import { PathLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import type { Layer, PickingInfo } from '@deck.gl/core';

import { ROUTE_SEGMENTS, type MaritimeSegment } from '../data/maritimeRoutes';

// ─── Constants ─────────────────────────────────────────────────────────────────

const TIME_MAX = 1000;

// The two segments specifically replaced by Magellan: Canal transit + Caribbean crossing.
// seg-pc-canal (PC → Canal entrance) is NOT replaced — it leads to the Magellan divergence point.
const REPLACED_BY_MAGELLAN = new Set(['seg-canal', 'seg-caribbean']);

/**
 * Highlight rules:
 *
 * - Magellan segment is INACTIVE (dim) by default — only highlights when selected.
 * - When Magellan is selected: approach segs bright, canal segs dimmed, Gulf segs dimmed.
 * - When a Panama route is selected: Magellan stays dim (the unchosen alternative).
 * - When nothing is selected: all non-Magellan segments at full opacity.
 * - Standard: segment is part of the selected route → highlighted.
 */
function isSegHighlighted(seg: MaritimeSegment, selectedId: string | null): boolean {
  // Magellan is always dim unless explicitly selected.
  if (seg.id === 'seg-magellan') {
    return selectedId === 'magellan-alternate';
  }

  // Magellan selected: show the full Topo→PC approach, the Magellan arc itself,
  // and all three Gulf arrivals — only the Canal transit + Caribbean are replaced.
  if (selectedId === 'magellan-alternate') {
    return !REPLACED_BY_MAGELLAN.has(seg.id);
  }

  // Nothing selected → full opacity for all non-Magellan segments.
  if (selectedId === null) return true;

  // Standard: this segment is part of the selected route.
  return seg.partOf.includes(selectedId);
}

// ─── Colours ──────────────────────────────────────────────────────────────────

type RGBA4 = [number, number, number, number];

const C_PACIFIC:         RGBA4 = [ 32, 178, 170, 130];
const C_PANAMA:          RGBA4 = [ 30, 144, 255, 120];
const C_MAGELLAN:        RGBA4 = [135, 206, 235, 100];
const C_PACIFIC_BRIGHT:  RGBA4 = [ 80, 220, 210, 230];
const C_PANAMA_BRIGHT:   RGBA4 = [100, 190, 255, 230];
const C_MAGELLAN_BRIGHT: RGBA4 = [190, 235, 255, 210];

function pathColor(seg: MaritimeSegment): RGBA4 {
  if (seg.type === 'pacific')  return C_PACIFIC;
  if (seg.type === 'panama')   return C_PANAMA;
  return C_MAGELLAN;
}
function cometColor(seg: MaritimeSegment): RGBA4 {
  if (seg.type === 'pacific')  return C_PACIFIC_BRIGHT;
  if (seg.type === 'panama')   return C_PANAMA_BRIGHT;
  return C_MAGELLAN_BRIGHT;
}
function dim(c: RGBA4): RGBA4 { return [c[0], c[1], c[2], Math.round(c[3] * 0.12)]; }

// ─── Datum ────────────────────────────────────────────────────────────────────

export interface MaritimeDatum extends MaritimeSegment {
  _isMaritimeRoute: true;
  path3d:     [number, number, number][];
  timestamps: number[];
}

function toPath3d(path: [number, number][]): [number, number, number][] {
  return path.map(([lng, lat]) => [lng, lat, 0]);
}
function makeTimestamps(path: [number, number][]): number[] {
  const n = path.length;
  return path.map((_, i) => (i / (n - 1)) * TIME_MAX);
}

// ─── useMaritimeRoutes ────────────────────────────────────────────────────────

export function useMaritimeRoutes(
  visible:      boolean,
  animTime:     number,
  selectedId:   string | null,
  onRouteClick: (id: string) => void,
): Layer[] {
  const datums = useMemo<MaritimeDatum[]>(() => {
    if (!visible) return [];
    return ROUTE_SEGMENTS.map(seg => ({
      ...seg,
      _isMaritimeRoute: true as const,
      path3d:     toPath3d(seg.path),
      timestamps: makeTimestamps(seg.path),
    }));
  }, [visible]);

  return useMemo(() => {
    if (!visible || datums.length === 0) return [];

    const solid  = datums.filter(d => d.type !== 'magellan');
    const dashed = datums.filter(d => d.type === 'magellan');
    // Magellan comet only animates when it is explicitly selected.
    const dashedAnimated = selectedId === 'magellan-alternate' ? dashed : [];
    const currentTime = animTime * TIME_MAX;

    function onClick(info: PickingInfo) {
      const d = info.object as MaritimeDatum | null;
      if (d?._isMaritimeRoute) onRouteClick(d.clickRoute);
    }

    const getPathColor  = (d: MaritimeDatum): RGBA4 =>
      isSegHighlighted(d, selectedId) ? pathColor(d)  : dim(pathColor(d));
    const getCometColor = (d: MaritimeDatum): RGBA4 =>
      isSegHighlighted(d, selectedId) ? cometColor(d) : dim(cometColor(d));

    const selTrigger = [selectedId];

    return [
      // ── Solid path underlays ───────────────────────────────────────────
      new PathLayer<MaritimeDatum>({
        id:   'maritime-solid',
        data: solid,
        getPath:  d => d.path,
        getColor: d => getPathColor(d),
        getWidth: 2,
        widthUnits: 'pixels',
        widthMinPixels: 1,
        widthMaxPixels: 3,
        capRounded:   true,
        jointRounded: true,
        pickable: true,
        onClick,
        updateTriggers: { getColor: selTrigger },
      }),

      // ── Dashed path underlay ───────────────────────────────────────────
      new PathLayer<MaritimeDatum>({
        id:   'maritime-dashed',
        data: dashed,
        getPath:  (d: MaritimeDatum) => d.path,
        getColor: (d: MaritimeDatum) => getPathColor(d),
        getWidth: 1.5,
        widthUnits: 'pixels',
        widthMinPixels: 1,
        widthMaxPixels: 3,
        capRounded:    true,
        jointRounded:  true,
        pickable: true,
        onClick,
        extensions: [new PathStyleExtension({ dash: true })],
        getDashArray:  () => [8, 6],
        dashJustified: true,
        updateTriggers: { getColor: selTrigger },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),

      // ── Animated comets ────────────────────────────────────────────────
      new TripsLayer<MaritimeDatum>({
        id:            'maritime-trips-solid',
        data:          solid,
        getPath:       d => d.path3d,
        getTimestamps: d => d.timestamps,
        getColor:      d => getCometColor(d),
        widthMinPixels: 2,
        widthMaxPixels: 4,
        trailLength:   180,
        fadeTrail:     true,
        currentTime,
        pickable: false,
        updateTriggers: { getColor: selTrigger },
      }),

      new TripsLayer<MaritimeDatum>({
        id:            'maritime-trips-dashed',
        data:          dashedAnimated,
        getPath:       d => d.path3d,
        getTimestamps: d => d.timestamps,
        getColor:      d => getCometColor(d),
        widthMinPixels: 1.5,
        widthMaxPixels: 3,
        trailLength:   180,
        fadeTrail:     true,
        currentTime,
        pickable: false,
        updateTriggers: { getColor: selTrigger },
      }),
    ];
  }, [visible, datums, animTime, selectedId, onRouteClick]);
}
