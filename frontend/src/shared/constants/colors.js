/**
 * Constantes para colores y paletas
 * Configuración de formatos de color, validaciones y paletas predefinidas
 */

// Formato por defecto de color
export const DEFAULT_COLOR_FORMAT = 'hex'; // 'hex', 'rgb', 'hsl', 'rgba'

// Color por defecto
export const DEFAULT_COLOR = '#3B82F6'; // Azul por defecto

// Formatos de color soportados
export const COLOR_FORMATS = {
  HEX: 'hex',       // #3B82F6
  HEX8: 'hex8',     // #3B82F6FF (con alpha)
  RGB: 'rgb',       // rgb(59, 130, 246)
  RGBA: 'rgba',     // rgba(59, 130, 246, 1)
  HSL: 'hsl',       // hsl(217, 91%, 60%)
  HSLA: 'hsla',     // hsla(217, 91%, 60%, 1)
  HSV: 'hsv',       // hsv(217, 76%, 96%)
  CMYK: 'cmyk'      // cmyk(76%, 47%, 0%, 4%)
};

// Expresiones regulares para validación de colores
export const COLOR_REGEX = {
  HEX: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  HEX8: /^#([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/,
  RGB: /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
  RGBA: /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([01]?\.\d*)\s*\)$/,
  HSL: /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/,
  HSLA: /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([01]?\.\d*)\s*\)$/
};

// Paletas de colores predefinidas
export const COLOR_PALETTES = {
  // Paleta básica de Material Design
  MATERIAL: [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
    '#FF5722', '#795548', '#9E9E9E', '#607D8B', '#000000'
  ],
  
  // Paleta de colores web seguros
  WEB_SAFE: [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080',
    '#C0C0C0', '#808080'
  ],
  
  // Paleta de colores pastel
  PASTEL: [
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
    '#E6B3FF', '#FFC9DE', '#C9DEFF', '#DEFFC9', '#FFE9C9',
    '#F0F0F0', '#E0E0E0', '#D0D0D0', '#C0C0C0', '#B0B0B0'
  ],
  
  // Paleta de colores vivos
  VIVID: [
    '#FF1744', '#F50057', '#D500F9', '#651FFF', '#3D5AFE',
    '#2979FF', '#00B0FF', '#00E5FF', '#1DE9B6', '#00E676',
    '#76FF03', '#C6FF00', '#FFEA00', '#FFC400', '#FF9100',
    '#FF3D00', '#DD2C00', '#FF6D00', '#FFAB00', '#FFD600'
  ],
  
  // Paleta monocromática de grises
  GRAYSCALE: [
    '#000000', '#1A1A1A', '#333333', '#4D4D4D', '#666666',
    '#808080', '#999999', '#B3B3B3', '#CCCCCC', '#E6E6E6', '#FFFFFF'
  ],
  
  // Paleta de tonos de azul
  BLUES: [
    '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5',
    '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1'
  ],
  
  // Paleta de tonos de rojo
  REDS: [
    '#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350',
    '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'
  ],
  
  // Paleta de tonos de verde
  GREENS: [
    '#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A',
    '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20'
  ]
};

// Nombres de colores básicos (para conversión)
export const COLOR_NAMES = {
  'black': '#000000',
  'white': '#FFFFFF',
  'red': '#FF0000',
  'green': '#00FF00',
  'blue': '#0000FF',
  'yellow': '#FFFF00',
  'cyan': '#00FFFF',
  'magenta': '#FF00FF',
  'silver': '#C0C0C0',
  'gray': '#808080',
  'maroon': '#800000',
  'olive': '#808000',
  'lime': '#00FF00',
  'aqua': '#00FFFF',
  'teal': '#008080',
  'navy': '#000080',
  'fuchsia': '#FF00FF',
  'purple': '#800080',
  'orange': '#FFA500'
};

// Mensajes de error
export const COLOR_ERROR_MESSAGES = {
  INVALID_FORMAT: 'Formato de color inválido',
  INVALID_HEX: 'El color hexadecimal debe tener formato #RRGGBB o #RGB',
  INVALID_RGB: 'Los valores RGB deben estar entre 0 y 255',
  INVALID_HSL: 'Los valores HSL están fuera de rango',
  INVALID_ALPHA: 'El valor alpha debe estar entre 0 y 1',
  UNKNOWN_FORMAT: 'Formato de color no reconocido'
};

// Función para validar color hexadecimal
export const isValidHex = (color) => {
  if (!color || typeof color !== 'string') return false;
  return COLOR_REGEX.HEX.test(color);
};

// Función para validar cualquier formato de color
export const isValidColor = (color) => {
  if (!color || typeof color !== 'string') return false;
  
  // Verificar todos los formatos
  return Object.values(COLOR_REGEX).some(regex => regex.test(color)) ||
         Object.keys(COLOR_NAMES).includes(color.toLowerCase());
};

// Función para expandir hex corto a largo (#FFF -> #FFFFFF)
export const expandHex = (hex) => {
  if (!hex || hex.length !== 4) return hex;
  
  const r = hex[1];
  const g = hex[2];
  const b = hex[3];
  
  return `#${r}${r}${g}${g}${b}${b}`;
};

// Función para acortar hex largo a corto (#FFFFFF -> #FFF) si es posible
export const shortenHex = (hex) => {
  if (!hex || hex.length !== 7) return hex;
  
  const r = hex[1];
  const g = hex[3];
  const b = hex[5];
  
  if (hex[1] === hex[2] && hex[3] === hex[4] && hex[5] === hex[6]) {
    return `#${r}${g}${b}`;
  }
  
  return hex;
};

// Función para convertir hex a RGB
export const hexToRgb = (hex) => {
  if (!isValidHex(hex)) return null;
  
  // Expandir si es formato corto
  const fullHex = hex.length === 4 ? expandHex(hex) : hex;
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return null;
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
};

// Función para convertir RGB a hex
export const rgbToHex = (r, g, b) => {
  const toHex = (n) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

// Función para convertir hex a HSL
export const hexToHsl = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

// Función para generar variaciones de un color
export const generateColorShades = (baseColor, count = 5) => {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return [];
  
  const shades = [];
  const step = 255 / (count + 1);
  
  for (let i = 1; i <= count; i++) {
    const factor = i / (count + 1);
    const r = Math.round(rgb.r + (255 - rgb.r) * factor);
    const g = Math.round(rgb.g + (255 - rgb.g) * factor);
    const b = Math.round(rgb.b + (255 - rgb.b) * factor);
    
    shades.push(rgbToHex(r, g, b));
  }
  
  return shades;
};

// Función para calcular contraste (para texto sobre color)
export const getContrastColor = (hexColor) => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#000000';
  
  // Fórmula de luminosidad relativa
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Función para mezclar dos colores
export const blendColors = (color1, color2, ratio = 0.5) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return color1;
  
  const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
  const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
  const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
  
  return rgbToHex(r, g, b);
};

// Exportar todo
export default {
  DEFAULT_COLOR,
  DEFAULT_COLOR_FORMAT,
  COLOR_FORMATS,
  COLOR_REGEX,
  COLOR_PALETTES,
  COLOR_NAMES,
  COLOR_ERROR_MESSAGES,
  isValidHex,
  isValidColor,
  expandHex,
  shortenHex,
  hexToRgb,
  rgbToHex,
  hexToHsl,
  generateColorShades,
  getContrastColor,
  blendColors
};
