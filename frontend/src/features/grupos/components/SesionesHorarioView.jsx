import React, { useMemo } from 'react';

const WEEKDAY_NAMES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MONTH_NAMES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const hexToRgba = (hex, alpha) => {
  if (!hex || !hex.startsWith('#')) return `rgba(100,100,100,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const parseDate = (fechaStr) => {
  if (!fechaStr) return null;
  const s = String(fechaStr).includes('T') ? String(fechaStr).split('T')[0] : String(fechaStr);
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const formatDateShort = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  return `${day}-${month}`;
};

const formatTime = (t) => {
  if (!t) return '';
  return String(t).slice(0, 5);
};

const timeToMinutes = (t) => {
  if (!t) return 0;
  const s = formatTime(t);
  const [h, m] = s.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Normaliza BLOQUES_IDS que puede venir como string "{1,2,3}" o array [1,2,3].
 */
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

/**
 * Construye la lista completa de bloques del template snapshot con tiempos calculados.
 * Retorna un array ordenado por ORDEN, cada bloque con horaInicio/horaFin.
 */
const buildTemplateBlocks = (snapshotBloques) => {
  if (!snapshotBloques || snapshotBloques.length === 0) return [];

  const horaInicioJornada = snapshotBloques[0].HORA_INICIO_JORNADA;
  const startMinutes = timeToMinutes(horaInicioJornada);

  const sorted = [...snapshotBloques].sort((a, b) => (a.ORDEN || 0) - (b.ORDEN || 0));

  let currentMin = startMinutes;
  return sorted.map(b => {
    const duracion = b.DURACION || 0;
    const horaInicio = minutesToTime(currentMin);
    const endMin = currentMin + duracion;
    const horaFin = minutesToTime(endMin);
    currentMin = endMin;

    return {
      idSesionBloque: b.ID_SESION_BLOQUE,
      orden: b.ORDEN,
      duracion,
      tipo: (b.TIPO_BLOQUE || 'clase').toLowerCase(),
      etiqueta: b.ETIQUETA || null,
      horaInicio,
      horaFin,
      timeKey: `${horaInicio}-${horaFin}`
    };
  });
};

/**
 * Construye el día completo: para cada bloque del template, determina qué sesión lo ocupa.
 * Retorna array de bloques del día (todos los del template) con curso/docente/color o null si vacío.
 */
const buildDayBlocks = (templateBlocks, sesionesDelDia) => {
  // Mapear ID_SESION_BLOQUE → sesión que lo ocupa
  const bloqueToSesion = new Map();
  for (const s of sesionesDelDia) {
    const ids = normalizeBloquesIds(s.BLOQUES_IDS);
    for (const id of ids) {
      bloqueToSesion.set(id, s);
    }
  }

  // Asignar índice de sesión dentro del día (para distinguir agrupaciones)
  // Ordenar sesiones por su primer bloque en el template
  const sesionesOrdenadas = [...sesionesDelDia].sort((a, b) => {
    const aIds = normalizeBloquesIds(a.BLOQUES_IDS);
    const bIds = normalizeBloquesIds(b.BLOQUES_IDS);
    const aMin = aIds.length ? Math.min(...aIds.map(id => {
      const tb = templateBlocks.find(t => t.idSesionBloque === id);
      return tb ? tb.orden : Infinity;
    })) : Infinity;
    const bMin = bIds.length ? Math.min(...bIds.map(id => {
      const tb = templateBlocks.find(t => t.idSesionBloque === id);
      return tb ? tb.orden : Infinity;
    })) : Infinity;
    return aMin - bMin;
  });
  const sesionIdxMap = new Map();
  sesionesOrdenadas.forEach((s, idx) => {
    sesionIdxMap.set(s.ID_SESION, idx);
  });

  return templateBlocks.map(b => {
    const sesion = bloqueToSesion.get(b.idSesionBloque);
    if (b.tipo === 'break') {
      return {
        ...b,
        curso: null,
        docente: null,
        color: null,
        idGrupoCurso: null,
        idSesion: null,
        sessionIdx: null,
        key: `break|${b.timeKey}`
      };
    }
    if (sesion) {
      return {
        ...b,
        curso: sesion.NOMBRE_CURSO || null,
        docente: sesion.DOCENTE_ASIGNADO || null,
        color: sesion.CURSO_COLOR || null,
        idGrupoCurso: sesion.ID_GRUPO_CURSO || null,
        idSesion: sesion.ID_SESION || null,
        sessionIdx: sesionIdxMap.get(sesion.ID_SESION) ?? null,
        key: `clase|${b.timeKey}|${sesion.ID_GRUPO_CURSO || ''}|${sesion.ID_SESION || ''}|${sesion.NOMBRE_CURSO || ''}|${sesion.DOCENTE_ASIGNADO || ''}`
      };
    }
    // Slot vacío
    return {
      ...b,
      curso: null,
      docente: null,
      color: null,
      idGrupoCurso: null,
      idSesion: null,
      sessionIdx: null,
      key: `vacio|${b.timeKey}`
    };
  });
};

/**
 * Construye la firma de un día completo a partir de sus bloques (todos los del template).
 * Break → __BREAK__, clase con curso → ID_GRUPO_CURSO, clase vacío → __VACIO__.
 */
const buildSignature = (dayBlocks) => {
  return dayBlocks.map(b => {
    if (b.tipo === 'break') return '__BREAK__';
    if (b.idGrupoCurso) return `${b.idGrupoCurso}:${b.sessionIdx ?? 0}`;
    return '__VACIO__';
  }).join('||');
};

/**
 * SesionesHorarioView — grilla tipo horario semanal.
 * La columna izquierda (time slots) viene de TODOS los bloques de la snapshot.
 * Las columnas se agrupan por weekday + patrón completo (ID_GRUPO_CURSO por slot + vacíos).
 */
function SesionesHorarioView({ sesiones, snapshotBloques }) {
  const { columns, allTimeSlots } = useMemo(() => {
    if (!sesiones || sesiones.length === 0 || !snapshotBloques || snapshotBloques.length === 0) {
      return { columns: [], allTimeSlots: [] };
    }

    // 1. Construir template completo de bloques con tiempos calculados
    const templateBlocks = buildTemplateBlocks(snapshotBloques);
    if (templateBlocks.length === 0) return { columns: [], allTimeSlots: [] };

    // allTimeSlots = TODOS los timeKeys del template (columna izquierda completa)
    const allTimeSlots = templateBlocks.map(b => b.timeKey);

    // 2. Agrupar sesiones por fecha
    const sesionesPorFecha = new Map();
    for (const s of sesiones) {
      let fechaStr = s.FECHA;
      if (typeof fechaStr === 'string' && fechaStr.includes('T')) {
        fechaStr = fechaStr.split('T')[0];
      }
      if (!sesionesPorFecha.has(fechaStr)) {
        sesionesPorFecha.set(fechaStr, []);
      }
      sesionesPorFecha.get(fechaStr).push(s);
    }

    // 3. Para cada fecha, construir día completo y firma
    const dateInfos = [];
    for (const [fechaStr, sesionesDelDia] of sesionesPorFecha.entries()) {
      const date = parseDate(fechaStr);
      if (!date) continue;
      const weekday = date.getDay();

      const dayBlocks = buildDayBlocks(templateBlocks, sesionesDelDia);
      const sigKey = buildSignature(dayBlocks);
      dateInfos.push({ date, fechaStr, weekday, dayBlocks, sigKey });
    }

    // 4. Agrupar por (weekday + firma)
    const grouped = new Map();
    for (const info of dateInfos) {
      const groupKey = `${info.weekday}||${info.sigKey}`;
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          weekday: info.weekday,
          sigKey: info.sigKey,
          dates: [],
          blocks: info.dayBlocks
        });
      }
      grouped.get(groupKey).dates.push(info.date);
    }

    // 5. Construir columnas ordenadas por primera fecha
    const columns = [];
    for (const g of grouped.values()) {
      g.dates.sort((a, b) => a - b);
      g.blocksByTime = new Map();
      for (const b of g.blocks) {
        g.blocksByTime.set(b.timeKey, b);
      }
      columns.push(g);
    }
    columns.sort((a, b) => a.dates[0] - b.dates[0]);

    // 6. Computar runs (merge de bloques clase contiguos del mismo curso Y misma sesión)
    for (const col of columns) {
      col.runs = [];
      let i = 0;
      while (i < allTimeSlots.length) {
        const tk = allTimeSlots[i];
        const b = col.blocksByTime.get(tk);
        if (!b || b.tipo !== 'clase' || !b.idGrupoCurso) { i++; continue; }
        let endSlot = i;
        let j = i + 1;
        while (j < allTimeSlots.length) {
          const nextTk = allTimeSlots[j];
          const nextB = col.blocksByTime.get(nextTk);
          if (nextB && nextB.tipo === 'clase' && nextB.idGrupoCurso &&
              nextB.idGrupoCurso === b.idGrupoCurso &&
              nextB.idSesion === b.idSesion) {
            endSlot = j;
            j++;
          } else {
            break;
          }
        }
        if (endSlot > i) {
          col.runs.push({ startSlot: i, endSlot, key: b.key });
        }
        i = endSlot > i ? j : i + 1;
      }
    }

    return { columns, allTimeSlots };
  }, [sesiones, snapshotBloques]);

  if (!sesiones || sesiones.length === 0) {
    return (
      <div className="p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="mt-3 text-gray-500 font-medium">Sin sesiones</p>
        <p className="mt-1 text-sm text-gray-400">No se encontraron sesiones para este grupo.</p>
      </div>
    );
  }

  if (columns.length === 0 || allTimeSlots.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        No se pudieron extraer bloques de las sesiones.
      </div>
    );
  }

  const findRun = (runs, slotIdx) => runs.find(r => slotIdx >= r.startSlot && slotIdx <= r.endSlot);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-[#2D366F] text-white px-3 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap border border-[#2D366F]">
              Bloque
            </th>
            {columns.map((col, idx) => (
              <th
                key={`col-${idx}`}
                className="bg-[#2D366F] text-white px-3 py-2 text-center border border-[#2D366F] min-w-[150px]"
              >
                <div className="font-bold text-xs uppercase tracking-wider">
                  {WEEKDAY_NAMES[col.weekday]}
                </div>
                <div className="text-[10px] font-normal text-blue-200 mt-1 leading-tight whitespace-pre-line">
                  {col.dates.map(formatDateShort).join('\n')}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allTimeSlots.map((timeKey, rowIdx) => {
            const [horaIni, horaFin] = timeKey.split('-');

            return (
              <tr key={`row-${rowIdx}`}>
                <td
                  className="sticky left-0 z-10 bg-white p-3 text-xs border border-slate-200 border-r-2 border-slate-300 w-28 align-middle"
                >
                  <div className="font-mono text-slate-500 leading-tight">
                    {formatTime(horaIni)} – {formatTime(horaFin)}
                  </div>
                </td>

                {columns.map((col, colIdx) => {
                  const colBlock = col.blocksByTime.get(timeKey);
                  const run = findRun(col.runs, rowIdx);

                  // Si es parte de un run pero no es el inicio, no renderizar
                  if (run && rowIdx !== run.startSlot) {
                    return null;
                  }

                  // Sin bloque en esta columna para este tiempo (no debería pasar, todas las columnas tienen el template)
                  if (!colBlock) {
                    return (
                      <td
                        key={`cell-${colIdx}-${rowIdx}`}
                        className="p-0 border-b border-r border-slate-200 bg-white relative overflow-hidden min-w-[100px]"
                      >
                        <div className="min-h-[72px] w-full" />
                      </td>
                    );
                  }

                  // Break
                  if (colBlock.tipo === 'break') {
                    return (
                      <td
                        key={`cell-${colIdx}-${rowIdx}`}
                        className="border-b border-r border-slate-200 bg-gray-50 text-center py-2 min-w-[100px]"
                      >
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
                          ☕ Break
                        </span>
                      </td>
                    );
                  }

                  // Clase vacía (slot del template sin sesión)
                  if (!colBlock.idGrupoCurso) {
                    return (
                      <td
                        key={`cell-${colIdx}-${rowIdx}`}
                        className="p-0 border-b border-r border-slate-200 bg-white relative overflow-hidden min-w-[100px]"
                        rowSpan={run ? (run.endSlot - run.startSlot + 1) : 1}
                      >
                        <div className="min-h-[72px] w-full" />
                      </td>
                    );
                  }

                  // Clase con curso
                  const rowSpan = run ? (run.endSlot - run.startSlot + 1) : 1;
                  const startBlock = run
                    ? col.blocksByTime.get(allTimeSlots[run.startSlot])
                    : colBlock;
                  const endBlock = run
                    ? col.blocksByTime.get(allTimeSlots[run.endSlot])
                    : colBlock;
                  const cursoColor = colBlock.color || '#64748b';

                  return (
                    <td
                      key={`cell-${colIdx}-${rowIdx}`}
                      className="p-0 border-b border-r border-slate-200 relative min-w-[100px] align-middle"
                      rowSpan={rowSpan}
                      style={{ backgroundColor: hexToRgba(cursoColor, 0.20) }}
                    >
                      <div className="flex flex-col items-center justify-center h-full min-h-[72px] px-2 py-1.5 text-center">
                        <span className="text-xs font-semibold text-gray-900 leading-tight whitespace-normal break-words">
                          {colBlock.curso}
                        </span>
                        <span className="text-[10px] text-gray-700 leading-tight mt-0.5 whitespace-normal break-words">
                          {colBlock.docente || 'Sin docente'}
                        </span>
                        {startBlock && endBlock && (
                          <span className="text-[10px] text-gray-500 leading-tight mt-1 font-mono">
                            {formatTime(startBlock.horaInicio)} – {formatTime(endBlock.horaFin)}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default SesionesHorarioView;
