import React from 'react';
import { Crud } from '@/features/crud';
import Layout from '@/shared/components/layout/Layout';

/**
 * Configuración de DOCENTES
 * CRUD completo para la tabla DOCENTES
 */
function DocentesConfig() {
  // ==========================================
  // 1. CONFIGURACIÓN DE TABLA (tableConfig)
  // ==========================================
  const tableConfig = {
    tableName: 'DOCENTES',
    headers: [

      { title: 'DNI', type: 'string' },
      { title: 'APELLIDOS', type: 'string' },
      { title: 'NOMBRES', type: 'string' },
      { title: 'TIPO_DOCENTE', type: 'string' },
      //{ title: 'INICIO_ORDINARIO', type: 'date' },
      //{ title: 'TERMINO_ORDINARIO', type: 'date' },
      { title: 'TELEFONO', type: 'string' },
      { title: 'EMAIL', type: 'string' },
      { title: 'ACTIVO', type: 'boolean' }
    ],
    boundColumn: 'ID_DOCENTE'
  };

  // ==========================================
  // 2. CONFIGURACIÓN DE FORMULARIO (formConfig)
  // ==========================================
  const formConfig = {
    tableName: 'DOCENTES',
    primaryKey: 'ID_DOCENTE',
    fields: [
      { 
        name: 'DNI', 
        type: 'text', 
        label: 'DNI', 
        required: true,
        placeholder: '8 dígitos numéricos',
        maxLength: 8
      },
      { 
        name: 'NOMBRES', 
        type: 'text', 
        label: 'Nombres', 
        required: true,
        placeholder: 'Nombres'
      },
      { 
        name: 'APELLIDOS', 
        type: 'text', 
        label: 'Apellidos', 
        required: true,
        placeholder: 'Apellidos'
      },
      { 
        name: 'TIPO_DOCENTE', 
        type: 'select', 
        label: 'Tipo de Docente', 
        required: true,
        options: [
          { value: 'ordinario', label: 'Ordinario' },
          { value: 'servicio', label: 'Servicio' }
        ],
        defaultValue: 'servicio'
      },
      { 
        name: 'INICIO_ORDINARIO', 
        type: 'date', 
        label: 'Inicio de Servicio', 
        required: true,
        hidden: {
          and: [
            { field: 'TIPO_DOCENTE', op: '=', value: 'servicio' }
          ]
        },
        hiddenValue: ''
      },
      { 
        name: 'TERMINO_ORDINARIO', 
        type: 'date', 
        label: 'Término de Servicio', 
        required: false,
        hidden: {
          and: [
            { field: 'TIPO_DOCENTE', op: '=', value: 'servicio' }
          ]
        },
        hiddenValue: ''
      },
      { 
        name: 'TELEFONO', 
        type: 'text', 
        label: 'Teléfono', 
        required: false,
        placeholder: 'Número de contacto'
      },
      { 
        name: 'EMAIL', 
        type: 'email', 
        label: 'Correo Electrónico', 
        required: false,
        placeholder: 'correo@ejemplo.com'
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
    confirmSubmit: true,
    multiStep: {
      showDots: true,
      persistData: false,
      nextText: 'Siguiente',
      prevText: 'Atrás',
      submitText: 'Guardar Docente'
    },
    validation: {
      DNI:{
        required: { value: true, message: 'El DNI es requerido' }
      },
      NOMBRES:{
        required: { value: true, message: 'Los nombres son requeridos' }
      },
      APELLIDOS:{
        required: { value: true, message: 'Los apellidos son requeridos' }
      },
      TIPO_DOCENTE:{
        required: { value: true, message: 'El tipo de docente es requerido' }
      },
      INICIO_ORDINARIO: {
        required: { value: true, message: 'Debe ingresar la fecha de inicio para docentes ordinarios' }
      }
    }
  };

  // ==========================================
  // 3. PARÁMETROS DEL COMPONENTE TABLE
  // ==========================================
  const tableComponentParameters = {
    showCount: false,
    emptyMessage: 'No hay docentes registrados',
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
    createTitle: 'Crear Nuevo Docente',
    editTitle: 'Editar Docente',
    size: 'medium',
    widthClass: 'w-1/2'
  };

  // ==========================================
  // 5. PROPIEDADES DEL HEADER
  // ==========================================
  const headerProps = {
    headerTitle: 'Gestión de Docentes',
    headerDescription: 'Administra los docentes del sistema CEPRE',
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
    console.log('Operación exitosa en DOCENTES:', result);
  };

  const handleError = (error) => {
    console.error('Error en operación DOCENTES:', error);
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

export default DocentesConfig;
