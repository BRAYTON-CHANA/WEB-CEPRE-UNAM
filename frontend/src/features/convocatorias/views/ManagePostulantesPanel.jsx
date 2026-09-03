import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DatabaseTableEditable } from '@/shared/components/table';
import { useManagePostulantes } from '@/features/convocatorias/hooks/useManagePostulantes';
import { usePostulantesFilters } from '@/features/convocatorias/hooks/usePostulantesFilters';
import { getPostulantesTableHeaders, getPostulantesTableActions } from '@/features/convocatorias/config/postulantesTableConfig.jsx';
import FilterSelect from '@/shared/components/ui/inputs/FilterSelect';
import PostulantesHeader from '@/features/convocatorias/components/PostulantesHeader';
import PostulacionWizardModal from '@/features/convocatorias/components/PostulacionWizardModal';
import AdjuntosModal from '@/features/convocatorias/components/AdjuntosModal';
import Toast from '@/shared/components/ui/Toast';
import { db } from '@/shared/api';

function ManagePostulantesPanel({ initialFilters }) {
  const {
    convocatorias,
    sedes,
    cursos,
    selectedIdConvocatoria,
    selectedIdSede,
    selectedIdConvocatoriaCurso,
    selectedCursoRow,
    loadingFilters,
    activeFiltersCount,
    handleConvocatoriaChange,
    handleSedeChange,
    handleCursoChange,
    clearConvocatoria,
    clearSede,
    clearCurso,
    refreshConvocatorias,
    refreshSedes,
    refreshCursos,
  } = usePostulantesFilters(initialFilters);

  const convocatoriaLabel = useMemo(() => {
    const c = convocatorias.find(c => String(c.ID_CONVOCATORIA) === String(selectedIdConvocatoria));
    if (!c) return '';
    return `${c.NOMBRE_PERIODO}${c.DESCRIPCION ? ` · ${c.DESCRIPCION}` : ''}`;
  }, [convocatorias, selectedIdConvocatoria]);

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // Debounce de búsqueda: solo actualiza searchTerm 300ms después del último keystroke
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const {
    postulaciones, loading,
    isModalOpen, creating, formError,
    initialValues,
    handleOpenCreate, handleCloseModal, handleSubmit,
    refresh,
    handleSaveSuccess, handleSaveError,
    handleDeletePostulacion,
    adjuntosModal, handleViewAdjuntos, handleSaveAdjuntos, closeAdjuntosModal,
  } = useManagePostulantes({
    idConvocatoriaCurso: selectedIdConvocatoriaCurso || null,
    idConvocatoria: selectedIdConvocatoria || null,
    idSede: selectedIdSede || null,
    convocatoriaCursos: selectedIdSede ? cursos : [],
    convocatoriaLabel,
    searchTerm
  });

  // Cargar convocatoria_cursos cuando se abre el modal sin sede seleccionada
  const [allConvocatoriaCursos, setAllConvocatoriaCursos] = useState([]);
  useEffect(() => {
    if (!isModalOpen || !selectedIdConvocatoria || selectedIdSede) {
      setAllConvocatoriaCursos([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await db.select('VW_CONVOCATORIAS_CURSO', { ID_CONVOCATORIA: selectedIdConvocatoria });
        if (active) {
          setAllConvocatoriaCursos([...(data || [])].sort((a, b) =>
            String(a.NOMBRE_SEDE || '').localeCompare(String(b.NOMBRE_SEDE || ''), 'es', { sensitivity: 'base' }) ||
            String(a.NOMBRE_CURSO || '').localeCompare(String(b.NOMBRE_CURSO || ''), 'es', { sensitivity: 'base' })
          ));
        }
      } catch (err) {
        console.error('Error cargando convocatoria_cursos:', err);
        if (active) setAllConvocatoriaCursos([]);
      }
    })();
    return () => { active = false; };
  }, [isModalOpen, selectedIdConvocatoria, selectedIdSede]);

  const convocatoriaCursosForForm = selectedIdSede ? cursos : allConvocatoriaCursos;

  const tableActions = useMemo(
    () => getPostulantesTableActions(handleViewAdjuntos, handleDeletePostulacion),
    [handleViewAdjuntos, handleDeletePostulacion]
  );

  // Memoizar headers para evitar re-creación de arrays/objetos en cada render
  // Esto previene que EditableCell y ReferenceSelectInput re-disparen consultas
  const tableHeaders = useMemo(() => getPostulantesTableHeaders(), []);

  // Handler de éxito del wizard: refrescar postulaciones + mostrar toast
  const handleWizardSuccess = useCallback((result) => {
    refresh();
    const count = result?.count ?? 0;
    setToast({
      type: 'success',
      title: count > 0 ? 'Postulación creada' : 'Sin postulaciones nuevas',
      description: count > 0
        ? `${count} postulación${count > 1 ? 'es' : ''} registrada${count > 1 ? 's' : ''} correctamente.`
        : 'No se registraron postulaciones nuevas (ya estaban postuladas).'
    });
  }, [refresh]);

  const handleCloseToast = useCallback(() => setToast(null), []);

  return (
    <div className="px-8 py-8 space-y-6 pb-12">
      {/* Barra de filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#25346A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Filtros</h3>
          </div>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#25346A]/10 text-[#25346A] text-xs font-medium rounded-full">
              <span className="w-1.5 h-1.5 bg-[#25346A] rounded-full" />
              {activeFiltersCount + (searchTerm ? 1 : 0)} filtro{(activeFiltersCount + (searchTerm ? 1 : 0)) > 1 ? 's' : ''} activo{(activeFiltersCount + (searchTerm ? 1 : 0)) > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-end gap-4 flex-wrap">
          <FilterSelect
            label="Convocatoria"
            required
            value={selectedIdConvocatoria}
            onChange={handleConvocatoriaChange}
            onClear={clearConvocatoria}
            onRefresh={refreshConvocatorias}
            loading={loadingFilters}
            placeholder="Seleccionar convocatoria..."
            refreshTitle="Actualizar convocatorias"
            options={convocatorias.map(c => ({
              value: c.ID_CONVOCATORIA,
              label: `${c.NOMBRE_PERIODO}${c.DESCRIPCION ? ` · ${c.DESCRIPCION}` : ''}`
            }))}
          />
          <FilterSelect
            label="Sede (opcional)"
            value={selectedIdSede}
            onChange={handleSedeChange}
            onClear={clearSede}
            onRefresh={refreshSedes}
            disabled={!selectedIdConvocatoria || loadingFilters}
            loading={loadingFilters}
            placeholder="Todas las sedes"
            refreshTitle="Actualizar sedes"
            minWidth="min-w-[200px]"
            options={sedes.map(s => ({
              value: s.ID_SEDE,
              label: `${s.NOMBRE_SEDE} (${s.CODIGO_SEDE})`
            }))}
          />
          <FilterSelect
            label="Curso (opcional)"
            value={selectedIdConvocatoriaCurso}
            onChange={handleCursoChange}
            onClear={clearCurso}
            onRefresh={refreshCursos}
            disabled={!selectedIdSede || loadingFilters}
            loading={loadingFilters}
            placeholder="Todos los cursos"
            refreshTitle="Actualizar cursos"
            minWidth="min-w-[240px]"
            options={cursos.map(c => ({
              value: c.ID_CONVOCATORIA_CURSO,
              label: `${c.NOMBRE_CURSO} (${c.CODIGO_CURSO})`
            }))}
          />

          {/* Búsqueda por DNI, nombre o RUC — filtrado client-side */}
          <div className="flex flex-col gap-1.5 min-w-[240px] flex-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Buscar docente</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={!selectedIdConvocatoria}
                placeholder="DNI, nombre o RUC..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#25346A]/30 focus:border-[#25346A] disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  title="Limpiar búsqueda"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <PostulantesHeader
          selectedCursoRow={selectedCursoRow}
          selectedIdSede={selectedIdSede}
          selectedIdConvocatoria={selectedIdConvocatoria}
          sedes={sedes}
          convocatorias={convocatorias}
          onAddPostulacion={handleOpenCreate}
        />

        {formError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-700">
            {formError}
          </div>
        )}
      </div>

      {/* Tabla */}
      {selectedIdConvocatoria && (
        <DatabaseTableEditable
          data={postulaciones}
          headers={tableHeaders}
          actions={tableActions}
          primaryKey="ID_POSTULACION"
          externalLoading={loading}
          saveMode="auto"
          onSaveSuccess={handleSaveSuccess}
          onSaveError={handleSaveError}
          tableProps={{ emptyMessage: 'No hay postulaciones para los filtros seleccionados' }}
        />
      )}

      {!selectedIdConvocatoria && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-400 text-sm">
            Seleccione una convocatoria para ver las postulaciones.
          </p>
        </div>
      )}

      {/* Modales */}
      <PostulacionWizardModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        idConvocatoriaCursoInicial={selectedIdConvocatoriaCurso || null}
        convocatoriaCursos={convocatoriaCursosForForm}
        convocatoriaLabel={convocatoriaLabel}
        onSuccess={handleWizardSuccess}
      />

      <AdjuntosModal
        adjuntosModal={adjuntosModal}
        onSave={handleSaveAdjuntos}
        onClose={closeAdjuntosModal}
      />

      {/* Toast de feedback tras finalizar el wizard */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          description={toast.description}
          onClose={handleCloseToast}
          position="top-right"
          duration={3500}
          backgroundColor="#2E3A68"
        />
      )}
    </div>
  );
}

export default ManagePostulantesPanel;
