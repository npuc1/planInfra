// Rail network geometry is loaded at runtime from public/rail_network.json
// (converted from RFN_D_A_2024/VIA_FERREA.shp via scripts/convert_rail_shp.py).
// Operator metadata (colors, names, IDs) is static — defined here.
export {
  type RailSegment,
  RAIL_OPERATORS,
  RAIL_OPERATOR_COLORS,
  RAIL_OPERATOR_NAMES,
} from './railNetworkFromShape';
