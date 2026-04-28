import React from 'react';

/**
 * Modal para mostrar estadísticas de cursos del grupo
 * Muestra horas académicas totales vs horas asignadas por curso
 */
const EstadisticasModal = ({ isOpen, onClose, estadisticas }) => {
  if (!isOpen) return null;

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'COMPLETO':
        return 'text-green-600';
      case 'INCOMPLETO':
        return 'text-yellow-600';
      case 'EXCEDIDO':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const calcularPorcentaje = (asignadas, total) => {
    if (total === 0) return 0;
    return Math.round((asignadas / total) * 100);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2D366F] to-[#57C7C2] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Estadísticas de Cursos</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!estadisticas || estadisticas.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-3 text-gray-600 font-medium">No hay datos disponibles</p>
              <p className="mt-1 text-sm text-gray-500">Seleccione un grupo para ver estadísticas</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Curso</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Horas Asig/Prog</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Estado</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.map((curso) => (
                  <tr key={curso.ID_PLAN_ACADEMICO_CURSO} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b">
                      <div className="font-medium text-gray-900">{curso.CODIGO_COMPARTIDO}</div>
                      <div className="text-sm text-gray-600">{curso.NOMBRE_CURSO}</div>
                    </td>
                    <td className="px-4 py-3 text-center border-b">
                      <div className="text-gray-900">
                        {curso.HORAS_ASIGNADAS.toFixed(1)} / {curso.HORAS_PLAN}
                      </div>
                      <div className="text-sm text-gray-500">{calcularPorcentaje(curso.HORAS_ASIGNADAS, curso.HORAS_PLAN)}%</div>
                    </td>
                    <td className="px-4 py-3 text-center border-b">
                      <span className={`font-semibold ${getStatusColor(curso.ESTADO)}`}>
                        {curso.ESTADO}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstadisticasModal;
