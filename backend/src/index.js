const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Inicializar base de datos y componentes
const DatabaseManager = require('./database/DatabaseManager');
const TableSchema = require('./database/TableSchema');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Rutas básicas
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MiApp Backend está funcionando',
    timestamp: new Date().toISOString(),
    database: 'SQLite',
    features: {
      autoSchemaDetection: true,
      migrations: true,
      persistence: true
    }
  });
});

// Rutas de la API
console.log('🔧 [DEBUG] About to load genericFunctions router...');
try {
  const functionsRouter = require('./routes/genericFunctions');
  console.log('🔧 [DEBUG] genericFunctions router loaded, type:', typeof functionsRouter);
  console.log('🔧 [DEBUG] genericFunctions has stack:', functionsRouter.stack ? functionsRouter.stack.length : 'NO STACK');
  app.use('/api/functions', functionsRouter);
  console.log('🔧 [DEBUG] /api/functions route registered successfully');
} catch (err) {
  console.error('❌ [DEBUG] Error loading genericFunctions router:', err.message);
  console.error('❌ [DEBUG] Stack:', err.stack);
}

// Endpoint para shutdown del backend (llamado por la app desktop al cerrar)
// IMPORTANTE: debe estar ANTES de genericCrud porque ese router tiene un catch-all 404
app.post('/api/shutdown', (req, res) => {
  console.log('🛑 [shutdown] Recibida petición de cierre desde frontend');
  res.json({ success: true, message: 'Shutting down...' });
  // Dar tiempo a que se envíe la respuesta antes de matar el proceso
  setTimeout(() => {
    console.log('🛑 [shutdown] Cerrando proceso ahora');
    process.exit(0);
  }, 100);
});

app.use('/api', require('./routes/genericCrud')); // Rutas genéricas escalables

// Endpoint para información del sistema de esquemas
app.get('/api/system/schema-info', async (req, res) => {
  try {
    const systemInfo = TableSchema.getSystemInfo();
    const tables = await DatabaseManager.getAllTables();
    
    res.json({
      success: true,
      data: {
        ...systemInfo,
        availableTables: tables,
        databasePath: DatabaseManager.dbPath
      },
      message: 'Información del sistema obtenida exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error obteniendo información del sistema'
    });
  }
});

// Endpoint para refrescar esquemas
app.post('/api/system/refresh-schemas', async (req, res) => {
  try {
    await TableSchema.refreshSchemas();
    const systemInfo = TableSchema.getSystemInfo();
    
    res.json({
      success: true,
      data: systemInfo,
      message: 'Esquemas refrescados exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error refrescando esquemas'
    });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Error interno del servidor',
    message: 'Algo salió mal!' 
  });
});

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe` 
  });
});

// Función principal de inicio
async function startServer() {
  try {
    console.log('🔄 Inicializando sistema de base de datos...');
    
    // 1. Inicializar base de datos con migraciones
    await DatabaseManager.init();
    console.log('✅ Base de datos inicializada');
    
    // 2. Inicializar sistema de auto-detección de esquemas
    await TableSchema.initializeSchemas();
    console.log('✅ Sistema de esquemas inicializado');
    
    // 3. Mostrar información del sistema
    const systemInfo = TableSchema.getSystemInfo();
    console.log('📊 Estado del sistema:', {
      tablasDetectadas: systemInfo.totalSchemas,
      tablasDisponibles: systemInfo.availableTables,
      cacheSize: systemInfo.cacheSize
    });
    
    // 4. Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
      console.log(`🌐 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`� Base de datos: ${DatabaseManager.dbPath}`);
      
      // Debug: List all registered routes
      console.log('\n📋 [DEBUG] === ALL REGISTERED ROUTES ===');
      function listRoutes(app, pathPrefix = '') {
        const routes = [];
        if (!app._router || !app._router.stack) {
          console.log('  No routes found');
          return routes;
        }
        
        app._router.stack.forEach((layer) => {
          if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            routes.push(`${methods} ${pathPrefix}${layer.route.path}`);
          } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            const routerPath = layer.regexp 
              ? layer.regexp.toString().replace('\\/?(?=\\/|$)', '').replace(/\\\//g, '/').replace('^', '').replace('\/?$', '')
              : '';
            layer.handle.stack.forEach((handler) => {
              if (handler.route) {
                const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
                const fullPath = (pathPrefix + routerPath + handler.route.path).replace(/\/+/g, '/');
                routes.push(`${methods} ${fullPath}`);
              }
            });
          }
        });
        return routes;
      }
      
      const allRoutes = listRoutes(app);
      allRoutes.forEach(route => console.log(`  ${route}`));
      console.log(`📋 [DEBUG] Total routes: ${allRoutes.length}\n`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Schema info: http://localhost:${PORT}/api/system/schema-info`);
      console.log('✅ Sistema listo con persistencia SQLite y auto-detección de esquemas');
    });
    
    // 5. Configurar shutdown elegante
    const gracefulShutdown = async (signal) => {
      console.log(`\n📡 Recibida señal ${signal}, iniciando shutdown elegante...`);
      
      try {
        // Cerrar servidor HTTP
        server.close(async () => {
          console.log('🔌 Servidor HTTP cerrado');
          
          try {
            // Cerrar conexión a base de datos
            await DatabaseManager.close();
            console.log('🗄️  Base de datos cerrada');
            
            console.log('✅ Shutdown completado exitosamente');
            process.exit(0);
          } catch (dbError) {
            console.error('❌ Error cerrando base de datos:', dbError);
            process.exit(1);
          }
        });
        
        // Forzar shutdown después de 5 segundos si no responde
        setTimeout(() => {
          console.error('⏰ Timeout forzando shutdown...');
          process.exit(1);
        }, 5000);
        
      } catch (error) {
        console.error('❌ Error durante shutdown:', error);
        process.exit(1);
      }
    };
    
    // Escuchar señales del sistema
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGBREAK', () => gracefulShutdown('SIGBREAK')); // Windows
    
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor si se ejecuta directamente
if (require.main === module) {
  startServer();
}

module.exports = app;
