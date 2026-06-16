/**
 * Configuración de selectores en cascada para ProgramacionGrupoConfig
 */
export const initialSelectorValues = {
  ID_PERIODO: '',
  ID_SEDE: '',
  ID_TURNO: '',
  ID_GRUPO: ''
};

export const getSelectorDisabledStates = (values) => ({
  sedeDisabled:  !values.ID_PERIODO,
  turnoDisabled: !values.ID_PERIODO || !values.ID_SEDE,
  grupoDisabled: !values.ID_PERIODO || !values.ID_SEDE || !values.ID_TURNO
});
