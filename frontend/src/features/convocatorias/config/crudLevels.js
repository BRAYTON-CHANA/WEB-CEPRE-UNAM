import {
  convocatoriaFormFields,
  convocatoriaMultiStep,
  convocatoriaValidation,
  convocatoriaModalConfig,
  convocatoriaCursoMultiStep,
  convocatoriaCursoValidation,
  convocatoriaCursoModalConfig
} from '@/features/convocatorias/config/formConfig';
import { addConvocatoriaCursoPlazas, editConvocatoria } from '@/features/convocatorias/services/convocatoriaService';

/**
 * crudLevels para la página 1 (lista de convocatorias).
 * Solo CRUD de CONVOCATORIA (create/edit/delete).
 */
export const getListCrudLevels = (convocatoriaCrud, refresh) => [
  {
    crud: convocatoriaCrud,
    tableName: 'CONVOCATORIA',
    primaryKey: 'ID_CONVOCATORIA',
    formFields: convocatoriaFormFields,
    formLayout: null,
    multiStep: convocatoriaMultiStep,
    validation: convocatoriaValidation,
    confirmSubmit: true,
    editFunction: editConvocatoria,
    modalConfig: {
      ...convocatoriaModalConfig,
      createFormKey: 'free'
    },
    onCreateSuccess: () => refresh(),
    onEditSuccess: () => refresh()
  }
];

/**
 * crudLevels para la página 2 (manejo de convocatoria).
 * CRUD de CONVOCATORIA_CURSO + delete-only de PLAZA_DOCENTE.
 */
export const getManageCrudLevels = ({
  convocatoriaCursoCrud,
  plazaDocenteCrud,
  formFieldsWithDefaults,
  selectedSedeForNewCurso,
  selectedModalidadForNewCurso,
  refresh,
  setSelectedConvocatoriaForNewCurso,
  setSelectedSedeForNewCurso,
  setSelectedModalidadForNewCurso,
  setEditingConvocatoriaId
}) => [
  {
    crud: convocatoriaCursoCrud,
    tableName: 'CONVOCATORIA_CURSO',
    primaryKey: 'ID_CONVOCATORIA_CURSO',
    formFields: formFieldsWithDefaults,
    formLayout: null,
    multiStep: convocatoriaCursoMultiStep,
    validation: convocatoriaCursoValidation,
    confirmSubmit: true,
    createFunction: addConvocatoriaCursoPlazas,
    modalConfig: {
      ...convocatoriaCursoModalConfig,
      createFormKey: `${selectedSedeForNewCurso ?? 'free'}-${selectedModalidadForNewCurso ?? 'free'}`
    },
    onCreateSuccess: () => {
      refresh();
      setSelectedConvocatoriaForNewCurso(null);
      setSelectedSedeForNewCurso(null);
      setSelectedModalidadForNewCurso(null);
    },
    onCreateClose: () => {
      setSelectedConvocatoriaForNewCurso(null);
      setSelectedSedeForNewCurso(null);
      setSelectedModalidadForNewCurso(null);
    },
    onEditSuccess: () => {
      refresh();
      setEditingConvocatoriaId(null);
    },
    onEditClose: () => setEditingConvocatoriaId(null)
  },
  {
    crud: plazaDocenteCrud,
    tableName: 'PLAZA_DOCENTE',
    primaryKey: 'ID_PLAZA_DOCENTE',
    formFields: [],
    formLayout: null,
    multiStep: null,
    validation: null,
    confirmSubmit: false,
    modalConfig: {
      deleteTitle: '¿Eliminar plaza docente?',
      deleteMessage: (row) => `¿Eliminar la plaza de ${row.DOCENTE_NOMBRE || 'este docente'}?`,
      createFormKey: 'plaza-delete-only',
      editFormKey: 'plaza-delete-only'
    }
  }
];
