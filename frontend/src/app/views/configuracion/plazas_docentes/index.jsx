import React, { useState, useMemo } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import Table from '@/features/table/views/Table';
import { Modal } from '@/features/modal';
import { tableConfig, getTableLevelConfigs } from './config/tableConfig';
import { plazaFormFields, plazaMultiStep, plazaValidation, plazaModalConfig } from './config/formConfig';
import { headerProps, getHeaderActions } from './config/headerConfig';
import { useExportDetallePlazas } from './hooks/useExportDetallePlazas';

/**
 * Plazas Docentes — CRUD 2 niveles con selector de período
 * Selector: Período (antes de cargar datos)
 * Nivel 1: Sede (visualización + botón "Añadir Plaza")
 * Nivel 2: Plaza Docente (CRUD completo)
 */
function PlazasDocentesConfig() {
  // ==========================================
  // 1. SELECTOR DE PERÍODO
  // ==========================================
  const [selectedPeriodo, setSelectedPeriodo] = useState('');

  const handlePeriodoChange = (_, value) => {
    setSelectedPeriodo(value);
  };

  const filters = useMemo(() => {
    return selectedPeriodo ? { ID_PERIODO: selectedPeriodo } : {};
  }, [selectedPeriodo]);

  // ==========================================
  // 2. DATOS (filtrados por período)
  // ==========================================
  const { records, loading, error, refresh } = useTableData(
    selectedPeriodo ? tableConfig.tableName : null,
    filters
  );

  // ==========================================
  // 3. CRUD HOOKS
  // ==========================================
  const plazasCrud = useCrudForms({
    tableName: 'PLAZA_DOCENTE',
    primaryKey: 'ID_PLAZA_DOCENTE',
    onRefresh: refresh
  });

  // ==========================================
  // 4. ESTADOS PARA CREAR PLAZA DESDE SEDE
  // ==========================================
  const [selectedSedeId, setSelectedSedeId] = useState(null);

  const handleAddPlaza = (row) => {
    setSelectedSedeId(row.ID_SEDE);
    plazasCrud.handleCreate();
  };

  const handleCreateClose = () => {
    setSelectedSedeId(null);
    plazasCrud.handleCloseCreate();
  };

  // ==========================================
  // 5. MODAL VER DETALLES DE PLAZAS
  // ==========================================
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [detalleSede, setDetalleSede] = useState(null);

  const handleVerDetalles = (row) => {
    setDetalleSede(row);
    setDetalleModalOpen(true);
  };

  const handleCloseDetalles = () => {
    setDetalleModalOpen(false);
    setDetalleSede(null);
  };

  // Cargar plazas del período y sede seleccionados
  const detalleFilters = useMemo(() => {
    if (!detalleSede || !selectedPeriodo) return {};
    return { 
      ID_PERIODO: selectedPeriodo,
      ID_SEDE: detalleSede.ID_SEDE 
    };
  }, [detalleSede, selectedPeriodo]);

  const { 
    records: plazasDetalle, 
    loading: detalleLoading 
  } = useTableData(
    detalleModalOpen ? 'VW_PLAZAS_DOCENTES_CON_GRUPOS' : null,
    detalleFilters
  );

  const { exportingDetalle, handleExportExcel, handleExportPdf } = useExportDetallePlazas({
    plazasDetalle,
    detalleSede
  });

  // ==========================================
  // 5. FORMULARIO DINÁMICO (prellena Periodo y Sede)
  // ==========================================
  const dynamicPlazaFields = useMemo(() => {
    const isCreatingFromSede = selectedPeriodo !== '' && selectedSedeId !== null;
    return plazaFormFields.map((field) => {
      if (isCreatingFromSede && field.name === 'ID_PERIODO') {
        return {
          ...field,
          defaultValue: selectedPeriodo,
          disabled: true
        };
      }
      if (isCreatingFromSede && field.name === 'ID_SEDE') {
        return {
          ...field,
          defaultValue: selectedSedeId,
          disabled: true
        };
      }
      return field;
    });
  }, [selectedPeriodo, selectedSedeId]);

  // ==========================================
  // 5. CONFIGS PARA CrudMultiLevelManager
  // ==========================================
  const tableLevelConfigs = getTableLevelConfigs(plazasCrud, handleAddPlaza, handleVerDetalles);

  const crudLevels = [
    {
      crud: plazasCrud,
      tableName: 'PLAZA_DOCENTE',
      primaryKey: 'ID_PLAZA_DOCENTE',
      formFields: dynamicPlazaFields,
      formLayout: null,
      multiStep: plazaMultiStep,
      validation: plazaValidation,
      confirmSubmit: true,
      modalConfig: plazaModalConfig,
      onCreateClose: handleCreateClose
    }
  ];

  return (
    <LayoutWithSidebar>
      <div className="px-4 py-6 space-y-6">
        {/* Título - siempre visible */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plazas Docentes</h1>
          <p className="text-sm text-gray-600 mt-1">
            Seleccione un período para ver las plazas docentes
          </p>
        </div>

        {/* Selector de Período */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex-1 max-w-md">
            <ReferenceSelectInput
              name="id_periodo"
              label="Período Académico"
              referenceTable="PERIODOS"
              referenceField="ID_PERIODO"
              referenceLabelField="NOMBRE_PERIODO"
              placeholder="Seleccione un período..."
              searchable={true}
              value={selectedPeriodo}
              onChange={handlePeriodoChange}
              formData={{}}
            />
          </div>
        </div>

        {/* Tabla o mensaje de selección */}
        {selectedPeriodo ? (
          <CrudMultiLevelManager
            data={records}
            loading={loading}
            error={error}
            tableLevelConfigs={tableLevelConfigs}
            headerProps={{
              headerTitle: null,
              actions: getHeaderActions()
            }}
            crudLevels={crudLevels}
          />
        ) : (
          <div className="p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-3 text-gray-500 font-medium">Seleccione un período</p>
            <p className="mt-1 text-sm text-gray-400">Elija un período académico para ver las plazas docentes disponibles.</p>
          </div>
        )}

        {/* Modal Ver Detalles */}
        <Modal
          isOpen={detalleModalOpen}
          onClose={handleCloseDetalles}
          title={`Detalle de Plazas - ${detalleSede?.NOMBRE_SEDE || ''}`}
          widthClass="w-full"
          size="6xl"
        >
          <div className="p-6 space-y-4">
            {!detalleLoading && plazasDetalle?.length > 0 && (
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleExportExcel}
                  disabled={!!exportingDetalle}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                >
                  {exportingDetalle === 'excel'
                    ? <span className="animate-spin h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full inline-block" />
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                  }
                  Exportar Excel
                </button>
                <button
                  onClick={handleExportPdf}
                  disabled={!!exportingDetalle}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {exportingDetalle === 'pdf'
                    ? <span className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full inline-block" />
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  }
                  Exportar PDF
                </button>
              </div>
            )}
            {detalleLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando plazas...</span>
              </div>
            ) : (
              <Table
                headers={[
                  { title: 'IDENTIFICADOR_DOCENTE', type: 'string' },
                  { title: 'NOMBRE_DOCENTE', type: 'string' },
                  { title: 'NOMBRE_CURSO', type: 'string' },
                  { title: 'PAGO_POR_HORA', type: 'number' },
                  { title: 'GRUPOS', type: 'array' }
                ]}
                data={plazasDetalle?.map(p => ({
                  ...p,
                  GRUPOS: p.GRUPOS_NOMBRES && p.GRUPOS_NOMBRES !== 'Sin grupos asignados' 
                    ? p.GRUPOS_NOMBRES.split(', ')
                    : ['Sin grupos asignados']
                })) || []}
                emptyMessage="No hay plazas docentes en esta sede"
                striped={true}
                hover={true}
                pagination={true}
                itemsPerPage={10}
              />
            )}
          </div>
        </Modal>
      </div>
    </LayoutWithSidebar>
  );
}

export default PlazasDocentesConfig;
