export function formatList(value) {
  if (!value) return '-';
  if (Array.isArray(value)) return value.join(', ') || '-';
  return value;
}

export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
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
