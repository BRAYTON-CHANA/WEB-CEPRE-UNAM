const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('dotenv').config(); // fallback: backend/.env si existe

const DatabaseManager = require('./database/DatabaseManager');

const app = express();

// Middleware base
app.use(helmet());
app.use(cors());
app.use(express.json());

// Conexión perezosa a SQLite Cloud en el primer request
let connected = false;
app.use(async (req, res, next) => {
  try {
    if (!connected) {
      await DatabaseManager.connect();
      connected = true;
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: 'SQLiteCloud',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de funciones SQL parametrizadas
app.use('/api/functions', require('./routes/genericFunctions'));

// Rutas CRUD genéricas (deben ir al final por catch-all 404 interno)
app.use('/api', require('./routes/genericCrud'));

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
  });
});

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`,
  });
});

module.exports = app;

// Solo escucha si se invoca directo (dev local)
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Backend dev en http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  });
}
