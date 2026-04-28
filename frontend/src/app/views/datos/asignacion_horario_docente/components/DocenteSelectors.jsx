import React, { useMemo } from 'react';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import FunctionSelectInput from '@/shared/components/ui/inputs/FunctionSelectInput';

/**
 * Cascada 4 selectores: Periodo → Sede → Turno → Docente.
 * Cada nivel filtra según grupos donde hay docentes asignados.
 *
 * Props:
 *  - values: { ID_PERIODO, ID_SEDE, ID_TURNO, ID_DOCENTE_PERIODO }
 *  - onChange: (name, value) => void
 */
const DocenteSelectors = React.memo(({ values, onChange }) => {
  const sedeDisabled = !values.ID_PERIODO;
  const turnoDisabled = !values.ID_PERIODO || !values.ID_SEDE;
  const docenteDisabled = !values.ID_PERIODO || !values.ID_SEDE || !values.ID_TURNO;

  // formData estable (usado por inputs para evaluar templates / condiciones)
  const stableFormData = useMemo(() => ({
    ID_PERIODO: values.ID_PERIODO,
    ID_SEDE: values.ID_SEDE,
    ID_TURNO: values.ID_TURNO,
    ID_DOCENTE_PERIODO: values.ID_DOCENTE_PERIODO
  }), [values.ID_PERIODO, values.ID_SEDE, values.ID_TURNO, values.ID_DOCENTE_PERIODO]);

  // Params memoizados con valores directos (no templates) para cada función
  const sedeParams = useMemo(() => ({
    ID_PERIODO: values.ID_PERIODO || null
  }), [values.ID_PERIODO]);

  const turnoParams = useMemo(() => ({
    ID_PERIODO: values.ID_PERIODO || null,
    ID_SEDE: values.ID_SEDE || null
  }), [values.ID_PERIODO, values.ID_SEDE]);

  // Docente se filtra por contexto completo (periodo+sede+turno) via GRUPO_PLAN_CURSO
  const docenteParams = useMemo(() => ({
    ID_PERIODO: values.ID_PERIODO || null,
    ID_SEDE: values.ID_SEDE || null,
    ID_TURNO: values.ID_TURNO || null
  }), [values.ID_PERIODO, values.ID_SEDE, values.ID_TURNO]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <ReferenceSelectInput
        name="ID_PERIODO"
        label="Periodo"
        referenceTable="PERIODOS"
        referenceField="ID_PERIODO"
        referenceQuery="{CODIGO_PERIODO}"
        placeholder="Seleccione un periodo"
        searchable={true}
        value={values.ID_PERIODO || ''}
        onChange={onChange}
        formData={stableFormData}
      />

      <FunctionSelectInput
        name="ID_SEDE"
        label="Sede"
        functionName="fn_sedes_con_docentes_asignados"
        functionParams={sedeParams}
        valueField="ID_SEDE"
        labelField="NOMBRE_SEDE"
        descriptionField="{TOTAL_GRUPOS} grupo(s)"
        placeholder={sedeDisabled ? 'Seleccione periodo primero' : 'Seleccione una sede'}
        searchable={true}
        disabled={sedeDisabled}
        value={values.ID_SEDE || ''}
        onChange={onChange}
        formData={stableFormData}
      />

      <FunctionSelectInput
        name="ID_TURNO"
        label="Turno"
        functionName="fn_turnos_con_docentes_asignados"
        functionParams={turnoParams}
        valueField="ID_TURNO"
        labelField="NOMBRE_TURNO"
        descriptionField="{DESCRIPCION} · {TOTAL_GRUPOS} grupo(s)"
        placeholder={turnoDisabled ? 'Seleccione sede primero' : 'Seleccione un turno'}
        searchable={true}
        disabled={turnoDisabled}
        value={values.ID_TURNO || ''}
        onChange={onChange}
        formData={stableFormData}
      />

      <FunctionSelectInput
        name="ID_DOCENTE_PERIODO"
        label="Docente"
        functionName="fn_docentes_por_contexto"
        functionParams={docenteParams}
        valueField="ID_DOCENTE_PERIODO" 
        labelField="{IDENTIFICADOR_DOCENTE} — {CURSOS_DIFERENTES} curso(s), {GRUPOS_ASIGNADOS} grupo(s)"
        descriptionField="NOMBRE_COMPLETO_DOCENTE"
        placeholder={docenteDisabled ? 'Seleccione turno primero' : 'Seleccione un docente'}
        searchable={true}
        disabled={docenteDisabled}
        value={values.ID_DOCENTE_PERIODO || ''}
        onChange={onChange}
        formData={stableFormData}
      />
    </div>
  );
});

DocenteSelectors.displayName = 'DocenteSelectors';

export default DocenteSelectors;
