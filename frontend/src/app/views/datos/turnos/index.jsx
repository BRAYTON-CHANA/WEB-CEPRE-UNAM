import React from 'react';
import { Crud } from '@/features/crud';
import Layout from '@/shared/components/layout/Layout';

/**
 * Configuración de TURNOS
 * CRUD completo para la tabla TURNOS
 */
function TurnosConfig() {
  // ==========================================
  // 1. CONFIGURACIÓN DE TABLA (tableConfig)
  // ==========================================
  const tableConfig = {
    tableName: 'VW_TURNOS',
    headers: [

      { title: 'NOMBRE_TURNO', type: 'string' },
      { title: 'DESCRIPCION', type: 'string' },
      { title : 'NOMBRE_HORARIO', type:'string'},
      { title : 'HORA_INICIO_JORNADA', type:'string'},
      { title : 'HORA_FIN_JORNADA', type:'string'},

    ],
    boundColumn: 'ID_TURNO'
  };

  // ==========================================
  // 2. CONFIGURACIÓN DE FORMULARIO (formConfig)
  // ==========================================
  const formConfig = {
    tableName: 'TURNOS',
    primaryKey: 'ID_TURNO',
    fields: [
      { 
        name: 'NOMBRE_TURNO', 
        type: 'text', 
        label: 'Nombre del Turno', 
        required: true,
        placeholder: 'Ej: Mañana, Tarde, Noche'
      },
      
      {
        name: 'ID_HORARIO',
        type: 'reference-select',
        label: 'Horario',
        required: true,
        referenceTable: 'HORARIOS',
        referenceField: 'ID_HORARIO',
        referenceQuery: '{NOMBRE_HORARIO}',
        referenceFilters: [
          { field: 'ACTIVO', op: '=', value: 1 }
        ],
        placeholder: 'Seleccione un horario'
      },

      { 
        name: 'DESCRIPCION', 
        type: 'text', 
        label: 'Descripción', 
        required: true,
        placeholder: 'Ej: Sábados y domingos'
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
      submitText: 'Guardar Turno'
    },
    validation: {
      NOMBRE_TURNO: {
        required: { value: true, message: 'El nombre del turno es requerido' }
      },
      DESCRIPCION: {
        required: { value: true, message: 'La descripción es requerida' }
      }
    }
  };

  // ==========================================
  // 3. PARÁMETROS DEL COMPONENTE TABLE
  // ==========================================
  const tableComponentParameters = {
    showCount: false,
    emptyMessage: 'No hay turnos registrados',
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
    createTitle: 'Crear Nuevo Turno',
    editTitle: 'Editar Turno',
    size: 'medium',
    widthClass: 'w-1/2'
  };

  // ==========================================
  // 5. PROPIEDADES DEL HEADER
  // ==========================================
  const headerProps = {
    headerTitle: 'Gestión de Turnos',
    headerDescription: 'Administra los turnos académicos (mañana, tarde, noche)',
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
    console.log('Operación exitosa en TURNOS:', result);
  };

  const handleError = (error) => {
    console.error('Error en operación TURNOS:', error);
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

export default TurnosConfig;
