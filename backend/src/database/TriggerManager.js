const fs = require('fs').promises;
const path = require('path');

/**
 * TriggerManager - Gestiona la ejecución automática de triggers SQL
 * Similar a ViewManager pero para triggers, ejecuta después de migraciones
 */
class TriggerManager {
  static triggersPath = path.join(__dirname, 'triggers');
  static dbManager = null;

  /**
   * Establecer la referencia al DatabaseManager
   */
  static setDatabaseManager(dbManager) {
    this.dbManager = dbManager;
  }

  /**
   * Obtener lista de archivos de triggers disponibles
   */
  static async getTriggerFiles() {
    try {
      const files = await fs.readdir(this.triggersPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch (error) {
      console.log('📁 No se encontró directorio de triggers o está vacío');
      return [];
    }
  }

  /**
   * Ejecutar un archivo de trigger específico
   */
  static async executeTrigger(filename) {
    if (!this.dbManager) {
      throw new Error('DatabaseManager no ha sido inyectado. Llama a TriggerManager.setDatabaseManager() primero.');
    }

    try {
      const filePath = path.join(this.triggersPath, filename);
      const sql = await fs.readFile(filePath, 'utf8');

      // Extraer nombre del trigger del SQL
      const triggerNameMatch = sql.match(/CREATE\s+(OR\s+REPLACE\s+)?TRIGGER\s+(\w+)/i);
      if (triggerNameMatch) {
        const triggerName = triggerNameMatch[2];
        // Eliminar trigger si existe (para recrear)
        await this.dbManager.run(`DROP TRIGGER IF EXISTS ${triggerName}`);
      }

      // Dividir el SQL por punto y coma para manejar múltiples statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      // Ejecutar cada statement individualmente
      for (const statement of statements) {
        await this.dbManager.run(statement);
      }

      console.log(`✅ Trigger ${filename} creado/actualizado correctamente`);
      return true;
    } catch (error) {
      console.error(`❌ Error ejecutando trigger ${filename}:`, error.message);
      // No lanzamos error para que continúe con los demás triggers
      return false;
    }
  }

  /**
   * Ejecutar todos los triggers
   * Se ejecuta después de las migraciones para asegurar que las tablas existan
   */
  static async runTriggers() {
    try {
      console.log('🔄 Iniciando proceso de triggers...');

      const availableTriggers = await this.getTriggerFiles();

      if (availableTriggers.length === 0) {
        console.log('✅ No hay triggers para ejecutar');
        return;
      }

      console.log(`📋 Ejecutando ${availableTriggers.length} triggers...`);

      let successCount = 0;
      let errorCount = 0;

      // Ejecutar triggers en orden
      for (const triggerFile of availableTriggers) {
        const success = await this.executeTrigger(triggerFile);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      console.log(`🎉 Proceso de triggers completado: ${successCount} éxitos, ${errorCount} errores`);
    } catch (error) {
      console.error('❌ Error en proceso de triggers:', error);
      throw error;
    }
  }
}

module.exports = TriggerManager;
