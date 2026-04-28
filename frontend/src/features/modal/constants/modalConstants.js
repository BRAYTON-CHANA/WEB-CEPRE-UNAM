// Constants para el componente Modal

// Tamaños predefinidos
export const MODAL_SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-full'
};

// Posiciones
export const MODAL_POSITIONS = {
  top: 'items-start',
  center: 'items-center',
  bottom: 'items-end'
};

// Colores de overlay
export const MODAL_OVERLAYS = {
  black: 'bg-black',
  white: 'bg-white',
  gray: 'bg-gray-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  blur: 'bg-black/30 backdrop-blur-sm'
};

// Opacidades
export const MODAL_OPACITIES = {
  0: 'bg-opacity-0',
  10: 'bg-opacity-10',
  20: 'bg-opacity-20',
  30: 'bg-opacity-30',
  40: 'bg-opacity-40',
  50: 'bg-opacity-50',
  60: 'bg-opacity-60',
  70: 'bg-opacity-70',
  80: 'bg-opacity-80',
  90: 'bg-opacity-90',
  100: 'bg-opacity-100'
};

// Colores de fondo del modal
export const MODAL_BACKGROUNDS = {
  white: 'bg-white',
  gray: 'bg-gray-50',
  dark: 'bg-gray-800',
  blue: 'bg-blue-50',
  red: 'bg-red-50',
  green: 'bg-green-50'
};

// Bordes
export const MODAL_BORDERS = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full'
};

// Sombras
export const MODAL_SHADOWS = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner'
};

// Gradientes para header
export const MODAL_HEADER_GRADIENTS = {
  emerald: 'bg-gradient-to-r from-emerald-600 to-teal-700',
  indigo: 'bg-gradient-to-r from-indigo-600 to-purple-700',
  blue: 'bg-gradient-to-r from-blue-600 to-cyan-700',
  rose: 'bg-gradient-to-r from-rose-600 to-pink-700',
  amber: 'bg-gradient-to-r from-amber-500 to-orange-600',
  slate: 'bg-gradient-to-r from-slate-600 to-gray-700'
};

// Patrones decorativos para header
export const MODAL_PATTERNS = {
  dots: 'bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:16px_16px]',
  lines: 'bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] [background-size:20px_20px]',
  grid: 'bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:20px_20px]'
};

// Valores por defecto
export const MODAL_DEFAULTS = {
  size: 'md',
  position: 'center',
  overlayColor: 'blur',
  overlayOpacity: 30,
  backgroundColor: 'white',
  border: 'lg',
  shadow: 'xl',
  closeOnOutsideClick: true,
  closeOnEscapeKey: true,
  showHeader: true,
  showCloseButton: true,
  preventClose: false,
  animation: true,
  fullscreenOnMobile: true
};
