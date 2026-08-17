import React, { useState } from 'react';
import { ConfigLayout } from '@/features/layout';
import ConvocatoriasPanel from '@/features/convocatorias/views/ConvocatoriasPanel';
import ManageConvocatoriaPanel from '@/features/convocatorias/views/ManageConvocatoriaPanel';
import ManagePostulantesPanel from '@/features/convocatorias/views/ManagePostulantesPanel';
import ConvocatoriaBreadcrumb from '@/features/convocatorias/components/ConvocatoriaBreadcrumb';

/**
 * Convocatorias — thin wrapper.
 * 3 páginas con navegación por breadcrumb:
 *   1. Convocatorias (lista plana)
 *   2. Plazas (filtro periodo → convocatoria, sedes → cursos → plazas)
 *   3. Postulantes (con filtros propios en cascada)
 */
function ConvocatoriasConfig() {
  const [view, setView] = useState('convocatorias');
  // ID de convocatoria pre-seleccionada para p2 (al click "Manejar" en p1)
  const [plazasInitialConvocatoriaId, setPlazasInitialConvocatoriaId] = useState(null);
  // Filtros pre-seleccionados para página 3 (cuando se navega desde p2)
  const [postulantesFilters, setPostulantesFilters] = useState(null);

  const handleNavigate = (target) => {
    setView(target);
  };

  const handleManage = (convocatoria) => {
    setPlazasInitialConvocatoriaId(convocatoria?.ID_CONVOCATORIA || null);
    setView('manage');
  };

  // Desde p2 → p3 con filtros pre-seleccionados
  const handleViewPostulantes = (convocatoriaCursoRow) => {
    setPostulantesFilters({
      idConvocatoria: convocatoriaCursoRow?.ID_CONVOCATORIA,
      idSede: convocatoriaCursoRow?.ID_SEDE,
      idConvocatoriaCurso: convocatoriaCursoRow?.ID_CONVOCATORIA_CURSO
    });
    setView('postulantes');
  };

  return (
    <ConfigLayout>
      <div className="px-8 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <ConvocatoriaBreadcrumb
          view={view}
          onNavigate={handleNavigate}
        />
      </div>
      {view === 'convocatorias' && (
        <ConvocatoriasPanel onManage={handleManage} />
      )}
      {view === 'manage' && (
        <ManageConvocatoriaPanel
          initialConvocatoriaId={plazasInitialConvocatoriaId}
          onViewPostulantes={handleViewPostulantes}
        />
      )}
      {view === 'postulantes' && (
        <ManagePostulantesPanel initialFilters={postulantesFilters} />
      )}
    </ConfigLayout>
  );
}

export default ConvocatoriasConfig;
