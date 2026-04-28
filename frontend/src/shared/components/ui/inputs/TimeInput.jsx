import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import BaseInput from './BaseInput';

/**
 * Componente TimeInput especializado
 * Usa react-time-picker con selectores separados para horas y minutos
 */
const TimeInput = ({ 
  // Props específicas de tiempo
  minTime,
  maxTime,
  step = 60,
  showSeconds = false,
  format24Hour = true,
  showClock = true,
  
  // Pasar todas las demás props al BaseInput
  ...baseInputProps 
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(
    baseInputProps.value ? baseInputProps.value : null
  );
  const [tempTime, setTempTime] = useState(selectedTime); // Estado temporal para el modal

  // Sincronizar tempTime cuando se abre el modal
  useEffect(() => {
    if (isPickerOpen) {
      setTempTime(selectedTime);
    }
  }, [isPickerOpen, selectedTime]);

  // Convertir string de tiempo a Date
  const timeToDate = (timeString) => {
    if (!timeString) return null;
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 0);
    date.setMinutes(minutes || 0);
    date.setSeconds(seconds || 0);
    return date;
  };

  // Convertir Date a string de tiempo
  const dateToTime = (date) => {
    if (!date) return '';
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
  };

  // Validar hora
  const validateTime = (value) => {
    if (!value) return '';
    
    const timeRegex = showSeconds 
      ? /^([01]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/ 
      : /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    
    if (!timeRegex.test(value)) {
      return 'Formato de hora inválido';
    }
    
    return '';
  };

  // Manejar pérdida de foco
  const handleBlur = (name) => {
    if (baseInputProps.onBlur) {
      baseInputProps.onBlur(name);
    }
  };

  // Manejar cambio de hora
  const handleTimeChange = (date) => {
    const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}${showSeconds ? ':' + date.getSeconds().toString().padStart(2, '0') : ''}`;
    setSelectedTime(timeString);
    baseInputProps.onChange(baseInputProps.name, timeString);
    setIsPickerOpen(false);
  };

  // Generar opciones de horas (0-23)
  const generateHours = () => {
    const hours = [];
    for (let h = 0; h < 24; h++) {
      hours.push(h.toString().padStart(2, '0'));
    }
    return hours;
  };

  // Generar opciones de minutos (0-59)
  const generateMinutes = () => {
    const minutes = [];
    for (let m = 0; m < 60; m++) {
      minutes.push(m.toString().padStart(2, '0'));
    }
    return minutes;
  };

  // Generar opciones de segundos (0-59)
  const generateSeconds = () => {
    const seconds = [];
    for (let s = 0; s < 60; s++) {
      seconds.push(s.toString().padStart(2, '0'));
    }
    return seconds;
  };

  // Parsear tiempo actual (usa tempTime cuando el modal está abierto)
  const parseCurrentTime = () => {
    const timeToParse = isPickerOpen ? tempTime : selectedTime;
    if (!timeToParse) return { hour: '00', minute: '00', second: '00' };
    
    const [hours, minutes, seconds] = timeToParse.split(':');
    return {
      hour: hours || '00',
      minute: minutes || '00',
      second: seconds || '00'
    };
  };

  // Manejar selección de hora/minuto/segundo (actualiza tempTime, NO cierra modal)
  const handleTimeSelect = (type, value) => {
    const time = parseCurrentTime();
    let newTime = '';
    
    if (type === 'hour') {
      newTime = `${value}:${time.minute}${showSeconds ? ':' + time.second : ''}`;
    } else if (type === 'minute') {
      newTime = `${time.hour}:${value}${showSeconds ? ':' + time.second : ''}`;
    } else if (type === 'second') {
      newTime = `${time.hour}:${time.minute}:${value}`;
    }
    
    setTempTime(newTime); // Solo actualiza el tiempo temporal
  };

  // Aceptar y cerrar modal
  const handleAccept = () => {
    setSelectedTime(tempTime);
    baseInputProps.onChange(baseInputProps.name, tempTime);
    setIsPickerOpen(false);
  };

  // Cerrar sin guardar
  const handleClose = () => {
    setIsPickerOpen(false);
  };

  // Parsear tiempo actual para react-time-picker
  const parseTimeForPicker = () => {
    if (!selectedTime) return { hour: 0, minute: 0, second: 0 };
    
    const [hours, minutes, seconds] = selectedTime.split(':').map(Number);
    return {
      hour: hours || 0,
      minute: minutes || 0,
      second: seconds || 0
    };
  };

  const currentTime = parseTimeForPicker();

  // Convertir a Date object para react-time-picker
  const timeToDateObject = () => {
    if (!selectedTime) return new Date();
    
    const [hours, minutes, seconds] = selectedTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 0);
    date.setMinutes(minutes || 0);
    date.setSeconds(seconds || 0);
    return date;
  };

  const timeValidation = {
    ...baseInputProps.validation,
    custom: validateTime
  };


  // Formatear hora para mostrar
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const h = hours || 0;
    const m = minutes || 0;
    const s = seconds || 0;
    
    if (format24Hour) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}${showSeconds ? ':' + s.toString().padStart(2, '0') : ''}`;
    } else {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHours = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      return `${displayHours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}${showSeconds ? ':' + s.toString().padStart(2, '0') : ''} ${period}`;
    }
  };

  return (
    <div className="relative">
      {/* Input principal con icono */}
      <div className="relative">
        <BaseInput
          {...baseInputProps}
          type="text"
          value={formatTime(selectedTime)}
          onChange={() => {}} // El cambio real lo manejan los selectores
          onBlur={handleBlur}
          validation={timeValidation}
          placeholder={baseInputProps.placeholder || (format24Hour ? 'HH:MM' : 'HH:MM AM/PM')}
          className={`${baseInputProps.className || ''} ${showClock ? 'pr-10' : ''}`}
          readOnly
          rightElement={showClock ? (
            <button
              type="button"
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
              aria-label="Mostrar selector de hora"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          ) : null}
        />
      </div>

      {/* Selector de tiempo personalizado - Modal con createPortal */}
      {showClock && isPickerOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop con blur */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <div className="relative bg-white border border-gray-300 rounded-lg shadow-2xl p-4 min-w-[280px] z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Seleccionar hora</h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex gap-3 mb-4">
              {/* Selector de horas */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <select
                  value={parseCurrentTime().hour}
                  onChange={(e) => handleTimeSelect('hour', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {generateHours().map(hour => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>
              </div>
              
              {/* Selector de minutos */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Minuto</label>
                <select
                  value={parseCurrentTime().minute}
                  onChange={(e) => handleTimeSelect('minute', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {generateMinutes().map(minute => (
                    <option key={minute} value={minute}>{minute}</option>
                  ))}
                </select>
              </div>
              
              {/* Selector de segundos (opcional) */}
              {showSeconds && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Segundo</label>
                  <select
                    value={parseCurrentTime().second}
                    onChange={(e) => handleTimeSelect('second', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {generateSeconds().map(second => (
                      <option key={second} value={second}>{second}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* Botón Aceptar */}
            <button
              type="button"
              onClick={handleAccept}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Indicadores de rango */}
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        {minTime && (
          <span>Mínimo: {formatTime(minTime)}</span>
        )}
        {maxTime && (
          <span>Máximo: {formatTime(maxTime)}</span>
        )}
      </div>
    </div>
  );
};

export default TimeInput;
