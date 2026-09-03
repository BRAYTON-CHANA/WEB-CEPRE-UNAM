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
 * Docentes disponibles para postular a una convocatoria_curso.
 * Excluye docentes que ya tienen postulación activa.
 * @param {number} idConvocatoriaCurso
 * @param {number|null} idDocenteActual - al editar, incluye al docente actual marcado como 'ACTUAL'
 */
// COMMENTED: Reemplazado por reference-select a VW_DOCENTES con filtros
// DOCENTE_ACTIVO=true y USUARIO_ACTIVO=true en el frontend.
/*
export const getDocentesDisponibles = (idConvocatoriaCurso, idDocenteActual = null) =>
  db.executeFunction('fn_docentes_disponibles_convocatoria_curso', {
    p_id_convocatoria_curso: idConvocatoriaCurso,
    p_id_docente_actual: idDocenteActual
  });
*/

/**
 * Periodos activos que NO tienen convocatoria asignada.
 * Usado en el formulario de creación de convocatoria (paso 1).
 * @returns {Promise<Array<{id_periodo, codigo_periodo, nombre_periodo, fecha_inicio, fecha_fin, activo}>>}
 */
export const getPeriodosSinConvocatoria = () =>
  db.executeFunction('fn_periodos_sin_convocatoria', {});
