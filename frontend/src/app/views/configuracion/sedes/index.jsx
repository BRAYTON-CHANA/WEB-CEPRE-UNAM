import React from 'react';
import { Crud } from '@/features/crud';
import Layout from '@/shared/components/layout/Layout';
import ConfigSidebar from '../ConfigSidebar';

/**
 * Configuración de SEDES
 * CRUD completo para la tabla SEDES
 */
function SedesConfig() {
  // ==========================================
  // 1. CONFIGURACIÓN DE TABLA (tableConfig)
  // ==========================================
  const tableConfig = {
    tableName: 'SEDES',
    headers: [
      { title: 'NOMBRE_SEDE', type: 'string' },
      { title: 'ACTIVO', type: 'boolean' }
    ],
    boundColumn: 'ID_SEDE'
  };

  // ==========================================
  // 2. CONFIGURACIÓN DE FORMULARIO (formConfig)
  // ==========================================
  const formConfig = {
    tableName: 'SEDES',
    primaryKey: 'ID_SEDE',
    fields: [
      { 
        name: 'NOMBRE_SEDE', 
        type: 'text', 
        label: 'Nombre de Sede', 
        required: true,
        placeholder: 'Ej: Sede Central, Sede Norte, etc.'
      },
      {
        name: 'ACTIVO',
        type: 'boolean',
        label: 'Activo',
        required: true,
        defaultValue: true
      }
    ],
    layout: null,
    multiStep: {
      showDots: true,
      persistData: false,
      nextText: 'Siguiente',
      prevText: 'Atrás',
      submitText: 'Guardar Sede'
    },
    confirmSubmit: true,
    confirmConfig: {
      title: 'Confirmar acción',
      message: '¿Estás seguro de que deseas realizar esta acción?',
      confirmText: 'Sí, Continuar',
      cancelText: 'Cancelar'
    },
    validation: {
      NOMBRE_SEDE: {
        required: { value: true, message: 'El nombre de la sede es obligatorio' }
      }
    }
  };

  // ==========================================
  // 3. PARÁMETROS DEL COMPONENTE TABLE
  // ==========================================
  const tableComponentParameters = {
    showCount: false,
    emptyMessage: 'No hay sedes registradas',
    variant: 'default',
    striped: true,
    hover: true,
    bordered: true,
    sortable: true,
    selectable: false,
    expandable: false,
    filterable: true,
    pagination: false,
    fit: false,
    itemsPerPage: 10,
    currentPage: 1,
    onPageChange: null
  };

  // ==========================================
  // 4. CONFIGURACIÓN DE MODALES
  // ==========================================
  const modalConfig = {
    createTitle: 'Crear Nueva Sede',
    editTitle: 'Editar Sede',
    size: 'medium',
    widthClass: 'w-1/2'
  };

  // ==========================================
  // 5. PROPIEDADES DEL HEADER
  // ==========================================
  const headerProps = {
    headerTitle: 'Gestión de Sedes',
    headerDescription: 'Administra las sedes académicas del sistema',
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
    console.log('Operación exitosa en SEDES:', result);
  };

  const handleError = (error) => {
    console.error('Error en operación SEDES:', error);
  };

  return (
    <Layout>
      <div className="flex">
        <ConfigSidebar />
        <div className="flex-1">
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
        </div>
      </div>
    </Layout>
  );
}

export default SedesConfig;
