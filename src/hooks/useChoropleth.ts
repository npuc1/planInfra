import { useMemo } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import type { Layer, PickingInfo } from '@deck.gl/core';
import { COMMODITY_COLORS, type UIState, type RGBA, type StateBalance } from '../types';
import { STATE_BALANCE } from '../data/stateBalance';

export type BubbleDatum = StateBalance & { _isBubble: true };

// ─── Bubble scale ─────────────────────────────────────────────────────────────
// Area ∝ value → radius ∝ √value
const MAX_R = 110_000; // metres
const MIN_R =  12_000;

function bubbleRadius(value: number, maxValue: number): number {
  if (maxValue <= 0) return MIN_R;
  return MIN_R + Math.sqrt(Math.max(0, value) / maxValue) * (MAX_R - MIN_R);
}

// ─── useProductionBubbles ─────────────────────────────────────────────────────

export function useProductionBubbles(
  state: UIState,
  onBubbleClick: (stateName: string) => void,
): Layer | null {
  return useMemo(() => {
    const rows = STATE_BALANCE.filter(r => r.commodity === state.commodity);
    if (rows.length === 0) return null;

    const [cr, cg, cb] = COMMODITY_COLORS[state.commodity];
    const ss = state.selectedState;

    // Wrap with _isBubble flag so tooltip/click handlers can identify these objects
    const data: BubbleDatum[] = rows.map(r => ({ ...r, _isBubble: true as const }));

    const getValue = (r: BubbleDatum): number => {
      switch (state.mode) {
        case 'production':  return r.productionTons;
        case 'consumption': return r.demandTons;
        case 'storage':     return r.storageCapacityTons;
      }
    };
    const maxValue = Math.max(...data.map(getValue));

    return new ScatterplotLayer<BubbleDatum>({
      id: 'production-bubbles',
      data,
      getPosition: r => [r.lng, r.lat],
      getRadius:   r => bubbleRadius(getValue(r), maxValue),
      getFillColor: r => {
        const active = !ss || r.state === ss;
        return [cr, cg, cb, active ? (r.state === ss ? 42 : 28) : 6] as RGBA;
      },
      // Ring on the selected state bubble
      stroked: true,
      getLineColor: () => [cr, cg, cb, 200] as RGBA,
      getLineWidth: r => (ss && r.state === ss ? 2.5 : 0),
      lineWidthUnits: 'pixels',
      lineWidthMinPixels: 0,
      filled: true,
      radiusUnits: 'meters',
      pickable: true,
      onClick: (info: PickingInfo) => {
        if (info.object) onBubbleClick(info.object.state);
      },
      updateTriggers: {
        getRadius:    [state.commodity, state.mode],
        getFillColor: [state.commodity, state.mode, ss],
        getLineWidth: [ss],
      },
    });
  }, [state.commodity, state.mode, state.selectedState, onBubbleClick]);
}
