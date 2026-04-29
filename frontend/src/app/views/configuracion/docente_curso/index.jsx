import React from 'react';
import { Crud } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';

/**
 * Configuración de DOCENTE_CURSO
 * CRUD completo para la tabla DOCENTE_CURSO (relación N:M entre docentes y cursos)
 */
function DocenteCursoConfig() {
  // ==========================================
  // 1. CONFIGURACIÓN DE TABLA (tableConfig)
  // ==========================================
  const tableConfig = {
    tableName: 'VW_DOCENTE_CURSO',
    headers: [
      { title: 'DNI', type: 'text' },
      { title: 'NOMBRE_COMPLETO_DOCENTE', type: 'text' },
      { title: 'NOMBRE_CURSO', type: 'text' },
    ],
    boundColumn: 'ID_DOCENTE_CURSO'
  };

  // ==========================================
  // 2. CONFIGURACIÓN DE FORMULARIO (formConfig)
  // ==========================================
  const formConfig = {
    tableName: 'DOCENTE_CURSO',
    primaryKey: 'ID_DOCENTE_CURSO',
    fields: [
      { 
        name: 'ID_DOCENTE', 
        type: 'reference-select', 
        label: 'Docente', 
        required: true,
        referenceTable: 'DOCENTES',
        referenceField: 'ID_DOCENTE',
        referenceQuery: '{APELLIDOS} {NOMBRES}'
      },
     { 
        name: 'ID_CURSO', 
        type: 'function-select',
        label: 'Curso', 
        required: true,
        functionName: 'fn_cursos_disponibles_docente',
        functionParams: {
          ID_DOCENTE: '{ID_DOCENTE}',
          ID_CURSO_ACTUAL: '{ID_CURSO}'
        },
        optionalParams: ['ID_CURSO_ACTUAL'],
        valueField: 'ID_CURSO',
        labelField: '{NOMBRE_CURSO} - {CODIGO_COMPARTIDO}',
        descriptionField: '{EJE_TEMATICO}',
        statusField: 'ESTADO_CURSO',
        blocked: {
          and: [
            { field: 'ID_DOCENTE', op: '=', value: '' }
          ]
        },
        placeholder: 'Seleccione un curso (requiere docente seleccionado)',
        searchable: true
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
      submitText: 'Guardar Asignación'
    },
    validation: {
      ID_DOCENTE: {
        required: { value: true, message: 'Debe seleccionar un docente' }
      },
      ID_CURSO: {
        required: { value: true, message: 'Debe seleccionar un curso' }
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
        name: 'ID_DOCENTE',
        type: 'reference-select',
        label: 'Filtrar por Docente',
        placeholder: 'Seleccione un docente para filtrar',
        referenceTable: 'DOCENTES',
        referenceField: 'ID_DOCENTE',
        referenceQuery: '{APELLIDOS}, {NOMBRES}',
        op: '='
      },
      {
        name: 'ID_CURSO',
        type: 'reference-select',
        label: 'Filtrar por Curso',
        placeholder: 'Seleccione un curso para filtrar',
        referenceTable: 'CURSOS',
        referenceField: 'ID_CURSO',
        referenceQuery: '{NOMBRE_CURSO} ({EJE_TEMATICO})',
        op: '='
      }
    ]
  };

  // ==========================================
  // 4. PARÁMETROS DEL COMPONENTE TABLE
  // ==========================================
  const tableComponentParameters = {
    showCount: false,
    emptyMessage: 'No hay asignaciones de docente-curso registradas',
    variant: 'default',
    striped: true,
    hover: true,
    bordered: true,
    sortable: true,
    selectable: false,
    expandable: false,
    filterable: false,
    pagination: true,
    fit: false,
    itemsPerPage: 10,
    currentPage: 1,
    onPageChange: null
  };

  // ==========================================
  // 5. CONFIGURACIÓN DE MODALES
  // ==========================================
  const modalConfig = {
    createTitle: 'Crear Nueva Asignación Docente-Curso',
    editTitle: 'Editar Asignación',
    size: 'medium',
    widthClass: 'w-1/2'
  };

  // ==========================================
  // 6. PROPIEDADES DEL HEADER
  // ==========================================
  const headerProps = {
    headerTitle: 'Gestión de Cursos por Docente',
    headerDescription: 'Administra qué cursos puede enseñar cada docente',
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
    console.log('Operación exitosa en DOCENTE_CURSO:', result);
  };

  const handleError = (error) => {
    console.error('Error en operación DOCENTE_CURSO:', error);
  };

  return (
    <LayoutWithSidebar>
      <Crud
        tableConfig={tableConfig}
        formConfig={formConfig}
        tableComponentParameters={tableComponentParameters}
        menuFilters={menuFilters}
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

export default DocenteCursoConfig;
