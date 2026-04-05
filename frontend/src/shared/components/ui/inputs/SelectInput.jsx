import React, { useState } from 'react';
import BaseInput from './BaseInput';

/**
 * Componente SelectInput especializado
 * Usa BaseInput como base pero renderiza un select dropdown con funcionalidades avanzadas
 */
const SelectInput = ({ 
  // Props específicas de select
  options = [],
  searchable = false,
  multiSelect = false,
  showSearch = false,
  maxVisible = 5,
  allowClear = true,
  loading = false,
  optionHeight = 48, // Aumentado para coincidir con py-3
  
  // Props de visualización
  optionLabel = 'label',
  optionValue = 'value',
  optionDescription = 'description',
  optionIcon = 'icon',
  optionDisabled = 'disabled',
  
  // Pasar todas las demás props (excepto type)
  ...baseInputProps 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedOptions, setSelectedOptions] = useState([]);

  // Filtrar opciones según búsqueda
  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchTerm) return options;
    
    return options.filter(option => {
      const label = String(option[optionLabel] || '').toLowerCase();
      const description = String(option[optionDescription] || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return label.includes(search) || description.includes(search);
    });
  }, [options, searchTerm, optionLabel, optionDescription]);

  // Sincronizar cambios con el padre
  React.useEffect(() => {
    if (baseInputProps.onChange) {
      if (multiSelect) {
        const values = selectedOptions.map(opt => opt[optionValue]);
        console.log('🎯 SelectInput multi-select onChange:', baseInputProps.name, values);
        baseInputProps.onChange(baseInputProps.name, values);
      } else {
        const value = selectedOptions[0] ? selectedOptions[0][optionValue] : '';
        console.log('🎯 SelectInput single-select onChange:', baseInputProps.name, value);
        baseInputProps.onChange(baseInputProps.name, value);
      }
    }
  }, [selectedOptions, optionValue, baseInputProps.name]); // Removido baseInputProps.onChange de las dependencias

  // Manejar selección
  const handleSelect = (option) => {
    console.log('🎯 SelectInput handleSelect:', option);
    
    if (multiSelect) {
      const isSelected = selectedOptions.some(selected => 
        selected[optionValue] === option[optionValue]
      );
      
      if (isSelected) {
        // Deseleccionar si ya está seleccionado
        setSelectedOptions(selectedOptions.filter(selected => 
          selected[optionValue] !== option[optionValue]
        ));
      } else {
        // Seleccionar nuevo
        setSelectedOptions([...selectedOptions, option]);
      }
    } else {
      // Selección simple
      console.log('🎯 SelectInput selección simple:', option[optionValue]);
      setSelectedOptions([option]);
      setIsOpen(false);
    }
    
    setHighlightedIndex(-1);
    setSearchTerm('');
  };

  // Limpiar selección
  const handleClear = () => {
    setSelectedOptions([]);
    setSearchTerm('');
    baseInputProps.onChange(baseInputProps.name, multiSelect ? [] : '');
  };

  // Manejar teclado
  const handleKeyDown = (e) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Validar selección
  const validateSelection = () => {
    if (baseInputProps.required && selectedOptions.length === 0) {
      return 'Debes seleccionar al menos una opción';
    }
    
    if (baseInputProps.validation) {
      return baseInputProps.validation.custom(selectedOptions);
    }
    
    return '';
  };

  // Obtener valor para el BaseInput (hidden)
  const hiddenValue = multiSelect 
    ? selectedOptions.map(opt => opt[optionValue]).join(',')
    : selectedOptions[0]?.[optionValue] || '';

  // Renderizar cada opción
  const renderOption = (option, index) => {
    const isSelected = selectedOptions.some(selected => 
      selected[optionValue] === option[optionValue]
    );
    const isHighlighted = index === highlightedIndex;
    const isDisabled = option[optionDisabled];
    
    return (
      <div
        key={option[optionValue] || index}
        className={`
          relative flex items-center px-3 py-3 cursor-pointer border-b border-gray-100 last:border-b-0
          hover:bg-blue-50 focus:bg-blue-50 transition-colors duration-150
          ${isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}
          ${isHighlighted ? 'bg-blue-50' : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !isDisabled && handleSelect(option)}
        onMouseEnter={() => setHighlightedIndex(index)}
        role="option"
        aria-selected={isSelected}
        aria-disabled={isDisabled}
        style={{ minHeight: '48px' }}
      >
        {option[optionIcon] && (
          <div className="flex items-center">
            <span className="mr-2">{option[optionIcon]}</span>
          </div>
        )}
        
        <div className="flex-1">
          <div className="font-medium">
            {option[optionLabel]}
          </div>
          {option[optionDescription] && (
            <div className="text-sm text-gray-500">
              {option[optionDescription]}
            </div>
          )}
        </div>
        
        {isSelected && (
          <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    );
  };

  // Renderizar opciones seleccionadas (multi-select)
  const renderSelectedTags = () => {
    if (!multiSelect || selectedOptions.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedOptions.map((option, index) => (
          <span
            key={option[optionValue]}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
          >
            {option[optionIcon] && (
              <span className="mr-1">{option[optionIcon]}</span>
            )}
            {option[optionLabel]}
            <button
              type="button"
              onClick={() => handleSelect(option)}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 10.586 4.293a1 1 0 001.414 0L4.293 4.293z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        ))}
      </div>
    );
  };

  // Validación específica de select
  const selectValidation = {
    ...baseInputProps.validation,
    custom: validateSelection
  };

  return (
    <div className="relative">
      {/* Input oculto para el valor */}
      <BaseInput
        {...baseInputProps}
        type="hidden"
        value={hiddenValue}
        validation={selectValidation}
        readOnly
      />

      {/* Contenedor del select */}
      <div 
        className={`
          relative w-full border border-gray-300 rounded-md shadow-sm
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-gray-400'}
          ${baseInputProps.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'}
          transition-colors duration-200
        `}
        onClick={() => !baseInputProps.disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={baseInputProps.disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Placeholder o valor seleccionado */}
        <div className="flex items-center px-3 py-2">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500">
              {baseInputProps.placeholder || 'Selecciona una opción'}
            </span>
          ) : multiSelect ? (
            <span className="text-gray-700">
              {selectedOptions.length} opciones seleccionadas
            </span>
          ) : (
            <div className="flex items-center">
              {selectedOptions[0][optionIcon] && (
                <span className="mr-2">{selectedOptions[0][optionIcon]}</span>
              )}
              <span>{selectedOptions[0][optionLabel]}</span>
            </div>
          )}
        </div>

        {/* Flecha del dropdown */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Indicador de loading */}
        {loading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {/* Botón de limpiar */}
        {allowClear && selectedOptions.length > 0 && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            aria-label="Limpiar selección"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 10.586 4.293a1 1 0 001.414 0L4.293 4.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Tags de selección múltiple */}
      {renderSelectedTags()}

      {/* Dropdown de opciones */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-1">
          {/* Campo de búsqueda */}
          {searchable && (
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}

          {/* Lista de opciones */}
          <div 
            className="overflow-y-auto"
            style={{ maxHeight: `${maxVisible * optionHeight}px` }}
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500">
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map(renderOption)
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectInput;
