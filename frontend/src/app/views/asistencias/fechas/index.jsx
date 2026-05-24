import React, { useState } from 'react';
import Layout from '@/shared/components/layout/Layout';
import { FechaCard } from './components/FechaCard';
import { VistaFecha } from './VistaFecha';
import { useFechasConClases } from './hooks/useFechasConClases';

export default function AsistenciasPorFecha() {
  const { fechas, loading, error, recargar } = useFechasConClases();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  if (fechaSeleccionada) {
    return (
      <Layout>
        <div className="min-h-screen py-8" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
          <div className="max-w-6xl mx-auto px-4">
            <VistaFecha 
              fecha={fechaSeleccionada}
              onVolver={() => setFechaSeleccionada(null)}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-8" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Asistencias</p>
                <h1 className="text-3xl font-bold text-gray-900">Por Fecha</h1>
                <p className="text-gray-500 mt-1">
                  Selecciona una fecha para ver las clases programadas
                </p>
              </div>
              <button
                onClick={recargar}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                🔄 Actualizar
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando fechas...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">⚠️ {error}</div>
              <button 
                onClick={recargar}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Grid de fechas */}
          {!loading && !error && (
            <>
              {fechas.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <div className="text-gray-400 text-5xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay fechas programadas</h3>
                  <p className="text-gray-500">No se encontraron clases programadas desde hoy en adelante.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {fechas.map((fechaInfo) => (
                    <FechaCard
                      key={fechaInfo.fecha}
                      fechaInfo={fechaInfo}
                      seleccionada={false}
                      onClick={() => setFechaSeleccionada(fechaInfo.fecha)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
