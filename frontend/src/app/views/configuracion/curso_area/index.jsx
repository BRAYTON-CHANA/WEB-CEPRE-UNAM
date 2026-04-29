import React from 'react';
import { Crud } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';

/**
 * Configuración de CURSO_AREA
 * CRUD completo para la tabla CURSO_AREA (relación N:M entre cursos y áreas)
 */
function CursoAreaConfig() {
  // ==========================================
  // 1. CONFIGURACIÓN DE TABLA (tableConfig)
  // ==========================================
  const tableConfig = {
    tableName: 'VW_CURSO_AREA',
    headers: [
      
      { title: 'CODIGO_UNICO', type: 'string' },
      { title: 'NOMBRE_CURSO', type: 'string' },
      { title: 'EJE_TEMATICO', type: 'string' },
     
    ],
    boundColumn: 'ID_CURSO_AREA'
  };

  // ==========================================
  // 2. CONFIGURACIÓN DE FORMULARIO (formConfig)
  // ==========================================
  const formConfig = {
    tableName: 'CURSO_AREA',
    primaryKey: 'ID_CURSO_AREA',
    fields: [
      { 
        name: 'ID_AREA', 
        type: 'reference-select', 
        label: 'Área Académica', 
        required: true,
        referenceTable: 'AREAS',
        referenceField: 'ID_AREA',
        referenceQuery: '{NOMBRE_AREA}',
        placeholder: 'Seleccione un área académica'
      },
      { 
        name: 'ID_CURSO',
        type: 'function-select',
        label: 'Curso',
        functionName: 'fn_cursos_disponibles_area',
        functionParams: {
          ID_AREA: '{ID_AREA}',
          ID_CURSO_ACTUAL: '{ID_CURSO}'
        },
        optionalParams: ['ID_CURSO_ACTUAL'],
        valueField: 'ID_CURSO', 
        labelField: '{NOMBRE_CURSO} - {CODIGO_COMPARTIDO}',
        descriptionField: '{EJE_TEMATICO}',
        blocked: {
          and: [{ field: 'ID_AREA', op: 'empty' }]
        },
        searchable: true
      },
      { 
        name: 'CODIGO_UNICO', 
        type: 'text', 
        label: 'Código Único', 
        required: true,
        placeholder: 'Ej: MAT-I-SOC'
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
      submitText: 'Guardar Asignación'
    },
    confirmSubmit: true,
    validation: {
      ID_CURSO: {
        required: { value: true, message: 'Debe seleccionar un curso' }
      },
      ID_AREA: {
        required: { value: true, message: 'Debe seleccionar un área' }
      },
      CODIGO_UNICO: {
        required: { value: true, message: 'El código único es requerido' }
      }
    }
  };

  // ==========================================
  // 3. MENÚ DE FILTROS (menuFilters)
  // ==========================================
  const menuFilters = {
    enabled: true,
    position: 'top',
    collapsible: false,
    defaultExpanded: true,
    fields: [
      {
        name: 'ID_AREA',
        type: 'reference-select',
        label: 'Filtrar por Área',
        placeholder: 'Seleccione un área para filtrar',
        referenceTable: 'AREAS',
        referenceField: 'ID_AREA',
        referenceQuery: '{NOMBRE_AREA}',
        op: '='  // Operador por defecto
      }
    ]
  };

  // ==========================================
  // 4. PARÁMETROS DEL COMPONENTE TABLE
  // ==========================================
  const tableComponentParameters = {
    showCount: false,
    emptyMessage: 'No hay asignaciones de curso-área registradas',
    variant: 'default',
    striped: true,
    hover: true,
    bordered: true,
    sortable: true,
    selectable: false,
    expandable: false,
    filterable: false,
    pagination: false,
     groupable:{
      active: true,
      field: 'NOMBRE_AREA',
    },
    fit: false,
    itemsPerPage: 1000,
    currentPage: 1,
    onPageChange: null,
    
  };

  // ==========================================
  // 5. CONFIGURACIÓN DE MODALES
  // ==========================================
  const modalConfig = {
    createTitle: 'Crear Nueva Asignación Curso-Área',
    editTitle: 'Editar Asignación',
    size: 'medium',
    widthClass: 'w-1/2'
  };

  // ==========================================
  // 6. PROPIEDADES DEL HEADER
  // ==========================================
  const headerProps = {
    headerTitle: 'Gestión de Cursos por Área',
    headerDescription: 'Administra la asignación de cursos a las diferentes áreas académicas',
    titleClassName: '',
    descriptionClassName: '',
    actions: []
  };

  // ==========================================
  // 7. PROPIEDADES DEL FOOTER
  // ==========================================
  const footerProps = {
    footerTitle: '',
    footerDescription: '',
    footerTitleClassName: '',
    footerDescriptionClassName: '',
    actions: []
  };

  // ==========================================
  // 8. ACCIONES PERSONALIZADAS
  // ==========================================
  const actions = {
    custom: []
  };

  // ==========================================
  // 9. CALLBACKS
  // ==========================================
  const handleSuccess = (result) => {
    console.log('Operación exitosa en CURSO_AREA:', result);
  };

  const handleError = (error) => {
    console.error('Error en operación CURSO_AREA:', error);
  };

  return (
    <LayoutWithSidebar>
      <Crud
        tableConfig={tableConfig}
        formConfig={formConfig}
        menuFilters={menuFilters}
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

export default CursoAreaConfig;
