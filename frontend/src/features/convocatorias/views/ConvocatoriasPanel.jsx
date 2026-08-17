import React from 'react';
import { CrudMultiLevelManager } from '@/shared/components/crud';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { headerProps, getHeaderActions } from '@/features/convocatorias/config/headerConfig';
import { useConvocatoriasList } from '@/features/convocatorias/hooks/useConvocatoriasList';
import ConvocatoriaCreateModal from '@/features/convocatorias/components/ConvocatoriaCreateModal';

/**
 * ConvocatoriasPanel — página 1: lista plana de convocatorias.
 * Tabla simple de VW_CONVOCATORIAS con actions: Manejar, Editar, Eliminar.
 * "Añadir Convocatoria" en header → modal custom 2 pasos.
 */
function ConvocatoriasPanel({ onManage }) {
  const {
    records, loading, error, updateRecord,
    convocatoriaCrud, tableLevelConfigs, crudLevels,
    isCustomCreateOpen, createStep, plazas, submitting, submitError,
    customHandleCreate, closeCustomCreate, handleStep1Submit, handleFinalSubmit,
    setPlazas, setCreateStep
  } = useConvocatoriasList({ onManage });

  return (
    <CrudMultiLevelManager crudLevels={crudLevels}>
      {() => (
        <div className="px-8 py-8 space-y-8 pb-12">
          <CrudHeader
            headerTitle={headerProps.headerTitle}
            headerDescription={headerProps.headerDescription}
            actions={getHeaderActions({ ...convocatoriaCrud, handleCreate: customHandleCreate })}
          />

          {loading && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-gray-500 text-sm">Cargando convocatorias...</p>
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
                  `${rowData?.NOMBRE_PERIODO || 'Registro'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`
                }
                toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
              />
            </div>
          )}

          <ConvocatoriaCreateModal
            isOpen={isCustomCreateOpen}
            onClose={closeCustomCreate}
            createStep={createStep}
            plazas={plazas}
            submitting={submitting}
            submitError={submitError}
            onStep1Submit={handleStep1Submit}
            onPlazasChange={setPlazas}
            onFinalSubmit={handleFinalSubmit}
            onBackToStep1={() => setCreateStep(1)}
          />
        </div>
      )}
    </CrudMultiLevelManager>
  );
}

export default ConvocatoriasPanel;
