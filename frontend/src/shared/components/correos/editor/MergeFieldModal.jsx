import React, { useMemo, useState } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import { MergeFieldIcon } from '../CorreoIcons';

const MergeFieldModal = ({ isOpen, onClose, mergeFields = [], onInsert }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return mergeFields;
    const q = search.toLowerCase();
    return mergeFields.filter(
      ({ field, label }) =>
        field.toLowerCase().includes(q) || label.toLowerCase().includes(q)
    );
  }, [mergeFields, search]);

  const handleSelect = (field) => {
    onInsert?.({ field: field.field, label: field.label });
  };

  const handleClose = () => {
    setSearch('');
    onClose?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Campos personalizados"
      size="lg"
      closeOnOutsideClick
      bodyClassName="p-0 bg-white"
      headerGradient="indigo"
    >
      <div className="flex flex-col">
        {/* Header del buscador */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
          <p className="text-sm text-slate-500 mb-3">
            Selecciona un campo para insertarlo en el cuerpo del correo.
          </p>
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar campo..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              {filtered.length} campo{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}
              {mergeFields.length > 0 && filtered.length !== mergeFields.length && (
                <span className="text-slate-400"> de {mergeFields.length}</span>
              )}
            </span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Lista de campos */}
        <div className="px-5 py-4 max-h-[420px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400">
              <MergeFieldIcon className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No se encontraron campos</p>
              <p className="text-xs mt-1">Prueba con otro término</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map(({ field, label }) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => handleSelect({ field, label })}
                  className="group flex items-start gap-3 p-3.5 text-left border border-slate-200 rounded-xl bg-white hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-md transition-all duration-150"
                >
                  <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 group-hover:scale-105 transition-all">
                    <MergeFieldIcon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                      {label}
                    </span>
                  </span>
                  <svg
                    className="w-4 h-4 text-slate-300 group-hover:text-blue-500 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Click en un campo para insertarlo
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default MergeFieldModal;
