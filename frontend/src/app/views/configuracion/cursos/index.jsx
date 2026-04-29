import React from 'react';
import { Crud } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';

/**
 * Configuración de CURSOS
 * CRUD completo para la tabla CURSOS
 */
function CursosConfig() {
  // ==========================================
  // 1. CONFIGURACIÓN DE TABLA (tableConfig)
  // ==========================================
  const tableConfig = {
    tableName: 'CURSOS',
    headers: [
      { title: 'CODIGO_COMPARTIDO', type: 'string' },
      { title: 'NOMBRE_CURSO', type: 'string' },

      { title: 'ACTIVO', type: 'boolean' }
    ],
    boundColumn: 'ID_CURSO'
  };

  // ==========================================
  // 2. CONFIGURACIÓN DE FORMULARIO (formConfig)
  // ==========================================
  const formConfig = {
    tableName: 'CURSOS',
    primaryKey: 'ID_CURSO',
    fields: [
      
      { 
        name: 'CODIGO_COMPARTIDO', 
        type: 'text', 
        label: 'Código Compartido', 
        required: true,
        placeholder: 'Ej: MAT-I, RM'
      },
      { 
        name: 'NOMBRE_CURSO', 
        type: 'text', 
        label: 'Nombre del Curso', 
        required: true,
        placeholder: 'Ej: MATEMATICA I, RAZONAMIENTO MATEMATICO'
      },
      { 
        name: 'EJE_TEMATICO', 
        type: 'unique-select', 
        label: 'Eje Temático', 
        required: true,
        tableName: 'CURSOS',
        columnName: 'EJE_TEMATICO',
        allowCreate: true,
        createTitle: 'Agregar Nuevo Eje Temático',
        searchable: false,

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
      submitText: 'Guardar Curso'
    },
    confirmSubmit: true,
    validation: {
      CODIGO_COMPARTIDO: {
        required: { value: true, message: 'El código compartido es requerido' }
      },
      NOMBRE_CURSO: {
        required: { value: true, message: 'El nombre del curso es requerido' }
      },
      EJE_TEMATICO: {
        required: { value: true, message: 'El eje temático es requerido' }
      }
    }
  };

  // ==========================================
  // 3. PARÁMETROS DEL COMPONENTE TABLE
  // ==========================================
  const tableComponentParameters = {
    showCount: false,
    emptyMessage: 'No hay cursos registrados',
    variant: 'default',
    striped: true,
    hover: true,
    bordered: true,
    sortable: true,
    selectable: false,
    expandable: false,
    filterable: true,
    groupable:{
      active: true,
      field: 'EJE_TEMATICO',
    },
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
    createTitle: 'Crear Nuevo Curso',
    editTitle: 'Editar Curso',
    size: 'medium',
    widthClass: 'w-1/2'
  };

  // ==========================================
  // 5. PROPIEDADES DEL HEADER
  // ==========================================
  const headerProps = {
    headerTitle: 'Gestión de Cursos',
    headerDescription: 'Administra los cursos académicos del CEPRE',
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
    console.log('Operación exitosa en CURSOS:', result);
  };

  const handleError = (error) => {
    console.error('Error en operación CURSOS:', error);
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

export default CursosConfig;
