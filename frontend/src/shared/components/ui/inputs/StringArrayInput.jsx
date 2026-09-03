import React, { useState, useEffect, useCallback } from 'react';

/**
 * StringArrayInput - Input reutilizable para editar un array de strings simples.
 *
 * Emite string[] vía onChange(name, arrayValue).
 * Acepta value como string[], string (JSON), o null/undefined → [].
 *
 * @param {string} name - Nombre del campo
 * @param {Array|string|null} value - Valor actual (array, JSON string, o null)
 * @param {Function} onChange - Callback(name, newArray)
 * @param {string} label - Etiqueta del campo
 * @param {string} placeholderItem - Placeholder para cada input individual
 * @param {boolean} disabled - Deshabilitar edición
 * @param {boolean} required - Marcar como requerido
 * @param {number} maxItems - Máximo número de items (opcional)
 * @param {number} maxItemLength - Máximo caracteres por item (opcional)
 */
const StringArrayInput = ({
  name,
  value,
  onChange,
  label,
  placeholderItem = 'Escriba un valor...',
  disabled = false,
  required = false,
  maxItems = null,
  maxItemLength = null
}) => {
  // Normalizar value a array
  const parseValue = (val) => {
    if (!val) return [''];
    if (Array.isArray(val)) return val.length > 0 ? val.map(String) : [''];
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed.map(String) : [''];
      } catch {
        // Si no es JSON, tratar como string único
        return val.trim() ? [val] : [''];
      }
    }
    return [''];
  };

  const [items, setItems] = useState(() => parseValue(value));

  // Sincronizar con value externo (ej: al cargar record en modo edit)
  useEffect(() => {
    setItems(parseValue(value));
  }, [value]);

  const notify = useCallback((newItems) => {
    // Filtrar items vacíos al final para no enviar strings vacíos
    const cleaned = newItems.map(s => s ?? '').map(s => String(s).trim());
    // Emitir array sin el último item vacío si está vacío (pero mantener al menos uno)
    const toEmit = cleaned.filter((s, i) => s !== '' || i < cleaned.length - 1);
    onChange?.(name, toEmit.length > 0 ? toEmit : []);
  }, [name, onChange]);

  const updateItem = (index, newValue) => {
    const updated = [...items];
    updated[index] = maxItemLength ? newValue.slice(0, maxItemLength) : newValue;
    setItems(updated);
    notify(updated);
  };

  const addItem = () => {
    if (maxItems && items.length >= maxItems) return;
    const updated = [...items, ''];
    setItems(updated);
    // No notificar todavía (item vacío)
  };

  const removeItem = (index) => {
    if (items.length <= 1) {
      // Si solo queda uno, vaciarlo en vez de eliminar
      setItems(['']);
      notify([]);
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    notify(updated);
  };

  // Iconos
  const IconPlus = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
  const IconX = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const canAddMore = !maxItems || items.length < maxItems;
  const nonEmptyCount = items.filter(s => s && s.trim()).length;

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              disabled={disabled}
              placeholder={placeholderItem}
              maxLength={maxItemLength || undefined}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              disabled={disabled}
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Quitar"
              aria-label="Quitar item"
            >
              <IconX />
            </button>
          </div>
        ))}
      </div>

      {canAddMore && !disabled && (
        <button
          type="button"
          onClick={addItem}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          <IconPlus />
          Agregar
        </button>
      )}

      {nonEmptyCount > 0 && (
        <p className="text-xs text-gray-400 mt-1.5">
          {nonEmptyCount} {nonEmptyCount === 1 ? 'item' : 'items'}
          {maxItems ? ` de ${maxItems} máximo` : ''}
        </p>
      )}
    </div>
  );
};

export default StringArrayInput;
