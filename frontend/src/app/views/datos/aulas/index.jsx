import React from 'react';
import { Crud } from '@/features/crud';
import Layout from '@/shared/components/layout/Layout';

/**
 * Configuración de AULAS
 * CRUD completo para la tabla AULAS
 */
function AulasConfig() {
  // ==========================================
  // 1. CONFIGURACIÓN DE TABLA (tableConfig)
  // ==========================================
  const tableConfig = {
    tableName: 'VW_AULAS_SEDES',
    headers: [
      { title: 'NOMBRE_SEDE', type: 'string' },
      { title: 'NOMBRE_AULA', type: 'string' },
      { title: 'UBICACION', type: 'string' },
      { title: 'TIPO', type: 'string' },
      { title: 'CAPACIDAD', type: 'number' },
      { title: 'ACTIVO_AULA', type: 'boolean' }
    
    ],
    boundColumn: 'ID_AULA'
  };

  // ==========================================
  // 2. CONFIGURACIÓN DE FORMULARIO (formConfig)
  // ==========================================
  const formConfig = {
    tableName: 'AULAS',
    primaryKey: 'ID_AULA',
    fields: [
      {
        name: 'ID_SEDE',
        type: 'reference-select',
        label: 'Sede',
        required: true,
        referenceTable: 'SEDES',
        referenceField: 'ID_SEDE',
        referenceQuery: '{NOMBRE_SEDE}',
        referenceFilters: [
          { field: 'ACTIVO', op: '=', value: 1 }
        ],
        placeholder: 'Seleccione una sede'
      },
      { 
        name: 'NOMBRE_AULA', 
        type: 'text', 
        label: 'Nombre del Aula', 
        required: true,
        placeholder: 'Ej: Aula 101, Laboratorio 1, etc.'
      },
      { 
        name: 'UBICACION', 
        type: 'text', 
        label: 'Ubicación', 
        required: false,
        placeholder: 'Ej: Pabellón A, 1er Piso'
      },
      { 
        name: 'TIPO', 
        type: 'select', 
        label: 'Tipo de Aula', 
        required: true,
        options: [
          { value: 'presencial', label: 'Presencial' },
          { value: 'virtual', label: 'Virtual' },
          { value: 'hibrida', label: 'Híbrida' }
        ],
        defaultValue: 'presencial'
      },
      {
        name: 'ENLACE_VIRTUAL',
        type: 'text',
        label: 'Enlace Virtual',
        placeholder: 'URL para aulas virtuales o híbridas',
        blocked: {
          and: [
            { field: 'TIPO', op: '=', value: 'presencial' }
          ],
          clearOnBlock: true
        }
      },
      { 
        name: 'CAPACIDAD', 
        type: 'number', 
        label: 'Capacidad', 
        required: true,
        placeholder: 'Número de estudiantes',
        min: 1
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
      submitText: 'Guardar Aula'
    },
    validation: {
      ID_SEDE: {
        required: { value: true, message: 'Debe seleccionar una sede' }
      },
      NOMBRE_AULA: {
        required: { value: true, message: 'Debe ingresar el nombre del aula' }
      },
      TIPO: {
        required: { value: true, message: 'Debe seleccionar un tipo de aula' }
      },
      CAPACIDAD: {
        required: { value: true, message: 'Debe ingresar la capacidad del aula' },
        min: { value: 1, message: 'La capacidad debe ser mayor a 0' }
      }
    }
  };

  // ==========================================
  // 3. PARÁMETROS DEL COMPONENTE TABLE
  // ==========================================
  const tableComponentParameters = {
    showCount: false,
    emptyMessage: 'No hay aulas registradas',
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
    createTitle: 'Crear Nueva Aula',
    editTitle: 'Editar Aula',
    size: 'medium',
    widthClass: 'w-1/2'
  };

  // ==========================================
  // 5. PROPIEDADES DEL HEADER
  // ==========================================
  const headerProps = {
    headerTitle: 'Gestión de Aulas',
    headerDescription: 'Administra las aulas físicas, virtuales e híbridas del sistema',
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
    console.log('Operación exitosa en AULAS:', result);
  };

  const handleError = (error) => {
    console.error('Error en operación AULAS:', error);
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

export default AulasConfig;
