import { useCallback } from 'react';
import { getRandomColor } from '@/features/schedule/hooks/useCalendar';

export const useCourseAssignment = (cursoOptions, setCursoAsignaciones) => {
  const handleAsignar = useCallback((selectedCurso, selectedColumna, selectedBloque) => {
    if (!selectedCurso || !selectedColumna || !selectedBloque) return;
    const key = `${selectedColumna}-${selectedBloque}`;
    const cursoSeleccionado = cursoOptions.find(opt => String(opt.value) === String(selectedCurso));
    if (!cursoSeleccionado) return;
    
    setCursoAsignaciones(prev => ({
      ...prev,
      [key]: {
        id: selectedCurso,
        codigoCompartido: cursoSeleccionado.raw?.CODIGO_COMPARTIDO || '',
        nombreCurso: cursoSeleccionado.raw?.NOMBRE_CURSO || '',
        nombreDocente: cursoSeleccionado.raw?.NOMBRE_COMPLETO_DOCENTE || '',
        color: getRandomColor()
      }
    }));
  }, [cursoOptions, setCursoAsignaciones]);

  const handleEliminar = useCallback((selectedColumna, selectedBloque) => {
    if (!selectedColumna || !selectedBloque) return;
    const key = `${selectedColumna}-${selectedBloque}`;
    setCursoAsignaciones(prev => {
      const nuevo = { ...prev };
      delete nuevo[key];
      return nuevo;
    });
  }, [setCursoAsignaciones]);

  const handleLimpiarTodo = useCallback(() => {
    setCursoAsignaciones({});
  }, [setCursoAsignaciones]);

  return {
    handleAsignar,
    handleEliminar,
    handleLimpiarTodo
  };
};
