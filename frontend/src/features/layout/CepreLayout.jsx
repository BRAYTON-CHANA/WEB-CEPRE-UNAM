import React from 'react';
import Layout from '@/shared/components/layout/Layout';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import CepreHeader from './header/CepreHeader';
import CepreFooter from './footer/CepreFooter';
import CepreSidebar from './sidebar/CepreSidebar';

/**
 * Layout CEPRE: header + footer CEPRE y sidebar opcional.
 * Uso: <CepreLayout>...contenido...</CepreLayout>
 *      <CepreLayout showSidebar>...contenido...</CepreLayout>
 */
const CepreLayout = ({ children, showHeader = true, showFooter = true, showSidebar = false }) => {
  const header = showHeader ? CepreHeader : null;
  const footer = showFooter ? CepreFooter : null;

  if (showSidebar) {
    return (
      <LayoutWithSidebar header={header} footer={footer} sidebar={CepreSidebar} defaultOpen={true}>
        {children}
      </LayoutWithSidebar>
    );
  }

  return (
    <Layout header={header} footer={footer}>
      {children}
    </Layout>
  );
};

export default CepreLayout;
