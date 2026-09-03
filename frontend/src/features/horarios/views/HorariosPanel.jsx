import React from 'react';
import { CrudMultiLevelManager } from '@/shared/components/crud';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import TableMultiLevel from '@/shared/components/table/views/TableMultiLevel';
import { ConfigLayout } from '@/features/layout';
import { headerProps, getHeaderActions } from '@/features/horarios/config/headerConfig';
import EditarBloquesView from '@/features/horarios/components/EditarBloquesView';
import { useHorarios } from '@/features/horarios/hooks/useHorarios';

/**
 * HorariosPanel — página de gestión de horarios y bloques.
 * 2 niveles: VW_HORARIOS → VW_HORARIO_BLOQUES + vista EditarBloques.
 */
function HorariosPanel() {
  const {
    records, loading, error,
    horariosCrud, bloquesCrud,
    tableLevelConfigs, crudLevels,
    childrenData, childrenLoading, handleExpand,
    editingBloquesHorario, handleBackToHorarios, setNextBloqueOrden
  } = useHorarios();

  return (
    <ConfigLayout>
      <CrudMultiLevelManager crudLevels={crudLevels}>
        {([horarioHandler]) => (
          <>
            {editingBloquesHorario ? (
              <EditarBloquesView
                horario={editingBloquesHorario}
                bloquesCrud={bloquesCrud}
                onBack={handleBackToHorarios}
                onNextOrdenChange={setNextBloqueOrden}
              />
            ) : (
              <div className="px-8 py-8 space-y-8 pb-12">
                <CrudHeader
                  headerTitle={headerProps.headerTitle}
                  headerDescription={headerProps.headerDescription}
                  titleClassName={headerProps.titleClassName}
                  descriptionClassName={headerProps.descriptionClassName}
                  actions={getHeaderActions(horariosCrud)}
                />

                {loading && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                    <p className="text-gray-500 text-sm">Cargando datos...</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                    <p className="text-red-700 text-sm"><strong>Error:</strong> {error.message}</p>
                  </div>
                )}

                {!loading && !error && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                    <TableMultiLevel
                      key={horarioHandler.refreshTrigger}
                      data={records}
                      levelConfigs={tableLevelConfigs}
                      onExpand={handleExpand}
                      childrenData={childrenData}
                      childrenLoading={childrenLoading}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CrudMultiLevelManager>
    </ConfigLayout>
  );
}

export default HorariosPanel;
