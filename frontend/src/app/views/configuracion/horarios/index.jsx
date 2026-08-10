import React, { useState, useMemo } from 'react';
import { useCrudForms, CrudMultiLevelManager } from '@/shared/components/crud';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import TableMultiLevel from '@/shared/components/table/views/TableMultiLevel';
import { ConfigLayout } from '@/features/layout';
import { useMultiLevelFetch } from '@/shared/hooks/useMultiLevelFetch';
import { getHorariosLevelConfig, getHorarioBloquesLevelConfig } from '@/features/horarios/config/tableConfig';
import { horariosFormFields, horariosMultiStep, horariosValidation, horariosModalConfig } from '@/features/horarios/config/horariosFormConfig';
import { bloqueBaseFields, bloqueMultiStep, bloqueValidation, bloqueModalConfig } from '@/features/horarios/config/horarioBloquesFormConfig';
import { headerProps, getHeaderActions } from '@/features/horarios/config/headerConfig';
import EditarBloquesView from '@/features/horarios/components/EditarBloquesView';

const FETCH_CONFIGS = [
  { tableName: 'VW_HORARIOS', primaryKey: 'ID_HORARIO', filters: {} },
  { tableName: 'VW_HORARIO_BLOQUES', primaryKey: 'ID_BLOQUE', parentKey: 'ID_HORARIO' }
];

/**
 * Configuración de HORARIOS Y BLOQUES
 * MultiLevel CRUD con carga lazy, igual que Infraestructura.
 */
function HorariosConfig() {
  const {
    records,
    childrenCache,
    loading,
    error,
    fetchChildren,
    refresh,
    refreshChildren
  } = useMultiLevelFetch(FETCH_CONFIGS);

  const horariosCrud = useCrudForms({
    tableName: 'HORARIOS',
    primaryKey: 'ID_HORARIO',
    onRefresh: refresh
  });

  // Horario seleccionado para la vista "Editar Bloques" (null = tabla normal)
  const [editingBloquesHorario, setEditingBloquesHorario] = useState(null);
  // Próximo ORDEN al crear un bloque (auto-calculado: max(ORDEN) + 1)
  const [nextBloqueOrden, setNextBloqueOrden] = useState(1);

  const bloquesCrud = useCrudForms({
    tableName: 'HORARIO_BLOQUES',
    primaryKey: 'ID_BLOQUE',
    onRefresh: () => {
      if (editingBloquesHorario) {
        refreshChildren(1, editingBloquesHorario.ID_HORARIO);
      }
    }
  });

  // Campos de bloque: si estamos editando bloques de un horario, preestablecer ID_HORARIO
  // y ocultar ORDEN (auto-calculado al final, se reordena con flechas)
  const bloqueFormFields = useMemo(() => {
    if (!editingBloquesHorario) return bloqueBaseFields;
    return bloqueBaseFields.map(field => {
      if (field.name === 'ID_HORARIO') {
        return { ...field, defaultValue: editingBloquesHorario.ID_HORARIO, disabled: true };
      }
      if (field.name === 'ORDEN') {
        return {
          ...field,
          defaultValue: nextBloqueOrden,
          hidden: true,
          required: false
        };
      }
      return field;
    });
  }, [editingBloquesHorario, nextBloqueOrden]);

  const handleEditarBloques = (horarioRow) => {
    setEditingBloquesHorario(horarioRow);
  };

  const handleBackToHorarios = () => {
    setEditingBloquesHorario(null);
  };

  const handleExpand = (levelIndex, parentValue) => {
    fetchChildren(levelIndex, parentValue);
  };

  const tableLevelConfigs = [
    getHorariosLevelConfig(horariosCrud, handleEditarBloques),
    getHorarioBloquesLevelConfig({ ...bloquesCrud })
  ];

  const crudLevels = [
    {
      crud: horariosCrud,
      tableName: 'HORARIOS',
      primaryKey: 'ID_HORARIO',
      formFields: horariosFormFields,
      formLayout: null,
      multiStep: horariosMultiStep,
      validation: horariosValidation,
      confirmSubmit: true,
      modalConfig: horariosModalConfig
    },
    {
      crud: bloquesCrud,
      tableName: 'HORARIO_BLOQUES',
      primaryKey: 'ID_BLOQUE',
      formFields: bloqueFormFields,
      formLayout: null,
      multiStep: bloqueMultiStep,
      validation: bloqueValidation,
      confirmSubmit: true,
      modalConfig: {
        ...bloqueModalConfig,
        createFormKey: editingBloquesHorario?.ID_HORARIO ?? 'free'
      }
    }
  ];

  const childrenData = {};
  const childrenLoading = {};
  Object.entries(childrenCache).forEach(([key, val]) => {
    childrenData[key] = val.data;
    childrenLoading[key] = val.loading;
  });

  return (
    <ConfigLayout>
      <CrudMultiLevelManager crudLevels={crudLevels}>
        {([horarioHandler]) => (
          <>
            {/* Vista: Editar Bloques de un horario específico */}
            {editingBloquesHorario ? (
              <EditarBloquesView
                horario={editingBloquesHorario}
                bloquesCrud={bloquesCrud}
                onBack={handleBackToHorarios}
                onNextOrdenChange={setNextBloqueOrden}
              />
            ) : (
              /* Vista normal: tabla de horarios */
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

export default HorariosConfig;
