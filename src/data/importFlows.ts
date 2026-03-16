// ─── US import origin ─────────────────────────────────────────────────────────
// Generic US corn-belt origin (Kansas / Oklahoma) — represents the broad
// US export origin; not tied to any specific port or crossing.
export const US_ORIGIN: [number, number] = [-97.5, 38.0];

// ─── Import volumes per node (tons/year, estimated) ───────────────────────────
// Sources: importacion maiz.xlsx (categories/nature of each node used to
// assign relative scale); absolute figures are indicative/estimated.
export const IMPORT_NODE_VOLUMES: Record<string, number> = {
  'I-001': 500_000,  // Cargill — large processor
  'I-002': 200_000,  // Bartlett Logistics
  'I-003': 300_000,  // ADM México
  'I-004': 250_000,  // VITERRA México
  'I-005': 100_000,  // Compañía Nacional Almacenadora
  'I-006':  80_000,  // Comercializadora Mayorista del Golfo
  'I-007': 150_000,  // PORTIMEX
  'I-008': 120_000,  // Graneros San Juan
  'I-009': 180_000,  // Alimentos Granos y Forrajes de la Frontera
  'I-010': 200_000,  // Importaciones GARBA
  'I-011':  90_000,  // Anaiza Garza López
  'I-012': 330_000,  // Louis Dreyfus Company México (total to identified consumers)
  'I-013': 320_000,  // COFCO AGRI México (total to identified consumers)
};

// ─── End-consumer supply chain linkages ───────────────────────────────────────
// Source: imports_oficina comercial.xlsx — "Empresa" column
// Each consumer is supplied by one of the two commercial-office import nodes.
export const CONSUMER_PROVIDER: Record<string, string> = {
  'C-001': 'I-012',  // Industrial Patrona     ← Louis Dreyfus Company México
  'C-002': 'I-012',  // CAMPI Alimentos         ← Louis Dreyfus Company México
  'C-003': 'I-012',  // Bachoco — Tihuatlán     ← Louis Dreyfus Company México
  'C-004': 'I-013',  // Productores Ganaderos GUSI ← COFCO AGRI México
  'C-005': 'I-013',  // SuKarne Agroindustrial   ← COFCO AGRI México
};

// ─── Consumer volumes (tons/year, estimated) ──────────────────────────────────
export const CONSUMER_VOLUMES: Record<string, number> = {
  'C-001': 100_000,  // Industrial Patrona
  'C-002':  80_000,  // CAMPI Alimentos
  'C-003': 150_000,  // Bachoco
  'C-004': 120_000,  // Productores Ganaderos GUSI
  'C-005': 200_000,  // SuKarne Agroindustrial
};
