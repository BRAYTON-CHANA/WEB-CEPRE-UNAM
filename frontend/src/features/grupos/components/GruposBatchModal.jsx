import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '@/shared/components/modal';
import GruposGridInput from '@/features/grupos/components/GruposGridInput';

/**
 * GruposBatchModal — modal de creación batch de grupos.
 *
 * Solo período es global (fijo del selector).
 * Horario, fechas y plan académico van por combinación sede×área dentro del grid.
 * Aula va por grupo individual dentro del grid.
 *
 * Props:
 *   isOpen, onClose,
 *   selectedPeriodo, periodoNombre,
 *   onSubmit: (data) => void,
 *   submitting, submitError
 */
function GruposBatchModal({
  isOpen,
  onClose,
  selectedPeriodo,
  periodoNombre,
  onSubmit,
  submitting = false,
  submitError = null
}) {
  const [combos, setCombos] = useState([]);
  const [validationError, setValidationError] = useState('');

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setCombos([]);
      setValidationError('');
    }
  }, [isOpen]);

  const totalGrupos = useMemo(() =>
    Array.isArray(combos)
      ? combos.filter(c => c.selected).reduce((sum, c) => sum + (c.grupos?.length || 0), 0)
      : 0,
    [combos]
  );

  const handleSubmit = () => {
    setValidationError('');

    const selectedCombos = combos.filter(c => c.selected);
    if (selectedCombos.length === 0) {
      setValidationError('Seleccione al menos una combinación sede×área en el grid');
      return;
    }

    // Validar cada combinación
    for (const c of selectedCombos) {
      if (!c.FECHA_INICIO || !c.FECHA_TERMINO) {
        setValidationError(`La combinación ${c.NOMBRE_SEDE} × ${c.NOMBRE_AREA} necesita fechas de inicio y término`);
        return;
      }
      if (c.FECHA_TERMINO <= c.FECHA_INICIO) {
        setValidationError(`La combinación ${c.NOMBRE_SEDE} × ${c.NOMBRE_AREA}: la fecha de término debe ser mayor que la de inicio`);
        return;
      }
      // Validar cada grupo
      for (const g of (c.grupos || [])) {
        if (!g.ID_HORARIO) {
          setValidationError(`Un grupo en ${c.NOMBRE_SEDE} × ${c.NOMBRE_AREA} necesita un horario`);
          return;
        }
        if (!g.NOMBRE_GRUPO?.trim()) {
          setValidationError(`Un grupo en ${c.NOMBRE_SEDE} × ${c.NOMBRE_AREA} necesita un nombre`);
          return;
        }
      }
    }

    onSubmit({
      ID_PERIODO: Number(selectedPeriodo),
      COMBOS: combos
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Crear Grupos — Período: ${periodoNombre || ''}`}
      size="full"
      closeOnOutsideClick={false}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-gray-500">
            {totalGrupos > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-medium border border-blue-100">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                {totalGrupos} grupo{totalGrupos !== 1 ? 's' : ''} a crear
              </span>
            ) : (
              <span className="text-gray-400">Marque las celdas en el grid para configurar grupos</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || totalGrupos === 0}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitting ? 'Creando...' : `Crear ${totalGrupos} Grupo${totalGrupos !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* ===== Período fijo ===== */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <div>
              <div className="text-xs font-medium text-gray-500">Período (fijo para todos los grupos)</div>
              <div className="text-sm font-semibold text-gray-900">{periodoNombre || '—'}</div>
            </div>
          </div>
        </div>

        {/* ===== Errores ===== */}
        {(validationError || submitError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {validationError || submitError}
          </div>
        )}

        {/* ===== Grid Sede x Área (se expande completo, sin scroll interno) ===== */}
        <GruposGridInput
          value={combos}
          onChange={(_, v) => setCombos(v)}
          disabled={submitting}
        />
      </div>
    </Modal>
  );
}

export default GruposBatchModal;
