import { useCallback, useMemo, useState } from 'react';
import { useUIState } from './store/useUIState';
import { useLayers } from './hooks/useLayers';
import { useProductionBubbles } from './hooks/useChoropleth';
import { useImportFlows } from './hooks/useImportFlows';
import { useAnimation } from './hooks/useAnimation';
import { SidePanel } from './components/SidePanel';
import { MapView } from './components/MapView';

export default function App() {
  const { state, ...actions } = useUIState();

  const animTime                            = useAnimation(0.28);
  const [hoveredArcId,  setHoveredArcId]  = useState<string | null>(null);
  const [selectedArcId, setSelectedArcId] = useState<string | null>(null);
  const handleArcHover  = useCallback((id: string | null) => setHoveredArcId(id), []);
  const handleArcClick  = useCallback((id: string) => setSelectedArcId(prev => prev === id ? null : id), []);
  const handleClearArc  = useCallback(() => setSelectedArcId(null), []);

  const bubbleLayer = useProductionBubbles(state);
  const hubLayers   = useLayers(state);
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
      <SidePanel state={state} actions={actions} />
      <MapView layers={layers} onHubClick={handleHubClick} onClearArcSelection={handleClearArc} />
    </div>
  );
}
