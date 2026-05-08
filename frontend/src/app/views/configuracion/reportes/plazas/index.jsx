import React, { useState, useMemo } from 'react';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import TableMultiLevelRender from '@/features/table/views/TableMultiLevelRender';
import { useTableData } from '@/features/crud/hooks/useTableData';
import { exportPlazaToExcel } from './utils/exportPlazaToExcel';

const levelConfigs = [
  {
    level: 1,
    headers: [
      { title: 'NOMBRE_SEDE', type: 'string' }
    ],
    boundColumn: 'ID_SEDE'
  },
  {
    level: 2,
    headers: [
      { title: 'IDENTIFICADOR_DOCENTE', type: 'string' },
      { title: 'PAGO_POR_HORA', type: 'number' }
    ],
    boundColumn: 'ID_PLAZA_DOCENTE',
    actions: {
      exportExcel: {
        enabled: true,
        icon: 'download',
        label: 'Exportar Excel',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => {
          exportPlazaToExcel(row.ID_PLAZA_DOCENTE, row.IDENTIFICADOR_DOCENTE);
        }
      }
    }
  }
];

function ReportesPlazas() {
  const [selectedPeriodo, setSelectedPeriodo] = useState('');

  const filters = useMemo(() => {
    return selectedPeriodo ? { ID_PERIODO: selectedPeriodo } : {};
  }, [selectedPeriodo]);

  const { records, loading, error } = useTableData(
    selectedPeriodo ? 'VW_PERIODOS_SEDES_PLAZAS' : null,
    filters
  );

  const handlePeriodoChange = (_, value) => {
    setSelectedPeriodo(value);
  };

  return (
    <LayoutWithSidebar>
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Plazas Docentes</h1>
            <p className="text-sm text-gray-600 mt-1">
              Seleccione un período para ver las plazas docentes asignadas
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="w-full max-w-md">
            <ReferenceSelectInput
              name="id_periodo"
              label="Período Académico"
              referenceTable="PERIODOS"
              referenceField="ID_PERIODO"
              referenceLabelField="NOMBRE_PERIODO"
              referenceFilters={[{ field: 'ACTIVO', op: '=', value: true }]}
              placeholder="Seleccione un período..."
              searchable={true}
              value={selectedPeriodo}
              onChange={handlePeriodoChange}
              formData={{}}
            />
          </div>
        </div>

        {!selectedPeriodo && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-4 text-gray-500 font-medium">Seleccione un período</p>
            <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
              Elija un período académico para cargar y visualizar las plazas docentes.
            </p>
          </div>
        )}

        {selectedPeriodo && loading && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">Cargando plazas...</p>
          </div>
        )}

        {selectedPeriodo && error && (
          <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-red-800 font-medium">Error al cargar datos</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {selectedPeriodo && !loading && !error && records && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">
                Plazas Docentes del Período
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Total: {records.length} plaza{records.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="overflow-x-auto">
              <TableMultiLevelRender
                data={records}
                levelConfigs={levelConfigs}
              />
            </div>
          </div>
        )}
      </div>
    </LayoutWithSidebar>
  );
}

export default ReportesPlazas;
