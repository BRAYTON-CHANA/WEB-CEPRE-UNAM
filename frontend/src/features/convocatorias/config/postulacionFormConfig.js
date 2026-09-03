import AddDocenteForm from '@/features/convocatorias/components/AddDocenteForm';
import { loadDocumentosForDocente, getDocumentoUrl } from '@/features/convocatorias/requisitos/documentos/services/convocatoriaDocumentosService';

/**
 * Configuración de formulario para POSTULACION_PLAZA
 * Se usa desde PostulacionesPlazaPanel.
 */
export const postulacionFormFields = [
  {
    name: 'ID_CONVOCATORIA_CURSO',
    type: 'hidden',
    hidden: true
  },
  {
    name: 'ID_DOCENTE',
    type: 'reference-select',
    label: 'Docente',
    required: true,
    referenceTable: 'VW_DOCENTES',
    referenceField: 'ID_DOCENTE',
    referenceQuery: '{NOMBRE_COMPLETO} (DNI: {DNI}) (RUC: {RUC})',
    referenceFilters: [
      { field: 'DOCENTE_ACTIVO', op: 'eq', value: true },
      { field: 'USUARIO_ACTIVO', op: 'eq', value: true }
    ],
    searchable: true,
    showRefreshButton: true,
    showAddButton: true,
    addModalTitle: 'Nuevo docente',
    addModalSize: 'lg',
    addComponent: AddDocenteForm,
    placeholder: 'Seleccione un docente'
  },
  {
    name: 'ADJUNTOS_DATA',
    type: 'predefined-files',
    label: 'Documentos de postulación',
    required: false,
    ignoreField: true,
    mode: 'create',
    triggerField: 'ID_DOCENTE',
    loadPredefined: loadDocumentosForDocente,
    getDownloadUrl: getDocumentoUrl,
    labels: {
      contextBadgePrefix: 'Condición laboral: ',
      sinTrigger: 'Seleccione un docente para cargar los requisitos de postulación.',
      sinPredefinidos: 'No hay requisitos configurados para esta condición laboral.',
      cargando: 'Cargando requisitos del docente...',
      confirmarReset: 'Cambiar de docente reemplazará los documentos cargados. ¿Desea continuar?'
    },
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg',
    maxSize: 10 * 1024 * 1024
  }
];

export const postulacionValidation = {
  ID_CONVOCATORIA_CURSO: {
    required: { value: true, message: 'Falta la convocatoria_curso asociada' }
  },
  ID_DOCENTE: {
    required: { value: true, message: 'Debe seleccionar un docente' }
  }
};

/**
 * Versión del form con selector visible de convocatoria_curso.
 * Muestra la convocatoria bloqueada + el selector de sede-curso con plazas.
 * @param {Array} convocatoriaCursos - lista de VW_CONVOCATORIAS_CURSO filtrados por convocatoria
 * @param {boolean} lockConvocatoriaCurso - si true, el selector está deshabilitado (curso ya elegido)
 * @param {string} convocatoriaLabel - texto a mostrar en el campo convocatoria bloqueado
 */
export const getPostulacionFormFieldsWithConvocatoriaCurso = (convocatoriaCursos = [], lockConvocatoriaCurso = false, convocatoriaLabel = '') => [
  {
    name: 'ID_CONVOCATORIA',
    type: 'text',
    label: 'Convocatoria',
    disabled: true,
    defaultValue: convocatoriaLabel,
    ignoreField: true
  },
  {
    name: 'ID_CONVOCATORIA_CURSO',
    type: 'select',
    label: 'Postular a (Sede - Curso)',
    required: true,
    disabled: lockConvocatoriaCurso,
    searchable: true,
    placeholder: 'Seleccione sede - curso...',
    options: convocatoriaCursos.map(cc => ({
      value: cc.ID_CONVOCATORIA_CURSO,
      label: `${cc.NOMBRE_SEDE} - ${cc.NOMBRE_CURSO} (${cc.CODIGO_CURSO}) · ${cc.NUMERO_PLAZAS} plazas`
    }))
  },
  {
    name: 'ID_DOCENTE',
    type: 'reference-select',
    label: 'Docente',
    required: true,
    referenceTable: 'VW_DOCENTES',
    referenceField: 'ID_DOCENTE',
    referenceQuery: '{NOMBRE_COMPLETO} (DNI: {DNI}) (RUC: {RUC})',
    referenceFilters: [
      { field: 'DOCENTE_ACTIVO', op: 'eq', value: true },
      { field: 'USUARIO_ACTIVO', op: 'eq', value: true }
    ],
    searchable: true,
    showRefreshButton: true,
    showAddButton: true,
    addModalTitle: 'Nuevo docente',
    addModalSize: 'lg',
    addComponent: AddDocenteForm,
    placeholder: 'Seleccione un docente'
  },
  {
    name: 'ADJUNTOS_DATA',
    type: 'predefined-files',
    label: 'Documentos de postulación',
    required: false,
    ignoreField: true,
    mode: 'create',
    triggerField: 'ID_DOCENTE',
    loadPredefined: loadDocumentosForDocente,
    getDownloadUrl: getDocumentoUrl,
    labels: {
      contextBadgePrefix: 'Condición laboral: ',
      sinTrigger: 'Seleccione un docente para cargar los requisitos de postulación.',
      sinPredefinidos: 'No hay requisitos configurados para esta condición laboral.',
      cargando: 'Cargando requisitos del docente...',
      confirmarReset: 'Cambiar de docente reemplazará los documentos cargados. ¿Desea continuar?'
    },
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg',
    maxSize: 10 * 1024 * 1024
  }
];
