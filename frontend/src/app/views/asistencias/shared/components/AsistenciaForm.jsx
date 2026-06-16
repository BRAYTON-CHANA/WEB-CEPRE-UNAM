import React, { useState, useEffect } from 'react';
import { db } from '@/shared/api';
import FunctionSelectInput from '@/shared/components/ui/inputs/FunctionSelectInput';
import TextInput from '@/shared/components/ui/inputs/TextInput';
import SelectInput from '@/shared/components/ui/inputs/SelectInput';
import TextAreaInput from '@/shared/components/ui/inputs/TextAreaInput';
import { validateAsistenciaCondicional } from '../utils/asistenciaValidation';

const MOTIVOS_FALTA = [
  { value: '', label: 'Seleccione...' },
  { value: 'licencia', label: 'Licencia' },
  { value: 'permiso', label: 'Permiso' },
  { value: 'enfermedad', label: 'Enfermedad' },
  { value: 'injustificado', label: 'Injustificado' },
  { value: 'otro', label: 'Otro' }
];

/**
 * Formulario de Asistencia Docente (Custom)
 * Actualiza SESIONES_AGRUPADAS directamente
 */
export function AsistenciaForm({ idSesion, sesionData, idCurso, idDocenteProgramado, idUsuario, onSuccess, onCancel }) {
  // Función para inicializar formData con datos existentes o valores por defecto
  const getInitialFormData = () => {
    const existing = sesionData || {};
    
    // Determinar estado de asistencia basado en datos existentes
    const asistioDocente = existing.ASISTIO === true && 
                          existing.ID_DOCENTE_ASISTIO === idDocenteProgramado;
    const haySuplente = existing.ES_SUPLENTE === true || 
                       (existing.ASISTIO === true && 
                        existing.ID_DOCENTE_ASISTIO && 
                        existing.ID_DOCENTE_ASISTIO !== idDocenteProgramado);
    const tipoSuplente = existing.NOMBRE_SUPLENTE_EXTERNO ? 'externo' : 
                        (existing.ID_DOCENTE_ASISTIO && existing.ID_DOCENTE_ASISTIO !== idDocenteProgramado ? 'interno' : '');
    
    return {
      HORA_ENTRADA_REAL: existing.HORA_ENTRADA_REAL?.slice(0, 5) || '',
      HORA_SALIDA_REAL: existing.HORA_SALIDA_REAL?.slice(0, 5) || '',
      ASISTIO_DOCENTE: existing.ASISTIO === null || existing.ASISTIO === undefined ? true : asistioDocente,
      ES_SUPLENTE: haySuplente,
      TIPO_SUPLENTE: tipoSuplente,
      ID_DOCENTE_ASISTIO: existing.ID_DOCENTE_ASISTIO && existing.ID_DOCENTE_ASISTIO !== idDocenteProgramado 
        ? existing.ID_DOCENTE_ASISTIO 
        : '',
      NOMBRE_SUPLENTE_EXTERNO: existing.NOMBRE_SUPLENTE_EXTERNO || '',
      MOTIVO_FALTA: existing.MOTIVO_FALTA || '',
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

  const getHoraActual = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const handleChange = (name, value) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Lógica condicional
      if (name === 'ASISTIO_DOCENTE' && value === true) {
        // Docente programado asistió - resetear suplente
        updated.ES_SUPLENTE = false;
        updated.TIPO_SUPLENTE = '';
        updated.ID_DOCENTE_ASISTIO = '';
        updated.NOMBRE_SUPLENTE_EXTERNO = '';
      }
      if (name === 'ES_SUPLENTE' && value === false) {
        // No hay suplente
        updated.TIPO_SUPLENTE = '';
        updated.ID_DOCENTE_ASISTIO = '';
        updated.NOMBRE_SUPLENTE_EXTERNO = '';
      }
      if (name === 'TIPO_SUPLENTE') {
        // Cambiar tipo de suplente - resetear valor
        updated.ID_DOCENTE_ASISTIO = '';
        updated.NOMBRE_SUPLENTE_EXTERNO = '';
      }
      
      return updated;
    });
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      // Determinar estado de asistencia
      // ASISTIO = true → asistió el docente programado
      // ASISTIO = false → NO asistió el docente programado (suplente o nadie)
      let idDocenteAsistio = null;
      let nombreSuplenteExterno = null;
      
      // Por defecto: asistió el docente programado (ASISTIO = true)
      let asistio = true;

      if (!formData.ASISTIO_DOCENTE) {
        // El docente programado NO asistió
        asistio = false;
        
        if (formData.ES_SUPLENTE) {
          // Hay suplente que tomó su lugar
          if (formData.TIPO_SUPLENTE === 'interno' && formData.ID_DOCENTE_ASISTIO) {
            idDocenteAsistio = Number(formData.ID_DOCENTE_ASISTIO);
          } else if (formData.TIPO_SUPLENTE === 'externo' && formData.NOMBRE_SUPLENTE_EXTERNO.trim()) {
            nombreSuplenteExterno = formData.NOMBRE_SUPLENTE_EXTERNO.trim();
          }
        }
        // Si no hay suplente, queda como ASISTIO = false, sin docente asignado
      } else {
        // Asistió el docente programado
        idDocenteAsistio = idDocenteProgramado;
      }

      // Construir payload
      const payload = {
        HORA_ENTRADA_REAL: formData.HORA_ENTRADA_REAL || null,
        HORA_SALIDA_REAL: formData.HORA_SALIDA_REAL || null,
        OBSERVACIONES: formData.OBSERVACIONES || null,
        MARCADO_POR: idUsuario,
        FECHA_MARCADO: new Date().toISOString(),
        // Campos de asistencia
        ASISTIO: asistio,
        ID_DOCENTE_ASISTIO: idDocenteAsistio,
        NOMBRE_SUPLENTE_EXTERNO: nombreSuplenteExterno,
        // Motivo de falta solo si el docente programado no asistió
        MOTIVO_FALTA: !formData.ASISTIO_DOCENTE ? (formData.MOTIVO_FALTA || null) : null
      };

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

          {/* Si NO asistió: Motivo de falta PRIMERO */}
          {!formData.ASISTIO_DOCENTE && (
            <div className="col-span-2">
              <SelectInput
                name="MOTIVO_FALTA"
                label="Motivo de falta"
                value={formData.MOTIVO_FALTA}
                onChange={(name, value) => handleChange(name, value)}
                options={MOTIVOS_FALTA}
                error={errors.MOTIVO_FALTA}
              />
            </div>
          )}

          {/* Si NO asistió: texto para elegir suplente */}
          {!formData.ASISTIO_DOCENTE && (
            <div className="col-span-2 text-right">
              <p className="text-xs text-gray-500">
                Elige el docente que tomara su lugar:
              </p>
            </div>
          )}

          {/* Si NO asistió: Switch Suplente */}
          {!formData.ASISTIO_DOCENTE && (
            <div className="col-span-2 flex items-center justify-between bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <span className="text-sm font-medium text-yellow-800">
                ¿Hay suplente?
              </span>
              <button
                type="button"
                onClick={() => handleChange('ES_SUPLENTE', !formData.ES_SUPLENTE)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.ES_SUPLENTE ? 'bg-yellow-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.ES_SUPLENTE ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Si hay suplente: Tipo (Interno/Externo) */}
          {formData.ES_SUPLENTE && (
            <div className="col-span-2 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo_suplente"
                  checked={formData.TIPO_SUPLENTE === 'interno'}
                  onChange={() => handleChange('TIPO_SUPLENTE', 'interno')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">Interno</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo_suplente"
                  checked={formData.TIPO_SUPLENTE === 'externo'}
                  onChange={() => handleChange('TIPO_SUPLENTE', 'externo')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">Externo</span>
              </label>
            </div>
          )}

          {/* Suplente Interno: Select de docentes */}
          {formData.ES_SUPLENTE && formData.TIPO_SUPLENTE === 'interno' && (
            <div className="col-span-2">
              <FunctionSelectInput
                name="ID_DOCENTE_ASISTIO"
                label="Docente suplente"
                value={formData.ID_DOCENTE_ASISTIO}
                onChange={(name, value) => handleChange(name, value)}
                functionName="fn_docentes_por_curso"
                functionParams={{ p_id_curso: idCurso }}
                optionalParams={['p_id_curso']}
                valueField="id_docente"
                labelField="{nombre_completo}"
                descriptionField="{dni}"
                placeholder="Seleccione docente suplente..."
                searchable={true}
              />
            </div>
          )}

          {/* Suplente Externo: Campo de texto */}
          {formData.ES_SUPLENTE && formData.TIPO_SUPLENTE === 'externo' && (
            <div className="col-span-2">
              <TextInput
                name="NOMBRE_SUPLENTE_EXTERNO"
                label="Nombre del suplente externo"
                value={formData.NOMBRE_SUPLENTE_EXTERNO}
                onChange={(name, value) => handleChange(name, value)}
                placeholder="Ej: Juan Pérez García"
                error={errors.NOMBRE_SUPLENTE_EXTERNO}
              />
            </div>
          )}

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
