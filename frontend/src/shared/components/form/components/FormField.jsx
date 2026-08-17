import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { getInputComponent } from '../utils/inputMapping';
import { evaluateHidden, evaluateBlocked, evaluateOperatorSet } from '../utils/conditionEvaluator';

/**
 * Componente para renderizar un campo de formulario individual
 * Maneja la lógica de mapeo de tipo a componente y paso de props
 */
const FormField = ({
  field,
  value,
  error,
  touched,
  onChange,
  onBlur,
  showVisualDebugs = false,
  formData = {},
  onReferenceSelectLoadComplete = null
}) => {
  const {
    name,
    type,
    label,
    placeholder,
    required,
    disabled = false,
    showTypeIndicator,
    hidden,
    blocked,
    hiddenValue,
    searchable,
    options
  } = field;

  // Evaluar si el campo debe ocultarse (renombrado de condition a hidden)
  const isHidden = evaluateHidden(hidden, formData);

  // Si el campo está oculto, no renderizar nada
  if (isHidden) {
    return null;
  }

  // Evaluar labelWhen: primer label cuya condición se cumpla, o label por defecto
  const resolvedLabel = useMemo(() => {
    if (!field.labelWhen?.length) return label;
    for (const { condition, label: altLabel } of field.labelWhen) {
      if (condition && evaluateOperatorSet(condition, formData)) return altLabel;
    }
    return label;
  }, [field.labelWhen, label, formData]);

  // Evaluar placeholderWhen: primer placeholder cuya condición se cumpla, o placeholder por defecto
  const resolvedPlaceholder = useMemo(() => {
    if (!field.placeholderWhen?.length) return placeholder;
    for (const { condition, placeholder: altPlaceholder } of field.placeholderWhen) {
      if (condition && evaluateOperatorSet(condition, formData)) return altPlaceholder;
    }
    return placeholder;
  }, [field.placeholderWhen, placeholder, formData]);

  // Evaluar searchableWhen: primer searchable cuya condición se cumpla, o searchable por defecto
  const resolvedSearchable = useMemo(() => {
    if (!field.searchableWhen?.length) return searchable;
    for (const { condition, searchable: altSearchable } of field.searchableWhen) {
      if (condition && evaluateOperatorSet(condition, formData)) return altSearchable;
    }
    return searchable;
  }, [field.searchableWhen, searchable, formData]);

  // Evaluar si el campo debe bloquearse
  const { isBlocked, shouldClear } = evaluateBlocked(blocked, formData);

  // Efecto para manejar clearOnBlock
  const hasClearedRef = useRef(false);
  useEffect(() => {
    if (shouldClear && !hasClearedRef.current && value !== '' && value !== null && value !== undefined) {
      onChange(name, '');  // Llamar directamente con (fieldName, value)
      hasClearedRef.current = true;
    } else if (!isBlocked) {
      hasClearedRef.current = false;
    }
  }, [shouldClear, isBlocked, value, name, onChange]);

  // Determinar si mostrar el indicador de tipo
  // showTypeIndicator en el field tiene prioridad, si no está definido, usa showVisualDebugs
  const shouldShowTypeIndicator = showTypeIndicator !== undefined ? showTypeIndicator : showVisualDebugs;

  // Obtener el componente de input correspondiente
  const InputComponent = getInputComponent(type);

  // Memoizar props comunes para evitar re-renders
  const commonProps = useMemo(() => ({
    name,
    value: value !== undefined && value !== null ? value : '',
    onChange,
    onBlur,
    label: resolvedLabel,
    placeholder: resolvedPlaceholder,
    required,
    disabled: disabled || isBlocked,
    error,
    touched: touched || false
  }), [name, value, onChange, onBlur, resolvedLabel, resolvedPlaceholder, required, disabled, isBlocked, error, touched]);

  // Memoizar props adicionales para evitar re-renders innecesarios
  const conditionalProps = useMemo(() => ({
    blocked: field.blocked,
    hidden: field.hidden,
    formData: formData
  }), [field.blocked, field.hidden, formData]);

  
  // Callback para generar props específicos según el tipo
  const getSpecificPropsCallback = useCallback(() => {
    switch (type) {
      case 'text':
        return {
          maxLength: field.maxLength,
          minLength: field.minLength
        };

      case 'email':
        return {
          validateDomain: field.validateDomain,
          suggestDomains: field.suggestDomains
        };

      case 'password':
        return {
          showStrengthMeter: field.showStrengthMeter,
          minStrength: field.minStrength
        };

      case 'integer':
      case 'number':
        return {
          min: field.min,
          max: field.max,
          step: field.step,
          showControls: field.showControls,
          formatThousands: field.formatThousands
        };

      case 'float':
      case 'decimal':
        return {
          min: field.min,
          max: field.max,
          decimalPlaces: field.decimalPlaces,
          formatCurrency: field.formatCurrency,
          currency: field.currency
        };

      case 'date':
        return {
          minDate: field.minDate,
          maxDate: field.maxDate,
          disablePast: field.disablePast,
          disableFuture: field.disableFuture,
          showCalendar: field.showCalendar
        };

      case 'time':
        return {
          minTime: field.minTime,
          maxTime: field.maxTime,
          showSeconds: field.showSeconds,
          format24Hour: field.format24Hour,
          allowManualInput: field.allowManualInput
        };

      case 'datetime':
        return {
          minDateTime: field.minDateTime,
          maxDateTime: field.maxDateTime,
          showCalendar: field.showCalendar,
          showClock: field.showClock,
          separateInputs: field.separateInputs
        };

      case 'select':
      case 'dropdown':
        return {
          options: field.options || [],
          searchable: resolvedSearchable,
          multiSelect: field.multiSelect,
          allowClear: field.allowClear
        };

      case 'unique-select':
        return {
          tableName: field.tableName,
          columnName: field.columnName,
          filters: field.filters,
          searchable: field.searchable,
          allowCreate: field.allowCreate,
          createTitle: field.createTitle,
          showRefreshButton: field.showRefreshButton ?? true
        };

      case 'reference-select':
        return {
          referenceTable: field.referenceTable,
          referenceField: field.referenceField,
          referenceLabelField: field.referenceLabelField,
          referenceQuery: field.referenceQuery,
          referenceDescriptionField: field.referenceDescriptionField,
          referenceFilters: field.referenceFilters,
          referenceSelf: field.referenceSelf,
          referenceSelfFilter: field.referenceSelfFilter,
          referenceSelfTable: field.referenceSelfTable,
          referenceSelfValueColumn: field.referenceSelfValueColumn,
          referenceOriginalValue: field.referenceOriginalValue,
          blocked: field.blocked,
          placeholder: field.placeholder,
          searchable: field.searchable,
          showRefreshButton: field.showRefreshButton,
          showAddButton: field.showAddButton,
          addComponent: field.addComponent,
          addModalTitle: field.addModalTitle,
          addModalSize: field.addModalSize,
          referenceDisplayFields: field.referenceDisplayFields
        };

      case 'reference-array':
        return {
          referenceTable: field.referenceTable,
          referenceField: field.referenceField,
          referenceLabelField: field.referenceLabelField,
          referenceQuery: field.referenceQuery,
          referenceDescriptionField: field.referenceDescriptionField,
          referenceFilters: field.referenceFilters,
          blocked: field.blocked,
          placeholder: field.placeholder,
          searchable: field.searchable,
          showRefreshButton: field.showRefreshButton,
          showAddButton: field.showAddButton,
          addComponent: field.addComponent,
          addModalTitle: field.addModalTitle,
          addModalSize: field.addModalSize
        };

      case 'function-select':
        return {
          functionName: field.functionName,
          functionParams: field.functionParams,
          optionalParams: field.optionalParams,
          valueField: field.valueField,
          labelField: field.labelField,
          descriptionField: field.descriptionField,
          statusField: field.statusField,
          searchable: field.searchable,
          placeholder: field.placeholder,
          clearable: field.clearable,
          showRefreshButton: field.showRefreshButton,
          showAddButton: field.showAddButton,
          addComponent: field.addComponent,
          addModalTitle: field.addModalTitle,
          addModalSize: field.addModalSize,
          displayFields: field.displayFields
        };

      case 'cascade-search':
        return {
          searchFields: field.searchFields,
          resultField: field.resultField,
          placeholder: field.placeholder
        };

      case 'textarea':
        return {
          rows: field.rows,
          maxLength: field.maxLength,
          autoResize: field.autoResize,
          showCharCount: field.showCharCount,
          enableTab: field.enableTab
        };

      case 'file':
        return {
          accept: field.accept,
          multiple: field.multiple,
          maxSize: field.maxSize,
          showPreview: field.showPreview,
          maxFiles: field.maxFiles,
          fileTypes: field.fileTypes,
          allowedExtensions: field.allowedExtensions,
          showFileIcon: field.showFileIcon,
          replaceMode: field.replaceMode,
          singleFile: field.singleFile
        };

      case 'checkbox':
        return {
          options: field.options || [],
          single: field.single,
          toggle: field.toggle,
          inline: field.inline
        };

      case 'boolean':
        return {
          // BooleanInput no requiere props adicionales, usa name, label, value, etc.
        };

      case 'radio':
        return {
          options: field.options || [],
          inline: field.inline,
          showCards: field.showCards
        };

      case 'phone':
        return {
          countryCode: field.countryCode,
          showCountrySelector: field.showCountrySelector,
          allowExtensions: field.allowExtensions
        };

      case 'country':
        return {
          showFlags: field.showFlags,
          showPhoneCode: field.showPhoneCode,
          popularOnly: field.popularOnly,
          priorityCountries: field.priorityCountries
        };

      case 'color':
        return {
          showPicker: field.showPicker,
          showPalettes: field.showPalettes,
          paletteType: field.paletteType,
          allowAlpha: field.allowAlpha
        };

      case 'location':
        return {
          showMap: field.showMap,
          mapHeight: field.mapHeight,
          allowCurrentLocation: field.allowCurrentLocation
        };

      case 'matrix':
        return {
          rows: field.rows || 1,
          cols: field.cols || 1,
          cellType: field.cellType || 'text',
          cellOptions: field.cellOptions || [],
          allowNull: field.allowNull !== false
        };

      case 'predefined-files':
        return {
          mode: field.mode || 'create',
          triggerField: field.triggerField,
          loadPredefined: field.loadPredefined,
          sourceConfig: field.sourceConfig,
          getDownloadUrl: field.getDownloadUrl,
          labels: field.labels,
          accept: field.accept,
          maxSize: field.maxSize
        };

      default:
        return {};
    }
  }, [type, field]);  // Dependencies: type and field object

  // Memoizar props específicas para evitar re-renders
  const specificProps = useMemo(() => getSpecificPropsCallback(), [getSpecificPropsCallback]);

  // Combinar props comunes con específicos (memoizado)
  const inputProps = useMemo(() => ({
    ...commonProps,
    ...specificProps,
    ...conditionalProps,
    ...(type === 'reference-select' && onReferenceSelectLoadComplete ? { onReferenceSelectLoadComplete } : {})
  }), [commonProps, specificProps, conditionalProps, type, onReferenceSelectLoadComplete]);

  return (
    <div className="relative">
      {shouldShowTypeIndicator && (
        <div className="mb-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {type}
          </span>
        </div>
      )}
      <InputComponent {...inputProps} />
    </div>
  );
};

// Memoize FormField to prevent unnecessary re-renders (shallow comparison by default)
const MemoizedFormField = React.memo(FormField);

export default MemoizedFormField;
