import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import BaseInput from './BaseInput';

/**
 * Componente TimeInput especializado
 *
 * Features:
 * - Escritura manual: el usuario puede escribir "8:00", "08:00 AM", "2:30 pm", etc.
 * - Selector modal con selects de hora/minuto/segundo + AM/PM + botón "Ahora".
 * - Toggle 12h/24h dentro del input (default: 12h).
 * - El valor interno (value/onChange) siempre se maneja en formato 24h "HH:MM[:SS]".
 *
 * Props:
 * - format24Hour: false (default 12h). Si true, fuerza 24h.
 * - allowManualInput: true (default). Si false, el input es readOnly.
 * - showSeconds: false (default).
 * - showClock: true (default). Muestra el botón del reloj.
 * - minTime, maxTime: strings "HH:MM" para validación de rango.
 * - step: 60 (minutos step, reservado para futuros usos).
 */
const TimeInput = ({
  minTime,
  maxTime,
  step = 60,
  showSeconds = false,
  format24Hour = false,
  showClock = true,
  allowManualInput = true,
  ...baseInputProps
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // tempTime solo se usa dentro del modal (formato 24h interno)
  const [tempTime, setTempTime] = useState(baseInputProps.value || '');

  // Sincronizar tempTime cuando se abre el modal
  useEffect(() => {
    if (isPickerOpen) {
      setTempTime(baseInputProps.value || '');
    }
  }, [isPickerOpen, baseInputProps.value]);

  // ---- Parser flexible: string -> { h, m, s } en 24h ----
  const parseTimeString = (raw) => {
    if (!raw) return null;
    const value = String(raw).trim().toUpperCase();
    // Detectar AM/PM
    const ampmMatch = value.match(/\s*(AM|PM|A\.M\.|P\.M\.)$/);
    let ampm = null;
    let cleaned = value;
    if (ampmMatch) {
      ampm = ampmMatch[1].startsWith('P') ? 'PM' : 'AM';
      cleaned = value.replace(/\s*(AM|PM|A\.M\.|P\.M\.)$/i, '').trim();
    }
    // Separar por ":"
    const parts = cleaned.split(':').map((p) => p.trim());
    if (parts.length < 2 || parts.length > 3) return null;
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const s = parts.length === 3 ? parseInt(parts[2], 10) : 0;
    if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s)) return null;
    if (m < 0 || m > 59 || s < 0 || s > 59) return null;
    // Convertir 12h -> 24h
    if (ampm) {
      if (h < 1 || h > 12) return null;
      if (ampm === 'AM') {
        h = h === 12 ? 0 : h;
      } else {
        h = h === 12 ? 12 : h + 12;
      }
    } else {
      if (h < 0 || h > 23) return null;
    }
    return { h, m, s };
  };

  // Normalizar a string 24h "HH:MM[:SS]"
  const to24hString = ({ h, m, s }) => {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return showSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
  };

  // Formatear para display según formato activo
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const parsed = parseTimeString(timeString);
    if (!parsed) return timeString; // Mostrar lo que escribió si no es parseable aún
    const { h, m, s } = parsed;
    if (format24Hour) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const ss = String(s).padStart(2, '0');
      return showSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
    }
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHours = h % 12 === 0 ? 12 : h % 12;
    const hh = String(displayHours).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return showSeconds ? `${hh}:${mm}:${ss} ${period}` : `${hh}:${mm} ${period}`;
  };

  // ---- Validación ----
  const validateTime = (value) => {
    if (!value) return '';
    const parsed = parseTimeString(value);
    if (!parsed) return 'Formato de hora inválido';
    const time24 = to24hString(parsed);
    if (minTime && time24 < minTime) return `Debe ser posterior a ${formatTime(minTime)}`;
    if (maxTime && time24 > maxTime) return `Debe ser anterior a ${formatTime(maxTime)}`;
    return '';
  };

  // ---- Handlers ----
  const commitValue = (timeString) => {
    if (!timeString) {
      baseInputProps.onChange?.(baseInputProps.name, '');
      return;
    }
    const parsed = parseTimeString(timeString);
    if (parsed) {
      baseInputProps.onChange?.(baseInputProps.name, to24hString(parsed));
    } else {
      // Pasar el raw para que la validación lo marque como error
      baseInputProps.onChange?.(baseInputProps.name, timeString);
    }
  };

  const handleInputChange = (name, val) => {
    baseInputProps.onChange?.(name, val);
  };

  const handleInputBlur = (name) => {
    // Al perder foco, normalizar lo escrito
    const parsed = parseTimeString(baseInputProps.value);
    if (parsed) {
      baseInputProps.onChange?.(name, to24hString(parsed));
    }
    baseInputProps.onBlur?.(name);
  };

  // Modal handlers
  const handleTimeSelect = (type, value) => {
    const current = parseTimeString(tempTime) || { h: 0, m: 0, s: 0 };
    let newParsed;
    if (type === 'hour') newParsed = { ...current, h: parseInt(value, 10) };
    else if (type === 'minute') newParsed = { ...current, m: parseInt(value, 10) };
    else if (type === 'second') newParsed = { ...current, s: parseInt(value, 10) };
    else if (type === 'ampm') {
      // value es 'AM' o 'PM'
      let h12 = current.h % 12;
      if (current.h >= 12 && current.h !== 12) h12 = current.h - 12;
      if (current.h === 12) h12 = 0; // 12:xx 24h -> 0 para 12h
      newParsed = { ...current, h: value === 'PM' ? (h12 === 0 ? 12 : h12 + 12) : h12 };
    }
    setTempTime(to24hString(newParsed));
  };

  const handleAccept = () => {
    commitValue(tempTime);
    setIsPickerOpen(false);
  };

  const handleNow = () => {
    const now = new Date();
    const time24 = to24hString({ h: now.getHours(), m: now.getMinutes(), s: now.getSeconds() });
    setTempTime(time24);
  };

  const handleClose = () => setIsPickerOpen(false);

  // ---- Opciones para el modal ----
  const generateHours24 = () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const generateHours12 = () => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const generateMinutes = () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const generateSeconds = () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const tempParsed = useMemo(() => parseTimeString(tempTime) || { h: 0, m: 0, s: 0 }, [tempTime]);

  // En 12h: hora display (1-12) y periodo AM/PM
  const tempHour12 = tempParsed.h % 12 === 0 ? 12 : tempParsed.h % 12;
  const tempPeriod = tempParsed.h >= 12 ? 'PM' : 'AM';

  const timeValidation = {
    ...baseInputProps.validation,
    custom: validateTime,
  };

  const displayValue = formatTime(baseInputProps.value);

  return (
    <div className="relative">
      <div className="relative">
        <BaseInput
          {...baseInputProps}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          validation={timeValidation}
          placeholder={baseInputProps.placeholder || (format24Hour ? 'HH:MM' : 'HH:MM AM/PM')}
          className={`${baseInputProps.className || ''} ${showClock || !format24Hour ? 'pr-20' : ''}`}
          readOnly={!allowManualInput}
          rightElement={
            <div className="flex items-center gap-1">
              {/* Toggle 12h/24h */}
              <button
                type="button"
                onClick={() => {
                  // Alternar formato: comunicamos al padre vía prop externa si existe
                  // Como format24Hour viene del padre (FormField), usamos un callback opcional
                  if (baseInputProps.onFormatToggle) {
                    baseInputProps.onFormatToggle(!format24Hour);
                  }
                }}
                className="text-[10px] font-semibold text-gray-400 hover:text-blue-600 px-1 py-0.5 rounded transition-colors"
                title={format24Hour ? 'Cambiar a 12h' : 'Cambiar a 24h'}
                aria-label="Alternar formato de hora"
              >
                {format24Hour ? '24h' : '12h'}
              </button>
              {showClock && (
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
              )}
            </div>
          }
        />
      </div>

      {/* Selector de tiempo personalizado - Modal con createPortal */}
      {showClock && isPickerOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={handleClose}
          />
          <div className="relative bg-white border border-gray-300 rounded-lg shadow-2xl p-4 min-w-[320px] z-10 animate-in fade-in zoom-in-95 duration-200">
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
                  value={format24Hour ? String(tempParsed.h).padStart(2, '0') : String(tempHour12).padStart(2, '0')}
                  onChange={(e) => {
                    if (format24Hour) {
                      handleTimeSelect('hour', e.target.value);
                    } else {
                      // En 12h, mantener el periodo actual
                      let h12 = parseInt(e.target.value, 10);
                      if (tempPeriod === 'PM') h12 = h12 === 12 ? 12 : h12 + 12;
                      else h12 = h12 === 12 ? 0 : h12;
                      handleTimeSelect('hour', String(h12));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {(format24Hour ? generateHours24() : generateHours12()).map(hour => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>
              </div>

              {/* Selector de minutos */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Minuto</label>
                <select
                  value={String(tempParsed.m).padStart(2, '0')}
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
                    value={String(tempParsed.s).padStart(2, '0')}
                    onChange={(e) => handleTimeSelect('second', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {generateSeconds().map(second => (
                      <option key={second} value={second}>{second}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector AM/PM (solo en 12h) */}
              {!format24Hour && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
                  <select
                    value={tempPeriod}
                    onChange={(e) => handleTimeSelect('ampm', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              )}
            </div>

            {/* Preview + Botones */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm text-gray-500">
                {tempTime ? formatTime(tempTime) : '--:--'}
              </span>
              <button
                type="button"
                onClick={handleNow}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                Ahora
              </button>
            </div>

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
