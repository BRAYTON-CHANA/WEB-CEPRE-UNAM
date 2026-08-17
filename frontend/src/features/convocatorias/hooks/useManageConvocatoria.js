import { useState, useMemo } from 'react';
import { useCrudForms } from '@/shared/components/crud';
import { useMultiLevelFetch } from '@/shared/hooks/useMultiLevelFetch';
import {
  getConvocatoriasSedeLevelConfig,
  getConvocatoriasCursoLevelConfig,
  getPlazasDocentesLevelConfig
} from '@/features/convocatorias/config/tableConfig';
import { getManageCrudLevels } from '@/features/convocatorias/config/crudLevels';
import {
  convocatoriaCursoFormFields
} from '@/features/convocatorias/config/formConfig';
import { addConvocatoriaCursoPlazas } from '@/features/convocatorias/services/convocatoriaService';

/**
 * useManageConvocatoria — lógica de la página 2 (manejo de convocatoria).
 * State + handlers + CRUD wiring para 3 niveles filtrados por ID_CONVOCATORIA.
 *
 * @param {Object} convocatoria — row de VW_CONVOCATORIAS
 * @param {Function} onBack — callback al click "Volver"
 */
export function useManageConvocatoria({ convocatoria, onBack }) {
  const [selectedConvocatoriaForNewCurso, setSelectedConvocatoriaForNewCurso] = useState(null);
  const [selectedSedeForNewCurso, setSelectedSedeForNewCurso] = useState(null);
  const [editingConvocatoriaId, setEditingConvocatoriaId] = useState(null);
  const [deletingConvocatoriaId, setDeletingConvocatoriaId] = useState(null);
  const [deletingConvocatoriaCursoId, setDeletingConvocatoriaCursoId] = useState(null);
  const [selectedConvocatoriaCurso, setSelectedConvocatoriaCurso] = useState(null);

  const convocatoriaId = convocatoria.ID_CONVOCATORIA;

  const FETCH_CONFIGS = useMemo(() => [
    {
      tableName: 'VW_CONVOCATORIAS_CURSO',
      primaryKey: 'ID_CONVOCATORIA_CURSO',
      filters: { ID_CONVOCATORIA: convocatoriaId }
    },
    {
      tableName: 'VW_PLAZA_DOCENTE_ASIGNADA',
      primaryKey: 'ID_PLAZA_DOCENTE',
      parentKey: 'ID_CONVOCATORIA_CURSO',
      filters: {}
    }
  ], [convocatoriaId]);

  const {
    records,
    childrenCache,
    loading,
    error,
    fetchChildren,
    refresh,
    refreshKeepingExpansion,
    updateRecord
  } = useMultiLevelFetch(FETCH_CONFIGS);

  const convocatoriaCursoCrud = useCrudForms({
    tableName: 'CONVOCATORIA_CURSO',
    primaryKey: 'ID_CONVOCATORIA_CURSO',
    onRefresh: () => {
      const isDelete = deletingConvocatoriaId !== null;
      if (isDelete) {
        refreshKeepingExpansion();
        setDeletingConvocatoriaId(null);
      } else {
        refresh();
      }
    }
  });

  const plazaDocenteCrud = useCrudForms({
    tableName: 'PLAZA_DOCENTE',
    primaryKey: 'ID_PLAZA_DOCENTE',
    onRefresh: () => {
      refreshKeepingExpansion();
      setDeletingConvocatoriaCursoId(null);
    }
  });

  const convocatoriaCursoFormFieldsWithDefaults = useMemo(() => {
    if (!selectedConvocatoriaForNewCurso && !selectedSedeForNewCurso) {
      return convocatoriaCursoFormFields.map(field => {
        if (field.name === 'ID_CONVOCATORIA') {
          return { ...field, defaultValue: convocatoriaId, disabled: true };
        }
        return field;
      });
    }
    return convocatoriaCursoFormFields.map((field) => {
      if (field.name === 'ID_CONVOCATORIA') {
        return { ...field, defaultValue: selectedConvocatoriaForNewCurso ?? convocatoriaId, disabled: true };
      }
      if (field.name === 'ID_SEDE' && selectedSedeForNewCurso) {
        return { ...field, defaultValue: selectedSedeForNewCurso, disabled: true };
      }
      return field;
    });
  }, [selectedConvocatoriaForNewCurso, selectedSedeForNewCurso, convocatoriaId]);

  // ===== Handlers =====
  const handleAddCursoFromHeader = () => {
    setSelectedConvocatoriaForNewCurso(convocatoriaId);
    setSelectedSedeForNewCurso(null);
    convocatoriaCursoCrud.handleCreate();
  };

  const handleAddCursoFromSede = (sedeRow) => {
    setSelectedConvocatoriaForNewCurso(convocatoriaId);
    setSelectedSedeForNewCurso(sedeRow.ID_SEDE);
    convocatoriaCursoCrud.handleCreate();
  };

  const handleAddPlaza = (convocatoriaCursoRow) => {
    addConvocatoriaCursoPlazas({
      ID_CONVOCATORIA: convocatoriaCursoRow.ID_CONVOCATORIA,
      ID_SEDE: convocatoriaCursoRow.ID_SEDE,
      ID_CURSO: convocatoriaCursoRow.ID_CURSO,
      NUMERO_PLAZAS: 1
    }).then(() => {
      refresh();
    }).catch((err) => {
      convocatoriaCursoCrud.showNotification?.('error', 'Error', err.message);
    });
  };

  const handleEditConvocatoriaCurso = (row) => {
    setEditingConvocatoriaId(convocatoriaId);
    convocatoriaCursoCrud.handleEdit(row);
  };

  const handleDeleteConvocatoriaCurso = (row) => {
    setDeletingConvocatoriaId(convocatoriaId);
    convocatoriaCursoCrud.handleDelete(row);
  };

  const handleDeletePlaza = (row) => {
    setDeletingConvocatoriaCursoId(row.ID_CONVOCATORIA_CURSO);
    plazaDocenteCrud.handleDelete(row);
  };

  const handleViewPostulantes = (convocatoriaCursoRow) => {
    setSelectedConvocatoriaCurso(convocatoriaCursoRow);
  };

  const handleBackToManage = () => {
    setSelectedConvocatoriaCurso(null);
  };

  const handleExpand = (levelIndex, parentValue) => {
    fetchChildren(levelIndex, parentValue);
  };

  const tableLevelConfigs = useMemo(() => [
    getConvocatoriasSedeLevelConfig(handleAddCursoFromSede),
    getConvocatoriasCursoLevelConfig(
      { ...convocatoriaCursoCrud, handleEdit: handleEditConvocatoriaCurso, handleDelete: handleDeleteConvocatoriaCurso },
      handleViewPostulantes,
      handleAddPlaza
    ),
    getPlazasDocentesLevelConfig({ ...plazaDocenteCrud, handleDelete: handleDeletePlaza })
  ], [convocatoriaCursoCrud, plazaDocenteCrud, convocatoriaId]);

  const crudLevels = useMemo(() => [
    ...getManageCrudLevels({
      convocatoriaCursoCrud,
      plazaDocenteCrud,
      formFieldsWithDefaults: convocatoriaCursoFormFieldsWithDefaults,
      selectedSedeForNewCurso,
      refresh,
      setSelectedConvocatoriaForNewCurso,
      setSelectedSedeForNewCurso,
      setEditingConvocatoriaId
    })
  ], [convocatoriaCursoCrud, plazaDocenteCrud, convocatoriaCursoFormFieldsWithDefaults, selectedSedeForNewCurso, refresh]);

  const childrenData = {};
  const childrenLoading = {};
  Object.entries(childrenCache).forEach(([key, val]) => {
    childrenData[key] = val.data;
    childrenLoading[key] = val.loading;
  });

  const manageHeaderActions = [
    {
      text: 'Añadir Convocatoria Curso',
      onClick: handleAddCursoFromHeader,
      font: 'bg-green-600 hover:bg-green-700 text-white'
    }
  ];

  return {
    // Data
    records,
    loading,
    error,
    updateRecord,
    // Table
    tableLevelConfigs,
    crudLevels,
    childrenData,
    childrenLoading,
    handleExpand,
    // Sub-panel postulaciones
    selectedConvocatoriaCurso,
    handleBackToManage,
    // Header
    manageHeaderActions
  };
}
