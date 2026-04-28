import React, { useState, useMemo } from 'react';
import { useFunctionData } from '@/shared/hooks/useFunctionData';
import { useCalendar } from '@/features/schedule/hooks/useCalendar';
import { getRandomColor } from '@/features/schedule/hooks/useCalendar';
import FechaInputs from './FechaInputs';
import MatrixControls from './MatrixControls';
import CourseAssignment from './CourseAssignment';
import BlockPreview from './BlockPreview';
import ResumenGeneracionModal from './ResumenGeneracionModal';
import { useMatrixOperations } from '../hooks/useMatrixOperations';
import { useCourseAssignment } from '../hooks/useCourseAssignment';
import { useAsignacionGeneracion } from '../hooks/useAsignacionGeneracion';

/**
 * Formulario matriz de días de la semana + plantilla de bloques por columna.
 *
 * Props:
 *  - customBlocks: Array<{ duration, type, label }> bloques del HORARIO actual.
 *  - selectedGrupoNombre: string para mostrar contexto.
 *  - onCancel: () => void
 *  - onSubmit: (payload) => void  (placeholder, sin lógica real por ahora)
 */
const MatrizHorarioForm = ({ customBlocks, selectedGrupoNombre, idGrupo, idHorario, formData, calendarStartHour = 7, onCancel, onSubmit }) => {
  // Usar hook useCalendar para generar bloques con timeRange correcto
  const { generateCustomBlocks } = useCalendar();

  // Matriz inicial: 1 fila × 1 columna vacía
  const [matrix, setMatrix] = useState([[{ dia: '' }]]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [selectedCurso, setSelectedCurso] = useState('');
  const [selectedColumna, setSelectedColumna] = useState('');
  const [selectedBloque, setSelectedBloque] = useState('');
  const [cursoAsignaciones, setCursoAsignaciones] = useState({});

  // Estados para resumen / advertencias de generación
  const [resumenAsignaciones, setResumenAsignaciones] = useState([]);
  const [resumenWarning, setResumenWarning] = useState(null);
  const [showResumen, setShowResumen] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Estados para modo selección
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState(new Set());
  const [deleteMode, setDeleteMode] = useState(false);

  // Obtener options de cursos para obtener el label
  const cursoOptionsConfig = useMemo(() => ({
    functionName: 'fn_grupo_plan_cursos',
    functionParams: { ID_GRUPO: idGrupo },
    valueField: 'ID_GRUPO_PLAN_CURSO',
    labelField: '{NOMBRE_AREA} - {NOMBRE_CURSO}',
    descriptionField: 'Docente: {NOMBRE_COMPLETO_DOCENTE} ({IDENTIFICADOR_DOCENTE})',
    shouldLoadData: !!idGrupo,
    formData
  }), [idGrupo, formData]);

  const { options: cursoOptions } = useFunctionData(cursoOptionsConfig);

  const numRows = matrix.length;
  const numCols = matrix[0]?.length || 0;

  // Hooks personalizados
  const { addCol, removeCol, addRow, removeRow, setCellDia } = useMatrixOperations(
    matrix,
    setMatrix,
    numCols,
    setCursoAsignaciones
  );

  const { handleAsignar, handleEliminar, handleLimpiarTodo } = useCourseAssignment(
    cursoOptions,
    setCursoAsignaciones
  );

  // Filtrar bloques solo tipo clase
  const claseBlocks = useMemo(() => {
    return customBlocks ? customBlocks.filter(block => block.type !== 'break') : [];
  }, [customBlocks]);

  // Usar generateCustomBlocks para calcular timeRange correcto
  const customBlocksWithTime = useMemo(() => {
    if (!customBlocks || customBlocks.length === 0) return [];
    const { blocks } = generateCustomBlocks(customBlocks, calendarStartHour, null);
    return blocks;
  }, [customBlocks, calendarStartHour, generateCustomBlocks]);

  const hasAtLeastOneDia = useMemo(
    () => matrix.some(row => row.some(cell => cell.dia)),
    [matrix]
  );

  // Hook de generación de asignaciones
  const { handleGenerar } = useAsignacionGeneracion(
    fechaInicio,
    fechaFin,
    matrix,
    cursoAsignaciones,
    hasAtLeastOneDia,
    customBlocks,
    setResumenAsignaciones,
    setResumenWarning,
    setShowResumen,
    setValidationError
  );

  // Toggle selección de bloque
  const toggleBlockSelection = (columna, bloque) => {
    const key = `${columna}-${bloque}`;
    setSelectedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Eliminar bloque específico
  const deleteBlock = (columna, bloque) => {
    const key = `${columna}-${bloque}`;
    setCursoAsignaciones(prev => {
      const nuevo = { ...prev };
      delete nuevo[key];
      return nuevo;
    });
  };

  // Asignar curso a bloques seleccionados
  const handleBulkAssign = () => {
    if (!selectedCurso || selectedBlocks.size === 0) return;
    
    const cursoSeleccionado = cursoOptions.find(opt => String(opt.value) === String(selectedCurso));
    if (!cursoSeleccionado) return;

    setCursoAsignaciones(prev => {
      const nuevo = { ...prev };
      selectedBlocks.forEach(key => {
        nuevo[key] = {
          id: selectedCurso,
          codigoCompartido: cursoSeleccionado.raw?.CODIGO_COMPARTIDO || '',
          nombreCurso: cursoSeleccionado.raw?.NOMBRE_CURSO || '',
          nombreDocente: cursoSeleccionado.raw?.NOMBRE_COMPLETO_DOCENTE || '',
          color: getRandomColor()
        };
      });
      return nuevo;
    });

    // Resetear modo selección
    setSelectionMode(false);
    setSelectedBlocks(new Set());
  };

  // Callback para cuando se completan las asignaciones desde el modal
  const handleAssignComplete = (results) => {
    // Recargar horario después de asignar
    if (onSubmit) {
      onSubmit({ asignaciones: resumenAsignaciones });
    }
  };

  return (
    <form onSubmit={handleGenerar} className="space-y-6">
      {/* Contexto */}
      {selectedGrupoNombre && (
        <div className="text-sm text-gray-600">
          Grupo: <span className="font-semibold text-gray-800">{selectedGrupoNombre}</span>
        </div>
      )}

      {/* Fechas */}
      <FechaInputs
        fechaInicio={fechaInicio}
        setFechaInicio={setFechaInicio}
        fechaFin={fechaFin}
        setFechaFin={setFechaFin}
      />

      {/* Matriz de días */}
      <MatrixControls
        matrix={matrix}
        numRows={numRows}
        numCols={numCols}
        addCol={addCol}
        removeCol={removeCol}
        addRow={addRow}
        removeRow={removeRow}
        setCellDia={setCellDia}
        hasAtLeastOneDia={hasAtLeastOneDia}
      />

      {/* Asignación de cursos a bloques */}
      <CourseAssignment
        idGrupo={idGrupo}
        formData={formData}
        selectedCurso={selectedCurso}
        setSelectedCurso={setSelectedCurso}
        selectionMode={selectionMode}
        setSelectionMode={setSelectionMode}
        deleteMode={deleteMode}
        setDeleteMode={setDeleteMode}
        selectedBlocks={selectedBlocks}
        setSelectedBlocks={setSelectedBlocks}
        handleBulkAssign={handleBulkAssign}
        handleLimpiarTodo={handleLimpiarTodo}
      />

      {/* Preview plantilla bloques por columna */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Plantilla de bloques por columna
        </h3>
        <BlockPreview
          customBlocksWithTime={customBlocksWithTime}
          numCols={numCols}
          cursoAsignaciones={cursoAsignaciones}
          selectionMode={selectionMode}
          deleteMode={deleteMode}
          selectedBlocks={selectedBlocks}
          onToggleSelection={toggleBlockSelection}
          onDeleteBlock={deleteBlock}
        />
      </div>

      {/* Mensaje de error de validacion */}
      {validationError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200">
          <svg className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-semibold text-rose-700">{validationError}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold rounded-lg border-2 border-[#57C7C2] text-[#2D366F] hover:bg-[#57C7C2]/10 transition-colors font-serif"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!hasAtLeastOneDia}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#2D366F] to-[#57C7C2] text-white hover:from-[#3a4289] hover:to-[#6dd9d4] disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#2D366F]/20 transition-all font-serif flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generar
        </button>
      </div>

      {/* Modal de resumen de generación */}
      <ResumenGeneracionModal
        isOpen={showResumen}
        onClose={() => setShowResumen(false)}
        asignaciones={resumenAsignaciones}
        warning={resumenWarning}
        onAssign={handleAssignComplete}
      />
    </form>
  );
};

export default MatrizHorarioForm;
