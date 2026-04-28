import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/app/App';

// Intenta inicializar NeutralinoJS de forma segura.
// Esto permite que la app se ejecute tanto en el navegador como en Neutralino.
let backendServer = null;
let backendPid = null; // PID del proceso backend para poder matarlo al cerrar

// Diagnostic logs before Neutralino initialization
console.log('[main.jsx] === DIAGNOSTIC LOGS START ===');
console.log('[main.jsx] typeof window.Neutralino:', typeof window.Neutralino);
console.log('[main.jsx] typeof Neutralino:', typeof Neutralino);
console.log('[main.jsx] window.NL_ARGS:', typeof window.NL_ARGS, window.NL_ARGS);
console.log('[main.jsx] window.__NEUTRINO_ARGS__:', typeof window.__NEUTRINO_ARGS__, window.__NEUTRINO_ARGS__);
console.log('[main.jsx] window keys:', Object.keys(window).filter(k => k.toLowerCase().includes('neutral')).join(', '));
console.log('[main.jsx] NL_PATH:', typeof NL_PATH !== 'undefined' ? NL_PATH : 'undefined (web mode)');
console.log('[main.jsx] === DIAGNOSTIC LOGS END ===');

try {
  console.log('[main.jsx] Attempting to initialize Neutralino...');
  Neutralino.init();
  console.log("[main.jsx] ✅ Success! NeutralinoJS API is active.");
  console.log('[main.jsx] NL_PATH:', NL_PATH);
  
  // Iniciar backend cuando la app esté lista
  const startBackend = async () => {
    try {
      console.log('[main.jsx] 🚀 Starting backend with SQLite and auto-schema detection...');
      console.log('[main.jsx] Working directory:', NL_PATH);
      
      // Primero limpiar cualquier proceso residual en el puerto 3001
      await cleanupPort3001();
      
      // Pequeña espera para que el puerto se libere completamente
      console.log('[main.jsx] ⏳ Waiting 1000ms for port to release...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Detectar si es release (tiene Node.js local)
      const isRelease = process.env.NL_PORT || typeof window !== 'undefined' && window.NL_ARGS;
      const nodeCmd = isRelease ? '.\\node\\node.exe' : 'node';
      
      // Ejecutar el nuevo servidor backend con persistencia real
      // Usamos spawnProcess (no execCommand) para que NO bloquee y para capturar el PID
      console.log('[main.jsx] 🔨 Spawning:', nodeCmd, 'src/index.js');
      const result = await Neutralino.os.spawnProcess(`${nodeCmd} src/index.js`, NL_PATH);

      console.log('[main.jsx] ✅ Backend spawned:', result);
      console.log('[main.jsx] Process ID (id):', result.id);
      console.log('[main.jsx] Process PID (OS):', result.pid);

      // Guardar PID para poder matarlo al cerrar la app
      backendPid = result.pid;
      backendServer = result;
      
      // Esperar y verificar con reintentos
      console.log('[main.jsx] ⏳ Waiting for backend to be ready...');
      await waitForBackendReady();
      
    } catch (error) {
      console.error('[main.jsx] ❌ Error starting backend:', error);
      console.error('[main.jsx] Error details:', JSON.stringify(error, null, 2));
    }
  };
  
  // Limpiar procesos en puerto 3001 antes de iniciar
  const cleanupPort3001 = async () => {
    try {
      console.log('[main.jsx] 🧹 Cleaning port 3001...');
      
      // Método 1: Buscar y matar procesos por puerto
      console.log('[main.jsx] 🔍 Method 1: Killing processes on port 3001...');
      await Neutralino.os.execCommand('for /f "tokens=5" %a in (\'netstat -aon ^| findstr :3001\') do taskkill /f /pid %a 2>nul', {
        cwd: NL_PATH
      });
      
      // Método 2: Matar procesos node.exe (más agresivo)
      console.log('[main.jsx] 🔍 Method 2: Killing all node.exe processes...');
      await Neutralino.os.execCommand('taskkill /f /im node.exe 2>nul', {
        cwd: NL_PATH
      });
      
      console.log('[main.jsx] ✅ Port cleanup completed');
    } catch (error) {
      console.log('[main.jsx] 🔍 No processes found to clean');
      console.log('[main.jsx] Cleanup error (may be normal):', error.message);
    }
  };
  
  // Esperar a que el backend esté listo con reintentos
  const waitForBackendReady = async (maxRetries = 10, delay = 1000) => {
    console.log('[main.jsx] ⏳ waitForBackendReady: Starting health checks...');
    console.log('[main.jsx] ⏳ Max retries:', maxRetries, 'Initial delay:', delay);
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`[main.jsx] ⏳ Attempt ${i + 1}/${maxRetries}: Checking http://localhost:3001/api/health`);
        const response = await fetch('http://localhost:3001/api/health');
        const health = await response.json();
        console.log('[main.jsx] ✅ Backend healthy:', health);
        
        if (health.database === 'SQLite' && health.features?.autoSchemaDetection) {
          console.log('[main.jsx] 🎉 System with SQLite persistence and auto-detection working!');
          return true;
        }
      } catch (error) {
        console.log(`[main.jsx] ⏳ Attempt ${i + 1}/${maxRetries}: Backend not ready yet, waiting ${delay}ms...`);
        console.log('[main.jsx] Error:', error.message);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          // Incrementar delay exponencialmente
          delay = Math.min(delay * 1.5, 5000);
          console.log('[main.jsx] ⏳ Next delay:', delay);
        }
      }
    }
    
    console.error('[main.jsx] ❌ Backend could not start after several attempts');
    return false;
  };
  
  // Iniciar backend cuando la app esté lista
  console.log('[main.jsx] 🚀 Calling startBackend()...');
  startBackend();
  
  // Configurar el evento de cierre de ventana
  Neutralino.events.on('windowClose', async () => {
    console.log('========================================');
    console.log('🚪 [windowClose] Iniciando proceso de cierre...');
    console.log('[windowClose] Backend PID guardado:', backendPid);
    console.log('========================================');

    // === MÉTODO 1 (PRIMARIO): Llamar al endpoint /api/shutdown del backend ===
    // El backend se mata a sí mismo con process.exit(0). Esto es lo más limpio.
    try {
      console.log('[windowClose] 📡 Method 1: Calling /api/shutdown endpoint...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // timeout 1.5s

      const response = await fetch('http://localhost:3001/api/shutdown', {
        method: 'POST',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      console.log('[windowClose] ✅ Shutdown endpoint responded:', data);

      // Pequeña espera para que el backend procese el process.exit
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('[windowClose] ✅ Backend should be dead now');
    } catch (error) {
      console.log('[windowClose] ⚠️ Shutdown endpoint failed (will use fallback):', error.message);
    }
    setTimeout(() => {
      console.log("This runs after 1 second");
    }, 1000);
    // === MÉTODO 2 (FALLBACK): Matar el proceso por PID específico ===
    // Por si el endpoint falló o el proceso quedó vivo
    if (backendPid) {
      try {
        console.log(`[windowClose] 🔫 Method 2 (fallback): taskkill /F /PID ${backendPid}`);
        Neutralino.os.spawnProcess(`cmd /c "taskkill /F /PID ${backendPid}"`);
        console.log('[windowClose] ✅ Taskkill spawned for backend PID');
      } catch (error) {
        console.log('[windowClose] ❌ Error spawning taskkill:', error.message);
      }
    } else {
      console.log('[windowClose] ⚠️ No backend PID stored, skipping fallback kill');
    }

    console.log('========================================');
    console.log('[windowClose] ⚠️ Cerrando aplicación AHORA');
    console.log('========================================');

    // Cerrar la aplicación Neutralino
    Neutralino.app.exit();
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
