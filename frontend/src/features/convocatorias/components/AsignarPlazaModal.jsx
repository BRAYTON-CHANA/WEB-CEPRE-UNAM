import React from 'react';
import { Modal } from '@/shared/components/modal';

/**
 * AsignarPlazaModal — modal para asignar una plaza disponible a una postulación.
 * Lista las plazas disponibles con radio buttons.
 *
 * @param {Object} asignarModal - { open, postulacion, plazas, loadingPlazas, selectedPlaza, asignando }
 * @param {Function} onSelectPlaza - handler al seleccionar una plaza (recibe id_plaza_docente)
 * @param {Function} onConfirm - handler confirmar asignación
 * @param {Function} onClose - handler cerrar modal
 */
function AsignarPlazaModal({
  asignarModal,
  onSelectPlaza,
  onConfirm,
  onClose,
}) {
  const { open, postulacion, plazas, loadingPlazas, selectedPlaza, asignando } = asignarModal;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Asignar plaza disponible"
      size="md"
      closeOnOutsideClick={false}
    >
      <div className="p-6 space-y-4">
        <div className="text-sm text-gray-600">
          Postulación de <strong>{postulacion?.DOCENTE_NOMBRE}</strong>
        </div>

        {loadingPlazas && (
          <div className="text-center py-4">
            <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-2" />
            <p className="text-sm text-gray-500">Cargando plazas disponibles...</p>
          </div>
        )}

        {!loadingPlazas && plazas.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
            No hay plazas disponibles para asignar. Cree más plazas en la gestión de plazas docentes.
          </div>
        )}

        {!loadingPlazas && plazas.length > 0 && (
          <>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {plazas.map((plaza) => (
                <label
                  key={plaza.id_plaza_docente}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPlaza === plaza.id_plaza_docente
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="plaza"
                    checked={selectedPlaza === plaza.id_plaza_docente}
                    onChange={() => onSelectPlaza(plaza.id_plaza_docente)}
                    className="text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{plaza.identificador}</div>
                    <div className="text-xs text-gray-500">
                      {plaza.modalidad} · S/. {plaza.pago_por_hora}/hora
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={!selectedPlaza || asignando}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {asignando ? 'Asignando...' : 'Asignar plaza'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default AsignarPlazaModal;
