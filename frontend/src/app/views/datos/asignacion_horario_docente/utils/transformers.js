/**
 * Transformers para vista Asignación por Docente
 */

/**
 * Parse fecha de formato "DD/MM/YYYY" a Date
 */
export const parseDate = (dateString) => {
  const parts = dateString.split('/');
  return new Date(parts[2], parts[1] - 1, parts[0]);
};

/**
 * Transform VW_HORARIO_BLOQUES response a customBlocks del Calendar
 */
export const transformToCustomBlocks = (apiResponse) => {
  if (!apiResponse?.data?.records || !Array.isArray(apiResponse.data.records)) {
    return [];
  }
  return apiResponse.data.records
    .sort((a, b) => a.ORDEN - b.ORDEN)
    .map(record => ({
      duration: record.DURACION,
      type: record.TIPO_BLOQUE,
      label: record.ETIQUETA || `Bloque ${record.ORDEN}`
    }));
};

// Paleta fija para color estable por grupo
const GRUPO_COLORS = [
  '#3B82F6', // azul
  '#10B981', // verde
  '#F59E0B', // ámbar
  '#EF4444', // rojo
  '#8B5CF6', // violeta
  '#EC4899', // rosa
  '#14B8A6', // teal
  '#F97316', // naranja
  '#6366F1', // índigo
  '#84CC16'  // lima
];

export const colorPorGrupo = (idGrupo) => {
  const idx = Math.abs(Number(idGrupo) || 0) % GRUPO_COLORS.length;
  return GRUPO_COLORS[idx];
};

/**
 * Transform VW_ASIGNACION_HORARIO a eventos del Calendar (vista por docente).
 * Incluye Grupo + Curso + Aula en el título / descripción.
 */
export const transformToEventsDocente = (asignacionData) => {
  if (!asignacionData?.data?.records || !Array.isArray(asignacionData.data.records)) {
    return [];
  }

  return asignacionData.data.records
    .filter(record => record.TIPO_BLOQUE === 'clase')
    .map(record => {
      const aula = record.NOMBRE_AULA || record.DENOMINACION_AULA || 'Aula ?';
      return {
        id: `asig-doc-${record.ID_ASIGNACION_HORARIO}`,
        date: parseDate(record.FECHA),
        blockIndices: [record.ORDEN - 1],
        title: `${record.CODIGO_GRUPO} | ${record.NOMBRE_CURSO}`,
        type: 'clase',
        color: colorPorGrupo(record.ID_GRUPO),
        description: [
          `Grupo: ${record.NOMBRE_GRUPO}`,
          `Curso: ${record.NOMBRE_CURSO}`,
          `Aula: ${aula}`,
          `Turno: ${record.NOMBRE_TURNO}`
        ].join('\n')
      };
    });
};
