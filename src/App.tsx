import { useCallback, useMemo, useState } from 'react';
import { useUIState } from './store/useUIState';
import { useLayers } from './hooks/useLayers';
import { useRailSegments } from './hooks/useRailSegments';
import { useProductionBubbles } from './hooks/useChoropleth';
import { useImportFlows } from './hooks/useImportFlows';
import { useAnimation } from './hooks/useAnimation';
import { SidePanel } from './components/SidePanel';
import { MapView, type BasemapId } from './components/MapView';

export default function App() {
  const { state, ...actions } = useUIState();
  const [basemap, setBasemap] = useState<BasemapId>('dark');

  const animTime                            = useAnimation(0.28);
  const [hoveredArcId,  setHoveredArcId]  = useState<string | null>(null);
  const [selectedArcId, setSelectedArcId] = useState<string | null>(null);
  const handleArcHover  = useCallback((id: string | null) => setHoveredArcId(id), []);
  const handleArcClick  = useCallback((id: string) => setSelectedArcId(prev => prev === id ? null : id), []);
  const handleClearArc  = useCallback(() => setSelectedArcId(null), []);
  const handleClearHub  = useCallback(() => actions.selectHub(null), [actions]);

  const handleBubbleClick = useCallback(
    (stateName: string) => actions.selectState(state.selectedState === stateName ? null : stateName),
    [actions, state.selectedState],
  );
  const handleRailClick = useCallback(
    (operator: string) => actions.selectRailOperator(state.selectedRailOperator === operator ? null : operator),
    [actions, state.selectedRailOperator],
  );
  const handleClearRailOperator = useCallback(() => actions.selectRailOperator(null), [actions]);

  const railSegments = useRailSegments();

  const bubbleLayer = useProductionBubbles(state, handleBubbleClick);
  const hubLayers   = useLayers(state, handleRailClick, railSegments);
  const importFlows = useImportFlows(state, animTime, hoveredArcId, selectedArcId, handleArcHover, handleArcClick);

  const layers = useMemo(
    () => [
      ...(bubbleLayer ? [bubbleLayer] : []),
      ...importFlows,   // arcs beneath hubs
      ...hubLayers,
    ],
    [bubbleLayer, importFlows, hubLayers],
  );

  const handleHubClick = useCallback(
    (hubId: string) => {
      actions.selectHub(state.selectedHubId === hubId ? null : hubId);
    },
    [actions, state.selectedHubId],
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      <SidePanel state={state} actions={actions} basemap={basemap} onSetBasemap={setBasemap} />
      <MapView
        basemap={basemap}
        layers={layers}
        onHubClick={handleHubClick}
        onClearArcSelection={handleClearArc}
        onClearHub={handleClearHub}
        selectedState={state.selectedState}
        onSelectState={actions.selectState}
        selectedRegion={state.selectedRegion}
        onSelectRegion={actions.selectRegion}
        selectedHubId={state.selectedHubId}
        selectedArcId={selectedArcId}
        selectedRailOperator={state.selectedRailOperator}
        onClearRailOperator={handleClearRailOperator}
        commodity={state.commodity}
        mode={state.mode}
        productionBubbleMetric={state.productionBubbleMetric}
        storageBubbleMetric={state.storageBubbleMetric}
      />
    </div>
  );
}
