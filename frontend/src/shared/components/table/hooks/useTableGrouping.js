import { useState, useCallback, useMemo } from 'react';

/**
 * Hook personalizado para manejar la agrupación de filas en tablas
 * @param {Object} groupable - Configuración de agrupación { active, field, className }
 * @param {Array} data - Datos a agrupar
 * @returns {Object} - Datos agrupados y manejadores de expansión
 */
export const useTableGrouping = (groupable, data) => {
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Agrupar datos por el campo especificado
  const groupedData = useMemo(() => {
    if (!groupable?.active || !groupable?.field || !data?.length) {
      return null;
    }

    const groups = {};
    
    data.forEach((row, index) => {
      const groupValue = row[groupable.field];
      const groupKey = String(groupValue || '');
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          value: groupValue,
          rows: [],
          count: 0,
          indices: []
        };
      }
      
      groups[groupKey].rows.push(row);
      groups[groupKey].indices.push(index);
      groups[groupKey].count++;
    });

    const result = Object.entries(groups)
      .map(([key, group]) => ({ key, ...group }))
      .sort((a, b) => String(a.value).localeCompare(String(b.value)));
    
    return result;
  }, [groupable, data]);

  // Manejar expansión/colapso de grupo
  const handleGroupExpand = useCallback((groupKey) => {
    setExpandedGroups(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupKey)) {
        newExpanded.delete(groupKey);
      } else {
        newExpanded.add(groupKey);
      }
      return newExpanded;
    });
  }, []);

  // Verificar si un grupo está expandido
  const isGroupExpanded = useCallback((groupKey) => {
    return expandedGroups.has(groupKey);
  }, [expandedGroups]);

  // Expandir todos los grupos
  const expandAllGroups = useCallback(() => {
    if (!groupedData) return;
    const allKeys = groupedData.map(g => g.key);
    setExpandedGroups(new Set(allKeys));
  }, [groupedData]);

  // Colapsar todos los grupos
  const collapseAllGroups = useCallback(() => {
    setExpandedGroups(new Set());
  }, []);

  return {
    groupedData,
    expandedGroups,
    handleGroupExpand,
    isGroupExpanded,
    expandAllGroups,
    collapseAllGroups
  };
};

export default useTableGrouping;
