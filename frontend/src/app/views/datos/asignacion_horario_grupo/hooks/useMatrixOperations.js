import { useCallback } from 'react';

export const useMatrixOperations = (matrix, setMatrix, numCols, setCursoAsignaciones) => {
  const addCol = useCallback(() => {
    setMatrix(prev => prev.map(row => [...row, { dia: '' }]));
  }, [setMatrix]);

  const removeCol = useCallback(() => {
    setMatrix(prev => {
      if (prev[0].length <= 1) return prev;
      const newMatrix = prev.map(row => row.slice(0, -1));
      return newMatrix;
    });

    // Limpiar cursos asignados de la columna eliminada
    setCursoAsignaciones(prev => {
      const letraEliminada = String.fromCharCode(65 + numCols - 1);
      const nuevo = { ...prev };
      Object.keys(nuevo).forEach(key => {
        if (key.startsWith(`${letraEliminada}-`)) {
          delete nuevo[key];
        }
      });
      return nuevo;
    });
  }, [setMatrix, numCols, setCursoAsignaciones]);

  const addRow = useCallback(() => {
    setMatrix(prev => {
      const cols = prev[0]?.length || 1;
      const newRow = Array.from({ length: cols }, () => ({ dia: '' }));
      return [...prev, newRow];
    });
  }, [setMatrix]);

  const removeRow = useCallback(() => {
    setMatrix(prev => (prev.length <= 1 ? prev : prev.slice(0, -1)));
  }, [setMatrix]);

  const setCellDia = useCallback((rowIdx, colIdx, value) => {
    setMatrix(prev => prev.map((row, ri) =>
      ri !== rowIdx
        ? row
        : row.map((cell, ci) => (ci !== colIdx ? cell : { ...cell, dia: value }))
    ));
  }, [setMatrix]);

  return {
    addCol,
    removeCol,
    addRow,
    removeRow,
    setCellDia
  };
};
