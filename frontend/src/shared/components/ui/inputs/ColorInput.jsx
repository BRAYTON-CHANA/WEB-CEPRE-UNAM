import React, { useState, useRef, useEffect } from 'react';
import BaseInput from './BaseInput';
import { 
  DEFAULT_COLOR,
  COLOR_PALETTES,
  COLOR_ERROR_MESSAGES,
  isValidHex,
  hexToRgb,
  rgbToHex,
  getContrastColor
} from '@/shared/constants/colors';

/**
 * Componente ColorInput especializado
 * Combina input de texto hexadecimal con selector de colores visual
 * Sincronización bidireccional entre input y picker
 */
const ColorInput = ({ 
  // Props específicas de color
  showPicker = true,
  showPalettes = true,
  showColorPreview = true,
  allowAlpha = false,
  paletteType = 'material', // 'material', 'web', 'pastel', 'vivid', 'all'
  colorFormat = 'hex', // 'hex', 'rgb', 'hsl'
  presetColors = [],
  
  // Props de comportamiento
  validateOnBlur = true,
  showContrastInfo = true,
  
  // Pasar todas las demás props al BaseInput
  ...baseInputProps 
}) => {
  const colorPickerRef = useRef(null);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [inputValue, setInputValue] = useState(DEFAULT_COLOR);
  const [error, setError] = useState('');
  const [showPickerPanel, setShowPickerPanel] = useState(false);

  // Inicializar con valor proporcionado
  useEffect(() => {
    const initialValue = baseInputProps.value || baseInputProps.defaultValue;
    if (initialValue && isValidHex(initialValue)) {
      setColor(initialValue.toUpperCase());
      setInputValue(initialValue.toUpperCase());
    }
  }, []);

  // Validar color hexadecimal
  const validateColor = (value) => {
    if (!value) return '';
    
    if (!isValidHex(value)) {
      return COLOR_ERROR_MESSAGES.INVALID_HEX;
    }
    
    return '';
  };

  // Manejar cambio en el input de texto
  const handleInputChange = (name, value) => {
    setInputValue(value);
    setError('');
    
    // Si el valor es válido, actualizar el color
    if (isValidHex(value)) {
      const upperValue = value.toUpperCase();
      setColor(upperValue);
      baseInputProps.onChange(name, upperValue);
    }
  };

  // Manejar blur del input
  const handleInputBlur = (name) => {
    if (validateOnBlur) {
      const errorMsg = validateColor(inputValue);
      setError(errorMsg);
      
      // Si hay error, restaurar al color válido anterior
      if (errorMsg) {
        setInputValue(color);
      }
    }
    
    if (baseInputProps.onBlur) {
      baseInputProps.onBlur(name);
    }
  };

  // Manejar cambio en el color picker nativo
  const handleColorPickerChange = (e) => {
    const newColor = e.target.value.toUpperCase();
    setColor(newColor);
    setInputValue(newColor);
    setError('');
    baseInputProps.onChange(baseInputProps.name, newColor);
  };

  // Seleccionar color de paleta
  const handlePaletteColorSelect = (selectedColor) => {
    setColor(selectedColor);
    setInputValue(selectedColor);
    setError('');
    baseInputProps.onChange(baseInputProps.name, selectedColor);
  };

  // Obtener paleta de colores a mostrar
  const getPaletteColors = () => {
    if (presetColors.length > 0) {
      return presetColors;
    }
    
    switch (paletteType) {
      case 'material':
        return COLOR_PALETTES.MATERIAL;
      case 'web':
        return COLOR_PALETTES.WEB_SAFE;
      case 'pastel':
        return COLOR_PALETTES.PASTEL;
      case 'vivid':
        return COLOR_PALETTES.VIVID;
      case 'all':
        return [
          ...COLOR_PALETTES.MATERIAL,
          ...COLOR_PALETTES.PASTEL,
          ...COLOR_PALETTES.VIVID
        ];
      default:
        return COLOR_PALETTES.MATERIAL;
    }
  };

  // Calcular información del color
  const getColorInfo = () => {
    const rgb = hexToRgb(color);
    const contrastColor = getContrastColor(color);
    
    return {
      hex: color,
      rgb: rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '',
      contrast: contrastColor,
      isLight: contrastColor === '#000000'
    };
  };

  // Renderizar selector de colores
  const renderColorPicker = () => {
    if (!showPicker) return null;

    return (
      <div className="flex items-center gap-3">
        {/* Color picker nativo oculto */}
        <input
          ref={colorPickerRef}
          type="color"
          value={color}
          onChange={handleColorPickerChange}
          className="sr-only"
        />
        
        {/* Botón para abrir picker */}
        <button
          type="button"
          onClick={() => colorPickerRef.current?.click()}
          className="relative w-12 h-10 rounded-lg border-2 border-gray-300 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors overflow-hidden"
          style={{ backgroundColor: color }}
          title="Haz click para abrir selector de colores"
        >
          {/* Icono de picker */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-10 transition-colors">
            <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
        </button>

        {/* Preview del color */}
        {showColorPreview && (
          <div 
            className="w-8 h-8 rounded-full border-2 border-gray-200 shadow-sm flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
      </div>
    );
  };

  // Renderizar paleta de colores
  const renderColorPalette = () => {
    if (!showPalettes) return null;

    const colors = getPaletteColors();
    const colorInfo = getColorInfo();

    return (
      <div className="mt-4">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Paleta de colores
        </div>
        
        {/* Grid de colores */}
        <div className="grid grid-cols-10 gap-1">
          {colors.map((paletteColor, index) => (
            <button
              key={`${paletteColor}-${index}`}
              type="button"
              onClick={() => handlePaletteColorSelect(paletteColor)}
              className={`
                w-6 h-6 rounded-sm border-2 transition-all duration-150
                ${color === paletteColor 
                  ? 'border-blue-500 scale-110 shadow-md' 
                  : 'border-transparent hover:border-gray-300 hover:scale-105'
                }
              `}
              style={{ backgroundColor: paletteColor }}
              title={paletteColor}
            />
          ))}
        </div>

        {/* Info del color seleccionado */}
        {showContrastInfo && (
          <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: color }}>
            <div className="text-sm font-mono" style={{ color: colorInfo.contrast }}>
              <div className="font-semibold">{colorInfo.hex}</div>
              <div className="text-xs opacity-80">{colorInfo.rgb}</div>
              <div className="text-xs mt-1">
                Texto {colorInfo.isLight ? 'oscuro' : 'claro'} para mejor contraste
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar información del color
  const renderColorInfo = () => {
    const colorInfo = getColorInfo();
    const rgb = hexToRgb(color);

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-700">
          <div className="font-medium mb-2">Información del color:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">HEX:</span>
              <span className="ml-1 font-mono">{colorInfo.hex}</span>
            </div>
            <div>
              <span className="text-gray-500">RGB:</span>
              <span className="ml-1 font-mono">
                {rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '-'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Indicador de validación */}
        <div className="mt-2 flex items-center text-xs">
          <div className={`
            w-2 h-2 rounded-full mr-2
            ${error ? 'bg-red-500' : 'bg-green-500'}
          `} />
          <span className={error ? 'text-red-600' : 'text-green-600'}>
            {error ? 'Color inválido' : 'Color válido'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Input de color hexadecimal + picker */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <BaseInput
            {...baseInputProps}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={baseInputProps.placeholder || '#3B82F6'}
            error={error || baseInputProps.error}
            touched={baseInputProps.touched || !!error}
            maxLength={allowAlpha ? 9 : 7}
          />
        </div>
        
        {renderColorPicker()}
      </div>

      {/* Mensaje de ayuda */}
      <div className="text-xs text-gray-500">
        Formato: #RRGGBB (ej: #3B82F6) {allowAlpha && 'o #RRGGBBAA'}
      </div>

      {renderColorPalette()}

      {/* Información del color */}
      {renderColorInfo()}
    </div>
  );
};

export default ColorInput;
