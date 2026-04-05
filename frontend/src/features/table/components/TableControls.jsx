import React, { useState } from 'react';
import FilterIndicator from './FilterIndicator';
import SortIndicator from './SortIndicator';
import MenuContext from './MenuContext';

/**
 * Componente central que coordina los controles de tabla
 * Ahora utiliza componentes separados para sort y filter
 */
const TableControls = ({ 
  sortable,
  filterable,
  header, 
  uniqueValues,
  originalValues,
  activeFilters, 
  onFilterChange,
  dataType,
  sortConfig,
  onSortSelect
}) => {
  const [activeMenu, setActiveMenu] = useState(null);
  
  return (
    <MenuContext.Provider value={{ activeMenu, setActiveMenu }}>
      <div className="flex items-center gap-3">
      <SortIndicator
        sortable={sortable}
        header={header}
        sortConfig={sortConfig}
        onSortSelect={onSortSelect}
        dataType={dataType}
      />
      <FilterIndicator
        filterable={filterable}
        header={header}
        uniqueValues={uniqueValues}
        originalValues={originalValues}
        activeFilters={activeFilters}
        onFilterChange={onFilterChange}
        dataType={dataType}
      />
      </div>
    </MenuContext.Provider>
  );
};

export default TableControls;
