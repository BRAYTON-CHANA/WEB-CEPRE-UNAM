import React, { useState, useEffect } from 'react';
import { db } from '@/shared/api';

export default function EstadisticasModal({ isOpen, onClose, idGrupo, grupoNombre }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !idGrupo) return;

    const loadEstadisticas = async () => {
      setLoading(true);
      try {
        const records = await db.select('VW_HORAS_ACADEMICAS_GRUPO', { ID_GRUPO: idGrupo });
        setData(records || []);
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadEstadisticas();
  }, [isOpen, idGrupo]);

  if (!isOpen) return null;

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Completo': return 'bg-green-100 text-green-700 border-green-200';
      case 'Incompleto':
      case 'En progreso': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Sin programar':
      case 'Sin sesiones': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'Excede': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Resumen de Horas Académicas</h2>
            <p className="text-sm text-gray-500 mt-1">Grupo: {grupoNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span className="ml-3 text-gray-600">Cargando estadísticas...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-3 text-gray-500">No hay datos disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Curso</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b" colSpan="4">Ciclo (Programación)</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b" colSpan="4">Totales (Sesiones)</th>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <th className="px-4 py-2 text-left font-medium text-gray-500 border-b"></th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500 border-b">Req.</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500 border-b">Prog.</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500 border-b">Pend.</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500 border-b">Estado</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500 border-b">Req.</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500 border-b">Real.</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500 border-b">Pend.</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500 border-b">Estado</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500 border-b">Avance</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500 border-b">Sesiones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.NOMBRE_CURSO}</td>
                      {/* Ciclo */}
                      <td className="px-3 py-3 text-center text-gray-600">{row.HORAS_CICLO_REQUERIDAS}</td>
                      <td className="px-3 py-3 text-center font-medium text-blue-600">{row.HORAS_CICLO_PROGRAMADAS}</td>
                      <td className="px-3 py-3 text-center text-gray-600">{row.HORAS_CICLO_PENDIENTES}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getEstadoColor(row.ESTADO_CICLO)}`}>
                          {row.ESTADO_CICLO}
                        </span>
                      </td>
                      {/* Totales */}
                      <td className="px-3 py-3 text-center text-gray-600">{row.HORAS_TOTALES_REQUERIDAS}</td>
                      <td className="px-3 py-3 text-center font-medium text-green-600">{row.HORAS_TOTALES_REALIZADAS}</td>
                      <td className="px-3 py-3 text-center text-gray-600">{row.HORAS_TOTALES_PENDIENTES}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getEstadoColor(row.ESTADO_TOTALES)}`}>
                          {row.ESTADO_TOTALES}
                        </span>
                      </td>
                      {/* Avance */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#2D366F] to-[#57C7C2] rounded-full"
                              style={{ width: `${Math.min(row.PORCENTAJE_AVANCE || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-10 text-right">
                            {row.PORCENTAJE_AVANCE}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600">{row.TOTAL_SESIONES}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
