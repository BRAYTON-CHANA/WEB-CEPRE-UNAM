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
        title="Añadir destinatarios"
        className="mt-0.5 px-3 py-1 text-base font-medium text-gray-600 border border-gray-300 rounded bg-white hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ...
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
