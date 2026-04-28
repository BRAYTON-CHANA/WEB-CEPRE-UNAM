import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import "@/shared/theme/components/DateInput.css";
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
  // Helper para crear fecha local sin problemas de zona horaria
  const createLocalDate = (year, month, day) => {
    // Crear fecha usando componentes locales (mes es 0-indexed)
    const date = new Date(year, month - 1, day);
    return date;
  };

  // Validar y convertir el valor inicial a fecha
  const parseInitialDate = (value) => {
    if (!value) return null;
    
    let year, month, day;
    
    // Si el valor está en formato DD/MM/YYYY
    if (typeof value === 'string' && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      [day, month, year] = value.split('/').map(Number);
    } 
    // Si el valor está en formato YYYY-MM-DD
    else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      [year, month, day] = value.split('-').map(Number);
    }
    // Intentar parsear como fecha
    else {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        year = date.getFullYear();
        month = date.getMonth() + 1;
        day = date.getDate();
      }
    }
    
    if (!year || !month || !day) {
      return null;
    }
    
    return createLocalDate(year, month, day);
  };

  const [selectedDate, setSelectedDate] = useState(
    parseInitialDate(baseInputProps.value)
  );

  // Actualizar fecha cuando el valor cambia externamente (ej: al editar registro)
  useEffect(() => {
    const newDate = parseInitialDate(baseInputProps.value);
    setSelectedDate(newDate);
  }, [baseInputProps.value]);

  // Helper para convertir Date a string DD/MM/YYYY
  const dateToString = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Validar fecha
  const validateDate = (value) => {
    if (!value) return '';
    
    const date = parseInitialDate(value);
    
    // Verificar que sea una fecha válida
    if (!date || isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    // Crear fechas de comparación en hora local
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Verificar rango de fechas
    if (minDate && date < minDate) {
      return `Debe ser posterior a ${dateToString(minDate)}`;
    }
    
    if (maxDate && date > maxDate) {
      return `Debe ser anterior a ${dateToString(maxDate)}`;
    }
    
    if (disablePast && date < today) {
      return 'No se permiten fechas pasadas';
    }
    
    if (disableFuture) {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      if (date > endOfToday) {
        return 'No se permiten fechas futuras';
      }
    }
    
    return '';
  };

  // Manejar cambio de fecha
  const handleDateChange = (date) => {
    setSelectedDate(date);
    
    // Formatear fecha para el valor del input (DD/MM/YYYY)
    if (date && !isNaN(date.getTime())) {
      const formattedDate = dateToString(date);
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

  // Formatear fecha para mostrar (usa dateToString para evitar problemas de zona horaria)
  const formatDate = (date) => {
    return dateToString(date);
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
          popperClassName="z-[60]"
          portalId="date-picker-portal"
          withPortal
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

    </div>
  );
};

export default DateInput;
