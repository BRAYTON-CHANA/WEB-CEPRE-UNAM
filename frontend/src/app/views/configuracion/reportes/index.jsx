import React from 'react';
import { Navigate } from 'react-router-dom';

function ReportesIndex() {
  return <Navigate to="/configuracion/reportes/grupos" replace />;
}

export default ReportesIndex;
