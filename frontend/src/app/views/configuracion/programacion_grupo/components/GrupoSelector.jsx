import React, { useMemo } from 'react';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import FunctionSelectInput from '@/shared/components/ui/inputs/FunctionSelectInput';
import { getSelectorDisabledStates } from '../config/selectorConfig';

export default function GrupoSelector({ selectorValues, stableFormData, onSelectorChange }) {
  const { sedeDisabled, turnoDisabled, grupoDisabled } = getSelectorDisabledStates(selectorValues);

  const sedeParams  = useMemo(() => ({ ID_PERIODO: selectorValues.ID_PERIODO || null }), [selectorValues.ID_PERIODO]);
  const turnoParams = useMemo(() => ({ ID_PERIODO: selectorValues.ID_PERIODO || null, ID_SEDE: selectorValues.ID_SEDE || null }), [selectorValues.ID_PERIODO, selectorValues.ID_SEDE]);
  const grupoParams = useMemo(() => ({ ID_PERIODO: selectorValues.ID_PERIODO || null, ID_SEDE: selectorValues.ID_SEDE || null, ID_TURNO: selectorValues.ID_TURNO || null }), [selectorValues.ID_PERIODO, selectorValues.ID_SEDE, selectorValues.ID_TURNO]);

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ReferenceSelectInput
          name="ID_PERIODO"
          label="Periodo"
          referenceTable="PERIODOS"
          referenceField="ID_PERIODO"
          referenceQuery="{CODIGO_PERIODO}"
          placeholder="Seleccione un periodo"
          searchable={true}
          value={selectorValues.ID_PERIODO || ''}
          onChange={onSelectorChange}
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
          value={selectorValues.ID_SEDE || ''}
          onChange={onSelectorChange}
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
          value={selectorValues.ID_TURNO || ''}
          onChange={onSelectorChange}
          formData={stableFormData}
        />
        <FunctionSelectInput
          name="ID_GRUPO"
          label="Grupo"
          functionName="fn_grupos_por_contexto"
          functionParams={grupoParams}
          valueField="ID_GRUPO"
          labelField="{CODIGO_GRUPO} - {NOMBRE_GRUPO}"
          //descriptionField="-------------------------"
          placeholder={grupoDisabled ? 'Seleccione turno primero' : 'Seleccione un grupo'}
          searchable={true}
          disabled={grupoDisabled}
          value={selectorValues.ID_GRUPO || ''}
          onChange={onSelectorChange}
          formData={stableFormData}
        />
      </div>
    </div>
  );
}
