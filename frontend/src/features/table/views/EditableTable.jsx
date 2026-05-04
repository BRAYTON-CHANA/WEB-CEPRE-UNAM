import React from 'react';
import { useEditableTable } from '../hooks/useEditableTable';
import EditableCell from '../components/EditableCell';
import { Modal } from '@/features/modal';

/**
 * EditableTable — Tabla con edición inline batch
 *
 * @param {Array}    data            - Registros a mostrar (de useTableData o similar)
 * @param {Array}    columns         - Config de columnas:
 *   {
 *     field: 'ID_CAMPO',        // campo en el registro
 *     title: 'Título',          // cabecera
 *     editable: true,           // si permite edición
 *     type: 'text' | 'number' | 'boolean' | 'reference-select' | 'function-select',
 *     // Para reference-select:
 *     referenceTable, referenceField, referenceQuery, referenceFilters,
 *     // Para function-select:
 *     functionName, functionParams, optionalParams, valueField, labelField, descriptionField, statusField,
 *     // Condicional:
 *     blocked: { and: [{field, op, value}] },
 *     placeholder, searchable
 *   }
 * @param {string}   tableName       - Tabla real destino del updateBatch
 * @param {string}   primaryKey      - Campo PK de cada fila
 * @param {boolean}  loading         - Estado de carga
 * @param {Function} onRefresh       - Callback para recargar datos tras guardar
 * @param {string}   [headerTitle]   - Título opcional en la barra superior
 * @param {string}   [headerDescription] - Descripción opcional
 * @param {string}   [emptyMessage]  - Mensaje cuando no hay datos
 */
const EditableTable = ({
  data = [],
  columns = [],
  tableName,
  primaryKey,
  loading = false,
  onRefresh,
  headerTitle,
  headerDescription,
  emptyMessage = 'No hay datos para mostrar.'
}) => {
  const {
    isDirty,
    isSaving,
    dirtyCount,
    notification,
    getCellValue,
    getMergedRow,
    handleCellChange,
    cancelAll,
    saveAll,
    closeNotification
  } = useEditableTable({ data, primaryKey, tableName, onRefresh });

  return (
    <div className="flex flex-col h-full">
      {/* Header opcional */}
      {(headerTitle || headerDescription) && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            {headerTitle && (
              <h2 className="text-base font-semibold text-gray-900">{headerTitle}</h2>
            )}
            {headerDescription && (
              <p className="text-sm text-gray-500 mt-0.5">{headerDescription}</p>
            )}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mr-3" />
            <span className="text-gray-500 text-sm">Cargando datos...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50/80">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.field}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    <span>{col.title}</span>
                    {col.editable && (
                      <span className="ml-1 text-blue-300 font-normal normal-case tracking-normal text-[10px]">editable</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {data.map((row) => {
                const rowId = row[primaryKey];
                const mergedRow = getMergedRow(row);

                return (
                  <tr
                    key={rowId}
                    className="hover:bg-slate-50/60 transition-colors duration-100"
                  >
                    {columns.map(col => (
                      <EditableCell
                        key={col.field}
                        column={col}
                        value={getCellValue(row, col.field)}
                        rowData={mergedRow}
                        rowId={rowId}
                        onCellChange={handleCellChange}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Barra de guardado — aparece solo si hay cambios */}
      {isDirty && (
        <div className="sticky bottom-0 z-10 border-t border-blue-100 bg-blue-50 px-5 py-3 flex items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>
              <span className="font-semibold">{dirtyCount}</span>{' '}
              {dirtyCount === 1 ? 'fila modificada' : 'filas modificadas'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelAll}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={saveAll}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notificación de resultado */}
      <Modal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.type === 'success' ? 'Guardado exitoso' : 'Error al guardar'}
        closeOnOutsideClick
        closeOnEscapeKey
      >
        <div className="text-center py-4 px-6">
          {notification.type === 'success' ? (
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <p className={`text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {notification.message}
          </p>
          <button
            onClick={closeNotification}
            className={`mt-4 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              notification.type === 'success'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            Aceptar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EditableTable;
