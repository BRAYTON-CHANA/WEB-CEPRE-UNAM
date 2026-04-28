import React, { useState, useMemo } from 'react';
import cacheService from '@/shared/services/cacheService';
import { API_BASE_URL } from '@/shared/config/api';
import HorasAcademicasSummary from './ResumenGeneracionModal/HorasAcademicasSummary';
import AsignacionesTable from './ResumenGeneracionModal/AsignacionesTable';
import ConflictModal from './ResumenGeneracionModal/ConflictModal';

/**
 * Modal de resumen de la generación desde la matriz.
 * Muestra:
 *  - Resumen de horas académicas
 *  - Tabla legible (Fecha, Día, Columna, Bloque ORDEN, Curso, Docente)
 *  - Botón Asignar para confirmar inserción con detección de conflictos
 */
const ResumenGeneracionModal = ({ isOpen, onClose, asignaciones = [], warning = null, onAssign }) => {
  const [loading, setLoading] = useState(false);
  const [conflictos, setConflictos] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [error, setError] = useState('');

  // Payload BD (solo campos necesarios)
  const payloadBD = useMemo(
    () =>
      asignaciones.map(a => ({
        ID_GRUPO_PLAN_CURSO: a.ID_GRUPO_PLAN_CURSO,
        ORDEN: a.ORDEN,
        ID_HORARIO_BLOQUE: a.ID_HORARIO_BLOQUE,
        FECHA: a.FECHA
      })),
    [asignaciones]
  );

  // Verificar conflictos con asignaciones existentes
  const checkConflicts = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Refrescar registry para asegurar que ASIGNACION_HORARIO esté registrada
      try {
        await fetch(`${API_BASE_URL}/registry/refresh`, { method: 'POST' });
      } catch (e) {
        console.warn('No se pudo refrescar el registry:', e.message);
      }
      
      // Obtener asignaciones existentes
      const response = await fetch(`${API_BASE_URL}/tables/VW_ASIGNACION_HORARIO`);
      const data = await response.json();
      
      if (!data?.data?.records) {
        setConflictos([]);
        return [];
      }
      
      const existentes = data.data.records;
      const conflictosEncontrados = [];
      
      // Verificar cada asignación nueva contra las existentes
      for (const nueva of asignaciones) {
        const conflicto = existentes.find(existente =>
          existente.ID_GRUPO_PLAN_CURSO === nueva.ID_GRUPO_PLAN_CURSO &&
          existente.ID_HORARIO_BLOQUE === nueva.ID_HORARIO_BLOQUE &&
          existente.FECHA === nueva.FECHA
        );
        
        if (conflicto) {
          conflictosEncontrados.push({
            nueva,
            existente: {
              ID_ASIGNACION_HORARIO: conflicto.ID_ASIGNACION_HORARIO,
              ID_GRUPO_PLAN_CURSO: conflicto.ID_GRUPO_PLAN_CURSO,
              ID_HORARIO_BLOQUE: conflicto.ID_HORARIO_BLOQUE,
              FECHA: conflicto.FECHA
            }
          });
        }
      }
      
      setConflictos(conflictosEncontrados);
      return conflictosEncontrados;
    } catch (err) {
      setError('Error al verificar conflictos: ' + err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Manejar clic en botón Asignar
  const handleAssign = async () => {
    const conflictosEncontrados = await checkConflicts();
    
    if (conflictosEncontrados.length > 0) {
      setShowConflictModal(true);
    } else {
      // Sin conflictos, proceder directamente
      await handleConfirmWithOverwrite(false);
    }
  };

  // Confirmar asignación (con o sin sobreescritura)
  const handleConfirmWithOverwrite = async (overwrite = false) => {
    try {
      setLoading(true);
      setError('');
      
      // Refrescar registry para asegurar que ASIGNACION_HORARIO esté registrada
      try {
        await fetch(`${API_BASE_URL}/registry/refresh`, { method: 'POST' });
      } catch (e) {
        console.warn('No se pudo refrescar el registry:', e.message);
      }
      
      if (overwrite && conflictos.length > 0) {
        // Eliminar asignaciones conflictivas
        for (const conflicto of conflictos) {
          await fetch(`${API_BASE_URL}/tables/ASIGNACION_HORARIO/${conflicto.existente.ID_ASIGNACION_HORARIO}`, {
            method: 'DELETE'
          });
        }
      }
      
      // Insertar nuevas asignaciones - mismo formato que el horario normal
      const results = [];
      for (const asignacion of payloadBD) {
        const response = await fetch(`${API_BASE_URL}/tables/ASIGNACION_HORARIO`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ID_GRUPO_PLAN_CURSO: asignacion.ID_GRUPO_PLAN_CURSO,
            ID_HORARIO_BLOQUE: asignacion.ID_HORARIO_BLOQUE,
            FECHA: asignacion.FECHA
          })
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Error al insertar asignación');
        }
        results.push(result);
      }
      
      // Invalidar cache
      cacheService.invalidateAll();
      
      // Cerrar modal
      setShowConflictModal(false);
      onClose();
      
      // Callback externo
      if (onAssign) onAssign(results);
      
    } catch (err) {
      setError('Error al asignar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#2D366F] to-[#57C7C2] px-6 py-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Resumen de generación</h3>
                <p className="text-xs text-white/80">
                  {asignaciones.length} {asignaciones.length === 1 ? 'asignación generada' : 'asignaciones generadas'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {warning && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium text-amber-800">{warning}</p>
            </div>
          )}

          {asignaciones.length === 0 && !warning && (
            <div className="text-center py-12 text-slate-500 text-sm font-medium">
              No se generaron asignaciones.
            </div>
          )}

          {asignaciones.length > 0 && (
            <>
              {/* Resumen de horas académicas al principio */}
              <HorasAcademicasSummary asignaciones={asignaciones} />

              {/* Tabla de asignaciones */}
              <AsignacionesTable asignaciones={asignaciones} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-3">
          {error && (
            <span className="text-sm text-red-600 font-medium mr-auto">{error}</span>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 text-white hover:from-slate-600 hover:to-slate-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-slate-900/20 disabled:opacity-50"
          >
            Cerrar
          </button>
          {asignaciones.length > 0 && onAssign && (
            <button
              type="button"
              onClick={handleAssign}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#2D366F] to-[#57C7C2] text-white hover:from-[#3a4289] hover:to-[#6dd9d4] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#2D366F]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Asignar
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Modal de conflictos */}
      {showConflictModal && (
        <ConflictModal
          conflictos={conflictos}
          onCancel={() => setShowConflictModal(false)}
          onConfirm={() => handleConfirmWithOverwrite(true)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ResumenGeneracionModal;
