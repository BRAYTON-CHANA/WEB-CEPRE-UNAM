# Instrucciones para Integrar NeutralinoJS en un Proyecto React + Vite

Esta guía detalla los pasos y fragmentos de código necesarios para convertir una aplicación web existente de React (creada con Vite) en una aplicación de escritorio multiplataforma utilizando NeutralinoJS.

## Resumen del Problema y Solución

El principal desafío al integrar Vite y NeutralinoJS es un **conflicto en la carpeta de compilación**. Por defecto, tanto Vite como Neutralino intentan usar la carpeta `dist` para sus propios fines, lo que causa errores y un empaquetado incorrecto de los recursos.

La solución consiste en configurar Vite para que compile la aplicación de React en una carpeta separada (usaremos `build`), y luego decirle a NeutralinoJS que lea los recursos desde esa carpeta `build` para empaquetar la aplicación final en su propia carpeta `dist`. Es crucial también especificar la propiedad `documentRoot` para que el servidor de Neutralino sepa dónde encontrar el `index.html` dentro de los recursos empaquetados.

---

## Paso 1: Instalar la CLI de NeutralinoJS

Añade la herramienta de línea de comandos de NeutralinoJS como una dependencia de desarrollo en tu proyecto.

**Comando:**
```bash
npm install -D @neutralinojs/neu
```

## Paso 2: Modificar `package.json`

Define un script `release` en tu `package.json`. Este script automatizará todo el proceso de compilación en un solo comando.

**Ruta:** `package.json`

**Modificación (dentro de `"scripts"`):**
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "release": "rm -rf dist .neutralino release && vite build && neu update && neu build",
  "preview": "vite preview"
}
```
*   `rm -rf ...`: Elimina las carpetas de compilaciones anteriores para asegurar una compilación limpia.
*   `vite build`: Compila tu aplicación de React.
*   `neu update`: Descarga/actualiza los binarios y el cliente de NeutralinoJS.
*   `neu build`: Empaqueta tu aplicación de escritorio.


## Paso 3: Ajustar la Configuración de Vite

Modifica tu archivo `vite.config.js` para asegurar dos cosas:
1.  La salida de la compilación debe ser el directorio `build`.
2.  La ruta base para los assets debe ser relativa (`./`).

No necesitas reemplazar todo tu archivo. Simplemente asegúrate de que tu configuración existente incluya las siguientes claves dentro de `defineConfig`:

**Ruta:** `vite.config.js`

**Ejemplo de Integración:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // ...tus otros plugins y configuraciones...

  // Asegúrate de que estas dos opciones estén presentes:
  base: './', // <-- ¡Importante! Asegura que las rutas a los assets sean relativas.
  build: {
    outDir: 'build', // <-- ¡Crítico! Cambia la carpeta de salida a "build".
    // ...puedes tener otras opciones de build aquí...
  }
})
```

## Paso 4: Crear y Configurar `neutralino.config.json`

Este es el archivo de configuración principal para NeutralinoJS. Debe apuntar a la carpeta `build` que hemos definido en el paso anterior.

**Ruta:** `neutralino.config.json`

**Contenido Final:**
```json
{
  "applicationId": "js.neutralino.mosaic",
  "version": "1.0.0",
  "defaultMode": "browser",
  "port": 0,
  "url": "/",
  "documentRoot": "build/",
  "enableServer": true,
  "enableNativeAPI": true,
  "logging": {
    "enabled": true,
    "writeToLogFile": true
  },
  "nativeAllowList": [
    "app.*",
    "os.*",
    "filesystem.*",
    "os.showMessageBox"
  ],
  "modes": {
    "window": {
      "title": "Mosaic App con NeutralinoJS",
      "width": 1024,
      "height": 768,
      "minWidth": 400,
      "minHeight": 200,
      "icon": "public/icon.png",
      "enableInspector": false,
      "exitProcessOnClose": false
    }
  },
  "cli": {
    "binaryName": "mosaic-react-app",
    "resourcesPath": "build",
    "clientLibrary": "build/neutralino.js",
    "binaryVersion": "6.3.0",
    "clientVersion": "6.3.0"
  }
}
```
*   **`resourcesPath`**: Debe ser `"build"`, apuntando a la salida de Vite.
*   **`documentRoot`**: **¡CRÍTICO!** Debe ser `"build/"`. Le indica al servidor interno de Neutralino que la raíz de la aplicación web se encuentra dentro de una subcarpeta `build` en el archivo de recursos.
*   **`clientLibrary`**: Le indica a Neutralino dónde está el script del cliente para que pueda **inyectarlo automáticamente** en tu `index.html` al momento de la ejecución.

## Paso 5: Inicializar NeutralinoJS en la Aplicación

Para que tu aplicación pueda comunicarse con el proceso de Neutralino (por ejemplo, para cerrar la ventana o usar la API nativa), necesitas inicializar el cliente. Este código debe ejecutarse una sola vez, tan pronto como sea posible en el ciclo de vida de tu aplicación.

Busca el archivo de entrada principal de tu aplicación (para un proyecto estándar de React con Vite, suele ser `src/main.jsx` o `src/index.js`) y añade el siguiente bloque de código al inicio del archivo.

**Ejemplo de código de inicialización:**
```javascript
// Initialize NeutralinoJS
try {
  Neutralino.init();
  Neutralino.events.on("windowClose", () => {
    Neutralino.app.exit();
  });
} catch (e) {
  // Silently fail if not running in a NeutralinoJS app
}
```
*El bloque `try...catch` asegura que tu aplicación web no falle si la ejecutas en un navegador normal, donde el objeto `Neutralino` no existe.*

---

## Cómo Compilar Tu Aplicación

Con toda la configuración en su lugar, el proceso es muy simple. Solo necesitas ejecutar un único comando:

```bash
npm run release
```

Este comando se encargará de todo el proceso de limpieza, compilación y empaquetado. Al finalizar, encontrarás tu aplicación de escritorio lista para distribuir en la carpeta `dist`.
