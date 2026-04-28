import React, { useState, useEffect } from 'react';
import { getInputComponent } from '@/features/form/utils/inputMapping';

/**
 * Componente MenuFilters - Filtros dinámicos con UI para tablas CRUD
 * Reutiliza los inputs de features/form para mantener consistencia
 * 
 * Configuración:
 * - buttonConfirm: false (default) = aplica onChange | true = requiere clic en Aplicar
 * - op: se define en el field config, NO en la UI
 */

const MenuFilters = ({ config, onApply, schema }) => {
  const { 
    enabled, 
    position = 'top', 
    collapsible = true, 
    defaultExpanded = false,
    buttonConfirm = false,  // ← NUEVO: false = onChange, true = requiere botón
    fields = []
  } = config;
  
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [filters, setFilters] = useState({});
  
  if (!enabled) return null;
  
  // Aplicar filtros automáticamente cuando cambian (modo onChange)
  useEffect(() => {
    if (!buttonConfirm) {
      const activeFilters = fields
        .map(field => ({
          column: field.name,
          op: field.op || '=',  // ← Operador definido en código, NO en UI
          value: filters[field.name]
        }))
        .filter(f => f.value !== '' && f.value !== null && f.value !== undefined);
      
      onApply(activeFilters);
    }
  }, [filters, fields, buttonConfirm, onApply]);
  
  const handleChange = (fieldName, value) => {
    setFilters(prev => ({ ...prev, [fieldName]: value }));
  };
  
  const handleApply = () => {
    const activeFilters = fields
      .map(field => ({
        column: field.name,
        op: field.op || '=',  // ← Operador definido en código
        value: filters[field.name]
      }))
      .filter(f => f.value !== '' && f.value !== null && f.value !== undefined);
    
    onApply(activeFilters);
  };
  
  const handleClear = () => {
    setFilters({});
    onApply([]);
  };
  
  return (
    <div className="menu-filters mb-4">
      {collapsible && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors mb-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filtros</span>
          <span className="ml-1">{isExpanded ? '▲' : '▼'}</span>
        </button>
      )}
      
      {(!collapsible || isExpanded) && (
        <div className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm ${
          position === 'side' ? '' : ''
        }`}>
          <div className={`grid gap-4 ${
            position === 'side' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {fields.map(fieldConfig => {
              const InputComponent = getInputComponent(fieldConfig.type);
              
              return (
                <div key={fieldConfig.name} className="flex flex-col">
                  {/* Label del filtro */}
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {fieldConfig.label}
                  </label>
                  
                  {/* Input de valor - operador definido en código (fieldConfig.op) */}
                  <InputComponent
                    name={fieldConfig.name}
                    value={filters[fieldConfig.name] || ''}
                    onChange={(name, val) => handleChange(name, val)}
                    placeholder={fieldConfig.placeholder || `Filtrar ${fieldConfig.label}`}
                    options={fieldConfig.options}
                    referenceTable={fieldConfig.referenceTable}
                    referenceField={fieldConfig.referenceField}
                    referenceQuery={fieldConfig.referenceQuery}
                    referenceFilters={fieldConfig.referenceFilters}
                    searchable={fieldConfig.searchable}
                    allowClear={true}
                  />
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            {/* Botón Aplicar - solo si buttonConfirm === true */}
            {buttonConfirm && (
              <button 
                onClick={handleApply}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Aplicar
              </button>
            )}
            
            {/* Botón Limpiar - siempre visible */}
            <button 
              onClick={handleClear}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuFilters;
