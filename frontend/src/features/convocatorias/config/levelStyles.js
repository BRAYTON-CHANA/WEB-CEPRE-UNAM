/**
 * UNAM_LEVEL_STYLES — Depth Strata v2 con paleta UNAM.
 * Colores institucionales: #25346A (azul oscuro), #2B3866 (azul medio),
 * #43B3C1 (turquesa), #5A6B9A (azul-grisáceo).
 * Específico de convocatorias — se pasa via `levelStyles` a TableMultiLevel.
 */

/**
 * 4 niveles completos (convocatoria → sede → curso → plaza).
 */
export const UNAM_LEVEL_STYLES = [
  {
    // Nivel 1 — Convocatorias (raíz, azul oscuro institucional #25346A)
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
    // Nivel 2 — Sedes (azul medio #2B3866, left accent + shadow)
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
    // Nivel 3 — Cursos (turquesa #43B3C1, acento vibrante)
    accent: '#43B3C1',
    headerBg: 'bg-[#43B3C1]/5',
    headerText: 'text-[#2B3866]',
    headerFont: 'text-xs font-medium uppercase tracking-wide',
    headerBorder: 'border-b-2 border-[#43B3C1]/50',
    rowHover: 'hover:bg-[#43B3C1]/5',
    expandedBg: 'bg-[#43B3C1]/5',
    expandBtn: 'bg-[#43B3C1]/10 border-[#43B3C1]/40 text-[#2B3866] hover:bg-[#43B3C1]/20',
    cellPadding: 'px-4 py-3',
    cellFont: 'text-sm',
    wrapperClass: 'border-l-[4px] border-[#43B3C1] rounded-r-lg shadow-sm overflow-hidden'
  },
  {
    // Nivel 4 — Plazas (azul-grisáceo #5A6B9A, denso, texto pequeño)
    accent: '#5A6B9A',
    headerBg: 'bg-[#5A6B9A]/5',
    headerText: 'text-[#5A6B9A]',
    headerFont: 'text-[11px] font-medium uppercase tracking-wide',
    headerBorder: 'border-b-2 border-[#5A6B9A]/40',
    rowHover: 'hover:bg-[#5A6B9A]/5',
    expandedBg: 'bg-[#5A6B9A]/5',
    expandBtn: 'bg-[#5A6B9A]/10 border-[#5A6B9A]/30 text-[#5A6B9A] hover:bg-[#5A6B9A]/20',
    cellPadding: 'px-3 py-2',
    cellFont: 'text-xs',
    wrapperClass: 'border-l-[4px] border-[#5A6B9A] rounded-r-lg shadow-sm overflow-hidden'
  }
];

/**
 * 3 niveles para el panel de manejo (sede → curso → plaza).
 * La convocatoria ya está seleccionada, así que se omite el primer nivel.
 */
export const UNAM_MANAGE_LEVEL_STYLES = UNAM_LEVEL_STYLES.slice(1);
