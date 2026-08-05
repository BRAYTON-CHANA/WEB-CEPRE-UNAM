import React, { useMemo } from 'react';

/**
 * Componente reutilizable para selección múltiple tipo checkbox array.
 * @param {string} name - Nombre del campo
 * @param {string} label - Etiqueta del campo
 * @param {Array<{value: string, label: string, description?: string}>} options - Opciones disponibles
 * @param {string[]} value - Array de valores seleccionados
 * {Function} onChange - Callback (name, selectedValues)
 * @param {string} maxHeight - Altura máxima del contenedor (ej: 'max-h-40')
 * @param {boolean} searchable - Mostrar campo de búsqueda
 * @param {string} emptyMessage - Mensaje cuando no hay opciones
 */
const CheckArrayInput = ({
  name,
  label,
  options = [],
  value = [],
  onChange,
  maxHeight = 'max-h-48',
  searchable = false,
  emptyMessage = 'No hay opciones disponibles'
}) => {
  const [search, setSearch] = React.useState('');

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      (o.label || '').toLowerCase().includes(q) ||
      (o.description || '').toLowerCase().includes(q)
    );
  }, [options, search]);

  const toggle = (val) => {
    const valStr = String(val);
    const current = (value || []).map(String);
    const next = current.includes(valStr)
      ? current.filter(v => v !== valStr)
      : [...current, valStr];
    onChange?.(name, next);
  };

  const isChecked = (val) => (value || []).map(String).includes(String(val));

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      {searchable && (
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      )}
      <div className={`border border-gray-300 rounded-lg p-2 ${maxHeight} overflow-y-auto`}>
        {filteredOptions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">{emptyMessage}</p>
        ) : (
          filteredOptions.map((opt, i) => (
            <label
              key={opt.value ?? i}
              className="flex items-center gap-2 py-1 text-sm hover:bg-gray-50 px-2 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isChecked(opt.value)}
                onChange={() => toggle(opt.value)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <div className="min-w-0 flex-1">
                <span className="text-gray-800">{opt.label}</span>
                {opt.description && (
                  <p className="text-xs text-gray-400 truncate">{opt.description}</p>
                )}
              </div>
            </label>
          ))
        )}
      </div>
      {(value || []).length > 0 && (
        <p className="text-xs text-gray-400 mt-1">{value.length} seleccionado(s)</p>
      )}
    </div>
  );
};

export default CheckArrayInput;
