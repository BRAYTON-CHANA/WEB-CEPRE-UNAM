export function formatFecha(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatHora(t) {
  if (!t) return '—';
  return t.slice(0, 5);
}

export function formatFechaHora(ts) {
  if (!ts) return '—';
  const str = String(ts);
  // FECHA_MARCADO se guarda en UTC (toISOString); si viene sin zona, asumir UTC
  const d = new Date(/Z|[+-]\d{2}:?\d{2}$/.test(str) ? str : str.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return '—';
  return d.toLocaleString('es-PE', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}
