import React, { useState } from 'react';
import { Crud } from '@/features/crud';
import Layout from '@/shared/components/layout/Layout';
import Calendar from '@/features/schedule/components/Calendar';
import { 
  tableConfig, 
  formConfig, 
  tableComponentParameters, 
  modalConfig 
} from './config/horariosConfig';
import { 
  horarioBloquesTableConfig, 
  horarioBloquesFormConfig, 
  horarioBloquesTableComponentParameters, 
  horarioBloquesModalConfig 
} from './config/horarioBloquesConfig';
import { headerProps, footerProps } from './config/headerFooterConfig';

/**
 * Configuración de VISTA_HORARIOS
 * CRUD completo para la tabla HORARIOS (plantillas de jornada)
 */
function VistaHorariosConfig() {
  const [filteredData, setFilteredData] = useState(null);
  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const [customBlocks, setCustomBlocks] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarStartHour, setCalendarStartHour] = useState(7);
  const [calendarFinalHour, setCalendarFinalHour] = useState(19);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'table'
  const [selectedIdHorario, setSelectedIdHorario] = useState(null);





  // ==========================================
  // 7. ACCIONES PERSONALIZADAS
  // ==========================================
  
  // Transform VW_HORARIO_BLOQUES response to custom blocks format
  const transformToCustomBlocks = (apiResponse) => {
    if (!apiResponse?.data?.records || !Array.isArray(apiResponse.data.records)) {
      return [];
    }

    return apiResponse.data.records
      .sort((a, b) => a.ORDEN - b.ORDEN) // Sort by ORDEN to maintain correct sequence
      .map(record => ({
        duration: record.DURACION,
        type: record.TIPO_BLOQUE,
        label: record.ETIQUETA || `Bloque ${record.ORDEN}`
      }));
  };

  const handleViewBloques = async (row) => {
    const idHorario = row.ID_HORARIO;
    setSelectedIdHorario(idHorario);
    setLoadingFiltered(true);
    try {
      const filters = JSON.stringify([{ field: 'ID_HORARIO', op: '=', value: idHorario }]);
      const response = await fetch(`http://localhost:3001/api/tables/VW_HORARIO_BLOQUES?filters=${encodeURIComponent(filters)}`);
      const data = await response.json();
      setFilteredData(data);
      
      // Transform to custom blocks format
      const transformedBlocks = transformToCustomBlocks(data);
      setCustomBlocks(transformedBlocks);
      
      // Extract hours from the first record (including minutes)
      if (data?.data?.records?.length > 0) {
        const firstRecord = data.data.records[0];
        const startTimeParts = firstRecord.HORA_INICIO_JORNADA.split(':');
        const finalTimeParts = firstRecord.HORA_FIN_JORNADA.split(':');
        const startHour = parseInt(startTimeParts[0]) + parseInt(startTimeParts[1]) / 60;
        const finalHour = parseInt(finalTimeParts[0]) + parseInt(finalTimeParts[1]) / 60;
        setCalendarStartHour(startHour);
        setCalendarFinalHour(finalHour);
        setShowCalendar(true);
        setViewMode('calendar'); // Start in calendar view
      }
      
      console.log('Filtered data:', data);
      console.log('Transformed custom blocks:', transformedBlocks);
    } catch (error) {
      console.error('Error fetching filtered data:', error);
    } finally {
      setLoadingFiltered(false);
    }
  };

  const actions = {
    custom: [
      {
        icon: 'eye',
        label: 'Ver Bloques',
        onClick: handleViewBloques
      }
    ]
  };

  // ==========================================
  // 8. CALLBACKS
  // ==========================================
  const handleSuccess = (result) => {
    console.log('Operación exitosa en HORARIOS:', result);
  };

  const handleError = (error) => {
    console.error('Error en operación HORARIOS:', error);
  };

  const handleBackToHorarios = () => {
    setShowCalendar(false);
    setSelectedIdHorario(null);
    setViewMode('calendar');
    setCustomBlocks(null);
    setFilteredData(null);
  };

  return (
    <Layout>
      {/* HORARIOS table - only show when not in calendar/table view */}
      {!showCalendar && (
        <Crud
          tableConfig={tableConfig}
          formConfig={formConfig}
          tableComponentParameters={tableComponentParameters}
          modalConfig={modalConfig}
          headerProps={headerProps}
          footerProps={footerProps}
          actions={actions}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
      
      {/* Calendar/Table view - only show when showCalendar is true */}
      {showCalendar && customBlocks && (
        <div className="space-y-8 px-4 py-6">
          {/* Back button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToHorarios}
              className="px-5 py-2.5 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a Horarios
            </button>
          </div>
          
          {/* Calendar component */}
          {viewMode === 'calendar' && (
            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Vista de Horario</h3>
                <button
                  onClick={() => setViewMode('table')}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                >
                  Ver Tabla
                </button>
              </div>
              <Calendar
                customBlocks={customBlocks}
                startHour={calendarStartHour}
                finalHour={calendarFinalHour}
                disableSelectionHighlight={true}
                initialView='week'
              />
            </div>
          )}
          
          {/* HORARIO_BLOQUES table/form view */}
          {viewMode === 'table' && (
            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Gestión de Bloques</h3>
                <button
                  onClick={() => setViewMode('calendar')}
                  className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition-colors"
                >
                  Ver Calendar
                </button>
              </div>
              <Crud
                tableConfig={horarioBloquesTableConfig}
                formConfig={horarioBloquesFormConfig(selectedIdHorario)}
                tableComponentParameters={horarioBloquesTableComponentParameters(selectedIdHorario)}
                modalConfig={horarioBloquesModalConfig}
                headerProps={{
                  headerTitle: 'Bloques del Horario',
                  headerDescription: `Gestión de bloques para el horario ID: ${selectedIdHorario}`,
                  titleClassName: '',
                  descriptionClassName: '',
                  actions: []
                }}
                footerProps={footerProps}
                actions={{}}
                onSuccess={(result) => {
                  handleSuccess(result);
                  // Refresh calendar data after CRUD operation
                  if (selectedIdHorario) {
                    handleViewBloques({ ID_HORARIO: selectedIdHorario });
                  }
                }}
                onError={handleError}
              />
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

export default VistaHorariosConfig;
