// Rail network data loaded directly from CSV files via Vite ?raw imports.
// Editing data/data/trenes/ferromex_schematic/*.csv or fioc_schematic/*.csv
// automatically updates the map (Vite HMR picks up raw file changes during dev;
// prod build bundles the text).

import type { RGB } from '../types';

// ── Ferromex / Ferrosur / DP / CM / TXP ──────────────────────────────────────
import nodesRaw    from '../../data/data/trenes/ferromex_schematic/mx_rail_nodes_schematic.csv?raw';
import routesRaw   from '../../data/data/trenes/ferromex_schematic/mx_rail_routes_catalog.csv?raw';
import segmentsRaw from '../../data/data/trenes/ferromex_schematic/mx_rail_segments_schematic.csv?raw';

// ── FIOC (Línea FA / Z / K) ───────────────────────────────────────────────────
import fiocRoutesRaw   from '../../data/data/trenes/fioc_schematic/fioc_routes_catalog.csv?raw';
import fiocSegmentsRaw from '../../data/data/trenes/fioc_schematic/fioc_segments_schematic.csv?raw';

export interface RailSegment {
  id: string;
  operator: string;
  operatorName: string;
  routeGroup: string;
  path: [number, number][];  // [[lon, lat], ...]
  color: RGB;
  status: string;
}

// ── CSV parser ────────────────────────────────────────────────────────────────
// Splits on the first (headers.length - 1) commas so the trailing notes field
// can safely contain commas without needing quoting.

function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let rest = line;
    for (let i = 0; i < headers.length - 1; i++) {
      const idx = rest.indexOf(',');
      if (idx === -1) { values.push(rest.trim()); rest = ''; break; }
      values.push(rest.slice(0, idx).trim());
      rest = rest.slice(idx + 1);
    }
    values.push(rest.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

function hexToRgb(hex: string): RGB {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  return m
    ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
    : [128, 128, 128];
}

// ── Ferromex/etc. lookups ─────────────────────────────────────────────────────

const nodeRows    = parseCSV(nodesRaw);
const routeRows   = parseCSV(routesRaw);
const segmentRows = parseCSV(segmentsRaw);

// node_id → [lon, lat]  (CSV has lat/lon columns; deck.gl wants lon/lat)
const NODE_COORDS: Record<string, [number, number]> = Object.fromEntries(
  nodeRows.map(r => [
    r.node_id,
    [parseFloat(r.longitude), parseFloat(r.latitude)] as [number, number],
  ])
);

export const RAIL_OPERATOR_COLORS: Record<string, RGB> = Object.fromEntries(
  routeRows.map(r => [r.operator_id, hexToRgb(r.color_placeholder)])
);

export const RAIL_OPERATOR_NAMES: Record<string, string> = Object.fromEntries(
  routeRows.map(r => [r.operator_id, r.operator_name])
);

const mxSegments: RailSegment[] = segmentRows
  .filter(r => NODE_COORDS[r.from_node_id] && NODE_COORDS[r.to_node_id])
  .map(r => ({
    id:           r.segment_id,
    operator:     r.operator_id,
    operatorName: RAIL_OPERATOR_NAMES[r.operator_id] ?? r.operator_id,
    routeGroup:   r.route_group,
    path:         [NODE_COORDS[r.from_node_id], NODE_COORDS[r.to_node_id]],
    color:        RAIL_OPERATOR_COLORS[r.operator_id] ?? [128, 128, 128],
    status:       r.status,
  }));

// ── FIOC segments ─────────────────────────────────────────────────────────────
// fioc_segments_schematic.csv carries direct lon/lat per endpoint — no node
// lookup needed.  segment_status values: 'core', 'core_to_primary_terminal',
// 'extension_low_certainty' → map first two to 'active'.

const fiocRouteRows   = parseCSV(fiocRoutesRaw);
const fiocSegmentRows = parseCSV(fiocSegmentsRaw);

// Merge FIOC line colors/names into shared lookups
for (const r of fiocRouteRows) {
  RAIL_OPERATOR_COLORS[r.line_id] = hexToRgb(r.color_hex);
  RAIL_OPERATOR_NAMES[r.line_id]  = r.line_name;
}

function fiocStatus(raw: string): string {
  return raw === 'extension_low_certainty' ? 'extension_low_certainty' : 'active';
}

const fiocSegments: RailSegment[] = fiocSegmentRows.map(r => ({
  id:           r.segment_id,
  operator:     r.line_id,
  operatorName: RAIL_OPERATOR_NAMES[r.line_id] ?? r.line_id,
  routeGroup:   `FIOC · ${RAIL_OPERATOR_NAMES[r.line_id] ?? r.line_id}`,
  path:         [
    [parseFloat(r.from_lon), parseFloat(r.from_lat)],
    [parseFloat(r.to_lon),   parseFloat(r.to_lat)],
  ],
  color:        RAIL_OPERATOR_COLORS[r.line_id] ?? [128, 128, 128],
  status:       fiocStatus(r.segment_status),
}));

// ── Combined export ───────────────────────────────────────────────────────────

export const RAIL_SEGMENTS: RailSegment[] = [...mxSegments, ...fiocSegments];

/** Ordered list of operators present in the loaded segments data. */
export const RAIL_OPERATORS: string[] = [...new Set(RAIL_SEGMENTS.map(s => s.operator))];
export type RailOperator = string;
