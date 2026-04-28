import React, { useState, useEffect } from 'react';
import { useCrud } from '../../shared/hooks/useCrud';
import { API_BASE_URL } from '../../shared/config/api';

const TestView = () => {
  // Estado para conexión
  const [connectionStatus, setConnectionStatus] = useState('🔄 Probando conexión...');
  const [backendResponse, setBackendResponse] = useState(null);

  // Estado para tabla seleccionada
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [tableStats, setTableStats] = useState(null);
  const [tableSchema, setTableSchema] = useState(null);

  const {
    tables,
    loading,
    error,
    loadTables,
    getTableData,
    getTableStats
  } = useCrud();

  // Log tables cuando cambian (debug)
  useEffect(() => {
    console.log('📋 Estado tables actualizado:', tables);
  }, [tables]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      console.log('🔍 Probando conexión con backend...');
      
      // Probar endpoint de health check
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Conexión exitosa:', data);
        setConnectionStatus('✅ Conexión exitosa');
        setBackendResponse(data);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setConnectionStatus('❌ Error de conexión');
      setBackendResponse({ error: error.message });
    }
  };

  const handleLoadTables = async () => {
    try {
      await loadTables();
      console.log('✅ Tablas cargadas:', tables);
    } catch (error) {
      console.error('❌ Error cargando tablas:', error);
    }
  };

  const handleSelectTable = async (tableName) => {
    setSelectedTable(tableName);
    setTableData([]);
    setTableStats(null);
    setTableSchema(null); // Reset schema
    
    try {
      console.log(`🔍 Cargando datos de tabla: ${tableName}`);
      const response = await getTableData(tableName);
      console.log(`✅ Datos de ${tableName}:`, response);
      
      setTableData(response.data?.records || []);
      
      // Extraer schema de la respuesta
      if (response.data?.schema) {
        console.log(`📋 Schema de ${tableName}:`, response.data.schema);
        setTableSchema(response.data.schema);
      }
    } catch (error) {
      console.error(`❌ Error cargando datos de ${tableName}:`, error);
    }
  };

  const handleLoadStats = async () => {
    if (!selectedTable) return;
    
    try {
      console.log(`📊 Cargando estadísticas de: ${selectedTable}`);
      const stats = await getTableStats(selectedTable);
      console.log(`✅ Estadísticas de ${selectedTable}:`, stats);
      console.log(`🔍 Tipo de datos de stats:`, typeof stats);
      console.log(`🔍 Keys de stats:`, stats ? Object.keys(stats) : 'null');
      setTableStats(stats);
    } catch (error) {
      console.error(`❌ Error cargando estadísticas:`, error);
    }
  };

  const renderSchema = () => {
    if (!tableSchema) return null;
    
    return (
      <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f4f8', borderRadius: '4px' }}>
        <h4>📋 Estructura de la Tabla:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
          {Object.entries(tableSchema).map(([fieldName, fieldInfo]) => (
            <div 
              key={fieldName}
              style={{ 
                padding: '0.5rem', 
                backgroundColor: '#fff', 
                borderRadius: '3px',
                border: fieldName === 'ID' ? '2px solid #4CAF50' : '1px solid #ddd'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#333' }}>
                {fieldName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                Tipo: <span style={{ fontFamily: 'monospace', color: '#2196F3' }}>
                  {fieldInfo.type?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#888' }}>
                {fieldInfo.nullable === false ? '🔴 NOT NULL' : '⚪ NULL'}
                {fieldInfo.primary_key && ' 🗝️ PRIMARY'}
                {fieldInfo.default_value !== undefined && ` 📄 Default: ${fieldInfo.default_value}`}
              </div>
              {/* Mostrar límites si existen */}
              {fieldInfo.max_length && (
                <div style={{ fontSize: '0.7rem', color: '#FF9800', marginTop: '0.25rem' }}>
                  📏 Máx: {fieldInfo.max_length} caracteres
                </div>
              )}
              {(fieldInfo.min !== undefined || fieldInfo.max !== undefined) && (
                <div style={{ fontSize: '0.7rem', color: '#FF9800', marginTop: '0.25rem' }}>
                  📊 Rango: {fieldInfo.min || '∞'} a {fieldInfo.max || '∞'}
                </div>
              )}
              {fieldInfo.allowed_values && (
                <div style={{ fontSize: '0.7rem', color: '#FF9800', marginTop: '0.25rem' }}>
                  ✅ Valores: {fieldInfo.allowed_values.join(', ')}
                </div>
              )}
              {fieldInfo.description && (
                <div style={{ fontSize: '0.6rem', color: '#666', marginTop: '0.25rem', fontStyle: 'italic' }}>
                  💡 {fieldInfo.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔧 CRUD Genérico - Versión Simplificada</h1>
      
      {/* Estado de conexión */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h2>📡 Estado de Conexión</h2>
        <p><strong>Estado:</strong> {connectionStatus}</p>
        {backendResponse && (
          <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <h4>Respuesta del Backend:</h4>
            <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
              {JSON.stringify(backendResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Paso 1: Cargar tablas */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
        <h2>Paso 1: Cargar Tablas Disponibles</h2>
        <button 
          onClick={handleLoadTables}
          disabled={loading}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: loading ? '#ccc' : '#4CAF50', 
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '1rem'
          }}
        >
          {loading ? '⏳ Cargando...' : '📋 Cargar Tablas'}
        </button>
        
        {error && (
          <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', borderRadius: '4px', color: '#c62828' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {tables.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4>📊 Tablas Encontradas:</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {tables.map((table, index) => (
                <li key={index} style={{ 
                  padding: '0.5rem', 
                  margin: '0.25rem 0', 
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: selectedTable === table ? '2px solid #2196F3' : '1px solid #ddd'
                }} onClick={() => handleSelectTable(table)}>
                  <strong>{table}</strong>
                  {selectedTable === table && ' ✅'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Paso 2: Operaciones con tabla seleccionada */}
      {selectedTable && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
          <h2>Paso 2: Operaciones con Tabla - {selectedTable}</h2>
          
          {/* Schema de la tabla */}
          {renderSchema()}
          
          {/* Botones de operación */}
          <div style={{ marginBottom: '1rem' }}>
            <button 
              onClick={handleLoadStats}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#9C27B0', 
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '1rem'
              }}
            >
              📊 Estadísticas
            </button>
            
            <button 
              onClick={() => handleSelectTable(selectedTable)}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#FF9800', 
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '1rem'
              }}
            >
              🔄 Recargar Datos
            </button>
          </div>

          {/* Estadísticas */}
          {tableStats && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f3e5f5', borderRadius: '4px' }}>
              <h4>📊 Estadísticas de {selectedTable}:</h4>
              
              {/* Acceder a los stats anidados en data.stats */}
              {tableStats.data && tableStats.data.stats && (
                <>
                  {/* Total de registros */}
                  <p><strong>Total de registros:</strong> {tableStats.data.stats.total || 0}</p>
                  
                  {/* Estadísticas numéricas */}
                  {Object.entries(tableStats.data.stats).map(([key, value]) => {
                    if (key === 'total') return null;
                    
                    // Formatear el nombre del campo
                    const displayName = key.replace(/_/g, ' ').replace(/avg_/g, 'Promedio ').toUpperCase();
                    
                    return (
                      <p key={key}>
                        <strong>{displayName}:</strong> {value !== null ? String(value) : 'N/A'}
                      </p>
                    );
                  })}
                  
                  {/* Si no hay estadísticas detalladas */}
                  {Object.keys(tableStats.data.stats).length === 1 && (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                      No hay estadísticas detalladas disponibles para esta tabla.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Datos de la tabla */}
          {tableData.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
              <h4>📋 Datos de {selectedTable} ({tableData.length} registros):</h4>
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {tableData.map((record, index) => (
                  <div key={index} style={{ 
                    padding: '0.5rem', 
                    margin: '0.25rem 0', 
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}>
                    <strong>ID: {record.ID}</strong>
                    {Object.entries(record).map(([field, value]) => (
                      field !== 'ID' && (
                        <span key={field} style={{ marginLeft: '1rem', fontSize: '0.8rem' }}>
                          {field}: {String(value)}
                        </span>
                      )
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestView;
