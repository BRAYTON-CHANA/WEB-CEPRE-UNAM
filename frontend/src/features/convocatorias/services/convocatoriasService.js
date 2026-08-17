import { db } from '@/shared/api';

// ===== CRUD CONVOCATORIA =====
export const createConvocatoria = (data) => db.insert('CONVOCATORIA', data);
export const updateConvocatoria = (id, data) => db.update('CONVOCATORIA', id, data, 'ID_CONVOCATORIA');
export const deleteConvocatoria = (id) => db.delete('CONVOCATORIA', id, 'ID_CONVOCATORIA');

// ===== CRUD CONVOCATORIA_CURSO =====
export const createConvocatoriaCurso = (data) => db.insert('CONVOCATORIA_CURSO', data);
export const updateConvocatoriaCurso = (id, data) => db.update('CONVOCATORIA_CURSO', id, data, 'ID_CONVOCATORIA_CURSO');
export const deleteConvocatoriaCurso = (id) => db.delete('CONVOCATORIA_CURSO', id, 'ID_CONVOCATORIA_CURSO');

// ===== Funciones SQL =====

/**
 * Plazas (slots) disponibles para asignar en una convocatoria_curso.
 * @param {number} idConvocatoriaCurso
 * @returns {Promise<Array<{id_plaza_docente, modalidad, pago_por_hora, identificador}>>}
 */
export const getPlazasDisponibles = (idConvocatoriaCurso) =>
  db.executeFunction('fn_plazas_disponibles_convocatoria_curso', {
    p_id_convocatoria_curso: idConvocatoriaCurso
  });

/**
 * Asigna una plaza disponible a una postulación.
 * Valida que la plaza pertenece a la misma convocatoria_curso.
 * Marca ACEPTADO=true, ESTADO='contratado'.
 * @param {number} idPostulacion
 * @param {number} idPlazaDocente
 */
export const asignarPlazaPostulacion = (idPostulacion, idPlazaDocente) =>
  db.executeFunction('fn_asignar_plaza_postulacion', {
    p_id_postulacion: idPostulacion,
    p_id_plaza_docente: idPlazaDocente
  });

/**
 * Libera la plaza asignada a una postulación (renuncia).
 * Pone ID_PLAZA_DOCENTE=null, ESTADO='descartado', ACEPTADO=false.
 * @param {number} idPostulacion
 */
export const liberarPlazaPostulacion = (idPostulacion) =>
  db.executeFunction('fn_liberar_plaza_postulacion', {
    p_id_postulacion: idPostulacion
  });

/**
 * Docentes disponibles para postular a una convocatoria_curso.
 * Excluye docentes que ya tienen postulación activa.
 * @param {number} idConvocatoriaCurso
 * @param {number|null} idDocenteActual - al editar, incluye al docente actual marcado como 'ACTUAL'
 */
export const getDocentesDisponibles = (idConvocatoriaCurso, idDocenteActual = null) =>
  db.executeFunction('fn_docentes_disponibles_convocatoria_curso', {
    p_id_convocatoria_curso: idConvocatoriaCurso,
    p_id_docente_actual: idDocenteActual
  });

/**
 * Periodos activos que NO tienen convocatoria asignada.
 * Usado en el formulario de creación de convocatoria (paso 1).
 * @returns {Promise<Array<{id_periodo, codigo_periodo, nombre_periodo, fecha_inicio, fecha_fin, activo}>>}
 */
export const getPeriodosSinConvocatoria = () =>
  db.executeFunction('fn_periodos_sin_convocatoria', {});
