import React from 'react';
import Modal from '@/features/modal/views/Modal';
import MatrizHorarioForm from './MatrizHorarioForm';

/**
 * Modal contenedor del formulario matriz de días + plantilla de bloques.
 * Submit todavía sin lógica (placeholder).
 */
const MatrizHorarioModal = ({
  isOpen,
  onClose,
  customBlocks,
  selectedGrupoNombre,
  idGrupo,
  idHorario,
  formData,
  calendarStartHour = 7
}) => {
  const handleSubmit = (payload) => {
    // Placeholder: por ahora solo log. Cierra el modal igual.
    console.log('[MatrizHorarioModal] Payload recibido (sin persistencia):', payload);
    onClose?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar días de horario"
      size="full"
      widthClass="w-full"
      headerGradient="bg-gradient-to-r from-[#2D366F] to-[#57C7C2]"
      headerPattern="bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:16px_16px]"
    >
      <MatrizHorarioForm
        customBlocks={customBlocks}
        selectedGrupoNombre={selectedGrupoNombre}
        idGrupo={idGrupo}
        idHorario={idHorario}
        formData={formData}
        calendarStartHour={calendarStartHour}
        onCancel={onClose}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
};

export default MatrizHorarioModal;
