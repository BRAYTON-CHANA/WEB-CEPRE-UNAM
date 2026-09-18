import React, { useMemo, useState } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import { useReferenceData } from '@/shared/hooks/useReferenceData';

const DEFAULT_CONFIG = {
  tableName: 'USUARIOS',
  valueField: 'ID_USUARIO',
  labelTemplate: '{APELLIDO_PATERNO} {APELLIDO_MATERNO} {NOMBRES} - {EMAIL}',
  descriptionField: 'EMAIL',
  filters: [{ field: 'ACTIVO', op: '=', value: 1 }],
};

const defaultOp = (type) => {
  if (type === 'number' || type === 'date') return 'eq';
  if (type === 'text') return 'ilike';
  return '';
};

const opOptions = {
  text: [
    { value: 'ilike', label: 'Contiene' },
    { value: 'eq', label: 'Igual a' },
  ],
  number: [
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'eq', label: '=' },
    { value: 'gte', label: '>=' },
    { value: 'lte', label: '<=' },
  ],
  date: [
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'eq', label: '=' },
    { value: 'gte', label: '>=' },
    { value: 'lte', label: '<=' },
  ],
};

const matchText = (raw, field, op, value) => {
  const rawText = String(raw[field] ?? '').toLowerCase();
  const search = String(value).toLowerCase();
  if (op === 'ilike' || op === 'contains') return rawText.includes(search);
  if (op === 'eq') return rawText === search;
  return false;
};

const applyClientFilters = (options, filterFields, filterValues) => {
  if (!options?.length || !filterFields?.length) return options;

  return options.filter((option) => {
    const raw = option.raw || {};
    return filterFields.every(({ field, type = 'text' }) => {
      const fv = filterValues[field];
      if (!fv) return true;
      const { op, value } = fv;
      if (value === '' || value == null) return true;

      if (type === 'boolean') {
        const target = value === 'true';
        return raw[field] === target;
      }

      if (type === 'number') {
        const num = Number(value);
        const rawNum = Number(raw[field]);
        if (Number.isNaN(num) || Number.isNaN(rawNum)) return false;
        if (op === 'eq') return rawNum === num;
        if (op === 'gt') return rawNum > num;
        if (op === 'lt') return rawNum < num;
        if (op === 'gte') return rawNum >= num;
        if (op === 'lte') return rawNum <= num;
        return false;
      }

      if (type === 'date') {
        const rawDate = String(raw[field] ?? '');
        const strDate = String(value);
        if (op === 'eq') return rawDate === strDate;
        if (op === 'gt') return rawDate > strDate;
        if (op === 'lt') return rawDate < strDate;
        if (op === 'gte') return rawDate >= strDate;
        if (op === 'lte') return rawDate <= strDate;
        return false;
      }

      return matchText(raw, field, op, value);
    });
  });
};

const UserPickerModal = ({ isOpen, onClose, onSelect, config }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [filterValues, setFilterValues] = useState({});
  const [showAllFilters, setShowAllFilters] = useState(false);

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const filterFields = cfg.filterFields || [];
  const visibleFilterFields = showAllFilters ? filterFields : filterFields.slice(0, 8);

  const { options, loading } = useReferenceData({
    tableName: cfg.tableName,
    valueField: cfg.valueField,
    labelTemplate: cfg.labelTemplate,
    descriptionField: cfg.descriptionField,
    filters: cfg.filters,
    referenceDisplayFields: cfg.referenceDisplayFields,
  });

  React.useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelected(new Set());
      setFilterValues({});
      setShowAllFilters(false);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    let list = options || [];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          (o.label || '').toLowerCase().includes(q) ||
          (o.description || '').toLowerCase().includes(q)
      );
    }

    return applyClientFilters(list, filterFields, filterValues);
  }, [options, search, filterFields, filterValues]);

  const toggle = (value) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const handleSelectAll = () => {
    const all = filtered.map((o) => o.value);
    const allSelected = all.every((v) => selected.has(v));
    setSelected((prev) => {
      const next = new Set(prev);
      all.forEach((v) => {
        if (allSelected) next.delete(v);
        else next.add(v);
      });
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedOptions = (options || []).filter((o) => selected.has(o.value));
    onSelect(selectedOptions.map((o) => ({
      id: o.value,
      email: o.description,
      label: o.label,
      type: 'user',
      rowData: o.raw,
    })));
    onClose();
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setSearch('');
    setShowAllFilters(false);
  };

  const handleOpChange = (field, type, op) => {
    setFilterValues((prev) => {
      const current = prev[field] || { op: defaultOp(type), value: '' };
      return { ...prev, [field]: { ...current, op } };
    });
  };

  const handleValueChange = (field, type, rawValue) => {
    setFilterValues((prev) => {
      const current = prev[field] || { op: defaultOp(type), value: '' };
      let value = rawValue;
      if (type === 'number' && value !== '') value = Number(value);
      if (type === 'number' && value === '') value = '';
      return { ...prev, [field]: { ...current, value } };
    });
  };

  const allSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.value));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cfg.title || 'Añadir usuarios'}
      size="2xl"
      bodyClassName="space-y-5"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-slate-500">
            {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-[#25346A] rounded-lg hover:bg-[#1c2753] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Añadir {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
          </div>
        </div>
      }
    >
      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#43B3C1] focus:border-[#43B3C1] outline-none"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Filtros */}
      {filterFields.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Filtros por campo del view</h3>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-medium text-slate-500 hover:text-[#25346A]"
            >
              Limpiar
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {visibleFilterFields.map(({ field, label, type = 'text' }) => {
              const fv = filterValues[field] || { op: defaultOp(type), value: '' };

              if (type === 'boolean') {
                return (
                  <div key={field} className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 truncate">
                      {label}
                    </label>
                    <select
                      value={fv.value || ''}
                      onChange={(e) =>
                        setFilterValues((prev) => ({
                          ...prev,
                          [field]: { op: '', value: e.target.value },
                        }))
                      }
                      className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-[#43B3C1] focus:border-[#43B3C1] outline-none"
                    >
                      <option value="">Todos</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                );
              }

              const operators = opOptions[type] || opOptions.text;

              return (
                <div key={field} className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 truncate">
                    {label}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={fv.op}
                      onChange={(e) => handleOpChange(field, type, e.target.value)}
                      className="shrink-0 w-20 px-1.5 py-1 border border-slate-300 rounded-md text-xs bg-slate-50 focus:ring-2 focus:ring-[#43B3C1] focus:border-[#43B3C1] outline-none"
                    >
                      {operators.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                      value={fv.value}
                      onChange={(e) => handleValueChange(field, type, e.target.value)}
                      placeholder={type === 'text' ? '...' : 'Valor'}
                      className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-[#43B3C1] focus:border-[#43B3C1] outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {filterFields.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllFilters((s) => !s)}
              className="w-full py-1.5 text-xs font-medium text-[#25346A] bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {showAllFilters ? 'Ver menos filtros' : `Ver ${filterFields.length - 8} filtros más`}
            </button>
          )}
        </div>
      )}

      {/* Resultados */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={loading || filtered.length === 0}
            className="text-sm font-medium text-[#25346A] hover:text-[#43B3C1] disabled:text-slate-400"
          >
            {allSelected ? 'Desmarcar todos' : 'Seleccionar todos'}
          </button>
          <span className="text-xs text-slate-400">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="pr-1">
          {loading && (
            <div className="flex items-center justify-center py-8 text-sm text-slate-500">
              Cargando...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-400">
              {search || Object.keys(filterValues).length > 0 ? 'No se encontraron resultados' : 'No hay registros'}
            </div>
          )}
          {!loading && filtered.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.has(option.value)}
                onChange={() => toggle(option.value)}
                className="w-4 h-4 text-[#25346A] border-slate-300 rounded focus:ring-[#43B3C1]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{option.label}</p>
                <p className="text-xs text-slate-500 truncate">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default UserPickerModal;
