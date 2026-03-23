import { useMemo } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import type { Layer, PickingInfo } from '@deck.gl/core';
import { COMMODITY_COLORS, type UIState, type RGBA, type StateBalance } from '../types';
import { STATE_BALANCE } from '../data/stateBalance';
import { REGION_STATES } from '../data/regions';

export type BubbleDatum = StateBalance & { _isBubble: true };

// Signed storage view: green if capacity ≥ production, red otherwise (matches map tile surplus colors).
const BALANCE_POS: RGBA = [74, 222, 128, 255];
const BALANCE_NEG: RGBA = [248, 113, 113, 255];

// ─── Bubble scale ─────────────────────────────────────────────────────────────
// Area ∝ value → radius ∝ √value
const MAX_R = 110_000; // metres
const MIN_R = 12_000;

function bubbleRadius(value: number, maxValue: number): number {
  if (maxValue <= 0) return MIN_R;
  return MIN_R + Math.sqrt(Math.max(0, value) / maxValue) * (MAX_R - MIN_R);
}

function balanceFillAndLine(
  net: number,
  selected: boolean,
  dimmed: boolean,
): { fill: RGBA; line: RGBA } {
  const base = net >= 0 ? BALANCE_POS : BALANCE_NEG;
  const fillAlpha = dimmed ? 6 : selected ? 42 : 28;
  const lineAlpha = dimmed ? 20 : 200;
  return {
    fill: [base[0], base[1], base[2], fillAlpha] as RGBA,
    line: [base[0], base[1], base[2], lineAlpha] as RGBA,
  };
}

// ─── useProductionBubbles ─────────────────────────────────────────────────────

export function useProductionBubbles(
  state: UIState,
  onBubbleClick: (stateName: string) => void,
): Layer | null {
  return useMemo(() => {
    if (state.mode == null) return null;
    const mode = state.mode;
    const storageMetric = state.storageBubbleMetric;
    const productionMetric = state.productionBubbleMetric;
    const rows = STATE_BALANCE.filter(r => r.commodity === state.commodity);
    if (rows.length === 0) return null;

    const [cr, cg, cb] = COMMODITY_COLORS[state.commodity];
    const ss = state.selectedState;
    const regionStates = state.selectedRegion ? (REGION_STATES[state.selectedRegion] ?? null) : null;
    const hasFilter = !!ss || !!regionStates;
    const isActiveState = (s: string) => regionStates ? regionStates.includes(s) : (!ss || s === ss);

    const data: BubbleDatum[] = rows.map(r => ({ ...r, _isBubble: true as const }));

    const isStorageBalance = mode === 'storage' && storageMetric === 'balance';
    const isProductionBalance = mode === 'production' && productionMetric === 'balance';

    const getRadiusValue = (r: BubbleDatum): number => {
      if (mode === 'production') {
        switch (productionMetric) {
          case 'total':
            return r.productionTons;
          case 'consumption':
            return r.demandTons;
          case 'balance':
            return Math.abs(r.surplusDeficitTons);
        }
      }
      if (mode === 'storage') {
        return isStorageBalance
          ? Math.abs(r.storageCapacityTons - r.productionTons)
          : r.storageCapacityTons;
      }
      return 0;
    };

    const maxValue = Math.max(...data.map(getRadiusValue), 0);

    return new ScatterplotLayer<BubbleDatum>({
      id: 'production-bubbles',
      data,
      getPosition: r => [r.lng, r.lat],
      getRadius: r => bubbleRadius(getRadiusValue(r), maxValue),
      getFillColor: r => {
        const active = isActiveState(r.state);
        const inRegion = !!regionStates?.includes(r.state);
        const selected = !!ss && r.state === ss;
        const bright = !hasFilter || inRegion || selected;
        const dimmed = hasFilter && !active;
        if (isStorageBalance) {
          const net = r.storageCapacityTons - r.productionTons;
          return balanceFillAndLine(net, bright, dimmed).fill;
        }
        if (isProductionBalance) {
          const net = r.surplusDeficitTons;
          return balanceFillAndLine(net, bright, dimmed).fill;
        }
        return [cr, cg, cb, dimmed ? 6 : 42] as RGBA;
      },
      stroked: true,
      getLineColor: r => {
        const active = isActiveState(r.state);
        const inRegion = !!regionStates?.includes(r.state);
        const selected = !!ss && r.state === ss;
        const bright = !hasFilter || inRegion || selected;
        const dimmed = hasFilter && !active;
        if (isStorageBalance) {
          const net = r.storageCapacityTons - r.productionTons;
          return balanceFillAndLine(net, bright, dimmed).line;
        }
        if (isProductionBalance) {
          const net = r.surplusDeficitTons;
          return balanceFillAndLine(net, bright, dimmed).line;
        }
        return [cr, cg, cb, dimmed ? 50 : 200] as RGBA;
      },
      getLineWidth: r => {
        if (ss && r.state === ss) return 2.5;
        if (!hasFilter || regionStates?.includes(r.state)) return 1.5;
        return 0;
      },
      lineWidthUnits: 'pixels',
      lineWidthMinPixels: 0,
      filled: true,
      radiusUnits: 'meters',
      pickable: true,
      onClick: (info: PickingInfo) => {
        if (info.object) onBubbleClick(info.object.state);
      },
      updateTriggers: {
        getRadius: [state.commodity, mode, storageMetric, productionMetric],
        getFillColor: [state.commodity, mode, storageMetric, productionMetric, ss, state.selectedRegion],
        getLineColor: [state.commodity, mode, storageMetric, productionMetric, ss, state.selectedRegion],
        getLineWidth: [ss, state.selectedRegion],
      },
    });
  }, [
    state.commodity,
    state.mode,
    state.storageBubbleMetric,
    state.productionBubbleMetric,
    state.selectedState,
    state.selectedRegion,
    onBubbleClick,
  ]);
}
