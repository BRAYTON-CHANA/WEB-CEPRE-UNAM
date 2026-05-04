import React from 'react';
import { CrudTableMultiLevel } from '@/features/crud';
import TableMultiLevelRender from '@/features/table/views/TableMultiLevelRender';
import { useTableData } from '@/features/crud/hooks/useTableData';
import Layout from '@/shared/components/layout/Layout';

/**
 * Página de prueba simplificada para TableMultiLevel
 * Muestra datos en JSON para debugging y nueva tabla renderizada
 */
function TestMultiLevelTable() {
  const tableConfig = {
    tableName: 'VW_HORARIO_BLOQUES',
    levelConfigs: [
      {
        level: 1,
        field: 'NOMBRE_HORARIO',
        headers: [
          { title: 'HORA_INICIO_JORNADA', type: 'string' },
          { title: 'HORA_FIN_JORNADA', type: 'string' },
          
        ],
        boundColumn: 'ID_HORARIO',
        actions: {
          edit: {
            enabled: true,
            icon: 'edit',
            label: 'Editar',
            onClick: (row, boundValue) => {
              alert(`Edit nivel 1\nBoundColumn: ID_AREA\nBoundValue: ${boundValue}`);
            }
          },
          delete: {
            enabled: true,
            icon: 'trash',
            label: 'Eliminar',
            onClick: (row, boundValue) => {
              alert(`Delete nivel 1\nBoundColumn: ID_AREA\nBoundValue: ${boundValue}`);
            }
          },
          custom: []
        }
      },
      {
        level: 2,
        headers: [
      { title: 'ORDEN', type: 'string' },
      { title: 'DURACION', type: 'string' },
      { title: 'TIPO_BLOQUE', type: 'string' },
      { title: 'ETIQUETA', type: 'string' }
        ],
        boundColumn: 'ID_BLOQUE',
        actions: {
          edit: {
            enabled: true,
            icon: 'edit',
            label: 'Editar',
            onClick: (row, boundValue) => {
              alert(`Edit nivel 2\nBoundColumn: ID_CURSO\nBoundValue: ${boundValue}`);
            }
          },
          delete: {
            enabled: true,
            icon: 'trash',
            label: 'Eliminar',
            onClick: (row, boundValue) => {
              alert(`Delete nivel 2\nBoundColumn: ID_CURSO\nBoundValue: ${boundValue}`);
            }
          },
          custom: []
        }
      }
    ]
  };

  // Fetch data for TableMultiLevelRender
  const { records, loading, error } = useTableData(tableConfig.tableName);

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Test TableMultiLevel - JSON Output</h1>
        <CrudTableMultiLevel tableConfig={tableConfig} />
        
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">TableMultiLevelRender - Tabla Profesional</h2>
          {loading && <div className="p-4">Cargando...</div>}
          {error && <div className="p-4 text-red-600">Error: {error.message}</div>}
          {!loading && !error && (
            <TableMultiLevelRender 
              data={records} 
              levelConfigs={tableConfig.levelConfigs}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}

export default TestMultiLevelTable;
