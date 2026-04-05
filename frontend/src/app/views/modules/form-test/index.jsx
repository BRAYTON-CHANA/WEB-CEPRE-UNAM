import React, { useState } from 'react';
import Layout from '@/shared/components/layout/Layout';
import { CrudForm } from '@/features/form';
import { useTableData } from '@/features/crud/hooks/useTableData';
import Table from '@/features/table/views/Table';

/**
 * Página de prueba para CrudForm
 * Demuestra formulario single-page y multi-step
 */
function FormTest() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [useMultiStep, setUseMultiStep] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mode, setMode] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const { records, loading: tableLoading, refresh } = useTableData('TABLA_CRUD_BASICO');

  // Campos del formulario con asignación a páginas/secciones
  const formFields = [
    {
      name: 'CAMPO_STRING',
      type: 'text',
      label: 'Nombre',
      placeholder: 'Ingresa tu nombre',
      required: true,
      page: 1,
      section: 1
    },
    {
      name: 'CAMPO_ENTERO',
      type: 'number',
      label: 'Edad',
      placeholder: 'Ingresa tu edad',
      required: true,
      page: 1,
      section: 1
    },
    {
      name: 'CAMPO_FECHA',
      type: 'date',
      label: 'Fecha de Nacimiento',
      placeholder: 'Selecciona fecha',
      required: true,
      page: 1,
      section: 2
    },
    {
      name: 'CAMPO_FLOAT',
      type: 'decimal',
      label: 'Salario Esperado',
      placeholder: 'Ingresa monto',
      step: '0.01',
      required: true,
      page: 2,
      section: 1
    },
    {
      name: 'CAMPO_BOOLEANO',
      type: 'boolean',
      label: '¿Tiene experiencia previa?',
      required: false,
      page: 2,
      section: 1
    },
    {
      name: 'CAMPO_TEXTO_LARGO',
      type: 'textarea',
      label: 'Experiencia Laboral',
      placeholder: 'Describe tu experiencia...',
      rows: 4,
      required: true,
      page: 2,
      section: 2
    },
    {
      name: 'CAMPO_JSON',
      type: 'textarea',
      label: 'Habilidades (JSON)',
      placeholder: '{"skills": ["JS", "React"]}',
      rows: 3,
      required: false,
      page: 3,
      section: 1
    }
  ];

  // Layout multi-step
  const multiStepLayout = {
    type: 'multistep',
    pages: [
      {
        id: 'page-1',
        title: 'Información Personal',
        description: 'Ingresa tus datos básicos',
        sections: [
          { id: 'section-1', title: 'Datos Principales',description:'Escriba sus datos' },
          { id: 'section-2', title: 'Información Adicional' }
        ]
      },
      {
        id: 'page-2',
        title: 'Información Laboral',
        description: 'Cuéntanos sobre tu experiencia',
        sections: [
          { id: 'section-1', title: 'Datos Laborales' },
          { id: 'section-2', title: 'Experiencia' }
        ]
      },
      {
        id: 'page-3',
        title: 'Habilidades',
        description: 'Información complementaria',
        sections: [
          { id: 'section-1', title: 'Habilidades Técnicas' }
        ]
      }
    ]
  };

  const validationRules = {
    CAMPO_STRING: { required: true, minLength: 3 },
    CAMPO_ENTERO: { required: true },
    CAMPO_FECHA: { required: true },
    CAMPO_FLOAT: { required: true },
    CAMPO_TEXTO_LARGO: { required: true, minLength: 10 },
    CAMPO_JSON: { required: false }
  };

  const handleSuccess = (data) => {
    console.log('✅ Éxito:', data);
    setResult({ type: 'success', data });
    setError(null);
  };

  const handleError = (err) => {
    console.error('❌ Error:', err);
    setError(err.message);
  };

  const handleFieldMismatch = (mismatches) => {
    setError(`Campos inválidos: ${mismatches.map(e => e.field).join(', ')}`);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCurrentPage(1);
    setSelectedRecord(null);
  };

  const handleEditClick = (record) => {
    setSelectedRecord(record);
    setMode('edit');
    setError(null);
    setResult(null);
  };

  const handleCancelEdit = () => {
    setSelectedRecord(null);
    setMode('create');
    setError(null);
    setResult(null);
  };

  const handlePageChange = (pageNumber) => {
    console.log('Página cambiada a:', pageNumber);
    setCurrentPage(pageNumber);
  };

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="text-2xl font-bold mb-6">📝 CrudForm Test</h1>

        {/* Toggle para cambiar entre modos: Crear / Editar */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">Modo:</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMode('create');
                  setSelectedRecord(null);
                }}
                className={`px-4 py-2 rounded ${
                  mode === 'create'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border'
                }`}
              >
                Crear Nuevo
              </button>
              <button
                onClick={() => {
                  setMode('edit');
                  setSelectedRecord(null);
                }}
                className={`px-4 py-2 rounded ${
                  mode === 'edit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border'
                }`}
              >
                Editar Existente
              </button>
            </div>
          </div>
        </div>

        {/* Config */}
        <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
          <strong>Config:</strong> tableName="TABLA_CRUD_BASICO" | mode="{mode}" | primaryKey="ID"
          {mode === 'edit' && selectedRecord && (
            <span className="ml-2 text-blue-600">| Editando ID: {selectedRecord.ID}</span>
          )}
          {useMultiStep && mode === 'create' && (
            <span className="ml-2 text-blue-600">| Multi-Step Activado</span>
          )}
        </div>

        {/* Success */}
        {result && (
          <div className="mb-4 p-4 bg-green-50 rounded">
            <p className="text-green-700">✅ Registro guardado</p>
            <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
            <button onClick={handleReset} className="mt-2 text-sm text-green-700 underline">Nuevo</button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded">
            <p className="text-red-700">❌ {error}</p>
            <button onClick={handleReset} className="mt-2 text-sm text-red-700 underline">Limpiar</button>
          </div>
        )}

        {/* ===== MODO CREAR ===== */}
        {mode === 'create' && !result && (
          <div className="bg-white p-6 rounded shadow">
            {/* Toggle single/multi-step solo en modo crear */}
            <div className="mb-6 p-3 bg-gray-50 rounded">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tipo de Formulario:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUseMultiStep(false)}
                    className={`px-3 py-1 text-sm rounded ${
                      !useMultiStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border'
                    }`}
                  >
                    Single Page
                  </button>
                  <button
                    onClick={() => setUseMultiStep(true)}
                    className={`px-3 py-1 text-sm rounded ${
                      useMultiStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border'
                    }`}
                  >
                    Multi-Step
                  </button>
                </div>
              </div>
              {useMultiStep && (
                <p className="text-xs text-gray-600 mt-2">
                  Página actual: {currentPage} de 3
                </p>
              )}
            </div>

            <CrudForm
              tableName="TABLA_CRUD_BASICO"
              mode="create"
              primaryKey="ID"
              fields={formFields}
              validation={validationRules}
              onSuccess={handleSuccess}
              onError={handleError}
              onFieldMismatch={handleFieldMismatch}
              submitText="Guardar"
              
              layout={useMultiStep ? multiStepLayout : null}
              multiStep={useMultiStep ? {
                showDots: true,
                persistData: false,
                nextText: 'Siguiente',
                prevText: 'Atrás',
                submitText: 'Confirmar'
              } : null}
              onPageChange={useMultiStep ? handlePageChange : null}
            />
          </div>
        )}

        {/* ===== MODO EDITAR - TABLA DE REGISTROS ===== */}
        {mode === 'edit' && !selectedRecord && (
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-semibold mb-4">Selecciona un registro para editar</h3>
            {tableLoading ? (
              <div className="p-4 text-center text-gray-600">Cargando registros...</div>
            ) : records.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No hay registros disponibles</div>
            ) : (
              <Table
                headers={[
                  { title: 'ID', type: 'integer' },
                  { title: 'CAMPO_STRING', type: 'text' },
                  { title: 'CAMPO_ENTERO', type: 'integer' },
                  { title: 'CAMPO_FECHA', type: 'date' }
                ]}
                data={records}
                actions={{
                  custom: [
                    {
                      enabled: true,
                      icon: 'edit',
                      label: 'Seleccionar para edición',
                      className: 'bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700',
                      onClick: (row, rowIndex) => handleEditClick(row)
                    }
                  ]
                }}
                hover
                bordered
              />
            )}
          </div>
        )}

        {/* ===== MODO EDITAR - FORMULARIO ===== */}
        {mode === 'edit' && selectedRecord && (
          <div className="bg-white p-6 rounded shadow">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Editando Registro #{selectedRecord.ID}</h3>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                ← Volver a la tabla
              </button>
            </div>

            <CrudForm
              tableName="TABLA_CRUD_BASICO"
              mode="edit"
              recordId={selectedRecord.ID}
              primaryKey="ID"
              fields={formFields}
              validation={validationRules}
              onSuccess={handleSuccess}
              onError={handleError}
              onFieldMismatch={handleFieldMismatch}
              submitText="Actualizar"
            />
          </div>
        )}
      </div>
    </Layout>
  );
}

export default FormTest;
