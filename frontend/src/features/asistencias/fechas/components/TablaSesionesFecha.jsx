import React from 'react';

function formatHora(horaStr) {
  if (!horaStr) return '—';
  const [horas, minutos] = horaStr.split(':');
  return `${horas}:${minutos}`;
}

export function TablaSesionesFecha({ sesiones, onMarcarAsistencia, onMarcarEstudiantes }) {
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
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
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
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onMarcarAsistencia(sesion)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 transition-all"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Marcar docente
                    </button>
                    <button
                      onClick={() => onMarcarEstudiantes(sesion)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 transition-all"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      Marcar estudiantes
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
