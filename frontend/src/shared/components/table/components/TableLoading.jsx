import React from 'react';
import { TABLE_CLASSES } from '../constants/tableConstants';

/**
 * Componente para mostrar estado de carga en la tabla
 */
const TableLoading = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className={TABLE_CLASSES.loading}></div>
    </div>
  );
};

export default TableLoading;
