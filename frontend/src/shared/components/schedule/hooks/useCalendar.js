import { useState, useCallback, useMemo } from 'react';

// ===== EVENT HELPERS =====

/**
 * Genera un color aleatorio de una paleta predefinida
 * @returns {string} Color en formato hex (ej: '#3B82F6')
 */
export const getRandomColor = () => {
  const colors = [
    '#3B82F6', // blue-500
    '#EF4444', // red-500
    '#10B981', // green-500
    '#F59E0B', // amber-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#06B6D4', // cyan-500
    '#F97316', // orange-500
    '#84CC16', // lime-500
    '#6366F1', // indigo-500
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Valida eventos y filtra bloques tipo 'break'
 * @param {Array} events - Array de eventos [{id, date, blockIndices, title, type, color?}]
 * @param {Array} customBlocks - Array de bloques personalizados
 * @returns {Object} { validEvents: Array, warnings: Array }
 */
export const validateEvents = (events, customBlocks) => {
  if (!Array.isArray(events) || events.length === 0) {
    return { validEvents: [], warnings: [] };
  }

  if (!Array.isArray(customBlocks) || customBlocks.length === 0) {
    return { validEvents: [], warnings: [] };
  }

  const validEvents = [];
  const warnings = [];

  events.forEach(event => {
    const { id, date, blockIndices, title, type, color, description, titleClassName, descriptionClassName } = event;
    
    // Validar que tenga las propiedades requeridas
    if (!id || !date || !Array.isArray(blockIndices) || blockIndices.length === 0) {
      return;
    }

    // Filtrar bloques tipo 'break'
    const claseBlockIndices = blockIndices.filter(index => {
      const block = customBlocks[index];
      return block && block.type === 'clase';
    });

    // Detectar si se intentó incluir bloques 'break'
    const breakBlockIndices = blockIndices.filter(index => {
      const block = customBlocks[index];
      return block && block.type === 'break';
    });

    if (breakBlockIndices.length > 0) {
      warnings.push({
        eventId: id,
        eventTitle: title || 'Sin título',
        breakIndices: breakBlockIndices,
        message: `El evento "${title || 'Sin título'}" intentó incluir bloques tipo 'break' (índices: ${breakBlockIndices.join(', ')}). Estos bloques fueron ignorados.`
      });
    }

    // Si después de filtrar no quedan bloques válidos, no agregar el evento
    if (claseBlockIndices.length === 0) {
      return;
    }

    // Asignar color aleatorio si no se proporcionó
    const eventColor = color || getRandomColor();

    validEvents.push({
      id,
      date: new Date(date),
      blockIndices: claseBlockIndices,
      originalBlockIndices: blockIndices,
      title: title || 'Sin título',
      type: type || 'evento',
      color: eventColor,
      description,
      titleClassName,
      descriptionClassName
    });
  });

  return { validEvents, warnings };
};

/**
 * Cuenta bloques de eventos para un día específico
 * @param {Array} events - Array de eventos validados
 * @param {Date} date - Fecha del día
 * @returns {number} Cantidad de bloques de eventos en ese día
 */
export const countEventBlocksForDay = (events, date) => {
  if (!Array.isArray(events) || events.length === 0) {
    return 0;
  }

  return events
    .filter(event => event.date.toDateString() === date.toDateString())
    .reduce((total, event) => total + event.blockIndices.length, 0);
};

/**
 * Cuenta bloques de eventos para un mes específico
 * @param {Array} events - Array de eventos validados
 * @param {number} year - Año
 * @param {number} month - Mes (0-11)
 * @returns {number} Cantidad de bloques de eventos en ese mes
 */
export const countEventBlocksForMonth = (events, year, month) => {
  if (!Array.isArray(events) || events.length === 0) {
    return 0;
  }

  return events
    .filter(event => {
      const eventDate = event.date;
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    })
    .reduce((total, event) => total + event.blockIndices.length, 0);
};

// Constants
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const SHORT_MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const FULL_WEEK_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Hook useCalendar - Maneja estado y navegación del calendario
 * @param {Date} initialDate - Fecha inicial (default: hoy)
 * @param {string} initialView - Vista inicial: 'year'|'month'|'week'|'day' (default: 'month')
 * @returns {Object} Estado y acciones del calendario
 */
export const useCalendar = (initialDate = new Date(), initialView = 'month') => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState(initialView);

  // ===== NAVEGACIÓN =====
  
  const goToPrevious = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      switch (viewMode) {
        case 'year':
          newDate.setFullYear(newDate.getFullYear() - 1);
          break;
        case 'month':
          newDate.setMonth(newDate.getMonth() - 1);
          break;
        case 'week':
          newDate.setDate(newDate.getDate() - 7);
          break;
        case 'day':
          newDate.setDate(newDate.getDate() - 1);
          break;
      }
      return newDate;
    });
  }, [viewMode]);

  const goToNext = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      switch (viewMode) {
        case 'year':
          newDate.setFullYear(newDate.getFullYear() + 1);
          break;
        case 'month':
          newDate.setMonth(newDate.getMonth() + 1);
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + 7);
          break;
        case 'day':
          newDate.setDate(newDate.getDate() + 1);
          break;
      }
      return newDate;
    });
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const setDate = useCallback((date) => {
    setCurrentDate(new Date(date));
  }, []);

  // ===== HELPERS =====

  const generateMonthDays = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    const today = new Date();
    
    // Celdas vacías
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ type: 'empty', key: `empty-${i}` });
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      days.push({
        type: 'day',
        day,
        date: dateObj,
        isToday: dateObj.toDateString() === today.toDateString(),
        key: `day-${day}`
      });
    }
    
    return days;
  }, []);

  const generateWeekDays = useCallback((date) => {
    const today = new Date();
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    // Ajustar para que la semana inicie en lunes (0=domingo, 1=lunes)
    const adjustDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - adjustDay);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(startOfWeek);
      dateObj.setDate(startOfWeek.getDate() + i);
      
      days.push({
        day: dateObj.getDate(),
        weekday: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i],
        fullWeekday: FULL_WEEK_DAYS[(i + 1) % 7],
        date: dateObj,
        isToday: dateObj.toDateString() === today.toDateString(),
        key: `weekday-${i}`
      });
    }
    
    return days;
  }, []);

  // ===== TIME BLOCK HELPERS =====

  const formatTime = useCallback((hour, minute = 0) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }, []);

  const generateTimeBlocks = useCallback((startHour = 0, finalHour = 23, blockSeparation = 60) => {
    // Validaciones
    if (finalHour <= startHour) {
      console.warn(`[useCalendar] finalHour (${finalHour}) debe ser mayor que startHour (${startHour}). Usando valores por defecto.`);
      startHour = 0;
      finalHour = 23;
    }

    if (blockSeparation <= 0 || blockSeparation > 180) {
      console.warn(`[useCalendar] blockSeparation (${blockSeparation}) inválido. Usando 60.`);
      blockSeparation = 60;
    }

    const blocks = [];
    const startMinutes = startHour * 60;
    // Incluir hasta la hora final exacta (ej: 18:00 si finalHour=18)
    const endMinutes = finalHour * 60;
    const totalRange = endMinutes - startMinutes;

    let currentMinute = startMinutes;
    
    while (currentMinute < endMinutes) {
      const hour = Math.floor(currentMinute / 60);
      const minute = currentMinute % 60;
      
      // Calcular fin de este bloque
      let blockEndMinute = currentMinute + blockSeparation;
      
      // Si excede el límite, crear bloque final con lo que queda
      if (blockEndMinute > endMinutes) {
        blockEndMinute = endMinutes;
      }
      
      const endHour = Math.floor(blockEndMinute / 60);
      const endMinute = blockEndMinute % 60;
      
      // Calcular duración real del bloque
      const actualDuration = blockEndMinute - currentMinute;
      
      // Solo agregar si tiene duración positiva
      if (actualDuration > 0) {
        blocks.push({
          hour,
          minute,
          duration: actualDuration,
          time: formatTime(hour, minute),
          endTime: formatTime(endHour, endMinute),
          timeRange: `${formatTime(hour, minute)} - ${formatTime(endHour, endMinute)}`,
          key: `block-${hour}-${minute}-${actualDuration}`
        });
      }
      
      // Avanzar al siguiente bloque
      currentMinute = blockEndMinute;
    }

    return blocks;
  }, [formatTime]);

  /**
   * Genera bloques de tiempo personalizados con soporte para truncamiento
   * @param {Array} customBlocks - Array de bloques personalizados [{duration, type, label}]
   * @param {number} startHour - Hora de inicio base
   * @param {number|null} finalHour - Hora final tope (opcional)
   * @returns {Object} { blocks: Array, truncated: Array, omitted: Array }
   */
  const generateCustomBlocks = useCallback((customBlocks, startHour = 0, finalHour = null) => {
    if (!Array.isArray(customBlocks) || customBlocks.length === 0) {
      return { blocks: [], truncated: [], omitted: [] };
    }

    const blocks = [];
    const truncated = [];
    const omitted = [];
    
    const startMinutes = startHour * 60;
    const finalMinutes = finalHour !== null ? finalHour * 60 : null;
    let currentMinute = startMinutes;

    customBlocks.forEach((customBlock, index) => {
      const { duration, type, label } = customBlock;
      
      // Verificar si el bloque inicia después del límite (omisión completa)
      if (finalMinutes !== null && currentMinute >= finalMinutes) {
        omitted.push({
          index,
          label: label || `Bloque ${index + 1}`,
          duration,
          reason: 'Inicia después del horario límite'
        });
        return;
      }

      // Calcular hora de inicio
      const hour = Math.floor(currentMinute / 60);
      const minute = currentMinute % 60;
      
      // Verificar si necesita truncamiento
      let actualDuration = duration;
      let isTruncated = false;
      let blockEndMinute = currentMinute + duration;
      
      if (finalMinutes !== null && blockEndMinute > finalMinutes) {
        actualDuration = finalMinutes - currentMinute;
        blockEndMinute = finalMinutes;
        isTruncated = true;
      }

      // Calcular hora de fin
      const endHour = Math.floor(blockEndMinute / 60);
      const endMinute = blockEndMinute % 60;

      // Crear el bloque
      const block = {
        hour,
        minute,
        duration: actualDuration,
        originalDuration: duration,
        type: type || 'clase',
        label: label || `Bloque ${index + 1}`,
        time: formatTime(hour, minute),
        endTime: formatTime(endHour, endMinute),
        timeRange: `${formatTime(hour, minute)} - ${formatTime(endHour, endMinute)}`,
        key: `custom-block-${index}-${hour}-${minute}`,
        isTruncated,
        index
      };

      blocks.push(block);

      // Registrar si fue truncado
      if (isTruncated) {
        truncated.push({
          index,
          label: block.label,
          originalDuration: duration,
          newDuration: actualDuration,
          timeEnd: formatTime(endHour, endMinute),
          reason: `Truncado por límite ${formatTime(Math.floor(finalMinutes / 60), finalMinutes % 60)}`
        });
      }

      // Avanzar al siguiente bloque
      currentMinute = blockEndMinute;
    });

    return { blocks, truncated, omitted };
  }, [formatTime]);

  const validateTimeProps = useCallback((startHour, finalHour) => {
    const defaults = { startHour: 0, finalHour: 23 };
    
    if (startHour === undefined || finalHour === undefined) {
      return defaults;
    }

    if (finalHour <= startHour) {
      console.warn('[useCalendar] finalHour debe ser mayor que startHour');
      return defaults;
    }

    return { startHour, finalHour };
  }, []);

  // ===== DERIVED STATE =====

  const headerTitle = useMemo(() => {
    switch (viewMode) {
      case 'year':
        return currentDate.getFullYear();
      case 'month':
        return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case 'week': {
        const days = generateWeekDays(currentDate);
        const start = days[0];
        const end = days[6];
        if (start.date.getMonth() === end.date.getMonth()) {
          return `${start.day}-${end.day} ${SHORT_MONTH_NAMES[start.date.getMonth()]} ${start.date.getFullYear()}`;
        } else {
          return `${start.day} ${SHORT_MONTH_NAMES[start.date.getMonth()]} - ${end.day} ${SHORT_MONTH_NAMES[end.date.getMonth()]} ${start.date.getFullYear()}`;
        }
      }
      case 'day':
        return `${FULL_WEEK_DAYS[currentDate.getDay()]} ${currentDate.getDate()} ${SHORT_MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      default:
        return '';
    }
  }, [currentDate, viewMode, generateWeekDays]);

  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    return currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  }, [currentDate]);

  const isCurrentYear = useMemo(() => {
    return currentDate.getFullYear() === new Date().getFullYear();
  }, [currentDate]);

  return {
    // State
    currentDate,
    viewMode,
    
    // Actions
    setViewMode,
    setDate,
    goToPrevious,
    goToNext,
    goToToday,
    
    // Helpers
    generateMonthDays,
    generateWeekDays,
    generateTimeBlocks,
    generateCustomBlocks,
    formatTime,
    validateTimeProps,
    
    // Derived
    headerTitle,
    isCurrentMonth,
    isCurrentYear,
    
    // Constants
    monthNames: MONTH_NAMES,
    shortMonthNames: SHORT_MONTH_NAMES,
    fullWeekDays: FULL_WEEK_DAYS,
    weekDays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  };
};

export default useCalendar;
