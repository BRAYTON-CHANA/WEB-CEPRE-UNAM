import { db } from '@/shared/api';

/**
 * Obtiene dinámicamente todas las tablas base del schema public de PostgreSQL.
 * Excluye vistas (VW_*) y tablas del sistema.
 * @returns {Promise<string[]>} Lista de nombres de tabla en mayúsculas
 */
async function listarTablas() {
  const sql = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  const rows = await db.rawSelect(sql);
  return (rows ?? []).map(r => (r.table_name ?? r.TABLE_NAME ?? '').toUpperCase()).filter(Boolean);
}

/**
 * Exporta todas las tablas de la BD a un archivo JSON y lo descarga.
 * La lista de tablas se obtiene dinámicamente desde information_schema.
 * Cada tabla se consulta en paralelo. Las que fallen quedan como [].
 * @returns {Promise<{ success: boolean, tablas: string[], errors: string[] }>}
 */
export async function exportarBDJson() {
  const errors = [];

  const tablas = await listarTablas();

  if (tablas.length === 0) {
    throw new Error('No se pudo obtener la lista de tablas de la base de datos.');
  }

  const results = await Promise.allSettled(
    tablas.map(async (tabla) => {
      const rows = await db.select(tabla, {});
      return { tabla, rows: rows ?? [] };
    })
  );

  const backup = {};
  const fecha = new Date().toISOString();

  backup['_meta'] = {
    exportado: fecha,
    tablas,
    total_tablas: tablas.length,
    version: '1.0'
  };

  results.forEach((result, i) => {
    const tabla = tablas[i];
    if (result.status === 'fulfilled') {
      backup[tabla] = result.value.rows;
    } else {
      backup[tabla] = [];
      errors.push(`${tabla}: ${result.reason?.message ?? 'error desconocido'}`);
      console.warn(`[exportDB] Error en tabla ${tabla}:`, result.reason);
    }
  });

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const fechaArchivo = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_${fechaArchivo}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { success: true, tablas, errors };
}
