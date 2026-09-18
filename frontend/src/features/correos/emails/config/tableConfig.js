/**
 * Configuración de tabla para Correos (un solo nivel)
 */
import React from 'react';
import { formatDate } from '@/shared/utils';

// Columnas del listado de VW_CORREOS: todo menos las pesadas
// (CUERPO_HTML, CUERPO_TEXTO, ADJUNTOS, DESTINATARIOS_USUARIOS),
// que se cargan bajo demanda vía getCorreoDetalle para reducir egress.
export const CORREOS_LIST_FIELDS = [
  'ID_CORREO',
  'DESTINATARIOS',
  'CC',
  'BCC',
  'TIPO',
  'ASUNTO',
  'ESTADO',
  'ERROR',
  'PRIORIDAD',
  'FECHA_PROGRAMADA',
  'INTENTOS',
  'CREADO_EN',
  'ENVIADO_EN',
  'CREADO_POR',
  'ENVIO_AUTOMATICO',
  'BLOQUEADO',
  'PERSONALIZADO',
  'OBSERVACIONES',
  'REMITENTE',
  'ID_CREADOR',
  'ID_ENVIADOR',
  'ID_CUENTA_SMTP',
  'FECHA_EDICION',
  'CREADOR_NOMBRE',
  'ENVIADOR_NOMBRE',
  'CUENTA_SMTP_NOMBRE',
];

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
        title: 'ESTADO',
        type: 'stacked',
        label: 'Estado/Prioridad',
        displayValue: (row) => {
          const estado = row.ESTADO || '-';
          const palette = {
            enviado: 'bg-green-100 text-green-700',
            pendiente: 'bg-amber-100 text-amber-700',
            fallido: 'bg-red-100 text-red-700',
            cancelado: 'bg-slate-100 text-slate-600',
          };
          const classes = palette[estado] || 'bg-slate-100 text-slate-600';
          const badge = React.createElement(
            'span',
            { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}` },
            estado
          );
          return {
            primary: badge,
            secondary: row.PRIORIDAD ? `Prioridad: ${row.PRIORIDAD}` : null
          };
        }
      },
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
        disabledLabel: 'Enviando...',
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
          onClick: (row) => {}
        },
        {
          enabled: true,
          icon: 'users',
          label: 'Ver destinatarios',
          className: 'text-gray-700',
          showIf: (row) => row.ESTADO === 'enviado',
          onClick: (row) => {}
        }
      ]
    }
  }
];
