import React from 'react';

/**
 * TableParametersExample
 * Documentación visual de TODOS los parámetros del componente Table
 * Este componente NO renderiza Table, solo muestra la documentación de uso
 */
function TableParametersExample({ records }) {
  return (
    <div className="mt-8 space-y-6">
      {/* ============================================ */}
      {/* PROPS REQUERIDAS */}
      {/* ============================================ */}
      <div className="p-6 bg-red-50 rounded-lg border-l-4 border-red-500">
        <h2 className="text-xl font-bold mb-4 text-red-800">📋 Props REQUERIDAS</h2>
        
        {/* 1. HEADERS */}
        <div className="mb-6">
          <h3 className="font-bold text-lg text-red-700 mb-2">1. headers (Array)</h3>
          <p className="text-sm text-gray-700 mb-2">Define las columnas de la tabla</p>
          
          <div className="bg-white p-3 rounded mb-2">
            <p className="text-xs font-semibold text-gray-500 mb-1">Opción A: Array de strings</p>
            <pre className="text-sm bg-gray-100 p-2 rounded">
              headers = ['id', 'name', 'email', 'age']
            </pre>
          </div>
          
          <div className="bg-white p-3 rounded">
            <p className="text-xs font-semibold text-gray-500 mb-1">Opción B: Array de objetos con tipo (recomendado)</p>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
{`headers = [
  { title: 'id', type: 'number' },
  { title: 'name', type: 'string' },
  { title: 'email', type: 'string' },
  { title: 'active', type: 'boolean' },
  { title: 'joinDate', type: 'date' }
]
// Tipos: 'string' | 'number' | 'boolean' | 'date'`}
            </pre>
          </div>
        </div>

        {/* 2. DATA */}
        <div className="mb-6">
          <h3 className="font-bold text-lg text-red-700 mb-2">2. data (Array)</h3>
          <p className="text-sm text-gray-700 mb-2">Los datos a mostrar (array de objetos planos)</p>
          <pre className="text-sm bg-white p-3 rounded overflow-auto">
{`data = [
  { id: 1, name: 'Juan', email: 'juan@test.com', age: 25 },
  { id: 2, name: 'María', email: 'maria@test.com', age: 30 }
]`}
          </pre>
        </div>

        {/* 3. ACTIONS */}
        <div>
          <h3 className="font-bold text-lg text-red-700 mb-2">3. actions (Object)</h3>
          <p className="text-sm text-gray-700 mb-2">Configuración de acciones CRUD</p>
          
          <div className="space-y-3">
            {/* CREATE */}
            <div className="bg-white p-3 rounded">
              <p className="font-semibold text-green-700 mb-1">actions.create → Botón superior</p>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
{`{
  enabled: true,              // boolean
  label: 'Nuevo',            // string
  icon: 'plus',              // 'plus' | 'edit' | 'trash' | 'eye'
  className: 'bg-green-600 text-white',
  onClick: () => { }         // void - SIN parámetros
}`}
              </pre>
            </div>

            {/* EDIT */}
            <div className="bg-white p-3 rounded">
              <p className="font-semibold text-blue-700 mb-1">actions.edit → Acción de fila</p>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
{`{
  enabled: true,
  label: 'Editar',
  icon: 'edit',
  className: 'text-blue-600 hover:bg-blue-100',
  onClick: (row, rowIndex) => { }  // Recibe: (fila, índice)
}`}
              </pre>
            </div>

            {/* DELETE */}
            <div className="bg-white p-3 rounded">
              <p className="font-semibold text-red-700 mb-1">actions.delete → Acción de fila</p>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
{`{
  enabled: true,
  label: 'Eliminar',
  icon: 'trash',
  className: 'text-red-600 hover:bg-red-100',
  onClick: (row, rowIndex) => { }  // Recibe: (fila, índice)
}`}
              </pre>
            </div>

            {/* CUSTOM */}
            <div className="bg-white p-3 rounded">
              <p className="font-semibold text-purple-700 mb-1">actions.custom → Array de acciones personalizadas</p>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
{`[
  {
    icon: 'eye',
    label: 'Ver detalles',
    className: 'text-gray-600',
    onClick: (row, rowIndex) => { }  // Recibe: (fila, índice)
  }
]`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* PROPS OPCIONALES */}
      {/* ============================================ */}
      <div className="p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
        <h2 className="text-xl font-bold mb-4 text-blue-800">⚙️ Props OPCIONALES</h2>

        {/* Visual y Funcionalidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-3 rounded">
            <h3 className="font-bold text-blue-700 mb-2">🎨 Visual</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded">
{`showCount={true}      // Numeración #
emptyMessage="..."    // Mensaje vacío
striped={true}        // Filas alternadas
hover={true}          // Hover en filas
bordered={true}       // Bordes`}
            </pre>
          </div>

          <div className="bg-white p-3 rounded">
            <h3 className="font-bold text-blue-700 mb-2">⚡ Funcionalidades</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded">
{`sortable={true}      // Ordenamiento
filterable={true}     // Filtros columna
selectable={true}     // Selección checkbox
expandable={true}     // Filas expandibles
pagination={true}     // Paginación`}
            </pre>
          </div>
        </div>

        {/* Callbacks */}
        <div className="bg-white p-3 rounded mb-4">
          <h3 className="font-bold text-blue-700 mb-2">🔄 Callbacks</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded">
{`onRowClick={(row, index) => { }}     // Click en fila
onSort={({ key, type }) => { }}       // Al ordenar
onSelect={(selectedRows) => { }}      // Al seleccionar
onPageChange={(page) => { }}          // Cambio página
onGetSelects={(values) => { }}        // Obtener seleccionados`}
          </pre>
        </div>

        {/* Otros */}
        <div className="bg-white p-3 rounded">
          <h3 className="font-bold text-blue-700 mb-2">🔧 Otros</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded">
{`loading={true}                    // Spinner carga
fit={true}                        // Ajustar ancho
boundColumn="id"                  // Columna identificador
itemsPerPage={10}                 // Items por página
className="shadow-lg"             // Clases CSS tabla
headerClassName="bg-gray-100"     // Clases CSS headers
rowClassName="hover:bg-gray-50"   // Clases CSS filas
cellClassName="py-2"              // Clases CSS celdas`}
          </pre>
        </div>
      </div>

      {/* ============================================ */}
      {/* EJEMPLO COMPLETO */}
      {/* ============================================ */}
      <div className="p-6 bg-green-50 rounded-lg border-l-4 border-green-500">
        <h2 className="text-xl font-bold mb-4 text-green-800">✅ Ejemplo Completo de Uso</h2>
        <pre className="text-sm bg-gray-800 text-green-400 p-4 rounded overflow-auto">
{`<Table
  // === REQUERIDAS ===
  headers={[
    { title: 'id', type: 'number' },
    { title: 'name', type: 'string' },
    { title: 'email', type: 'string' },
    { title: 'active', type: 'boolean' }
  ]}
  data={records}
  actions={{
    create: { enabled: true, label: 'Nuevo', onClick: () => {} },
    edit: { enabled: true, onClick: (row, idx) => {} },
    delete: { enabled: true, onClick: (row, idx) => {} }
  }}
  
  // === OPCIONALES ===
  sortable={true}
  filterable={true}
  selectable={true}
  pagination={true}
  showCount={true}
  striped={true}
  loading={false}
  itemsPerPage={10}
/>`}
        </pre>
      </div>

     
    </div>
  );
}

export default TableParametersExample;
