import { useMemo } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import { COMMODITY_COLORS, type UIState, type RGBA } from '../types';
import { STATE_BALANCE } from '../data/stateBalance';

// ─── Bubble scale ─────────────────────────────────────────────────────────────
// Area ∝ value → radius ∝ √value
const MAX_R = 110_000; // metres
const MIN_R =  12_000;

function bubbleRadius(value: number, maxValue: number): number {
  if (maxValue <= 0) return MIN_R;
  return MIN_R + Math.sqrt(Math.max(0, value) / maxValue) * (MAX_R - MIN_R);
}

// ─── useProductionBubbles ─────────────────────────────────────────────────────

export function useProductionBubbles(state: UIState): Layer | null {
  return useMemo(() => {
    const rows = STATE_BALANCE.filter(r => r.commodity === state.commodity);
    if (rows.length === 0) return null;

    const [cr, cg, cb] = COMMODITY_COLORS[state.commodity];

    // Choose the value to visualise based on mode
    const getValue = (r: typeof rows[0]): number => {
      switch (state.mode) {
        case 'production':  return r.productionTons;
        case 'consumption': return r.demandTons;
      case 'storage':     return r.storageCapacityTons;
      }
    };

    const maxValue = Math.max(...rows.map(getValue));

    // Use commodity colour for all modes
    const getColor = (r: typeof rows[0]): RGBA => {
      return [cr, cg, cb, 28];
    };

    return new ScatterplotLayer({
      id: 'production-bubbles',
      data: rows,
      getPosition: r => [r.lng, r.lat],
      getRadius:   r => bubbleRadius(getValue(r), maxValue),
      getFillColor: getColor,
      stroked: false,
      filled:  true,
      radiusUnits: 'meters',
      pickable: false,
      updateTriggers: {
        getRadius:   [state.commodity, state.mode],
        getFillColor: [state.commodity, state.mode],
      },
    });
  }, [state.commodity, state.mode]);
}
