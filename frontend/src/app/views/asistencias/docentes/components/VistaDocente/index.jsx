import React, { useState, useCallback } from 'react';
import { usePlazasDocente } from '../../hooks/usePlazasDocente';
import { useSesionesDocente } from '../../hooks/useSesionesDocente';
import { PlazasTabs } from './PlazasTabs';
import { GruposGrid } from './GruposGrid';
import { TablaSesiones } from './TablaSesiones';
import { Header } from './Header';
import { ModalMarcarAsistencia } from '../../../grupos/components/vista-grupo/ModalMarcarAsistencia';

export function VistaDocente({ docente, idPeriodo, idSede, onVolver, idUsuario = 1 }) {
  const { plazas, cursos, loading: loadingPlazas } = usePlazasDocente(idPeriodo, idSede, docente.ID_DOCENTE);
  
  const [plazaActiva, setPlazaActiva] = useState(null);
  const [sesionModal, setSesionModal] = useState(null);

  // Cuando cambian las plazas, seleccionar la primera por defecto
  React.useEffect(() => {
    if (plazas.length > 0 && !plazaActiva) {
      setPlazaActiva(plazas[0].ID_PLAZA_DOCENTE);
    }
  }, [plazas, plazaActiva]);

  const plazaSeleccionada = plazas.find(p => p.ID_PLAZA_DOCENTE === plazaActiva);

  const {
    grupos,
    grupoActivo,
    setGrupoActivo,
    sesionesDelGrupo,
    loading: loadingSesiones,
    refetch
  } = useSesionesDocente(idPeriodo, idSede, docente.ID_DOCENTE, plazaActiva);

  const handleSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleMarcar = useCallback((s) => setSesionModal(s), []);

  return (
    <>
      <ModalMarcarAsistencia
        sesion={sesionModal}
        onClose={() => setSesionModal(null)}
        onSuccess={handleSuccess}
        idUsuario={idUsuario}
      />
      <div>
        <Header docente={docente} onVolver={onVolver} />

        {loadingPlazas ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : plazas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <p className="text-gray-400 font-medium text-sm">Este docente no tiene cursos asignados en esta sede</p>
          </div>
        ) : (
          <div className="space-y-5">
            <PlazasTabs
              plazas={plazas}
              plazaActiva={plazaActiva}
              onChange={setPlazaActiva}
            />

            {loadingSesiones ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            ) : grupos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <p className="text-gray-400 font-medium text-sm">No hay grupos asignados para este curso</p>
              </div>
            ) : grupoActivo ? (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <GruposGrid 
                  grupos={grupos} 
                  grupoActivo={grupoActivo}
                  onChange={setGrupoActivo}
                />
                <TablaSesiones 
                  sesiones={sesionesDelGrupo} 
                  onMarcar={handleMarcar}
                  nombreCurso={plazaSeleccionada?.NOMBRE_CURSO}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
