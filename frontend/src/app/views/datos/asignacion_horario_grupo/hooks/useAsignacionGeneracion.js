import { useCallback } from 'react';
import { parseDateInput, formatFechaSql } from '../utils/dateHelpers';
import { DIA_TO_JS, DIA_NAMES } from '../utils/matrixHelpers';

export const useAsignacionGeneracion = (
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
) => {
  const handleGenerar = useCallback((e) => {
    e.preventDefault();
    setValidationError('');

    try {
      // Validaciones
      if (!fechaInicio || !fechaFin) {
        setValidationError('Debe seleccionar fecha de inicio y fecha de fin.');
        return;
      }
      const fInicio = parseDateInput(fechaInicio);
      const fFin = parseDateInput(fechaFin);
      if (!fInicio || !fFin || fInicio > fFin) {
        setValidationError('El rango de fechas es inválido.');
        return;
      }
      if (!hasAtLeastOneDia) {
        setValidationError('Al menos una celda de la matriz debe tener un día seleccionado.');
        return;
      }
      const columnasConCurso = new Set(
        Object.keys(cursoAsignaciones).map(k => k.split('-')[0])
      );
      if (columnasConCurso.size === 0) {
        setValidationError('Al menos una columna debe tener un curso asignado.');
        return;
      }

      // Recorrido cursor lineal
      const asignaciones = [];
      let cursor = new Date(fInicio.getTime());
      let hayPrimera = false;
      let warning = null;
      const MAX_ITER = 500;
      const MAX_ASIGNACIONES = 2000;
      let capAlcanzado = false;

      // Mapa ORDEN -> ID_BLOQUE (solo bloques de clase)
      let ordenActual = 0;
      const ordenToIdBloque = {};
      for (let i = 0; i < customBlocks.length; i++) {
        if (customBlocks[i].type !== 'break') {
          ordenActual++;
          ordenToIdBloque[ordenActual] = customBlocks[i].idBloque;
        }
      }

      const computar = () => {
        for (let iter = 0; iter < MAX_ITER; iter++) {
          let avanzoEnVuelta = false;
          for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
              const dia = matrix[r][c]?.dia;
              if (!dia) continue;
              const diaJS = DIA_TO_JS[dia];
              if (diaJS === undefined) continue;
              const letra = String.fromCharCode(65 + c);

              const cursorAntes = formatFechaSql(cursor);
              const fecha = new Date(cursor.getTime());
              let safety = 0;
              while (fecha.getDay() !== diaJS && safety++ < 8) {
                fecha.setDate(fecha.getDate() + 1);
              }

              if (fecha > fFin) {
                if (!hayPrimera) {
                  warning = 'Rango de fechas demasiado corto, no se generó ninguna asignación.';
                }
                return;
              }

              hayPrimera = true;
              avanzoEnVuelta = true;

              // Iterar sobre todos los bloques (manteniendo índices originales)
              let ordenClase = 0;
              for (let idx = 0; idx < customBlocks.length; idx++) {
                const block = customBlocks[idx];
                
                // Saltar bloques break
                if (block.type === 'break') continue;
                
                ordenClase++;
                const key = `${letra}-${idx}`;
                const curso = cursoAsignaciones[key];
                if (!curso) continue;
                if (asignaciones.length >= MAX_ASIGNACIONES) {
                  capAlcanzado = true;
                  return;
                }
                asignaciones.push({
                  ID_GRUPO_PLAN_CURSO: curso.id,
                  ORDEN: ordenClase,
                  ID_HORARIO_BLOQUE: ordenToIdBloque[ordenClase],
                  FECHA: formatFechaSql(fecha),
                  _diaSemana: dia,
                  _columna: letra,
                  _bloqueLabel: block.label,
                  _duracion: block.duration || 0,
                  _nombreCurso: curso.nombreCurso,
                  _codigoCompartido: curso.codigoCompartido,
                  _nombreDocente: curso.nombreDocente
                });
              }

              cursor = new Date(fecha.getTime());
              cursor.setDate(cursor.getDate() + 1);
            }
          }
          if (!avanzoEnVuelta) return;
        }
      };

      computar();
      if (capAlcanzado) {
        warning = `Se alcanzó el límite de ${MAX_ASIGNACIONES} asignaciones. Reduce el rango de fechas o ajusta la matriz.`;
      }

      setResumenAsignaciones(asignaciones);
      setResumenWarning(warning);
      setShowResumen(true);
    } catch (err) {
      setValidationError('Error al generar: ' + err.message);
    }
  }, [
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
  ]);

  return { handleGenerar };
};
