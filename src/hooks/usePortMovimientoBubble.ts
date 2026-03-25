import { useMemo } from 'react';
import { ScatterplotLayer, PolygonLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { Position } from '@deck.gl/core';
import type { RGBA } from '../types';
import { HUBS } from '../data/hubs';
import type { Hub } from '../types';
import {
  PUERTO_MOVIMIENTOS,
  getPortMovValue,
  type PortMovGroup,
  type PortMovMetric,
} from '../data/puertoMovimientos';

type RGB3 = readonly [number, number, number];

const ALTURA_EXPORT:    RGB3 = [32,  178, 170];  // teal
const ALTURA_IMPORT:    RGB3 = [244,  63,  94];  // rose
const CABOTAJE_SALIDA:  RGB3 = [251, 146,  60];  // orange
const CABOTAJE_ENTRADA: RGB3 = [139,  92, 246];  // violet

const MAX_R = 180_000;
const MIN_R =  18_000;

function bubbleRadius(value: number, maxValue: number): number {
  if (maxValue <= 0 || value <= 0) return 0;
  return MIN_R + Math.sqrt(value / maxValue) * (MAX_R - MIN_R);
}

/** Pie-chart wedge as a closed polygon in [lng, lat] space. */
function wedge(
  lng: number, lat: number,
  radiusM: number,
  startAngle: number, endAngle: number,  // radians, 0=north, clockwise
  steps = 48,
): Position[] {
  const dLat = 1 / 111_320;
  const dLng = 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
  const pts: Position[] = [[lng, lat]];
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (i / steps) * (endAngle - startAngle);
    pts.push([lng + radiusM * dLng * Math.sin(a), lat + radiusM * dLat * Math.cos(a)]);
  }
  pts.push([lng, lat]);
  return pts;
}

// ── Scatter datum (altura / cabotaje views) ──────────────────────────────────
interface ScatterDatum {
  hub: Hub;
  absValue: number;
  rgb: RGB3;
}

// ── Wedge datum (proporcion view) ────────────────────────────────────────────
interface WedgeDatum {
  polygon: Position[];
  color: RGBA;
  hubId: string;
}

export function usePortMovimientoBubble(
  portMovGroup:  PortMovGroup | null,
  portMovMetric: PortMovMetric | null,
  onHubClick: (hubId: string) => void,
): Layer | null {
  return useMemo(() => {
    if (!portMovGroup) return null;

    const portHubs = HUBS.filter(h => h.type === 'port');

    // ── Proporción: pie-chart wedges ─────────────────────────────────────────
    if (portMovGroup === 'proporcion') {
      const entries = portHubs.flatMap(hub => {
        const mov = PUERTO_MOVIMIENTOS[hub.id];
        if (!mov) return [];
        const importacion = mov.altura.importacion;
        const entrada     = mov.cabotaje.entrada;
        const total = importacion + entrada;
        if (total === 0) return [];
        return [{ hub, importacion, entrada, total }];
      });

      if (entries.length === 0) return null;

      const maxTotal = Math.max(...entries.map(e => e.total));

      const wedgeData: WedgeDatum[] = entries.flatMap(({ hub, importacion, entrada, total }) => {
        const r = bubbleRadius(total, maxTotal);
        const importAngle = (importacion / total) * 2 * Math.PI;
        const result: WedgeDatum[] = [];

        // Importación slice (rose) — starts at 12 o'clock
        if (importAngle > 0.001) {
          result.push({
            polygon: wedge(hub.lng, hub.lat, r, 0, importAngle),
            color:   [244, 63, 94, 110] as RGBA,
            hubId:   hub.id,
          });
        }
        // Entrada slice (violet) — remaining arc
        if (2 * Math.PI - importAngle > 0.001) {
          result.push({
            polygon: wedge(hub.lng, hub.lat, r, importAngle, 2 * Math.PI),
            color:   [139, 92, 246, 150] as RGBA,
            hubId:   hub.id,
          });
        }
        return result;
      });

      if (wedgeData.length === 0) return null;

      return new PolygonLayer<WedgeDatum>({
        id: 'port-proporcion-pie',
        data: wedgeData,
        getPolygon:   d => d.polygon,
        getFillColor: d => d.color,
        stroked: true,
        getLineColor: [10, 10, 20, 180],
        lineWidthMinPixels: 0.5,
        pickable: true,
        onClick: info => {
          const d = info.object as WedgeDatum | null;
          if (d) onHubClick(d.hubId);
        },
        updateTriggers: { getPolygon: ['proporcion'], getFillColor: ['proporcion'] },
      });
    }

    // ── Altura / Cabotaje: scatter bubbles ───────────────────────────────────
    let data: ScatterDatum[];

    if (portMovMetric) {
      // Specific metric: colour matches direction
      const rgb: RGB3 =
        portMovGroup === 'altura'
          ? (portMovMetric === 'exportacion' ? ALTURA_EXPORT : ALTURA_IMPORT)
          : (portMovMetric === 'salida'      ? CABOTAJE_SALIDA : CABOTAJE_ENTRADA);

      data = portHubs.flatMap(hub => {
        const mov = PUERTO_MOVIMIENTOS[hub.id];
        if (!mov) return [];
        const value = getPortMovValue(mov, portMovGroup, portMovMetric);
        if (value <= 0) return [];
        return [{ hub, absValue: value, rgb }];
      });
    } else {
      // Net view: colour by dominant direction
      const [posRgb, negRgb]: [RGB3, RGB3] = portMovGroup === 'altura'
        ? [ALTURA_EXPORT, ALTURA_IMPORT]
        : [CABOTAJE_SALIDA, CABOTAJE_ENTRADA];

      data = portHubs.flatMap(hub => {
        const mov = PUERTO_MOVIMIENTOS[hub.id];
        if (!mov) return [];
        const net = portMovGroup === 'altura'
          ? mov.altura.exportacion - mov.altura.importacion
          : mov.cabotaje.salida    - mov.cabotaje.entrada;
        if (net === 0) return [];
        return [{ hub, absValue: Math.abs(net), rgb: net > 0 ? posRgb : negRgb }];
      });
    }

    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.absValue));

    return new ScatterplotLayer<ScatterDatum>({
      id: 'port-movimiento-bubble',
      data,
      getPosition:  d => [d.hub.lng, d.hub.lat],
      getRadius:    d => bubbleRadius(d.absValue, maxValue),
      getFillColor: d => [d.rgb[0], d.rgb[1], d.rgb[2], 30]  as RGBA,
      getLineColor: d => [d.rgb[0], d.rgb[1], d.rgb[2], 220] as RGBA,
      stroked: true,
      filled:  true,
      getLineWidth: 2.5,
      lineWidthUnits: 'pixels',
      radiusUnits:   'meters',
      pickable: true,
      onClick: info => {
        const d = info.object as ScatterDatum | null;
        if (d) onHubClick(d.hub.id);
      },
      updateTriggers: {
        getRadius:    [portMovGroup, portMovMetric],
        getFillColor: [portMovGroup, portMovMetric],
        getLineColor: [portMovGroup, portMovMetric],
      },
    });
  }, [portMovGroup, portMovMetric, onHubClick]);
}
