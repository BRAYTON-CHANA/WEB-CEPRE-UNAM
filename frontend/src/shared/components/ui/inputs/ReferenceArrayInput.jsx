import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import { useReferenceData } from '@/shared/hooks/useReferenceData';
import { evaluateOperatorSet } from '@/shared/components/form/utils/conditionEvaluator';

const EMPTY_FILTERS = {};

/**
 * ReferenceArrayInput - Selección múltiple con dropdown popover y checkboxes
 *
 * Reemplaza el SelectInput multiSelect por un dropdown propio con:
 * - Checkboxes estilizados por opción
 * - Búsqueda integrada
 * - Contador de seleccionados
 * - Tags removibles debajo
 * - Navegación por teclado
 * - Botones de refresh y add opcionales
 */
const ReferenceArrayInput = React.memo(({
  name,
  label,
  referenceTable,
  referenceField,
  referenceLabelField,
  referenceQuery,
  referenceDescriptionField,
  referenceFilters = EMPTY_FILTERS,
  searchable = false,
  placeholder = 'Seleccionar...',
  blocked = null,
  hidden = null,
  formData = {},
  showRefreshButton = false,
  showAddButton = false,
  addComponent: AddComponent = null,
  addModalTitle = 'Nueva referencia',
  addModalSize = 'lg',
  onChange,
  value,
  required,
  disabled,
  error,
  touched,
  validation,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addSuccessRecord, setAddSuccessRecord] = useState(null);
  const originalValueRef = useRef(value);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // --- Evaluación de condiciones ---
  const isBlocked = useMemo(() => {
    if (!blocked) return false;
    return evaluateOperatorSet(blocked, formData);
  }, [blocked, formData]);

  const isHidden = useMemo(() => {
    if (!hidden) return false;
    return evaluateOperatorSet(hidden, formData);
  }, [hidden, formData]);

  const shouldLoadData = !isBlocked && !isHidden;

  // --- Carga de datos de referencia ---
  const config = useMemo(() => ({
    tableName: referenceTable,
    valueField: referenceField,
    labelField: referenceLabelField,
    labelTemplate: referenceQuery,
    descriptionField: referenceDescriptionField,
    filters: referenceFilters,
    referenceOriginalValue: originalValueRef.current
  }), [referenceTable, referenceField, referenceLabelField, referenceQuery, referenceDescriptionField, referenceFilters]);

  const { options, loading, refresh } = useReferenceData(shouldLoadData ? config : null);

  // --- Normalizar valor a array ---
  const currentValues = useMemo(() => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined || value === '') return [];
    return [value];
  }, [value]);

  // --- Opciones filtradas por búsqueda ---
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm) return options;
    const q = searchTerm.toLowerCase();
    return options.filter(opt =>
      String(opt.label || '').toLowerCase().includes(q) ||
      String(opt.description || '').toLowerCase().includes(q)
    );
  }, [options, searchTerm, searchable]);

  // --- Opciones seleccionadas (para tags) ---
  const selectedOptions = useMemo(() => {
    return options.filter(opt =>
      currentValues.some(v => String(opt.value) === String(v))
    );
  }, [options, currentValues]);

  // --- Helpers de selección ---
  const isChecked = useCallback((optValue) => {
    return currentValues.some(v => String(v) === String(optValue));
  }, [currentValues]);

  const toggleOption = useCallback((optValue) => {
    const valStr = String(optValue);
    const current = currentValues.map(String);
    const next = current.includes(valStr)
      ? current.filter(v => v !== valStr)
      : [...current, valStr];
    onChange(name, next);
  }, [currentValues, name, onChange]);

  const handleRemoveTag = useCallback((optValue) => {
    const valStr = String(optValue);
    const next = currentValues.map(String).filter(v => v !== valStr);
    onChange(name, next);
  }, [currentValues, name, onChange]);

  const handleClearAll = useCallback(() => {
    onChange(name, []);
  }, [name, onChange]);

  const handleSelectAll = useCallback(() => {
    const allValues = filteredOptions.map(o => String(o.value));
    const current = currentValues.map(String);
    // Solo agregar los que no están ya seleccionados y que están visibles
    const merged = [...new Set([...current, ...allValues])];
    onChange(name, merged);
  }, [filteredOptions, currentValues, name, onChange]);

  // --- Add record desde modal ---
  useEffect(() => {
    if (addSuccessRecord && addSuccessRecord[referenceField] != null) {
      const newId = addSuccessRecord[referenceField];
      if (!currentValues.some(v => String(v) === String(newId))) {
        onChange(name, [...currentValues, newId]);
      }
      setAddSuccessRecord(null);
    }
  }, [addSuccessRecord, referenceField, currentValues, name, onChange]);

  const handleAddSuccess = (result) => {
    const data = result?.data ?? result;
    const record = Array.isArray(data) ? data[0] : data;
    setAddSuccessRecord(record);
    setIsAddOpen(false);
    refresh();
  };

  const handleAddError = (error) => {
    console.error('[ReferenceArrayInput] Error creando referencia:', error);
  };

  // --- Click outside para cerrar dropdown ---
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // --- Focus al search al abrir ---
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen, searchable]);

  // --- Scroll al item destacado ---
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return;
    const el = listRef.current?.querySelector(`[data-idx="${highlightedIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, isOpen]);

  // --- Navegación por teclado ---
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!disabled && !isBlocked) setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          toggleOption(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        setSearchTerm('');
        break;
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        setSearchTerm('');
        break;
    }
  };

  if (isHidden) return null;

  const isDisabled = disabled || isBlocked;
  const hasError = error && touched;
  const allVisibleChecked = filteredOptions.length > 0 && filteredOptions.every(o => isChecked(o.value));
  const someVisibleChecked = filteredOptions.some(o => isChecked(o.value)) && !allVisibleChecked;

  return (
    <div className="relative" ref={containerRef}>
      {/* Label */}
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Fila: trigger + botones auxiliares */}
      <div className="flex items-end gap-1">
        {/* Trigger del dropdown */}
        <div className="flex-1 min-w-0">
          <div
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            tabIndex={isDisabled ? -1 : 0}
            onClick={() => !isDisabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className={`
              relative flex items-center min-h-[40px] w-full px-3 py-2 border rounded-md
              transition-colors duration-200 cursor-pointer
              ${isOpen
                ? 'ring-2 ring-blue-500 border-blue-500 bg-white'
                : hasError
                  ? 'border-red-400 bg-white hover:border-red-500'
                  : isDisabled
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-400'
                    : 'bg-white border-gray-300 hover:border-gray-400'
              }
            `}
          >
            {/* Contenido del trigger */}
            {selectedOptions.length === 0 ? (
              <span className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-400'}`}>
                {placeholder}
              </span>
            ) : (
              <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">
                {selectedOptions.length} rol{selectedOptions.length !== 1 ? 'es' : ''} seleccionado{selectedOptions.length !== 1 ? 's' : ''}
              </span>
            )}

            {/* Loading spinner */}
            {loading && (
              <svg className="w-4 h-4 ml-2 text-blue-500 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}

            {/* Chevron */}
            <svg
              className={`w-4 h-4 ml-2 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Botón Add */}
        {showAddButton && AddComponent && (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            title={addModalTitle}
            className="flex-shrink-0 self-end h-10 w-10 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-400 hover:text-green-600 hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        {/* Botón Refresh */}
        {showRefreshButton && (
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            title="Actualizar opciones"
            className="flex-shrink-0 self-end h-10 w-10 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-40"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}

      {/* Dropdown popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] overflow-hidden">
          {/* Search bar */}
          {searchable && (
            <div className="p-2 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  placeholder="Buscar..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
            </div>
          )}

          {/* Toolbar: seleccionar todo / limpiar */}
          {filteredOptions.length > 0 && (
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={allVisibleChecked ? handleClearAll : handleSelectAll}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {allVisibleChecked ? 'Limpiar selección' : 'Seleccionar todos'}
              </button>
              <span className="text-xs text-gray-400">
                {filteredOptions.length} opción{filteredOptions.length !== 1 ? 'es' : ''}
              </span>
            </div>
          )}

          {/* Lista de opciones con checkboxes */}
          <div
            ref={listRef}
            className="overflow-y-auto max-h-60"
            role="listbox"
          >
            {loading ? (
              <div className="px-3 py-8 text-center text-sm text-gray-400">
                Cargando opciones...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-gray-400">
                {searchTerm ? 'No se encontraron resultados' : 'No hay opciones disponibles'}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const checked = isChecked(opt.value);
                const isHighlighted = idx === highlightedIndex;
                return (
                  <div
                    key={opt.value ?? idx}
                    data-idx={idx}
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggleOption(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`
                      flex items-start gap-2.5 px-3 py-2 cursor-pointer border-b border-gray-50 last:border-b-0
                      transition-colors duration-100
                      ${checked ? 'bg-blue-50' : ''}
                      ${isHighlighted && !checked ? 'bg-gray-50' : ''}
                      ${isHighlighted && checked ? 'bg-blue-100' : ''}
                    `}
                  >
                    {/* Checkbox estilizado */}
                    <div className={`
                      flex-shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center
                      transition-all duration-150
                      ${checked
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-300 group-hover:border-blue-400'
                      }
                      ${isHighlighted && !checked ? 'border-blue-400' : ''}
                    `}>
                      {checked && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Label + descripción */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${checked ? 'text-blue-900' : 'text-gray-800'}`}>
                        {opt.label}
                      </div>
                      {opt.description && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {opt.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer del dropdown */}
          {filteredOptions.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {selectedOptions.length} seleccionado{selectedOptions.length !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setHighlightedIndex(-1);
                  setSearchTerm('');
                }}
                className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tags removibles debajo */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedOptions.map(opt => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
            >
              {opt.label}
              <button
                type="button"
                onClick={() => handleRemoveTag(opt.value)}
                className="flex-shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-700 hover:bg-blue-100 transition-colors"
                aria-label={`Remover ${opt.label}`}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Modal para agregar nueva referencia */}
      {showAddButton && AddComponent && (
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title={addModalTitle}
          size={addModalSize}
          closeOnOutsideClick={false}
          bodyClassName="p-6"
        >
          <AddComponent
            mode="create"
            onSuccess={handleAddSuccess}
            onError={handleAddError}
          />
        </Modal>
      )}
    </div>
  );
});

ReferenceArrayInput.displayName = 'ReferenceArrayInput';

export default ReferenceArrayInput;
