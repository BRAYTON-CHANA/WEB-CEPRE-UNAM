import React, { useMemo } from 'react';
import FunctionSelectInput from '@/shared/components/ui/inputs/FunctionSelectInput';

export default function PlantillaToolbar({
  grupoNombre,
  selectionMode,
  deleteMode,
  selectedCells,
  selectedCurso,
  saving,
  idGrupo,
  stableFormData,
  cellEvents,
  grupoCursosData,
  onSetSelectedCurso,
  onStartAdd,
  onCancelAdd,
  onConfirmAdd,
  onStartDelete,
  onCancelDelete,
  onShowEstadisticas
}) {
  // Contar bloques actuales por ID_GRUPO_CURSO desde cellEvents
  const bloquesActualesPorCurso = useMemo(() => {
    const counts = {};
    if (cellEvents) {
      Object.values(cellEvents).forEach(ev => {
        if (ev.idGrupoCurso) {
          counts[ev.idGrupoCurso] = (counts[ev.idGrupoCurso] || 0) + 1;
        }
      });
    }
    return counts;
  }, [cellEvents]);

  // Datos del curso seleccionado (horas requeridas)
  const cursoSeleccionadoData = useMemo(() => {
    if (!selectedCurso || !grupoCursosData) return null;
    return grupoCursosData.find(c => String(c.ID_GRUPO_CURSO) === String(selectedCurso)) || null;
  }, [selectedCurso, grupoCursosData]);

  // Cálculos del contador
  const contador = useMemo(() => {
    if (!cursoSeleccionadoData) return null;
    const horasRequeridas = cursoSeleccionadoData.HORAS_ACADEMICAS_CICLO || 0;
    const bloquesActuales = bloquesActualesPorCurso[cursoSeleccionadoData.ID_GRUPO_CURSO] || 0;
    const bloquesNuevos = selectionMode ? selectedCells.size : 0;
    const proyeccion = bloquesActuales + bloquesNuevos;
    const pendientes = horasRequeridas - proyeccion;
    const estado = pendientes > 0 ? 'pendiente' : pendientes === 0 ? 'completo' : 'excede';
    return { horasRequeridas, bloquesActuales, bloquesNuevos, proyeccion, pendientes, estado };
  }, [cursoSeleccionadoData, bloquesActualesPorCurso, selectionMode, selectedCells]);

  return (
    <div className="space-y-4">
      {/* ===== Header minimalista ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <h3 className="text-base font-semibold text-gray-900 leading-tight">
              {grupoNombre || 'Plantilla Horaria'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Programación de bloques por curso</p>
          </div>
        </div>

        {!selectionMode && !deleteMode && (
          <div className="flex items-center gap-2">
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-900" />
            )}
            <button
              onClick={onStartAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Añadir
            </button>
            <button
              onClick={onStartDelete}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Eliminar
            </button>
            <button
              onClick={onShowEstadisticas}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Estadísticas
            </button>
          </div>
        )}
      </div>

      {/* ===== Modo selección: curso + contador + acciones ===== */}
      {selectionMode && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-72">
              <FunctionSelectInput
                name="curso_asignar"
                label=""
                hideLabel={true}
                functionName="fn_grupo_cursos"
                functionParams={{ ID_GRUPO: idGrupo }}
                valueField="ID_GRUPO_CURSO"
                labelField="{NOMBRE_CURSO}"
                descriptionField="{IDENTIFICADOR_DOCENTE}"
                placeholder="Seleccionar curso..."
                searchable={true}
                value={selectedCurso}
                onChange={(_, val) => onSetSelectedCurso(val)}
                formData={stableFormData}
              />
            </div>
            <button
              onClick={onConfirmAdd}
              disabled={!selectedCurso || selectedCells.size === 0 || saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-white" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Guardar ({selectedCells.size})
            </button>
            <button
              onClick={onCancelAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded px-2.5 py-1">
              Haz clic en celdas vacías para seleccionarlas
            </span>
          </div>

          {/* ===== Contador de bloques por curso ===== */}
          {contador && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              {/* Bloques actuales */}
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Actuales</span>
                <span className="text-2xl font-bold text-gray-900 mt-1">{contador.bloquesActuales}</span>
                <span className="text-[11px] text-gray-400">bloques asignados</span>
              </div>

              {/* Bloques nuevos */}
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Por añadir</span>
                <span className={`text-2xl font-bold mt-1 ${contador.bloquesNuevos > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                  +{contador.bloquesNuevos}
                </span>
                <span className="text-[11px] text-gray-400">celdas seleccionadas</span>
              </div>

              {/* Requeridas */}
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Requeridas</span>
                <span className="text-2xl font-bold text-gray-900 mt-1">{contador.horasRequeridas}</span>
                <span className="text-[11px] text-gray-400">horas ciclo</span>
              </div>

              {/* Proyección */}
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Proyección</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={`text-2xl font-bold ${
                    contador.estado === 'completo' ? 'text-green-600'
                    : contador.estado === 'excede' ? 'text-red-600'
                    : 'text-gray-900'
                  }`}>
                    {contador.proyeccion}
                  </span>
                  <span className="text-sm text-gray-400">/ {contador.horasRequeridas}</span>
                </div>
                <span className={`text-[11px] font-medium ${
                  contador.estado === 'completo' ? 'text-green-600'
                  : contador.estado === 'excede' ? 'text-red-600'
                  : 'text-gray-400'
                }`}>
                  {contador.estado === 'completo' ? 'Completo'
                  : contador.estado === 'excede' ? `Excede por ${Math.abs(contador.pendientes)}`
                  : `Faltan ${contador.pendientes}`}
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="col-span-2 sm:col-span-4">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      contador.estado === 'completo' ? 'bg-green-500'
                      : contador.estado === 'excede' ? 'bg-red-500'
                      : 'bg-gray-900'
                    }`}
                    style={{ width: `${Math.min(100, (contador.proyeccion / Math.max(1, contador.horasRequeridas)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Modo eliminación ===== */}
      {deleteMode && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2.5 py-1 font-medium">
            Haz clic en el × de un evento para eliminarlo
          </span>
          <button
            onClick={onCancelDelete}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
