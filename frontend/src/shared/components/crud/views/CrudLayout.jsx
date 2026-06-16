import React from 'react';
import CrudHeader from './CrudHeader';
import CrudTable from './CrudTable';
import CrudFooter from './CrudFooter';

/**
 * CrudLayout - Componente de presentación para CRUD
 * Solo renderiza Header + Table + Footer, sin lógica de negocio
 * 
 * @param {string} tableName - Nombre de la tabla
 * @param {Array} headers - Headers para la tabla
 * @param {Object} headerProps - Props para CrudHeader
 * @param {Object} footerProps - Props para CrudFooter
 * @param {Object} tableActions - Acciones para la tabla
 * @param {number} refreshTrigger - Trigger para refresh
 * @param {Object} tableComponentParameters - Props para el componente Table
 * @param {Object} menuFilters - Configuración de filtros dinámicos
 */
function CrudLayout({ 
  tableName, 
  headers = [], 
  headerProps = {}, 
  footerProps = {},
  tableActions = {},
  refreshTrigger = 0,
  tableComponentParameters = {},
  menuFilters = null  // ← NUEVO
}) {
  return (
    <>
      {/* Header del CRUD - arriba de la tabla */}
      <CrudHeader {...headerProps} />
      
      {/* Contenido principal - Tabla CRUD */}
      <CrudTable 
        tableName={tableName} 
        headers={headers}
        tableActions={tableActions}
        refreshTrigger={refreshTrigger}
        tableComponentParameters={tableComponentParameters}
        menuFilters={menuFilters}  // ← PASAR a CrudTable
      />
      
      {/* Footer del CRUD - abajo de la tabla */}
      <CrudFooter {...footerProps} />
    </>
  );
}

export default CrudLayout;
