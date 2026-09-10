import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import ToggleSwitch from '@/shared/components/ui/inputs/ToggleSwitch';
import { useReferenceData } from '@/shared/hooks/useReferenceData';

/**
 * PermisosEditorModal — Modal reutilizable para editar permisos de un rol.
 *
 * Carga TODOS los permisos de la tabla PERMISOS, los agrupa por RECURSO,
 * y marca los actuales usando selectedValues (array de IDs desde VW_ROLES).
 *
 * Props:
 * - isOpen, onClose, title
 * - selectedValues: array de IDs de permisos actuales
 * - onSave: (selectedIds) => void
 * - loading: boolean (estado de guardado)
 */
const PermisosEditorModal = ({
  isOpen,
  onClose,
  title = 'Editar Permisos',
  selectedValues = [],
  onSave,
  loading = false
}) => {
  const [search, setSearch] = useState('');
  const [checked, setChecked] = useState(new Set());
  const [collapsed, setCollapsed] = useState(new Set());

  // Cargar todos los permisos activos de la tabla PERMISOS
  // labelTemplate fuerza a que cargue RECURSO, ACCION y DESCRIPCION
  const config = useMemo(() => ({
    tableName: 'PERMISOS',
    valueField: 'ID_PERMISO',
    labelTemplate: '{RECURSO}: {ACCION}',
    descriptionField: 'DESCRIPCION',
    filters: [{ field: 'ACTIVO', op: '=', value: true }]
  }), []);

  const { options, loading: loadingOptions } = useReferenceData(isOpen ? config : null);

  // Reset checked solo cuando el modal se ABRE (no cuando se cierra)
  useEffect(() => {
    if (isOpen) {
      setChecked(new Set((selectedValues || []).map(v => String(v))));
      setSearch('');
      setCollapsed(new Set());
    }
  }, [isOpen]); // solo depende de isOpen, no de selectedValues

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

  // Filtrar por búsqueda
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(opt => {
      const raw = opt.raw || {};
      const searchIn = [raw.DESCRIPCION, raw.RECURSO, raw.ACCION, opt.label]
        .filter(Boolean).join(' ').toLowerCase();
      return searchIn.includes(q);
    });
  }, [options, search]);

  // Agrupar por RECURSO
  const grouped = useMemo(() => {
    const groups = new Map();
    filteredOptions.forEach(opt => {
      const raw = opt.raw || {};
      const key = String(raw.RECURSO ?? 'otros');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(opt);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredOptions]);

  const totalChecked = checked.size;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="3xl"
      closeOnOutsideClick={false}
      headerGradient="slate"
      headerPattern="dots"
      bodyClassName="p-0"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {totalChecked} permiso{totalChecked !== 1 ? 's' : ''} asignado{totalChecked !== 1 ? 's' : ''}
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
      {/* Subtítulo descriptivo */}
      <div className="px-6 pt-5 pb-3 border-b border-slate-100">
        <p className="text-sm text-slate-500">
          Activa los permisos que deseas asignar al rol. Los permisos se agrupan por recurso.
        </p>
      </div>

      {/* Búsqueda sticky */}
      <div className="sticky top-0 z-10 bg-white px-6 pt-4 pb-4 border-b border-slate-100">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar permiso..."
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

      {/* Lista de permisos agrupados */}
      <div className="px-6 py-5 max-h-[55vh] overflow-y-auto">
        {loadingOptions && (
          <div className="flex items-center justify-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mr-3" />
            <p className="text-slate-500 text-sm">Cargando permisos...</p>
          </div>
        )}

        {!loadingOptions && grouped.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-400 text-sm">
              {search.trim() ? 'No se encontraron permisos' : 'No hay permisos disponibles'}
            </p>
          </div>
        )}

        {!loadingOptions && grouped.length > 0 && (
          <div className="space-y-4">
            {grouped.map(([groupName, groupOptions], groupIdx) => {
              const isCollapsed = collapsed.has(groupName);
              return (
                <div
                  key={groupName}
                  style={{ animationDelay: `${groupIdx * 60}ms` }}
                  className="animate-[fadeInUp_0.3s_ease-out] rounded-xl border border-slate-100 overflow-hidden"
                >
                  {/* Header de grupo — click para colapsar */}
                  <button
                    type="button"
                    onClick={() => handleToggleCollapse(groupName)}
                    className="flex items-center gap-2.5 w-full px-4 py-3 bg-slate-50/80 hover:bg-slate-100 transition-colors text-left"
                  >
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex-1">
                      {groupName}
                    </h4>
                  </button>

                  {/* Permisos del grupo (colapsable) */}
                  {!isCollapsed && (
                    <div className="space-y-1 p-2">
                      {groupOptions.map(opt => {
                        const value = String(opt.value);
                        const isChecked = checked.has(value);
                        const raw = opt.raw || {};
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
                            <span className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded ${
                              isChecked
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-slate-50 text-slate-400'
                            }`}>
                              {raw.ACCION || ''}
                            </span>
                            <span className={`text-sm truncate ${
                              isChecked ? 'text-slate-700 font-medium' : 'text-slate-500'
                            }`}>
                              {raw.DESCRIPCION || opt.label}
                            </span>
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
      </div>
    </Modal>
  );
};

export default PermisosEditorModal;
