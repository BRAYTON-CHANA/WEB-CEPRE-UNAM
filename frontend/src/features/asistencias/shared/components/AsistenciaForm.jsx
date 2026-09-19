import React, { useState, useEffect } from 'react';
import { db } from '@/shared/api';
import TextAreaInput from '@/shared/components/ui/inputs/TextAreaInput';
import FileInput from '@/shared/components/ui/inputs/FileInput';
import { uploadEvidenciaSesion, getEvidenciaSesionUrl } from '../services/asistenciasStorageService';

/**
 * Formulario de Asistencia Docente (Custom)
 * Actualiza SESIONES_AGRUPADAS directamente
 */
export function AsistenciaForm({ idSesion, sesionData, idDocenteProgramado, idUsuario, onSuccess, onCancel }) {
  // Función para inicializar formData con datos existentes o valores por defecto
  const getInitialFormData = () => {
    const existing = sesionData || {};
    return {
      HORA_ENTRADA_REAL: existing.HORA_ENTRADA_REAL?.slice(0, 5) || '',
      HORA_SALIDA_REAL: existing.HORA_SALIDA_REAL?.slice(0, 5) || '',
      ASISTIO_DOCENTE: existing.ASISTIO === null || existing.ASISTIO === undefined ? true : existing.ASISTIO,
      // Evidencia existente: objeto { name, size, storagePath } para FileInput
      EVIDENCIA: existing.EVIDENCIA_PATH
        ? {
            name: existing.EVIDENCIA_FILENAME || 'evidencia',
            size: existing.EVIDENCIA_TAMAÑO_BYTES || 0,
            url: null,
            storagePath: existing.EVIDENCIA_PATH,
          }
        : '',
      OBSERVACIONES: existing.OBSERVACIONES || ''
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Actualizar formData cuando cambia sesionData (para edición)
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [sesionData?.ID_SESION]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const asistio = !!formData.ASISTIO_DOCENTE;

      const payload = {
        HORA_ENTRADA_REAL: formData.HORA_ENTRADA_REAL || null,
        HORA_SALIDA_REAL: formData.HORA_SALIDA_REAL || null,
        OBSERVACIONES: formData.OBSERVACIONES || null,
        MARCADO_POR: idUsuario,
        FECHA_MARCADO: new Date().toISOString(),
        ASISTIO: asistio,
        // ASISTIO = true → el docente programado; false → nadie (limpiar suplencia)
        ID_DOCENTE_ASISTIO: asistio ? idDocenteProgramado : null,
        NOMBRE_SUPLENTE_EXTERNO: null,
        MOTIVO_FALTA: null
      };

      // Evidencia: File nuevo → subir; quitado → limpiar columnas; sin tocar → conservar
      const evid = formData.EVIDENCIA;
      const nuevoArchivo = Array.isArray(evid) && evid[0] instanceof File ? evid[0] : null;
      if (nuevoArchivo) {
        const up = await uploadEvidenciaSesion(idSesion, nuevoArchivo);
        payload.EVIDENCIA_PATH = up.path;
        payload.EVIDENCIA_FILENAME = up.filename;
        payload.EVIDENCIA_CONTENT_TYPE = up.contentType;
        payload.EVIDENCIA_TAMAÑO_BYTES = up.size;
      } else if (!nuevoArchivo && !evid?.storagePath && sesionData?.EVIDENCIA_PATH) {
        payload.EVIDENCIA_PATH = null;
        payload.EVIDENCIA_FILENAME = null;
        payload.EVIDENCIA_CONTENT_TYPE = null;
        payload.EVIDENCIA_TAMAÑO_BYTES = null;
      }

      await db.update('SESIONES_AGRUPADAS', idSesion, payload, 'ID_SESION');
      onSuccess?.();
    } catch (err) {
      console.error('Error al guardar asistencia:', err);
      setErrors({ general: 'Error al guardar la asistencia. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header con info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="font-semibold text-blue-800 text-sm">{sesionData?.NOMBRE_CURSO || 'Curso no especificado'}</p>
        <p className="text-blue-600 text-xs mt-1">
          {sesionData?.FECHA} · {sesionData?.HORA_INICIO?.slice(0, 5)} - {sesionData?.HORA_FIN?.slice(0, 5)}
        </p>
      </div>

      {/* Errores generales */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-2 gap-4">
          {/* Hora Entrada - input nativo */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Hora de entrada
            </label>
            <input
              type="time"
              name="HORA_ENTRADA_REAL"
              value={formData.HORA_ENTRADA_REAL}
              onChange={(e) => handleChange('HORA_ENTRADA_REAL', e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                colorScheme: 'light',
              }}
            />
          </div>

          {/* Hora Salida - input nativo */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Hora de salida
            </label>
            <input
              type="time"
              name="HORA_SALIDA_REAL"
              value={formData.HORA_SALIDA_REAL}
              onChange={(e) => handleChange('HORA_SALIDA_REAL', e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                colorScheme: 'light',
              }}
            />
          </div>

          {/* Docente que le toca + Switch de asistencia */}
          <div className="col-span-2 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              Docente: {sesionData?.DOCENTE_PROGRAMADO_NOMBRE || 'Sin docente asignado'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">¿Asistió?</span>
              <button
                type="button"
                onClick={() => handleChange('ASISTIO_DOCENTE', !formData.ASISTIO_DOCENTE)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  formData.ASISTIO_DOCENTE ? 'bg-green-500' : 'bg-red-400'
                }`}
                title={formData.ASISTIO_DOCENTE ? 'Asistió' : 'No asistió'}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    formData.ASISTIO_DOCENTE ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Evidencia: foto del aula o justificación */}
          <div className="col-span-2">
            <FileInput
              name="EVIDENCIA"
              label="Evidencia"
              value={formData.EVIDENCIA}
              onChange={(name, value) => handleChange(name, value)}
              fileTypes={['IMAGES', 'PDF']}
              maxSize={10 * 1024 * 1024}
              getDownloadUrl={(fileValue) =>
                fileValue?.storagePath ? getEvidenciaSesionUrl(fileValue.storagePath) : null
              }
            />
          </div>

          {/* Observaciones - siempre visibles */}
          <div className="col-span-2">
            <TextAreaInput
              name="OBSERVACIONES"
              label="Observaciones"
              value={formData.OBSERVACIONES}
              onChange={(name, value) => handleChange(name, value)}
              placeholder="Notas adicionales..."
              rows={2}
              showCharCount={false}
              autoResize={false}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AsistenciaForm;
