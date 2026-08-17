import React from 'react';

/**
 * PostulantesHeader — info del filtro activo + botón "Añadir postulación".
 * Muestra diferente info según el nivel de filtro seleccionado:
 *   - Curso seleccionado: nombre curso, sede, plazas
 *   - Sede seleccionada: nombre sede
 *   - Solo convocatoria: nombre periodo
 *
 * @param {Object} selectedCursoRow - row de VW_CONVOCATORIAS_CURSO (o null)
 * @param {string} selectedIdSede - ID_SEDE seleccionado (o '')
 * @param {string} selectedIdConvocatoria - ID_CONVOCATORIA seleccionado
 * @param {Array} sedes - lista de sedes para buscar nombre
 * @param {Array} convocatorias - lista de convocatorias para buscar nombre
 * @param {Function} onAddPostulacion - handler botón añadir
 */
function PostulantesHeader({
  selectedCursoRow,
  selectedIdSede,
  selectedIdConvocatoria,
  sedes,
  convocatorias,
  onAddPostulacion,
}) {
  if (!selectedIdConvocatoria) return null;

  const sedeNombre = sedes.find(s => String(s.ID_SEDE) === String(selectedIdSede))?.NOMBRE_SEDE || 'Sede';
  const convocatoriaNombre = convocatorias.find(c => String(c.ID_CONVOCATORIA) === String(selectedIdConvocatoria))?.NOMBRE_PERIODO || 'Convocatoria';

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
      <div>
        {selectedCursoRow ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900">
              Postulantes de {selectedCursoRow.NOMBRE_CURSO} ({selectedCursoRow.CODIGO_CURSO})
            </h2>
            <p className="text-sm text-gray-500">
              {selectedCursoRow.NOMBRE_SEDE} · Máx {selectedCursoRow.NUMERO_PLAZAS} plazas
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Creadas: {selectedCursoRow.PLAZAS_CREADAS ?? 0} · Asignadas: {selectedCursoRow.PLAZAS_ASIGNADAS ?? 0}
            </p>
          </>
        ) : selectedIdSede ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900">
              Postulantes — {sedeNombre}
            </h2>
            <p className="text-sm text-gray-500">Todos los cursos de la sede seleccionada</p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900">
              Postulantes — {convocatoriaNombre}
            </h2>
            <p className="text-sm text-gray-500">Todas las sedes y cursos de la convocatoria</p>
          </>
        )}
      </div>
      <button
        onClick={onAddPostulacion}
        className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
      >
        + Añadir postulación
      </button>
    </div>
  );
}

export default PostulantesHeader;
