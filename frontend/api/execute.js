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
    console.log('Request body:', req.body);
    const { functionName, params } = req.body;
    console.log('Function name:', functionName);
    console.log('Params:', params);

    // Convertir filtros array → objeto plano
    if (params.filters && Array.isArray(params.filters)) {
      const plainFilters = {};
      for (const filter of params.filters) {
        if (filter.op === '=') {
          plainFilters[filter.field] = filter.value;
        }
      }
      params.filters = plainFilters;
      console.log('Converted filters:', params.filters);
    }

    const func = DatabaseManager[functionName];
    if (!func) {
      console.error(`Función ${functionName} no existe en DatabaseManager`);
      return res.status(400).json({
        success: false,
        message: `Función ${functionName} no existe`
      });
    }

    // Conectar si no está conectado
    await DatabaseManager.connect();

    // Ejecutar función
    const args = Object.values(params || {});
    console.log('Args:', args);
    const result = await func(...args);
    console.log('Result:', result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Error en /api/execute (${functionName}):`, error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
}
