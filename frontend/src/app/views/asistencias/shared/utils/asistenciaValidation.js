/**
 * Validaciones para el formulario de asistencia docente
 * Fase 1: Validaciones básicas
 */

export const asistenciaValidation = {
  ID_DOCENTE_ASISTIO: {
    required: { value: false, message: 'Debe seleccionar un docente o indicar suplente externo' }
  },
  HORA_ENTRADA_REAL: {
    required: { value: false, message: 'La hora de entrada es obligatoria si marcó asistencia' }
  },
  HORA_SALIDA_REAL: {
    required: { value: false, message: 'La hora de salida es obligatoria si marcó asistencia' }
  },
  MOTIVO_FALTA: {
    required: { value: false, message: 'El motivo de falta es obligatorio si no asistió' }
  }
};

/**
 * Validación condicional personalizada
 * @param {Object} values - Valores del formulario
 * @returns {Object} - Errores por campo
 */
export const validateAsistenciaCondicional = (values) => {
  const errors = {};

  // Determinar si asistió alguien
  const asistioDocenteProgramado = values.ASISTIO_DOCENTE === true;
  const haySuplente = values.ES_SUPLENTE === true;
  const tipoSuplenteInterno = values.TIPO_SUPLENTE === 'interno';
  const tipoSuplenteExterno = values.TIPO_SUPLENTE === 'externo';
  
  const asistioAlguien = asistioDocenteProgramado || haySuplente;

  // Si asistió alguien, hora de entrada es obligatoria
  if (asistioAlguien && !values.HORA_ENTRADA_REAL) {
    errors.HORA_ENTRADA_REAL = 'La hora de entrada es obligatoria';
  }

  // Si asistió alguien, hora de salida es obligatoria
  if (asistioAlguien && !values.HORA_SALIDA_REAL) {
    errors.HORA_SALIDA_REAL = 'La hora de salida es obligatoria';
  }

  // Si NO asistió nadie, motivo de falta es obligatorio
  if (!asistioAlguien && !values.MOTIVO_FALTA) {
    errors.MOTIVO_FALTA = 'Debe indicar el motivo de la falta';
  }

  // Si hay suplente interno, debe seleccionar un docente
  if (haySuplente && tipoSuplenteInterno && (!values.ID_DOCENTE_ASISTIO || values.ID_DOCENTE_ASISTIO === '')) {
    errors.ID_DOCENTE_ASISTIO = 'Debe seleccionar un docente suplente';
  }

  // Si hay suplente externo, debe indicar el nombre
  if (haySuplente && tipoSuplenteExterno && (!values.NOMBRE_SUPLENTE_EXTERNO || values.NOMBRE_SUPLENTE_EXTERNO.trim() === '')) {
    errors.NOMBRE_SUPLENTE_EXTERNO = 'Debe indicar el nombre del suplente';
  }

  return errors;
};
