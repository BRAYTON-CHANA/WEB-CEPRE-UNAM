import { useMemo } from 'react';
import { useTableData } from '@/shared/components/crud';
import { tableConfig, getTableLevelConfigs } from '@/features/permisos/config/tableConfig';

/**
 * usePermisos — lógica de la página de Permisos (read-only).
 * Solo carga datos para visualización. Sin CRUD.
 * Los permisos se gestionan via SQL seeds.
 * La asignación rol→permiso se hace en la página de roles.
 */
export function usePermisos() {
  const { records, loading, error } = useTableData(tableConfig.tableName);

  const tableLevelConfigs = useMemo(() => getTableLevelConfigs(), []);

  return {
    records,
    loading,
    error,
    tableLevelConfigs
  };
}
