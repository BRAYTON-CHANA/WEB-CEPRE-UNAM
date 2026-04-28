import React, { useMemo } from 'react';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import FunctionSelectInput from '@/shared/components/ui/inputs/FunctionSelectInput';

/**
 * Cascada 4 selectores: Periodo → Sede → Turno → Grupo.
 * - Sede filtrada por periodo (fn_sedes_con_docentes_asignados)
 * - Turno filtrado por periodo+sede (fn_turnos_con_docentes_asignados)
 * - Grupo filtrado por periodo+sede+turno (fn_grupos_por_contexto)
 *   Descripción muestra HORAS_PROGRAMADAS (sum DURACION / 50).
 *
 * Props:
 *  - values: { ID_PERIODO, ID_SEDE, ID_TURNO, ID_GRUPO }
 *  - onChange: (name, value) => void
 */
const GrupoSelectors = React.memo(({ values, onChange }) => {
  const sedeDisabled = !values.ID_PERIODO;
  const turnoDisabled = !values.ID_PERIODO || !values.ID_SEDE;
  const grupoDisabled = !values.ID_PERIODO || !values.ID_SEDE || !values.ID_TURNO;

  const stableFormData = useMemo(() => ({
    ID_PERIODO: values.ID_PERIODO,
    ID_SEDE: values.ID_SEDE,
    ID_TURNO: values.ID_TURNO,
    ID_GRUPO: values.ID_GRUPO
  }), [values.ID_PERIODO, values.ID_SEDE, values.ID_TURNO, values.ID_GRUPO]);

  const sedeParams = useMemo(() => ({
    ID_PERIODO: values.ID_PERIODO || null
  }), [values.ID_PERIODO]);

  const turnoParams = useMemo(() => ({
    ID_PERIODO: values.ID_PERIODO || null,
    ID_SEDE: values.ID_SEDE || null
  }), [values.ID_PERIODO, values.ID_SEDE]);

  const grupoParams = useMemo(() => ({
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
        name="ID_GRUPO"
        label="Grupo"
        functionName="fn_grupos_por_contexto"
        functionParams={grupoParams}
        valueField="ID_GRUPO"
        labelField="{CODIGO_GRUPO} - {NOMBRE_GRUPO}"
        descriptionField="{HORAS_PROGRAMADAS} h.a. programadas"
        placeholder={grupoDisabled ? 'Seleccione turno primero' : 'Seleccione un grupo'}
        searchable={true}
        disabled={grupoDisabled}
        value={values.ID_GRUPO || ''}
        onChange={onChange}
        formData={stableFormData}
      />
    </div>
  );
});

GrupoSelectors.displayName = 'GrupoSelectors';

export default GrupoSelectors;
