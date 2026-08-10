import React, { useMemo, useCallback, useState } from 'react';
import ScheduleTemplate from '@/shared/components/schedule/components/ScheduleTemplate';
import useHorarioBloques, { swapBloquesOrden } from '@/features/horarios/hooks/useHorarioBloques';

/**
 * Vista alternativa para editar los bloques de un horario.
 * Muestra:
 *  - Header con botón "Atrás" + título del horario + botón "Añadir Bloque"
 *  - ScheduleTemplate (días × bloques) si hay al menos un bloque
 *  - Lista compacta de bloques con acciones editar/eliminar
 *
 * @param {Object} horario - Row del horario (VW_HORARIOS)
 * @param {Object} bloquesCrud - Resultado de useCrudForms para HORARIO_BLOQUES
 * @param {Function} onBack - Volver a la tabla de horarios
 * @param {Function} [onNextOrdenChange] - Callback para reportar el próximo ORDEN disponible
 */
const EditarBloquesView = ({ horario, bloquesCrud, onBack, onNextOrdenChange }) => {
  const { bloques, scheduleBlocks, matrix, loading, reload } = useHorarioBloques(horario);
  const [swapError, setSwapError] = useState(null);
  const [swapping, setSwapping] = useState(false);

  // Sincronizar el refresh del crud con la recarga del schedule
  React.useEffect(() => {
    if (bloquesCrud.refreshTrigger) {
      reload();
    }
  }, [bloquesCrud.refreshTrigger, reload]);

  // Reportar el próximo ORDEN disponible (max + 1) cada vez que cambian los bloques
  React.useEffect(() => {
    if (!onNextOrdenChange) return;
    const maxOrden = bloques.length > 0
      ? Math.max(...bloques.map(b => Number(b.ORDEN) || 0))
      : 0;
    onNextOrdenChange(maxOrden + 1);
  }, [bloques, onNextOrdenChange]);

  // Bloques ordenados por ORDEN para buscar adyacentes
  const sortedBloques = useMemo(
    () => [...bloques].sort((a, b) => (a.ORDEN || 0) - (b.ORDEN || 0)),
    [bloques]
  );

  // Mapa orden -> bloque raw (para encontrar el bloque desde el block del schedule)
  const ordenToBloque = useMemo(() => {
    const m = {};
    sortedBloques.forEach((b) => { m[b.ORDEN] = b; });
    return m;
  }, [sortedBloques]);

  const handleSwap = useCallback(async (bloqueA, bloqueB) => {
    if (!bloqueA || !bloqueB || swapping) return;
    setSwapError(null);
    setSwapping(true);
    try {
      const ok = await swapBloquesOrden(bloqueA, bloqueB, (err) => {
        setSwapError(err?.message || 'Error al reordenar bloques');
      });
      if (ok) await reload();
    } finally {
      setSwapping(false);
    }
  }, [reload, swapping]);

  // Handlers para las flechas del ScheduleTemplate (reciben el block con .orden)
  const handleMoveUp = useCallback((block) => {
    const current = ordenToBloque[block.orden];
    const idx = sortedBloques.findIndex((b) => b.ORDEN === block.orden);
    const prev = sortedBloques[idx - 1];
    if (current && prev) handleSwap(current, prev);
  }, [ordenToBloque, sortedBloques, handleSwap]);

  const handleMoveDown = useCallback((block) => {
    const current = ordenToBloque[block.orden];
    const idx = sortedBloques.findIndex((b) => b.ORDEN === block.orden);
    const next = sortedBloques[idx + 1];
    if (current && next) handleSwap(current, next);
  }, [ordenToBloque, sortedBloques, handleSwap]);

  // canMoveUp / canMoveDown para el ScheduleTemplate
  const canMoveUpCb = useCallback((block) => {
    const idx = sortedBloques.findIndex((b) => b.ORDEN === block.orden);
    return idx > 0;
  }, [sortedBloques]);

  const canMoveDownCb = useCallback((block) => {
    const idx = sortedBloques.findIndex((b) => b.ORDEN === block.orden);
    return idx >= 0 && idx < sortedBloques.length - 1;
  }, [sortedBloques]);

  // Handlers para la lista compacta (reciben el bloque raw)
  const handleMoveUpRow = useCallback((bloque) => {
    const idx = sortedBloques.findIndex((b) => b.ID_BLOQUE === bloque.ID_BLOQUE);
    const prev = sortedBloques[idx - 1];
    if (prev) handleSwap(bloque, prev);
  }, [sortedBloques, handleSwap]);

  const handleMoveDownRow = useCallback((bloque) => {
    const idx = sortedBloques.findIndex((b) => b.ID_BLOQUE === bloque.ID_BLOQUE);
    const next = sortedBloques[idx + 1];
    if (next) handleSwap(bloque, next);
  }, [sortedBloques, handleSwap]);

  if (!horario) return null;

  const hasBloques = bloques.length > 0;
  const hasMatrix = matrix.length > 0 && Array.isArray(matrix[0]) && matrix[0].length > 0;

  const handleAddBloque = () => {
    bloquesCrud.handleCreate();
  };

  const handleEditBloque = (bloque) => {
    bloquesCrud.handleEdit(bloque);
  };

  const handleDeleteBloque = (bloque) => {
    bloquesCrud.handleDelete(bloque);
  };

  return (
    <div className="px-8 py-8 space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Atrás
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar Bloques
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              {horario.NOMBRE_HORARIO}
              {horario.NOMBRE_SEDE ? ` · ${horario.NOMBRE_SEDE}` : ''}
              {horario.HORA_INICIO_JORNADA && horario.HORA_FIN_JORNADA
                ? ` · ${horario.HORA_INICIO_JORNADA} - ${horario.HORA_FIN_JORNADA}`
                : ''}
            </p>
          </div>
        </div>

        <button
          onClick={handleAddBloque}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir Bloque
        </button>
      </div>

      {/* Error de reordenación */}
      {swapError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center justify-between">
          <span>{swapError}</span>
          <button
            onClick={() => setSwapError(null)}
            className="text-red-500 hover:text-red-700 font-medium"
          >
            ×
          </button>
        </div>
      )}

      {/* Cuerpo */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Cargando bloques...</p>
        </div>
      ) : !hasBloques ? (
        /* Sin bloques: CTA grande */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-3 text-gray-700 font-medium">No hay bloques definidos</p>
          <p className="mt-1 text-sm text-gray-500">
            Añade bloques (clase o break) para construir la plantilla de horario.
          </p>
          <button
            onClick={handleAddBloque}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Añadir primer bloque
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ScheduleTemplate: solo si hay matriz de días configurada */}
          {hasMatrix ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Vista de horario</h2>
              <ScheduleTemplate
                blocks={scheduleBlocks}
                matrix={matrix}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                canMoveUp={canMoveUpCb}
                canMoveDown={canMoveDownCb}
              />
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
              El horario no tiene una matriz de días configurada. Solo se muestran los bloques.
            </div>
          )}

          {/* Lista de bloques con acciones */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">
                Bloques ({bloques.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2.5 font-medium text-gray-600">Orden</th>
                    <th className="px-4 py-2.5 font-medium text-gray-600">Etiqueta</th>
                    <th className="px-4 py-2.5 font-medium text-gray-600">Tipo</th>
                    <th className="px-4 py-2.5 font-medium text-gray-600">Duración</th>
                    <th className="px-4 py-2.5 font-medium text-gray-600">Hora</th>
                    <th className="px-4 py-2.5 font-medium text-gray-600 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedBloques.map((b, idx) => (
                    <tr
                      key={b.ID_BLOQUE}
                      className={b.TIPO_BLOQUE === 'break' ? 'bg-gray-50/60' : 'bg-white'}
                    >
                      <td className="px-4 py-3 text-gray-700 font-mono">{b.ORDEN}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {b.ETIQUETA || (
                          <span className="text-gray-400 italic">Sin etiqueta</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            b.TIPO_BLOQUE === 'break'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {b.TIPO_BLOQUE === 'break' ? '☕ Break' : 'Clase'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{b.DURACION} min</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                        {b.HORA_INICIO_CALCULADA || '--:--'} - {b.HORA_FIN_CALCULADA || '--:--'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleMoveUpRow(b)}
                            disabled={idx === 0 || swapping}
                            className={[
                              'p-1.5 rounded transition-colors',
                              idx === 0
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-100 disabled:opacity-50'
                            ].join(' ')}
                            title="Mover arriba"
                            aria-label="Mover arriba"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMoveDownRow(b)}
                            disabled={idx === sortedBloques.length - 1 || swapping}
                            className={[
                              'p-1.5 rounded transition-colors',
                              idx === sortedBloques.length - 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-100 disabled:opacity-50'
                            ].join(' ')}
                            title="Mover abajo"
                            aria-label="Mover abajo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <div className="w-px h-4 bg-gray-200 mx-0.5" />
                          <button
                            onClick={() => handleEditBloque(b)}
                            className="p-1.5 rounded text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Editar bloque"
                            aria-label="Editar bloque"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteBloque(b)}
                            className="p-1.5 rounded text-red-600 hover:bg-red-100 transition-colors"
                            title="Eliminar bloque"
                            aria-label="Eliminar bloque"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditarBloquesView;
