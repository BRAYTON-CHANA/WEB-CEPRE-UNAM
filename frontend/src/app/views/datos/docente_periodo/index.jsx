import React from 'react';
import { Crud } from '@/features/crud';
import Layout from '@/shared/components/layout/Layout';

/**
 * Configuración de DOCENTE_PERIODO
 * CRUD completo para la tabla DOCENTE_PERIODO (asignación de docentes a períodos)
 */
function DocentePeriodoConfig() {
  // ==========================================
  // 1. CONFIGURACIÓN DE TABLA (tableConfig)
  // ==========================================
  const tableConfig = {
    tableName: 'VW_DOCENTE_PERIODO',
    headers: [
      { title: 'CODIGO_PERIODO', type: 'text' },
      { title: 'NOMBRE_SEDE', type: 'text' },
      //{ title: 'CODIGO_COMPARTIDO', type: 'text' },
      { title: 'NOMBRE_CURSO', type: 'text' },
      { title: 'NOMBRE_COMPLETO_DOCENTE', type: 'text' },
      { title: 'IDENTIFICADOR_DOCENTE', type: 'text' },
      { title : 'PAGO_POR_HORA', type:'text'},
      { title: 'ACTIVO', type: 'boolean' },
    ],
    boundColumn: 'ID_DOCENTE_PERIODO'
  };

  // ==========================================
  // 2. CONFIGURACIÓN DE FORMULARIO (formConfig)
  // ==========================================
  const formConfig = {
    tableName: 'DOCENTE_PERIODO',
    primaryKey: 'ID_DOCENTE_PERIODO',
    fields: [
      { 
        name: 'ID_PERIODO', 
        type: 'reference-select', 
        label: 'Período', 
        required: true,
        referenceTable: 'PERIODOS',
        referenceField: 'ID_PERIODO',
        referenceQuery: '{CODIGO_PERIODO}'
      },
      { 
        name: 'ID_SEDE', 
        type: 'reference-select', 
        label: 'Sede', 
        required: true,
        referenceTable: 'SEDES',
        referenceField: 'ID_SEDE',
        referenceQuery: '{NOMBRE_SEDE}'
      },
      { 
        name: 'ID_CURSO', 
        type: 'reference-select', 
        label: 'Curso', 
        required: true,
        referenceTable: 'CURSOS',
        referenceField: 'ID_CURSO',
        referenceQuery: '{CODIGO_COMPARTIDO} - {NOMBRE_CURSO}'
      },
      {
        name: 'ID_DOCENTE',
        type: 'function-select',
        label: 'Docente',
        functionName: 'fn_docentes_disponibles_periodo',
        functionParams: {
          ID_PERIODO: '{ID_PERIODO}',
          ID_CURSO: '{ID_CURSO}',
          ID_DOCENTE_ACTUAL: '{ID_DOCENTE}'
        },
        optionalParams: ['ID_DOCENTE_ACTUAL'],
        valueField: 'ID_DOCENTE',
        labelField: '{APELLIDOS}, {NOMBRES}',
        descriptionField: '{DNI}',
        statusField: 'ESTADO',
        blocked: {
          and: [
            { field: 'ID_PERIODO', op: '=', value: '' },
            { field: 'ID_CURSO', op: '=', value: '' }
          ]
        },
        placeholder: 'Seleccione un docente (requiere período y curso seleccionados)',
        searchable: true
      },
      { 
        name: 'IDENTIFICADOR_DOCENTE', 
        type: 'text', 
        label: 'Identificador del Docente', 
        required: true,
        placeholder: 'Ej: MAT-I, MAT-II, etc.'
      },
      { 
        name: 'PAGO_POR_HORA', 
        type: 'float', 
        label: 'Pago por Hora', 
        required: false,
        placeholder: ''
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
      ID_PERIODO: {
        required: { value: true, message: 'Debe seleccionar un período' }
      },
      IDENTIFICADOR_DOCENTE: {
        required: { value: true, message: 'El identificador es requerido' }
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
        name: 'ID_PERIODO',
        type: 'reference-select',
        label: 'Filtrar por Período',
        placeholder: 'Seleccione un período para filtrar',
        referenceTable: 'PERIODOS',
        referenceField: 'ID_PERIODO',
        referenceQuery: '{CODIGO_PERIODO}',
        op: '='
      },
      {
        name: 'ID_SEDE',
        type: 'reference-select',
        label: 'Filtrar por Sede',
        placeholder: 'Seleccione una sede para filtrar',
        referenceTable: 'SEDES',
        referenceField: 'ID_SEDE',
        referenceQuery: '{NOMBRE_SEDE}',
        op: '='
      },
      {
        name: 'ID_CURSO',
        type: 'reference-select',
        label: 'Filtrar por Curso',
        placeholder: 'Seleccione un curso para filtrar',
        referenceTable: 'CURSOS',
        referenceField: 'ID_CURSO',
        referenceQuery: '{CODIGO_COMPARTIDO} - {NOMBRE_CURSO}',
        op: '='
      }
    ]
  };

  // ==========================================
  // 4. PARÁMETROS DEL COMPONENTE TABLE
  // ==========================================
  const tableComponentParameters = {
    showCount: false,
    emptyMessage: 'No hay asignaciones de docente-período registradas',
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
    itemsPerPage: 1000,
    currentPage: 1,
    onPageChange: null
  };

  // ==========================================
  // 5. CONFIGURACIÓN DE MODALES
  // ==========================================
  const modalConfig = {
    createTitle: 'Crear Nueva Asignación Docente-Período',
    editTitle: 'Editar Asignación',
    size: 'medium',
    widthClass: 'w-1/2'
  };

  // ==========================================
  // 6. PROPIEDADES DEL HEADER
  // ==========================================
  const headerProps = {
    headerTitle: 'Gestión de Docentes por Período',
    headerDescription: 'Administra qué docentes están asignados a cada período con su identificador',
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
    console.log('Operación exitosa en DOCENTE_PERIODO:', result);
  };

  const handleError = (error) => {
    console.error('Error en operación DOCENTE_PERIODO:', error);
  };

  return (
    <Layout>
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
    </Layout>
  );
}

export default DocentePeriodoConfig;
