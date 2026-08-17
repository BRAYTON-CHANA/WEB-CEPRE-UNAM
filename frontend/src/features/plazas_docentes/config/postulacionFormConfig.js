import AddDocenteForm from '@/features/plazas_docentes/components/AddDocenteForm';
import { loadRequisitosForDocente, getRequisitoUrl } from '@/features/requisitos_docentes/services/requisitosDocentesService';

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
    type: 'function-select',
    label: 'Docente',
    required: true,
    functionName: 'fn_docentes_disponibles_convocatoria_curso',
    functionParams: {
      p_id_convocatoria_curso: '{ID_CONVOCATORIA_CURSO}',
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
    name: 'ADJUNTOS_DATA',
    type: 'predefined-files',
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
  ID_CONVOCATORIA_CURSO: {
    required: { value: true, message: 'Falta la convocatoria_curso asociada' }
  },
  ID_DOCENTE: {
    required: { value: true, message: 'Debe seleccionar un docente' }
  }
};
