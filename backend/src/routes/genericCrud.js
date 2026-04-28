const express = require('express');
const router = express.Router();
const GenericCrudController = require('../controllers/GenericCrudController');
const tableRegistry = require('../registry/TableRegistry');

// Middleware para logging de rutas genéricas
router.use((req, res, next) => {
  console.log(`🔧 Generic CRUD: ${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log(`   - Tabla: ${req.params.tableName || 'N/A'}`);
  console.log(`   - IP: ${req.ip}`);
  next();
});

// Middleware para asegurar que el registry esté inicializado
router.use(async (req, res, next) => {
  try {
    if (!tableRegistry.initialized) {
      await tableRegistry.initialize();
    }
    next();
  } catch (error) {
    console.error('Error inicializando TableRegistry:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al inicializar el registro de tablas',
      error: error.message
    });
  }
});

// Middleware de validación de tabla
const validateTable = async (req, res, next) => {
  try {
    const { tableName } = req.params;
    
    console.log(`[VALIDATE TABLE] Validando tabla: ${tableName}`);
    console.log(`[VALIDATE TABLE] Registry initialized: ${tableRegistry.initialized}`);
    console.log(`[VALIDATE TABLE] Tablas en registry: ${Array.from(tableRegistry.tables.keys()).join(', ')}`);
    
    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el nombre de la tabla'
      });
    }
    
    // Validar acceso a la tabla
    const accessValidation = await tableRegistry.validateTableAccess(tableName, req.method.toLowerCase());
    
    console.log(`[VALIDATE TABLE] Resultado validación para ${tableName}:`, accessValidation);
    
    if (!accessValidation.allowed) {
      console.log(`[VALIDATE TABLE] Acceso DENEGADO a ${tableName}: ${accessValidation.reason}`);
      return res.status(403).json({
        success: false,
        message: accessValidation.reason
      });
    }
    
    console.log(`[VALIDATE TABLE] Acceso PERMITIDO a ${tableName}`);
    
    // Agregar información de la tabla al request
    req.tableInfo = accessValidation.tableInfo;
    next();
  } catch (error) {
    console.error(`[VALIDATE TABLE] Error:`, error);
    res.status(500).json({
      success: false,
      message: 'Error validando la tabla',
      error: error.message
    });
  }
};

// Middleware para sanitizar datos de entrada
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitizar parámetros
    if (req.params.id) {
      req.params.id = parseInt(req.params.id);
      if (isNaN(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido: debe ser un número entero'
        });
      }
    }
    
    // Sanitizar query parameters
    if (req.query.limit) {
      req.query.limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 1000); // Máximo 1000
    }
    
    if (req.query.offset) {
      req.query.offset = Math.max(parseInt(req.query.offset) || 0, 0);
    }
    
    // Sanitizar body para POST/PUT
    if (req.body && typeof req.body === 'object') {
      // Eliminar campos peligrosos
      const dangerousFields = ['id', 'ID', 'created_at', 'CREATED_AT'];
      const sanitizedBody = { ...req.body };
      
      for (const field of dangerousFields) {
        delete sanitizedBody[field];
      }
      
      req.body = sanitizedBody;
    }
    
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error sanitizando los datos de entrada',
      error: error.message
    });
  }
};

// Rutas para información de tablas
router.get('/tables', GenericCrudController.getTables.bind(GenericCrudController));

// Rutas CRUD genéricas - Orden correcto: específicas primero, parámetros después
router.get('/tables/:tableName', validateTable, sanitizeInput, GenericCrudController.getAll.bind(GenericCrudController));
router.get('/tables/:tableName/search', validateTable, sanitizeInput, GenericCrudController.search.bind(GenericCrudController));
router.get('/tables/:tableName/stats', validateTable, GenericCrudController.getStats.bind(GenericCrudController));
router.post('/tables/:tableName', validateTable, sanitizeInput, GenericCrudController.create.bind(GenericCrudController));

// Ruta para obtener datos seleccionados de una tabla (campos específicos)
router.get('/tables/:tableName/select', validateTable, sanitizeInput, GenericCrudController.getSelectData.bind(GenericCrudController));

// Ruta para obtener valores únicos de una columna (DEBE ir antes de /:tableName/:id)
router.get('/tables/:tableName/unique', validateTable, sanitizeInput, GenericCrudController.getUniqueValues.bind(GenericCrudController));

// Rutas con parámetros (van al final)
router.get('/tables/:tableName/:id', validateTable, sanitizeInput, GenericCrudController.getById.bind(GenericCrudController));
router.put('/tables/:tableName/:id', validateTable, sanitizeInput, GenericCrudController.update.bind(GenericCrudController));
router.delete('/tables/:tableName/:id', validateTable, sanitizeInput, GenericCrudController.delete.bind(GenericCrudController));

// Rutas de administración del registro
router.get('/registry/stats', async (req, res) => {
  try {
    const stats = tableRegistry.getRegistryStats();
    res.json({
      success: true,
      data: stats,
      message: 'Estadísticas del registro obtenidas exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas del registro',
      error: error.message
    });
  }
});

router.get('/registry/tables', async (req, res) => {
  try {
    const tables = tableRegistry.getRegisteredTables();
    res.json({
      success: true,
      data: { tables },
      message: 'Tablas registradas obtenidas exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo tablas registradas',
      error: error.message
    });
  }
});

router.post('/registry/refresh', async (req, res) => {
  try {
    await tableRegistry.refresh();
    const stats = tableRegistry.getRegistryStats();
    res.json({
      success: true,
      data: stats,
      message: 'Registro refrescado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error refrescando el registro',
      error: error.message
    });
  }
});

// Middleware para manejar rutas no encontradas
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /api/tables',
      'GET /api/tables/:tableName',
      'GET /api/tables/:tableName/search',
      'GET /api/tables/:tableName/stats',
      'POST /api/tables/:tableName',
      'GET /api/tables/:tableName/:id',
      'PUT /api/tables/:tableName/:id',
      'DELETE /api/tables/:tableName/:id',
      'GET /api/registry/stats',
      'GET /api/registry/tables',
      'POST /api/registry/refresh'
    ]
  });
});

module.exports = router;
