import React from 'react';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import CepreHeader from './header/CepreHeader';
import CepreFooter from './footer/CepreFooter';
import ConfigSidebar from './sidebar/ConfigSidebar';

/**
 * Layout de configuración: header + footer CEPRE + sidebar de configuración.
 * Uso: <ConfigLayout>...contenido...</ConfigLayout>
 */
const ConfigLayout = ({ children, sidebar = ConfigSidebar }) => (
  <LayoutWithSidebar header={CepreHeader} footer={CepreFooter} sidebar={sidebar} defaultOpen={false}>
    {children}
  </LayoutWithSidebar>
);

export default ConfigLayout;
