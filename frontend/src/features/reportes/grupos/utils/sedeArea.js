// Orden y agrupación de grupos por sede → área.
// Sedes conocidas primero (Moquegua, Ilo), el resto alfabético, Virtual al final.

const SEDE_ORDER = ['Moquegua', 'Ilo'];

const sedeRank = (sede) => {
  if (sede === 'Virtual') return 999;
  const i = SEDE_ORDER.indexOf(sede);
  return i >= 0 ? i : 100;
};

export const getSedeNombre = (g) => g?.NOMBRE_SEDE || 'Virtual';
export const getAreaNombre = (g) => g?.NOMBRE_AREA || 'Sin área';

export const sortBySedeArea = (grupos) =>
  [...grupos].sort((a, b) => {
    const sa = getSedeNombre(a), sb = getSedeNombre(b);
    const ra = sedeRank(sa), rb = sedeRank(sb);
    if (ra !== rb) return ra - rb;
    if (ra === 100) {
      const cmpSede = sa.localeCompare(sb);
      if (cmpSede !== 0) return cmpSede;
    }
    const cmpArea = getAreaNombre(a).localeCompare(getAreaNombre(b));
    if (cmpArea !== 0) return cmpArea;
    return String(a.CODIGO_GRUPO || a.NOMBRE_GRUPO || '').localeCompare(
      String(b.CODIGO_GRUPO || b.NOMBRE_GRUPO || ''), undefined, { numeric: true });
  });

// Nombre de archivo/carpeta seguro: ASCII puro para evitar corrupción de
// tildes al extraer el ZIP (el contenido interno sí conserva tildes).
export const sanitize = (name) =>
  String(name || 'Sin nombre')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
