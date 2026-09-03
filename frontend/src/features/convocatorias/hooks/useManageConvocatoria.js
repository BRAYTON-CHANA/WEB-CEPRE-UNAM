import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCrudForms } from '@/shared/components/crud';
import { useMultiLevelFetch } from '@/shared/hooks/useMultiLevelFetch';
import {
  getConvocatoriasSedeLevelConfig,
  getConvocatoriasCursoLevelConfig,
  getPlazasDocentesLevelConfig,
  getPlazasDocentesFlatConfig
} from '@/features/convocatorias/config/tableConfig.jsx';
import { getManageCrudLevels } from '@/features/convocatorias/config/crudLevels';
import {
  convocatoriaCursoFormFields
} from '@/features/convocatorias/config/formConfig';
import { addConvocatoriaCursoPlazas, addPlazaDocenteSimple } from '@/features/convocatorias/services/convocatoriaService';
import { db } from '@/shared/api';

/**
 * useManageConvocatoria — lógica de la página 2 (manejo de convocatoria).
 * State + handlers + CRUD wiring para 3 niveles filtrados por ID_CONVOCATORIA.
 *
 * @param {Object} convocatoria — row de VW_CONVOCATORIAS
 * @param {Function} onBack — callback al click "Volver"
 */
export function useManageConvocatoria({ convocatoria, onViewPostulantes }) {
  const [selectedConvocatoriaForNewCurso, setSelectedConvocatoriaForNewCurso] = useState(null);
  const [selectedSedeForNewCurso, setSelectedSedeForNewCurso] = useState(null);
  const [selectedModalidadForNewCurso, setSelectedModalidadForNewCurso] = useState(null);
  const [editingConvocatoriaId, setEditingConvocatoriaId] = useState(null);
  const [deletingConvocatoriaId, setDeletingConvocatoriaId] = useState(null);
  const [deletingConvocatoriaCursoId, setDeletingConvocatoriaCursoId] = useState(null);
  const [addingPlazaId, setAddingPlazaId] = useState(null);

  const convocatoriaId = convocatoria.ID_CONVOCATORIA;

  const FETCH_CONFIGS = useMemo(() => [
    {
      tableName: 'VW_CONVOCATORIAS_CURSO',
      primaryKey: 'ID_CONVOCATORIA_CURSO',
      filters: { ID_CONVOCATORIA: convocatoriaId },
      orderBy: 'NOMBRE_CURSO'
    },
    {
      tableName: 'VW_PLAZA_DOCENTE',
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
    refreshChildren,
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
      // Solo refrescar las plazas hijas del convocatoria_curso afectado,
      // sin recargar nivel 1 ni colapsar la expansión.
      if (deletingConvocatoriaCursoId) {
        refreshChildren(1, deletingConvocatoriaCursoId);
      }
      setDeletingConvocatoriaCursoId(null);
    }
  });

  const convocatoriaCursoFormFieldsWithDefaults = useMemo(() => {
    const modalidadDefault = selectedModalidadForNewCurso || 'PRESENCIAL';
    if (!selectedConvocatoriaForNewCurso && !selectedSedeForNewCurso && !selectedModalidadForNewCurso) {
      return convocatoriaCursoFormFields.map(field => {
        if (field.name === 'ID_CONVOCATORIA') {
          return { ...field, defaultValue: convocatoriaId, disabled: true };
        }
        if (field.name === 'MODALIDAD') {
          return { ...field, defaultValue: modalidadDefault };
        }
        return field;
      });
    }
    return convocatoriaCursoFormFields.map((field) => {
      if (field.name === 'ID_CONVOCATORIA') {
        return { ...field, defaultValue: selectedConvocatoriaForNewCurso ?? convocatoriaId, disabled: true };
      }
      if (field.name === 'MODALIDAD') {
        return { ...field, defaultValue: modalidadDefault, disabled: !!selectedModalidadForNewCurso };
      }
      if (field.name === 'ID_SEDE' && selectedSedeForNewCurso) {
        return { ...field, defaultValue: selectedSedeForNewCurso, disabled: true };
      }
      // Si modalidad es VIRTUAL, ID_SEDE debe ocultarse y no ser required
      if (field.name === 'ID_SEDE' && modalidadDefault === 'VIRTUAL') {
        return { ...field, defaultValue: null, required: false, hidden: true };
      }
      return field;
    });
  }, [selectedConvocatoriaForNewCurso, selectedSedeForNewCurso, selectedModalidadForNewCurso, convocatoriaId]);

  // ===== Handlers =====
  const handleAddCursoFromHeader = () => {
    setSelectedConvocatoriaForNewCurso(convocatoriaId);
    setSelectedSedeForNewCurso(null);
    setSelectedModalidadForNewCurso(null);
    convocatoriaCursoCrud.handleCreate();
  };

  const handleAddCursoFromSede = (sedeRow) => {
    setSelectedConvocatoriaForNewCurso(convocatoriaId);
    // Si la sede es Virtual (NOMBRE_SEDE='Virtual' o MODALIDAD='VIRTUAL'), precargar modalidad VIRTUAL
    const modalidad = sedeRow.MODALIDAD || (sedeRow.NOMBRE_SEDE === 'Virtual' ? 'VIRTUAL' : 'PRESENCIAL');
    setSelectedModalidadForNewCurso(modalidad);
    setSelectedSedeForNewCurso(modalidad === 'VIRTUAL' ? null : sedeRow.ID_SEDE);
    convocatoriaCursoCrud.handleCreate();
  };

  const handleAddPlaza = (convocatoriaCursoRow) => {
    if (addingPlazaId) return;
    const id = convocatoriaCursoRow.ID_CONVOCATORIA_CURSO;
    setAddingPlazaId(id);
    // Actualización optimista: incrementar PLAZAS_CREADAS en el row padre (nivel 1)
    const nuevasCreadas = Number(convocatoriaCursoRow.PLAZAS_CREADAS ?? 0) + 1;
    updateRecord(id, 'ID_CONVOCATORIA_CURSO', 'PLAZAS_CREADAS', nuevasCreadas);
    addPlazaDocenteSimple(id)
      .then(() => {
        refreshChildren(1, id);
      }).catch((err) => {
        // Revertir en caso de error
        updateRecord(id, 'ID_CONVOCATORIA_CURSO', 'PLAZAS_CREADAS', convocatoriaCursoRow.PLAZAS_CREADAS ?? 0);
        convocatoriaCursoCrud.showNotification?.('error', 'Error', err.message);
      }).finally(() => {
        setAddingPlazaId(null);
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
    const idConvocatoriaCurso = row.ID_CONVOCATORIA_CURSO;
    setDeletingConvocatoriaCursoId(idConvocatoriaCurso);
    // Actualización optimista: decrementar PLAZAS_CREADAS del padre (nivel 1)
    const padre = records.find(r => String(r.ID_CONVOCATORIA_CURSO) === String(idConvocatoriaCurso));
    const creadasAntes = padre ? Number(padre.PLAZAS_CREADAS ?? 0) : null;
    if (padre && creadasAntes !== null) {
      updateRecord(idConvocatoriaCurso, 'ID_CONVOCATORIA_CURSO', 'PLAZAS_CREADAS', Math.max(0, creadasAntes - 1));
    }
    plazaDocenteCrud.handleDelete(row);
  };

  const handleViewPostulantes = (convocatoriaCursoRow) => {
    onViewPostulantes?.(convocatoriaCursoRow);
  };

  const handleExpand = (levelIndex, parentValue) => {
    fetchChildren(levelIndex, parentValue);
  };

  const tableLevelConfigs = useMemo(() => [
    getConvocatoriasSedeLevelConfig(handleAddCursoFromSede),
    getConvocatoriasCursoLevelConfig(
      { ...convocatoriaCursoCrud, handleEdit: handleEditConvocatoriaCurso, handleDelete: handleDeleteConvocatoriaCurso },
      handleViewPostulantes,
      handleAddPlaza,
      addingPlazaId
    ),
    getPlazasDocentesLevelConfig({ ...plazaDocenteCrud, handleDelete: handleDeletePlaza })
  ], [convocatoriaCursoCrud, plazaDocenteCrud, convocatoriaId, addingPlazaId]);

  const crudLevels = useMemo(() => [
    ...getManageCrudLevels({
      convocatoriaCursoCrud,
      plazaDocenteCrud,
      formFieldsWithDefaults: convocatoriaCursoFormFieldsWithDefaults,
      selectedSedeForNewCurso,
      selectedModalidadForNewCurso,
      refresh,
      setSelectedConvocatoriaForNewCurso,
      setSelectedSedeForNewCurso,
      setSelectedModalidadForNewCurso,
      setEditingConvocatoriaId
    })
  ], [convocatoriaCursoCrud, plazaDocenteCrud, convocatoriaCursoFormFieldsWithDefaults, selectedSedeForNewCurso, selectedModalidadForNewCurso, refresh]);

  const childrenData = {};
  const childrenLoading = {};
  Object.entries(childrenCache).forEach(([key, val]) => {
    childrenData[key] = val.data;
    childrenLoading[key] = val.loading;
  });

  // ===== Modo plano: todas las plazas de la convocatoria en una sola tabla =====
  const [plazasAll, setPlazasAll] = useState([]);
  const [plazasAllLoading, setPlazasAllLoading] = useState(false);
  const [plazasAllError, setPlazasAllError] = useState(null);
  const [plazasAllVersion, setPlazasAllVersion] = useState(0);

  const fetchPlazasAll = useCallback(async () => {
    if (!convocatoriaId) {
      setPlazasAll([]);
      return;
    }
    setPlazasAllLoading(true);
    setPlazasAllError(null);
    try {
      const data = await db.select('VW_PLAZA_DOCENTE', {
        ID_CONVOCATORIA: convocatoriaId
      });
      // Ordenar: por NOMBRE_SEDE (Virtual al final), luego por IDENTIFICADOR_DOCENTE
      const sorted = [...(data || [])].sort((a, b) => {
        const aSede = String(a.NOMBRE_SEDE ?? '');
        const bSede = String(b.NOMBRE_SEDE ?? '');
        const aIsVirtual = aSede.toLowerCase() === 'virtual';
        const bIsVirtual = bSede.toLowerCase() === 'virtual';
        if (aIsVirtual && !bIsVirtual) return 1;
        if (!aIsVirtual && bIsVirtual) return -1;
        const sedeCmp = aSede.localeCompare(bSede, 'es', { sensitivity: 'base' });
        if (sedeCmp !== 0) return sedeCmp;
        // Mismo grupo de sede: ordenar por IDENTIFICADOR_DOCENTE
        return String(a.IDENTIFICADOR_DOCENTE ?? '').localeCompare(
          String(b.IDENTIFICADOR_DOCENTE ?? ''), 'es', { sensitivity: 'base' }
        );
      });
      setPlazasAll(sorted);
    } catch (err) {
      console.error('[useManageConvocatoria] fetchPlazasAll error:', err);
      setPlazasAllError(err);
      setPlazasAll([]);
    } finally {
      setPlazasAllLoading(false);
    }
  }, [convocatoriaId]);

  useEffect(() => {
    if (plazasAllVersion > 0) fetchPlazasAll();
  }, [plazasAllVersion, fetchPlazasAll]);

  // Auto-fetch al montar (no depende de records nivel 1)
  useEffect(() => {
    if (convocatoriaId && plazasAllVersion === 0) {
      fetchPlazasAll();
    }
  }, [convocatoriaId, plazasAllVersion, fetchPlazasAll]);

  const refreshPlazasAll = useCallback(() => {
    setPlazasAllVersion(v => v + 1);
  }, []);

  const handleDeletePlazaFlat = useCallback((row) => {
    const idConvocatoriaCurso = row.ID_CONVOCATORIA_CURSO;
    setDeletingConvocatoriaCursoId(idConvocatoriaCurso);
    plazaDocenteCrud.handleDelete(row);
    // Refrescar plano tras delete
    refreshPlazasAll();
  }, [plazaDocenteCrud, refreshPlazasAll]);

  const updateRecordFlat = useCallback((recordId, primaryKey, field, newValue) => {
    setPlazasAll(prev => prev.map(r =>
      String(r[primaryKey]) === String(recordId) ? { ...r, [field]: newValue } : r
    ));
  }, []);

  const flatTableConfig = useMemo(
    () => getPlazasDocentesFlatConfig({
      ...plazaDocenteCrud,
      handleDelete: handleDeletePlazaFlat
    }),
    [plazaDocenteCrud, handleDeletePlazaFlat]
  );

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
    // Table compacto
    tableLevelConfigs,
    crudLevels,
    childrenData,
    childrenLoading,
    handleExpand,
    // Modo plano
    plazasAll,
    plazasAllLoading,
    plazasAllError,
    flatTableConfig,
    refreshPlazasAll,
    updateRecordFlat,
    // Header
    manageHeaderActions
  };
}
