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
      console.log(`📡 API disponible en: http://localhost:${PORT}`);
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
