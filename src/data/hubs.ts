import type { Hub } from '../types';

// ─── Data sources ─────────────────────────────────────────────────────────────
// Ports (P-001…P-013):
//   data/data/puertos.xlsx — 13 SCT-registered grain ports with capacity (T.M.)
//   and national market share.
//
// Terminals (T-001…T-079):
//   data/data/Terminales_Permisionadas_de_Carga_con_coordenadas_aprox.xlsx
//   — All 79 SCT-licensed bulk-cargo rail terminals.  Coordinates approximate
//   (municipality centre per the source file).
//
// Import nodes (I-001…I-013):
//   data/data/importacion maiz.xlsx — Corporate nodes of major maize traders and
//   importers operating in Mexico (Cargill, ADM, VITERRA, LDC, COFCO, etc.).
//
// End consumers (C-001…C-005):
//   data/data/imports_oficina comercial.xlsx — Identified industrial end-consumers
//   receiving imported maize (Bachoco, SuKarne, CAMPI, etc.).

export const HUBS: Hub[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // PORTS — source: puertos.xlsx
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'P-001', name: 'Puerto de Veracruz', type: 'port',
    state: 'Veracruz', lat: 19.1738, lng: -96.1342,
    capacityTons: 200_700,
    notes: 'Principal puerto de importación de granos del Golfo. Participación 20.4 % de capacidad nacional.',
  },
  {
    id: 'P-002', name: 'Puerto de Topolobampo', type: 'port',
    state: 'Sinaloa', lat: 25.60, lng: -109.04,
    capacityTons: 120_000,
    notes: 'Segundo puerto en capacidad granelera. Participación 12.2 %. Sirve producción del noroeste.',
  },
  {
    id: 'P-003', name: 'Puerto de Manzanillo', type: 'port',
    state: 'Colima', lat: 19.05, lng: -104.32,
    capacityTons: 104_000,
    notes: 'Puerto de contenedores y graneles del Pacífico. Participación 10.6 %.',
  },
  {
    id: 'P-004', name: 'Puerto de Tuxpan', type: 'port',
    state: 'Veracruz', lat: 20.96, lng: -97.40,
    capacityTons: 91_000,
    notes: 'Puerto granelero del norte de Veracruz. Participación 9.2 %.',
  },
  {
    id: 'P-005', name: 'Puerto Lázaro Cárdenas', type: 'port',
    state: 'Michoacán', lat: 17.96, lng: -102.20,
    capacityTons: 82_992,
    notes: 'Puerto de altura del Pacífico sur. Participación 8.4 %.',
  },
  {
    id: 'P-006', name: 'Puerto de Coatzacoalcos', type: 'port',
    state: 'Veracruz', lat: 18.14, lng: -94.43,
    capacityTons: 74_900,
    notes: 'Puerto industrial del Istmo de Tehuantepec. Participación 7.6 %.',
  },
  {
    id: 'P-007', name: 'Puerto de Progreso', type: 'port',
    state: 'Yucatán', lat: 21.28, lng: -89.66,
    capacityTons: 65_400,
    notes: 'Principal puerto de la Península de Yucatán. Participación 6.6 %.',
  },
  {
    id: 'P-008', name: 'Puerto de Guaymas', type: 'port',
    state: 'Sonora', lat: 27.92, lng: -110.89,
    capacityTons: 65_120,
    notes: 'Puerto granelero del noroeste. Participación 6.6 %. Sirve producción de Sonora.',
  },
  {
    id: 'P-009', name: 'Puerto de Altamira', type: 'port',
    state: 'Tamaulipas', lat: 22.39, lng: -97.94,
    capacityTons: 60_000,
    notes: 'Puerto industrial del noreste. Participación 6.1 %.',
  },
  {
    id: 'P-010', name: 'Puerto de Ensenada', type: 'port',
    state: 'Baja California', lat: 31.87, lng: -116.60,
    capacityTons: 35_000,
    notes: 'Puerto del noroeste. Participación 3.6 %.',
  },
  {
    id: 'P-011', name: 'Puerto de Salina Cruz', type: 'port',
    state: 'Oaxaca', lat: 16.17, lng: -95.19,
    capacityTons: 30_306,
    notes: 'Puerto del Pacífico sur-oaxaqueño. Participación 3.1 %.',
  },
  {
    id: 'P-012', name: 'Puerto de Tampico', type: 'port',
    state: 'Tamaulipas', lat: 22.23, lng: -97.86,
    capacityTons: 30_000,
    notes: 'Puerto fluvial-marítimo del noreste. Participación 3.0 %.',
  },
  {
    id: 'P-013', name: 'Puerto Chiapas', type: 'port',
    state: 'Chiapas', lat: 14.70, lng: -92.42,
    capacityTons: 26_000,
    notes: 'Puerto del Pacífico chiapaneco. Participación 2.6 %.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LICENSED CARGO TERMINALS — source: Terminales_Permisionadas_de_Carga
  // Coordinates are approximate (municipality centre per SCT source).
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 'T-001', name: 'Sylo S.A. de C.V.', type: 'terminal', state: 'Querétaro', lat: 20.5888, lng: -100.3899, notes: 'Permiso SCT-DGTFYM-011/0001. Hacienda San Juan, Delegación Felipe Carrillo Puerto.' },
  { id: 'T-002', name: 'Altamira Terminal Multimodal', type: 'terminal', state: 'Tamaulipas', lat: 22.3928, lng: -97.939, notes: 'Permiso SCT-DGTFYM-011/0002. Boulevard de los Ríos, Altamira.' },
  { id: 'T-003', name: 'Silos Tysa — Terminal Granos Jalisco', type: 'terminal', state: 'Jalisco', lat: 20.6736, lng: -103.344, notes: 'Permiso SCT-DGTFYM-011/0003. Vía Ferrocarril Mexicano, Guadalajara.' },
  { id: 'T-004', name: 'Suministros Industriales Potosinos', type: 'terminal', state: 'San Luis Potosí', lat: 22.1565, lng: -100.9855, notes: 'Permiso SCT-DGTFYM-011/0008. Eje 120 y vía Ferrocarril México-Laredo.' },
  { id: 'T-005', name: 'Distribución y Servicios Logísticos', type: 'terminal', state: 'Hidalgo', lat: 19.8352, lng: -98.9792, notes: 'Permiso SCT-DGTFYM-011/0009. Carretera Tepojaco-Temazcalapa, Tizayuca.' },
  { id: 'T-006', name: 'Vamos a México S.A. de C.V.', type: 'terminal', state: 'Estado de México', lat: 19.2826, lng: -99.6557, notes: 'Permiso SCT-DGTFYM-011/0010. Km. 89 vía Toluca-Ixtlahuaca.' },
  { id: 'T-007', name: 'Sindicato Carreros — Gómez Palacio', type: 'terminal', state: 'Durango', lat: 25.5705, lng: -103.50, notes: 'Permiso SCT-DGTFYM-011/0012. Parque Industrial Laguneros, Gómez Palacio.' },
  { id: 'T-008', name: 'Ferrogranos México', type: 'terminal', state: 'Coahuila', lat: 25.5428, lng: -103.4068, notes: 'Permiso SCT-DGTFYM-011/0013. Fraccionamiento Industrial Ferropuerto, Torreón.' },
  { id: 'T-009', name: 'Bulkmatic — Terminal Salinas Victoria', type: 'terminal', state: 'Nuevo León', lat: 25.9562, lng: -100.2936, notes: 'Permiso SCT-DGTFYM-011/0014. Carretera Monterrey-Colombia Km. 27.' },
  { id: 'T-010', name: 'Thyssenkrupp Materials — Cuautlancingo', type: 'terminal', state: 'Puebla', lat: 19.0884, lng: -98.27, notes: 'Permiso SCT-DGTFYM-011/0015. Parque Industrial San Lorenzo Almecatla.' },
  { id: 'T-011', name: 'Logistik Servicios Multimodales', type: 'terminal', state: 'San Luis Potosí', lat: 21.803, lng: -100.935, notes: 'Permiso SCT-DGTFYM-011/0016. Parque Industrial Logistik, Villa de Reyes.' },
  { id: 'T-012', name: 'Ferrocarril Mexicano — Terminal Escobedo', type: 'terminal', state: 'Nuevo León', lat: 25.7985, lng: -100.313, notes: 'Permiso SCT-DGTFYM-011/0017. Autopista Periférico Monterrey 4101.' },
  { id: 'T-013', name: 'Silos Tysa — Terminal Líquidos', type: 'terminal', state: 'Jalisco', lat: 20.6736, lng: -103.344, notes: 'Permiso SCT-DGTFYM-011/0018. Calzada Lázaro Cárdenas, Guadalajara.' },
  { id: 'T-014', name: 'KCSM — Terminal Salinas Victoria', type: 'terminal', state: 'Nuevo León', lat: 25.9562, lng: -100.2936, notes: 'Permiso SCT-DGTFYM-011/0019. Hacienda de Cárdenas, Salinas Victoria.' },
  { id: 'T-015', name: 'AMIGO — Terminal Veracruz', type: 'terminal', state: 'Veracruz', lat: 19.1738, lng: -96.1342, notes: 'Permiso SCT-DGTFYM-011/0020. Libramiento Santa Fe Km. 2, Veracruz.' },
  { id: 'T-016', name: 'ICAVE', type: 'terminal', state: 'Veracruz', lat: 19.1738, lng: -96.1342, notes: 'Permiso SCT-DGTFYM-011/0021. Parque Industrial Santa Fe, Veracruz.' },
  { id: 'T-017', name: 'Rancho Lucero', type: 'terminal', state: 'Durango', lat: 25.5705, lng: -103.50, notes: 'Permiso SCT-DGTFYM-011/0022. Km. 883+805 Línea M Tampico-Gómez Palacio.' },
  { id: 'T-018', name: 'Jalmex Empresarial', type: 'terminal', state: 'Jalisco', lat: 20.5181, lng: -103.1816, notes: 'Permiso SCT-DGTFYM-011/0023. Carretera a El Castillo Km. 13.5, El Salto.' },
  { id: 'T-019', name: 'FR Terminales — Terminal Tula', type: 'terminal', state: 'Hidalgo', lat: 20.0541, lng: -99.342, notes: 'Permiso SCT-DGTFYM-011/0024. Antigua Estación San Antonio, Tula.' },
  { id: 'T-020', name: 'Bulkmatic — Terminal Atitalaquia', type: 'terminal', state: 'Hidalgo', lat: 20.0547, lng: -99.2219, notes: 'Permiso SCT-DGTFYM-011/0025. Parque Industrial Atitalaquia.' },
  { id: 'T-021', name: 'Aceitera El Gallo', type: 'terminal', state: 'Jalisco', lat: 20.6736, lng: -103.344, notes: 'Permiso SCT-DGTFYM-011/0027. Antigua Carretera a Chapala, Guadalajara.' },
  { id: 'T-022', name: 'FR Terminales — Terminal Atequiza', type: 'terminal', state: 'Jalisco', lat: 20.3498, lng: -103.193, notes: 'Permiso SCT-DGTFYM-011/0029. Camino a las Gallinas, Ixtlahuacán.' },
  { id: 'T-023', name: 'Logística Simplificada', type: 'terminal', state: 'Coahuila', lat: 25.4232, lng: -100.9962, notes: 'Permiso SCT-DGTFYM-011/0030. Blvd. Isidro López Zertuche 5971, Saltillo.' },
  { id: 'T-024', name: 'KCSM — Terminal Automotriz Toluca', type: 'terminal', state: 'Estado de México', lat: 19.2826, lng: -99.6557, notes: 'Permiso SCT-DGTFYM-011/0032. Industrial Automotriz, Toluca.' },
  { id: 'T-025', name: 'Ferrocarril Mexicano — Terminal Hermosillo', type: 'terminal', state: 'Sonora', lat: 29.0729, lng: -110.9559, notes: 'Permiso SCT-DGTFYM-011/0033. Parque Industrial Dynatech, Hermosillo.' },
  { id: 'T-026', name: 'TSIM Internacional — Terminal El Carmen', type: 'terminal', state: 'Nuevo León', lat: 25.9258, lng: -100.353, notes: 'Permiso SCT-DGTFYM-011/0034. Carretera Monterrey-Monclova Km. 12.5.' },
  { id: 'T-027', name: 'TSIM Internacional — Terminal Escobedo', type: 'terminal', state: 'Nuevo León', lat: 25.7985, lng: -100.313, notes: 'Permiso SCT-DGTFYM-011/0035. Carretera Monterrey-Monclova Km. 3.4.' },
  { id: 'T-028', name: 'FR Terminales — Terminal San Cristóbal', type: 'terminal', state: 'Estado de México', lat: 19.6018, lng: -99.0507, notes: 'Permiso SCT-DGTFYM-011/0036. Av. México 15, Santa María Tulpetlac, Ecatepec.' },
  { id: 'T-029', name: 'Ferrotolvas', type: 'terminal', state: 'Nuevo León', lat: 25.7985, lng: -100.313, notes: 'Permiso SCT-DGTFYM-011/0037. Libramiento Noreste Km. 21, Escobedo.' },
  { id: 'T-030', name: 'FR Terminales — Terminal San Nicolás', type: 'terminal', state: 'Nuevo León', lat: 25.7417, lng: -100.3021, notes: 'Permiso SCT-DGTFYM-011/0038. Antigua Carretera a Roma Km. 7.5.' },
  { id: 'T-031', name: 'FR Terminales — Terminal Apodaca', type: 'terminal', state: 'Nuevo León', lat: 25.781, lng: -100.188, notes: 'Permiso SCT-DGTFYM-011/0040. Camino Apodaca-Huinalá 431.' },
  { id: 'T-032', name: 'LIT Terminal Toluca', type: 'terminal', state: 'Estado de México', lat: 19.2826, lng: -99.6557, notes: 'Permiso SCT-DGTFYM-011/0041. Albert Einstein 73, Industrial Automotriz, Toluca.' },
  { id: 'T-033', name: 'TSIM Internacional — Terminal Altamira', type: 'terminal', state: 'Tamaulipas', lat: 22.3928, lng: -97.939, notes: 'Permiso SCT-DGTFYM-011/0042. Antiguo Camino Medrano, Altamira.' },
  { id: 'T-034', name: 'Rehrig Pacific', type: 'terminal', state: 'Querétaro', lat: 20.5888, lng: -100.3899, notes: 'Permiso SCT-DGTFYM-011/0043. Av. La Noria 103, Parque Industrial Querétaro.' },
  { id: 'T-035', name: 'SODISA', type: 'terminal', state: 'Nuevo León', lat: 25.6866, lng: -100.3161, notes: 'Permiso SCT-DGTFYM-011/0045. Manuel L. Barragán 4850-B Norte, Monterrey.' },
  { id: 'T-036', name: 'PDN Servicios Ferroviarios', type: 'terminal', state: 'Nuevo León', lat: 25.8122, lng: -100.5974, notes: 'Permiso SCT-DGTFYM-011/0046. Libramiento Noreste Km. 27.5, García.' },
  { id: 'T-037', name: 'Damco Logistics', type: 'terminal', state: 'Estado de México', lat: 19.6436, lng: -99.215, notes: 'Permiso SCT-DGTFYM-011/0047. San Mateo Ixtacalco, Cuautitlán Izcalli.' },
  { id: 'T-038', name: 'Nafta Rail', type: 'terminal', state: 'San Luis Potosí', lat: 22.1565, lng: -100.9855, notes: 'Permiso SCT-DGTFYM-010A/0048. Eje 140 Km. 3+960 La Pila.' },
  { id: 'T-039', name: 'Katoen Natie — Terminal Huehuetoca', type: 'terminal', state: 'Estado de México', lat: 19.8283, lng: -99.203, notes: 'Permiso SCT-DGTFYM-010A/0049. Carretera México-Tula Km. 7.5, Huehuetoca.' },
  { id: 'T-040', name: 'FR Terminales — Terminal Tizayuca', type: 'terminal', state: 'Hidalgo', lat: 19.8352, lng: -98.9792, notes: 'Permiso SCT-DGTFYM-010A/0050. Eje Oriente-Poniente, Tizayuca.' },
  { id: 'T-041', name: 'Terminal Intermodal Logística Hidalgo', type: 'terminal', state: 'Hidalgo', lat: 20.0105, lng: -99.219, notes: 'Permiso SCT-DGTFYM-010A/0051. Ejido Melchor Ocampo, Atotonilco de Tula.' },
  { id: 'T-042', name: 'Ferroservicios', type: 'terminal', state: 'Querétaro', lat: 20.7836, lng: -100.051, notes: 'Permiso SCT-DGTFYM-010A/0053. Carretera Estatal 100 Km. 3.6, Colón.' },
  { id: 'T-043', name: 'Industrias KAM', type: 'terminal', state: 'Nuevo León', lat: 25.8122, lng: -100.5974, notes: 'Permiso SCT-DGTFYM-010A/0054. Carretera a Villa de García Km. 5.5, García.' },
  { id: 'T-044', name: 'Internacional Regiomontana de Acero', type: 'terminal', state: 'Nuevo León', lat: 25.781, lng: -100.188, notes: 'Permiso SCT-DGTFYM-010A/0055. Colonia El Milagro, Apodaca.' },
  { id: 'T-045', name: 'Transpolimer', type: 'terminal', state: 'San Luis Potosí', lat: 22.1565, lng: -100.9855, notes: 'Permiso SCT-DGTFYM-010A/0056. Zona Industrial del Potosí.' },
  { id: 'T-046', name: 'Lition Logistics', type: 'terminal', state: 'Querétaro', lat: 20.5888, lng: -100.3899, notes: 'Permiso SCT-DGTFYM-010A/0057. Zona Industrial, Santiago de Querétaro.' },
  { id: 'T-047', name: 'Ferropark', type: 'terminal', state: 'Estado de México', lat: 19.5406, lng: -99.1951, notes: 'Permiso SCT-DGTFYM-010A/0058. Valle de México, Tlalnepantla.' },
  { id: 'T-048', name: 'Silos Tysa — Terminal El Salto', type: 'terminal', state: 'Jalisco', lat: 20.5181, lng: -103.1816, notes: 'Permiso SCT-DGTFYM-010A/0059. San José del Castillo, El Salto.' },
  { id: 'T-049', name: 'Ferrocarril Mexicano — Terminal Silao', type: 'terminal', state: 'Guanajuato', lat: 20.9431, lng: -101.427, notes: 'Permiso SCT-DGTFYM-010A/0060. Línea León-Silao, Silao.' },
  { id: 'T-050', name: 'Bulkmatic — Terminal García', type: 'terminal', state: 'Nuevo León', lat: 25.8122, lng: -100.5974, notes: 'Permiso SCT-DGTFYM-010A/0062. Antigua estación ferroviaria, García.' },
  { id: 'T-051', name: 'Azinsa Logistics', type: 'terminal', state: 'Nuevo León', lat: 25.7417, lng: -100.3021, notes: 'Permiso SCT-DGTFYM-010A/0063. Camino al Mezquital, San Nicolás de los Garza.' },
  { id: 'T-052', name: 'Katoen Natie — Terminal Silao', type: 'terminal', state: 'Guanajuato', lat: 20.9431, lng: -101.427, notes: 'Permiso SCT-DGTFYM-010A/0064. Parque Industrial FIPASI, Silao.' },
  { id: 'T-053', name: 'Diamond Internacional', type: 'terminal', state: 'Estado de México', lat: 19.2711, lng: -99.4609, notes: 'Permiso SCT-DGTFYM-010A/0065. Zona Industrial, Ocoyoacac.' },
  { id: 'T-054', name: 'FR Terminales — Terminal Guadalupe', type: 'terminal', state: 'Nuevo León', lat: 25.6773, lng: -100.2597, notes: 'Permiso SCT-DGTFYM-010A/0066. Av. de la Industria 1001, Guadalupe.' },
  { id: 'T-055', name: 'Integradora de Insumos del Noreste', type: 'terminal', state: 'Nuevo León', lat: 25.9562, lng: -100.2936, notes: 'Permiso SCT-DGTFYM-010A/0067. Carretera Monterrey-Colombia Km. 34.5.' },
  { id: 'T-056', name: 'Networks Crossdocking Services', type: 'terminal', state: 'Querétaro', lat: 20.5888, lng: -100.3899, notes: 'Permiso SCT-DGTFYM-010A/0068. Anillo Vial II Poniente, Querétaro.' },
  { id: 'T-057', name: 'DISELO — Terminal Veracruz', type: 'terminal', state: 'Veracruz', lat: 18.0014, lng: -94.6359, notes: 'Permiso SCT-DGTFYM-010A/0069. Carretera Transísmica 100, Cosoleacaque.' },
  { id: 'T-058', name: 'Consorcio Operador LIT', type: 'terminal', state: 'Querétaro', lat: 20.69, lng: -100.265, notes: 'Permiso SCT-DGTFYM-010A/0070. Ejido Amazcala, El Marqués.' },
  { id: 'T-059', name: 'FR Terminales — Terminal Villa García', type: 'terminal', state: 'Nuevo León', lat: 25.8122, lng: -100.5974, notes: 'Permiso SCT-DGDFM-010A/0072. Camino Vecinal 101, García.' },
  { id: 'T-060', name: 'FR Terminales — Terminal Salamanca', type: 'terminal', state: 'Guanajuato', lat: 20.5714, lng: -101.1972, notes: 'Permiso SCT-DGDFM-010A/0073. Carretera Panamericana Km. 312, Salamanca.' },
  { id: 'T-061', name: 'Suministros Industriales Potosinos — Terminal Comonfort', type: 'terminal', state: 'Guanajuato', lat: 20.7181, lng: -100.759, notes: 'Permiso SCT-DGDFM-010A/0074. Carretera Celaya-Comonfort.' },
  { id: 'T-062', name: 'Jumandi Groupe', type: 'terminal', state: 'Aguascalientes', lat: 22.0742, lng: -102.271, notes: 'Permiso SCT-DGDFM-010A/0075. Carretera Estatal 85, San Francisco de los Romo.' },
  { id: 'T-063', name: 'Bulkmatic — Terminal Salinas Victoria II', type: 'terminal', state: 'Nuevo León', lat: 25.9562, lng: -100.2936, notes: 'Permiso SCT-DGDFM-010A/0076. Carretera Estatal 1 Km. 30, Salinas Victoria.' },
  { id: 'T-064', name: 'Railport', type: 'terminal', state: 'Veracruz', lat: 18.8537, lng: -97.0628, notes: 'Permiso SCT-DGDFM-010A/0077. Carretera a Potrerillo, Ixtaczoquitlán.' },
  { id: 'T-065', name: 'Agroindustrial Liderlac', type: 'terminal', state: 'Chihuahua', lat: 31.6904, lng: -106.4245, notes: 'Permiso SCT-DGDFM-010A/0079. Carretera Panamericana Km. 20, Ciudad Juárez.' },
  { id: 'T-066', name: 'USD Marketing México', type: 'terminal', state: 'Chihuahua', lat: 28.4061, lng: -106.865, notes: 'Permiso SCT-DGDFM-010A/0081. Línea ferroviaria Q, Ciudad Cuauhtémoc.' },
  { id: 'T-067', name: 'Bulkmatic San Luis Potosí', type: 'terminal', state: 'San Luis Potosí', lat: 22.1565, lng: -100.9855, notes: 'Permiso SCT-DGDFM-010A/0082. Zona Industrial.' },
  { id: 'T-068', name: 'Termicentro', type: 'terminal', state: 'San Luis Potosí', lat: 22.1565, lng: -100.9855, notes: 'Permiso SCT-DGDFM-010A/0083. Prolongación Venustiano Carranza.' },
  { id: 'T-069', name: 'LIT Terminal San Luis Potosí', type: 'terminal', state: 'San Luis Potosí', lat: 22.1565, lng: -100.9855, notes: 'Permiso SCT-DGDFM-010A/0084. Eje 128 Zona Industrial.' },
  { id: 'T-070', name: 'Querétaro Energy Terminal', type: 'terminal', state: 'Querétaro', lat: 20.5888, lng: -100.3899, notes: 'Permiso SCT-DGDFM-010A/0085. Parque Industrial Querétaro.' },
  { id: 'T-071', name: 'Terminal Intermodal de Trasvase', type: 'terminal', state: 'Nuevo León', lat: 25.8122, lng: -100.5974, notes: 'Permiso SCT-DGDFM-010A/0086. Carretera Libre a Villa de García Km. 6.5.' },
  { id: 'T-072', name: 'Sim Alimentos', type: 'terminal', state: 'Nuevo León', lat: 25.9258, lng: -100.353, notes: 'Permiso SCT-DGDFM-010A/0088. Predio Sendero Divisorio, El Carmen.' },
  { id: 'T-073', name: 'Comercializadora Empresarial de Cuauhtémoc', type: 'terminal', state: 'Chihuahua', lat: 28.4061, lng: -106.865, notes: 'Permiso SCT-DGDFM-010A/0089. Cuauhtémoc.' },
  { id: 'T-074', name: 'Jumandi Park', type: 'terminal', state: 'Aguascalientes', lat: 22.0742, lng: -102.271, notes: 'Permiso SCT-DGDFM-010A/0091. Carretera Chicalote-Loreto, San Francisco de los Romo.' },
  { id: 'T-075', name: 'Bulkmatic Hermosillo', type: 'terminal', state: 'Sonora', lat: 29.0729, lng: -110.9559, notes: 'Permiso SCT-DGDFM-04-010-A/0092. Mesa del Seri, Hermosillo.' },
  { id: 'T-076', name: 'Koprimo', type: 'terminal', state: 'Estado de México', lat: 19.2826, lng: -99.6557, notes: 'Permiso SCT-DGDFM-04-010-A/0093. Carretera Toluca-Atlacomulco, Toluca.' },
  { id: 'T-077', name: 'Bagsack', type: 'terminal', state: 'Aguascalientes', lat: 22.0742, lng: -102.271, notes: 'Permiso SCT-DGDFM-04-010-A/0094. Carretera Federal 71, San Francisco de los Romo.' },
  { id: 'T-078', name: 'Bulkmatic Ocoyoacac', type: 'terminal', state: 'Estado de México', lat: 19.2711, lng: -99.4609, notes: 'Permiso SCT-DGDFM-04-010-A/0095. Carretera Amomolulco-Ocoyoacac.' },
  { id: 'T-079', name: 'Terminal Almacén Logística', type: 'terminal', state: 'Nuevo León', lat: 25.9562, lng: -100.2936, notes: 'Permiso SCT-DGDFM-04-010-A/0096. Carretera Monterrey-Colombia Km. 37.4, Salinas Victoria.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIZE IMPORT NODES — source: importacion maiz.xlsx
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'I-001', name: 'Cargill de México — Atitalaquia', type: 'import_node',
    state: 'Hidalgo', lat: 20.059, lng: -99.221,
    notes: 'Operación de Granos, Harina y Aceites. Categoría: Procesamiento.',
  },
  {
    id: 'I-002', name: 'Bartlett Logistics México', type: 'import_node',
    state: 'Estado de México', lat: 19.646, lng: -99.211,
    notes: 'Instalación Bartlett-Contri, Cuautitlán Izcalli. Categoría: Logística/Comercialización.',
  },
  {
    id: 'I-003', name: 'ADM México — Yecapixtla', type: 'import_node',
    state: 'Morelos', lat: 18.883, lng: -98.865,
    notes: 'Planta de alimento húmedo para mascotas. Categoría: Procesamiento.',
  },
  {
    id: 'I-004', name: 'VITERRA México — Encarnación de Díaz', type: 'import_node',
    state: 'Jalisco', lat: 21.527, lng: -102.241,
    notes: 'Instalación de almacenamiento y manejo. Categoría: Almacenamiento/Acopio.',
  },
  {
    id: 'I-005', name: 'Compañía Nacional Almacenadora — Xcanatún', type: 'import_node',
    state: 'Yucatán', lat: 20.997, lng: -89.651,
    notes: 'Centro de acopio en Mérida (Xcanatún). Categoría: Almacenamiento/Acopio.',
  },
  {
    id: 'I-006', name: 'Comercializadora Mayorista del Golfo', type: 'import_node',
    state: 'Campeche', lat: 19.843, lng: -90.525,
    notes: 'Nodo comercial de granos y semillas, San Francisco de Campeche. Categoría: Logística/Comercialización.',
  },
  {
    id: 'I-007', name: 'Comercializadora PORTIMEX — Tuxpan', type: 'import_node',
    state: 'Veracruz', lat: 20.956, lng: -97.406,
    notes: 'Almacenamiento de granel agrícola ligado al Puerto de Tuxpan. Categoría: Comercialización.',
  },
  {
    id: 'I-008', name: 'Graneros San Juan — Río Bravo', type: 'import_node',
    state: 'Tamaulipas', lat: 25.984, lng: -98.075,
    notes: 'Bodega / centro de acopio en Río Bravo. Categoría: Almacenamiento/Acopio.',
  },
  {
    id: 'I-009', name: 'Alimentos Granos y Forrajes de la Frontera', type: 'import_node',
    state: 'Chihuahua', lat: 31.69, lng: -106.424,
    notes: 'Nodo de manejo/comercialización de granos y forrajes, Ciudad Juárez. Categoría: Importación/Distribución.',
  },
  {
    id: 'I-010', name: 'Importaciones GARBA — Reynosa', type: 'import_node',
    state: 'Tamaulipas', lat: 26.092, lng: -98.277,
    notes: 'Nodo importador y mayorista de semillas y granos, Reynosa. Categoría: Importación/Distribución.',
  },
  {
    id: 'I-011', name: 'Anaiza Garza López — Río Bravo', type: 'import_node',
    state: 'Tamaulipas', lat: 25.984, lng: -98.075,
    notes: 'Nodo consignatario / comercial, Río Bravo. Categoría: Importación/Distribución.',
  },
  {
    id: 'I-012', name: 'Louis Dreyfus Company México', type: 'import_node',
    state: 'Ciudad de México', lat: 19.398, lng: -99.157,
    notes: 'Oficina corporativa y comercial. Comercialización de cereales y oleaginosas. Categoría: Oficina comercial.',
  },
  {
    id: 'I-013', name: 'COFCO AGRI México', type: 'import_node',
    state: 'Ciudad de México', lat: 19.361, lng: -99.274,
    notes: 'Oficina comercial en Santa Fe. Categoría: Oficina comercial.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // END CONSUMERS — source: imports_oficina comercial.xlsx
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'C-001', name: 'Industrial Patrona — Córdoba', type: 'end_consumer',
    state: 'Veracruz', lat: 18.8842, lng: -96.9256,
    notes: 'Planta de aceites vegetales. Proveedor: Louis Dreyfus Company México.',
  },
  {
    id: 'C-002', name: 'CAMPI Alimentos — Chinameca/Jáltipan', type: 'end_consumer',
    state: 'Veracruz', lat: 18.0184, lng: -94.6786,
    notes: 'Centro de acopio / alimento balanceado. Proveedor: Louis Dreyfus Company México.',
  },
  {
    id: 'C-003', name: 'Bachoco — Tihuatlán', type: 'end_consumer',
    state: 'Veracruz', lat: 20.7145, lng: -97.5334,
    notes: 'Planta de alimento balanceado. Proveedor: Louis Dreyfus Company México.',
  },
  {
    id: 'C-004', name: 'Productores Ganaderos GUSI — Tamuín', type: 'end_consumer',
    state: 'San Luis Potosí', lat: 22.0055, lng: -98.7797,
    notes: 'Planta de alimentos / engorda ganadera. Proveedor: COFCO AGRI México.',
  },
  {
    id: 'C-005', name: 'SuKarne Agroindustrial — Culiacán', type: 'end_consumer',
    state: 'Sinaloa', lat: 24.8021, lng: -107.3942,
    notes: 'Planta agroindustrial / consumo animal. Proveedor: COFCO AGRI México.',
  },
];

export const HUB_BY_ID = Object.fromEntries(HUBS.map(h => [h.id, h]));

/** Unique Mexican state names that appear in the hubs dataset, sorted alphabetically. */
export const HUB_STATES: string[] = [...new Set(HUBS.map(h => h.state))].sort((a, b) => a.localeCompare(b, 'es'));
