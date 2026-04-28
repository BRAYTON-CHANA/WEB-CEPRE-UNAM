import React from 'react';
import Layout from '@/shared/components/layout/Layout';
import { Table } from '@/features/table';

/**
 * Módulo de prueba para el componente Table
 * Permite probar diferentes configuraciones y funcionalidades
 */
function TestTable() {
  // Datos de prueba con diferentes tipos
  const testData = [
    { 
      id: 1, 
      name: 'Juan Pérez', 
      age: 25, 
      active: true, 
      salary: 50000.50, 
      joinDate: '2023-01-15',
      department: 'Ventas',
      email: 'juan@empresa.com'
    },
    { 
      id: 2, 
      name: 'María García', 
      age: 30, 
      active: false, 
      salary: 60000.00, 
      joinDate: '2022-06-20',
      department: 'Marketing',
      email: 'maria@empresa.com'
    },
    { 
      id: 3, 
      name: 'Carlos López', 
      age: 28, 
      active: true, 
      salary: 55000.75, 
      joinDate: '2023-03-10',
      department: 'TI',
      email: 'carlos@empresa.com'
    },
    { 
      id: 4, 
      name: 'Ana Martínez', 
      age: 35, 
      active: true, 
      salary: 75000.00, 
      joinDate: '2021-09-05',
      department: 'Recursos Humanos',
      email: 'ana@empresa.com'
    },
    { 
      id: 5, 
      name: 'Luis Rodríguez', 
      age: 42, 
      active: false, 
      salary: 85000.25, 
      joinDate: '2020-12-01',
      department: 'Finanzas',
      email: 'luis@empresa.com'
    },
    { 
      id: 6, 
      name: 'Sofía Hernández', 
      age: 26, 
      active: true, 
      salary: 48000.00, 
      joinDate: '2023-07-22',
      department: 'Ventas',
      email: 'sofia@empresa.com'
    },
    { 
      id: 7, 
      name: 'Miguel Sánchez', 
      age: 31, 
      active: true, 
      salary: 62000.50, 
      joinDate: '2022-11-30',
      department: 'TI',
      email: 'miguel@empresa.com'
    },
    { 
      id: 8, 
      name: 'Laura Díaz', 
      age: 29, 
      active: true, 
      salary: 58000.00, 
      joinDate: '2023-02-14',
      department: 'Marketing',
      email: 'laura@empresa.com'
    }
  ];

  // Headers con tipos específicos para probar detección
  const testHeaders = [
    { title: 'name', type: 'string' },
    { title: 'age', type: 'number' },
    { title: 'active', type: 'boolean' },
    { title: 'salary', type: 'number' },
    { title: 'joinDate', type: 'date' },
    { title: 'department', type: 'string' },
    { title: 'email', type: 'string' }
  ];

  // Acciones de prueba
  const testActions = {
    create: {
      enabled: true,
      label: 'Nuevo Empleado',
      icon: 'plus',
      className: 'bg-green-600 text-white hover:bg-green-700',
      onClick: () => {
        console.log('Crear nuevo empleado');
        alert('Función de crear empleado (prueba)');
      }
    },
    edit: {
      enabled: true,
      label: 'Editar',
      icon: 'edit',
      className: 'text-blue-600 hover:bg-blue-100',
      onClick: (row, index) => {
        console.log('Editar empleado:', row, 'índice:', index);
        alert(`Editar empleado: ${row.name}`);
      }
    },
    delete: {
      enabled: true,
      label: 'Eliminar',
      icon: 'trash',
      className: 'text-red-600 hover:bg-red-100',
      onClick: (row, index) => {
        console.log('Eliminar empleado:', row, 'índice:', index);
        if (confirm(`¿Eliminar a ${row.name}?`)) {
          alert(`Empleado ${row.name} eliminado (prueba)`);
        }
      }
    },
    custom: [
      {
        icon: 'eye',
        label: 'Ver detalles',
        className: 'text-gray-600 hover:bg-gray-100',
        onClick: (row, index) => {
          console.log('Ver detalles:', row);
          alert(`Detalles de ${row.name}:\n\nEdad: ${row.age}\nDepartamento: ${row.department}\nSalario: $${row.salary}\nEmail: ${row.email}`);
        }
      },
      {
        icon: 'mail',
        label: 'Enviar email',
        className: 'text-purple-600 hover:bg-purple-100',
        onClick: (row, index) => {
          console.log('Enviar email a:', row);
          alert(`Enviar email a ${row.name} (${row.email})`);
        }
      },
      {
        icon: 'download',
        label: 'Descargar reporte',
        className: 'text-orange-600 hover:bg-orange-100',
        onClick: (row, index) => {
          console.log('Descargar reporte de:', row);
          alert(`Generando reporte de ${row.name}...\n\nReporte descargado: ${row.name.replace(/\s+/g, '_')}_reporte.pdf`);
        }
      }
    ]
  };

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <h1 className="text-3xl font-bold mb-6">🧪 Test Table Component</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">📋 Funcionalidades a probar:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>✅ Headers con tipos (string, number, boolean, date)</li>
            <li>✅ Ordenamiento por tipo (alfabético, numérico, booleano, fecha)</li>
            <li>✅ Filtrado contextual por columna</li>
            <li>✅ Selección múltiple de filas</li>
            <li>✅ Paginación configurable</li>
            <li>✅ Acciones CRUD personalizadas</li>
            <li>✅ Acciones custom por fila (Ver, Email, Descargar)</li>
            <li>✅ Variants visuales (striped, hover, bordered)</li>
          </ul>
        </div>

        <Table
          // Configuración básica
          headers={testHeaders}
          data={testData}
          actions={testActions}
          
          // Configuración visual
          showCount={true}
          emptyMessage="No hay datos de prueba disponibles"
          variant="default"
          striped={true}
          hover={true}
          bordered={true}
          
          // Funcionalidades activadas
          sortable={true}
          selectable={true}
          expandable={false}
          filterable={true}
          pagination={true}
          
          // Configuración adicional
          fit={false}
          itemsPerPage={5}
          className="shadow-lg"
        />

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🔍 Observaciones:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Los headers incluyen tipos para probar ordenamiento específico</li>
            <li>Los datos incluyen diferentes tipos para validar detección</li>
            <li>Las acciones permiten probar interacciones CRUD</li>
            <li>El filtrado debería funcionar contextualmente</li>
            <li>Revisa la consola para ver logs de detección de tipos</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

export default TestTable;
