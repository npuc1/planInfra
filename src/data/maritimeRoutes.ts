// ─── Maritime Route Definitions ───────────────────────────────────────────────
// Rutas marítimas desde Topolobampo hacia puertos del Pacífico y del Golfo.
// Puertos del Golfo tienen dos alternativas: vía Canal de Panamá (sólida)
// y vía Estrecho de Magallanes (punteada).

export type Coord = [number, number]; // [lng, lat]

export type MaritimeRouteType = 'pacific' | 'panama' | 'magellan';

export interface MaritimeRoute {
  id: string;
  name: string;
  type: MaritimeRouteType;
  path: Coord[];
  /** Display range, e.g. "3.8–4.6" (días). Undefined for Magellan. */
  durationRange?: string;
  /** Extra note shown below the duration stat. */
  durationNote?: string;
}

// ─── Port coordinates ──────────────────────────────────────────────────────────

const TOPOLOBAMPO: Coord    = [-109.05,  25.60];
const SALINA_CRUZ: Coord    = [ -95.20,  16.17];
const PUERTO_CHIAPAS: Coord = [ -92.32,  14.71];
const VERACRUZ: Coord       = [ -96.13,  19.18];
const COATZACOALCOS: Coord  = [ -94.42,  18.15];
const PROGRESO: Coord       = [ -89.66,  21.28];

// ─── Shared path segments ─────────────────────────────────────────────────────

/**
 * Pacific coast of Mexico — southbound from Topolobampo.
 *
 * Topolobampo is on the mainland (east) side of the Gulf of California.
 * Baja California's east coast runs at roughly −110.3 W (La Paz, 24 N) down
 * to the tip at Cabo San Lucas (−109.92 W, 22.88 N).  The route must stay
 * EAST of that coast (i.e. longitude > −110 W) while heading south through
 * the Gulf, then slip past the tip once below 22.88 N and swing into the
 * open Pacific.  Going west of −110 W above the tip cuts over the peninsula.
 */
const SEG_PACIFIC_MEXICO: Coord[] = [
  TOPOLOBAMPO,
  [-109.50,  24.50],  // South through Gulf — east of Baja east coast (~−110.3 W)
  [-109.50,  23.00],  // Continuing south — Baja tip just to the west at −109.92 W
  [-109.50,  22.50],  // Past Cabo San Lucas (22.88 N) — now in the open Pacific
  [-108.00,  21.00],  // Pacific Ocean, heading SE
  [-106.00,  18.50],  // Offshore Jalisco / Colima
  [-103.50,  16.80],  // Offshore Guerrero
  [-100.00,  15.80],  // Offshore Oaxaca
  [ -97.00,  15.50],  // Approaching Salina Cruz from the west
  SALINA_CRUZ,
];

/**
 * Salina Cruz → Puerto Chiapas → Central America → Panama Canal Pacific entrance.
 * Stays in the Gulf of Tehuantepec and the Pacific, well clear of the coast.
 */
const SEG_PACIFIC_SOUTH: Coord[] = [
  PUERTO_CHIAPAS,
  [ -91.50,  13.80],  // Gulf of Tehuantepec, offshore Guatemala
  [ -90.00,  13.00],  // Offshore El Salvador / Guatemala border
  [ -88.00,  12.00],  // Offshore Nicaragua
  [ -86.00,  10.50],  // Offshore Costa Rica
  [ -83.50,   8.80],  // Offshore southern Costa Rica
  [ -81.00,   8.20],  // Gulf of Panama, heading toward canal
  [ -79.53,   8.93],  // Panama Canal — Pacific entrance (Balboa)
];

/** Panama Canal transit */
const SEG_CANAL: Coord[] = [
  [-79.53,   8.93],   // Pacific entrance
  [-79.70,   9.10],   // Gatún Lake approach
  [-79.91,   9.38],   // Atlantic exit (Colón)
];

/**
 * Caribbean crossing and Yucatan Channel.
 *
 * Routes south of Jamaica (Jamaica ~17.7–18.5°N) and south of Cuba to avoid
 * overland shortcuts, then enter the Yucatan Channel between Cuba's western
 * tip (~−84.9°, 22°N) and the Yucatan's NE corner (Cancún ~−86.8°, 21.2°N).
 *
 * Junction point with the Gulf arrival segments: [−86.0, 23.0]
 * — clearly north of the Yucatan Peninsula in the Gulf of Mexico.
 */
const SEG_CARIBBEAN_TO_GULF: Coord[] = [
  [-79.91,   9.38],   // Colón
  [-77.00,  11.50],   // Caribbean, north of Colombia
  [-74.00,  14.00],   // Caribbean central
  [-75.00,  16.50],   // Heading NW, south of Hispaniola
  [-78.00,  17.00],   // South of Jamaica (Jamaica: 17.7–18.5°N)
  [-82.00,  18.50],   // Caribbean south of Cuba
  [-84.00,  19.50],   // West of Cayman Islands, south of Cuba
  [-85.50,  21.50],   // Yucatan Channel — between Cuba and Yucatan
  [-86.00,  23.00],   // Gulf of Mexico — junction with arrival segments
];

// ─── Gulf arrival segments (all start at the common junction) ─────────────────
// Junction: [−86.0, 23.0] is north of the Yucatan Peninsula (north coast ~21.3°N)
// so routes stay in open Gulf water before descending to each port.

const SEG_GULF_TO_PROGRESO: Coord[] = [
  [-86.00,  23.00],   // junction
  [-88.50,  22.50],   // Gulf of Mexico, north of Yucatan
  PROGRESO,           // approach Progreso from the north
];

const SEG_GULF_TO_COATZA: Coord[] = [
  [-86.00,  23.00],   // junction
  [-90.00,  23.00],   // Gulf heading west, clearing Yucatan
  [-92.50,  21.50],   // Campeche Bay area (open water)
  [-94.00,  20.00],   // Approaching Coatzacoalcos from north
  COATZACOALCOS,
];

const SEG_GULF_TO_VERACRUZ: Coord[] = [
  [-86.00,  23.00],   // junction
  [-91.00,  23.00],   // Gulf heading west, clearing Yucatan
  [-94.00,  22.00],   // Campeche Bay area
  [-96.00,  21.00],   // Approaching Veracruz from northeast
  VERACRUZ,
];

// ─── Magellan alternate: Pacific coast of South America ───────────────────────

/**
 * From the Panama Canal Pacific entrance, head south along the Pacific coast
 * of South America, through the Strait of Magellan, and up the Atlantic.
 *
 * Starts at the same point where Panama routes enter the canal (divergence).
 * First goes west into the open Pacific before tracking south along the coast,
 * to avoid clipping the Gulf of Panama / Darién coast.
 */
const SEG_PACIFIC_SOUTH_AMERICA: Coord[] = [
  [-79.53,   8.93],  // Panama Canal Pacific entrance — divergence point
  [-81.00,   7.50],  // Gulf of Panama, heading west/offshore first
  [-80.00,   4.00],  // Pacific, west of Colombia
  [-78.00,   1.00],  // Pacific, off Ecuador / Colombia border
  [-80.50,  -1.50],  // Ecuador coast offshore
  [-81.00,  -6.00],  // Peru north offshore
  [-78.00, -12.00],  // Peru central offshore (Lima area)
  [-76.00, -18.00],  // Peru south
  [-71.00, -18.50],  // Chile norte grande (Arica)
  [-70.50, -23.00],  // Antofagasta
  [-71.60, -33.00],  // Valparaíso
  [-72.50, -40.00],  // Los Lagos
  [-74.50, -50.50],  // Estrecho de Magallanes — entrada oeste
  [-70.80, -52.50],  // Estrecho de Magallanes — centro
  [-68.90, -52.70],  // Estrecho de Magallanes — salida este
];

/**
 * Magellan → up the Atlantic coast → Yucatan Channel.
 * Ends at the same Gulf junction [−86.0, 23.0] as the Panama routes (rejoin point).
 */
const SEG_ATLANTIC_UP: Coord[] = [
  [-68.90, -52.70],  // Estrecho salida
  [-63.50, -49.00],  // Islas Malvinas area
  [-57.00, -41.00],  // Patagonia Argentina
  [-52.00, -32.00],  // Uruguay coast
  [-46.50, -24.00],  // São Paulo coast
  [-38.00, -10.00],  // Salvador, Brazil
  [-35.00,  -4.00],  // Fortaleza, Brazil
  [-52.00,  10.00],  // Atlantic toward Caribbean
  [-61.00,  13.00],  // Eastern Caribbean (Barbados)
  [-66.00,  12.00],  // Venezuela coast
  [-75.00,  16.50],  // Caribbean, south of Hispaniola
  [-78.00,  17.00],  // South of Jamaica
  [-82.00,  18.50],  // Caribbean south of Cuba
  [-84.00,  19.50],  // West of Caymans
  [-85.50,  21.50],  // Yucatan Channel
  [-86.00,  23.00],  // Gulf of Mexico — rejoin point
];

// ─── Segment definitions ───────────────────────────────────────────────────────
//
// Each segment is a discrete, pickable portion of the overall network.
// `clickRoute` — the route ID that gets selected when this segment is clicked.
// `partOf`     — all route IDs that traverse this segment (used for highlighting).
//
// Clicking a shared segment activates its canonical "deepest" destination; when
// any route is selected, every segment in `partOf` for that route is highlighted.

export interface MaritimeSegment {
  id: string;
  clickRoute: string;
  partOf: string[];
  type: MaritimeRouteType;
  path: Coord[];
}

export const ROUTE_SEGMENTS: MaritimeSegment[] = [
  // Topolobampo → Salina Cruz (shared by every route)
  {
    id: 'seg-topo-sc',
    clickRoute: 'topo-salina-cruz',
    partOf: [
      'topo-salina-cruz',
      'topo-puerto-chiapas',
      'topo-veracruz-panama',
      'topo-coatzacoalcos-panama',
      'topo-progreso-panama',
    ],
    type: 'pacific',
    path: SEG_PACIFIC_MEXICO,
  },

  // Salina Cruz → Puerto Chiapas
  {
    id: 'seg-sc-pc',
    clickRoute: 'topo-puerto-chiapas',
    partOf: [
      'topo-puerto-chiapas',
      'topo-veracruz-panama',
      'topo-coatzacoalcos-panama',
      'topo-progreso-panama',
    ],
    type: 'pacific',
    path: [SALINA_CRUZ, PUERTO_CHIAPAS],
  },

  // Puerto Chiapas → Panama Canal Pacific entrance (shared by all Panama/Magellan)
  {
    id: 'seg-pc-canal',
    clickRoute: 'topo-progreso-panama',
    partOf: ['topo-veracruz-panama', 'topo-coatzacoalcos-panama', 'topo-progreso-panama'],
    type: 'panama',
    path: SEG_PACIFIC_SOUTH,
  },

  // Panama Canal transit
  {
    id: 'seg-canal',
    clickRoute: 'topo-progreso-panama',
    partOf: ['topo-veracruz-panama', 'topo-coatzacoalcos-panama', 'topo-progreso-panama'],
    type: 'panama',
    path: SEG_CANAL,
  },

  // Caribbean to Gulf junction (shared by all three Gulf routes)
  {
    id: 'seg-caribbean',
    clickRoute: 'topo-progreso-panama',
    partOf: ['topo-veracruz-panama', 'topo-coatzacoalcos-panama', 'topo-progreso-panama'],
    type: 'panama',
    path: SEG_CARIBBEAN_TO_GULF,
  },

  // Gulf junction → Progreso (exclusive)
  {
    id: 'seg-gulf-progreso',
    clickRoute: 'topo-progreso-panama',
    partOf: ['topo-progreso-panama'],
    type: 'panama',
    path: SEG_GULF_TO_PROGRESO,
  },

  // Gulf junction → Coatzacoalcos (exclusive)
  {
    id: 'seg-gulf-coatza',
    clickRoute: 'topo-coatzacoalcos-panama',
    partOf: ['topo-coatzacoalcos-panama'],
    type: 'panama',
    path: SEG_GULF_TO_COATZA,
  },

  // Gulf junction → Veracruz (exclusive)
  {
    id: 'seg-gulf-veracruz',
    clickRoute: 'topo-veracruz-panama',
    partOf: ['topo-veracruz-panama'],
    type: 'panama',
    path: SEG_GULF_TO_VERACRUZ,
  },

  // Magellan alternate (diverges at Canal entrance, rejoins at Gulf junction)
  {
    id: 'seg-magellan',
    clickRoute: 'magellan-alternate',
    partOf: ['magellan-alternate'],
    type: 'magellan',
    path: [...SEG_PACIFIC_SOUTH_AMERICA, ...SEG_ATLANTIC_UP.slice(1)],
  },
];

// ─── Assembled routes ──────────────────────────────────────────────────────────
// Used only for the info tile — segments drive the actual rendering.

export const MARITIME_ROUTES: MaritimeRoute[] = [

  // ── Pacific-only routes ────────────────────────────────────────────────────

  {
    id:   'topo-salina-cruz',
    name: 'Topolobampo → Salina Cruz',
    type: 'pacific',
    durationRange: '3.8–4.6',
    path: [...SEG_PACIFIC_MEXICO],
  },

  {
    id:   'topo-puerto-chiapas',
    name: 'Topolobampo → Puerto Chiapas',
    type: 'pacific',
    durationRange: '4.3–5.2',
    path: [...SEG_PACIFIC_MEXICO, PUERTO_CHIAPAS],
  },

  // ── Gulf routes via Panama Canal (solid) ──────────────────────────────────

  {
    id:   'topo-veracruz-panama',
    name: 'Topolobampo → Veracruz',
    type: 'panama',
    durationRange: '13.8–16.4',
    durationNote: 'vía Canal de Panamá',
    path: [
      ...SEG_PACIFIC_MEXICO,
      PUERTO_CHIAPAS,
      ...SEG_PACIFIC_SOUTH.slice(1),   // skip duplicate PUERTO_CHIAPAS
      ...SEG_CANAL.slice(1),
      ...SEG_CARIBBEAN_TO_GULF.slice(1),
      ...SEG_GULF_TO_VERACRUZ.slice(1),
    ],
  },

  {
    id:   'topo-coatzacoalcos-panama',
    name: 'Topolobampo → Coatzacoalcos',
    type: 'panama',
    durationRange: '13.6–16.2',
    durationNote: 'vía Canal de Panamá',
    path: [
      ...SEG_PACIFIC_MEXICO,
      PUERTO_CHIAPAS,
      ...SEG_PACIFIC_SOUTH.slice(1),
      ...SEG_CANAL.slice(1),
      ...SEG_CARIBBEAN_TO_GULF.slice(1),
      ...SEG_GULF_TO_COATZA.slice(1),
    ],
  },

  {
    id:   'topo-progreso-panama',
    name: 'Topolobampo → Progreso',
    type: 'panama',
    durationRange: '12.4–14.7',
    durationNote: 'vía Canal de Panamá',
    path: [
      ...SEG_PACIFIC_MEXICO,
      PUERTO_CHIAPAS,
      ...SEG_PACIFIC_SOUTH.slice(1),
      ...SEG_CANAL.slice(1),
      ...SEG_CARIBBEAN_TO_GULF.slice(1),
      ...SEG_GULF_TO_PROGRESO.slice(1),
    ],
  },

  // ── Gulf routes via Strait of Magellan (dashed alternate) ─────────────────
  // Single path: diverges at Panama Canal Pacific entrance, rejoins at
  // the Gulf of Mexico junction [−86.0, 23.0] shared with Panama routes.

  {
    id:   'magellan-alternate',
    name: 'Alternativa vía Estrecho de Magallanes',
    type: 'magellan',
    durationNote: '+45 días adicionales sobre la ruta por Canal de Panamá',
    path: [
      ...SEG_PACIFIC_SOUTH_AMERICA,    // Panama Canal entrance → Magellan → Atlantic
      ...SEG_ATLANTIC_UP.slice(1),     // up coast → Gulf junction
    ],
  },
];
