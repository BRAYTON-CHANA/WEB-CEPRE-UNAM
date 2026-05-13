import DatabaseManager from './database/DatabaseManager.js';
import 'dotenv/config';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { functionName, params } = req.body;

  try {
    // Convertir filtros array → objeto plano
    if (params.filters && Array.isArray(params.filters)) {
      const plainFilters = {};
      for (const filter of params.filters) {
        if (filter.op === '=') {
          plainFilters[filter.field] = filter.value;
        }
      }
      params.filters = plainFilters;
    }

    const func = DatabaseManager[functionName];
    if (!func) {
      return res.status(400).json({
        success: false,
        message: `Función ${functionName} no existe`
      });
    }

    // Conectar si no está conectado
    await DatabaseManager.connect();

    // Ejecutar función
    const args = Object.values(params || {});
    console.log(`[DEBUG execute.js] ===== Función: ${functionName} =====`);
    console.log(`[DEBUG execute.js] Args:`, args);
    
    // NOTA: Eliminado el DELETE manual de sesiones porque el trigger fn_trg_programacion_grupo_sesiones
    // ya maneja el DELETE + INSERT automáticamente. Hacerlo aquí causa conflicto de concurrencia.
    
    console.log(`[DEBUG execute.js] Ejecutando ${functionName}...`);
    const result = await func(...args);
    console.log(`[DEBUG execute.js] ${functionName} resultado:`, result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`[DEBUG execute.js] ===== ERROR en ${functionName} =====`);
    console.error(`[DEBUG execute.js] Mensaje:`, error.message);
    console.error(`[DEBUG execute.js] Código:`, error.code);
    console.error(`[DEBUG execute.js] Detalles:`, error.details);
    console.error(`[DEBUG execute.js] Hint:`, error.hint);
    console.error(`[DEBUG execute.js] Stack:`, error.stack);
    console.error(`[DEBUG execute.js] Error completo:`, error);
    
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
  }
}
