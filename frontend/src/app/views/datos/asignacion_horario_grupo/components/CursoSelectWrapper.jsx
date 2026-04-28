import React, { useState, useEffect, useCallback } from 'react';
import FunctionSelectInput from '@/shared/components/ui/inputs/FunctionSelectInput';

/**
 * Componente wrapper para evitar el ciclo de auto-limpieza de FunctionSelectInput
 */
const CursoSelectWrapper = React.memo(({ selectedCurso, setSelectedCurso, functionParams, formData }) => {
  const [localValue, setLocalValue] = useState(selectedCurso);

  useEffect(() => {
    setLocalValue(selectedCurso);
  }, [selectedCurso]);

  const handleChange = useCallback((name, value) => {
    console.log('CursoSelectWrapper handleChange called with:', name, value);
    // No propagar limpiezas automáticas (valor vacío)
    if (value === '' && localValue !== '') {
      return;
    }
    setLocalValue(value);
    setSelectedCurso(value);
  }, [setSelectedCurso, localValue]);

  return (
    <FunctionSelectInput
      name="curso_grupo"
      label="Curso del Grupo"
      required={true}
      functionName="fn_grupo_plan_cursos"
      functionParams={functionParams}
      valueField="ID_GRUPO_PLAN_CURSO"
      labelField="{NOMBRE_AREA} - {NOMBRE_CURSO}"
      descriptionField="Docente: {NOMBRE_COMPLETO_DOCENTE} ({IDENTIFICADOR_DOCENTE})"
      searchable={true}
      placeholder="Seleccione un curso"
      value={localValue}
      onChange={handleChange}
      formData={formData}
    />
  );
});

CursoSelectWrapper.displayName = 'CursoSelectWrapper';

export default CursoSelectWrapper;
