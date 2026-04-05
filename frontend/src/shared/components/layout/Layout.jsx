import React from 'react';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ 
  children, 
  showHeader = true, 
  showFooter = true,
  customHeader = null,
  customFooter = null
}) => {
  // Determinar qué header usar
  const HeaderComponent = customHeader || Header;
  
  // Determinar qué footer usar
  const FooterComponent = customFooter || Footer;
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showHeader && <HeaderComponent />}
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <FooterComponent />}
    </div>
  );
};

export default Layout;
