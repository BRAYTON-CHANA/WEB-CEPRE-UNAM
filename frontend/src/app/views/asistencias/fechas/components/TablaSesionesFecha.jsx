import React from 'react';

function formatHora(horaStr) {
  if (!horaStr) return '—';
  const [horas, minutos] = horaStr.split(':');
  return `${horas}:${minutos}`;
}

export function TablaSesionesFecha({ sesiones, onMarcarAsistencia }) {
  if (!sesiones || sesiones.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
        No hay sesiones programadas para este grupo en esta fecha
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hora</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Curso</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Área</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Docente</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sesiones.map((sesion, idx) => {
            const asistenciaMarcada = sesion.ASISTIO !== null && sesion.ASISTIO !== undefined;
            const asistio = sesion.ASISTIO === true;
            
            return (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {formatHora(sesion.HORA_INICIO)} – {formatHora(sesion.HORA_FIN)}
                  </span>
                  <div className="text-xs text-gray-500">
                    {sesion.DURACION_CLASE_MINUTOS} min
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{sesion.NOMBRE_CURSO}</div>
                  <div className="text-xs text-gray-500">{sesion.CODIGO_CURSO}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {sesion.CODIGO_AREA}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">{sesion.DOCENTE_PROGRAMADO_NOMBRE || 'Sin asignar'}</div>
                  {sesion.PLAZA_IDENTIFICADOR && (
                    <div className="text-xs text-gray-500">{sesion.PLAZA_IDENTIFICADOR}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {!asistenciaMarcada ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pendiente
                    </span>
                  ) : asistio ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Asistió
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Faltó
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onMarcarAsistencia(sesion)}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {asistenciaMarcada ? 'Editar' : 'Marcar'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
