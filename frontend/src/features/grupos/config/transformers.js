/**
 * Helpers de transformación de datos para ProgramacionGrupoConfig
 */

const formatTime = (hour, minute = 0) =>
  `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

/**
 * Genera bloques con timeRange a partir de una lista de bloques raw y hora de inicio
 */
export const generateBlockTimeRanges = (blocks, startHour) => {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];
  let currentMinute = startHour * 60;
  return blocks.map((block, index) => {
    const { duration, type, label } = block;
    const hour = Math.floor(currentMinute / 60);
    const minute = currentMinute % 60;
    const blockEndMinute = currentMinute + duration;
    const endHour = Math.floor(blockEndMinute / 60);
    const endMinute = blockEndMinute % 60;
    currentMinute = blockEndMinute;
    return {
      duration,
      type,
      label: label || `Bloque ${index + 1}`,
      timeRange: `${formatTime(hour, minute)} - ${formatTime(endHour, endMinute)}`,
      time: formatTime(hour, minute),
      endTime: formatTime(endHour, endMinute),
      orden: block.orden,
      key: `block-${index}-${hour}-${minute}`
    };
  });
};

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

let colorIndex = 0;
const courseColorMap = {};

export const getCourseColor = (key) => {
  if (!courseColorMap[key]) {
    courseColorMap[key] = COLORS[colorIndex % COLORS.length];
    colorIndex++;
  }
  return courseColorMap[key];
};

export const resetCourseColors = () => {
  Object.keys(courseColorMap).forEach(k => delete courseColorMap[k]);
  colorIndex = 0;
};

/**
 * Transforma los records de fn_obtener_programacion_grupo a blocks + matrix + cellEvents.
 * Modelo por columna: cada DIA es una posición de la MATRIZ_DIAS del turno
 * (fila = semana, columna = día). Una asignación cubre todas las semanas de la columna.
 * La matrix retornada es sintética de 1 fila: ['Día 1', 'Día 2', ...]
 * (las fechas reales se muestran vía columnDates).
 */
export const transformRecords = (records) => {
  resetCourseColors();
  const first = records[0];

  let mat = first.MATRIZ_DIAS;
  if (typeof mat === 'string') {
    try { mat = JSON.parse(mat); } catch { mat = []; }
  }
  const rawMatriz = Array.isArray(mat) ? mat : [];
  const numCols = rawMatriz.length > 0 && Array.isArray(rawMatriz[0]) ? rawMatriz[0].length : 0;
  const matrix = [Array.from({ length: numCols }, (_, i) => `Día ${i + 1}`)];

  // columnDates[colIdx] = fechas de esa columna (una por semana/fila no-nula de MATRIZ_DIAS).
  // Solo se formatean valores 'YYYY-MM-DD' — si la BD devuelve INTEGER[][] viejo, quedan vacías.
  const columnDates = Array.from({ length: numCols }, (_, colIdx) => {
    const fechas = [];
    rawMatriz.forEach(fila => {
      const v = Array.isArray(fila) ? fila[colIdx] : null;
      const m = typeof v === 'string' ? v.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
      if (!m) return;
      const fechaLocal = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      fechas.push(fechaLocal.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }));
    });
    return fechas;
  });

  const startTimeParts = first.HORA_INICIO_JORNADA.split(':');
  const startHour = parseInt(startTimeParts[0]) + parseInt(startTimeParts[1]) / 60;

  const seenBlocks = new Set();
  const rawBlocks = [];
  [...records]
    .sort((a, b) => a.BLOQUE_ORDEN - b.BLOQUE_ORDEN)
    .forEach(r => {
      if (!seenBlocks.has(r.BLOQUE_ORDEN)) {
        seenBlocks.add(r.BLOQUE_ORDEN);
        rawBlocks.push({
          duration: r.DURACION,
          type: r.TIPO_BLOQUE || 'clase',
          label: r.ETIQUETA || `Bloque ${r.BLOQUE_ORDEN}`,
          orden: r.BLOQUE_ORDEN,
          idBloque: r.ID_BLOQUE
        });
      }
    });

  const blocks = generateBlockTimeRanges(rawBlocks, startHour);

  // cellEvents: key = "colIdx-bloqueOrden" (colIdx = DIA - 1, 0-based; DIA = columna de MATRIZ_DIAS)
  const cellEvents = {};
  records.forEach(r => {
    if (r.TIPO_BLOQUE === 'break') return;
    if (!r.CURSO_ASIGNADO && !r.ID_GRUPO_CURSO) return;
    const colIdx = r.DIA - 1;
    const key = `${colIdx}-${r.BLOQUE_ORDEN}`;

    // 🎨 Usar color del curso si está definido, sino asignar color aleatorio
    const courseColor = r.CURSO_COLOR || getCourseColor(String(r.ID_GRUPO_CURSO));

    cellEvents[key] = {
      label:           r.CURSO_ASIGNADO || '',
      group:           `${r.CODIGO_GRUPO} - ${r.NOMBRE_GRUPO}`,
      description:     r.DOCENTE_ASIGNADO || '',
      color:           courseColor,
      idProgramacion:  r.ID_PROGRAMACION,
      idBloque:        r.ID_BLOQUE,
      dia:             r.DIA,
      idGrupoCurso:    r.ID_GRUPO_CURSO
    };
  });

  const grupoNombre = `${first.CODIGO_GRUPO} - ${first.NOMBRE_GRUPO}`;

  return { blocks, matrix, grupoNombre, cellEvents, columnDates };
};
