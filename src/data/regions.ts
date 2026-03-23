/** Zona → entidades federativas (fuente: data/data/regiones.csv) */
export const REGION_STATES: Record<string, string[]> = {
  Centro:    ['Ciudad de México', 'Hidalgo', 'Estado de México', 'Morelos', 'Puebla', 'Querétaro', 'Tlaxcala'],
  Golfo:     ['Tabasco', 'Veracruz'],
  Noreste:   ['Nuevo León', 'Tamaulipas'],
  Noroeste:  ['Baja California', 'Baja California Sur', 'Nayarit', 'Sinaloa', 'Sonora'],
  Norte:     ['Chihuahua', 'Coahuila', 'Durango', 'San Luis Potosí', 'Zacatecas'],
  Occidente: ['Aguascalientes', 'Colima', 'Guanajuato', 'Jalisco', 'Michoacán'],
  Península: ['Campeche', 'Quintana Roo', 'Yucatán'],
  Sur:       ['Chiapas', 'Guerrero', 'Oaxaca'],
};

export const REGION_VIEW: Record<string, { longitude: number; latitude: number; zoom: number; pitch: number }> = {
  Centro:    { longitude:  -98.8, latitude: 19.7, zoom: 7.2, pitch: 30 },
  Golfo:     { longitude:  -95.0, latitude: 19.5, zoom: 6.5, pitch: 30 },
  Noreste:   { longitude: -100.0, latitude: 24.5, zoom: 6.5, pitch: 30 },
  Noroeste:  { longitude: -110.0, latitude: 26.5, zoom: 5.0, pitch: 30 },
  Norte:     { longitude: -104.0, latitude: 26.0, zoom: 5.3, pitch: 30 },
  Occidente: { longitude: -102.8, latitude: 20.5, zoom: 6.3, pitch: 30 },
  Península: { longitude:  -89.5, latitude: 19.5, zoom: 6.5, pitch: 30 },
  Sur:       { longitude:  -94.5, latitude: 17.5, zoom: 6.2, pitch: 30 },
};

export const REGIONS = Object.keys(REGION_STATES);
