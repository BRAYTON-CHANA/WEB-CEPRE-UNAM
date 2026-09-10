export function formatList(value) {
  if (!value) return '-';
  if (Array.isArray(value)) return value.join(', ') || '-';
  return value;
}

/**
 * Formatea una fecha SOLO fecha (sin hora) evitando el offset de zona horaria.
 * PostgreSQL DATE llega como "YYYY-MM-DD" y new Date() lo parsea como UTC midnight,
 * mostrando un día menos en zonas UTC negativas (ej: Perú UTC-5).
 * Solución: parsear como fecha local (año, mes, día).
 */
export function formatDateOnly(value, options = {}) {
  if (!value) return null;
  const str = String(value);
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const localDate = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return localDate.toLocaleDateString('es-PE', {
      day: 'numeric', month: 'long', year: 'numeric',
      ...options
    });
  }
  const d = new Date(value);
  return isNaN(d) ? value : d.toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric',
    ...options
  });
}

export function formatDate(value) {
  if (!value) return '-';
  let str = String(value).trim();
  const hasTime = /[T ]\d{1,2}:\d{2}/.test(str);
  const hasTz = /[+-]\d{2}(?::\d{2})?$|Z$/.test(str);
  if (hasTime && !hasTz) {
    str = str.replace(' ', 'T') + 'Z';
  }
  const d = new Date(str);
  return isNaN(d) ? value : d.toLocaleString('es-PE', { timeZone: 'America/Lima' });
}

import React from 'react';

/**
 * Formatea una fecha con hora y un badge de estado debajo.
 * @param {string|Date} value - fecha a formatear
 * @param {boolean} isDone - si la tarea está completada
 * @param {string} doneLabel - texto cuando está hecho
 * @param {string} pendingLabel - texto cuando está pendiente
 * @returns {React.ReactElement}
 */
export function formatDatePEWithStatus(value, isDone, doneLabel, pendingLabel) {
  if (!value) return <span className="text-gray-300 italic">—</span>;
  const d = new Date(value);
  const date = d.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
  const time = d.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false });
  const label = isDone ? doneLabel : pendingLabel;
  const color = isDone ? 'text-green-600' : 'text-gray-500';
  return (
    <div className="flex flex-col">
      <span className="text-sm">{date} · {time}</span>
      <span className={`text-xs ${color}`}>{label}</span>
    </div>
  );
}
