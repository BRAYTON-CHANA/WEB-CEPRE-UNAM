const express = require('express');
const router = express.Router();
const FunctionManager = require('../database/FunctionManager');

// Middleware para logging
router.use((req, res, next) => {
  console.log(`🔧 Function API: ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

/**
 * GET /api/functions
 * Lista todas las funciones SQL disponibles
 */
router.get('/', async (req, res) => {
  try {
    const functions = await FunctionManager.listFunctions();
    res.json({
      success: true,
      data: functions,
      count: functions.length
    });
  } catch (error) {
    console.error('Error listing functions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/functions/:functionName
 * Ejecuta una función SQL con parámetros
 * 
 * Body: { params: { ID_DOCENTE: 5, ID_CURSO_ACTUAL: 3 } }
 */
router.post('/:functionName', async (req, res) => {
  try {
    const { functionName } = req.params;
    const { params = {} } = req.body;

    console.log(`📋 Ejecutando función: ${functionName}`);
    console.log(`📋 Parámetros recibidos:`, params);

    // Validar que la función existe
    const availableFunctions = await FunctionManager.listFunctions();
    if (!availableFunctions.includes(functionName)) {
      return res.status(404).json({
        success: false,
        error: `Function not found: ${functionName}`,
        availableFunctions
      });
    }

    // Ejecutar la función
    const results = await FunctionManager.execute(functionName, params);

    console.log(`✅ Función ${functionName} ejecutada: ${results.length} resultados`);

    res.json({
      success: true,
      data: results,
      meta: {
        functionName,
        rowCount: results.length
      }
    });
  } catch (error) {
    console.error(`❌ Error ejecutando función ${req.params.functionName}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      functionName: req.params.functionName
    });
  }
});

/**
 * GET /api/functions/:functionName/info
 * Obtiene información de una función (parámetros y SQL)
 */
router.get('/:functionName/info', async (req, res) => {
  try {
    const { functionName } = req.params;

    // Validar que la función existe
    const availableFunctions = await FunctionManager.listFunctions();
    if (!availableFunctions.includes(functionName)) {
      return res.status(404).json({
        success: false,
        error: `Function not found: ${functionName}`,
        availableFunctions
      });
    }

    const info = await FunctionManager.getFunctionInfo(functionName);

    res.json({
      success: true,
      data: {
        functionName,
        paramNames: info.paramNames,
        optionalParams: info.optionalParams,
        sql: info.sql
      }
    });
  } catch (error) {
    console.error('Error getting function info:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
