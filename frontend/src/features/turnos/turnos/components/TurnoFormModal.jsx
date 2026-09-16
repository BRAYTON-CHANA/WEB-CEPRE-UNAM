import React from 'react';
import { Modal } from '@/shared/components/modal';
import CheckboxInput from '@/shared/components/ui/inputs/CheckboxInput';
import TurnoMatrizEditor from '@/features/turnos/turnos/components/TurnoMatrizEditor';

const DIAS_SEMANA_OPTIONS = [
  { value: 1, label: 'Lunes', description: 'Lunes' },
  { value: 2, label: 'Martes', description: 'Martes' },
  { value: 3, label: 'Miércoles', description: 'Miércoles' },
  { value: 4, label: 'Jueves', description: 'Jueves' },
  { value: 5, label: 'Viernes', description: 'Viernes' },
  { value: 6, label: 'Sábado', description: 'Sábado' },
  { value: 7, label: 'Domingo', description: 'Domingo' }
];

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
const errCls = 'text-red-600 text-xs mt-1';

/**
 * TurnoFormModal — formulario personalizado de creación/edición de turno.
 * La plantilla de horario solo carga valores (no se persiste ID_HORARIO_ORIGEN).
 * MATRIZ_DIAS se genera client-side (utils/generarMatriz.js) y es editable
 * con TurnoMatrizEditor (drag & drop + edición inline).
 */
export default function TurnoFormModal({
  isOpen,
  editingTurno,
  formData,
  formErrors,
  saving,
  periodoOptions,
  horarioOptions,
  sedeOptions,
  onClose,
  onFieldChange,
  onPeriodoChange,
  onApplyHorarioTemplate,
  onGenerarMatriz,
  onSubmit
}) {
  const matriz = Array.isArray(formData.MATRIZ_DIAS) ? formData.MATRIZ_DIAS : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTurno ? 'Editar Turno' : 'Crear Turno'}
      size="3xl"
      closeOnOutsideClick={false}
    >
      <div className="p-6">
        {formErrors.general && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formErrors.general}</div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Período */}
          <div className="col-span-2">
            <label className={labelCls}>Período</label>
            <select
              value={formData.ID_PERIODO}
              onChange={e => onPeriodoChange(e.target.value)}
              className={inputCls}
            >
              <option value="">— Seleccionar período —</option>
              {periodoOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {formErrors.ID_PERIODO && <p className={errCls}>{formErrors.ID_PERIODO}</p>}
          </div>

          {/* Fechas del rango (editables) */}
          <div>
            <label className={labelCls}>Fecha inicio</label>
            <input
              type="date"
              value={formData.FECHA_INICIO}
              onChange={e => onFieldChange('FECHA_INICIO', e.target.value)}
              className={inputCls}
            />
            {formErrors.FECHA_INICIO && <p className={errCls}>{formErrors.FECHA_INICIO}</p>}
          </div>
          <div>
            <label className={labelCls}>Fecha término</label>
            <input
              type="date"
              value={formData.FECHA_FIN}
              onChange={e => onFieldChange('FECHA_FIN', e.target.value)}
              className={inputCls}
            />
            {formErrors.FECHA_FIN && <p className={errCls}>{formErrors.FECHA_FIN}</p>}
          </div>

          {/* Horario plantilla */}
          <div className="col-span-2">
            <label className={labelCls}>Horario plantilla <span className="text-gray-400 font-normal">(carga valores, no se guarda)</span></label>
            <select
              value={formData.ID_HORARIO_ORIGEN}
              onChange={e => onApplyHorarioTemplate(e.target.value)}
              className={inputCls}
            >
              <option value="">— Seleccionar plantilla —</option>
              {horarioOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Sede</label>
            <select
              value={formData.ID_SEDE}
              onChange={e => onFieldChange('ID_SEDE', e.target.value)}
              className={inputCls}
            >
              <option value="">— Seleccionar —</option>
              {sedeOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {formErrors.ID_SEDE && <p className={errCls}>{formErrors.ID_SEDE}</p>}
          </div>

          <div>
            <label className={labelCls}>Nombre del turno</label>
            <input
              type="text"
              value={formData.NOMBRE_TURNO}
              onChange={e => onFieldChange('NOMBRE_TURNO', e.target.value)}
              className={inputCls}
              placeholder="Ej: Sab-Dom Mañana-Tarde"
            />
            {formErrors.NOMBRE_TURNO && <p className={errCls}>{formErrors.NOMBRE_TURNO}</p>}
          </div>

          <div>
            <label className={labelCls}>Hora inicio jornada</label>
            <input
              type="time"
              value={formData.HORA_INICIO_JORNADA}
              onChange={e => onFieldChange('HORA_INICIO_JORNADA', e.target.value)}
              className={inputCls}
            />
            {formErrors.HORA_INICIO_JORNADA && <p className={errCls}>{formErrors.HORA_INICIO_JORNADA}</p>}
          </div>
          <div>
            <label className={labelCls}>Hora fin jornada</label>
            <input
              type="time"
              value={formData.HORA_FIN_JORNADA}
              onChange={e => onFieldChange('HORA_FIN_JORNADA', e.target.value)}
              className={inputCls}
            />
            {formErrors.HORA_FIN_JORNADA && <p className={errCls}>{formErrors.HORA_FIN_JORNADA}</p>}
          </div>

          {/* Días válidos */}
          <div className="col-span-2">
            <CheckboxInput
              key={JSON.stringify(formData.DIAS_VALIDOS)}
              name="DIAS_VALIDOS"
              label="Días válidos"
              options={DIAS_SEMANA_OPTIONS}
              value={formData.DIAS_VALIDOS}
              onChange={(name, val) => onFieldChange(name, val)}
              inline
            />
            {formErrors.DIAS_VALIDOS && <p className={errCls}>{formErrors.DIAS_VALIDOS}</p>}
          </div>

          <div>
            <label className={labelCls}>Días por semana académica</label>
            <input
              type="number"
              min={1}
              value={formData.DIAS_POR_SEMANA}
              onChange={e => onFieldChange('DIAS_POR_SEMANA', e.target.value === '' ? '' : Number(e.target.value))}
              className={inputCls}
              placeholder="Ej: 3"
            />
            {formErrors.DIAS_POR_SEMANA && <p className={errCls}>{formErrors.DIAS_POR_SEMANA}</p>}
          </div>

        </div>

        {/* Matriz de fechas */}
        <div className="border-t border-gray-100 pt-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-900">Fechas del turno</h3>
            <button
              type="button"
              onClick={onGenerarMatriz}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
            >
              Generar fechas
            </button>
          </div>

          {formErrors.MATRIZ_DIAS && <p className="text-red-600 text-xs mb-2">{formErrors.MATRIZ_DIAS}</p>}

          {matriz.length > 0 ? (
            <TurnoMatrizEditor
              value={formData.MATRIZ_DIAS}
              onChange={(m) => onFieldChange('MATRIZ_DIAS', m)}
            />
          ) : (
            <p className="text-sm text-gray-500">Aún no se han generado fechas.</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
