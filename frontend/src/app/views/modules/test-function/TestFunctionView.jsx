import React, { useState, useEffect, useCallback } from 'react';
import functionService from '@/shared/services/functionService';
import SelectInput from '@/shared/components/ui/inputs/SelectInput';
import IntegerInput from '@/shared/components/ui/inputs/IntegerInput';
import TextInput from '@/shared/components/ui/inputs/TextInput';

/**
 * Vista de prueba para ejecutar funciones SQL del backend
 * Permite seleccionar una función, ver sus parámetros, ingresar valores y ejecutar
 */
function TestFunctionView() {
  // Estados
  const [availableFunctions, setAvailableFunctions] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState('');
  const [functionInfo, setFunctionInfo] = useState(null);
  const [paramValues, setParamValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showSql, setShowSql] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);

  // Cargar lista de funciones al montar
  useEffect(() => {
    loadFunctions();
  }, []);

  const loadFunctions = async () => {
    setLoading(true);
    try {
      const functions = await functionService.listFunctions();
      const functionOptions = functions.map(fn => ({
        value: fn,
        label: fn
      }));
      setAvailableFunctions(functionOptions);
      addDebugLog('Funciones cargadas', functions);
    } catch (err) {
      setError('Error cargando funciones: ' + err.message);
      addDebugLog('Error cargando funciones', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFunctionInfo = async (functionName) => {
    if (!functionName) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setParamValues({});
    
    try {
      const info = await functionService.getFunctionInfo(functionName);
      setFunctionInfo(info);
      addDebugLog(`Info cargada para ${functionName}`, info);
    } catch (err) {
      setError('Error cargando info de función: ' + err.message);
      addDebugLog('Error cargando info', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFunctionChange = (name, value) => {
    setSelectedFunction(value);
    loadFunctionInfo(value);
  };

  const handleParamChange = (name, value) => {
    setParamValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const executeFunction = async () => {
    if (!selectedFunction) return;

    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      addDebugLog('Ejecutando función', { 
        function: selectedFunction, 
        params: paramValues 
      });

      const data = await functionService.execute(selectedFunction, paramValues);
      
      setResult(data);
      addDebugLog('Resultado exitoso', data);
    } catch (err) {
      const errorMessage = err.message || 'Error desconocido';
      setError(errorMessage);
      addDebugLog('Error en ejecución', errorMessage);
    } finally {
      setExecuting(false);
    }
  };

  const clearAll = () => {
    setSelectedFunction('');
    setFunctionInfo(null);
    setParamValues({});
    setResult(null);
    setError(null);
    setDebugLogs([]);
  };

  const addDebugLog = (action, data) => {
    setDebugLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      action,
      data
    }]);
  };

  // Verificar si faltan parámetros requeridos
  const getMissingRequiredParams = () => {
    if (!functionInfo) return [];
    
    const { paramNames, optionalParams = [] } = functionInfo;
    return paramNames.filter(param => {
      const isOptional = optionalParams.includes(param);
      const hasValue = paramValues[param] !== undefined && paramValues[param] !== '';
      return !isOptional && !hasValue;
    });
  };

  const missingRequired = getMissingRequiredParams();
  const canExecute = selectedFunction && missingRequired.length === 0;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Test de Funciones SQL
          </h1>
          <p className="text-gray-600">
            Herramienta para probar y depurar funciones SQL del backend. 
            Selecciona una función, configura los parámetros y ejecuta.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel Izquierdo: Selección y Parámetros */}
          <div className="space-y-6">
            {/* Selector de Función */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                1. Seleccionar Función
              </h2>
              
              <SelectInput
                name="functionSelect"
                label="Función SQL"
                placeholder="Selecciona una función..."
                options={availableFunctions}
                value={selectedFunction}
                onChange={handleFunctionChange}
                searchable
                required
              />

              {loading && (
                <div className="mt-4 flex items-center text-blue-600">
                  <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Cargando...
                </div>
              )}
            </div>

            {/* Información de la Función */}
            {functionInfo && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    2. Información de la Función
                  </h2>
                  <button
                    onClick={() => setShowSql(!showSql)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showSql ? 'Ocultar SQL' : 'Ver SQL'}
                  </button>
                </div>

                {/* Parámetros */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Parámetros ({functionInfo.paramNames.length}):
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {functionInfo.paramNames.map(param => {
                      const isOptional = functionInfo.optionalParams?.includes(param);
                      return (
                        <span
                          key={param}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                            isOptional
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-blue-100 text-blue-700 font-medium'
                          }`}
                        >
                          :{param}
                          {isOptional && (
                            <span className="ml-1 text-xs text-gray-500">(opcional)</span>
                          )}
                          {!isOptional && (
                            <span className="ml-1 text-red-500">*</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* SQL Preview */}
                {showSql && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">SQL:</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm text-gray-800">
                      {functionInfo.sql}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Formulario de Parámetros */}
            {functionInfo && functionInfo.paramNames.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    3. Configurar Parámetros
                  </h2>
                  <button
                    onClick={() => setParamValues({})}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="space-y-4">
                  {functionInfo.paramNames.map(param => {
                    const isOptional = functionInfo.optionalParams?.includes(param);
                    const value = paramValues[param] || '';

                    // Determinar tipo de input basado en nombre del parámetro
                    const isNumeric = /ID_|NUM_|COUNT_|_ID$/i.test(param);

                    return (
                      <div key={param} className="relative">
                        {isNumeric ? (
                          <IntegerInput
                            name={param}
                            label={`${param}`}
                            placeholder={`Ingrese valor para ${param}`}
                            value={value}
                            onChange={handleParamChange}
                            required={!isOptional}
                            allowNegative={false}
                          />
                        ) : (
                          <TextInput
                            name={param}
                            label={`${param}`}
                            placeholder={`Ingrese valor para ${param}`}
                            value={value}
                            onChange={handleParamChange}
                            required={!isOptional}
                          />
                        )}
                        {isOptional && (
                          <span className="absolute right-0 top-0 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            OPCIONAL
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Alerta de parámetros faltantes */}
                {missingRequired.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Parámetros requeridos faltantes:
                        </p>
                        <p className="text-sm text-yellow-700">
                          {missingRequired.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón Ejecutar */}
                <div className="mt-6">
                  <button
                    onClick={executeFunction}
                    disabled={!canExecute || executing}
                    className={`
                      w-full py-3 px-4 rounded-lg font-medium transition-colors
                      ${canExecute && !executing
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    {executing ? (
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Ejecutando...
                      </span>
                    ) : (
                      'Ejecutar Función'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Funciones sin parámetros */}
            {functionInfo && functionInfo.paramNames.length === 0 && (
              <div className="card p-6">
                <p className="text-gray-600 mb-4">
                  Esta función no requiere parámetros.
                </p>
                <button
                  onClick={executeFunction}
                  disabled={executing}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {executing ? 'Ejecutando...' : 'Ejecutar Función'}
                </button>
              </div>
            )}
          </div>

          {/* Panel Derecho: Resultados y Debug */}
          <div className="space-y-6">
            {/* Resultados */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Resultados
              </h2>

              {result === null && error === null && (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <p>Ejecuta una función para ver los resultados</p>
                </div>
              )}

              {result !== null && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-green-600 font-medium flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Éxito - {result.length} registros
                    </span>
                    <button
                      onClick={executeFunction}
                      disabled={executing}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Re-ejecutar
                    </button>
                  </div>

                  {result.length === 0 ? (
                    <p className="text-gray-500 italic">La función no retornó resultados</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            {Object.keys(result[0]).map(key => (
                              <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.map((row, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              {Object.values(row).map((val, vidx) => (
                                <td key={vidx} className="px-3 py-2 text-gray-600">
                                  {val === null ? (
                                    <span className="text-gray-400 italic">NULL</span>
                                  ) : typeof val === 'boolean' ? (
                                    val ? 'Sí' : 'No'
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-red-800 mb-1">
                        Error al ejecutar
                      </h3>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Debug Console */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Debug Console
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showDebug ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button
                    onClick={() => setDebugLogs([])}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {showDebug && (
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  {debugLogs.length === 0 ? (
                    <p className="text-gray-500">No hay logs aún...</p>
                  ) : (
                    <div className="space-y-2">
                      {debugLogs.map((log, idx) => (
                        <div key={idx} className="border-b border-gray-700 pb-2 last:border-0">
                          <span className="text-gray-500">[{log.timestamp}]</span>
                          <span className="text-blue-400 ml-2">{log.action}</span>
                          <pre className="mt-1 text-green-400 text-xs overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botón Reset */}
            <button
              onClick={clearAll}
              className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Resetear Todo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestFunctionView;
