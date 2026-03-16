import { useReducer } from 'react';
import type { Commodity, ViewMode, UIState, HubType } from '../types';
import { RAIL_OPERATORS } from '../data/railNetwork';

type Action =
  | { type: 'SET_COMMODITY'; commodity: Commodity }
  | { type: 'SET_MODE';      mode: ViewMode }
  | { type: 'SELECT_HUB';   hubId: string | null }
  | { type: 'TOGGLE_HUB_TYPE'; hubType: HubType }
  | { type: 'TOGGLE_RAIL_NETWORK' }
  | { type: 'TOGGLE_RAIL_OPERATOR'; operator: string };

const INITIAL_STATE: UIState = {
  commodity:     'maize',
  mode:          'production',
  selectedHubId: null,
  hubTypeVisibility: {
    port:         true,
    terminal:     true,
    import_node:  true,
    end_consumer: true,
  },
  showRailNetwork: true,
  railOperatorVisibility: Object.fromEntries(RAIL_OPERATORS.map(op => [op, true])),
};

function reducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case 'SET_COMMODITY': return { ...state, commodity: action.commodity, selectedHubId: null };
    case 'SET_MODE':      return { ...state, mode: action.mode,           selectedHubId: null };
    case 'SELECT_HUB':   return { ...state, selectedHubId: action.hubId };
    case 'TOGGLE_HUB_TYPE': return {
      ...state,
      hubTypeVisibility: {
        ...state.hubTypeVisibility,
        [action.hubType]: !state.hubTypeVisibility[action.hubType],
      },
    };
    case 'TOGGLE_RAIL_NETWORK': {
      const nextShow = !state.showRailNetwork;
      return {
        ...state,
        showRailNetwork: nextShow,
        // Terminals follow the master rail toggle (one‑way coupling)
        hubTypeVisibility: {
          ...state.hubTypeVisibility,
          terminal: nextShow,
        },
      };
    }
    case 'TOGGLE_RAIL_OPERATOR': return {
      ...state,
      railOperatorVisibility: {
        ...state.railOperatorVisibility,
        [action.operator]: !state.railOperatorVisibility[action.operator],
      },
    };
    default: return state;
  }
}

export function useUIState() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  return {
    state,
    setCommodity:         (commodity: Commodity) => dispatch({ type: 'SET_COMMODITY', commodity }),
    setMode:              (mode: ViewMode)       => dispatch({ type: 'SET_MODE',      mode      }),
    selectHub:            (hubId: string | null) => dispatch({ type: 'SELECT_HUB',   hubId     }),
    toggleHubType:        (hubType: HubType)     => dispatch({ type: 'TOGGLE_HUB_TYPE', hubType }),
    toggleRailNetwork:    ()                     => dispatch({ type: 'TOGGLE_RAIL_NETWORK' }),
    toggleRailOperator:   (operator: string)     => dispatch({ type: 'TOGGLE_RAIL_OPERATOR', operator }),
  };
}

export type UIActions = Omit<ReturnType<typeof useUIState>, 'state'>;
