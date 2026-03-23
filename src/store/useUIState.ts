import { useReducer } from 'react';
import type {
  Commodity,
  ViewMode,
  UIState,
  HubType,
  ProductionBubbleMetric,
  StorageBubbleMetric,
} from '../types';
import { RAIL_OPERATORS } from '../data/railNetwork';

type Action =
  | { type: 'SET_COMMODITY'; commodity: Commodity }
  | { type: 'SET_MODE';      mode: ViewMode | null }
  | { type: 'SELECT_HUB';   hubId: string | null }
  | { type: 'SELECT_STATE';  stateName: string | null }
  | { type: 'SELECT_REGION'; region: string | null }
  | { type: 'SELECT_RAIL_OPERATOR'; operator: string | null }
  | { type: 'TOGGLE_HUB_TYPE'; hubType: HubType }
  | { type: 'TOGGLE_ALL_RAIL_OPERATORS' }
  | { type: 'TOGGLE_RAIL_OPERATOR'; operator: string }
  | { type: 'SET_PRODUCTION_BUBBLE_METRIC'; metric: ProductionBubbleMetric }
  | { type: 'SET_STORAGE_BUBBLE_METRIC'; metric: StorageBubbleMetric };

const INITIAL_STATE: UIState = {
  commodity:            'maize',
  mode:                 'production',
  productionBubbleMetric: 'total',
  storageBubbleMetric:  'total',
  selectedHubId:        null,
  selectedState:        null,
  selectedRegion:       null,
  selectedRailOperator: null,
  hubTypeVisibility: {
    port:         false,
    terminal:     false,
    import_node:  false,
    end_consumer: false,
  },
  railOperatorVisibility: Object.fromEntries(RAIL_OPERATORS.map(op => [op, false])),
};

function reducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case 'SET_COMMODITY': return { ...state, commodity: action.commodity, selectedHubId: null };
    case 'SET_MODE':      return { ...state, mode: action.mode,           selectedHubId: null };
    case 'SELECT_HUB':   return { ...state, selectedHubId: action.hubId };
    case 'SELECT_STATE':         return { ...state, selectedState: action.stateName, selectedHubId: null };
    case 'SELECT_REGION':        return { ...state, selectedRegion: action.region };
    case 'SELECT_RAIL_OPERATOR': return { ...state, selectedRailOperator: action.operator };
    case 'TOGGLE_HUB_TYPE': return {
      ...state,
      hubTypeVisibility: {
        ...state.hubTypeVisibility,
        [action.hubType]: !state.hubTypeVisibility[action.hubType],
      },
    };
    case 'TOGGLE_ALL_RAIL_OPERATORS': {
      const allOff = RAIL_OPERATORS.every(op => state.railOperatorVisibility[op] === false);
      return {
        ...state,
        railOperatorVisibility: Object.fromEntries(
          RAIL_OPERATORS.map(op => [op, allOff]),
        ),
        hubTypeVisibility: {
          ...state.hubTypeVisibility,
          terminal: allOff,
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
    case 'SET_PRODUCTION_BUBBLE_METRIC':
      return { ...state, productionBubbleMetric: action.metric };
    case 'SET_STORAGE_BUBBLE_METRIC':
      return { ...state, storageBubbleMetric: action.metric };
    default: return state;
  }
}

export function useUIState() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  return {
    state,
    setCommodity:         (commodity: Commodity) => dispatch({ type: 'SET_COMMODITY', commodity }),
    setMode:              (mode: ViewMode | null) => dispatch({ type: 'SET_MODE',      mode      }),
    selectHub:            (hubId: string | null)   => dispatch({ type: 'SELECT_HUB',   hubId     }),
    selectState:          (stateName: string | null)  => dispatch({ type: 'SELECT_STATE',         stateName }),
    selectRegion:         (region: string | null)     => dispatch({ type: 'SELECT_REGION',        region }),
    selectRailOperator:   (operator: string | null)   => dispatch({ type: 'SELECT_RAIL_OPERATOR', operator }),
    toggleHubType:        (hubType: HubType)     => dispatch({ type: 'TOGGLE_HUB_TYPE', hubType }),
    toggleAllRailOperators: () => dispatch({ type: 'TOGGLE_ALL_RAIL_OPERATORS' }),
    toggleRailOperator:   (operator: string)     => dispatch({ type: 'TOGGLE_RAIL_OPERATOR', operator }),
    setProductionBubbleMetric: (metric: ProductionBubbleMetric) =>
      dispatch({ type: 'SET_PRODUCTION_BUBBLE_METRIC', metric }),
    setStorageBubbleMetric: (metric: StorageBubbleMetric) =>
      dispatch({ type: 'SET_STORAGE_BUBBLE_METRIC', metric }),
  };
}

export type UIActions = Omit<ReturnType<typeof useUIState>, 'state'>;
