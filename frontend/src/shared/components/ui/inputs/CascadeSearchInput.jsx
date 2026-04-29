import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SelectInput from './SelectInput';
import { useReferenceData } from '@/shared/hooks/useReferenceData';
import { db } from '@/shared/api';

/**
 * Helper para formatear template con valores
 * Ej: "{SEARCH_AREA}" -> "123"
 */
const formatTemplate = (template, data) => {
  if (!template || typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (_, fieldName) => data[fieldName] ?? '');
};

/**
 * CascadeSearchInput - Búsqueda en cascada con múltiples selects
 * 
 * @param {Array} searchFields - Campos de búsqueda visibles [{ name, label, referenceTable, referenceField, referenceQuery, referenceFilters }]
 * @param {Object} resultField - Campo resultado oculto { referenceTable, referenceField }
 * @param {string} name - Nombre del campo (el ID resultado que se envía en submit)
 * @param {any} value - Valor actual (ID resultado)
 * @param {function} onChange - Callback cuando cambia el valor resultado
 */
const CascadeSearchInput = React.memo(({
  name,
  label,
  value,
  onChange,
  searchFields = [],
  resultField,
  required = false,
  disabled = false,
  placeholder,
  ...props
}) => {
  // Estado para los valores de búsqueda (visibles)
  const [searchValues, setSearchValues] = useState({});
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Resetear búsqueda cuando cambia el valor externo (modo edición)
  useEffect(() => {
    if (value && resultField?.referenceTable) {
      // TODO: Cargar los valores de búsqueda correspondientes al ID
      // Esto requeriría buscar en resultField.referenceTable donde resultField.referenceField = value
      // y luego extraer los valores de searchFields
    }
  }, [value, resultField]);

  // Procesar filtros dinámicos para un campo específico
  const processFilters = useCallback((filters, currentSearchValues) => {
    if (!filters || filters.length === 0) return [];
    
    return filters.map(filter => {
      if (typeof filter.value === 'string' && filter.value.includes('{')) {
        const processedValue = formatTemplate(filter.value, currentSearchValues);
        return { ...filter, value: processedValue };
      }
      return filter;
    });
  }, []);

  // Determinar si un campo de búsqueda está bloqueado
  const isFieldBlocked = useCallback((fieldIndex) => {
    if (disabled) return true;
    if (fieldIndex === 0) return false;
    
    // Campo N está bloqueado si el campo N-1 no tiene valor
    const prevField = searchFields[fieldIndex - 1];
    return !searchValues[prevField.name];
  }, [searchFields, searchValues, disabled]);

  // Manejar cambio en un campo de búsqueda
  const handleSearchChange = useCallback((fieldName, fieldValue) => {
    setSearchValues(prev => {
      const newValues = { ...prev };
      
      // Encontrar el índice del campo que cambió
      const changedIndex = searchFields.findIndex(f => f.name === fieldName);
      
      // Establecer el nuevo valor
      newValues[fieldName] = fieldValue;
      
      // Limpiar todos los campos siguientes en la cascada
      for (let i = changedIndex + 1; i < searchFields.length; i++) {
        delete newValues[searchFields[i].name];
      }
      
      return newValues;
    });
    
    // Limpiar error
    setError('');
  }, [searchFields]);

  // Buscar el resultado cuando todos los campos de búsqueda tienen valor
  useEffect(() => {
    const searchForResult = async () => {
      const allFieldsHaveValue = searchFields.every(field => searchValues[field.name]);
      
      if (!allFieldsHaveValue || !resultField) {
        // Si no todos los campos tienen valor, limpiar el resultado
        if (onChange && value) {
          onChange({ target: { name, value: '' } });
        }
        return;
      }
      
      // Construir filtros para buscar el registro resultado
      const resultFilters = searchFields.map(field => ({
        field: field.referenceField,
        op: '=',
        value: searchValues[field.name]
      }));
      
      try {
        setIsSearching(true);
        setError('');
        
        console.log(`[CascadeSearchInput] Buscando en ${resultField.referenceTable}:`, resultFilters);
        
        const response = await db.select(
          resultField.referenceTable,
          resultFilters
        );
        const records = response || [];
        
        if (records.length > 0) {
          const resultId = records[0][resultField.referenceField];
          console.log(`[CascadeSearchInput] Resultado encontrado: ${resultId}`);
          
          if (onChange) {
            onChange({ target: { name, value: resultId } });
          }
        } else {
          console.log(`[CascadeSearchInput] No se encontró resultado`);
          setError('La combinación seleccionada no existe. Verifique los valores elegidos.');
          
          if (onChange && value) {
            onChange({ target: { name, value: '' } });
          }
        }
      } catch (err) {
        console.error(`[CascadeSearchInput] Error buscando:`, err);
        setError('Error al buscar el registro. Intente nuevamente.');
        
        if (onChange && value) {
          onChange({ target: { name, value: '' } });
        }
      } finally {
        setIsSearching(false);
      }
    };
    
    searchForResult();
  }, [searchValues, searchFields, resultField, onChange, name, value]);

  // Componente para un campo de búsqueda individual
  const SearchFieldComponent = ({ field, index }) => {
    const isBlocked = isFieldBlocked(index);
    const fieldValue = searchValues[field.name] || '';
    
    // Procesar filtros dinámicos
    const processedFilters = useMemo(() => {
      return processFilters(field.referenceFilters, searchValues);
    }, [field.referenceFilters, searchValues, processFilters]);
    
    // Configuración para useReferenceData
    const config = useMemo(() => {
      if (isBlocked) return null;
      
      return {
        tableName: field.referenceTable,
        valueField: field.referenceField,
        labelTemplate: field.referenceQuery,
        filters: processedFilters
      };
    }, [field, isBlocked, processedFilters]);
    
    const { options, loading } = useReferenceData(config);
    
    // Transformar opciones para SelectInput
    const selectOptions = useMemo(() => {
      if (!options) return [];
      return options.map(opt => ({
        value: opt.value,
        label: opt.label
      }));
    }, [options]);
    
    return (
      <div className="cascade-search-field" style={{ marginBottom: '8px' }}>
        <SelectInput
          name={field.name}
          label={field.label}
          value={fieldValue}
          onChange={(e) => handleSearchChange(field.name, e.target.value)}
          options={selectOptions}
          disabled={isBlocked}
          loading={loading}
          placeholder={isBlocked 
            ? `Seleccione ${index === 0 ? 'un valor' : searchFields[index - 1].label.toLowerCase()} primero`
            : field.placeholder || `Seleccione ${field.label.toLowerCase()}`
          }
          required={required && index === 0}
          clearable
        />
      </div>
    );
  };

  return (
    <div className="cascade-search-input">
      {label && (
        <label className="cascade-search-label" style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          {label}
          {required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      
      {/* Campos de búsqueda visibles */}
      <div className="cascade-search-fields">
        {searchFields.map((field, index) => (
          <SearchFieldComponent key={field.name} field={field} index={index} />
        ))}
      </div>
      
      {/* Campo resultado oculto */}
      <input
        type="hidden"
        name={name}
        value={value || ''}
      />
      
      {/* Indicador de búsqueda */}
      {isSearching && (
        <div className="cascade-search-loading" style={{ 
          color: '#3b82f6', 
          fontSize: '14px',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>Buscando...</span>
        </div>
      )}
      
      {/* Mensaje de error */}
      {error && (
        <div className="cascade-search-error" style={{ 
          color: '#dc2626', 
          fontSize: '14px',
          marginTop: '4px'
        }}>
          {error}
        </div>
      )}
      
      {/* Debug: mostrar valor resultado */}
      {value && (
        <div className="cascade-search-result" style={{
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '4px'
        }}>
          ID seleccionado: {value}
        </div>
      )}
    </div>
  );
});

CascadeSearchInput.displayName = 'CascadeSearchInput';

export default CascadeSearchInput;
