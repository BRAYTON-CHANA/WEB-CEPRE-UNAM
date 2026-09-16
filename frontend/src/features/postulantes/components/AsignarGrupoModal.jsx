import React, { useState, useEffect } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import SelectInput from '@/shared/components/ui/inputs/SelectInput';
import { db } from '@/shared/api';

/**
 * Modal para asignar un grupo a uno o varios postulantes.
 * Filtra los grupos por ID_PERIODO e ID_SEDE_EXAMEN del primer postulante,
 * incluyendo grupos virtuales (sin sede).
 */
function AsignarGrupoModal({
  isOpen,
  onClose,
  onAssign,
  postulante,
  count = 1,
  loading = false
}) {
  const [grupoId, setGrupoId] = useState('');
  const [grupos, setGrupos] = useState([]);
  const [gruposLoading, setGruposLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGrupoId('');
      setGrupos([]);
    }
    if (isOpen && postulante && postulante.ID_PERIODO && postulante.ID_SEDE_EXAMEN != null) {
      setGruposLoading(true);
      db.executeFunction('obtener_grupos_disponibles', {
        p_id_periodo: Number(postulante.ID_PERIODO),
        p_id_sede: Number(postulante.ID_SEDE_EXAMEN)
      })
        .then((data) => {
          setGrupos(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error('Error cargando grupos disponibles:', err);
          setGrupos([]);
        })
        .finally(() => setGruposLoading(false));
    }
  }, [isOpen, postulante]);

  const options = grupos.map((g) => ({
    value: String(g.ID_GRUPO),
    label: `${g.CODIGO_GRUPO || ''} — ${g.NOMBRE_GRUPO || ''} · ${g.NOMBRE_SEDE || 'Virtual'} (${g.MODALIDAD || 'VIRTUAL'})`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Asignar grupo a ${count} postulante${count === 1 ? '' : 's'}`}
      size="md"
      loading={loading || gruposLoading}
      footer={(
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onAssign(grupoId)}
            disabled={!grupoId || loading || gruposLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {loading ? 'Asignando...' : 'Asignar'}
          </button>
        </div>
      )}
    >
      <div className="space-y-4 px-1">
        <p className="text-sm text-gray-600">
          Se muestran los grupos del periodo actual que coinciden con la sede de examen del postulante, incluyendo virtuales.
        </p>

        <SelectInput
          name="id_grupo"
          label="Grupo disponible"
          options={options}
          value={grupoId}
          onChange={(_, value) => setGrupoId(value || '')}
          placeholder="Seleccione un grupo..."
          searchable={true}
        />
      </div>
    </Modal>
  );
}

export default AsignarGrupoModal;
