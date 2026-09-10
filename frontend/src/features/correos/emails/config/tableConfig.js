/**
 * Configuración de tabla para Correos (un solo nivel)
 */
import { formatDate } from '@/shared/utils';

const hasRecipients = (row) => {
  const value = row?.DESTINATARIOS_USUARIOS;
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
};

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
        title: 'TIPO',
        type: 'string',
        label: 'Tipo',
        displayValue: (row) => ({
          'correo': 'Normal',
          'automatico': 'Automático',
          'personalizado': 'Personalizado'
        }[row.TIPO] || row.TIPO || '-')
      },
      {
        title: 'CREADOR_NOMBRE',
        type: 'stacked',
        label: 'Creado - Enviado',
        displayValue: (row) => {
          const cuenta = row.CUENTA_SMTP_NOMBRE || row.REMITENTE || '-';

          let creador;
          if (row.TIPO === 'automatico' && !row.CREADOR_NOMBRE) {
            creador = 'Sistema';
          } else {
            creador = row.CREADOR_NOMBRE || row.CREADO_POR || '-';
          }

          let enviador;
          if (row.TIPO === 'automatico' && !row.ENVIADOR_NOMBRE) {
            enviador = 'Sistema';
          } else if (row.ENVIADOR_NOMBRE) {
            enviador = row.ENVIADOR_NOMBRE;
          } else if (row.ESTADO === 'enviado') {
            enviador = creador;
          } else {
            enviador = null;
          }

          let primary;
          if (enviador && creador !== enviador) {
            primary = `Creado: ${creador} — Enviado: ${enviador}`;
          } else {
            primary = creador;
          }

          let secondary;
          if (row.ESTADO === 'enviado') {
            secondary = `Desde: ${cuenta}`;
          } else if (enviador === null) {
            secondary = `Sin enviar · Desde: ${cuenta}`;
          } else {
            secondary = `Desde: ${cuenta}`;
          }

          return { primary, secondary };
        }
      },
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
          primary: row.ENVIADO_EN ? `Enviado: ${formatDate(row.ENVIADO_EN)}` : 'No enviado',
          secondary: row.CREADO_EN ? `Creado: ${formatDate(row.CREADO_EN)}` : null
        })
      },
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
        },
        {
          enabled: true,
          icon: 'users',
          label: 'Ver destinatarios',
          className: 'text-gray-700',
          showIf: hasRecipients,
          onClick: (row) => {}
        }
      ]
    }
  }
];
