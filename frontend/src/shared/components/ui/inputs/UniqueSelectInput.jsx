import React, { useState, useMemo } from 'react';
import SelectInput from './SelectInput';
import { Modal } from '@/shared/components/modal';
import { useUniqueValues } from '@/shared/hooks/useUniqueValues';

/**
 * SelectInput para valores únicos de columna con opción de agregar nuevos
 * @param {string} tableName - Tabla para extraer valores únicos
 * @param {string} columnName - Columna para extraer valores
 * @param {boolean} allowCreate - Permitir agregar nuevos valores (botón ...)
 * @param {string} createTitle - Título del modal de creación
 */
const UniqueSelectInput = ({
  name,
  label,
  tableName,
  columnName,
  allowCreate = false,
  createTitle = 'Agregar Nuevo',
  searchable = false,
  showRefreshButton = true,
  ...props
}) => {
  const { options: dbOptions, loading, refresh } = useUniqueValues(tableName, columnName);
  const [tempOptions, setTempOptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newValue, setNewValue] = useState('');

  // Combinar opciones de BD + temporales
  const allOptions = useMemo(() => {
    const combined = [...dbOptions, ...tempOptions];
    // Eliminar duplicados (por si se agrega uno que ya existe)
    return [...new Map(combined.map(o => [o.value, o])).values()];
  }, [dbOptions, tempOptions]);

  const handleCreate = () => {
    if (!newValue.trim()) return;
    const trimmed = newValue.trim();
    
    // Verificar si ya existe
    const exists = allOptions.some(o => o.value === trimmed);
    if (exists) {
      // Solo seleccionarlo
      props.onChange?.(name, trimmed);
    } else {
      // Agregar como temporal y seleccionar
      const option = { value: trimmed, label: trimmed, isTemp: true };
      setTempOptions(prev => [...prev, option]);
      props.onChange?.(name, trimmed);
    }
    
    setNewValue('');
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setNewValue('');
    setIsModalOpen(false);
  };

  // Footer del Modal
  const modalFooter = (
    <div className="flex justify-end gap-2">
      <button 
        type="button"
        onClick={handleCancel} 
        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
      >
        Cancelar
      </button>
      <button 
        type="button"
        onClick={handleCreate} 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Agregar
      </button>
    </div>
  );

  return (
    <>
      <div className={showRefreshButton ? 'flex items-end gap-1' : undefined}>
        <div className={showRefreshButton ? 'flex-1 min-w-0' : undefined}>
          <SelectInput
            {...props}
            name={name}
            label={label}
            options={allOptions}
            loading={loading}
            searchable={searchable}
            optionValue="value"
            optionLabel="label"
            interactButton={allowCreate}
            interactButtonText={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            }
            interactButtonClassName="h-10 w-10 px-0 py-0 flex items-center justify-center text-gray-400 hover:text-green-600 hover:border-green-400 hover:bg-green-50"
            interactButtonOnClick={() => setIsModalOpen(true)}
          />
        </div>
        {showRefreshButton && (
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            title="Actualizar opciones"
            className="flex-shrink-0 self-end h-10 w-10 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-40"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title={createTitle}
        size="sm"
        footer={modalFooter}
        closeOnOutsideClick={true}
      >
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Ingresa el nuevo valor"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
      </Modal>
    </>
  );
};

export default UniqueSelectInput;
