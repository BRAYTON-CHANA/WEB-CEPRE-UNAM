import { getRandomColor } from '@/features/schedule/hooks/useCalendar';

/**
 * Parse fecha de formato "23/04/2026" a Date
 */
export const parseDate = (dateString) => {
  const parts = dateString.split('/');
  return new Date(parts[2], parts[1] - 1, parts[0]);
};

/**
 * Transform VW_HORARIO_BLOQUES response to custom blocks format
 */
export const transformToCustomBlocks = (apiResponse) => {
  if (!apiResponse?.data?.records || !Array.isArray(apiResponse.data.records)) {
    return [];
  }

  return apiResponse.data.records
    .sort((a, b) => a.ORDEN - b.ORDEN)
    .map(record => ({
      idBloque: record.ID_BLOQUE,
      duration: record.DURACION,
      type: record.TIPO_BLOQUE,
      label: record.ETIQUETA || `Bloque ${record.ORDEN}`
    }));
};

/**
 * Transform VW_ASIGNACION_HORARIO to Calendar events format
 */
export const transformToEvents = (asignacionData) => {
  if (!asignacionData?.data?.records || !Array.isArray(asignacionData.data.records)) {
    return [];
  }

  return asignacionData.data.records
    .filter(record => record.TIPO_BLOQUE === 'clase')
    .map(record => {
      const cursoLine = `${record.CODIGO_COMPARTIDO} - ${record.NOMBRE_CURSO}`;
      return {
        id: `asignacion-${record.ID_ASIGNACION_HORARIO}`,
        date: parseDate(record.FECHA),
        blockIndices: [record.ORDEN - 1],
        title: `${record.CODIGO_COMPARTIDO} - ${record.NOMBRE_CURSO}`,
        type: 'clase',
        color: getRandomColor(),
        description: record.NOMBRE_COMPLETO_DOCENTE
          ? `${cursoLine}\nGrupo: ${record.NOMBRE_GRUPO}\nDocente: ${record.NOMBRE_COMPLETO_DOCENTE}`
          : `${cursoLine}\nGrupo: ${record.NOMBRE_GRUPO}\nSin docente asignado`
      };
    });
};
