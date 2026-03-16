/**
 * Updates src/data/*.ts from CSV files in data/.
 * Run: node scripts/update-data-from-csv.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const SRC_DATA_DIR = path.join(ROOT, 'src', 'data');

// ─── CSV parsing (handles quoted fields with commas) ────────────────────────

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ''));
    return row;
  });
  return { headers, rows };
}

function parseCSVLine(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let end = i + 1;
      while (end < line.length) {
        const next = line.indexOf('"', end);
        if (next === -1) break;
        if (line[next + 1] === '"') {
          end = next + 2;
          continue;
        }
        end = next;
        break;
      }
      out.push(line.slice(i + 1, end).replace(/""/g, '"'));
      i = end + 1;
      if (line[i] === ',') i++;
      continue;
    }
    const comma = line.indexOf(',', i);
    if (comma === -1) {
      out.push(line.slice(i).trim());
      break;
    }
    out.push(line.slice(i, comma).trim());
    i = comma + 1;
  }
  return out;
}

// ─── WKT LINESTRING → [lng, lat][] ─────────────────────────────────────────

function parsePathWkt(wkt) {
  if (!wkt || typeof wkt !== 'string') return [];
  const match = wkt.match(/LINESTRING\s*\((.+)\)/i);
  if (!match) return [];
  const pairs = match[1].split(/,\s*/).map((s) => s.trim().split(/\s+/));
  return pairs.map(([lng, lat]) => [Number(lng), Number(lat)]);
}

// ─── Hubs ──────────────────────────────────────────────────────────────────

function buildHubsTs(rows) {
  const lines = [
    "import type { Hub } from '../types';",
    '',
    'export const HUBS: Hub[] = [',
  ];
  const typeComments = {
    port: 'Ports',
    rail_hub: 'Rail / Logistics Hubs',
    buyer_cluster: 'Industrial Buyer Clusters',
    storage_cluster: 'Storage Clusters',
  };
  let lastType = null;
  for (const r of rows) {
    if (r.hub_type !== lastType) {
      lastType = r.hub_type;
      const label = typeComments[r.hub_type] || r.hub_type;
      lines.push(`  // ── ${label} ────────────────────────────────────────────────────────────────────`);
    }
    const isPort = r.is_port === '1' || r.is_port === 1;
    const isCurrent = r.is_current_active === '1' || r.is_current_active === 1;
    const isProposed = r.is_proposed_active === '1' || r.is_proposed_active === 1;
    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    const activationYear = parseInt(r.current_activation_year, 10) || 2026;
    const proposedActivationYear = parseInt(r.proposed_activation_year, 10) || 2026;
    const notes = (r.notes || '').trim();
    const notesPart = notes ? `, notes: ${JSON.stringify(notes)}` : '';
    lines.push(
      `  { id: ${JSON.stringify(r.hub_id)}, name: ${JSON.stringify(r.hub_name)}, type: ${JSON.stringify(r.hub_type)}, state: ${JSON.stringify(r.state)}, lat: ${lat}, lng: ${lng}, isPort: ${isPort}, isCurrent: ${isCurrent}, isProposed: ${isProposed}, activationYear: ${activationYear}, proposedActivationYear: ${proposedActivationYear}${notesPart} },`
    );
  }
  lines.push('];', '', 'export const HUB_BY_ID = Object.fromEntries(HUBS.map(h => [h.id, h]));', '');
  return lines.join('\n');
}

// ─── Routes ────────────────────────────────────────────────────────────────

function buildRoutesTs(rows) {
  const lines = [
    "import type { Route } from '../types';",
    '',
    '// Paths are [longitude, latitude][] arrays parsed from WKT LINESTRING data.',
    '// Baseline routes are included in both scenarios; proposed-only routes are new infrastructure.',
    '',
    'export const ROUTES: Route[] = [',
  ];
  let lastScenario = null;
  let sectionComment = null;
  for (const r of rows) {
    const scenario = r.scenario;
    const isFuture = r.is_future_infrastructure === '1' || r.is_future_infrastructure === 1;
    if (scenario === 'current' && sectionComment !== 'current') {
      sectionComment = 'current';
      lines.push('  // ══════════════════════════════════════════════════════════════════');
      lines.push('  // CURRENT SCENARIO — baseline routes');
      lines.push('  // ══════════════════════════════════════════════════════════════════');
    } else if (scenario === 'proposed' && !isFuture && sectionComment !== 'proposed_baseline') {
      sectionComment = 'proposed_baseline';
      lines.push('  // ══════════════════════════════════════════════════════════════════');
      lines.push('  // PROPOSED SCENARIO — retained baseline routes (same geometry)');
      lines.push('  // ══════════════════════════════════════════════════════════════════');
    } else if (scenario === 'proposed' && isFuture && sectionComment !== 'proposed_new') {
      sectionComment = 'proposed_new';
      lines.push('  // ══════════════════════════════════════════════════════════════════');
      lines.push('  // PROPOSED SCENARIO — new infrastructure interventions');
      lines.push('  // ══════════════════════════════════════════════════════════════════');
    }

    const path = parsePathWkt(r.path_wkt);
    const pathStr = path.length ? `[${path.map(([lng, lat]) => `[${lng}, ${lat}]`).join(', ')}]` : '[]';
    const isActive = r.is_active === '1' || r.is_active === 1;
    const activationYear = parseInt(r.activation_year, 10) || 2026;
    lines.push('  {');
    lines.push(`    id: ${JSON.stringify(r.route_id)}, scenario: ${JSON.stringify(scenario)}, commodity: ${JSON.stringify(r.commodity)},`);
    lines.push(`    originId: ${JSON.stringify(r.origin_hub_id)}, destId: ${JSON.stringify(r.destination_hub_id)}, mode: ${JSON.stringify(r.transport_mode)},`);
    lines.push(`    annualVolumeTons: ${Number(r.annual_volume_tons)}, distanceKm: ${Number(r.distance_km)},`);
    lines.push(`    isFutureInfrastructure: ${isFuture}, isActive: ${isActive},`);
    lines.push(`    description: ${JSON.stringify(r.route_description || '')},`);
    lines.push(`    path: ${pathStr},`);
    lines.push(`    lineStatus: ${JSON.stringify(r.line_status)}, phaseLabel: ${JSON.stringify(r.phase_label)}, activationYear: ${activationYear},`);
    lines.push('  },');
  }
  lines.push('];', '');
  return lines.join('\n');
}

// ─── State balance (2026 only) ─────────────────────────────────────────────

function buildStateBalanceTs(rows) {
  const year2026 = rows.filter((r) => String(r.year) === '2026');
  const lines = [
    "import type { StateBalance, Commodity, Scenario, Year } from '../types';",
    '',
    '// 2026 baseline for all states × commodities × scenarios.',
    '// The proposed scenario diverges from 2027 onward; 2026 values are identical.',
    'export const STATE_BALANCE_2026: StateBalance[] = [',
  ];
  let lastState = null;
  for (const r of year2026) {
    if (r.state !== lastState) {
      lastState = r.state;
      lines.push(`  // ── ${r.state} ──`);
    }
    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    lines.push(
      `  { state: ${JSON.stringify(r.state)}, commodity: ${JSON.stringify(r.commodity)}, scenario: ${JSON.stringify(r.scenario)}, year: 2026, productionTons: ${Number(r.production_tons)}, industrialDemandTons: ${Number(r.industrial_demand_tons)}, importsTons: ${Number(r.imports_assigned_tons)}, storageCapacityTons: ${Number(r.storage_capacity_tons)}, storageUtilizationRate: ${Number(r.storage_utilization_rate)}, surplusDeficitTons: ${Number(r.surplus_deficit_tons)}, lat: ${lat}, lng: ${lng} },`
    );
  }
  lines.push(
    '];',
    '',
    '/** Return 2026 rows filtered by commodity and scenario. */',
    'export function getStateBalance(commodity: Commodity, scenario: Scenario, year: Year = 2026): StateBalance[] {',
    '  return STATE_BALANCE_2026.filter(',
    '    r => r.commodity === commodity && r.scenario === scenario',
    '  );',
    '}',
    '',
    '/** Compute KPI summary across all states for a commodity+scenario. */',
    'export function computeKPIs(commodity: Commodity, scenario: Scenario) {',
    '  const rows = getStateBalance(commodity, scenario);',
    '  return {',
    '    totalProduction: rows.reduce((s, r) => s + r.productionTons, 0),',
    '    totalDemand: rows.reduce((s, r) => s + r.industrialDemandTons, 0),',
    '    totalImports: rows.reduce((s, r) => s + r.importsTons, 0),',
    '    totalSurplus: rows.filter(r => r.surplusDeficitTons > 0).reduce((s, r) => s + r.surplusDeficitTons, 0),',
    '    totalDeficit: rows.filter(r => r.surplusDeficitTons < 0).reduce((s, r) => s + Math.abs(r.surplusDeficitTons), 0),',
    '  };',
    '}',
    ''
  );
  return lines.join('\n');
}

// ─── Main ──────────────────────────────────────────────────────────────────

function main() {
  console.log('Reading CSVs from data/...');

  const hubsPath = path.join(DATA_DIR, 'hubs.csv');
  const routesPath = path.join(DATA_DIR, 'routes.csv');
  const stateBalancePath = path.join(DATA_DIR, 'state_grain_balance.csv');

  for (const p of [hubsPath, routesPath, stateBalancePath]) {
    if (!fs.existsSync(p)) {
      console.error(`Missing: ${p}`);
      process.exit(1);
    }
  }

  const hubsCsv = fs.readFileSync(hubsPath, 'utf8');
  const routesCsv = fs.readFileSync(routesPath, 'utf8');
  const stateBalanceCsv = fs.readFileSync(stateBalancePath, 'utf8');

  const { rows: hubRows } = parseCSV(hubsCsv);
  const { rows: routeRows } = parseCSV(routesCsv);
  const { rows: stateBalanceRows } = parseCSV(stateBalanceCsv);

  console.log(`  hubs: ${hubRows.length} rows`);
  console.log(`  routes: ${routeRows.length} rows`);
  console.log(`  state_grain_balance: ${stateBalanceRows.length} rows (2026: ${stateBalanceRows.filter((r) => r.year === '2026').length})`);

  const hubsTs = buildHubsTs(hubRows);
  const routesTs = buildRoutesTs(routeRows);
  const stateBalanceTs = buildStateBalanceTs(stateBalanceRows);

  fs.writeFileSync(path.join(SRC_DATA_DIR, 'hubs.ts'), hubsTs, 'utf8');
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'routes.ts'), routesTs, 'utf8');
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'stateBalance.ts'), stateBalanceTs, 'utf8');

  console.log('Wrote src/data/hubs.ts, src/data/routes.ts, src/data/stateBalance.ts');
}

main();
