import React from 'react';
import { FILE_ICONS, FILE_COLORS } from '../../../constants/fileConstants';

/**
 * Componente FileIcon - Muestra iconos representativos para diferentes tipos de archivo
 * 
 * Props:
 * - type: Tipo de archivo (image, pdf, word, excel, etc.)
 * - size: Tamaño del icono (sm, md, lg, xl)
 * - className: Clases CSS adicionales
 */
const FileIcon = ({ 
  type, 
  size = 'md', 
  className = '',
  color = null 
}) => {
  // Tamaños predefinidos
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  // Usar color específico o color por defecto del tipo
  const iconColor = color || (type && FILE_COLORS[type]) || FILE_COLORS.gray;
  
  // Obtener el SVG del icono
  const iconSvg = type && FILE_ICONS[type] ? FILE_ICONS[type] : FILE_ICONS.file;

  return (
    <div 
      className={`
        inline-flex items-center justify-center
        rounded-lg border
        ${iconColor}
        ${sizes[size]}
        ${className}
      `}
    >
      <div dangerouslySetInnerHTML={{ __html: iconSvg }} />
    </div>
  );
};

export default FileIcon;
