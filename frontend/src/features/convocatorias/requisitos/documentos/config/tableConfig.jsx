import { getDocumentoUrl, subirArchivoDocumentoInline } from '@/features/convocatorias/requisitos/documentos/services/convocatoriaDocumentosService';

/**
 * Configuración de tabla para Convocatoria Documentos (2 niveles, lazy loading)
 *
 * Level 1: Clasificaciones (datos de VW_CONVOCATORIA_DOCUMENTOS_CLASIFICACION)
 *   - NOMBRE editable inline (targetTable: CONVOCATORIA_DOCUMENTOS_CLASIFICACION)
 *   - OBLIGATORIO editable inline
 *   - ACTIVO editable inline
 *   - Delete: elimina la clasificación (cascade)
 *
 * Level 2: Documentos (lazy loading desde VW_CONVOCATORIA_DOCUMENTOS por ID_CLASIFICACION)
 *   - NOMBRE, DESCRIPCION, STORAGE_PATH (file-editable), ACTIVO
 *   - Move up/down, edit, delete
 */
export const tableConfig = {
  tableName: 'VW_CONVOCATORIA_DOCUMENTOS_CLASIFICACION'
};

/**
 * Genera los levelConfigs para TableMultiLevelEditable (modo async).
 *
 * @param {Function} handleEdit - abre modal de editar documento
 * @param {Function} handleDelete - abre modal de eliminar documento
 * @param {Function} handleMoveUp - mueve documento arriba
 * @param {Function} handleMoveDown - mueve documento abajo
 * @param {Function} handleDeleteClasificacion - abre modal de eliminar clasificación
 * @param {Function} getDocumentosForClasificacion - (idClas) => documentos[] desde childrenData
 */
export const getTableLevelConfigs = ({ handleEdit, handleDelete, handleMoveUp, handleMoveDown, handleDeleteClasificacion, handleAddDocumentoToClasificacion, getDocumentosForClasificacion }) => [
  {
    level: 1,
    headers: [
      {
        title: 'NOMBRE',
        type: 'string',
        label: 'Clasificación',
        editable: true,
        editableOnGroupBy: true,
        targetTable: 'CONVOCATORIA_DOCUMENTOS_CLASIFICACION',
        targetField: 'NOMBRE',
        targetPrimaryKey: 'ID_CLASIFICACION'
      },
      {
        title: 'OBLIGATORIO',
        type: 'boolean',
        label: 'Obligatorio',
        editable: true,
        targetTable: 'CONVOCATORIA_DOCUMENTOS_CLASIFICACION',
        targetField: 'OBLIGATORIO',
        targetPrimaryKey: 'ID_CLASIFICACION'
      },
      {
        title: 'ACTIVO',
        type: 'boolean',
        label: 'Activo',
        editable: true,
        targetTable: 'CONVOCATORIA_DOCUMENTOS_CLASIFICACION',
        targetField: 'ACTIVO',
        targetPrimaryKey: 'ID_CLASIFICACION'
      }
    ],
    boundColumn: 'ID_CLASIFICACION',
    actions: {
      add: {
        enabled: true,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        ),
        label: 'Añadir plantilla',
        showLabel: true,
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddDocumentoToClasificacion(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar clasificación',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => handleDeleteClasificacion(row)
      }
    }
  },
  {
    level: 2,
    headers: [
      { title: 'NOMBRE', type: 'string', label: 'Nombre' },
      { title: 'DESCRIPCION', type: 'string', label: 'Descripción' },
      {
        title: 'STORAGE_PATH',
        type: 'file-editable',
        label: 'Archivo',
        uploadFunction: subirArchivoDocumentoInline,
        getUrlFunction: getDocumentoUrl,
        accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip',
        maxSize: 10 * 1024 * 1024
      },
      {
        title: 'ACTIVO',
        type: 'boolean',
        label: 'Activo',
        editable: true,
        targetTable: 'CONVOCATORIA_DOCUMENTOS',
        targetField: 'ACTIVO'
      }
    ],
    boundColumn: 'ID_DOCUMENTO',
    actions: {
      moveUp: {
        enabled: true,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        ),
        label: '',
        showLabel: false,
        className: 'text-gray-700 hover:bg-gray-200',
        disabled: (row) => {
          if (!row?.ID_CLASIFICACION || !getDocumentosForClasificacion) return false;
          const grupo = getDocumentosForClasificacion(row.ID_CLASIFICACION)
            .sort((a, b) => Number(a.ORDEN ?? 0) - Number(b.ORDEN ?? 0));
          return grupo.length === 0 || grupo[0].ID_DOCUMENTO === row.ID_DOCUMENTO;
        },
        onClick: (row) => handleMoveUp(row)
      },
      moveDown: {
        enabled: true,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        ),
        label: '',
        showLabel: false,
        className: 'text-gray-700 hover:bg-gray-200',
        disabled: (row) => {
          if (!row?.ID_CLASIFICACION || !getDocumentosForClasificacion) return false;
          const grupo = getDocumentosForClasificacion(row.ID_CLASIFICACION)
            .sort((a, b) => Number(a.ORDEN ?? 0) - Number(b.ORDEN ?? 0));
          return grupo.length === 0 || grupo[grupo.length - 1].ID_DOCUMENTO === row.ID_DOCUMENTO;
        },
        onClick: (row) => handleMoveDown(row)
      },
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
