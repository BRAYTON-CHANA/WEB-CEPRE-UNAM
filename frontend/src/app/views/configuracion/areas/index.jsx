import React from 'react';
import { Crud } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';

/**
 * Configuración de AREAS
 * CRUD completo para la tabla AREAS (con FK a SEDES)
 */
function AreasConfig() {
  // ==========================================
  // 1. CONFIGURACIÓN DE TABLA (tableConfig)
  // ==========================================
  const tableConfig = {
    tableName: 'AREAS',
    headers: [
  
      { title: 'NOMBRE_AREA', type: 'string' },
      { title: 'ACTIVO', type: 'boolean' }
    ],
    boundColumn: 'ID_AREA'
  };

  // ==========================================
  // 2. CONFIGURACIÓN DE FORMULARIO (formConfig)
  // ==========================================
  const formConfig = {
    tableName: 'AREAS',
    primaryKey: 'ID_AREA',
    fields: [
      { 
        name: 'NOMBRE_AREA', 
        type: 'text', 
        label: 'Nombre del Área', 
        required: true,
        placeholder: 'Ej: Área de Ciencias, Área de Humanidades'
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
      submitText: 'Guardar Área'
    },
    confirmSubmit: true,
    validation: {
      NOMBRE_AREA: {
        required: { value: true, message: 'Debe ingresar el nombre del área' }
      }
    }
    
  };

  // ==========================================
  // 3. PARÁMETROS DEL COMPONENTE TABLE
  // ==========================================
  const tableComponentParameters = {
    showCount: false,
    emptyMessage: 'No hay áreas registradas',
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
    itemsPerPage: 1000,
    currentPage: 1,
    onPageChange: null
  };

  // ==========================================
  // 4. CONFIGURACIÓN DE MODALES
  // ==========================================
  const modalConfig = {
    createTitle: 'Crear Nueva Área',
    editTitle: 'Editar Área',
    size: 'medium',
    widthClass: 'w-1/2'
  };

  // ==========================================
  // 5. PROPIEDADES DEL HEADER
  // ==========================================
  const headerProps = {
    headerTitle: 'Gestión de Áreas Académicas',
    headerDescription: 'Administra las áreas académicas por sede',
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
    console.log('Operación exitosa en AREAS:', result);
  };

  const handleError = (error) => {
    console.error('Error en operación AREAS:', error);
  };

  return (
    <LayoutWithSidebar>
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
    </LayoutWithSidebar>
  );
}

export default AreasConfig;
