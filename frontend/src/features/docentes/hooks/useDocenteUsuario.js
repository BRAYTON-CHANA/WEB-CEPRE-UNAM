import { useCallback, useEffect, useState } from 'react';
import { cargarUsuario } from '@/features/docentes/services/docenteService';

/**
 * Campos de usuario que se sincronizan al seleccionar/limpiar usuario.
 */
export const USUARIO_CAMPOS = [
  'DNI', 'DNI_FECHA_VENCIMIENTO', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 'NOMBRES', 'SEXO',
  'EMAIL', 'TELEFONO', 'TELEFONO_OPCIONAL', 'FECHA_NACIMIENTO',
  'DIRECCION', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO',
  'REF_DOM', 'DISCAPACIDAD', 'TIPO_DISCAPACIDAD', 'NRO_CONADIS'
];

/**
 * Construye el objeto DNI_ARCHIVO desde la metadata de un usuario.
 */
function buildDniArchivo(usuario) {
  if (!usuario?.DNI_STORAGE_PATH) return '';
  return {
    name: usuario.DNI_FILENAME || 'archivo.pdf',
    size: usuario.DNI_TAMAÑO_BYTES || 0,
    url: null,
    storagePath: usuario.DNI_STORAGE_PATH
  };
}

/**
 * Construye el objeto archivo (compatible con FileInput) desde la metadata
 * expuesta por VW_DOCENTES para un archivo de docente (grado, título, constancia).
 * @param {Object} row - Fila de VW_DOCENTES (o cualquier objeto con las columnas <prefix>_STORAGE_PATH, etc.)
 * @param {string} prefix - Prefijo de las columnas: 'GRADO_ACADEMICO' | 'CONSTANCIA_SUNEDU_DRE'
 * @returns {Object|string} Objeto archivo compatible con FileInput, o '' si no hay archivo.
 */
export function buildDocenteArchivo(row, prefix) {
  const storagePath = row?.[`${prefix}_STORAGE_PATH`];
  if (!storagePath) return '';
  return {
    name: row[`${prefix}_FILENAME`] || 'archivo.pdf',
    size: row[`${prefix}_TAMAÑO_BYTES`] || 0,
    url: null,
    storagePath
  };
}

/**
 * useDocenteUsuario — encapsula la lógica de selección/creación de usuario
 * en el DocenteForm (página 1).
 *
 * @param {Object} params
 * @param {Function} params.setFormData - setter del useFormState
 * @param {Function} params.setFieldValue - setter individual del useFormState
 * @param {string} params.mode - 'create' | 'edit'
 * @param {Object} params.formData - estado actual del form
 * @returns {{ handleUsuarioSeleccionado, handleFieldChange, handleModeChange }}
 */
export function useDocenteUsuario({ setFormData, setFieldValue, mode, formData }) {
  // ── Estado de carga del usuario seleccionado ──
  const [isLoadingUsuario, setIsLoadingUsuario] = useState(false);

  // ── Limpiar todos los campos de usuario ──
  const limpiarCamposUsuario = useCallback((extraData = {}) => {
    setFormData(prev => {
      const newData = { ...prev, ...extraData };
      USUARIO_CAMPOS.forEach(f => { newData[f] = ''; });
      newData.DNI_ARCHIVO = '';
      return newData;
    });
  }, [setFormData]);

  // ── Llenar campos desde un objeto usuario ──
  const llenarCamposUsuario = useCallback((usuario, extraData = {}) => {
    setFormData(prev => {
      const newData = { ...prev, ...extraData };
      USUARIO_CAMPOS.forEach(field => {
        newData[field] = usuario[field] !== null && usuario[field] !== undefined
          ? usuario[field] : '';
      });
      newData.DNI_ARCHIVO = buildDniArchivo(usuario);
      return newData;
    });
  }, [setFormData]);

  // ── Cuando se selecciona un usuario existente ──
  const handleUsuarioSeleccionado = useCallback((selectedIdUsuario) => {
    if (!selectedIdUsuario) {
      limpiarCamposUsuario({ ID_USUARIO: '', _usuario_seleccionado: '' });
      return;
    }
    setIsLoadingUsuario(true);
    cargarUsuario(selectedIdUsuario)
      .then(usuario => {
        if (usuario) {
          llenarCamposUsuario(usuario, {
            ID_USUARIO: selectedIdUsuario,
            _usuario_seleccionado: selectedIdUsuario
          });
        }
      })
      .catch(err => console.error('[useDocenteUsuario] Error cargando usuario:', err))
      .finally(() => setIsLoadingUsuario(false));
  }, [limpiarCamposUsuario, llenarCamposUsuario]);

  // ── Wrapper de onChange para interceptar _usuario_seleccionado ──
  const handleFieldChange = useCallback((fieldName, value) => {
    if (fieldName === '_usuario_seleccionado') {
      setFieldValue('_usuario_seleccionado', value);
      handleUsuarioSeleccionado(value);
    } else {
      setFieldValue(fieldName, value);
    }
  }, [handleUsuarioSeleccionado, setFieldValue]);

  // ── Cambiar modo (seleccionar ↔ crear) ──
  const handleModeChange = useCallback((newModo) => {
    setFieldValue('_modo_usuario', newModo);
    if (newModo === 'crear') {
      limpiarCamposUsuario({ _usuario_seleccionado: '', ID_USUARIO: '' });
    }
  }, [setFieldValue, limpiarCamposUsuario]);

  // ── Limpiar campos cuando se bloquea (modo seleccionar sin usuario) ──
  useEffect(() => {
    if (mode === 'create'
      && formData._modo_usuario === 'seleccionar'
      && !formData._usuario_seleccionado) {
      setFormData(prev => {
        const hasValues = ['DNI', 'APELLIDO_PATERNO', 'NOMBRES', 'EMAIL'].some(f => prev[f]);
        if (!hasValues) return prev;
        const newData = { ...prev };
        USUARIO_CAMPOS.forEach(f => { newData[f] = ''; });
        newData.DNI_ARCHIVO = '';
        return newData;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, formData._modo_usuario, formData._usuario_seleccionado]);

  return {
    handleUsuarioSeleccionado,
    handleFieldChange,
    handleModeChange,
    isLoadingUsuario,
    limpiarCamposUsuario,
    llenarCamposUsuario
  };
}

export default useDocenteUsuario;
