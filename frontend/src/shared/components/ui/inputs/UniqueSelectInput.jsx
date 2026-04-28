import React, { useState, useMemo } from 'react';
import SelectInput from './SelectInput';
import { Modal } from '@/features/modal';
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
  ...props
}) => {
  const { options: dbOptions, loading } = useUniqueValues(tableName, columnName);
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
        interactButtonText="..."
        interactButtonOnClick={() => setIsModalOpen(true)}
      />

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
