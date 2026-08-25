/**
 * Configuración de tabla para Correos (un solo nivel)
 */
import { formatDate } from '../../../../shared/utils/formatUtils.jsx';

export const tableConfig = {
  tableName: 'VW_CORREOS'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = (correosCrud) => [
  {
    level: 1,
    headers: [
      {
        title: 'CREADOR_NOMBRE',
        type: 'stacked',
        label: 'Creado/Enviado por',
        displayValue: (row) => ({
          primary: row.CREADOR_NOMBRE || '-',
          secondary: row.ENVIADOR_NOMBRE ? `Enviado por: ${row.ENVIADOR_NOMBRE}` : 'Sin enviar'
        })
      },
      { title: 'CUENTA_SMTP_NOMBRE', type: 'string', label: 'Desde' },
      { title: 'ASUNTO', type: 'string', label: 'Asunto' },
      {
        title: 'ESTADO',
        type: 'stacked',
        label: 'Estado/Prioridad',
        displayValue: (row) => ({
          primary: row.ESTADO || '-',
          secondary: row.PRIORIDAD ? `Prioridad: ${row.PRIORIDAD}` : null
        })
      },
      {
        title: 'ENVIADO_EN',
        type: 'stacked',
        label: 'Fechas',
        displayValue: (row) => ({
          primary: row.ENVIADO_EN ? formatDate(row.ENVIADO_EN) : 'No enviado',
          secondary: row.CREADO_EN ? `Creado: ${formatDate(row.CREADO_EN)}` : null
        })
      },
      {
        title: 'TIPO',
        type: 'stacked',
        label: 'Tipo/Obs',
        displayValue: (row) => ({
          primary: row.TIPO || '-',
          secondary: row.OBSERVACIONES || (row.FECHA_PROGRAMADA ? `Prog: ${formatDate(row.FECHA_PROGRAMADA)}` : null)
        })
      }
    ],
    boundColumn: 'ID_CORREO',
    actions: {
       enviar: {
        enabled: true,
        icon: 'send',
        label: 'Enviar',
        className: 'text-green-600 hover:bg-green-100',
        showIf: (row) => row.ESTADO === 'pendiente',
        onClick: (row) => correosCrud.handleEnviar?.(row)
      },
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        showIf: (row) => row.ESTADO !== 'enviado',
        onClick: (row) => correosCrud.handleEdit(row)
      },
      observaciones: {
        enabled: true,
        icon: 'message-square',
        label: 'Observaciones',
        className: 'text-blue-600 hover:bg-blue-100',
        showIf: (row) => row.ESTADO === 'enviado',
        onClick: (row) => correosCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => correosCrud.handleDelete(row)
      },
      ver: [
        {
          enabled: true,
          icon: 'eye',
          label: 'Ver correo',
          className: 'text-gray-700',
          showIf: (row) => !!row.CUERPO_HTML,
          onClick: (row) => {}
        }
      ]
    }
  }
];
