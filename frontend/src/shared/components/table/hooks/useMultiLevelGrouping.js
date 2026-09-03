import { useMemo } from 'react';

/**
 * Custom hook para agrupar datos multinivel según configuración
 * @param {Array} data - Datos a agrupar
 * @param {Array} levelConfigs - Configuración de niveles
 * @returns {Array} Datos agrupados
 */
export const useMultiLevelGrouping = (data, levelConfigs) => {
  return useMemo(() => {
    if (!levelConfigs.length || !data.length) return [];

    const getGroupField = (config) => {
      const validHeaders = config.headers?.filter(h => h && h.title) || [];
      const groupByHeaders = validHeaders.filter(h => h.groupBy === true);
      if (groupByHeaders.length > 1) {
        console.warn(`TableMultiLevel: Nivel ${config.level} tiene ${groupByHeaders.length} headers con groupBy: true. Solo se usará el primero como agrupador.`);
      }
      return groupByHeaders[0]?.title || config.field || null;
    };

    const group = (items, level = 0) => {
      if (level >= levelConfigs.length) return items;
      
      const config = levelConfigs[level];
      const validHeaders = config.headers?.filter(h => h && h.title) || [];
      const isLastLevel = level + 1 >= levelConfigs.length;
      const field = isLastLevel ? null : getGroupField(config);
      
      if (!field && !isLastLevel) {
        // Niveles async (filas planas) no tienen groupBy por diseño — no es error
        return items;
      }
      
      // Tabla plana sin agrupamiento: cada item es su propia fila
      if (!field && isLastLevel) {
        return items.map(item => ({
          key: item[config.boundColumn] || item.ID || Math.random().toString(),
          value: null,
          field: null,
          level: level + 1,
          config: { ...config, headers: validHeaders, visible: true },
          rows: [item],
          children: null
        }));
      }
      
      const groups = {};
      
      items.forEach(item => {
        // Si es último nivel, verificar si todos los campos del nivel son null
        if (isLastLevel && validHeaders.length > 0) {
          const allNull = validHeaders.every(h => item[h.title] === null || item[h.title] === undefined);
          if (allNull) {
            return; // Skip rows where all fields are null - no group created
          }
        }
        
        const key = item[field] !== null && item[field] !== undefined ? item[field] : 'Sin valor';
        if (!groups[key]) {
          groups[key] = {
            key,
            value: item[field] || 'Sin valor',
            field,
            level: level + 1,
            config: { ...config, headers: validHeaders },
            rows: []
          };
        }
        groups[key].rows.push(item);
      });
      
      return Object.values(groups).map(groupItem => {
        // Agregar visible al config basado en count de rows
        const hasValidRows = groupItem.rows.length > 0;
        groupItem.config.visible = hasValidRows;
        
        if (isLastLevel) {
          return { ...groupItem, children: null };
        }
        
        const children = group(groupItem.rows, level + 1);
        
        // Si el grupo tiene rows pero children está vacío (todos los items del último nivel eran null)
        // crear un grupo dummy con visible = false y marcar el grupo como hasNullChildren
        if (groupItem.rows.length > 0 && children.length === 0) {
          const nextConfig = levelConfigs[level + 1];
          const nextValidHeaders = nextConfig.headers?.filter(h => h && h.title) || [];
          return {
            ...groupItem,
            hasNullChildren: true, // Marcar para renderizado especial
            children: [{
              key: 'null-group',
              value: 'null',
              field: getGroupField(nextConfig),
              level: level + 2,
              config: { ...nextConfig, headers: nextValidHeaders, visible: false },
              rows: []
            }]
          };
        }
        
        return { ...groupItem, children };
      }).sort((a, b) => {
        // Ordenar grupos: "Virtual" siempre al final, resto alfabético
        const aVal = String(a.value ?? '');
        const bVal = String(b.value ?? '');
        const aIsVirtual = aVal.toLowerCase() === 'virtual';
        const bIsVirtual = bVal.toLowerCase() === 'virtual';
        if (aIsVirtual && !bIsVirtual) return 1;
        if (!aIsVirtual && bIsVirtual) return -1;
        return aVal.localeCompare(bVal, 'es', { sensitivity: 'base' });
      });
    };
    
    return group(data);
  }, [data, levelConfigs]);
};
