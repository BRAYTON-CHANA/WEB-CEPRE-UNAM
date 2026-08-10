export const DEFAULT_FONT = 'Arial';
export const DEFAULT_FONT_SIZE = 11;
export const MIN_FONT_SIZE = 7;
export const MAX_FONT_SIZE = 72;

export const FONT_SIZE_MAP = {
  '1': 10,
  '2': 13,
  '3': 16,
  '4': 18,
  '5': 24,
  '6': 32,
  '7': 48,
};

export const FONTS = ['Arial', 'Georgia', 'Tahoma', 'Verdana', 'Trebuchet MS', 'Courier New', 'Times New Roman', 'Comic Sans MS', 'Impact'];

export const FONT_SIZE_OPTIONS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72];

export const SIZES = FONT_SIZE_OPTIONS.map(size => ({
  label: String(size),
  value: String(size),
}));

export const DEFAULT_FONT_COLOR = '#000000';

export const HIGHLIGHT_COLORS = [
  { name: 'Amarillo', value: '#FFFF00' },
  { name: 'Verde claro', value: '#90EE90' },
  { name: 'Celeste', value: '#87CEEB' },
  { name: 'Rosa', value: '#FFB6C1' },
  { name: 'Naranja', value: '#FFD580' },
  { name: 'Gris', value: '#D3D3D3' },
  { name: 'Sin color', value: 'transparent' },
];

export const THEME_COLORS = [
  { name: 'Blanco / Negro', shades: ['#FFFFFF', '#E7E6E6', '#A6A6A6', '#595959', '#000000'] },
  { name: 'Azul', shades: ['#D9E2F3', '#8FAADC', '#4472C4', '#2F5597', '#203864'] },
  { name: 'Naranja', shades: ['#FCE4D6', '#F4B084', '#ED7D31', '#C55A11', '#843C0C'] },
  { name: 'Gris', shades: ['#F2F2F2', '#BFBFBF', '#A5A5A5', '#7F7F7F', '#525252'] },
  { name: 'Amarillo', shades: ['#FFF2CC', '#FFE699', '#FFC000', '#BF9000', '#7F6000'] },
  { name: 'Verde', shades: ['#E2EFDA', '#A9D08E', '#70AD47', '#548235', '#375623'] },
];

export const STANDARD_COLORS = [
  { name: 'Rojo', value: '#FF0000' },
  { name: 'Naranja', value: '#FFC000' },
  { name: 'Amarillo', value: '#FFFF00' },
  { name: 'Verde claro', value: '#92D050' },
  { name: 'Verde', value: '#00B050' },
  { name: 'Cian', value: '#00B0F0' },
  { name: 'Azul', value: '#0070C0' },
  { name: 'Índigo', value: '#4472C4' },
  { name: 'Morado', value: '#7030A0' },
  { name: 'Rosa', value: '#C000C0' },
];

