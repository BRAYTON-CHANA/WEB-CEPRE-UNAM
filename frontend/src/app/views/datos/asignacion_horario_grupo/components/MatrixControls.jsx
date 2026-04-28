import React from 'react';
import { DIAS_SEMANA } from '../utils/diasSemana';

const MatrixControls = ({ matrix, numRows, numCols, addCol, removeCol, addRow, removeRow, setCellDia, hasAtLeastOneDia }) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Matriz de días ({numRows} fila{numRows !== 1 ? 's' : ''} × {numCols} columna{numCols !== 1 ? 's' : ''})
      </h3>
      
      {/* Controles columnas */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-xs font-medium text-gray-600 w-16">Columnas:</span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={removeCol}
            disabled={numCols <= 1}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            − Eliminar
          </button>
          <button
            type="button"
            onClick={addCol}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Controles filas */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-xs font-medium text-gray-600 w-16">Filas:</span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={removeRow}
            disabled={numRows <= 1}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            − Eliminar
          </button>
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Tabla matriz */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-[#2D366F] to-[#57C7C2]">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider w-16 font-serif">#</th>
              {Array.from({ length: numCols }).map((_, ci) => {
                const letra = String.fromCharCode(65 + ci);
                return (
                  <th
                    key={ci}
                    className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider font-serif"
                  >
                    {letra}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matrix.map((row, ri) => (
              <tr key={ri} className="hover:bg-[#2D366F]/5 transition-colors">
                <td className="px-3 py-2 text-sm text-gray-500 font-serif">{ri + 1}</td>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2">
                    <select
                      value={cell.dia}
                      onChange={(e) => setCellDia(ri, ci, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#57C7C2] focus:border-[#57C7C2] bg-white transition-shadow font-serif"
                    >
                      <option value="">-- Vacío --</option>
                      {DIAS_SEMANA.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!hasAtLeastOneDia && (
        <p className="mt-2 text-xs text-amber-600">
          * Al menos una celda debe tener un día seleccionado.
        </p>
      )}
    </div>
  );
};

export default MatrixControls;
