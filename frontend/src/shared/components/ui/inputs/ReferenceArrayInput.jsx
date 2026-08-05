import React, { useState, useMemo, useRef, useEffect } from 'react';
import SelectInput from './SelectInput';
import Modal from '@/shared/components/modal/views/Modal';
import { useReferenceData } from '@/shared/hooks/useReferenceData';
import { evaluateOperatorSet } from '@/shared/components/form/utils/conditionEvaluator';

const EMPTY_FILTERS = {};

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
  placeholder,
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addSuccessRecord, setAddSuccessRecord] = useState(null);
  const originalValueRef = useRef(value);

  const isBlocked = useMemo(() => {
    if (!blocked) return false;
    return evaluateOperatorSet(blocked, formData);
  }, [blocked, formData]);

  const isHidden = useMemo(() => {
    if (!hidden) return false;
    return evaluateOperatorSet(hidden, formData);
  }, [hidden, formData]);

  const shouldLoadData = !isBlocked && !isHidden;

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

  useEffect(() => {
    if (addSuccessRecord && addSuccessRecord[referenceField] != null) {
      const newId = addSuccessRecord[referenceField];
      const current = Array.isArray(value) ? value : (value ? [value] : []);
      if (!current.some(v => String(v) === String(newId))) {
        onChange(name, [...current, newId]);
      }
      setAddSuccessRecord(null);
    }
  }, [addSuccessRecord, referenceField, value, name, onChange]);

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

  const currentValues = Array.isArray(value) ? value : (value ? [value] : []);

  const selectedOptions = useMemo(() => {
    return options.filter(opt => currentValues.some(v => String(opt.value) === String(v)));
  }, [options, value]);

  const handleRemoveTag = (optionValue) => {
    const newValues = currentValues.filter(v => String(v) !== String(optionValue));
    onChange(name, newValues);
  };

  if (isHidden) return null;

  return (
    <div className="relative">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-end gap-1">
        <div className="flex-1 min-w-0">
          <SelectInput
            {...props}
            name={name}
            label={label}
            hideLabel={true}
            options={options}
            loading={loading}
            searchable={searchable}
            multiSelect={true}
            hideTags={true}
            allowClear={true}
            optionValue="value"
            optionLabel="label"
            optionDescription="description"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled || isBlocked}
            error={error}
            touched={touched}
            validation={validation}
          />
        </div>
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

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedOptions.map(option => (
            <span
              key={option.value}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {option.label}
              <button
                type="button"
                onClick={() => handleRemoveTag(option.value)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

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

export default ReferenceArrayInput;
