import React from 'react';
import Modal from '@/features/modal/views/Modal';

/**
 * Modal de confirmación de asignación de horario
 * Muestra las asignaciones de bloques ordenadas por fecha y hora calculada
 */
const AsignacionConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  asignaciones,
  nombreCurso,
  nombreGrupo,
  loading = false
}) => {
  // Ordenar asignaciones por fecha y hora inicio
  const sortedAsignaciones = React.useMemo(() => {
    if (!asignaciones || asignaciones.length === 0) return [];
    return [...asignaciones].sort((a, b) => {
      const dateCompare = new Date(a.FECHA) - new Date(b.FECHA);
      if (dateCompare !== 0) return dateCompare;
      return (a.HORA_INICIO_MINUTOS || 0) - (b.HORA_INICIO_MINUTOS || 0);
    });
  }, [asignaciones]);

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Asignación de Horario"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Información del curso y grupo */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Curso:</span>
              <p className="text-sm font-semibold text-gray-900">{nombreCurso || 'No seleccionado'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Grupo:</span>
              <p className="text-sm font-semibold text-gray-900">{nombreGrupo || 'No seleccionado'}</p>
            </div>
          </div>
        </div>

        {/* Tabla de asignaciones */}
        {sortedAsignaciones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Hora Inicio</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Hora Fin</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Bloque</th>
                </tr>
              </thead>
              <tbody>
                {sortedAsignaciones.map((asignacion, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{asignacion.FECHA_DATE ? formatDate(asignacion.FECHA_DATE) : asignacion.FECHA}</td>
                    <td className="px-4 py-3 text-gray-700">{asignacion.HORA_INICIO_CALCULADA || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{asignacion.HORA_FIN_CALCULADA || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">Bloque {asignacion.ORDEN || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay asignaciones para mostrar
          </div>
        )}

        {/* Resumen */}
        <div className="text-sm text-gray-600 text-center">
          Total de asignaciones: <span className="font-semibold">{sortedAsignaciones.length}</span>
        </div>
      </div>
    </Modal>
  );
};

export default AsignacionConfirmModal;
