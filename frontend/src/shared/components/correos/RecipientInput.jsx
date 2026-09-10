import React, { useState, useCallback } from 'react';
import { emailRegex } from '@/shared/utils';
import UserPickerModal from './UserPickerModal';

/**
 * Campo de destinatarios estilo Outlook:
 * fila horizontal con etiqueta izquierda, chips en input de línea inferior y ... al final.
 */
const RecipientInput = ({ value = [], onChange, single = false, emailOnly = false, label = '', placeholder = 'Escriba un correo...', viewConfig }) => {
  const [emailInput, setEmailInput] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  // Si viewConfig está presente, se bloquea el ingreso manual de emails.
  const isViewLocked = !!viewConfig;

  const addEmail = useCallback((raw) => {
    if (isViewLocked) return;
    const trimmed = raw.trim();
    if (!trimmed || !emailRegex.test(trimmed)) return;
    if (value.some(v => v.email === trimmed)) {
      setEmailInput('');
      return;
    }
    const newItem = { type: 'email', id: trimmed, label: trimmed, email: trimmed };
    if (single) onChange([newItem]);
    else onChange([...value, newItem]);
    setEmailInput('');
  }, [value, onChange, single, isViewLocked]);

  const addUsers = useCallback((users) => {
    if (!users.length) return;
    const mapped = users.map(u =>
      emailOnly
        ? { type: 'email', id: u.email, label: u.label, email: u.email }
        : { type: 'user', id: u.id, label: u.label, email: u.email, rowData: u.rowData }
    );
    if (single) {
      onChange([mapped[0]]);
      return;
    }
    const newItems = mapped.filter(u => !value.some(v => v.email === u.email));
    onChange([...value, ...newItems]);
  }, [value, onChange, single, emailOnly]);

  const remove = (item) => {
    onChange(value.filter(v => v.id !== item.id));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      addEmail(emailInput);
    }
    if (e.key === 'Backspace' && !emailInput && value.length) {
      remove(value[value.length - 1]);
    }
  };

  const disabled = single && value.length > 0;

  const pickerConfig = viewConfig ? {
    tableName: viewConfig.view,
    valueField: viewConfig.idField,
    labelTemplate: viewConfig.labelTemplate,
    descriptionField: viewConfig.descriptionField,
    filters: [],
    filterFields: viewConfig.filterFields,
    title: `Añadir desde ${viewConfig.label}`,
  } : undefined;

  return (
    <div className="flex items-start gap-4 py-2 border-b border-gray-300 focus-within:border-blue-500 transition-colors">
      <label className="w-16 pt-1.5 text-sm font-medium text-gray-700 flex-shrink-0">{label}</label>
      <div className="flex-1 flex flex-wrap items-center gap-1.5 min-h-[28px]">
        {value.map(item => (
          <span
            key={item.id}
            className={`
              inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-md border font-medium
              ${item.type === 'user'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }
            `}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'user' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
            <span className="truncate max-w-[180px]">{item.label}</span>
            <button
              type="button"
              onClick={() => remove(item)}
              className="ml-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-black/10 text-current/70 hover:text-current"
              aria-label="Quitar"
            >
              ×
            </button>
          </span>
        ))}
        {!disabled && !isViewLocked && (
          <input
            type="text"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value.length ? '' : placeholder}
            className="flex-1 min-w-[80px] bg-transparent outline-none text-sm py-1 placeholder:text-gray-400"
          />
        )}
        {isViewLocked && value.length === 0 && (
          <span className="text-sm text-gray-400 italic py-1">Use el botón para añadir destinatarios del view</span>
        )}
        {disabled && value.length === 1 && (
          <span className="text-sm text-gray-400 italic py-1">Destinatario seleccionado</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        disabled={disabled}
        title="Seleccionar destinatarios"
        aria-label="Seleccionar destinatarios"
        className="mt-0.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18.72a9.094 9.094 0 003.741 1.263 3 3 0 00-4.682-2.72M18 18.72v-3.192c0-.716-.123-1.403-.35-2.04M18 18.72A9.08 9.08 0 0112 21c-2.305 0-4.41-.86-6-2.28m0 0A9.094 9.094 0 012.259 19.983a3 3 0 014.681-2.72M6 18.72v-3.192c0-.716.123-1.403.35-2.04m0 0a5.002 5.002 0 019.3 0m-9.3 0A4.992 4.992 0 0012 15.75a4.992 4.992 0 005.65-2.262M15 7.5a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden sm:inline">Seleccionar</span>
      </button>
      <UserPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addUsers}
        config={pickerConfig}
      />
    </div>
  );
};

export default RecipientInput;
