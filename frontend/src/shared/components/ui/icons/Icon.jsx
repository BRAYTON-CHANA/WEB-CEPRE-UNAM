import React from 'react';

/**
 * Componente Icon - Renderiza iconos SVG reutilizables
 * 
 * Props:
 * - name: Nombre del icono (plus, edit, trash, eye, mail, download, more-vertical)
 * - className: Clases CSS adicionales (default: 'w-4 h-4')
 * - strokeWidth: Grosor del trazo (default: 2)
 */
const Icon = ({ 
  name, 
  className = 'w-4 h-4', 
  strokeWidth = 2 
}) => {
  const icons = {
    plus: (
      <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
    ),
    edit: (
      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
    ),
    trash: (
      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
    ),
    eye: (
      <>
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    mail: (
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
    ),
    download: (
      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'more-vertical': (
      <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" strokeLinecap="round" strokeLinejoin="round" />
    ),
    check: (
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    ),
    close: (
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    )
  };

  if (!icons[name]) {
    console.warn(`Icon "${name}" no encontrado`);
    return null;
  }

  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      viewBox="0 0 24 24"
    >
      {icons[name]}
    </svg>
  );
};

export default Icon;
