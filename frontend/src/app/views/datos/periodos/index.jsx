import React from 'react';
import { Crud } from '@/features/crud';
import Layout from '@/shared/components/layout/Layout';

/**
 * Configuración de PERIODOS
 * CRUD completo para la tabla PERIODOS
 */
function PeriodosConfig() {
  // ==========================================
  // 1. CONFIGURACIÓN DE TABLA (tableConfig)
  // ==========================================
  const tableConfig = {
    tableName: 'PERIODOS',
    headers: [
     
      { title: 'CODIGO_PERIODO', type: 'string' },
      { title: 'FECHA_INICIO', type: 'date' },
      { title: 'FECHA_FIN', type: 'date' },
      { title: 'ESTADO', type: 'string' },
      { title: 'ACTIVO', type: 'boolean' }
    ],
    boundColumn: 'ID_PERIODO'
  };

  // ==========================================
  // 2. CONFIGURACIÓN DE FORMULARIO (formConfig)
  // ==========================================
  const formConfig = {
    tableName: 'PERIODOS',
    primaryKey: 'ID_PERIODO',
    fields: [
      { 
        name: 'CODIGO_PERIODO', 
        type: 'text', 
        label: 'Código del Período', 
        required: true,
        placeholder: 'Ej: 2026-I, 2026-II'
      },
      { 
        name: 'FECHA_INICIO', 
        type: 'date', 
        label: 'Fecha de Inicio', 
        required: false
      },
      { 
        name: 'FECHA_FIN', 
        type: 'date', 
        label: 'Fecha de Fin', 
        required: false
      },
      { 
        name: 'ESTADO', 
        type: 'select', 
        label: 'Estado', 
        required: true,
        options: [
          { value: 'planificado', label: 'Planificado' },
          { value: 'activo', label: 'Activo' },
          { value: 'finalizado', label: 'Finalizado' },
          { value: 'cancelado', label: 'Cancelado' }
        ],
        defaultValue: 'activo'
      },
      { 
        name: 'ACTIVO', 
        type: 'boolean', 
        label: 'Activo', 
        required: false,
        defaultValue: true
      }
    ],
    layout: null,
    multiStep: {
      showDots: true,
      persistData: false,
      nextText: 'Siguiente',
      prevText: 'Atrás',
      submitText: 'Guardar Período'
    },
    validation: (formData) => {
      const errors = {};
      
      // Validar código requerido
      if (!formData.CODIGO_PERIODO || formData.CODIGO_PERIODO.trim() === '') {
        errors.CODIGO_PERIODO = 'El código del período es requerido';
      }
      
      // Validar fecha inicio requerida
      if (!formData.FECHA_INICIO) {
        errors.FECHA_INICIO = 'La fecha de inicio es requerida';
      }
      
      // Validar fecha fin requerida y mayor que fecha inicio
      if (!formData.FECHA_FIN) {
        errors.FECHA_FIN = 'La fecha de fin es requerida';
      } else if (formData.FECHA_INICIO) {
        // Parsear fechas en formato DD/MM/YYYY
        const parseDate = (dateStr) => {
          if (!dateStr) return null;
          const [day, month, year] = dateStr.split('/').map(Number);
          return new Date(year, month - 1, day); // month is 0-indexed
        };
        
        const fechaInicio = parseDate(formData.FECHA_INICIO);
        const fechaFin = parseDate(formData.FECHA_FIN);
        
        if (!fechaInicio || !fechaFin || isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
          errors.FECHA_FIN = 'Formato de fecha inválido';
        } else if (fechaFin <= fechaInicio) {
          errors.FECHA_FIN = 'La fecha de fin debe ser mayor que la fecha de inicio';
        }
      }
      
      // Validar estado requerido
      if (!formData.ESTADO) {
        errors.ESTADO = 'El estado es requerido';
      }
      
      return errors;
    }
    
  };

  // ==========================================
  // 3. PARÁMETROS DEL COMPONENTE TABLE
  // ==========================================
  const tableComponentParameters = {
    showCount: false,
    emptyMessage: 'No hay períodos registrados',
    variant: 'default',
    striped: true,
    hover: true,
    bordered: true,
    sortable: true,
    selectable: false,
    expandable: false,
    filterable: true,
    pagination: true,
    fit: false,
    itemsPerPage: 10,
    currentPage: 1,
    onPageChange: null
  };

  // ==========================================
  // 4. CONFIGURACIÓN DE MODALES
  // ==========================================
  const modalConfig = {
    createTitle: 'Crear Nuevo Período',
    editTitle: 'Editar Período',
    size: 'medium',
    widthClass: 'w-1/2'
  };

  // ==========================================
  // 5. PROPIEDADES DEL HEADER
  // ==========================================
  const headerProps = {
    headerTitle: 'Gestión de Períodos',
    headerDescription: 'Administra los períodos académicos del sistema',
    titleClassName: '',
    descriptionClassName: '',
    actions: []
  };

  // ==========================================
  // 6. PROPIEDADES DEL FOOTER
  // ==========================================
  const footerProps = {
    footerTitle: '',
    footerDescription: '',
    footerTitleClassName: '',
    footerDescriptionClassName: '',
    actions: []
  };

  // ==========================================
  // 7. ACCIONES PERSONALIZADAS
  // ==========================================
  const actions = {
    custom: []
  };

  // ==========================================
  // 8. CALLBACKS
  // ==========================================
  const handleSuccess = (result) => {
    console.log('Operación exitosa en PERIODOS:', result);
  };

  const handleError = (error) => {
    console.error('Error en operación PERIODOS:', error);
  };

  return (
    <Layout>
      <Crud
        tableConfig={tableConfig}
        formConfig={formConfig}
        tableComponentParameters={tableComponentParameters}
        modalConfig={modalConfig}
        headerProps={headerProps}
        footerProps={footerProps}
        actions={actions}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </Layout>
  );
}

export default PeriodosConfig;
