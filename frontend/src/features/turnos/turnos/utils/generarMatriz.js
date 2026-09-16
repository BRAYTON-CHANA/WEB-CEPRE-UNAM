/**
 * generarMatrizTurno — replica client-side del algoritmo de generación de
 * MATRIZ_DIAS (antes fn_generar_matriz_turno en SQL).
 *
 * Recorre [fechaInicio, fechaFin], toma solo los días cuyo día de semana
 * (ISODOW: 1=Lun .. 7=Dom) esté en diasValidos, salta fechas bloqueadas,
 * y agrupa de a diasPorSemana por fila (semana académica). La última fila
 * incompleta se rellena con null.
 *
 * @param {Object} opts
 * @param {string} opts.fechaInicio - 'YYYY-MM-DD'
 * @param {string} opts.fechaFin - 'YYYY-MM-DD'
 * @param {number[]} opts.diasValidos - días de semana válidos (1-7)
 * @param {number} opts.diasPorSemana - columnas por fila (>= 1)
 * @param {string[]} [opts.fechasBloqueadas] - fechas 'YYYY-MM-DD' a excluir
 * @returns {string[][] | null} matriz de fechas 'YYYY-MM-DD' | null por celda
 */

const parseLocal = (s) => {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isodow = (d) => ((d.getDay() + 6) % 7) + 1;

export function generarMatrizTurno({ fechaInicio, fechaFin, diasValidos, diasPorSemana, fechasBloqueadas = [] }) {
  if (!fechaInicio || !fechaFin) return null;
  if (!Array.isArray(diasValidos) || diasValidos.length === 0) return null;
  if (!Number(diasPorSemana) || diasPorSemana < 1) return null;

  const validos = new Set(diasValidos.map(Number));
  const bloqueadas = new Set(fechasBloqueadas.map(String));

  const inicio = parseLocal(fechaInicio);
  const fin = parseLocal(fechaFin);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || inicio > fin) return null;

  const filas = [];
  let fila = [];

  for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
    const fechaStr = formatLocal(d);
    if (!validos.has(isodow(d)) || bloqueadas.has(fechaStr)) continue;

    fila.push(fechaStr);
    if (fila.length >= diasPorSemana) {
      filas.push(fila);
      fila = [];
    }
  }

  if (fila.length > 0) {
    while (fila.length < diasPorSemana) fila.push(null);
    filas.push(fila);
  }

  return filas.length > 0 ? filas : null;
}

/** Nombre del día de semana (es) para una fecha 'YYYY-MM-DD'. */
export const nombreDia = (fechaStr) => {
  if (!fechaStr) return '';
  const nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  return nombres[isodow(parseLocal(fechaStr)) - 1];
};

/** Formato corto '19 Sep 2025' para una fecha 'YYYY-MM-DD'. */
export const fechaCorta = (fechaStr) => {
  if (!fechaStr) return '';
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const d = parseLocal(fechaStr);
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
};

export default generarMatrizTurno;
