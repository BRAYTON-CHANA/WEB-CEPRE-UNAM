import { getRequisitoUrl, subirArchivoRequisitoInline } from '@/features/requisitos_docentes/services/requisitosDocentesService';

/**
 * Configuración de tabla para Requisitos Docentes (2 niveles)
 * Nivel 1: Condición laboral (grupo) con botón "Añadir Requisito"
 * Nivel 2: Requisitos individuales con archivo inline, editar, eliminar
 */
export const tableConfig = {
  tableName: 'VW_REQUISITOS_DOCENTES'
};

/**
 * Genera los levelConfigs para TableMultiLevelEditable.
 * Nivel 1: Condición laboral (groupBy) + botón añadir requisito
 * Nivel 2: Requisito individual (archivo inline, editar, eliminar)
 * ARCHIVO se gestiona inline con FileEditableCell.
 * OBLIGATORIO y ACTIVO son editables inline.
 */
export const getTableLevelConfigs = ({ handleEdit, handleDelete, handleAddRequisito }) => [
  {
    level: 1,
    headers: [
      { title: 'CONDICION_LABORAL', type: 'string', groupBy: true, label: 'Condición' }
    ],
    boundColumn: 'ID_REQUISITO',
    childCountLabel: { singular: 'requisito', plural: 'requisitos' },
    actions: {
      addRequisito: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Requisito',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddRequisito(row)
      }
    }
  },
  {
    level: 2,
    headers: [
      { title: 'CLASIFICACION', type: 'string', label: 'Clasificación' },
      { title: 'NOMBRE', type: 'string', label: 'Nombre' },
      { title: 'DESCRIPCION', type: 'string', label: 'Descripción' },
      {
        title: 'STORAGE_PATH',
        type: 'file-editable',
        label: 'Archivo',
        uploadFunction: subirArchivoRequisitoInline,
        getUrlFunction: getRequisitoUrl,
        accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip',
        maxSize: 10 * 1024 * 1024
      },
      { title: 'OBLIGATORIO', type: 'boolean', label: 'Obligatorio', editable: true, targetTable: 'REQUISITOS_DOCENTES', targetField: 'OBLIGATORIO' },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'REQUISITOS_DOCENTES', targetField: 'ACTIVO' }
    ],
    boundColumn: 'ID_REQUISITO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => handleDelete(row)
      }
    }
  }
];
