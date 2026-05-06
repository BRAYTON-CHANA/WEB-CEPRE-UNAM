export const initialSelectorValues = {
  ID_PERIODO:       '',
  ID_SEDE:          '',
  ID_TURNO:         '',
  ID_PLAZA_DOCENTE: '',
  ID_GRUPO:         ''
};

export const getSelectorDisabledStates = (values) => ({
  sedeDisabled:        !values.ID_PERIODO,
  turnoDisabled:       !values.ID_PERIODO || !values.ID_SEDE,
  plazaDisabled:       !values.ID_PERIODO || !values.ID_SEDE || !values.ID_TURNO,
  grupoDisabled:       !values.ID_PERIODO || !values.ID_SEDE || !values.ID_TURNO || !values.ID_PLAZA_DOCENTE
});
