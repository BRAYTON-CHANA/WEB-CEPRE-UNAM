import React from 'react';

const Layout = ({ 
  children, 
  header = null,
  footer = null,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {header && React.createElement(header)}
      <main className="flex-grow">
        {children}
      </main>
      {footer && React.createElement(footer)}
    </div>
  );
};

export default Layout;
