import React from 'react';
import { getInputComponent } from '../utils/inputMapping';

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
  onBlur
}) => {
  const {
    name,
    type,
    label,
    placeholder,
    required,
    disabled = false,
    showTypeIndicator = true
  } = field;

  // Obtener el componente de input correspondiente
  const InputComponent = getInputComponent(type);

  // Props comunes para todos los inputs
  const commonProps = {
    name,
    value: value !== undefined && value !== null ? value : '',
    onChange,
    onBlur,
    label,
    placeholder,
    required,
    disabled,
    error,
    touched: touched || false
  };

  // Props específicos según el tipo de input
  const getSpecificProps = () => {
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
          format24Hour: field.format24Hour
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
          searchable: field.searchable,
          multiSelect: field.multiSelect,
          allowClear: field.allowClear
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

      default:
        return {};
    }
  };

  // Combinar props comunes con específicos
  const inputProps = {
    ...commonProps,
    ...getSpecificProps()
  };

  return (
    <div className="relative">
      {showTypeIndicator && (
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

export default FormField;
