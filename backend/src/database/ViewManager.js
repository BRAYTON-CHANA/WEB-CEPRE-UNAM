const fs = require('fs').promises;
const path = require('path');

/**
 * ViewManager - Gestiona la ejecución automática de views SQL
 * Similar a MigrationManager pero para views, ejecuta después de migraciones
 */
class ViewManager {
  static viewsPath = path.join(__dirname, 'views');
  static dbManager = null;

  /**
   * Establecer la referencia al DatabaseManager
   */
  static setDatabaseManager(dbManager) {
    this.dbManager = dbManager;
  }

  /**
   * Obtener lista de archivos de views disponibles
   */
  static async getViewFiles() {
    try {
      const files = await fs.readdir(this.viewsPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch (error) {
      console.log('📁 No se encontró directorio de views o está vacío');
      return [];
    }
  }

  /**
   * Ejecutar un archivo de view específico
   */
  static async executeView(filename) {
    if (!this.dbManager) {
      throw new Error('DatabaseManager no ha sido inyectado. Llama a ViewManager.setDatabaseManager() primero.');
    }

    try {
      const filePath = path.join(this.viewsPath, filename);
      const sql = await fs.readFile(filePath, 'utf8');

      // Extraer nombre de la view del SQL
      const viewNameMatch = sql.match(/CREATE\s+(OR\s+REPLACE\s+)?VIEW\s+(\w+)/i);
      if (viewNameMatch) {
        const viewName = viewNameMatch[2];
        // Eliminar view si existe (para recrear)
        await this.dbManager.run(`DROP VIEW IF EXISTS ${viewName}`);
      }

      // Ejecutar el SQL completo del view
      await this.dbManager.run(sql);

      console.log(`✅ View ${filename} creada/actualizada correctamente`);
      return true;
    } catch (error) {
      console.error(`❌ Error ejecutando view ${filename}:`, error.message);
      // No lanzamos error para que continúe con las demás views
      return false;
    }
  }

  /**
   * Ejecutar todas las views
   * Se ejecuta después de las migraciones para asegurar que las tablas existan
   */
  static async runViews() {
    try {
      console.log('🔄 Iniciando proceso de views...');

      const availableViews = await this.getViewFiles();

      if (availableViews.length === 0) {
        console.log('✅ No hay views para ejecutar');
        return;
      }

      console.log(`📋 Ejecutando ${availableViews.length} views...`);

      let successCount = 0;
      let errorCount = 0;

      // Ejecutar views en orden
      for (const viewFile of availableViews) {
        const success = await this.executeView(viewFile);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      console.log(`🎉 Proceso de views completado: ${successCount} éxitos, ${errorCount} errores`);
    } catch (error) {
      console.error('❌ Error en proceso de views:', error);
      throw error;
    }
  }

  /**
   * Recrear una view específica (útil para actualizaciones)
   */
  static async refreshView(viewName) {
    if (!this.dbManager) {
      throw new Error('DatabaseManager no ha sido inyectado');
    }

    try {
      // Primero eliminar la view si existe
      await this.dbManager.run(`DROP VIEW IF EXISTS ${viewName}`);
      console.log(`🗑️ View ${viewName} eliminada (si existía)`);

      // Buscar y ejecutar el archivo correspondiente
      const viewFiles = await this.getViewFiles();
      const targetFile = viewFiles.find(file =>
        file.toLowerCase().includes(viewName.toLowerCase())
      );

      if (targetFile) {
        await this.executeView(targetFile);
        console.log(`✅ View ${viewName} recreada`);
        return true;
      } else {
        console.warn(`⚠️ No se encontró archivo para view ${viewName}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error recreando view ${viewName}:`, error);
      return false;
    }
  }

  /**
   * Recrear todas las views (útil después de cambios en el esquema)
   */
  static async refreshAllViews() {
    try {
      console.log('🔄 Refrescando todas las views...');

      const viewFiles = await this.getViewFiles();

      // Primero eliminar todas las views existentes
      for (const viewFile of viewFiles) {
        // Extraer nombre del view del filename (quitar extensión)
        const viewName = path.basename(viewFile, '.sql');
        try {
          await this.dbManager.run(`DROP VIEW IF EXISTS ${viewName}`);
          console.log(`🗑️ View ${viewName} eliminada`);
        } catch (e) {
          // Ignorar errores si no existe
        }
      }

      // Volver a crear todas
      await this.runViews();

      console.log('✅ Todas las views han sido refrescadas');
    } catch (error) {
      console.error('❌ Error refrescando views:', error);
      throw error;
    }
  }
}

module.exports = ViewManager;
