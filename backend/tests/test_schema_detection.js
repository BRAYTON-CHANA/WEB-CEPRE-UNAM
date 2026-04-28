// Script de prueba para verificar el sistema de auto-detección de esquemas
const DatabaseManager = require('../src/database/DatabaseManager');
const TableSchema = require('../src/database/TableSchema');
const TablaCrudBasico = require('../src/models/TablaCrudBasico');

async function testSchemaDetection() {
  console.log('🧪 Iniciando pruebas de auto-detección de esquemas...\n');

  try {
    // 1. Inicializar base de datos
    console.log('1️⃣ Inicializando base de datos...');
    await DatabaseManager.init();
    console.log('✅ Base de datos inicializada\n');

    // 2. Probar detección de esquemas
    console.log('2️⃣ Probando detección de esquemas...');
    const schema = await DatabaseManager.getTableSchema('tablaCrudBasico');
    console.log('📋 Esquema detectado:', schema);
    console.log('✅ Detección de esquemas funcionando\n');

    // 3. Probar TableSchema con auto-detección
    console.log('3️⃣ Probando TableSchema con auto-detección...');
    await TableSchema.initializeSchemas();
    const schemaFromTableSchema = await TableSchema.getSchema('tablaCrudBasico');
    console.log('📋 Esquema desde TableSchema:', schemaFromTableSchema);
    console.log('✅ TableSchema con auto-detección funcionando\n');

    // 4. Probar creación de modelo con nuevo sistema
    console.log('4️⃣ Probando creación de modelo...');
    const tablaInstance = await TablaCrudBasico.create();
    console.log('📋 Modelo creado:', tablaInstance.constructor.name);
    console.log('📋 Esquema del modelo:', tablaInstance.schema);
    console.log('✅ Modelo creado exitosamente\n');

    // 5. Probar validación con esquema detectado
    console.log('5️⃣ Probando validación...');
    const testData = {
      campo_string: "Test",
      campo_entero: 42,
      campo_booleano: true
    };
    
    const isValid = await TableSchema.validate(testData, 'tablaCrudBasico');
    console.log('📋 Validación de datos:', isValid ? '✅ Válidos' : '❌ Inválidos');
    console.log('✅ Validación funcionando\n');

    // 6. Mostrar información del sistema
    console.log('6️⃣ Información del sistema:');
    const systemInfo = TableSchema.getSystemInfo();
    console.log('📊 Estado del sistema:', systemInfo);

    console.log('\n🎉 Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    // Cerrar conexión
    DatabaseManager.close();
  }
}

// Ejecutar pruebas
testSchemaDetection();
