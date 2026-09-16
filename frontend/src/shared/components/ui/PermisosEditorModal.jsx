import React, { useMemo } from 'react';
import MultiSelectEditorModal from './MultiSelectEditorModal';
import { useReferenceData } from '@/shared/hooks/useReferenceData';

/**
 * PermisosEditorModal — Modal para editar permisos de un rol.
 *
 * Carga TODOS los permisos activos de la tabla PERMISOS,
 * los agrupa por RECURSO y marca los actuales usando selectedValues.
 *
 * Props:
 * - isOpen, onClose, title
 * - selectedValues: array de IDs de permisos actuales
 * - onSave: (selectedIds) => void
 * - loading: boolean (guardando)
 */
const PermisosEditorModal = ({
  isOpen,
  onClose,
  title = 'Editar Permisos',
  selectedValues = [],
  onSave,
  loading = false
}) => {
  const config = useMemo(() => ({
    tableName: 'PERMISOS',
    valueField: 'ID_PERMISO',
    labelTemplate: '{RECURSO}: {ACCION}',
    descriptionField: 'DESCRIPCION',
    filters: [{ field: 'ACTIVO', op: '=', value: true }]
  }), []);

  const { options, loading: loadingOptions } = useReferenceData(isOpen ? config : null);

  const formattedOptions = useMemo(() =>
    options.map(opt => {
      const raw = opt.raw || {};
      return {
        value: opt.value,
        label: opt.label,
        description: raw.DESCRIPCION,
        group: raw.RECURSO
      };
    })
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
      placeholder="Buscar permiso..."
      emptyMessage="No hay permisos disponibles"
      groupTitle={(name) => name}
    />
  );
};

export default PermisosEditorModal;
