import React, { useMemo } from 'react';
import MultiSelectEditorModal from './MultiSelectEditorModal';
import { useReferenceData } from '@/shared/hooks/useReferenceData';

/**
 * SedesEditorModal — Modal para asignar sedes a un rol.
 *
 * Props:
 * - isOpen, onClose, title
 * - selectedValues: array de ID_SEDE actuales
 * - onSave: (selectedIds) => void
 * - loading: boolean (guardando)
 */
const SedesEditorModal = ({
  isOpen,
  onClose,
  title = 'Asignar Sedes',
  selectedValues = [],
  onSave,
  loading = false
}) => {
  const config = useMemo(() => ({
    tableName: 'SEDES',
    valueField: 'ID_SEDE',
    labelTemplate: '{NOMBRE_SEDE}',
    descriptionField: 'CODIGO_SEDE',
    filters: [{ field: 'ACTIVO', op: '=', value: true }]
  }), []);

  const { options, loading: loadingOptions } = useReferenceData(isOpen ? config : null);

  const formattedOptions = useMemo(() =>
    options.map(opt => ({
      value: opt.value,
      label: opt.label,
      description: opt.description
    }))
  , [options]);

  return (
    <MultiSelectEditorModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      options={formattedOptions}
      loadingOptions={loadingOptions}
      selectedValues={selectedValues}
      onSave={onSave}
      loading={loading}
      placeholder="Buscar sede..."
      emptyMessage="No hay sedes disponibles"
    />
  );
};

export default SedesEditorModal;
