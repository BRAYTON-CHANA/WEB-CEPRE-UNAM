import React, { useState } from 'react';
import { ConfigLayout } from '@/features/layout';
import ConvocatoriasPanel from './ConvocatoriasPanel';
import ManageConvocatoriaPanel from './ManageConvocatoriaPanel';

/**
 * Convocatorias — thin wrapper.
 * Switcha entre lista de convocatorias (página 1) y manejo de una convocatoria
 * específica (página 2: sedes → cursos → plazas) por estado local.
 */
function ConvocatoriasConfig() {
  const [selectedConvocatoria, setSelectedConvocatoria] = useState(null);

  return (
    <ConfigLayout>
      {selectedConvocatoria ? (
        <ManageConvocatoriaPanel
          convocatoria={selectedConvocatoria}
          onBack={() => setSelectedConvocatoria(null)}
        />
      ) : (
        <ConvocatoriasPanel onManage={setSelectedConvocatoria} />
      )}
    </ConfigLayout>
  );
}

export default ConvocatoriasConfig;
