export function formatFecha(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatHora(t) {
  if (!t) return '—';
  return t.slice(0, 5);
}
