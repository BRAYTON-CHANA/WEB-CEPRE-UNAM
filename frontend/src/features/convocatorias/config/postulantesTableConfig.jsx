import React from 'react';
import { formatDatePEWithStatus } from '@/shared/utils/formatUtils.jsx';

/**
 * Headers de la tabla de postulaciones (VW_POSTULACIONES_PLAZA).
 */
export const getPostulantesTableHeaders = () => [
  {
    field: 'DOCENTE_NOMBRE',
    title: 'Docente',
    type: 'string',
    render: (value, row) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-900">{value}</span>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>DNI: {row.DNI}</span>
          {row.RUC && <span>· RUC: {row.RUC}</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {row.CONDICION_LABORAL_SNAPSHOT && (
            <span className="inline-flex w-fit items-center px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded font-medium border border-indigo-200">
              {row.CONDICION_LABORAL_SNAPSHOT}
            </span>
          )}
          <span className="text-[10px] text-gray-400">
            Postulado: {row.FECHA_POSTULACION ? new Date(row.FECHA_POSTULACION).toLocaleDateString('es-PE', { timeZone: 'America/Lima' }) + ' ' + new Date(row.FECHA_POSTULACION).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
          </span>
        </div>
      </div>
    ),
  },
  {
    field: 'NOMBRE_SEDE',
    title: 'Postulación',
    type: 'string',
    render: (value, row) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-800">{row.NOMBRE_SEDE}</span>
        <span className="text-xs text-gray-500">
          {row.NOMBRE_CURSO} <span className="text-gray-400">({row.CODIGO_CURSO})</span>
        </span>
      </div>
    ),
  },
  {
    field: 'FECHA_ENTREVISTA',
    title: 'Entrevista',
    type: 'date',
    editable: true,
    targetTable: 'POSTULACION_PLAZA',
    targetField: 'FECHA_ENTREVISTA',
    render: (value, row) => formatDatePEWithStatus(value, row.ENTREVISTA_REALIZADA, 'Realizada', 'Pendiente'),
  },
  { field: 'FECHA_CONTRATO', title: 'Contrato', type: 'date', render: (value, row) => formatDatePEWithStatus(value, row.CONTRATO_FIRMADO, 'Firmado', 'Sin firmar') },
  { field: 'ESTADO', title: 'Estado', type: 'string' },
  {
    field: 'ID_PLAZA_DOCENTE',
    title: 'Plaza',
    type: 'reference-select',
    editable: true,
    referenceTable: 'VW_PLAZA_DOCENTE_ASIGNADA',
    referenceField: 'ID_PLAZA_DOCENTE',
    referenceLabelField: 'IDENTIFICADOR_DOCENTE',
    referenceFilters: [
      { field: 'ID_CONVOCATORIA_CURSO', op: '=', value: '{ID_CONVOCATORIA_CURSO}' }
    ],
    excludeValues: true,
    excludeGroupField: 'ID_CONVOCATORIA_CURSO',
    targetTable: 'POSTULACION_PLAZA',
    targetField: 'ID_PLAZA_DOCENTE',
    placeholder: 'Sin asignar',
    render: (value, row) => {
      if (!value) return <span className="text-gray-300 italic">Sin asignar</span>;
      return (
        <span className="inline-flex items-center px-2 py-0.5 bg-[#57C7C2]/10 text-[#57C7C2] text-xs rounded font-medium border border-[#57C7C2]/20">
          {row.IDENTIFICADOR_PLAZA || value}
        </span>
      );
    },
  },
];

/**
 * Acciones por fila de la tabla de postulaciones.
 * @param {Function} onViewAdjuntos - handler ver adjuntos
 * @param {Function} onDeletePostulacion - handler eliminar
 */
export const getPostulantesTableActions = (onViewAdjuntos, onDeletePostulacion) => [
  {
    label: 'Adjuntos',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    ),
    onClick: (row) => onViewAdjuntos(row),
    className: 'text-indigo-600 hover:bg-indigo-50',
  },
  {
    label: 'Eliminar',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.993-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
      </svg>
    ),
    onClick: (row) => onDeletePostulacion(row),
    className: 'text-red-600 hover:bg-red-50',
  },
];
