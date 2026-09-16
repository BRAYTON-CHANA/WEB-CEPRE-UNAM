import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/shared/api';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { usePeriodo } from '@/shared/context/PeriodoContext';
import { tableConfig, getTableLevelConfigs } from '@/features/turnos/turnos/config/tableConfig';
import { generarMatrizTurno } from '@/features/turnos/turnos/utils/generarMatriz';
import {
  turnoBloqueBaseFields,
  turnoBloqueMultiStep,
  turnoBloqueValidation,
  turnoBloqueModalConfig
} from '@/features/turnos/turnos/config/turnoBloquesFormConfig';

const EMPTY_FORM = {
  ID_PERIODO: '',
  FECHA_INICIO: '',
  FECHA_FIN: '',
  ID_HORARIO_ORIGEN: '',
  ID_SEDE: '',
  NOMBRE_TURNO: '',
  HORA_INICIO_JORNADA: '',
  HORA_FIN_JORNADA: '',
  DIAS_VALIDOS: [],
  DIAS_POR_SEMANA: '',
  ACTIVO: true,
  MATRIZ_DIAS: null
};

// Normaliza la matriz para enviarla como DATE[][] (PostgREST convierte
// arrays JSON anidados a arrays Postgres; '' se trata como NULL)
const matrizToArray = (m) => {
  if (!Array.isArray(m) || m.length === 0) return null;
  return m.map(row => row.map(d => (d ? String(d) : null)));
};

// Deriva los días válidos (1-7, ISODOW) presentes en una matriz de fechas
const diasValidosDesdeMatriz = (m) => {
  if (!Array.isArray(m)) return [];
  const set = new Set();
  for (const fila of m) {
    for (const d of fila) {
      if (d) set.add(((new Date(`${d}T00:00:00`).getDay() + 6) % 7) + 1);
    }
  }
  return [...set].sort((a, b) => a - b);
};

export function useTurnos() {
  const { periodo, periodoObj, periodos } = usePeriodo();

  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const crud = useCrudForms({
    tableName: 'TURNOS',
    primaryKey: 'ID_TURNO',
    onRefresh: refresh
  });

  const [horarios, setHorarios] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurno, setEditingTurno] = useState(null);
  const [editingBloquesTurno, setEditingBloquesTurno] = useState(null);
  const [nextBloqueOrden, setNextBloqueOrden] = useState(1);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]);

  const bloquesCrud = useCrudForms({
    tableName: 'TURNO_BLOQUES',
    primaryKey: 'ID_BLOQUE',
    onRefresh: () => {}
  });

  const handleEditarBloques = useCallback((turnoRow) => {
    setEditingBloquesTurno(turnoRow);
  }, []);

  const handleBackToTurnos = useCallback(() => {
    setEditingBloquesTurno(null);
  }, []);

  const turnoBloqueFormFields = useMemo(() => {
    if (!editingBloquesTurno) return turnoBloqueBaseFields;
    return turnoBloqueBaseFields.map(field => {
      if (field.name === 'ID_TURNO') {
        return { ...field, defaultValue: editingBloquesTurno.ID_TURNO, disabled: true };
      }
      if (field.name === 'ORDEN') {
        return { ...field, defaultValue: nextBloqueOrden, hidden: true, required: false };
      }
      return field;
    });
  }, [editingBloquesTurno, nextBloqueOrden]);

  const fetchHorarios = useCallback(async () => {
    try {
      const res = await db.select('VW_HORARIOS');
      setHorarios(Array.isArray(res?.data || res) ? (res?.data || res) : []);
    } catch (err) {
      console.error('[Turnos] Error cargando horarios:', err);
    }
  }, []);

  useEffect(() => { fetchHorarios(); }, [fetchHorarios]);

  // Fechas bloqueadas del período seleccionado (para la generación client-side)
  const fetchBloqueadas = useCallback(async (idPeriodo) => {
    if (!idPeriodo) { setFechasBloqueadas([]); return; }
    try {
      const res = await db.select('FECHAS_BLOQUEADAS', { ID_PERIODO: Number(idPeriodo) });
      const list = Array.isArray(res?.data || res) ? (res?.data || res) : [];
      setFechasBloqueadas(list.map(f => String(f.FECHA).slice(0, 10)));
    } catch (err) {
      console.error('[Turnos] Error cargando fechas bloqueadas:', err);
      setFechasBloqueadas([]);
    }
  }, []);

  const setField = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  const handlePeriodoChange = useCallback((idPeriodo) => {
    fetchBloqueadas(idPeriodo);
    const p = periodos.find(x => String(x.ID_PERIODO) === String(idPeriodo));
    setFormData(prev => ({
      ...prev,
      ID_PERIODO: idPeriodo,
      FECHA_INICIO: p?.FECHA_INICIO || prev.FECHA_INICIO,
      FECHA_FIN: p?.FECHA_FIN || prev.FECHA_FIN
    }));
    setFormErrors(prev => ({ ...prev, ID_PERIODO: undefined }));
  }, [periodos, fetchBloqueadas]);

  const openCreate = useCallback(() => {
    setEditingTurno(null);
    setFormErrors({});
    fetchBloqueadas(periodo);
    setFormData({
      ...EMPTY_FORM,
      ID_PERIODO: periodo || '',
      FECHA_INICIO: periodoObj?.FECHA_INICIO || '',
      FECHA_FIN: periodoObj?.FECHA_FIN || ''
    });
    setIsModalOpen(true);
  }, [periodo, periodoObj, fetchBloqueadas]);

  const openEdit = useCallback((row) => {
    setEditingTurno(row);
    fetchBloqueadas(row.ID_PERIODO);
    setFormErrors({});
    setFormData({
      ID_PERIODO: row.ID_PERIODO || '',
      FECHA_INICIO: row.PERIODO_FECHA_INICIO || '',
      FECHA_FIN: row.PERIODO_FECHA_FIN || '',
      ID_HORARIO_ORIGEN: '',
      ID_SEDE: row.ID_SEDE || '',
      NOMBRE_TURNO: row.NOMBRE_TURNO || '',
      HORA_INICIO_JORNADA: row.HORA_INICIO_JORNADA || '',
      HORA_FIN_JORNADA: row.HORA_FIN_JORNADA || '',
      DIAS_VALIDOS: diasValidosDesdeMatriz(row.MATRIZ_DIAS),
      DIAS_POR_SEMANA: row.DIAS_POR_SEMANA || '',
      ACTIVO: row.ACTIVO ?? true,
      MATRIZ_DIAS: row.MATRIZ_DIAS || null
    });
    setIsModalOpen(true);
  }, [fetchBloqueadas]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTurno(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
  }, []);

  const applyHorarioTemplate = useCallback((horarioId) => {
    const h = horarios.find(x => String(x.ID_HORARIO) === String(horarioId));
    setFormData(prev => ({
      ...prev,
      ID_HORARIO_ORIGEN: horarioId,
      ...(h ? {
        ID_SEDE: h.ID_SEDE || prev.ID_SEDE,
        NOMBRE_TURNO: h.NOMBRE_HORARIO || prev.NOMBRE_TURNO,
        HORA_INICIO_JORNADA: h.HORA_INICIO_JORNADA || prev.HORA_INICIO_JORNADA,
        HORA_FIN_JORNADA: h.HORA_FIN_JORNADA || prev.HORA_FIN_JORNADA,
        DIAS_VALIDOS: Array.isArray(h.DIAS_VALIDOS) ? h.DIAS_VALIDOS : prev.DIAS_VALIDOS,
        DIAS_POR_SEMANA: h.DIAS_POR_SEMANA ?? prev.DIAS_POR_SEMANA
      } : {})
    }));
  }, [horarios]);

  const generarMatriz = useCallback(() => {
    const errors = {};
    if (!formData.ID_PERIODO) errors.ID_PERIODO = 'Selecciona un periodo';
    if (!formData.FECHA_INICIO) errors.FECHA_INICIO = 'Requerido';
    if (!formData.FECHA_FIN) errors.FECHA_FIN = 'Requerido';
    if (!Array.isArray(formData.DIAS_VALIDOS) || formData.DIAS_VALIDOS.length === 0) {
      errors.DIAS_VALIDOS = 'Selecciona al menos un día válido';
    }
    if (!Number(formData.DIAS_POR_SEMANA) || Number(formData.DIAS_POR_SEMANA) < 1) {
      errors.DIAS_POR_SEMANA = 'Debe ser al menos 1';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(prev => ({ ...prev, ...errors }));
      return;
    }

    const matriz = generarMatrizTurno({
      fechaInicio: formData.FECHA_INICIO,
      fechaFin: formData.FECHA_FIN,
      diasValidos: formData.DIAS_VALIDOS,
      diasPorSemana: Number(formData.DIAS_POR_SEMANA),
      fechasBloqueadas
    });

    if (!matriz) {
      setFormErrors(prev => ({ ...prev, MATRIZ_DIAS: 'No se generaron fechas con esos parámetros' }));
      return;
    }
    setFormData(prev => ({ ...prev, MATRIZ_DIAS: matriz }));
    setFormErrors(prev => ({ ...prev, MATRIZ_DIAS: undefined }));
  }, [formData.ID_PERIODO, formData.FECHA_INICIO, formData.FECHA_FIN, formData.DIAS_VALIDOS, formData.DIAS_POR_SEMANA, fechasBloqueadas]);

  const validate = useCallback(() => {
    const errors = {};
    if (!formData.ID_PERIODO) errors.ID_PERIODO = 'Requerido';
    if (!formData.NOMBRE_TURNO?.trim()) errors.NOMBRE_TURNO = 'Requerido';
    if (!formData.HORA_INICIO_JORNADA) errors.HORA_INICIO_JORNADA = 'Requerido';
    if (!formData.HORA_FIN_JORNADA) errors.HORA_FIN_JORNADA = 'Requerido';
    if (formData.HORA_INICIO_JORNADA && formData.HORA_FIN_JORNADA && formData.HORA_INICIO_JORNADA >= formData.HORA_FIN_JORNADA) {
      errors.HORA_FIN_JORNADA = 'Debe ser mayor que la hora de inicio';
    }
    if (!Array.isArray(formData.MATRIZ_DIAS) || formData.MATRIZ_DIAS.length === 0) {
      errors.MATRIZ_DIAS = 'Genera las fechas del turno primero';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ID_PERIODO: Number(formData.ID_PERIODO),
        ID_SEDE: formData.ID_SEDE ? Number(formData.ID_SEDE) : null,
        NOMBRE_TURNO: formData.NOMBRE_TURNO.trim(),
        HORA_INICIO_JORNADA: formData.HORA_INICIO_JORNADA,
        HORA_FIN_JORNADA: formData.HORA_FIN_JORNADA,
        ACTIVO: formData.ACTIVO,
        MATRIZ_DIAS: matrizToArray(formData.MATRIZ_DIAS)
      };
      if (editingTurno) {
        await db.update('TURNOS', editingTurno.ID_TURNO, payload, 'ID_TURNO');
      } else {
        const inserted = await db.insert('TURNOS', payload);
        const row = Array.isArray(inserted) ? inserted[0] : inserted;
        const idTurno = row?.ID_TURNO;
        if (formData.ID_HORARIO_ORIGEN && idTurno) {
          await db.executeFunction('fn_copiar_bloques_horario_a_turno', {
            idTurno: Number(idTurno),
            idHorario: Number(formData.ID_HORARIO_ORIGEN)
          });
        }
      }
      refresh();
      closeModal();
      crud.showNotification(
        'success',
        'Operación Exitosa',
        editingTurno ? 'El turno ha sido actualizado exitosamente.' : 'El turno ha sido creado exitosamente.'
      );
    } catch (err) {
      setFormErrors(prev => ({ ...prev, general: err.message || 'Error al guardar' }));
    } finally {
      setSaving(false);
    }
  }, [formData, editingTurno, validate, refresh, closeModal, crud]);

  const tableLevelConfigs = useMemo(() => getTableLevelConfigs({
    handleEdit: openEdit,
    handleDelete: crud.handleDelete,
    handleEditarBloques
  }), [openEdit, crud.handleDelete, handleEditarBloques]);

  const crudLevels = useMemo(() => [
    {
      crud,
      tableName: 'TURNOS',
      primaryKey: 'ID_TURNO',
      formFields: [],
      formLayout: null,
      multiStep: null,
      validation: () => ({}),
      confirmSubmit: false,
      modalConfig: {
        createTitle: 'Crear Turno',
        editTitle: 'Editar Turno',
        deleteTitle: '¿Eliminar turno?',
        deleteMessage: (row) => `¿Eliminar el turno "${row.NOMBRE_TURNO}"? Se eliminarán también sus bloques.`
      }
    },
    {
      crud: bloquesCrud,
      tableName: 'TURNO_BLOQUES',
      primaryKey: 'ID_BLOQUE',
      formFields: turnoBloqueFormFields,
      formLayout: null,
      multiStep: turnoBloqueMultiStep,
      validation: turnoBloqueValidation,
      confirmSubmit: true,
      modalConfig: {
        ...turnoBloqueModalConfig,
        createFormKey: editingBloquesTurno?.ID_TURNO ?? 'free'
      }
    }
  ], [crud, bloquesCrud, turnoBloqueFormFields, editingBloquesTurno]);

  const periodoOptions = useMemo(() =>
    periodos.map(p => ({ value: p.ID_PERIODO, label: `${p.CODIGO_PERIODO} - ${p.NOMBRE_PERIODO}` })),
    [periodos]
  );

  const horarioOptions = useMemo(() =>
    horarios.filter(h => h.ACTIVO).map(h => ({
      value: h.ID_HORARIO,
      label: `${h.NOMBRE_HORARIO} (${h.NOMBRE_SEDE || 'Sin sede'}) - ${h.HORA_INICIO_JORNADA} a ${h.HORA_FIN_JORNADA}`
    })),
    [horarios]
  );

  const sedeOptions = useMemo(() => {
    const sedes = [...new Map(horarios.filter(h => h.ACTIVO).map(h => [h.ID_SEDE, h.NOMBRE_SEDE])).entries()];
    return sedes.map(([id, nombre]) => ({ value: id, label: nombre || 'Sin sede' }));
  }, [horarios]);

  return {
    records,
    loading,
    error,
    crud,
    crudLevels,
    tableLevelConfigs,
    isModalOpen,
    editingTurno,
    editingBloquesTurno,
    bloquesCrud,
    setNextBloqueOrden,
    handleEditarBloques,
    handleBackToTurnos,
    formData,
    formErrors,
    fechasBloqueadas,
    saving,
    periodoOptions,
    horarioOptions,
    sedeOptions,
    openCreate,
    openEdit,
    closeModal,
    setField,
    handlePeriodoChange,
    applyHorarioTemplate,
    generarMatriz,
    handleSubmit,
    refresh
  };
}

export default useTurnos;
