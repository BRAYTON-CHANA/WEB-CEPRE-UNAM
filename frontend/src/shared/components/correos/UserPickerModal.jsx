import React, { useEffect, useMemo, useState } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import { useReferenceData } from '@/shared/hooks/useReferenceData';

const DEFAULT_CONFIG = {
  tableName: 'USUARIOS',
  valueField: 'ID_USUARIO',
  labelTemplate: '{APELLIDO_PATERNO} {APELLIDO_MATERNO} {NOMBRES} - {EMAIL}',
  descriptionField: 'EMAIL',
  filters: [{ field: 'ACTIVO', op: '=', value: 1 }],
};

const UserPickerModal = ({ isOpen, onClose, onSelect, config }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());

  const cfg = { ...DEFAULT_CONFIG, ...config };

  const { options, loading } = useReferenceData({
    tableName: cfg.tableName,
    valueField: cfg.valueField,
    labelTemplate: cfg.labelTemplate,
    descriptionField: cfg.descriptionField,
    filters: cfg.filters,
  });

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelected(new Set());
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options || [];
    return (options || []).filter(o =>
      (o.label || '').toLowerCase().includes(q) ||
      (o.description || '').toLowerCase().includes(q)
    );
  }, [options, search]);

  const toggle = (value) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const handleSelectAll = () => {
    const all = filtered.map(o => o.value);
    const allSelected = all.every(v => selected.has(v));
    setSelected(prev => {
      const next = new Set(prev);
      all.forEach(v => {
        if (allSelected) next.delete(v);
        else next.add(v);
      });
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedOptions = (options || []).filter(o => selected.has(o.value));
    onSelect(selectedOptions.map(o => ({
      id: o.value,
      email: o.description,
      label: o.label,
      type: 'user',
      rowData: o.raw,
    })));
    onClose();
  };

  const allSelected = filtered.length > 0 && filtered.every(o => selected.has(o.value));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cfg.title || 'Añadir usuarios'}
      size="lg"
      bodyClassName="p-4 space-y-4"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-gray-500">
            {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Añadir {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
          </div>
        </div>
      }
    >
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={loading || filtered.length === 0}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          {allSelected ? 'Desmarcar todos' : 'Seleccionar todos'}
        </button>
      </div>

      <div className="max-h-[320px] overflow-y-auto pr-1">
        {loading && (
          <div className="flex items-center justify-center py-8 text-sm text-gray-500">
            Cargando...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">
            {search ? 'No se encontraron resultados' : 'No hay registros'}
          </div>
        )}
        {!loading && filtered.map(option => (
          <label
            key={option.value}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.has(option.value)}
              onChange={() => toggle(option.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{option.label}</p>
              <p className="text-xs text-gray-500 truncate">{option.description}</p>
            </div>
          </label>
        ))}
      </div>
    </Modal>
  );
};

export default UserPickerModal;
