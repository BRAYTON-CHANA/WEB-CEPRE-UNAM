import React, { useState } from 'react';
import { ConfigLayout } from '@/features/layout';
import RequisitosHeader from '@/features/convocatorias/components/RequisitosHeader';
import PreguntasTabs from '@/features/convocatorias/requisitos/preguntas/components/PreguntasTabs';
import PreguntasSection from '@/features/convocatorias/requisitos/preguntas/components/PreguntasSection';
import DocumentosSection from '@/features/convocatorias/requisitos/documentos/components/DocumentosSection';

// Condiciones laborales fijas para las tabs
const CONDICIONES_LABORALES = [
  { value: 'CONTRATADO', label: 'Contratado' },
  { value: 'EXTERNO', label: 'Externo' },
  { value: 'ORDINARIO', label: 'Ordinario' }
];

/**
 * Página unificada: Documentos + Preguntas Docentes
 * Dos secciones una debajo de la otra.
 */
function DocumentosPreguntasDocentesConfig() {
  const [activeCondicion, setActiveCondicion] = useState('CONTRATADO');

  return (
    <ConfigLayout>
      <div className="px-8 py-8 space-y-8 pb-12">
        <RequisitosHeader />
        {/* Tabs compartidos por Preguntas y Documentos */}
        <PreguntasTabs
          condiciones={CONDICIONES_LABORALES}
          activeCondicion={activeCondicion}
          onChange={setActiveCondicion}
        />
        <PreguntasSection activeCondicion={activeCondicion} />
        <DocumentosSection activeCondicion={activeCondicion} />
      </div>
    </ConfigLayout>
  );
}

export default DocumentosPreguntasDocentesConfig;
