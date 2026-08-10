export function formatList(value) {
  if (!value) return '-';
  if (Array.isArray(value)) return value.join(', ') || '-';
  return value;
}

export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return isNaN(d) ? value : d.toLocaleString('es-PE');
}
