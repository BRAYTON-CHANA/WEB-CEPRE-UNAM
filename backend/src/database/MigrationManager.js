const fs = require('fs').promises;
const path = require('path');

class MigrationManager {
  static migrationsPath = path.join(__dirname, 'migrations');
  static migrationsTable = 'migrations';
  static dbManager = null; // Referencia al DatabaseManager (inyectado)

  /**
   * Establecer la referencia al DatabaseManager (inyección de dependencia)
   * @param {Object} dbManager - Instancia de DatabaseManager
   */
  static setDatabaseManager(dbManager) {
    this.dbManager = dbManager;
  }

  /**
   * Crear tabla de migraciones si no existe
   */
  static async createMigrationsTable() {
    if (!this.dbManager) {
      throw new Error('DatabaseManager no ha sido inyectado. Llama a MigrationManager.setDatabaseManager() primero.');
    }
    
    try {
      // Primero intentar DROP para asegurar esquema correcto (SQLite Cloud puede tener tablas preexistentes)
      await this.dbManager.run(`DROP TABLE IF EXISTS ${this.migrationsTable}`);
    } catch (err) {
      // Ignorar error si tabla no existe
    }
    
    const sql = `
      CREATE TABLE ${this.migrationsTable} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await this.dbManager.run(sql);
    console.log('✅ Tabla de migraciones creada o verificada');
  }

  /**
   * Obtener lista de migraciones ya ejecutadas
   */
  static async getExecutedMigrations() {
    if (!this.dbManager) {
      throw new Error('DatabaseManager no ha sido inyectado. Llama a MigrationManager.setDatabaseManager() primero.');
    }
    
    const sql = `SELECT filename FROM ${this.migrationsTable} ORDER BY filename`;
    const rows = await this.dbManager.all(sql);
    return rows.map(row => row.filename);
  }

  /**
   * Obtener lista de archivos de migración disponibles
   */
  static async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ordenar por nombre (001, 002, etc.)
    } catch (error) {
      console.error('Error leyendo directorio de migraciones:', error);
      return [];
    }
  }

  /**
   * Ejecutar una migración específica
   */
  static async executeMigration(filename) {
    if (!this.dbManager) {
      throw new Error('DatabaseManager no ha sido inyectado. Llama a MigrationManager.setDatabaseManager() primero.');
    }
    
    try {
      const filePath = path.join(this.migrationsPath, filename);
      const sql = await fs.readFile(filePath, 'utf8');
      
      // Separar el SQL en múltiples statements pero mantener CREATE TABLE con sus índices juntos
      const statements = this.parseSqlStatements(sql);

      // Ejecutar cada statement
      console.log(`\n📄 ${filename} - Ejecutando ${statements.length} sentencias:`);
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        const firstLine = statement.split('\n')[0].trim();
        const operation = firstLine.substring(0, 50);
        console.log(`  ${i + 1}/${statements.length}: ${operation}...`);
        try {
          await this.dbManager.run(statement);
          console.log(`     ✅ OK`);
        } catch (err) {
          // Ignorar errores de UNIQUE constraint en INSERT (datos ya existen)
          if (statement.trim().toUpperCase().startsWith('INSERT') && err.message.includes('UNIQUE')) {
            console.log(`     ⚠️ SKIP: Dato ya existe`);
          } else {
            console.log(`     ❌ ERROR: ${err.message}`);
            throw err;
          }
        }
      }

      // Registrar migración como ejecutada
      const insertSql = `INSERT INTO ${this.migrationsTable} (filename) VALUES (?)`;
      await this.dbManager.run(insertSql, [filename]);

      console.log(`✅ Migración ${filename} ejecutada correctamente`);
      return true;
    } catch (error) {
      console.error(`❌ Error ejecutando migración ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Ejecutar todas las migraciones pendientes
   */
  static async runMigrations() {
    try {
      console.log('🔄 Iniciando proceso de migraciones...');
      
      // Crear tabla de migraciones
      await this.createMigrationsTable();
      
      // Obtener migraciones ejecutadas y disponibles
      const executedMigrations = await this.getExecutedMigrations();
      const availableMigrations = await this.getMigrationFiles();
      
      // Filtrar migraciones pendientes
      const pendingMigrations = availableMigrations.filter(
        filename => !executedMigrations.includes(filename)
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ No hay migraciones pendientes');
        return;
      }

      console.log(`📋 Ejecutando ${pendingMigrations.length} migraciones pendientes...`);

      // Ejecutar migraciones pendientes en orden
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      console.log('🎉 Todas las migraciones han sido ejecutadas correctamente');
    } catch (error) {
      console.error('❌ Error en proceso de migraciones:', error);
      throw error;
    }
  }

  /**
   * Parsear SQL en statements, manteniendo CREATE TABLE con sus índices juntos
   */
  static parseSqlStatements(sql) {
    const lines = sql.split('\n');
    const statements = [];
    let currentStatement = '';
    let inCreateTable = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Ignorar comentarios y líneas vacías
      if (trimmed.startsWith('--') || trimmed.startsWith('/*') || trimmed === '') {
        continue;
      }

      currentStatement += line + '\n';

      // Detectar inicio de CREATE TABLE
      if (trimmed.toUpperCase().startsWith('CREATE TABLE')) {
        inCreateTable = true;
      }

      // Si terminamos el CREATE TABLE (encontramos ; fuera de él)
      if (trimmed.endsWith(';')) {
        if (inCreateTable) {
          inCreateTable = false;
        }
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }

    return statements;
  }

  /**
   * Obtener estado de las migraciones
   */
  static async getStatus() {
    if (!this.dbManager) {
      throw new Error('DatabaseManager no ha sido inyectado. Llama a MigrationManager.setDatabaseManager() primero.');
    }
    
    try {
      const executedMigrations = await this.getExecutedMigrations();
      const availableMigrations = await this.getMigrationFiles();
      const pendingMigrations = availableMigrations.filter(
        filename => !executedMigrations.includes(filename)
      );

      return {
        executed: executedMigrations,
        available: availableMigrations,
        pending: pendingMigrations,
        total: availableMigrations.length,
        completed: executedMigrations.length
      };
    } catch (error) {
      console.error('Error obteniendo estado de migraciones:', error);
      throw error;
    }
  }
}

module.exports = MigrationManager;
