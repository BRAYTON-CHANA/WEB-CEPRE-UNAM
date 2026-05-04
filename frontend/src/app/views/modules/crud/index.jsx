import React from 'react';
import { Crud } from '@/features/crud';
import Layout from '@/shared/components/layout/Layout';

/**
 * Módulo CRUD
 * Página principal que usa el componente Crud reutilizable
 * 
 * TODOS los parámetros configurables están definidos abajo con ejemplos
 * Simplemente modifica los valores según tus necesidades
 */
function CrudPage() {
  // ==========================================
  // 1. CONFIGURACIÓN DE TABLA (tableConfig)
  // ==========================================
  const tableConfig = {
    // Nombre de la tabla/vista para mostrar datos (puede ser un VIEW)
    tableName: 'areas',
    
    // Headers para la tabla - define qué columnas se MUESTRAN
    headers: [
      { title: 'ID_AREA', type: 'number' },
      { title: "NOMBRE_AREA",type: 'string'},
    ],
    
    // Columna que identifica el registro (para selección y acciones)
    boundColumn: 'ID_AREA'
  };

  // ==========================================
  // 2. CONFIGURACIÓN DE FORMULARIO (formConfig)
  // ==========================================
  const formConfig = {
    // Nombre de la tabla para escritura (puede ser diferente a tableConfig.tableName)
    // Útil cuando CRUD muestra un VIEW pero form escribe a TABLE real
    tableName: 'areas',
    
    // Clave primaria para identificar registros
    primaryKey: 'ID_AREA',
    
    // Campos del formulario - define qué campos se EDITAN
    fields: [
      { 
        name: 'NOMBRE_AREA', 
        type: 'text', 
        label: 'Nombre del Área', 
        required: true 
      }
    ],
    
    // Layout opcional para multi-step (null = single page)
    layout: null,
    
    // Configuración multi-step (solo aplica si layout !== null)
    multiStep: {
      showDots: true,
      persistData: false,
      nextText: 'Siguiente',
      prevText: 'Atrás',
      submitText: 'Guardar Registro'
    }
  };

  // ==========================================
  // 3. PARÁMETROS DEL COMPONENTE TABLE
  // ==========================================
  const tableComponentParameters = {
    // Visual y Presentación
    showCount: false,           // Mostrar numeración de filas
    emptyMessage: 'No hay datos disponibles',
    variant: 'default',        // 'default' | 'minimal'
    striped: false,             // Filas alternadas
    hover: true,                // Efecto hover en filas
    bordered: true,             // Bordes visibles
    
    // Funcionalidades
    sortable: true,             // Permitir ordenamiento
    selectable: false,          // Permitir selección de filas
    expandable: false,          // Permitir expansión de filas
    filterable: true,           // Permitir filtros
    pagination: false,          // Habilitar paginación
    
    // Control de Ancho
    fit: false,                 // Ajustar ancho al contenido
    
    // Paginación (si pagination = true)
    itemsPerPage: 10,
    currentPage: 1,
    onPageChange: null          // Callback al cambiar página
  };

  // ==========================================
  // 4. CONFIGURACIÓN DE MODALES
  // ==========================================
  const modalConfig = {
    createTitle: 'Crear Nuevo Registro',
    editTitle: 'Editar Registro',
    size: 'large'                // 'small' | 'medium' | 'large'
  };

  // ==========================================
  // 5. PROPIEDADES DEL HEADER
  // ==========================================
  const headerProps = {
    headerTitle: 'Gestión de Registros',
    headerDescription: 'Administra los registros del sistema',
    titleClassName: '',
    descriptionClassName: '',
    // Acciones adicionales en el header
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
    // Personalizar acción crear
    // create: {
    //   enabled: true,
    //   label: 'Nuevo Registro',
    //   icon: 'plus',
    //   className: 'bg-green-600 text-white'
    // },
    
    // Personalizar acción editar
    // edit: { ... },
    
    // Personalizar acción eliminar
    // delete: { ... },
    
    // Acciones personalizadas adicionales
    custom: []
  };

  // ==========================================
  // 8. CALLBACKS
  // ==========================================
  const handleSuccess = (result) => {
    console.log('Operación exitosa:', result);
    // Aquí puedes agregar lógica adicional después de crear/editar
  };

  const handleError = (error) => {
    console.error('Error en operación:', error);
    // Aquí puedes agregar manejo de errores personalizado
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

export default CrudPage;
