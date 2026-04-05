import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/app/App';

// Intenta inicializar NeutralinoJS de forma segura.
// Esto permite que la app se ejecute tanto en el navegador como en Neutralino.
let backendServer = null;

try {
  Neutralino.init();
  console.log("¡Éxito! NeutralinoJS API está activa.");
  
  // Iniciar backend cuando la app esté lista
  const startBackend = async () => {
    try {
      console.log('Iniciando backend con SQLite y auto-detección de esquemas...');
      
      // Primero limpiar cualquier proceso residual en el puerto 3001
      await cleanupPort3001();
      
      // Pequeña espera para que el puerto se libere completamente
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Ejecutar el nuevo servidor backend con persistencia real
      const result = await Neutralino.os.execCommand('node src/index.js', {
        cwd: NL_PATH
      });
      
      console.log('Backend iniciado:', result);
      
      // Esperar y verificar con reintentos
      await waitForBackendReady();
      
    } catch (error) {
      console.error('❌ Error al iniciar backend:', error);
    }
  };
  
  // Limpiar procesos en puerto 3001 antes de iniciar
  const cleanupPort3001 = async () => {
    try {
      console.log('🧹 Limpiando puerto 3001...');
      
      // Método 1: Buscar y matar procesos por puerto
      await Neutralino.os.execCommand('for /f "tokens=5" %a in (\'netstat -aon ^| findstr :3001\') do taskkill /f /pid %a 2>nul', {
        cwd: NL_PATH
      });
      
      // Método 2: Matar procesos node.exe (más agresivo)
      await Neutralino.os.execCommand('taskkill /f /im node.exe 2>nul', {
        cwd: NL_PATH
      });
      
      console.log('✅ Limpieza del puerto completada');
    } catch (error) {
      console.log('🔍 No se encontraron procesos para limpiar');
    }
  };
  
  // Esperar a que el backend esté listo con reintentos
  const waitForBackendReady = async (maxRetries = 10, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        const health = await response.json();
        console.log('✅ Backend saludable:', health);
        
        if (health.database === 'SQLite' && health.features?.autoSchemaDetection) {
          console.log('🎉 Sistema con persistencia SQLite y auto-detección funcionando!');
          return true;
        }
      } catch (error) {
        console.log(`Intento ${i + 1}/${maxRetries}: Backend aún no está listo, esperando ${delay}ms...`);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          // Incrementar delay exponencialmente
          delay = Math.min(delay * 1.5, 5000);
        }
      }
    }
    
    console.error('❌ El backend no pudo iniciarse después de varios intentos');
    return false;
  };
  
  // Iniciar backend cuando la app esté lista
  startBackend();
  
  // Configurar el evento de cierre de ventana
  Neutralino.events.on('windowClose', () => {
    console.log('Cerrando aplicación...');
    
    // Detener el backend antes de cerrar
    const stopBackend = async () => {
      try {
        // Método simple y directo: matar procesos node.exe
        await Neutralino.os.execCommand('taskkill /f /im node.exe 2>nul', {
          cwd: NL_PATH
        });
        console.log('Backend detenido');
      } catch (error) {
        console.log('No se pudo detener el backend (puede que ya no esté corriendo)');
      }
      
      // Cerrar la aplicación
      Neutralino.app.exit();
    };
    
    stopBackend();
  });
  
} catch (e) {
  // Normal en un navegador, el objeto Neutralino no existe.
  console.log("Modo web detectado. La API de NeutralinoJS no está disponible.");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
