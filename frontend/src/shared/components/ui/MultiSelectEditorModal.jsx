import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import ToggleSwitch from '@/shared/components/ui/inputs/ToggleSwitch';

/**
 * MultiSelectEditorModal — Modal genérico para seleccionar múltiples opciones agrupables.
 *
 * Props:
 * - isOpen, onClose, title
 * - options: array de { value, label, description, group? }
 * - loadingOptions: boolean
 * - selectedValues: array de values actuales
 * - onSave: (selectedValues) => void
 * - loading: boolean (guardando)
 * - placeholder?: string
 * - emptyMessage?: string
 * - groupTitle?: (groupName) => string — transforma el nombre del grupo para el UI
 */
const MultiSelectEditorModal = ({
  isOpen,
  onClose,
  title = 'Seleccionar',
  options = [],
  loadingOptions = false,
  selectedValues = [],
  onSave,
  loading = false,
  placeholder = 'Buscar...',
  emptyMessage = 'No hay opciones disponibles',
  groupTitle = (name) => name
}) => {
  const [search, setSearch] = useState('');
  const [checked, setChecked] = useState(new Set());
  const [collapsed, setCollapsed] = useState(new Set());

  // Reset checked solo cuando el modal se ABRE
  useEffect(() => {
    if (isOpen) {
      setChecked(new Set((selectedValues || []).map(v => String(v))));
      setSearch('');
      setCollapsed(new Set());
    }
  }, [isOpen]);

  const handleToggle = useCallback((value) => {
    const key = String(value);
    setChecked(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleToggleCollapse = useCallback((groupName) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(groupName) ? next.delete(groupName) : next.add(groupName);
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

  const searchTerm = search.toLowerCase().trim();

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt => {
      const text = [opt.label, opt.description, opt.group]
        .filter(Boolean).join(' ').toLowerCase();
      return text.includes(searchTerm);
    });
  }, [options, searchTerm]);

  const grouped = useMemo(() => {
    const hasGroups = options.some(opt => opt.group);
    if (!hasGroups) {
      return [{ name: null, options: filteredOptions }];
    }
    const groups = new Map();
    filteredOptions.forEach(opt => {
      const key = String(opt.group ?? 'otros');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(opt);
    });
    return Array.from(groups.entries())
      .map(([name, groupOptions]) => ({ name, options: groupOptions }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredOptions, options]);

  const totalChecked = checked.size;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="3xl"
      closeOnOutsideClick={false}
      bodyClassName="p-0"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {totalChecked} seleccionado{totalChecked !== 1 ? 's' : ''}
            </span>
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="px-6 pt-5 pb-3 border-b border-slate-100">
        <p className="text-sm text-slate-500">
          Marca las opciones que deseas asignar.
        </p>
      </div>

      <div className="sticky top-0 z-10 bg-white px-6 pt-4 pb-4 border-b border-slate-100">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-11 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent bg-slate-50/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-5 relative">
        {loadingOptions && (
          <div className="flex items-center justify-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mr-3" />
            <p className="text-slate-500 text-sm">Cargando opciones...</p>
          </div>
        )}

        {!loadingOptions && filteredOptions.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-400 text-sm">
              {search.trim() ? 'No se encontraron opciones' : emptyMessage}
            </p>
          </div>
        )}

        {!loadingOptions && filteredOptions.length > 0 && (
          <div className="space-y-4">
            {grouped.map(({ name, options: groupOptions }, groupIdx) => {
              const isCollapsed = collapsed.has(name);
              const hasGroups = name !== null;
              return (
                <div
                  key={name ?? '__flat__'}
                  style={{ animationDelay: `${groupIdx * 60}ms` }}
                  className="animate-[fadeInUp_0.3s_ease-out] rounded-xl border border-slate-100 overflow-hidden"
                >
                  {hasGroups && (
                    <button
                      type="button"
                      onClick={() => handleToggleCollapse(name)}
                      className="flex items-center gap-2.5 w-full px-4 py-3 bg-slate-50/80 hover:bg-slate-100 transition-colors text-left"
                    >
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex-1">
                        {groupTitle(name)}
                      </h4>
                    </button>
                  )}
                  {!isCollapsed && (
                    <div className="space-y-1 p-2">
                      {groupOptions.map(opt => {
                        const value = String(opt.value);
                        const isChecked = checked.has(value);
                        return (
                          <div
                            key={value}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                              isChecked
                                ? 'bg-slate-50 hover:bg-slate-100'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <ToggleSwitch
                              checked={isChecked}
                              onChange={() => handleToggle(opt.value)}
                              size="sm"
                            />
                            <span className={`text-sm truncate ${isChecked ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                              {opt.label}
                            </span>
                            {opt.description && (
                              <span className="text-xs text-slate-400 truncate ml-auto pl-2">
                                {opt.description}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Overlay de guardado: oculta el estado de los checks mientras se guarda */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-2" />
            <p className="text-slate-600 text-sm font-medium">Guardando...</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MultiSelectEditorModal;
