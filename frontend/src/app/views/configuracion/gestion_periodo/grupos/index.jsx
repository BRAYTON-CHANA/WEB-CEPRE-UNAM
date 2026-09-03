import React, { useState } from 'react';
import { ConfigLayout } from '@/features/layout';
import GruposPanel from '@/features/grupos/views/GruposPanel';
import GruposCursosPanel from '@/features/grupos/views/GruposCursosPanel';
import GruposProgramacionPanel from '@/features/grupos/views/GruposProgramacionPanel';
import GruposBreadcrumb from '@/features/grupos/components/GruposBreadcrumb';

/**
 * Grupos — thin wrapper con 3 tabs.
 * Tab 1: Grupos (lista CRUD)
 * Tab 2: Cursos por Grupo (asignación de plaza docente)
 * Tab 3: Programación (plantilla horaria)
 * El período se comparte entre todos los tabs.
 * Modalidad, sede y grupo se comparten entre tabs 2 y 3.
 */
function GruposConfig() {
  const [view, setView] = useState('grupos');
  const [sharedPeriodo, setSharedPeriodo] = useState('');
  const [sharedModalidad, setSharedModalidad] = useState('');
  const [sharedSede, setSharedSede] = useState('');
  const [sharedGrupo, setSharedGrupo] = useState('');
  const [initialGrupo, setInitialGrupo] = useState(null);

  const handleVerCursos = (grupo) => {
    setInitialGrupo(grupo);
    setSharedGrupo(String(grupo.ID_GRUPO));
    if (grupo.MODALIDAD) setSharedModalidad(grupo.MODALIDAD);
    if (grupo.MODALIDAD === 'PRESENCIAL' && grupo.ID_SEDE) {
      setSharedSede(String(grupo.ID_SEDE));
    }
    setView('cursos');
  };

  const handleVerProgramacion = (grupo) => {
    setInitialGrupo(grupo);
    setSharedGrupo(String(grupo.ID_GRUPO));
    if (grupo.MODALIDAD) setSharedModalidad(grupo.MODALIDAD);
    if (grupo.MODALIDAD === 'PRESENCIAL' && grupo.ID_SEDE) {
      setSharedSede(String(grupo.ID_SEDE));
    }
    setView('programacion');
  };

  const handleNavigate = (target) => {
    if (target === 'grupos') {
      setInitialGrupo(null);
    }
    setView(target);
  };

  return (
    <ConfigLayout>
      <div className="px-8 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <GruposBreadcrumb view={view} onNavigate={handleNavigate} />
      </div>
      {view === 'grupos' && (
        <GruposPanel
          sharedPeriodo={sharedPeriodo}
          onSharedPeriodoChange={setSharedPeriodo}
          onVerCursos={handleVerCursos}
          onVerProgramacion={handleVerProgramacion}
        />
      )}
      {view === 'cursos' && (
        <GruposCursosPanel
          sharedPeriodo={sharedPeriodo}
          onSharedPeriodoChange={setSharedPeriodo}
          sharedModalidad={sharedModalidad}
          onSharedModalidadChange={setSharedModalidad}
          sharedSede={sharedSede}
          onSharedSedeChange={setSharedSede}
          sharedGrupo={sharedGrupo}
          onSharedGrupoChange={setSharedGrupo}
          initialGrupo={initialGrupo}
        />
      )}
      {view === 'programacion' && (
        <GruposProgramacionPanel
          sharedPeriodo={sharedPeriodo}
          onSharedPeriodoChange={setSharedPeriodo}
          sharedModalidad={sharedModalidad}
          onSharedModalidadChange={setSharedModalidad}
          sharedSede={sharedSede}
          onSharedSedeChange={setSharedSede}
          sharedGrupo={sharedGrupo}
          onSharedGrupoChange={setSharedGrupo}
        />
      )}
    </ConfigLayout>
  );
}

export default GruposConfig;
