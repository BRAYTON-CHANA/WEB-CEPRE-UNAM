import React, { useMemo, useState } from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import moment from 'moment';
import "@/shared/theme/components/DateTimeInput.css";
import BaseInput from './BaseInput';

// Configurar locale español
moment.locale('es');

/**
 * Componente DateTimeInput especializado
 * Usa react-datetime para selección combinada de fecha y hora
 * Mejorado con UX intuitiva y comportamiento optimizado
 */
const DateTimeInput = ({ 
  // Props de react-datetime
  value,
  dateFormat = 'DD/MM/YYYY',
  timeFormat = 'HH:mm',
  locale = 'es',
  closeOnSelect = false,
  closeOnClickOutside = true,
  
  // Props de validación personalizada
  minDateTime,
  maxDateTime,
  disablePast = false,
  disableFuture = false,
  
  // Props de UX mejorada
  timeConstraints = {
    hours: { min: 0, max: 23 },
    minutes: { min: 0, max: 59, step: 15 },
    seconds: { min: 0, max: 59 }
  },
  
  // Props de UI
  inputProps,
  renderInput,
  
  // Pasar todas las demás props al BaseInput
  ...baseInputProps 
}) => {
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState('days');

  // Convertir valor a moment object para react-datetime
  const momentValue = useMemo(() => {
    if (!value) return null;
    const m = moment(value);
    return m.isValid() ? m : null;
  }, [value]);

  // Validación de fechas usando isValidDate de react-datetime
  const isValidDate = (currentDate) => {
    // Sin selección - válido
    if (!currentDate) return true;
    
    // Validar rango mínimo
    if (minDateTime && currentDate.isBefore(moment(minDateTime))) {
      return false;
    }
    
    // Validar rango máximo
    if (maxDateTime && currentDate.isAfter(moment(maxDateTime))) {
      return false;
    }
    
    // Deshabilitar fechas pasadas
    if (disablePast && currentDate.isBefore(moment(), 'day')) {
      return false;
    }
    
    // Deshabilitar fechas futuras
    if (disableFuture && currentDate.isAfter(moment(), 'day')) {
      return false;
    }
    
    return true;
  };

  // Manejar cambio de react-datetime
  const handleChange = (momentValue) => {
    if (momentValue && momentValue.isValid()) {
      // Convertir a Date object para consistencia con otros inputs
      const dateValue = momentValue.toDate();
      baseInputProps.onChange(baseInputProps.name, dateValue);
      setError('');
    } else {
      // Valor inválido o vacío
      baseInputProps.onChange(baseInputProps.name, '');
      setError(momentValue ? 'Fecha y hora inválidas' : '');
    }
  };

  // Manejar eventos de navegación para UX mejorada
  const handleNavigate = (viewMode) => {
    setCurrentView(viewMode);
  };

  // Manejar pérdida de foco
  const handleBlur = () => {
    if (baseInputProps.onBlur) {
      baseInputProps.onBlur(baseInputProps.name);
    }
  };

  // Validación personalizada para BaseInput
  const customValidation = (value) => {
    if (!value) return '';
    
    const date = moment(value);
    if (!date.isValid()) {
      return 'Fecha y hora inválidas';
    }
    
    // Validar rango combinado
    if (minDateTime && date.isBefore(moment(minDateTime))) {
      return `Debe ser posterior a ${moment(minDateTime).format('DD/MM/YYYY HH:mm')}`;
    }
    
    if (maxDateTime && date.isAfter(moment(maxDateTime))) {
      return `Debe ser anterior a ${moment(maxDateTime).format('DD/MM/YYYY HH:mm')}`;
    }
    
    return '';
  };

  // Props para el input personalizado
  const defaultInputProps = {
    ...inputProps,
    placeholder: baseInputProps.placeholder || 'Seleccionar fecha y hora',
    className: `${inputProps?.className || ''} ${baseInputProps.className || ''}`,
    onBlur: handleBlur
  };

  // Validación combinada
  const validation = {
    ...baseInputProps.validation,
    custom: customValidation
  };

  // Custom input wrapper para integrar con BaseInput
  const CustomInput = (props) => {
    const { value, onClick, onChange, ...inputFieldProps } = props;
    
    return (
      <BaseInput
        {...baseInputProps}
        type="text"
        value={value || ''}
        onChange={(name, val) => {
          // Permitir edición manual
          onChange({ target: { value: val } });
        }}
        onBlur={handleBlur}
        validation={validation}
        placeholder={baseInputProps.placeholder || 'DD/MM/YYYY HH:mm'}
        className={`${baseInputProps.className || ''} cursor-pointer`}
        rightElement={
          <button
            type="button"
            onClick={onClick}
            className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
            aria-label="Mostrar selector de fecha y hora"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        }
      />
    );
  };

  // Vista personalizada para mejor UX
  const CustomView = (viewMode, renderDefault) => {
    if (viewMode === 'time') {
      return (
        <div className="custom-time-view">
          <div className="text-center mb-3 p-2 bg-blue-50 rounded">
            <div className="text-sm text-blue-600 font-medium">
              {momentValue ? momentValue.format('dddd, D [de] MMMM') : 'Selecciona fecha primero'}
            </div>
          </div>
          {renderDefault()}
        </div>
      );
    }
    
    if (viewMode === 'days') {
      return (
        <div className="custom-days-view">
          {renderDefault()}
        </div>
      );
    }
    
    return renderDefault();
  };

  return (
    <div className="relative">
      <Datetime
        value={momentValue}
        onChange={handleChange}
        isValidDate={isValidDate}
        dateFormat={dateFormat}
        timeFormat={timeFormat}
        locale={locale}
        closeOnSelect={closeOnSelect}
        closeOnClickOutside={closeOnClickOutside}
        timeConstraints={timeConstraints}
        inputProps={defaultInputProps}
        renderInput={renderInput || CustomInput}
        renderView={CustomView}
        onNavigate={handleNavigate}
        className="custom-datetime"
      />

      {/* Indicadores de rango */}
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        {minDateTime && (
          <span>Mínimo: {moment(minDateTime).format('DD/MM/YYYY HH:mm')}</span>
        )}
        {maxDateTime && (
          <span>Máximo: {moment(maxDateTime).format('DD/MM/YYYY HH:mm')}</span>
        )}
      </div>

      {/* Información de fecha y hora seleccionada */}
      {momentValue && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-600">
          <div className="flex justify-between">
            <span>Seleccionado:</span>
            <span className="font-medium">{momentValue.format('DD/MM/YYYY HH:mm')}</span>
          </div>
          <div className="mt-1">
            <span>Día: {momentValue.format('dddd')}</span>
          </div>
          <div className="mt-1 text-xs text-blue-500">
            <span>Vista actual: {currentView === 'days' ? 'Calendario' : currentView === 'time' ? 'Hora' : currentView}</span>
          </div>
        </div>
      )}

      {/* Mensaje de error personalizado */}
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600" role="alert">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {error}
        </div>
      )}

      {/* Tips de uso */}
      <div className="mt-1 text-xs text-gray-400">
        💡 Tip: Click fuera del calendario para cerrar • Usa Tab para navegar
      </div>
    </div>
  );
};

export default DateTimeInput;
