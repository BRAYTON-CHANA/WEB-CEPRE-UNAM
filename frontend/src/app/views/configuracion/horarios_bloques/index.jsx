import React, { useState, useMemo } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import ScheduleTemplate from '@/features/schedule/components/ScheduleTemplate';
import { tableConfig, getTableLevelConfigs } from './config/tableConfig';
import { horariosFormFields, horariosMultiStep, horariosValidation, horariosModalConfig } from './config/horariosFormConfig';
import { bloqueBaseFields, bloqueMultiStep, bloqueValidation, bloqueModalConfig } from './config/horarioBloquesFormConfig';
import { headerProps, getHeaderActions } from './config/headerConfig';

/**
 * Configuración de HORARIOS Y BLOQUES (Plantillas)
 * MultiLevel CRUD con agrupación por horario y CRUD completo en ambos niveles.
 * Usa CrudMultiLevelManager para encapsular modales y layout.
 */
function HorariosBloquesConfig() {
  // ==========================================
  // 1. DATOS
  // ==========================================
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  // ==========================================
  // 2. CRUD HOOKS (dos tablas)
  // ==========================================
  const horariosCrud = useCrudForms({
    tableName: 'HORARIOS',
    primaryKey: 'ID_HORARIO',
    onRefresh: refresh
  });

  const bloquesCrud = useCrudForms({
    tableName: 'HORARIO_BLOQUES',
    primaryKey: 'ID_BLOQUE',
    onRefresh: refresh
  });

  // Estado para preseleccionar horario al añadir bloque desde un horario
  const [selectedHorarioForNewBloque, setSelectedHorarioForNewBloque] = useState(null);

  // Estados para modal de vista de plantilla
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [customBlocks, setCustomBlocks] = useState(null);
  const [selectedMatrix, setSelectedMatrix] = useState(null);
  const [calendarStartHour, setCalendarStartHour] = useState(7);
  const [calendarFinalHour, setCalendarFinalHour] = useState(19);

  // ==========================================
  // 3. FORM FIELDS DINÁMICOS (bloque con horario preseleccionado)
  // ==========================================
  const bloqueFormFields = useMemo(() => {
    if (selectedHorarioForNewBloque === null) return bloqueBaseFields;
    return bloqueBaseFields.map(field => {
      if (field.name === 'ID_HORARIO') {
        return { ...field, defaultValue: selectedHorarioForNewBloque, disabled: true };
      }
      return field;
    });
  }, [selectedHorarioForNewBloque]);

  // ==========================================
  // 4. HANDLERS
  // ==========================================
  const handleAddBloqueToHorario = (horarioRow) => {
    setSelectedHorarioForNewBloque(horarioRow.ID_HORARIO);
    bloquesCrud.handleCreate();
  };

  // Transform VW_HORARIO_BLOQUES response to custom blocks format
  const transformToCustomBlocks = (apiResponse) => {
    if (!apiResponse?.data?.records || !Array.isArray(apiResponse.data.records)) {
      return [];
    }

    return apiResponse.data.records
      .sort((a, b) => a.ORDEN - b.ORDEN)
      .map(record => ({
        duration: record.DURACION,
        type: record.TIPO_BLOQUE,
        label: record.ETIQUETA || `Bloque ${record.ORDEN}`,
        orden: record.ORDEN
      }));
  };

  const formatTime = (hour, minute = 0) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Genera bloques con timeRange como lo hace useCalendar.generateCustomBlocks
  const generateBlockTimeRanges = (blocks, startHour, finalHour) => {
    if (!Array.isArray(blocks) || blocks.length === 0) return [];
    const startMinutes = startHour * 60;
    const finalMinutes = finalHour !== null ? finalHour * 60 : null;
    let currentMinute = startMinutes;
    const result = [];

    blocks.forEach((block, index) => {
      const { duration, type, label } = block;
      const hour = Math.floor(currentMinute / 60);
      const minute = currentMinute % 60;
      const blockEndMinute = currentMinute + duration;
      const endHour = Math.floor(blockEndMinute / 60);
      const endMinute = blockEndMinute % 60;

      result.push({
        duration,
        type,
        label: label || `Bloque ${index + 1}`,
        timeRange: `${formatTime(hour, minute)} - ${formatTime(endHour, endMinute)}`,
        time: formatTime(hour, minute),
        endTime: formatTime(endHour, endMinute),
        key: `custom-block-${index}-${hour}-${minute}`
      });

      currentMinute = blockEndMinute;
    });

    return result;
  };

  const handleViewPlantilla = (row) => {
    const idHorario = row.ID_HORARIO;

    // Filtrar registros por ID_HORARIO de los datos ya cargados
    const filteredRecords = records.filter(r => r.ID_HORARIO === idHorario);

    if (filteredRecords.length === 0) {
      console.warn('No se encontraron bloques para el horario:', idHorario);
      return;
    }

    // Transform to custom blocks format
    const rawBlocks = transformToCustomBlocks({ data: { records: filteredRecords } });

    // Extract hours from the first record
    const firstRecord = filteredRecords[0];
    const startTimeParts = firstRecord.HORA_INICIO_JORNADA.split(':');
    const finalTimeParts = firstRecord.HORA_FIN_JORNADA.split(':');
    const startHour = parseInt(startTimeParts[0]) + parseInt(startTimeParts[1]) / 60;
    const finalHour = parseInt(finalTimeParts[0]) + parseInt(finalTimeParts[1]) / 60;

    // Generar bloques con timeRange
    const timeBlocks = generateBlockTimeRanges(rawBlocks, startHour, finalHour);
    setCustomBlocks(timeBlocks);

    // Extraer matriz del horario (del row del nivel 1)
    let matrix = row.MATRIZ_DIAS;
    if (typeof matrix === 'string') {
      try { matrix = JSON.parse(matrix); } catch { matrix = []; }
    }
    setSelectedMatrix(Array.isArray(matrix) ? matrix : []);

    setCalendarStartHour(startHour);
    setCalendarFinalHour(finalHour);

    setShowCalendarModal(true);
  };

  const handleCloseCalendarModal = () => {
    setShowCalendarModal(false);
    setCustomBlocks(null);
    setSelectedMatrix(null);
  };

  // ==========================================
  // 5. CONFIGS PARA CrudMultiLevelManager
  // ==========================================
  const tableLevelConfigs = getTableLevelConfigs(horariosCrud, bloquesCrud, handleAddBloqueToHorario, handleViewPlantilla);

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
        createFormKey: selectedHorarioForNewBloque ?? 'free'
      },
      onCreateSuccess: () => setSelectedHorarioForNewBloque(null),
      onCreateClose: () => setSelectedHorarioForNewBloque(null)
    }
  ];

  return (
    <LayoutWithSidebar>
      <CrudMultiLevelManager
        data={records}
        loading={loading}
        error={error}
        tableLevelConfigs={tableLevelConfigs}
        headerProps={{
          ...headerProps,
          actions: getHeaderActions(horariosCrud)
        }}
        crudLevels={crudLevels}
      />

      {/* Modal para ver plantilla de horario */}
      {showCalendarModal && customBlocks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-semibold text-gray-800">Plantilla de Horario</h3>
              <button
                onClick={handleCloseCalendarModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <ScheduleTemplate
                blocks={customBlocks}
                matrix={selectedMatrix || []}
              />
            </div>
          </div>
        </div>
      )}
    </LayoutWithSidebar>
  );
}

export default HorariosBloquesConfig;
