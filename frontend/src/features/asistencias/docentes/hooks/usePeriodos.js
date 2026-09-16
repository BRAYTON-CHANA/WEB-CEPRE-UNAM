import { usePeriodo } from '@/shared/context/PeriodoContext';

/**
 * usePeriodos — delega en el PeriodoContext global.
 * Mantiene la interfaz { periodos, periodoActivo, setPeriodoActivo, loading }.
 */
export function usePeriodos() {
  const { periodos, periodo, setPeriodo, loading } = usePeriodo();
  const activos = periodos.filter(p => p.ACTIVO);
  return { periodos: activos, periodoActivo: periodo, setPeriodoActivo: setPeriodo, loading };
}
