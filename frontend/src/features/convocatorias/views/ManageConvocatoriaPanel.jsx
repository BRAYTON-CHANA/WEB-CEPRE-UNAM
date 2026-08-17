import React from 'react';
import { CrudMultiLevelManager } from '@/shared/components/crud';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { UNAM_MANAGE_LEVEL_STYLES } from '@/features/convocatorias/config/levelStyles';
import { useManageConvocatoria } from '@/features/convocatorias/hooks/useManageConvocatoria';
import { usePlazasFilters } from '@/features/convocatorias/hooks/usePlazasFilters';
import FilterSelect from '@/shared/components/ui/inputs/FilterSelect';

/**
 * ManageConvocatoriaPanel — página 2: Plazas.
 * Filtro por convocatoria con botón clear (x) y refresh.
 * Tabla multi-nivel: sedes → cursos → plazas.
 * Navega a página 3 (Postulantes) via onViewPostulantes.
 */
function ManageConvocatoriaPanel({ initialConvocatoriaId, onViewPostulantes }) {
  const {
    convocatorias,
    selectedIdConvocatoria,
    selectedConvocatoriaRow,
    loadingFilters,
    handleConvocatoriaChange,
    clearConvocatoria,
    refreshConvocatorias,
  } = usePlazasFilters(initialConvocatoriaId);

  const {
    records, loading, error, updateRecord,
    tableLevelConfigs, crudLevels, childrenData, childrenLoading,
    manageHeaderActions, handleExpand
  } = useManageConvocatoria({
    convocatoria: selectedConvocatoriaRow || { ID_CONVOCATORIA: selectedIdConvocatoria },
    onViewPostulantes
  });

  const hasConvocatoriaSelected = !!selectedIdConvocatoria;

  return (
    <CrudMultiLevelManager crudLevels={crudLevels}>
      {() => (
        <div className="px-8 py-8 space-y-6 pb-12">
          {/* Barra de filtros */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-[#25346A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Filtros</h3>
            </div>
            <div className="flex items-end gap-4 flex-wrap">
              <FilterSelect
                label="Convocatoria"
                required
                value={selectedIdConvocatoria}
                onChange={handleConvocatoriaChange}
                onClear={clearConvocatoria}
                onRefresh={refreshConvocatorias}
                disabled={loadingFilters}
                loading={loadingFilters}
                placeholder="Seleccionar convocatoria..."
                refreshTitle="Actualizar convocatorias"
                minWidth="min-w-[300px]"
                options={convocatorias.map(c => ({
                  value: c.ID_CONVOCATORIA,
                  label: `${c.NOMBRE_PERIODO}${c.DESCRIPCION ? ` · ${c.DESCRIPCION}` : ''}`
                }))}
              />
            </div>
          </div>

          {/* Contenido */}
          {hasConvocatoriaSelected && (
            <>
              <CrudHeader
                headerTitle={`Plazas — ${selectedConvocatoriaRow?.NOMBRE_PERIODO || ''}`}
                headerDescription="Gestión de sedes, cursos y plazas docentes"
                actions={manageHeaderActions}
              />

              {loading && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                  <p className="text-gray-500 text-sm">Cargando cursos...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                  <p className="text-red-700 text-sm"><strong>Error:</strong> {error.message}</p>
                </div>
              )}

              {!loading && !error && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                  <TableMultiLevelEditable
                    data={records}
                    levelConfigs={tableLevelConfigs}
                    saveMode="auto"
                    onSaveSuccess={(recordId, field, newValue, primaryKey) => updateRecord(recordId, primaryKey, field, newValue)}
                    formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) =>
                      `${rowData?.NOMBRE_SEDE || rowData?.NOMBRE_CURSO || 'Registro'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`
                    }
                    toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
                    tableProps={{
                      onExpand: handleExpand,
                      childrenData,
                      childrenLoading,
                      levelStyles: UNAM_MANAGE_LEVEL_STYLES
                    }}
                  />
                </div>
              )}
            </>
          )}

          {!hasConvocatoriaSelected && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-400 text-sm">
                Seleccione una convocatoria para gestionar las plazas.
              </p>
            </div>
          )}
        </div>
      )}
    </CrudMultiLevelManager>
  );
}

export default ManageConvocatoriaPanel;
