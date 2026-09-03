import React, { useMemo } from 'react';
import FunctionSelectInput from '@/shared/components/ui/inputs/FunctionSelectInput';

/**
 * SesionesManualToolbar — toolbar para añadir sesiones manualmente día por día.
 * Flujo: fecha → curso → bloques.
 *
 * Props:
 *   modoAdd, fechaSeleccionada, selectedCurso, selectedBloques,
 *   saving, idGrupo, stableFormData, grupoCursosData, sesiones,
 *   onSetSelectedCurso, onStartAdd, onCancelAdd, onSelectFecha, onConfirmAdd
 */
export default function SesionesManualToolbar({
  modoAdd,
  fechaSeleccionada,
  selectedCurso,
  selectedBloques,
  saving,
  idGrupo,
  stableFormData,
  grupoCursosData,
  sesiones,
  onSetSelectedCurso,
  onStartAdd,
  onCancelAdd,
  onSelectFecha,
  onConfirmAdd
}) {
  // Datos del curso seleccionado
  const cursoSeleccionadoData = useMemo(() => {
    if (!selectedCurso || !grupoCursosData) return null;
    return grupoCursosData.find(c => String(c.ID_GRUPO_CURSO) === String(selectedCurso)) || null;
  }, [selectedCurso, grupoCursosData]);

  // Contar bloques actuales del curso seleccionado (de todas las sesiones activas)
  const bloquesActualesCurso = useMemo(() => {
    if (!selectedCurso) return 0;
    let count = 0;
    for (const s of sesiones) {
      if (String(s.ID_GRUPO_CURSO) === String(selectedCurso)) {
        const ids = normalizeBloquesIds(s.BLOQUES_IDS);
        count += ids.length;
      }
    }
    return count;
  }, [selectedCurso, sesiones]);

  // Contador — solo horas totales
  const contador = useMemo(() => {
    if (!cursoSeleccionadoData) return null;
    const horasTotalesReq = cursoSeleccionadoData.HORAS_ACADEMICAS_TOTALES || 0;
    const bloquesNuevos = selectedBloques.size;
    const proyeccion = bloquesActualesCurso + bloquesNuevos;
    const pendientes = horasTotalesReq - proyeccion;
    const estado = pendientes > 0 ? 'pendiente' : pendientes === 0 ? 'completo' : 'excede';
    return {
      horasTotalesReq,
      bloquesActuales: bloquesActualesCurso,
      bloquesNuevos,
      proyeccion, pendientes, estado
    };
  }, [cursoSeleccionadoData, bloquesActualesCurso, selectedBloques]);

  // Pasos del flujo: 1=fecha, 2=curso, 3=bloques
  const pasoFechaOk = !!fechaSeleccionada;
  const pasoCursoOk = !!selectedCurso;

  return (
    <div className="space-y-4">
      {/* ===== Header ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <div>
            <h3 className="text-base font-semibold text-gray-900 leading-tight">
              Añadir Sesión Manual
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Selecciona un día, luego un curso, luego los bloques</p>
          </div>
        </div>

        {!modoAdd && (
          <button
            onClick={onStartAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Añadir
          </button>
        )}
      </div>

      {/* ===== Modo add: fecha → curso → bloques ===== */}
      {modoAdd && (
        <div className="space-y-3">
          {/* Indicador de pasos */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${
              pasoFechaOk ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}>
              {pasoFechaOk ? '✓' : '1'} Fecha
            </span>
            <span className="text-gray-300">→</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${
              !pasoFechaOk ? 'bg-gray-50 text-gray-300 border border-gray-100'
              : pasoCursoOk ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
              {pasoCursoOk ? '✓' : '2'} Curso
            </span>
            <span className="text-gray-300">→</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${
              pasoCursoOk ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-300 border border-gray-100'
            }`}>
              3 Bloques
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {/* Paso 1: Selector de fecha */}
            <div className="w-56">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Día <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => onSelectFecha(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
              />
            </div>

            {/* Paso 2: Selector de curso (solo habilitado si fecha seleccionada) */}
            <div className="w-72">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Curso <span className="text-red-500">*</span>
              </label>
              <div className={!pasoFechaOk ? 'opacity-50 pointer-events-none' : ''}>
                <FunctionSelectInput
                  name="curso_sesion_manual"
                  label=""
                  hideLabel={true}
                  functionName="fn_grupo_cursos"
                  functionParams={{ ID_GRUPO: idGrupo }}
                  valueField="ID_GRUPO_CURSO"
                  labelField="{NOMBRE_CURSO}"
                  descriptionField="{IDENTIFICADOR_DOCENTE}"
                  placeholder={pasoFechaOk ? "Seleccionar curso..." : "Primero selecciona un día"}
                  searchable={true}
                  value={selectedCurso}
                  onChange={(_, val) => onSetSelectedCurso(val)}
                  formData={stableFormData}
                />
              </div>
            </div>

            {/* Acciones */}
            <button
              onClick={onConfirmAdd}
              disabled={!pasoCursoOk || !pasoFechaOk || selectedBloques.size === 0 || saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-white" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Guardar ({selectedBloques.size})
            </button>
            <button
              onClick={onCancelAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>

          {/* Ayuda dinámica según paso */}
          {!pasoFechaOk && (
            <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded px-2.5 py-1 inline-block">
              Paso 1: Selecciona un día
            </span>
          )}
          {pasoFechaOk && !pasoCursoOk && (
            <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded px-2.5 py-1 inline-block">
              Paso 2: Selecciona un curso
            </span>
          )}
          {pasoCursoOk && (
            <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded px-2.5 py-1 inline-block">
              Paso 3: Haz clic en bloques vacíos para seleccionarlos
            </span>
          )}

          {/* ===== Contador de horas (solo horas totales) ===== */}
          {contador && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Actuales</span>
                <span className="text-2xl font-bold text-gray-900 mt-1">{contador.bloquesActuales}</span>
                <span className="text-[11px] text-gray-400">bloques asignados</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Por añadir</span>
                <span className={`text-2xl font-bold mt-1 ${contador.bloquesNuevos > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                  +{contador.bloquesNuevos}
                </span>
                <span className="text-[11px] text-gray-400">celdas seleccionadas</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Requeridas</span>
                <span className="text-2xl font-bold text-gray-900 mt-1">{contador.horasTotalesReq}</span>
                <span className="text-[11px] text-gray-400">horas totales</span>
              </div>

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
                  <span className="text-sm text-gray-400">/ {contador.horasTotalesReq}</span>
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

              <div className="col-span-2 sm:col-span-4">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      contador.estado === 'completo' ? 'bg-green-500'
                      : contador.estado === 'excede' ? 'bg-red-500'
                      : 'bg-gray-900'
                    }`}
                    style={{ width: `${Math.min(100, (contador.proyeccion / Math.max(1, contador.horasTotalesReq)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Helper =====
const normalizeBloquesIds = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number).filter(n => !isNaN(n));
  if (typeof val === 'string') {
    const cleaned = val.replace(/[{}]/g, '').trim();
    if (!cleaned) return [];
    return cleaned.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  }
  return [];
};
