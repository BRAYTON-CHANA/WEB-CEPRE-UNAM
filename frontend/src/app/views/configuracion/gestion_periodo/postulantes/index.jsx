import React, { useState, useMemo } from 'react';
import { CrudMultiLevelManager } from '@/shared/components/crud';
import { TableMultiLevel } from '@/shared/components/table';
import { ConfigLayout } from '@/features/layout';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import CsvImportModal from '@/features/postulantes/components/CsvImportModal';
import AsignarGrupoModal from '@/features/postulantes/components/AsignarGrupoModal';
import AsignarGruposPanel from '@/features/postulantes/components/AsignarGruposPanel';
import { exportPostulantes } from '@/features/postulantes/utils/exportPostulantes';
import { usePostulantes } from '@/features/postulantes/hooks/usePostulantes';

/**
 * Postulantes — período obligatorio, tabla plana con grupo, modo asignar con tabs y checkboxes.
 */
function PostulantesConfig() {
  const {
    csvModalOpen, setCsvModalOpen, handleImportSuccess,
    selectedPeriodo, handlePeriodoChange,
    records, loading, error,
    tableLevelConfigs, crudLevels,
    asignarModalOpen, asignarTargets, asignando,
    handleOpenAsignar,
    handleCloseAsignar,
    handleAsignarGrupo,
    handleAsignarMasivo
  } = usePostulantes();

  const [modoAsignar, setModoAsignar] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [carreraFilter, setCarreraFilter] = useState('');
  const [sedeExamenFilter, setSedeExamenFilter] = useState('');
  const [sedeCarreraFilter, setSedeCarreraFilter] = useState('');
  const [turnoFilter, setTurnoFilter] = useState('');
  const [gradoFilter, setGradoFilter] = useState('');
  const [edadValue, setEdadValue] = useState('');
  const [edadOp, setEdadOp] = useState('=');

  const uniqueAreas = useMemo(() =>
    [...new Set(records.map((r) => r.NOMBRE_AREA).filter(Boolean))].sort(),
    [records]
  );
  const uniqueCarreras = useMemo(() =>
    [...new Set(records.map((r) => r.NOMBRE_CARRERA).filter(Boolean))].sort(),
    [records]
  );
  const uniqueSedeExamen = useMemo(() =>
    [...new Set(records.map((r) => r.NOMBRE_SEDE_EXAMEN).filter(Boolean))].sort(),
    [records]
  );
  const uniqueSedeCarrera = useMemo(() =>
    [...new Set(records.map((r) => r.NOMBRE_SEDE_VACANTE).filter(Boolean))].sort(),
    [records]
  );
  const uniqueTurnos = useMemo(() =>
    [...new Set(records.map((r) => r.TURNO).filter(Boolean))].sort(),
    [records]
  );
  const uniqueGrados = useMemo(() =>
    [...new Set(records.map((r) => r.GRADO).filter((g) => g !== null && g !== undefined && g !== ''))].sort((a, b) => Number(a) - Number(b)),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return records.filter((row) => {
      const dni = (row.DNI || '').toLowerCase();
      const nombre = (row.NOMBRE_COMPLETO || '').toLowerCase();
      if (term && !dni.includes(term) && !nombre.includes(term)) return false;

      if (areaFilter && row.NOMBRE_AREA !== areaFilter) return false;
      if (carreraFilter && row.NOMBRE_CARRERA !== carreraFilter) return false;
      if (sedeExamenFilter && row.NOMBRE_SEDE_EXAMEN !== sedeExamenFilter) return false;
      if (sedeCarreraFilter && row.NOMBRE_SEDE_VACANTE !== sedeCarreraFilter) return false;
      if (turnoFilter && row.TURNO !== turnoFilter) return false;
      if (gradoFilter && String(row.GRADO) !== String(gradoFilter)) return false;

      if (edadValue !== '') {
        const edad = Number(row.EDAD);
        const val = Number(edadValue);
        if (!Number.isNaN(edad) && !Number.isNaN(val)) {
          if (edadOp === '=' && edad !== val) return false;
          if (edadOp === '>' && !(edad > val)) return false;
          if (edadOp === '<' && !(edad < val)) return false;
          if (edadOp === '>=' && !(edad >= val)) return false;
          if (edadOp === '<=' && !(edad <= val)) return false;
        }
      }

      return true;
    });
  }, [records, searchTerm, areaFilter, carreraFilter, sedeExamenFilter, sedeCarreraFilter, turnoFilter, gradoFilter, edadValue, edadOp]);

  const limpiarFiltros = () => {
    setSearchTerm('');
    setAreaFilter('');
    setCarreraFilter('');
    setSedeExamenFilter('');
    setSedeCarreraFilter('');
    setTurnoFilter('');
    setGradoFilter('');
    setEdadValue('');
    setEdadOp('=');
  };

  const handleAsignar = async (idGrupo, targets) => {
    await handleAsignarMasivo(idGrupo, targets);
    setModoAsignar(false);
  };

  return (
    <ConfigLayout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Postulantes</h1>
          <p className="text-sm text-gray-600 mt-1">
            Seleccione un período para gestionar postulantes y grupos.
          </p>
        </div>

        {/* Selector de período + acciones */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 max-w-md">
              <ReferenceSelectInput
                name="id_periodo"
                label="Período Académico"
                referenceTable="PERIODOS"
                referenceField="ID_PERIODO"
                referenceLabelField="NOMBRE_PERIODO"
                placeholder="Seleccione un período..."
                searchable={true}
                value={selectedPeriodo}
                onChange={handlePeriodoChange}
                formData={{}}
              />
            </div>

            <div className="flex items-center gap-2 pt-0 lg:pt-6">
              {selectedPeriodo && !modoAsignar && (
                <button
                  onClick={() => setCsvModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <span>Importar CSV</span>
                </button>
              )}
              {selectedPeriodo && !modoAsignar && (
                <button
                  onClick={() => exportPostulantes(records, selectedPeriodo)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span>Exportar Excel</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtros - siempre visibles cuando hay periodo */}
        {selectedPeriodo && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 items-end">
              <div className="xl:col-span-2">
                <label htmlFor="postulante_search" className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <input
                  id="postulante_search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="DNI o nombre..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label htmlFor="area_filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Área
                </label>
                <select
                  id="area_filter"
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">Todas</option>
                  {uniqueAreas.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="carrera_filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Carrera
                </label>
                <select
                  id="carrera_filter"
                  value={carreraFilter}
                  onChange={(e) => setCarreraFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">Todas</option>
                  {uniqueCarreras.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sede_examen_filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Sede examen
                </label>
                <select
                  id="sede_examen_filter"
                  value={sedeExamenFilter}
                  onChange={(e) => setSedeExamenFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">Todas</option>
                  {uniqueSedeExamen.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sede_carrera_filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Sede carrera
                </label>
                <select
                  id="sede_carrera_filter"
                  value={sedeCarreraFilter}
                  onChange={(e) => setSedeCarreraFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">Todas</option>
                  {uniqueSedeCarrera.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="turno_filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Turno
                </label>
                <select
                  id="turno_filter"
                  value={turnoFilter}
                  onChange={(e) => setTurnoFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">Todos</option>
                  {uniqueTurnos.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="grado_filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Grado
                </label>
                <select
                  id="grado_filter"
                  value={gradoFilter}
                  onChange={(e) => setGradoFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">Todos</option>
                  {uniqueGrados.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="xl:col-span-2 flex gap-2">
                <div className="w-20">
                  <label htmlFor="edad_op" className="block text-sm font-medium text-gray-700 mb-1">
                    Edad
                  </label>
                  <select
                    id="edad_op"
                    value={edadOp}
                    onChange={(e) => setEdadOp(e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="">=</option>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value=">=">≥</option>
                    <option value="<=">≤</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor="edad_filter" className="block text-sm font-medium text-gray-700 mb-1">
                    &nbsp;
                  </label>
                  <input
                    id="edad_filter"
                    type="number"
                    value={edadValue}
                    onChange={(e) => setEdadValue(e.target.value)}
                    placeholder="Edad"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-4 xl:col-span-8 flex justify-end">
                <button
                  onClick={limpiarFiltros}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Acciones de asignación */}
        {selectedPeriodo && !modoAsignar && !loading && !error && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              {filteredRecords.length} postulante{filteredRecords.length === 1 ? '' : 's'} encontrado{filteredRecords.length === 1 ? '' : 's'}
            </p>
            <button
              onClick={() => setModoAsignar(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Asignar grupos</span>
            </button>
          </div>
        )}

        {/* Modal CSV Import */}
        <CsvImportModal
          isOpen={csvModalOpen}
          onClose={() => setCsvModalOpen(false)}
          onSuccess={handleImportSuccess}
          idPeriodo={selectedPeriodo}
        />

        {/* Modal Asignar Grupo (un postulante) */}
        <AsignarGrupoModal
          isOpen={asignarModalOpen}
          onClose={handleCloseAsignar}
          onAssign={handleAsignarGrupo}
          postulante={asignarTargets[0]}
          count={asignarTargets.length || 0}
          loading={asignando}
        />

        {/* Tabla, panel de asignación o mensaje de selección */}
        {selectedPeriodo ? (
          <div className="space-y-4">
            {loading && !modoAsignar && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                <p className="text-gray-500 text-sm">Cargando postulantes...</p>
              </div>
            )}

            {error && !modoAsignar && (
              <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                <p className="text-red-700 text-sm"><strong>Error:</strong> {error.message || error}</p>
              </div>
            )}

            {!loading && !error && modoAsignar && (
              <AsignarGruposPanel
                records={filteredRecords}
                periodo={selectedPeriodo}
                onCancel={() => setModoAsignar(false)}
                onAssign={handleAsignar}
                loadingAssign={asignando}
              />
            )}

            {!loading && !error && !modoAsignar && (
              <>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                  <CrudMultiLevelManager crudLevels={crudLevels}>
                    {([h]) => {
                      const enrichedLevelConfigs = tableLevelConfigs.map(level => ({
                        ...level,
                        actions: level.actions ? {
                          ...level.actions,
                          edit: level.actions.edit
                            ? { ...level.actions.edit, onClick: (row) => h.handleEdit(row) }
                            : undefined,
                          delete: level.actions.delete
                            ? { ...level.actions.delete, onClick: (row) => h.handleDelete(row) }
                            : undefined
                        } : undefined
                      }));

                      return (
                        <TableMultiLevel
                          data={filteredRecords}
                          levelConfigs={enrichedLevelConfigs}
                          pagination={true}
                          itemsPerPage={100}
                        />
                      );
                    }}
                  </CrudMultiLevelManager>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="mt-3 text-gray-500 font-medium">Seleccione un período</p>
            <p className="mt-1 text-sm text-gray-400">Elija un período académico para ver, filtrar y asignar grupos a los postulantes.</p>
          </div>
        )}
      </div>
    </ConfigLayout>
  );
}

export default PostulantesConfig;
