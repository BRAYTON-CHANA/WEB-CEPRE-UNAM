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
 * Transforma los records de VW_PROGRAMACION_GRUPO_COMPLETA a blocks + matrix + cellEvents
 */
export const transformRecords = (records) => {
  resetCourseColors();
  const first = records[0];

  let mat = first.MATRIZ_DIAS;
  if (typeof mat === 'string') {
    try { mat = JSON.parse(mat); } catch { mat = []; }
  }
  const matrix = Array.isArray(mat) ? mat : [];

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

  // cellEvents: key = "colIdx-bloqueOrden" (colIdx = DIA_IDX - 1, 0-based)
  const cellEvents = {};
  records.forEach(r => {
    if (r.TIPO_BLOQUE === 'break') return;
    if (!r.CURSO_ASIGNADO && !r.ID_GRUPO_PLAN_CURSO) return;
    const colIdx = r.DIA_IDX - 1;
    const key = `${colIdx}-${r.BLOQUE_ORDEN}`;
    cellEvents[key] = {
      label:           r.CURSO_ASIGNADO || '',
      group:           `${r.CODIGO_GRUPO} - ${r.NOMBRE_GRUPO}`,
      description:     r.DOCENTE_ASIGNADO || '',
      color:           getCourseColor(String(r.ID_GRUPO_PLAN_CURSO)),
      idProgramacion:  r.ID_PROGRAMACION,
      idBloque:        r.ID_BLOQUE,
      idGrupoPlanCurso: r.ID_GRUPO_PLAN_CURSO
    };
  });

  const grupoNombre = `${first.CODIGO_GRUPO} - ${first.NOMBRE_GRUPO}`;

  return { blocks, matrix, grupoNombre, cellEvents };
};
