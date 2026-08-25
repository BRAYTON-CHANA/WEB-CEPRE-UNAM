import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

// ===== Constantes locale español =====
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const WEEKDAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ===== Máscara fija =====
// Posiciones:  0123456789012345678
// Formato:     DD/MM/YYYY | HH:MM
const MASK = 'DD/MM/YYYY | HH:MM';
const MASK_EMPTY = '00/00/0000 | 00:00';

// ===== Bloques (solo dígitos, nunca separadores) =====
const BLOCKS = [
  { name: 'day', start: 0, length: 2 },
  { name: 'month', start: 3, length: 2 },
  { name: 'year', start: 6, length: 4 },
  { name: 'hour', start: 13, length: 2 },
  { name: 'minute', start: 16, length: 2 }
];
const BLOCK_DIGIT_STARTS = [0, 2, 4, 8, 10]; // inicio en array de 12 dígitos

// ===== Helpers =====

const applyMask = (digits) => {
  const d = digits.padEnd(12, '0').split('');
  return `${d[0]}${d[1]}/${d[2]}${d[3]}/${d[4]}${d[5]}${d[6]}${d[7]} | ${d[8]}${d[9]}:${d[10]}${d[11]}`;
};

const extractDigits = (masked) => {
  if (!masked) return '000000000000';
  return masked.split('').filter(c => c >= '0' && c <= '9').slice(0, 12).join('').padEnd(12, '0');
};

const dateToMasked = (date) => {
  if (!date) return MASK_EMPTY;
  const d = new Date(date);
  if (isNaN(d.getTime())) return MASK_EMPTY;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).padStart(4, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} | ${hours}:${minutes}`;
};

// Mascarado a Date object (null si inválido, '' si todo ceros)
const maskedToValue = (masked) => {
  const digits = extractDigits(masked);
  if (digits === '000000000000') return '';
  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);
  const hours = parseInt(digits.slice(8, 10), 10);
  const minutes = parseInt(digits.slice(10, 12), 10);
  const d = new Date(year, month - 1, day, hours, minutes, 0);
  if (isNaN(d.getTime())) return null;
  // Verificar que JS no auto-ajustó (ej: 31/02 → 03/03)
  if (d.getDate() !== day || d.getMonth() + 1 !== month || d.getFullYear() !== year) return null;
  return d;
};

// Validación parcial: solo valida bloques hasta upToBlock (inclusive)
const validatePartial = (digits, upToBlock) => {
  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);
  const hours = parseInt(digits.slice(8, 10), 10);
  const minutes = parseInt(digits.slice(10, 12), 10);

  if (upToBlock >= 0 && (day < 1 || day > 31)) return 'Día inválido (01-31)';
  if (upToBlock >= 1) {
    if (month < 1 || month > 12) return 'Mes inválido (01-12)';
    if (day > 0) {
      const dim = new Date(year, month, 0).getDate();
      if (day > dim) return `Día ${day} inválido para ${MONTHS_ES[month - 1]}`;
    }
  }
  if (upToBlock >= 2) {
    if (year < 1900 || year > 2100) return 'Año inválido (1900-2100)';
    const dim = new Date(year, month, 0).getDate();
    if (day > dim) return `Día ${day} inválido para ${MONTHS_ES[month - 1]}`;
  }
  if (upToBlock >= 3 && hours > 23) return 'Hora inválida (00-23)';
  if (upToBlock >= 4 && minutes > 59) return 'Minuto inválido (00-59)';
  return '';
};

// Obtener bloque en una posición de cursor (solo 0-4, nunca separadores)
const getBlockAtPos = (pos) => {
  for (let i = 0; i < BLOCKS.length; i++) {
    if (pos >= BLOCKS[i].start && pos < BLOCKS[i].start + BLOCKS[i].length) return i;
  }
  if (pos < BLOCKS[0].start) return 0;
  for (let i = 0; i < BLOCKS.length - 1; i++) {
    if (pos >= BLOCKS[i].start + BLOCKS[i].length && pos < BLOCKS[i + 1].start) return i + 1;
  }
  return BLOCKS.length - 1;
};

// ===== Componente =====

const DateTimeInput = ({
  value,
  format24Hour = false,
  minDateTime,
  maxDateTime,
  defaultValueNow = true,
  ...baseInputProps
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [maskedValue, setMaskedValue] = useState(MASK_EMPTY);
  const [lastValidValue, setLastValidValue] = useState(MASK_EMPTY);
  const [error, setError] = useState('');
  const [activeBlock, setActiveBlock] = useState(0);
  const [activeDigitInBlock, setActiveDigitInBlock] = useState(0);
  const inputRef = useRef(null);
  const hasInitialized = useRef(false);

  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [tempTime, setTempTime] = useState({ h: 0, m: 0 });

  // ===== Inicialización =====
  useEffect(() => {
    if (hasInitialized.current) {
      // Solo sincronizar si el padre envía un Date real
      if (value) {
        const masked = dateToMasked(value);
        setMaskedValue(masked);
        setLastValidValue(masked);
        setError('');
      }
      return;
    }
    hasInitialized.current = true;
    if (value) {
      const masked = dateToMasked(value);
      setMaskedValue(masked);
      setLastValidValue(masked);
    } else if (defaultValueNow) {
      const masked = dateToMasked(new Date());
      setMaskedValue(masked);
      setLastValidValue(masked);
      baseInputProps.onChange?.(baseInputProps.name, maskedToValue(masked));
    }
    setError('');
  }, [value]);

  // ===== Selección de cursor =====
  const selectBlock = (blockIdx) => {
    const block = BLOCKS[blockIdx];
    setActiveBlock(blockIdx);
    setActiveDigitInBlock(0);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(block.start, block.start + block.length);
    });
  };

  const selectDigitInBlock = (blockIdx, digitIdx) => {
    const pos = BLOCKS[blockIdx].start + digitIdx;
    setActiveBlock(blockIdx);
    setActiveDigitInBlock(digitIdx);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(pos, pos + 1);
    });
  };

  // ===== Validar y emitir o revertir =====
  // upToBlock: hasta qué bloque validar (validación parcial)
  const tryValidate = (newMasked, upToBlock = 4) => {
    const digits = extractDigits(newMasked);
    const err = validatePartial(digits, upToBlock);
    if (err) {
      setMaskedValue(lastValidValue);
      setError(err);
      baseInputProps.onChange?.(baseInputProps.name, maskedToValue(lastValidValue) || '');
      return false;
    }
    // Válido — guardar
    setMaskedValue(newMasked);
    setLastValidValue(newMasked);
    setError('');
    // Validar rango min/max si la fecha completa es válida
    const dateObj = maskedToValue(newMasked);
    if (dateObj) {
      if (minDateTime && new Date(dateObj) < new Date(minDateTime)) {
        setError(`Debe ser posterior a ${dateToMasked(minDateTime)}`);
        // Permitir el valor pero notificar al padre para que bloquee el submit
        baseInputProps.onChange?.(baseInputProps.name, dateObj);
        return false;
      }
      if (maxDateTime && new Date(dateObj) > new Date(maxDateTime)) {
        setError(`Debe ser anterior a ${dateToMasked(maxDateTime)}`);
        baseInputProps.onChange?.(baseInputProps.name, dateObj);
        return false;
      }
      baseInputProps.onChange?.(baseInputProps.name, dateObj);
    }
    return true;
  };

  // ===== Teclado =====
  const handleKeyDown = (e) => {
    const block = BLOCKS[activeBlock];

    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      tryValidate(maskedValue, activeBlock);
      if (activeBlock < BLOCKS.length - 1) selectBlock(activeBlock + 1);
      return;
    }
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      tryValidate(maskedValue, activeBlock);
      if (activeBlock > 0) selectBlock(activeBlock - 1);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      tryValidate(maskedValue, activeBlock);
      if (activeBlock < BLOCKS.length - 1) selectBlock(activeBlock + 1);
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (activeDigitInBlock > 0) {
        const newDigitIdx = activeDigitInBlock - 1;
        const digits = extractDigits(maskedValue).split('');
        digits[BLOCK_DIGIT_STARTS[activeBlock] + newDigitIdx] = '0';
        setMaskedValue(applyMask(digits.join('')));
        selectDigitInBlock(activeBlock, newDigitIdx);
      } else if (activeBlock > 0) {
        selectDigitInBlock(activeBlock - 1, BLOCKS[activeBlock - 1].length - 1);
      }
      return;
    }
    if (e.key === 'Delete') {
      e.preventDefault();
      const digits = extractDigits(maskedValue).split('');
      digits[BLOCK_DIGIT_STARTS[activeBlock] + activeDigitInBlock] = '0';
      setMaskedValue(applyMask(digits.join('')));
      if (activeDigitInBlock < block.length - 1) selectDigitInBlock(activeBlock, activeDigitInBlock + 1);
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (activeDigitInBlock > 0) selectDigitInBlock(activeBlock, activeDigitInBlock - 1);
      else if (activeBlock > 0) selectDigitInBlock(activeBlock - 1, BLOCKS[activeBlock - 1].length - 1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (activeDigitInBlock < block.length - 1) selectDigitInBlock(activeBlock, activeDigitInBlock + 1);
      else if (activeBlock < BLOCKS.length - 1) selectDigitInBlock(activeBlock + 1, 0);
      return;
    }
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      const digits = extractDigits(maskedValue).split('');
      digits[BLOCK_DIGIT_STARTS[activeBlock] + activeDigitInBlock] = e.key;
      const newMasked = applyMask(digits.join(''));
      setMaskedValue(newMasked);

      if (activeDigitInBlock < block.length - 1) {
        selectDigitInBlock(activeBlock, activeDigitInBlock + 1);
      } else {
        // Bloque completo — validar
        const isValid = tryValidate(newMasked, activeBlock);
        if (isValid && activeBlock < BLOCKS.length - 1) {
          selectBlock(activeBlock + 1);
        } else if (!isValid) {
          selectBlock(activeBlock);
        } else {
          // Último bloque válido — mover cursor al final (terminó la edición)
          requestAnimationFrame(() => {
            inputRef.current?.setSelectionRange(maskedValue.length, maskedValue.length);
            inputRef.current?.blur();
          });
        }
      }
      return;
    }
  };

  const handleFocus = () => requestAnimationFrame(() => selectBlock(0));
  const handleBlur = () => {
    tryValidate(maskedValue, 4);
    baseInputProps.onBlur?.(baseInputProps.name);
  };
  const handleClick = (e) => selectBlock(getBlockAtPos(e.target.selectionStart));

  // ===== Modal calendario =====
  const openDatePicker = () => {
    const digits = extractDigits(maskedValue);
    const month = parseInt(digits.slice(2, 4), 10);
    const year = parseInt(digits.slice(4, 8), 10);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
      setCalMonth(month - 1);
      setCalYear(year);
    } else {
      setCalMonth(today.getMonth());
      setCalYear(today.getFullYear());
    }
    setShowDatePicker(true);
  };

  const handleDaySelect = (day) => {
    const digits = extractDigits(maskedValue).split('');
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(calMonth + 1).padStart(2, '0');
    const yearStr = String(calYear).padStart(4, '0');
    digits[0] = dayStr[0]; digits[1] = dayStr[1];
    digits[2] = monthStr[0]; digits[3] = monthStr[1];
    digits[4] = yearStr[0]; digits[5] = yearStr[1]; digits[6] = yearStr[2]; digits[7] = yearStr[3];
    tryValidate(applyMask(digits.join('')), 4);
    setShowDatePicker(false);
  };

  const handleToday = () => {
    tryValidate(dateToMasked(new Date()), 4);
    setShowDatePicker(false);
  };

  const handleClearDate = () => {
    const digits = extractDigits(maskedValue).split('');
    digits[0] = '0'; digits[1] = '0'; digits[2] = '0'; digits[3] = '0';
    digits[4] = '0'; digits[5] = '0'; digits[6] = '0'; digits[7] = '0';
    const newMasked = applyMask(digits.join(''));
    setMaskedValue(newMasked);
    setLastValidValue(newMasked);
    baseInputProps.onChange?.(baseInputProps.name, '');
    setShowDatePicker(false);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days = [];
    const prevLast = new Date(calYear, calMonth, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) days.push({ day: prevLast - i, currentMonth: false });
    for (let d = 1; d <= daysInMonth; d++) days.push({ day: d, currentMonth: true });
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) days.push({ day: d, currentMonth: false });
    return days;
  }, [calMonth, calYear]);

  const currentDigits = extractDigits(maskedValue);
  const selectedDateKey = `${parseInt(currentDigits.slice(0, 2), 10)}/${parseInt(currentDigits.slice(2, 4), 10)}/${parseInt(currentDigits.slice(4, 8), 10)}`;
  const todayKey = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  // ===== Modal hora =====
  const openTimePicker = () => {
    const digits = extractDigits(maskedValue);
    setTempTime({ h: parseInt(digits.slice(8, 10), 10), m: parseInt(digits.slice(10, 12), 10) });
    setShowTimePicker(true);
  };

  const handleTimeSelect = (type, val) => {
    if (type === 'hour') setTempTime(prev => ({ ...prev, h: parseInt(val, 10) }));
    else if (type === 'minute') setTempTime(prev => ({ ...prev, m: parseInt(val, 10) }));
    else if (type === 'ampm') {
      setTempTime(prev => {
        const h12 = prev.h % 12;
        return { ...prev, h: val === 'PM' ? (h12 === 0 ? 12 : h12 + 12) : h12 };
      });
    }
  };

  const handleNow = () => {
    const now = new Date();
    setTempTime({ h: now.getHours(), m: now.getMinutes() });
  };

  const handleAcceptTime = () => {
    const digits = extractDigits(maskedValue).split('');
    const hStr = String(tempTime.h).padStart(2, '0');
    const mStr = String(tempTime.m).padStart(2, '0');
    digits[8] = hStr[0]; digits[9] = hStr[1];
    digits[10] = mStr[0]; digits[11] = mStr[1];
    tryValidate(applyMask(digits.join('')), 4);
    setShowTimePicker(false);
  };

  const handleClearTime = () => {
    const digits = extractDigits(maskedValue).split('');
    digits[8] = '0'; digits[9] = '0'; digits[10] = '0'; digits[11] = '0';
    const newMasked = applyMask(digits.join(''));
    setMaskedValue(newMasked);
    setLastValidValue(newMasked);
    baseInputProps.onChange?.(baseInputProps.name, maskedToValue(newMasked) || '');
    setShowTimePicker(false);
  };

  const hours24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const hours12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const tempHour12 = tempTime.h % 12 === 0 ? 12 : tempTime.h % 12;
  const tempPeriod = tempTime.h >= 12 ? 'PM' : 'AM';

  // ===== Render =====
  const { label, required, disabled, placeholder, className = '' } = baseInputProps;

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={baseInputProps.name}
          className={`block text-sm font-medium text-gray-700 mb-2 ${disabled ? 'text-gray-400' : ''}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={baseInputProps.name}
          name={baseInputProps.name}
          type="text"
          value={maskedValue}
          placeholder={placeholder || MASK}
          disabled={disabled}
          autoComplete="off"
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleClick}
          onChange={() => {}}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white border-gray-300 hover:border-gray-400 text-gray-900 text-base font-mono tracking-wide pr-20 ${className} ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
          aria-invalid={error ? 'true' : 'false'}
        />

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={openDatePicker}
            className="p-1 text-gray-500 hover:text-blue-600 focus:outline-none transition-colors"
            aria-label="Mostrar calendario"
            title="Seleccionar fecha"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={openTimePicker}
            className="p-1 text-gray-500 hover:text-blue-600 focus:outline-none transition-colors"
            aria-label="Mostrar selector de hora"
            title="Seleccionar hora"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {(minDateTime || maxDateTime) && (
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          {minDateTime && <span>Mín: {dateToMasked(minDateTime)}</span>}
          {maxDateTime && <span>Máx: {dateToMasked(maxDateTime)}</span>}
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600" role="alert">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {error}
        </div>
      )}

      {/* ===== Modal Calendario ===== */}
      {showDatePicker && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDatePicker(false)} />
          <div className="relative bg-white border border-gray-300 rounded-lg shadow-2xl p-4 w-[340px] z-10">
            <div className="flex justify-between items-center mb-3">
              <button type="button" onClick={prevMonth} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="flex gap-1">
                <select
                  value={calMonth}
                  onChange={(e) => setCalMonth(parseInt(e.target.value, 10))}
                  className="text-sm font-medium text-gray-800 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                >
                  {MONTHS_ES.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select
                  value={calYear}
                  onChange={(e) => setCalYear(parseInt(e.target.value, 10))}
                  className="text-sm font-medium text-gray-800 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 30 }, (_, i) => today.getFullYear() - 10 + i).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button type="button" onClick={nextMonth} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS_ES.map(wd => (
                <div key={wd} className="text-center text-xs font-semibold text-gray-500 py-1">{wd}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, i) => {
                const dayKey = `${d.day}/${calMonth + 1}/${calYear}`;
                const isSelected = d.currentMonth && dayKey === selectedDateKey;
                const isToday = d.currentMonth && dayKey === todayKey;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDaySelect(d.day)}
                    className={[
                      'text-sm py-2 rounded transition-colors',
                      d.currentMonth ? 'text-gray-700' : 'text-gray-300',
                      isToday && !isSelected ? 'bg-blue-50 text-blue-600 font-semibold' : '',
                      isSelected ? 'bg-blue-600 text-white font-semibold hover:bg-blue-700' : 'hover:bg-gray-100'
                    ].join(' ').trim()}
                  >
                    {d.day}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between gap-2 mt-3 pt-3 border-t border-gray-200">
              <button type="button" onClick={handleClearDate} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                Limpiar
              </button>
              <button type="button" onClick={handleToday} className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
                Hoy
              </button>
              <button type="button" onClick={() => setShowDatePicker(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== Modal Hora ===== */}
      {showTimePicker && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTimePicker(false)} />
          <div className="relative bg-white border border-gray-300 rounded-lg shadow-2xl p-4 min-w-[320px] z-10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Seleccionar hora</h3>
              <button type="button" onClick={() => setShowTimePicker(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <select
                  value={format24Hour ? String(tempTime.h).padStart(2, '0') : String(tempHour12).padStart(2, '0')}
                  onChange={(e) => {
                    if (format24Hour) {
                      handleTimeSelect('hour', e.target.value);
                    } else {
                      let h12 = parseInt(e.target.value, 10);
                      if (tempPeriod === 'PM') h12 = h12 === 12 ? 12 : h12 + 12;
                      else h12 = h12 === 12 ? 0 : h12;
                      handleTimeSelect('hour', String(h12));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {(format24Hour ? hours24 : hours12).map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Minuto</label>
                <select
                  value={String(tempTime.m).padStart(2, '0')}
                  onChange={(e) => handleTimeSelect('minute', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
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

            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm text-gray-500 font-mono">
                {`${String(tempTime.h).padStart(2, '0')}:${String(tempTime.m).padStart(2, '0')}`}
              </span>
              <button type="button" onClick={handleNow} className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
                Ahora
              </button>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={handleClearTime} className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                Limpiar
              </button>
              <button type="button" onClick={handleAcceptTime} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                Aceptar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DateTimeInput;
