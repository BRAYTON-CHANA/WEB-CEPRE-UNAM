import React, { useState, useMemo } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/shared/components/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import { tableConfig, getTableLevelConfigs } from '@/features/configuracion/postulantes/config/tableConfig';
import { postulanteFormFields, postulanteValidation, postulanteModalConfig } from '@/features/configuracion/postulantes/config/formConfig';
import CsvImportModal from '@/features/configuracion/postulantes/components/CsvImportModal';

/**
 * Postulantes — CRUD 3 niveles con selector de período
 * Selector: Período (antes de cargar datos)
 * Nivel 1: Sede
 * Nivel 2: Grupo (con conteo de postulantes + botón "Añadir Postulante")
 * Nivel 3: Postulante (CRUD completo)
 */
function PostulantesConfig() {
  // ==========================================
  // 0. CSV IMPORT MODAL
  // ==========================================
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  
  const handleImportSuccess = () => {
    refresh();
  };

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
  // 2. DATOS DE GRUPOS/POSTULANTES (filtrados por período)
  // VW_GRUPOS_POSTULANTES para lectura (muestra grupos + postulantes)
  // ==========================================
  const { records, loading, error, refresh } = useTableData(
    selectedPeriodo ? tableConfig.tableName : null,
    filters
  );

  // Datos de postulantes para edición (para prellenar el formulario)
  const getPostulanteById = (idPostulante) => {
    return records?.find(r => r.ID_POSTULANTE === idPostulante) || null;
  };

  // ==========================================
  // 3. CRUD HOOKS PARA POSTULANTES
  // Usa VW_POSTULANTE para insert/update/delete
  // ==========================================
  const postulantesCrud = useCrudForms({
    tableName: 'VW_POSTULANTE',
    primaryKey: 'ID_POSTULANTE',
    onRefresh: refresh
  });

  // ==========================================
  // 4. ESTADOS PARA CREAR POSTULANTE DESDE GRUPO (Nivel 2)
  // ==========================================
  const [selectedGrupoId, setSelectedGrupoId] = useState(null);
  const [selectedSedeId, setSelectedSedeId] = useState(null);

  const handleAddPostulante = (row) => {
    setSelectedGrupoId(row.ID_GRUPO);
    setSelectedSedeId(row.ID_SEDE);
    postulantesCrud.handleCreate();
  };

  const handleCreateClose = () => {
    setSelectedGrupoId(null);
    setSelectedSedeId(null);
    postulantesCrud.handleCloseCreate();
  };

  // ==========================================
  // 5. FORMULARIO DINÁMICO (prellena Periodo, Sede y Grupo)
  // ==========================================
  const dynamicPostulanteFields = useMemo(() => {
    const isCreatingFromGrupo = selectedPeriodo !== '' && selectedSedeId !== null;
    return postulanteFormFields.map((field) => {
      if (isCreatingFromGrupo && field.name === 'ID_PERIODO') {
        return {
          ...field,
          defaultValue: selectedPeriodo,
          disabled: true
        };
      }
      if (isCreatingFromGrupo && field.name === 'ID_SEDE') {
        return {
          ...field,
          defaultValue: selectedSedeId,
          disabled: true
        };
      }
      if (isCreatingFromGrupo && field.name === 'ID_GRUPO') {
        return {
          ...field,
          defaultValue: selectedGrupoId || '',
          disabled: true  // Bloqueado al crear desde grupo
        };
      }
      // Si está editando, usar el valor del registro seleccionado
      if (postulantesCrud.selectedRow && !isCreatingFromGrupo) {
        const row = postulantesCrud.selectedRow;
        if (field.name === 'NOMBRES') {
          return { ...field, defaultValue: row.NOMBRES || '' };
        }
        if (field.name === 'APELLIDOS') {
          return { ...field, defaultValue: row.APELLIDOS || '' };
        }
        if (field.name === 'ID_GRUPO') {
          return { ...field, defaultValue: row.ID_GRUPO || '' };
        }
        if (field.name === 'ID_CARRERA') {
          return { ...field, defaultValue: row.ID_CARRERA || '' };
        }
        if (field.name === 'ACTIVO') {
          return { ...field, defaultValue: row.POSTULANTE_ACTIVO !== false };
        }
      }
      return field;
    });
  }, [selectedPeriodo, selectedSedeId, selectedGrupoId]);

  // ==========================================
  // 6. CONFIGS PARA CrudMultiLevelManager
  // ==========================================
  const tableLevelConfigs = getTableLevelConfigs(postulantesCrud, handleAddPostulante);

  const crudLevels = [
    {
      crud: postulantesCrud,
      tableName: 'VW_POSTULANTE',
      primaryKey: 'ID_POSTULANTE',
      formFields: dynamicPostulanteFields,
      formLayout: null,
      validation: postulanteValidation,
      confirmSubmit: true,
      modalConfig: postulanteModalConfig,
      onCreateClose: handleCreateClose
    }
  ];

  return (
    <LayoutWithSidebar>
      <div className="px-4 py-6 space-y-6">
        {/* Título - siempre visible */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Postulantes</h1>
          <p className="text-sm text-gray-600 mt-1">
            Seleccione un período para ver las sedes, grupos y sus postulantes
          </p>
        </div>

        {/* Selector de Período + Import CSV */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-4">
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
            <div className="pt-6">
              <button
                onClick={() => setCsvModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <span>Importar CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal CSV Import */}
        <CsvImportModal
          isOpen={csvModalOpen}
          onClose={() => setCsvModalOpen(false)}
          onSuccess={handleImportSuccess}
        />

        {/* Tabla o mensaje de selección */}
        {selectedPeriodo ? (
          <CrudMultiLevelManager
            data={records}
            loading={loading}
            error={error}
            tableLevelConfigs={tableLevelConfigs}
            headerProps={{
              title: null,
              actions: []
            }}
            crudLevels={crudLevels}
          />
        ) : (
          <div className="p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="mt-3 text-gray-500 font-medium">Seleccione un período</p>
            <p className="mt-1 text-sm text-gray-400">Elija un período académico para ver las sedes, grupos y sus postulantes.</p>
          </div>
        )}
      </div>
    </LayoutWithSidebar>
  );
}

export default PostulantesConfig;
