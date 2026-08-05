import React, { useState } from 'react';
import SortIndicator from './SortIndicator';
import MenuContext from './MenuContext';

/**
 * Componente central que coordina los controles de tabla (solo sort)
 */
const TableControls = ({ sortable, header, dataType, sortConfig, onSortSelect }) => {
  const [activeMenu, setActiveMenu] = useState(null);
  return (
    <MenuContext.Provider value={{ activeMenu, setActiveMenu }}>
      <SortIndicator
        sortable={sortable}
        header={header}
        sortConfig={sortConfig}
        onSortSelect={onSortSelect}
        dataType={dataType}
      />
    </MenuContext.Provider>
  );
};

export default TableControls;
