import React, { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import "../../../theme/DateInput.css";
import es from 'date-fns/locale/es';
import BaseInput from './BaseInput';

// Registrar locale español
registerLocale('es', es);

/**
 * Componente DateInput especializado
 * Usa react-datepicker para un calendario profesional con navegación
 */
const DateInput = ({ 
  // Props específicas de fecha
  minDate,
  maxDate,
  disablePast = false,
  disableFuture = false,
  showCalendar = true,
  dateFormat = 'dd/MM/yyyy',
  locale = 'es',
  showYearPicker = false,
  showMonthYearPicker = false,
  
  // Pasar todas las demás props al BaseInput
  ...baseInputProps 
}) => {
  // Validar y convertir el valor inicial a fecha
  const parseInitialDate = (value) => {
    if (!value) return null;
    
    // Intentar crear una fecha válida
    const date = new Date(value);
    
    // Verificar que sea una fecha válida
    if (isNaN(date.getTime()) || date.getTime() === 0) {
      return null;
    }
    
    return date;
  };

  const [selectedDate, setSelectedDate] = useState(
    parseInitialDate(baseInputProps.value)
  );

  // Validar fecha
  const validateDate = (value) => {
    if (!value) return '';
    
    const date = new Date(value);
    
    // Verificar que sea una fecha válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    // Verificar rango de fechas
    if (minDate && date < minDate) {
      return `Debe ser posterior a ${minDate.toLocaleDateString(locale)}`;
    }
    
    if (maxDate && date > maxDate) {
      return `Debe ser anterior a ${maxDate.toLocaleDateString(locale)}`;
    }
    
    if (disablePast && date < new Date().setHours(0,0,0,0)) {
      return 'No se permiten fechas pasadas';
    }
    
    if (disableFuture && date > new Date().setHours(23,59,59,59)) {
      return 'No se permiten fechas futuras';
    }
    
    return '';
  };

  // Manejar cambio de fecha
  const handleDateChange = (date) => {
    setSelectedDate(date);
    
    // Formatear fecha para el valor del input
    if (date) {
      const formattedDate = date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      baseInputProps.onChange(baseInputProps.name, formattedDate);
    } else {
      baseInputProps.onChange(baseInputProps.name, '');
    }
  };

  // Manejar cambio manual en el input
  const handleChange = (name, value) => {
    baseInputProps.onChange(name, value);
    
    // Intentar parsear la fecha
    if (value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      }
    } else {
      setSelectedDate(null);
    }
  };

  // Manejar pérdida de foco
  const handleBlur = (name) => {
    if (baseInputProps.onBlur) {
      baseInputProps.onBlur(name);
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (date) => {
    if (!date) return '';
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Calcular fechas mínimas y máximas
  const calculatedMinDate = disablePast ? new Date() : minDate;
  const calculatedMaxDate = disableFuture ? new Date() : maxDate;

  // Validación específica de fecha
  const dateValidation = {
    ...baseInputProps.validation,
    custom: validateDate
  };

  // Custom input que usa BaseInput
  const CustomInput = React.forwardRef(({ value, onClick, onChange, onBlur }, ref) => (
    <BaseInput
      {...baseInputProps}
      ref={ref}
      type="text"
      value={value}
      onChange={(name, val) => {
        onChange({ target: { value: val } });
        handleChange(name, val);
      }}
      onBlur={handleBlur}
      validation={dateValidation}
      placeholder={baseInputProps.placeholder || 'DD/MM/YYYY'}
      className={`${baseInputProps.className || ''} ${showCalendar ? 'pr-10' : ''}`}
      rightElement={showCalendar ? (
        <button
          type="button"
          onClick={onClick}
          className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
          aria-label="Mostrar calendario"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </button>
      ) : null}
    />
  ));

  return (
    <div className="relative">
      {showCalendar ? (
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          locale={locale}
          dateFormat={dateFormat}
          minDate={calculatedMinDate}
          maxDate={calculatedMaxDate}
          showYearPicker={showYearPicker}
          showMonthYearPicker={showMonthYearPicker}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          yearDropdownItemNumber={100}
          customInput={<CustomInput />}
          calendarClassName="border border-gray-300 rounded-lg shadow-xl custom-datepicker"
          popperClassName="z-30"
          popperPlacement="right-start"
          wrapperClassName="w-full"
          showPopperArrow={false}
          isClearable
        />
      ) : (
        <BaseInput
          {...baseInputProps}
          type="date"
          min={minDate ? formatDate(minDate) : ''}
          max={maxDate ? formatDate(maxDate) : ''}
          validation={dateValidation}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={baseInputProps.placeholder || 'DD/MM/YYYY'}
          className={baseInputProps.className || ''}
          value={formatDate(baseInputProps.value)}
        />
      )}

      {/* Indicadores de rango */}
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        {minDate && (
          <span>Mínimo: {formatDate(minDate)}</span>
        )}
        {maxDate && (
          <span>Máximo: {formatDate(maxDate)}</span>
        )}
      </div>

      {/* Información de fecha seleccionada */}
      {selectedDate && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-600">
          <div className="flex justify-between">
            <span>Fecha seleccionada:</span>
            <span className="font-medium">{formatDate(selectedDate)}</span>
          </div>
          <div className="mt-1">
            <span>Día de semana: {selectedDate.toLocaleDateString('es-ES', { weekday: 'long' })}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateInput;
