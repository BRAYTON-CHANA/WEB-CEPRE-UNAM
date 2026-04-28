import React from 'react';
import FunctionSelectInput from '@/shared/components/ui/inputs/FunctionSelectInput';

const CourseAssignment = ({
  idGrupo,
  formData,
  selectedCurso,
  setSelectedCurso,
  selectionMode,
  setSelectionMode,
  deleteMode,
  setDeleteMode,
  selectedBlocks,
  setSelectedBlocks,
  handleBulkAssign,
  handleLimpiarTodo
}) => {
  const handleStartSelection = () => {
    setSelectionMode(true);
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedCurso('');
    setSelectedBlocks(new Set());
  };

  const handleStartDelete = () => {
    setDeleteMode(true);
  };

  const handleCancelDelete = () => {
    setDeleteMode(false);
  };
  return (
    <div className="relative overflow-visible rounded-xl bg-gradient-to-br from-slate-50 to-[#57C7C2]/10 border border-slate-200/60 shadow-sm mb-6">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2D366F] via-[#57C7C2] to-[#2D366F]"></div>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2D366F] to-[#57C7C2] flex items-center justify-center shadow-lg shadow-[#2D366F]/20">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800 tracking-tight">Asignar curso a bloque</h4>
            <p className="text-xs text-slate-500 font-medium">Selecciona un curso y asígnalo a los bloques seleccionados en el preview</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          {/* Dropdown Curso */}
          {idGrupo && (
            <div className="group">
              <label className="block text-xs font-semibold text-slate-700 mb-2 tracking-wide uppercase">Curso</label>
              <FunctionSelectInput
                name="curso_grupo"
                label=""
                required={false}
                functionName="fn_grupo_plan_cursos"
                functionParams={{ ID_GRUPO: idGrupo }}
                valueField="ID_GRUPO_PLAN_CURSO"
                labelField="{NOMBRE_AREA} - {NOMBRE_CURSO}"
                descriptionField="Docente: {NOMBRE_COMPLETO_DOCENTE} ({IDENTIFICADOR_DOCENTE})"
                searchable={true}
                placeholder="Seleccionar curso"
                value={selectedCurso}
                onChange={(_, value) => setSelectedCurso(value)}
                formData={formData}
                hideLabel={true}
              />
            </div>
          )}
        </div>
        
        {/* Botones de acción */}
        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-200/60">
          {selectionMode ? (
            <>
              <button
                type="button"
                onClick={handleBulkAssign}
                disabled={!selectedCurso || selectedBlocks.size === 0}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#2D366F] to-[#57C7C2] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#3a4289] hover:to-[#6dd9d4] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#2D366F]/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirmar ({selectedBlocks.size})
              </button>
              <button
                type="button"
                onClick={handleCancelSelection}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-sm"
              >
                Cancelar
              </button>
            </>
          ) : deleteMode ? (
            <>
              <span className="text-sm text-slate-600">Haz clic en X para eliminar cursos</span>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-sm ml-auto"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartSelection}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#2D366F] to-[#57C7C2] text-white hover:from-[#3a4289] hover:to-[#6dd9d4] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#2D366F]/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Añadir
              </button>
              <button
                type="button"
                onClick={handleStartDelete}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </button>
              <button
                type="button"
                onClick={handleLimpiarTodo}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-sm ml-auto"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Limpiar todo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseAssignment;
