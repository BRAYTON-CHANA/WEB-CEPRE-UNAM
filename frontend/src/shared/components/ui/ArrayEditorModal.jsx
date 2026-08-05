import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import { useReferenceData } from '@/shared/hooks/useReferenceData';

const formatTemplate = (template, record) =>
  template.replace(/\{(\w+)\}/g, (_, field) => record[field] ?? '');

/**
 * ArrayEditorModal — Modal reutilizable para editar arrays de referencias.
 *
 * Modo auto-load: pasa tableName + valueField + labelField y el componente carga las opciones.
 * Modo manual: pasa `options` directamente (array de { value, label, raw }).
 *
 * Features:
 * - Búsqueda de texto por searchField
 * - Agrupación visual por groupByField (headers de sección)
 * - Checkboxes con estado inicial desde selectedValues
 */
const ArrayEditorModal = ({
  isOpen,
  onClose,
  title,
  // Modo auto-load
  tableName,
  valueField,
  labelField,
  labelTemplate,
  filters,
  // Modo manual
  options: manualOptions,
  // Comunes
  selectedValues = [],
  onSave,
  loading = false,
  searchField,
  searchPlaceholder = 'Buscar...',
  groupByField,
  optionLabelTemplate
}) => {
  const [search, setSearch] = useState('');
  const [checked, setChecked] = useState(new Set());

  // Config para useReferenceData (solo si no hay manualOptions)
  // labelTemplate ensures its fields are loaded; descriptionField ensures searchField is loaded
  const config = useMemo(() => {
    if (manualOptions) return null;
    return {
      tableName,
      valueField,
      labelField: labelTemplate ? undefined : labelField,
      labelTemplate,
      descriptionField: searchField,
      filters
    };
  }, [manualOptions, tableName, valueField, labelField, labelTemplate, searchField, filters]);

  const { options: loadedOptions, loading: loadingOptions } = useReferenceData(
    config && isOpen ? config : null
  );

  const options = manualOptions || loadedOptions || [];

  // Reset checked cuando se abre o cambian selectedValues
  useEffect(() => {
    if (isOpen) {
      setChecked(new Set((selectedValues || []).map(v => String(v))));
      setSearch('');
    }
  }, [isOpen, selectedValues]);

  const handleToggle = useCallback((value) => {
    const key = String(value);
    setChecked(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    const result = Array.from(checked).map(v => {
      const num = Number(v);
      return isNaN(num) ? v : num;
    });
    onSave(result);
  }, [checked, onSave]);

  // Filtrar por búsqueda
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(opt => {
      const raw = opt.raw || {};
      const searchIn = searchField ? String(raw[searchField] ?? '') : opt.label;
      return searchIn.toLowerCase().includes(q);
    });
  }, [options, search, searchField]);

  // Agrupar por groupByField
  const grouped = useMemo(() => {
    if (!groupByField) return null;
    const groups = new Map();
    filteredOptions.forEach(opt => {
      const raw = opt.raw || {};
      const key = String(raw[groupByField] ?? 'Sin grupo');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(opt);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredOptions, groupByField]);

  const renderCheckbox = (opt) => {
    const value = String(opt.value);
    const isChecked = checked.has(value);
    const label = optionLabelTemplate && opt.raw
      ? formatTemplate(optionLabelTemplate, opt.raw)
      : opt.label;

    return (
      <label
        key={value}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
          isChecked ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'
        }`}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => handleToggle(opt.value)}
          className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
        />
        <span className={`text-base ${isChecked ? 'text-indigo-900 font-medium' : 'text-gray-700'}`}>
          {label}
        </span>
      </label>
    );
  };

  const totalChecked = checked.size;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
      closeOnOutsideClick={false}
      bodyClassName="p-0"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-base text-gray-500">
            {totalChecked} seleccionado{totalChecked !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Guardar
            </button>
          </div>
        </div>
      }
    >
      {/* Búsqueda */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de opciones */}
      <div className="px-6 py-4">
        {loadingOptions && (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mr-3" />
            <p className="text-gray-500 text-base">Cargando opciones...</p>
          </div>
        )}

        {!loadingOptions && filteredOptions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-base">
              {search.trim() ? 'No se encontraron resultados' : 'No hay opciones disponibles'}
            </p>
          </div>
        )}

        {!loadingOptions && filteredOptions.length > 0 && (
          <>
            {grouped ? (
              <div className="space-y-6">
                {grouped.map(([groupName, groupOptions]) => (
                  <div key={groupName}>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        {groupName}
                      </h4>
                      <span className="text-sm text-gray-400">
                        ({groupOptions.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {groupOptions.map(renderCheckbox)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map(renderCheckbox)}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ArrayEditorModal;
