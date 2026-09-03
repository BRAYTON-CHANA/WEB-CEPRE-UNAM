import React, { useState, useMemo, useEffect } from 'react';

/**
 * PlazasSelector — selector de plazas múltiples agrupadas por sede.
 *
 * Muestra acordeones colapsables por sede, cada curso/plaza es un checkbox.
 * El usuario puede seleccionar múltiples plazas a la vez.
 *
 * Props:
 *   convocatoriaCursos - lista de VW_CONVOCATORIAS_CURSO disponibles
 *   selectedIds - array de ID_CONVOCATORIA_CURSO seleccionados
 *   onChange - callback(arrayDeIdsSeleccionados)
 *   error - mensaje de error
 */
function PlazasSelector({
  convocatoriaCursos = [],
  selectedIds = [],
  postuladasIds = [],
  onChange,
  error
}) {
  const [expandedSedes, setExpandedSedes] = useState({});

  // Agrupar cursos por (ID_SEDE, MODALIDAD) para distinguir Virtual (ID_SEDE=null)
  const sedesAgrupadas = useMemo(() => {
    const grupos = {};
    convocatoriaCursos.forEach(cc => {
      const idSede = cc.ID_SEDE;
      const modalidad = cc.MODALIDAD || 'PRESENCIAL';
      const key = `${idSede == null ? 'null' : idSede}|${modalidad}`;
      if (!grupos[key]) {
        grupos[key] = {
          idSede,
          modalidad,
          isVirtual: modalidad === 'VIRTUAL',
          nombreSede: cc.NOMBRE_SEDE || (modalidad === 'VIRTUAL' ? 'Virtual' : `Sede ${idSede}`),
          codigoSede: cc.CODIGO_SEDE || (modalidad === 'VIRTUAL' ? 'VRT' : ''),
          cursos: []
        };
      }
      grupos[key].cursos.push(cc);
    });
    // Ordenar: sedes reales primero (alfabético), Virtual al final
    return Object.values(grupos).sort((a, b) => {
      if (a.isVirtual && !b.isVirtual) return 1;
      if (!a.isVirtual && b.isVirtual) return -1;
      return String(a.nombreSede).localeCompare(String(b.nombreSede));
    });
  }, [convocatoriaCursos]);

  // Expandir todas las sedes por defecto al cargar
  useEffect(() => {
    const all = {};
    sedesAgrupadas.forEach(s => {
      const key = `${s.idSede == null ? 'null' : s.idSede}|${s.modalidad}`;
      all[key] = true;
    });
    setExpandedSedes(all);
  }, [sedesAgrupadas]);

  const toggleSede = (key) => {
    setExpandedSedes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCurso = (idCc) => {
    // No permitir desmarcar plazas ya postuladas
    if (postuladasIds.includes(idCc)) return;
    const newSelection = selectedIds.includes(idCc)
      ? selectedIds.filter(id => id !== idCc)
      : [...selectedIds, idCc];
    onChange(newSelection);
  };

  const expandAll = () => {
    const all = {};
    sedesAgrupadas.forEach(s => {
      const key = `${s.idSede == null ? 'null' : s.idSede}|${s.modalidad}`;
      all[key] = true;
    });
    setExpandedSedes(all);
  };

  const collapseAll = () => {
    setExpandedSedes({});
  };

  if (convocatoriaCursos.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-sm text-gray-500">No hay plazas disponibles para esta convocatoria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Postular a plazas <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={expandAll}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Expandir todo
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            Colapsar todo
          </button>
        </div>
      </div>

      {/* Contador de seleccionados */}
      {selectedIds.length > 0 && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full">
          <span className="text-xs font-medium text-blue-700">
            {selectedIds.length} {selectedIds.length === 1 ? 'plaza seleccionada' : 'plazas seleccionadas'}
          </span>
        </div>
      )}

      {/* Lista de sedes con acordeones */}
      <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
        {sedesAgrupadas.map(sede => {
          const sedeKey = `${sede.idSede == null ? 'null' : sede.idSede}|${sede.modalidad}`;
          const isExpanded = expandedSedes[sedeKey];
          const cursosSede = sede.cursos;
          const seleccionadosSede = cursosSede.filter(c => selectedIds.includes(c.ID_CONVOCATORIA_CURSO)).length;

          return (
            <div key={sedeKey}>
              {/* Header de sede (acordeón) */}
              <button
                type="button"
                onClick={() => toggleSede(sedeKey)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors ${
                  sede.isVirtual ? 'bg-purple-50/60' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {sede.isVirtual ? (
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 18l-1 1h10l-1-1-.75-1M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  ) : null}
                  <span className="text-sm font-semibold text-gray-800">
                    {sede.nombreSede}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({sede.codigoSede})
                  </span>
                  {sede.isVirtual && (
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded border border-purple-200">
                      VIRTUAL
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {seleccionadosSede > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 border border-blue-200 rounded-full text-xs font-medium text-blue-700">
                      {seleccionadosSede} {seleccionadosSede === 1 ? 'seleccionado' : 'seleccionados'}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {cursosSede.length} {cursosSede.length === 1 ? 'curso' : 'cursos'}
                  </span>
                </div>
              </button>

              {/* Cursos de la sede (checkboxes) */}
              {isExpanded && (
                <div className="bg-white">
                  {cursosSede.map(cc => {
                    const isSelected = selectedIds.includes(cc.ID_CONVOCATORIA_CURSO);
                    const yaPostulado = postuladasIds.includes(cc.ID_CONVOCATORIA_CURSO);
                    return (
                      <label
                        key={cc.ID_CONVOCATORIA_CURSO}
                        className={`flex items-center px-4 py-2.5 transition-colors border-t border-gray-50
                          ${yaPostulado ? 'bg-green-50/30 cursor-not-allowed' : 'hover:bg-blue-50/50 cursor-pointer'}`}
                      >
                        <div className="relative flex items-center mr-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCurso(cc.ID_CONVOCATORIA_CURSO)}
                            disabled={yaPostulado}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center
                            ${yaPostulado
                              ? 'bg-green-600 border-green-600'
                              : isSelected
                                ? 'bg-blue-600 border-blue-600'
                                : 'bg-white border-gray-300 hover:border-gray-400'
                            }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${yaPostulado ? 'text-gray-500' : 'text-gray-800'}`}>
                              {cc.NOMBRE_CURSO}
                            </span>
                            <span className="text-xs text-gray-400">
                              ({cc.CODIGO_CURSO})
                            </span>
                            {yaPostulado && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-medium border border-green-200">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                Ya postulado
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-500">
                            {cc.NUMERO_PLAZAS} {cc.NUMERO_PLAZAS === 1 ? 'plaza' : 'plazas'}
                          </span>
                          {cc.PLAZAS_ASIGNADAS > 0 && (
                            <span className="text-xs text-amber-600 font-medium">
                              {cc.PLAZAS_ASIGNADAS} ocupada{cc.PLAZAS_ASIGNADAS === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default PlazasSelector;
