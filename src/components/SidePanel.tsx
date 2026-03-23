import type { UIActions } from '../store/useUIState';
import type { UIState, Commodity, ViewMode } from '../types';
import {
  COMMODITY_COLORS,
  COMMODITY_LABELS,
  HUB_TYPE_COLORS,
  HUB_TYPE_LABELS,
  MODE_LABELS,
} from '../types';
import { HUB_BY_ID } from '../data/hubs';
import { RAIL_OPERATORS, RAIL_OPERATOR_COLORS, RAIL_OPERATOR_NAMES } from '../data/railNetwork';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COMMODITIES: Commodity[] = ['maize', 'beans', 'wheat', 'rice'];
const MODES: ViewMode[]        = ['production', 'consumption', 'storage'];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)} K`;
  return String(n);
}

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

// ─── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-800/60 rounded-lg px-3 py-2.5">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-lg font-bold text-white leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── HubDetail ────────────────────────────────────────────────────────────────

function HubDetail({ hubId, onClose }: { hubId: string; onClose: () => void }) {
  const hub = HUB_BY_ID[hubId];
  if (!hub) return null;

  const [r, g, b] = HUB_TYPE_COLORS[hub.type];
  const typeColor  = `rgb(${r},${g},${b})`;

  return (
    <div className="mt-4 bg-slate-800/70 rounded-xl p-4 border border-slate-700">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: typeColor }}>
            {HUB_TYPE_LABELS[hub.type]}
          </p>
          <p className="text-base font-bold text-white mt-0.5">{hub.name}</p>
          <p className="text-xs text-slate-400">{hub.state}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 text-lg leading-none mt-0.5"
        >
          ×
        </button>
      </div>

      {hub.notes && (
        <p className="text-xs text-slate-400 italic mb-3 border-t border-slate-700 pt-2">
          {hub.notes}
        </p>
      )}

      {hub.capacityTons !== undefined && (
        <div className="grid grid-cols-1 gap-2">
          <KpiCard
            label="Capacidad de manejo"
            value={fmt(hub.capacityTons)}
            sub="toneladas métricas / año"
          />
        </div>
      )}
    </div>
  );
}

// ─── SidePanel ────────────────────────────────────────────────────────────────

interface SidePanelProps {
  state:   UIState;
  actions: UIActions;
}

export function SidePanel({ state, actions }: SidePanelProps) {
  const commodityRgb = COMMODITY_COLORS[state.commodity];
  const commodityHex = `rgb(${commodityRgb[0]},${commodityRgb[1]},${commodityRgb[2]})`;

  const commodityOptions = COMMODITIES.map(c => ({ value: c, label: COMMODITY_LABELS[c] }));
  const commodityColorMap = Object.fromEntries(
    COMMODITIES.map(c => {
      const [r2, g2, b2] = COMMODITY_COLORS[c];
      return [c, `rgb(${r2},${g2},${b2})`];
    }),
  ) as Record<Commodity, string>;

  const modeOptions = MODES.map(m => ({ value: m, label: MODE_LABELS[m] }));

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
        <p className="text-xs text-slate-400 mt-1">
          Producción SIAP · Terminales SCT · Importadores
        </p>
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
        <PillGroup
          label="Vista"
          options={modeOptions}
          active={state.mode}
          onSelect={actions.setMode}
        />

      </div>

      {/* ── Hub detail / Legend ───────────────────────────────────────────── */}
      <div className="px-5 py-4 flex-1 overflow-y-auto min-h-0">
        {state.selectedHubId ? (
          <HubDetail
            hubId={state.selectedHubId}
            onClose={() => actions.selectHub(null)}
          />
        ) : (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Leyenda
            </p>

            {/* Hub type legend (clickable toggles) */}
            <div className="space-y-1 mb-4">
              {(['port', 'terminal', 'import_node', 'end_consumer'] as const).map(type => {
                const [r2, g2, b2] = HUB_TYPE_COLORS[type];
                const visible = state.hubTypeVisibility[type];
                return (
                  <button
                    key={type}
                    onClick={() => actions.toggleHubType(type)}
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
                      {HUB_TYPE_LABELS[type]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bubble legend */}
            <div className="border-t border-slate-700 pt-3">
              <p className="text-xs text-slate-500 mb-1.5">Círculo = {
                state.mode === 'production'  ? 'producción (ton)' :
                state.mode === 'consumption' ? 'consumo estimado (ton)' :
                                               'capacidad almacenamiento (ton)'
              }</p>
            </div>

            {/* Rail network legend */}
            <div className="border-t border-slate-700 pt-3 mt-1">
              <button
                onClick={actions.toggleRailNetwork}
                className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 mb-2 transition-all text-left group ${
                  state.showRailNetwork
                    ? 'bg-slate-800/60 hover:bg-slate-700/70'
                    : 'opacity-40 hover:opacity-60'
                }`}
              >
                <span className="flex gap-0.5 flex-shrink-0">
                  {(['FMX', 'FSR', 'Z'] as const).map(op => {
                    const [r2, g2, b2] = RAIL_OPERATOR_COLORS[op];
                    return (
                      <span
                        key={op}
                        className="block w-4 h-1 rounded-full"
                        style={{ backgroundColor: `rgb(${r2},${g2},${b2})` }}
                      />
                    );
                  })}
                </span>
                <span className={`text-xs ${state.showRailNetwork ? 'font-semibold text-slate-100' : 'text-slate-400 line-through'}`}>
                  Red ferroviaria nacional
                </span>
              </button>

              {state.showRailNetwork && (
                <div className="space-y-0.5 pl-2">
                  {RAIL_OPERATORS.map(op => {
                    const [r2, g2, b2] = RAIL_OPERATOR_COLORS[op];
                    const visible = state.railOperatorVisibility[op] !== false;
                    return (
                      <button
                        key={op}
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
                    Línea K más allá de Tonalá: trazo de baja certeza.
                  </p>
                </div>
              )}
            </div>

            {/* Source note */}
            <p className="text-xs text-slate-600 mt-4 leading-relaxed">
              Fuentes: SIAP 2025, SCT Terminales Permisionadas, puertos.gob.mx.
              Consumo estimado donde no hay datos estatales disponibles.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
