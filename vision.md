Project brief

We want to build an interactive geospatial visualization for Mexico’s basic grains system, focused on maize, beans, wheat, and rice. The application should show the current logistics network and a proposed future scenario, with emphasis on animated commercial flows rather than cartographic detail. The map should help explain how grain moves through the system: where it is produced, imported, transported, stored, and purchased by industrial/manufacturing actors, and how that picture changes under future infrastructure and regulatory interventions.

The visualization should support two major modes: Current Situation and Proposed Situation. In both modes, the user should be able to switch commodities, filter by geography and time, and see animated flow lines, hubs, ports, storage nodes, and summary metrics update accordingly. The main storytelling value is in the animation and comparison logic, not in a highly detailed GIS workflow.

Recommended front-end stack

Use React + TypeScript for the application shell, filters, state management, legends, panels, scenario switching, and future extensibility. Use deck.gl as the main visualization engine, since it is designed for GPU-powered, large-scale visual analytics, supports React directly, ships with official TypeScript types, and can also run independently of React or a basemap if needed. Use MapLibre GL JS only as the optional basemap and lightweight choropleth engine, since it is a TypeScript/WebGL map library and supports data-driven styling and feature-state, which is enough for simple contextual thematic layers.

For integration, the safest default is to run deck.gl over MapLibre in overlaid mode: MapLibre provides the geographic context and optional choropleths, while deck.gl owns the animated routes, hubs, and interactive overlays. deck.gl’s docs note that overlaid mode is generally the more robust option for 2D maps because the two libraries manage their rendering independently while keeping the cameras synchronized.

Visualization model

Use deck.gl layers as the main rendering primitives:

TripsLayer for animated grain movement over time along rail, road, or maritime routes.

PathLayer for fixed corridors such as current or proposed train lines.

ArcLayer for schematic hub-to-hub or port-to-hub flows when a cleaner explanatory diagram is preferable to literal route geometry.

ScatterplotLayer / IconLayer / TextLayer for hubs, silos, warehouses, ports, and industrial buyers.

MapLibre fill/line layers for simple choropleths, administrative boundaries, and contextual base layers.

Functional scope for the first sketch

The first sketch should include:

commodity selector: [MAIZE] [BEANS] [WHEAT] [RICE]

scenario selector: [CURRENT] [PROPOSED]

mode selector: [TRANSPORT] [IMPORTS] [INDUSTRIAL PURCHASES] [STORAGE]

map with animated routes and clickable hubs

side panel with key indicators and a short narrative

timeline or playback slider, even if initially mocked

hover and click interactions for routes, hubs, ports, and storage sites

Suggested placeholder data model

Use placeholder datasets for now, with stable contracts that can later be connected to real APIs or files:

[STATE_CHOROPLETH_DATA]
State/region polygons with indicator fields such as production, deficit/surplus, storage capacity, or industrial demand.

[FLOW_ROUTES_CURRENT]
Route geometry plus fields like commodity, origin_id, destination_id, mode, volume_tons, time_index, route_status=current.

[FLOW_ROUTES_PROPOSED]
Same structure as above, but reflecting future rail, port, or storage scenarios.

[HUBS_DATA]
Ports, rail hubs, industrial buyers, silos, warehouses, and logistics nodes with fields like hub_type, capacity_current, capacity_proposed, throughput_current, throughput_proposed.

[IMPORT_POINTS_DATA]
Ports/border crossings with import volumes by commodity.

[BUYERS_DATA]
Industrial/manufacturing demand nodes, not final consumption.

[STORAGE_DATA]
Silos and warehouses with current and projected capacity.

[SCENARIO_ASSUMPTIONS]
Explicit assumptions for the proposed future: new train lines, port regulation effects, storage expansion, and any estimated rerouting logic.

Architecture note

The app should be built so that UI state drives a derived visualization state, and that visualization state generates the active deck.gl and MapLibre layers. In other words: the user does not directly manipulate map layers; instead, selections such as commodity, scenario, and metric produce a consistent layer configuration. This will make future updates much easier when real datasets, new scenarios, or additional commodities are introduced. deck.gl is designed around composing multiple layers, and custom behavior can also be packaged into reusable composite layers later if needed.

Future-proofing requirements

The implementation should assume future additions such as:

new commodities

more transport modes

yearly scenario comparisons

more detailed buyer categories

toggles between literal geographic routes and schematic hub networks

custom shader effects or bespoke animation rules later on

This is another reason to keep deck.gl as the main rendering system and treat MapLibre as optional context. deck.gl already supports custom layer development and shader-based extensions, which gives the team room to move beyond the first version without a major rewrite.