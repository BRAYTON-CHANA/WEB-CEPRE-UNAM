import React, { useState, useCallback } from 'react';
import { useSesionesGrupo } from '../../hooks/useSesionesGrupo';
import { Header } from './Header';
import { CursoTabs } from './CursoTabs';
import { StatsBar } from './StatsBar';
import { TablaSesiones } from './TablaSesiones';
import { ModalMarcarAsistencia } from './ModalMarcarAsistencia';

export function VistaGrupo({ grupo, onVolver, idUsuario = 1 }) {
  const {
    cursos,
    cursoActivo,
    setCursoActivo,
    sesionesDelCurso,
    loading,
    error,
    refetch
  } = useSesionesGrupo(grupo.ID_GRUPO);

  const [sesionModal, setSesionModal] = useState(null);
  const handleMarcar = useCallback((s) => setSesionModal(s), []);
  const handleSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <>
      <ModalMarcarAsistencia
        sesion={sesionModal}
        onClose={() => setSesionModal(null)}
        onSuccess={handleSuccess}
        idUsuario={idUsuario}
      />
      <div>
        <Header grupo={grupo} onVolver={onVolver} />

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{grupo.NOMBRE_GRUPO}</h2>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        ) : cursos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
              </svg>
            </div>
            <p className="text-gray-400 font-medium text-sm">Este grupo no tiene sesiones registradas</p>
          </div>
        ) : (
          <div className="space-y-5">
            <CursoTabs
              cursos={cursos}
              cursoActivo={cursoActivo}
              onChange={setCursoActivo}
            />

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <StatsBar sesiones={sesionesDelCurso} />
              <TablaSesiones sesiones={sesionesDelCurso} onMarcar={handleMarcar} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
