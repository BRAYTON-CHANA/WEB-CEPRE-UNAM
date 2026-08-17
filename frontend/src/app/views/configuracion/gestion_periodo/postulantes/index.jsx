import React from 'react';
import { CrudMultiLevelManager } from '@/shared/components/crud';
import { ConfigLayout } from '@/features/layout';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import CsvImportModal from '@/features/configuracion/postulantes/components/CsvImportModal';
import { exportPostulantes } from '@/features/configuracion/postulantes/utils/exportPostulantes';
import { usePostulantes } from '@/features/configuracion/postulantes/hooks/usePostulantes';

/**
 * Postulantes — CRUD 3 niveles con selector de período + CSV import.
 * Nivel 1: Sede → Nivel 2: Grupo → Nivel 3: Postulante (CRUD)
 */
function PostulantesConfig() {
  const {
    csvModalOpen, setCsvModalOpen, handleImportSuccess,
    selectedPeriodo, handlePeriodoChange,
    records, loading, error,
    tableLevelConfigs, crudLevels
  } = usePostulantes();

  return (
    <ConfigLayout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Postulantes</h1>
          <p className="text-sm text-gray-600 mt-1">Seleccione un período para ver las sedes, grupos y sus postulantes</p>
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
            <div className="pt-6 flex items-center gap-2">
              <button
                onClick={() => setCsvModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <span>Importar CSV</span>
              </button>
              {selectedPeriodo && (
                <button
                  onClick={() => exportPostulantes(records, selectedPeriodo)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span>Exportar Excel</span>
                </button>
              )}
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
            headerProps={{ title: null, actions: [] }}
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
    </ConfigLayout>
  );
}

export default PostulantesConfig;
