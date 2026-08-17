import React from 'react';
import { Navigate } from 'react-router-dom';

function ReportesIndex() {
  return <Navigate to="/configuracion/gestion_periodo/reportes/grupos" replace />;
}

export default ReportesIndex;
