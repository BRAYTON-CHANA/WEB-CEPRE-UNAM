import React, { useState, useMemo } from 'react';
import { Modal } from '@/shared/components/modal';
import FormConfirmModal from '@/shared/components/form/components/FormConfirmModal';
import { preguntasModalConfig } from '@/features/convocatorias/requisitos/preguntas/config/formConfig';
import { useConvocatoriaPreguntas } from '@/features/convocatorias/requisitos/preguntas/hooks/useConvocatoriaPreguntas';
import PreguntaCard from '@/features/convocatorias/requisitos/preguntas/components/PreguntaCard';
import PreguntaCreateForm from '@/features/convocatorias/requisitos/preguntas/components/PreguntaCreateForm';
import SectionAccordion from '@/features/convocatorias/components/SectionAccordion';

const CONDICIONES_LABORALES = [
  { value: 'CONTRATADO', label: 'Contratado' },
  { value: 'EXTERNO', label: 'Externo' },
  { value: 'ORDINARIO', label: 'Ordinario' }
];

/**
 * Sección de Preguntas Docentes (tabs por condición + cards con preview).
 */
function PreguntasSection({ activeCondicion }) {
  const {
    tableRecords, loading, error,
    isCreateFormOpen, condicionesPreseleccionadas,
    handleCreate, handleCreateSuccess, handleCreateCancel,
    isDeleteOpen, rowToDelete, deleteLoading, handleCancelDelete, handleConfirmDelete,
    notification, closeNotification,
    handleSaveInline, handleDelete, handleMovePregunta
  } = useConvocatoriaPreguntas();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filtrar preguntas por la condición activa y ordenar (activas primero, luego por ORDEN, luego por NOMBRE)
  const preguntasFiltradas = useMemo(() => {
    return (tableRecords || [])
      .filter(p => p.CONDICION_LABORAL === activeCondicion)
      .sort((a, b) => {
        const aInactivo = a.ACTIVO === false || a.ACTIVO === 'false' || a.ACTIVO === 0;
        const bInactivo = b.ACTIVO === false || b.ACTIVO === 'false' || b.ACTIVO === 0;
        if (aInactivo !== bInactivo) return aInactivo ? 1 : -1;
        const ordA = Number(a.ORDEN ?? 0);
        const ordB = Number(b.ORDEN ?? 0);
        if (ordA !== ordB) return ordA - ordB;
        return String(a.NOMBRE || '').localeCompare(String(b.NOMBRE || ''));
      });
  }, [tableRecords, activeCondicion]);

  return (
    <div className="space-y-4">
      <SectionAccordion
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        title="Preguntas Docentes"
        actions={[{ text: 'Crear Pregunta', onClick: handleCreate, font: 'bg-green-600 hover:bg-green-700 text-white' }]}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="space-y-4">
          {loading && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-gray-500 text-sm">Cargando preguntas...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 rounded-xl border border-red-100 p-6">
              <p className="text-red-700 text-sm"><strong>Error:</strong> {error.message}</p>
            </div>
          )}

          {/* Form inline de crear pregunta (estilo Google Forms) */}
          {isCreateFormOpen && (
            <div className="bg-white rounded-xl border border-green-200 shadow-md overflow-hidden">
              <PreguntaCreateForm
                tableRecords={tableRecords}
                condicionesPreseleccionadas={condicionesPreseleccionadas}
                onSuccess={handleCreateSuccess}
                onCancel={handleCreateCancel}
              />
            </div>
          )}

          {!loading && !error && preguntasFiltradas.length === 0 && !isCreateFormOpen && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-1">No hay preguntas para esta condición</p>
              <p className="text-gray-400 text-xs">Crea una nueva pregunta para "{CONDICIONES_LABORALES.find(c => c.value === activeCondicion)?.label}".</p>
            </div>
          )}

          {!loading && !error && preguntasFiltradas.length > 0 && (
            <div className="space-y-3">
              {preguntasFiltradas.map((pregunta, idx) => (
                <PreguntaCard
                  key={pregunta.ID_PREGUNTA}
                  pregunta={pregunta}
                  onSaveInline={handleSaveInline}
                  onDelete={() => handleDelete(pregunta)}
                  onMoveUp={() => handleMovePregunta(pregunta, 'up')}
                  onMoveDown={() => handleMovePregunta(pregunta, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === preguntasFiltradas.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </SectionAccordion>

      {/* Modal Eliminar Pregunta */}
      <FormConfirmModal
        isOpen={isDeleteOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        config={{
          title: preguntasModalConfig.deleteTitle,
          message: rowToDelete ? preguntasModalConfig.deleteMessage(rowToDelete) : '¿Estás seguro?',
          confirmText: deleteLoading ? 'Eliminando...' : 'Sí, eliminar',
          cancelText: 'Cancelar'
        }}
      />

      {/* Notificación Pregunta */}
      <Modal isOpen={notification.isOpen} onClose={closeNotification} title={notification.title} closeOnOutsideClick={true} closeOnEscapeKey={true}>
        <div className="text-center py-4 px-6">
          {notification.type === 'success' ? (
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <p className={`text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {notification.message}
          </p>
          <button
            onClick={closeNotification}
            className={`mt-4 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${notification.type === 'success' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
          >
            Aceptar
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default PreguntasSection;
