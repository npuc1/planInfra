import type { UIActions } from '../store/useUIState';
import type { BasemapId } from './MapView';
import type {
  UIState,
  Commodity,
  ViewMode,
  ProductionBubbleMetric,
  StorageBubbleMetric,
  HubType,
} from '../types';
import {
  COMMODITY_COLORS,
  COMMODITY_LABELS,
  HUB_TYPE_COLORS,
  HUB_TYPE_LABELS,
  MODE_LABELS,
  PRODUCTION_BUBBLE_LABELS,
  STORAGE_BUBBLE_LABELS,
} from '../types';
import { RAIL_OPERATORS, RAIL_OPERATOR_COLORS, RAIL_OPERATOR_NAMES } from '../data/railNetwork';
import {
  PORT_MOV_GROUP_LABELS,
  PORT_MOV_METRIC_LABELS,
  GROUP_METRICS,
  type PortMovGroup,
  type PortMovMetric,
} from '../data/puertoMovimientos';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COMMODITIES: Commodity[] = ['maize', 'beans', 'wheat', 'rice'];
const MODES: ViewMode[]        = ['production', 'storage'];
const PRODUCTION_METRICS: ProductionBubbleMetric[] = ['total', 'consumption', 'balance'];
const STORAGE_METRICS: StorageBubbleMetric[] = ['total', 'balance'];

// ─── PillGroup ────────────────────────────────────────────────────────────────

function PillGroup<T extends string>({
  label,
  options,
  active,
  onSelect,
  colorMap,
}: {
  label: string;
  options: { value: T; label: string }[];
  active: T;
  onSelect: (v: T) => void;
  colorMap?: Partial<Record<T, string>>;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(({ value, label: lbl }) => {
          const isActive = value === active;
          const style = colorMap?.[value]
            ? isActive
              ? { backgroundColor: colorMap[value], color: '#000', borderColor: colorMap[value] }
              : { borderColor: colorMap[value], color: colorMap[value] }
            : {};
          return (
            <button
              key={value}
              onClick={() => onSelect(value)}
              style={style}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                isActive
                  ? (colorMap?.[value] ? '' : 'bg-white text-slate-900 border-white')
                  : (colorMap?.[value] ? 'bg-transparent' : 'border-slate-600 text-slate-400 hover:border-slate-300 hover:text-slate-200')
              }`}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Vista pills: click active again to clear (no choropleth bubbles). */
function ViewModePillGroup({
  active,
  onChange,
}: {
  active: ViewMode | null;
  onChange: (v: ViewMode | null) => void;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Vista</p>
      <div className="flex flex-wrap gap-1.5">
        {MODES.map(m => {
          const isActive = m === active;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange(isActive ? null : m)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                isActive
                  ? 'bg-white text-slate-900 border-white'
                  : 'border-slate-600 text-slate-400 hover:border-slate-300 hover:text-slate-200'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hub type toggle row (legend) ─────────────────────────────────────────────

function HubTypeToggleRow({
  hubType,
  visible,
  onToggle,
}: {
  hubType: HubType;
  visible: boolean;
  onToggle: () => void;
}) {
  const [r2, g2, b2] = HUB_TYPE_COLORS[hubType];
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 transition-all text-left group ${
        visible ? 'bg-slate-800/60 hover:bg-slate-700/70 text-slate-50' : 'opacity-40 hover:opacity-60'
      }`}
    >
      <span
        className="w-3 h-3 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
        style={{
          backgroundColor: visible ? `rgb(${r2},${g2},${b2})` : 'transparent',
          border: `2px solid rgb(${r2},${g2},${b2})`,
        }}
      />
      <span className={`text-xs ${visible ? 'font-semibold text-slate-100' : 'text-slate-400 line-through'}`}>
        {HUB_TYPE_LABELS[hubType]}
      </span>
    </button>
  );
}

// ─── SidePanel ────────────────────────────────────────────────────────────────

const BASEMAP_OPTIONS: { id: BasemapId; label: string }[] = [
  { id: 'dark',  label: 'Oscuro'    },
  { id: 'light', label: 'Claro'     },
  { id: 'gray',  label: 'Topográfico' },
];

interface SidePanelProps {
  state:        UIState;
  actions:      UIActions;
  basemap:      BasemapId;
  onSetBasemap: (b: BasemapId) => void;
}

export function SidePanel({ state, actions, basemap, onSetBasemap }: SidePanelProps) {
  const commodityRgb = COMMODITY_COLORS[state.commodity];
  const commodityHex = `rgb(${commodityRgb[0]},${commodityRgb[1]},${commodityRgb[2]})`;

  const commodityOptions = COMMODITIES.map(c => ({ value: c, label: COMMODITY_LABELS[c] }));
  const commodityColorMap = Object.fromEntries(
    COMMODITIES.map(c => {
      const [r2, g2, b2] = COMMODITY_COLORS[c];
      return [c, `rgb(${r2},${g2},${b2})`];
    }),
  ) as Record<Commodity, string>;

  const anyRailOn = RAIL_OPERATORS.some(
    op => state.railOperatorVisibility[op] !== false,
  );

  return (
    <aside className="w-80 flex-shrink-0 h-full bg-slate-900/95 backdrop-blur-sm border-r border-slate-800 flex flex-col overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-800">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          Plan Nacional de Infraestructura Agrícola
        </p>
        <h1 className="text-lg font-extrabold text-white leading-tight">
          Balance Granos · 2025
        </h1>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-800 flex-shrink-0">
        <PillGroup
          label="Producto"
          options={commodityOptions}
          active={state.commodity}
          onSelect={actions.setCommodity}
          colorMap={commodityColorMap}
        />
        <ViewModePillGroup active={state.mode} onChange={actions.setMode} />
        {state.mode === 'production' && (
          <PillGroup<ProductionBubbleMetric>
            label="Producción"
            options={PRODUCTION_METRICS.map(m => ({ value: m, label: PRODUCTION_BUBBLE_LABELS[m] }))}
            active={state.productionBubbleMetric}
            onSelect={actions.setProductionBubbleMetric}
          />
        )}
        {state.mode === 'storage' && (
          <PillGroup<StorageBubbleMetric>
            label="Almacenamiento"
            options={STORAGE_METRICS.map(m => ({ value: m, label: STORAGE_BUBBLE_LABELS[m] }))}
            active={state.storageBubbleMetric}
            onSelect={actions.setStorageBubbleMetric}
          />
        )}

      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 flex-1 overflow-y-auto min-h-0">
        <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              COMPONENTES
            </p>

            {/* Hub type legend (clickable toggles) */}
            <div className="space-y-1 mb-3">
              {/* Port row + movement controls */}
              <HubTypeToggleRow
                hubType="port"
                visible={state.hubTypeVisibility.port}
                onToggle={() => actions.toggleHubType('port')}
              />
              {state.hubTypeVisibility.port && (
                <div className="ml-5 mt-1 space-y-1.5">
                  <div className="flex gap-1.5">
                    {(['altura', 'cabotaje'] as PortMovGroup[]).map(g => {
                      const active = state.portMovGroup === g;
                      const col = g === 'altura' ? 'rgb(32,178,170)' : 'rgb(251,146,60)';
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => actions.setPortMovGroup(active ? null : g)}
                          style={active
                            ? { backgroundColor: col, color: '#000', borderColor: col }
                            : { borderColor: col, color: col }}
                          className={`flex-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border transition-all ${
                            active ? '' : 'bg-transparent hover:opacity-80'
                          }`}
                        >
                          {PORT_MOV_GROUP_LABELS[g]}
                        </button>
                      );
                    })}
                  </div>
                  {/* Sub-metric pills (only for altura/cabotaje) */}
                  {state.portMovGroup && GROUP_METRICS[state.portMovGroup].length > 0 && (
                    <div className="flex gap-1.5">
                      {GROUP_METRICS[state.portMovGroup].map(metric => {
                        const active = state.portMovMetric === metric;
                        const col = state.portMovGroup === 'altura'
                          ? (metric === 'exportacion' ? 'rgb(32,178,170)' : 'rgb(244,63,94)')
                          : (metric === 'salida'      ? 'rgb(251,146,60)' : 'rgb(139,92,246)');
                        return (
                          <button
                            key={metric}
                            type="button"
                            onClick={() => actions.setPortMovMetric(active ? null : metric)}
                            style={active
                              ? { backgroundColor: col, color: '#000', borderColor: col }
                              : { borderColor: col, color: col }}
                            className={`flex-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border transition-all ${
                              active ? '' : 'bg-transparent hover:opacity-80'
                            }`}
                          >
                            {PORT_MOV_METRIC_LABELS[metric]}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Proporción button — full width, double height */}
                  {(() => {
                    const active = state.portMovGroup === 'proporcion';
                    return (
                      <button
                        type="button"
                        onClick={() => actions.setPortMovGroup(active ? null : 'proporcion')}
                        style={active
                          ? { background: 'linear-gradient(135deg, rgb(244,63,94), rgb(139,92,246))', color: '#fff', borderColor: 'transparent' }
                          : { borderColor: 'rgb(192,75,170)', color: 'rgb(192,75,170)' }}
                        className={`w-full px-2 py-1.5 text-[11px] font-semibold rounded-full border transition-all ${
                          active ? '' : 'bg-transparent hover:opacity-80'
                        }`}
                      >
                        Proporción
                      </button>
                    );
                  })()}
                </div>
              )}

              {/* Terminal row */}
              <HubTypeToggleRow
                hubType="terminal"
                visible={state.hubTypeVisibility.terminal}
                onToggle={() => actions.toggleHubType('terminal')}
              />
            </div>

            <div className="space-y-1 mb-4 border-t border-slate-700 pt-3">
              {(['import_node', 'end_consumer'] as const).map(type => (
                <HubTypeToggleRow
                  key={type}
                  hubType={type}
                  visible={state.hubTypeVisibility[type]}
                  onToggle={() => actions.toggleHubType(type)}
                />
              ))}
              <button
                type="button"
                onClick={actions.toggleMaritimeRoutes}
                className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 transition-all text-left group ${
                  state.showMaritimeRoutes
                    ? 'bg-slate-800/60 hover:bg-slate-700/70 text-slate-50'
                    : 'opacity-40 hover:opacity-60'
                }`}
              >
                {/* Icon: solid + dashed line stacked */}
                <span className="flex flex-col gap-0.5 flex-shrink-0 w-3 items-center">
                  <span
                    className="block rounded-full"
                    style={{ width: 12, height: 2, backgroundColor: state.showMaritimeRoutes ? 'rgb(30,144,255)' : 'rgb(100,116,139)' }}
                  />
                  <span
                    className="block"
                    style={{
                      width: 12,
                      height: 2,
                      backgroundImage: state.showMaritimeRoutes
                        ? 'repeating-linear-gradient(to right, rgb(135,206,235) 0px, rgb(135,206,235) 4px, transparent 4px, transparent 7px)'
                        : 'repeating-linear-gradient(to right, rgb(100,116,139) 0px, rgb(100,116,139) 4px, transparent 4px, transparent 7px)',
                    }}
                  />
                </span>
                <span className={`text-xs ${state.showMaritimeRoutes ? 'font-semibold text-slate-100' : 'text-slate-400 line-through'}`}>
                  Rutas marítimas
                </span>
              </button>
            </div>

            {/* Rail network legend */}
            <div className="border-t border-slate-700 pt-3 mt-1">
              <button
                type="button"
                onClick={actions.toggleAllRailOperators}
                className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 mb-2 transition-all text-left group ${
                  anyRailOn
                    ? 'bg-slate-800/60 hover:bg-slate-700/70'
                    : 'opacity-40 hover:opacity-60'
                }`}
              >
                <span className="flex gap-0.5 flex-shrink-0">
                  {RAIL_OPERATORS.slice(0, 3).map(op => {
                    const [r2, g2, b2] = RAIL_OPERATOR_COLORS[op] ?? [128, 128, 128];
                    return (
                      <span
                        key={op}
                        className="block w-4 h-1 rounded-full"
                        style={{ backgroundColor: `rgb(${r2},${g2},${b2})` }}
                      />
                    );
                  })}
                </span>
                <span className={`text-xs ${anyRailOn ? 'font-semibold text-slate-100' : 'text-slate-400 line-through'}`}>
                  Red ferroviaria nacional
                </span>
              </button>

              <div className="space-y-0.5 pl-2">
                {RAIL_OPERATORS.map(op => {
                  const [r2, g2, b2] = RAIL_OPERATOR_COLORS[op];
                  const visible = state.railOperatorVisibility[op] !== false;
                  return (
                    <button
                      key={op}
                      type="button"
                      onClick={() => actions.toggleRailOperator(op)}
                      className={`flex items-center gap-2 w-full rounded px-1.5 py-1 transition-all text-left group ${
                        visible ? 'hover:bg-slate-800/50' : 'opacity-40 hover:opacity-60'
                      }`}
                    >
                      <span
                        className="flex-shrink-0 block rounded-full transition-opacity"
                        style={{
                          width: 20,
                          height: 2,
                          backgroundColor: `rgb(${r2},${g2},${b2})`,
                          opacity: visible ? 0.85 : 0.3,
                        }}
                      />
                      <span className={`text-xs ${visible ? 'text-slate-300' : 'text-slate-500 line-through'}`}>
                        {RAIL_OPERATOR_NAMES[op]}
                      </span>
                    </button>
                  );
                })}
                <p className="text-xs text-slate-600 pt-1 px-1.5">
                  Líneas más tenues: vías sin uso activo (fuente: RFN 2024).
                </p>
              </div>
            </div>

            {/* Source note */}
            <p className="text-xs text-slate-600 mt-4 leading-relaxed">
              Fuentes: SIAP 2025, SCT Terminales Permisionadas, puertos.gob.mx.
              Consumo estimado donde no hay datos estatales disponibles.
            </p>
          </div>
      </div>

      {/* ── Basemap switcher ──────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-slate-800 flex-shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Mapa base</p>
        <div className="flex gap-1.5">
          {BASEMAP_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSetBasemap(id)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                basemap === id
                  ? 'bg-slate-200 text-slate-900 border-slate-200'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
