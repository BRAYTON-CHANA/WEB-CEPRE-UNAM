import React from 'react';
import { CrudMultiLevelManager } from '@/shared/components/crud';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { UNAM_MANAGE_LEVEL_STYLES } from '@/features/convocatorias/config/levelStyles';
import { useManageConvocatoria } from '@/features/convocatorias/hooks/useManageConvocatoria';
import ManagePostulantesPanel from './ManagePostulantesPanel';

/**
 * ManageConvocatoriaPanel — página 2: 3 niveles filtrados por ID_CONVOCATORIA.
 * Nivel 1: sedes (syncGrouping) → Nivel 2: cursos → Nivel 3: plazas (lazy load)
 */
function ManageConvocatoriaPanel({ convocatoria, onBack }) {
  const {
    records, loading, error, updateRecord,
    tableLevelConfigs, crudLevels, childrenData, childrenLoading,
    selectedConvocatoriaCurso, handleBackToManage, manageHeaderActions, handleExpand
  } = useManageConvocatoria({ convocatoria, onBack });

  if (selectedConvocatoriaCurso) {
    return (
      <ManagePostulantesPanel
        convocatoriaCurso={selectedConvocatoriaCurso}
        onBack={handleBackToManage}
      />
    );
  }

  return (
    <CrudMultiLevelManager crudLevels={crudLevels}>
      {() => (
        <div className="px-8 py-8 space-y-8 pb-12">
          <button
            onClick={onBack}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Volver a convocatorias
          </button>
          <CrudHeader
            headerTitle={`Manejar Convocatoria — ${convocatoria.NOMBRE_PERIODO || ''}`}
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
        </div>
      )}
    </CrudMultiLevelManager>
  );
}

export default ManageConvocatoriaPanel;
