/**
 * GRUPOS_LEVEL_STYLES — Depth Strata con paleta UNAM.
 * Colores institucionales centralizados en globals.css como CSS variables:
 *   --unam-dark:   #25346A (azul oscuro institucional)
 *   --unam-medium: #2B3866 (azul medio)
 *   --unam-teal:   #43B3C1 (turquesa)
 * Específico de grupos — se pasa via `levelStyles` a TableMultiLevel.
 *
 * 3 niveles: Sedes → Áreas → Grupos.
 */
export const GRUPOS_LEVEL_STYLES = [
  {
    // Nivel 1 — Sedes (raíz, azul oscuro institucional #25346A)
    accent: '#25346A',
    headerBg: 'bg-[#25346A]/5',
    headerText: 'text-[#25346A]',
    headerFont: 'text-xs font-semibold uppercase tracking-wider',
    headerBorder: 'border-b-2 border-[#25346A]/40',
    rowHover: 'hover:bg-[#25346A]/5',
    expandedBg: 'bg-[#25346A]/5',
    expandBtn: 'bg-[#25346A]/10 border-[#25346A]/30 text-[#25346A] hover:bg-[#25346A]/20',
    cellPadding: 'px-5 py-4',
    cellFont: 'text-sm',
    wrapperClass: 'w-full'
  },
  {
    // Nivel 2 — Áreas (azul medio #2B3866, left accent + shadow)
    accent: '#2B3866',
    headerBg: 'bg-[#2B3866]/5',
    headerText: 'text-[#2B3866]',
    headerFont: 'text-xs font-medium uppercase tracking-wide',
    headerBorder: 'border-b-2 border-[#2B3866]/40',
    rowHover: 'hover:bg-[#2B3866]/5',
    expandedBg: 'bg-[#2B3866]/5',
    expandBtn: 'bg-[#2B3866]/10 border-[#2B3866]/30 text-[#2B3866] hover:bg-[#2B3866]/20',
    cellPadding: 'px-5 py-3',
    cellFont: 'text-sm',
    wrapperClass: 'border-l-[4px] border-[#2B3866] rounded-r-lg shadow-sm overflow-hidden'
  },
  {
    // Nivel 3 — Grupos (turquesa #43B3C1, acento vibrante, denso)
    accent: '#43B3C1',
    headerBg: 'bg-[#43B3C1]/5',
    headerText: 'text-[#2B3866]',
    headerFont: 'text-xs font-medium uppercase tracking-wide',
    headerBorder: 'border-b-2 border-[#43B3C1]/50',
    rowHover: 'hover:bg-[#43B3C1]/5',
    expandedBg: 'bg-[#43B3C1]/5',
    expandBtn: 'bg-[#43B3C1]/10 border-[#43B3C1]/40 text-[#2B3866] hover:bg-[#43B3C1]/20',
    cellPadding: 'px-4 py-2',
    cellFont: 'text-sm',
    wrapperClass: 'border-l-[4px] border-[#43B3C1] rounded-r-lg shadow-sm overflow-hidden'
  }
];
