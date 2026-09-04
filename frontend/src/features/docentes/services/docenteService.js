import { db } from '@/shared/api';
import { authService } from '@/features/login/services/authService';
import cacheService from '@/shared/services/cacheService';
import { uploadDniFile } from '@/features/usuarios/services/usuariosStorageService';
import { uploadDocenteFile, DOCENTE_ARCHIVO_TIPOS } from '@/features/docentes/services/docentesStorageService';

/**
 * Campos de usuario que se manejan en el formulario de docentes.
 */
const USUARIO_FIELDS = [
  'DNI', 'DNI_FECHA_VENCIMIENTO', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 'NOMBRES', 'SEXO',
  'EMAIL', 'TELEFONO', 'TELEFONO_OPCIONAL', 'FECHA_NACIMIENTO',
  'DIRECCION', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO',
  'REF_DOM', 'DISCAPACIDAD', 'TIPO_DISCAPACIDAD', 'NRO_CONADIS'
];

/**
 * Construye el payload de usuario desde formData.
 */
const buildUsuarioPayload = (formData) => {
  const payload = {};
  USUARIO_FIELDS.forEach(field => {
    const val = formData[field];
    if (val !== undefined && val !== '') {
      payload[field] = val;
    } else if (field !== 'DISCAPACIDAD') {
      payload[field] = null;
    }
  });
  payload.DISCAPACIDAD = formData.DISCAPACIDAD || false;
  if (payload.FECHA_NACIMIENTO === '') payload.FECHA_NACIMIENTO = null;
  if (payload.DNI_FECHA_VENCIMIENTO === '') payload.DNI_FECHA_VENCIMIENTO = null;
  return payload;
};

/**
 * Extrae un File de un campo de archivo del formData.
 * El FileInput guarda el valor como [File] o File.
 */
const extractFile = (formData, fieldName) => {
  const val = formData[fieldName];
  if (!val) return null;
  if (val instanceof File) return val;
  if (Array.isArray(val)) return val[0] instanceof File ? val[0] : null;
  return null;
};

/**
 * Sube el archivo de DNI si existe y actualiza la metadata en USUARIOS.
 */
async function subirDniSiExiste(idUsuario, formData) {
  const dniFile = extractFile(formData, 'DNI_ARCHIVO');
  if (!dniFile || !idUsuario) return;
  try {
    const uploadResult = await uploadDniFile(idUsuario, dniFile);
    await db.update('USUARIOS', idUsuario, {
      DNI_STORAGE_PATH: uploadResult.path,
      DNI_FILENAME: uploadResult.filename,
      DNI_CONTENT_TYPE: uploadResult.contentType,
      DNI_TAMAÑO_BYTES: uploadResult.size
    }, 'ID_USUARIO');
  } catch (err) {
    console.error('[docenteService] Error subiendo DNI:', err);
  }
}

/**
 * Guarda el usuario (página 1 del formulario de docentes).
 *
 * - Modo 'seleccionar': actualiza el usuario existente.
 * - Modo 'crear': registra un nuevo usuario via authService.
 * - Modo 'editar' (edit docente): actualiza el usuario existente.
 *
 * @param {Object} formData - Datos del formulario.
 * @returns {Promise<number>} - ID_USUARIO guardado.
 */
export async function guardarUsuarioDocente(formData) {
  const modo = formData._modo_usuario;
  const isEdit = modo === 'editar' || (modo === 'seleccionar' && formData.ID_USUARIO);

  // Modo seleccionar existente o editar: actualizar
  if (isEdit && formData.ID_USUARIO) {
    const payload = buildUsuarioPayload(formData);
    await db.update('USUARIOS', formData.ID_USUARIO, payload, 'ID_USUARIO');
    await subirDniSiExiste(formData.ID_USUARIO, formData);
    cacheService.invalidateAll();
    return formData.ID_USUARIO;
  }

  // Modo crear nuevo usuario
  if (modo === 'crear') {
    const payload = buildUsuarioPayload(formData);
    const registerPayload = {
      dni: payload.DNI,
      apellido_paterno: payload.APELLIDO_PATERNO,
      apellido_materno: payload.APELLIDO_MATERNO || null,
      nombres: payload.NOMBRES,
      password: payload.DNI, // password inicial = DNI
      email: payload.EMAIL || null,
      telefono: payload.TELEFONO || null,
      telefono_opcional: payload.TELEFONO_OPCIONAL || null,
      direccion: payload.DIRECCION || null,
      departamento: payload.DEPARTAMENTO || null,
      provincia: payload.PROVINCIA || null,
      distrito: payload.DISTRITO || null,
      ref_dom: payload.REF_DOM || null,
      fecha_nacimiento: payload.FECHA_NACIMIENTO || null,
      sexo: payload.SEXO || null,
      discapacidad: payload.DISCAPACIDAD || false,
      tipo_discapacidad: payload.TIPO_DISCAPACIDAD || null,
      nro_conadis: payload.NRO_CONADIS || null,
      dni_fecha_vencimiento: payload.DNI_FECHA_VENCIMIENTO || null,
      id_roles: []
    };
    const result = await authService.register(registerPayload);
    const newId = result?.id_usuario ?? result?.ID_USUARIO;
    if (!newId) throw new Error('No se pudo obtener el ID del usuario creado');
    await subirDniSiExiste(newId, formData);
    cacheService.invalidateAll();
    return newId;
  }

  throw new Error('No se pudo determinar cómo guardar el usuario');
}

/**
 * Sube un archivo de docente si existe y retorna la metadata para actualizar DOCENTES.
 */
async function subirArchivoDocente(idUsuario, formData, fieldName, tipoDoc) {
  const file = extractFile(formData, fieldName);
  if (!file || !idUsuario) return null;
  try {
    return await uploadDocenteFile(idUsuario, file, tipoDoc);
  } catch (err) {
    console.error(`[docenteService] Error subiendo ${fieldName}:`, err);
    return null;
  }
}

/**
 * Guarda el docente (página 2 del formulario de docentes).
 *
 * @param {Object} formData - Datos del formulario.
 * @param {number} idUsuario - ID_USUARIO ya guardado.
 * @param {number|null} idDocente - ID_DOCENTE (modo edit) o null (modo create).
 * @returns {Promise<number>} - ID_DOCENTE guardado.
 */
export async function guardarDocente(formData, idUsuario, idDocente = null) {
  const payload = {
    ID_USUARIO: idUsuario,
    RUC: formData.RUC,
    CONDICION_LABORAL: formData.CONDICION_LABORAL,
    ACTIVO: formData.ACTIVO !== undefined ? formData.ACTIVO : true
  };

  if (formData.GRADO_ACADEMICO) payload.GRADO_ACADEMICO = formData.GRADO_ACADEMICO;
  if (formData.GRADO_ACADEMICO_DESCRIPCION) payload.GRADO_ACADEMICO_DESCRIPCION = formData.GRADO_ACADEMICO_DESCRIPCION;

  // Subir archivos de docente (grado/título, constancia)
  const [gradoUpload, constanciaUpload] = await Promise.all([
    subirArchivoDocente(idUsuario, formData, 'GRADO_ACADEMICO_ARCHIVO', DOCENTE_ARCHIVO_TIPOS.GRADO_ACADEMICO),
    subirArchivoDocente(idUsuario, formData, 'CONSTANCIA_SUNEDU_DRE_ARCHIVO', DOCENTE_ARCHIVO_TIPOS.CONSTANCIA_SUNEDU_DRE),
  ]);

  if (gradoUpload) {
    payload.GRADO_ACADEMICO_STORAGE_PATH = gradoUpload.path;
    payload.GRADO_ACADEMICO_FILENAME = gradoUpload.filename;
    payload.GRADO_ACADEMICO_CONTENT_TYPE = gradoUpload.contentType;
    payload.GRADO_ACADEMICO_TAMAÑO_BYTES = gradoUpload.size;
  }
  if (constanciaUpload) {
    payload.CONSTANCIA_SUNEDU_DRE_STORAGE_PATH = constanciaUpload.path;
    payload.CONSTANCIA_SUNEDU_DRE_FILENAME = constanciaUpload.filename;
    payload.CONSTANCIA_SUNEDU_DRE_CONTENT_TYPE = constanciaUpload.contentType;
    payload.CONSTANCIA_SUNEDU_DRE_TAMAÑO_BYTES = constanciaUpload.size;
  }

  if (idDocente) {
    // Actualizar docente existente
    await db.update('DOCENTES', idDocente, payload, 'ID_DOCENTE');
    cacheService.invalidateAll();
    return idDocente;
  }

  // Crear nuevo docente
  const result = await db.insert('DOCENTES', payload);
  cacheService.invalidateAll();
  const newId = result?.ID_DOCENTE ?? result?.id_docente;
  return newId;
}

/**
 * Carga los datos completos de un usuario por ID.
 * Usado en modo edit para obtener todos los campos de USUARIOS.
 *
 * @param {number} idUsuario - ID_USUARIO
 * @returns {Promise<Object>} - Datos del usuario
 */
export async function cargarUsuario(idUsuario) {
  return await db.getById('USUARIOS', idUsuario, 'ID_USUARIO');
}

/**
 * Carga las 4 tablas hijas de un docente en una sola consulta.
 * Usa fn_get_tablas_docente (1 round-trip en vez de 4).
 *
 * @param {number} idDocente - ID_DOCENTE
 * @returns {Promise<Object>} - { formacion: [], capacitaciones: [], idiomas: [], experiencia: [] }
 */
export async function getTablasDocente(idDocente) {
  if (!idDocente) return { formacion: [], capacitaciones: [], idiomas: [], experiencia: [] };
  const result = await db.executeFunction('fn_get_tablas_docente', { p_id_docente: idDocente });
  return result || { formacion: [], capacitaciones: [], idiomas: [], experiencia: [] };
}

/**
 * Guarda el docente + 4 tablas hijas en una sola transacción SQL.
 * Usa fn_guardar_docente_completo (rollback automático si algo falla).
 *
 * @param {Object} formData - Datos del formulario (página 2).
 * @param {number} idUsuario - ID_USUARIO ya guardado.
 * @param {number|null} idDocente - ID_DOCENTE (modo edit) o null (modo create).
 * @param {Object} tablasData - { formacion: [], capacitaciones: [], idiomas: [], experiencia: [] }
 * @param {Object} archivosMetadata - metadata de archivos ya subidos (grado, titulo, constancia)
 * @returns {Promise<Object>} - { id_docente, filas_hijas }
 */
export async function guardarDocenteCompleto(formData, idUsuario, idDocente, tablasData, archivosMetadata = {}) {
  const p_docente = {
    RUC: formData.RUC,
    CONDICION_LABORAL: formData.CONDICION_LABORAL,
    GRADO_ACADEMICO: formData.GRADO_ACADEMICO || '',
    GRADO_ACADEMICO_DESCRIPCION: formData.GRADO_ACADEMICO_DESCRIPCION || '',
    ACTIVO: formData.ACTIVO !== undefined ? formData.ACTIVO : true,
    GRADO_ACADEMICO_STORAGE_PATH: archivosMetadata.grado?.path || '',
    GRADO_ACADEMICO_FILENAME: archivosMetadata.grado?.filename || '',
    GRADO_ACADEMICO_CONTENT_TYPE: archivosMetadata.grado?.contentType || '',
    GRADO_ACADEMICO_TAMAÑO_BYTES: archivosMetadata.grado?.size ? String(archivosMetadata.grado.size) : '',
    CONSTANCIA_SUNEDU_DRE_STORAGE_PATH: archivosMetadata.constancia?.path || '',
    CONSTANCIA_SUNEDU_DRE_FILENAME: archivosMetadata.constancia?.filename || '',
    CONSTANCIA_SUNEDU_DRE_CONTENT_TYPE: archivosMetadata.constancia?.contentType || '',
    CONSTANCIA_SUNEDU_DRE_TAMAÑO_BYTES: archivosMetadata.constancia?.size ? String(archivosMetadata.constancia.size) : ''
  };

  const result = await db.executeFunction('fn_guardar_docente_completo', {
    p_id_docente: idDocente || null,
    p_id_usuario: idUsuario,
    p_docente,
    p_formacion: tablasData.formacion || [],
    p_capacitaciones: tablasData.capacitaciones || [],
    p_idiomas: tablasData.idiomas || [],
    p_experiencia: tablasData.experiencia || []
  });

  // Nota: la invalidación de cache la manejan los callers (wizard, DocenteForm)
  return {
    id_docente: result?.id_docente,
    filas_hijas: result?.filas_hijas
  };
}

/**
 * Actualiza solo las 4 tablas hijas de un docente (sin tocar DOCENTES).
 * Usa fn_actualizar_tablas_docente (DELETE + INSERT en transacción).
 * Para el modal standalone de "Editar tablas relacionadas".
 *
 * @param {number} idDocente - ID_DOCENTE
 * @param {Object} tablasData - { formacion, capacitaciones, idiomas, experiencia }
 * @returns {Promise<Object>} - { id_docente, filas_hijas }
 */
export async function actualizarTablasDocente(idDocente, tablasData) {
  const result = await db.executeFunction('fn_actualizar_tablas_docente', {
    p_id_docente: idDocente,
    p_formacion: tablasData.formacion || [],
    p_capacitaciones: tablasData.capacitaciones || [],
    p_idiomas: tablasData.idiomas || [],
    p_experiencia: tablasData.experiencia || []
  });
  cacheService.invalidateAll();
  return {
    id_docente: result?.id_docente,
    filas_hijas: result?.filas_hijas
  };
}

/**
 * Sube los 2 archivos de docente (grado/título, constancia) a Storage.
 * Retorna metadata lista para pasar a guardarDocenteCompleto.
 *
 * @param {number} idUsuario - ID_USUARIO
 * @param {Object} formData - Datos del formulario
 * @returns {Promise<Object>} - { grado, constancia } (cada uno null o { path, filename, contentType, size })
 */
export async function subirArchivosDocente(idUsuario, formData) {
  const [grado, constancia] = await Promise.all([
    subirArchivoDocente(idUsuario, formData, 'GRADO_ACADEMICO_ARCHIVO', DOCENTE_ARCHIVO_TIPOS.GRADO_ACADEMICO),
    subirArchivoDocente(idUsuario, formData, 'CONSTANCIA_SUNEDU_DRE_ARCHIVO', DOCENTE_ARCHIVO_TIPOS.CONSTANCIA_SUNEDU_DRE),
  ]);
  return { grado, constancia };
}

export default { guardarUsuarioDocente, guardarDocente, cargarUsuario, guardarDocenteCompleto, actualizarTablasDocente, subirArchivosDocente };
