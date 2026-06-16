import React, { useState } from 'react';
import { GruposTabs } from './components/GruposTabs';
import { TablaSesionesFecha } from './components/TablaSesionesFecha';
import { useSesionesPorFecha } from './hooks/useSesionesPorFecha';
import { ModalMarcarAsistencia } from '../grupos/components/vista-grupo/ModalMarcarAsistencia';
import { ModalAsistenciaEstudiantes, ModalAsistenciaCompacta } from '../shared/components';

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function VistaFecha({ fecha, idSede, onVolver }) {
  const { grupos, loading, error, recargar } = useSesionesPorFecha(fecha, idSede);
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [modalAsistencia, setModalAsistencia] = useState(null);
  const [sesionEstudiantes, setSesionEstudiantes] = useState(null);
  const [modalCompacto, setModalCompacto] = useState(null);

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

  const handleMarcarEstudiantes = (sesion) => {
    setSesionEstudiantes(sesion);
  };

  const handleMarcarCompacto = () => {
    setModalCompacto(grupoSeleccionado);
  };

  const handleCompactoGuardado = () => {
    setModalCompacto(null);
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
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {grupoSeleccionado?.nombreGrupo || 'Seleccione un grupo'}
          </h3>
          {grupoSeleccionado && (
            <button
              onClick={handleMarcarCompacto}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100 hover:border-purple-200 transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                <line x1="8" y1="11" x2="16" y2="11"/>
              </svg>
              Marcar asistencia compacto
            </button>
          )}
        </div>
        <TablaSesionesFecha 
          sesiones={grupoSeleccionado?.sesiones || []}
          onMarcarAsistencia={handleMarcarAsistencia}
          onMarcarEstudiantes={handleMarcarEstudiantes}
        />
      </div>

      {/* Modal asistencia docente */}
      {modalAsistencia && (
        <ModalMarcarAsistencia
          onClose={() => setModalAsistencia(null)}
          sesion={modalAsistencia.sesion}
          onSuccess={handleAsistenciaGuardada}
        />
      )}

      {/* Modal asistencia estudiantes */}
      <ModalAsistenciaEstudiantes
        sesion={sesionEstudiantes}
        onClose={() => setSesionEstudiantes(null)}
        onSuccess={recargar}
      />

      {/* Modal asistencia compacta */}
      <ModalAsistenciaCompacta
        fecha={fecha}
        grupo={modalCompacto}
        onClose={() => setModalCompacto(null)}
        onSuccess={handleCompactoGuardado}
      />
    </div>
  );
}
