import AddDocenteForm from '@/features/plazas_docentes/components/AddDocenteForm';
import { loadRequisitosForDocente, getRequisitoUrl } from '@/features/requisitos_docentes/services/requisitosDocentesService';

/**
 * Configuración de formulario para POSTULACION_PLAZA
 * Se usa desde PostulacionesPlazaPanel.
 */
export const postulacionFormFields = [
  {
    name: 'ID_PLAZA_DOCENTE',
    type: 'hidden',
    hidden: true
  },
  {
    name: 'ID_DOCENTE',
    type: 'function-select',
    label: 'Docente',
    required: true,
    functionName: 'fn_docentes_disponibles_plaza',
    functionParams: {
      p_id_plaza_docente: '{ID_PLAZA_DOCENTE}',
      p_id_docente_actual: '{ID_DOCENTE}'
    },
    optionalParams: ['p_id_docente_actual'],
    valueField: 'id_docente',
    labelField: '{nombre_completo} (DNI: {dni})',
    statusField: 'estado_docente',
    searchable: true,
    showRefreshButton: true,
    showAddButton: true,
    addModalTitle: 'Nuevo docente',
    addModalSize: 'lg',
    addComponent: AddDocenteForm,
    placeholder: 'Seleccione un docente',
    displayFields: [
      { field: 'dni', label: 'DNI' },
      { field: 'ruc', label: 'RUC' },
      { field: 'condicion_laboral', label: 'Condición' },
      { field: 'telefono', label: 'Teléfono' },
      { field: 'email', label: 'Email' }
    ]
  },
  {
    name: 'ESTADO',
    type: 'select',
    label: 'Estado',
    required: true,
    defaultValue: 'postulado',
    options: [
      { value: 'postulado', label: 'Postulado' },
      { value: 'en_revision', label: 'En revisión' },
      { value: 'entrevista', label: 'Entrevista' },
      { value: 'documentos', label: 'Documentos' },
      { value: 'contratado', label: 'Contratado' },
      { value: 'descartado', label: 'Descartado' }
    ]
  },
  {
    name: 'FECHA_ENTREVISTA',
    type: 'date',
    label: 'Fecha de entrevista',
    required: false
  },
  {
    name: 'NOTA_ENTREVISTA',
    type: 'textarea',
    label: 'Nota de entrevista',
    required: false
  },
  {
    name: 'OBSERVACIONES',
    type: 'textarea',
    label: 'Observaciones',
    required: false
  },
  {
    name: 'ADJUNTOS_DATA',
    type: 'json-files',
    label: 'Documentos de postulación',
    required: false,
    ignoreField: true,
    mode: 'create',
    triggerField: 'ID_DOCENTE',
    loadPredefined: loadRequisitosForDocente,
    getDownloadUrl: getRequisitoUrl,
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
  ID_PLAZA_DOCENTE: {
    required: { value: true, message: 'Falta la plaza asociada' }
  },
  ID_DOCENTE: {
    required: { value: true, message: 'Debe seleccionar un docente' }
  },
  ESTADO: {
    required: { value: true, message: 'El estado es obligatorio' }
  }
};
