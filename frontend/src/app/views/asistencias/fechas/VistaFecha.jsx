import React, { useState } from 'react';
import { GruposTabs } from './components/GruposTabs';
import { TablaSesionesFecha } from './components/TablaSesionesFecha';
import { useSesionesPorFecha } from './hooks/useSesionesPorFecha';
import { ModalMarcarAsistencia } from '../grupos/components/vista-grupo/ModalMarcarAsistencia';

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function VistaFecha({ fecha, onVolver }) {
  const { grupos, loading, error, recargar } = useSesionesPorFecha(fecha);
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [modalAsistencia, setModalAsistencia] = useState(null);

  // Seleccionar primer grupo por defecto
  React.useEffect(() => {
    if (grupos.length > 0 && !grupoActivo) {
      setGrupoActivo(grupos[0].idGrupo);
    }
  }, [grupos, grupoActivo]);

  const grupoSeleccionado = grupos.find(g => g.idGrupo === grupoActivo);
  
  // Formatear fecha
  const fechaObj = new Date(fecha + 'T00:00:00');
  const fechaFormateada = `${diasSemana[fechaObj.getDay()]}, ${fechaObj.getDate()} de ${meses[fechaObj.getMonth()]} de ${fechaObj.getFullYear()}`;

  // Stats
  const totalClases = grupos.reduce((sum, g) => sum + g.sesiones.length, 0);
  const clasesMarcadas = grupos.reduce((sum, g) => 
    sum + g.sesiones.filter(s => s.ASISTIO !== null && s.ASISTIO !== undefined).length, 0
  );

  const handleMarcarAsistencia = (sesion) => {
    setModalAsistencia({
      sesion,
      grupo: grupoSeleccionado
    });
  };

  const handleAsistenciaGuardada = () => {
    setModalAsistencia(null);
    recargar();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Cargando sesiones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">⚠️ {error}</div>
        <button 
          onClick={recargar}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div>
          <button 
            onClick={onVolver}
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
          >
            ← Volver a fechas
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{fechaFormateada}</h2>
        </div>
        
        {/* Stats */}
        <div className="flex gap-4">
          <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalClases}</div>
            <div className="text-xs text-blue-700">Total clases</div>
          </div>
          <div className="text-center px-4 py-2 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{clasesMarcadas}</div>
            <div className="text-xs text-green-700">Marcadas</div>
          </div>
          <div className="text-center px-4 py-2 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{totalClases - clasesMarcadas}</div>
            <div className="text-xs text-yellow-700">Pendientes</div>
          </div>
        </div>
      </div>

      {/* Grupos Tabs */}
      <GruposTabs 
        grupos={grupos}
        grupoActivo={grupoActivo}
        onSeleccionar={setGrupoActivo}
      />

      {/* Tabla de sesiones del grupo seleccionado */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            {grupoSeleccionado?.nombreGrupo || 'Seleccione un grupo'}
          </h3>
        </div>
        <TablaSesionesFecha 
          sesiones={grupoSeleccionado?.sesiones || []}
          onMarcarAsistencia={handleMarcarAsistencia}
        />
      </div>

      {/* Modal de asistencia */}
      {modalAsistencia && (
        <ModalMarcarAsistencia
          onClose={() => setModalAsistencia(null)}
          sesion={modalAsistencia.sesion}
          onSuccess={handleAsistenciaGuardada}
        />
      )}
    </div>
  );
}
