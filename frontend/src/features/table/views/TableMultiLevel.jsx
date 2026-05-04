import React, { useMemo } from 'react';
import { useMultiLevelGrouping } from '../hooks/useMultiLevelGrouping';
import { GroupRenderer } from '../components/GroupRenderer';

/**
 * TableMultiLevel - Versión simplificada para debugging
 * Muestra datos y levelConfigs en JSON + interpretación agrupada
 */
const TableMultiLevel = ({ data, levelConfigs }) => {
  // Agrupar datos según levelConfigs usando custom hook
  const groupedData = useMultiLevelGrouping(data, levelConfigs);

  // Calcular el máximo columnSpaces de todos los niveles
  const maxColumnSpaces = useMemo(() => {
    let max = 0;
    const traverse = (groups, level = 0) => {
      if (level >= levelConfigs.length) return;
      const config = levelConfigs[level];
      const headers = config?.headers?.filter(h => h?.title) || [];
      const spaces = headers.length + 1;
      max = Math.max(max, spaces);
      
      groups.forEach(group => {
        if (group.children) {
          traverse(group.children, level + 1);
        }
      });
    };
    traverse(groupedData);
    return max;
  }, [groupedData, levelConfigs]);

  return (
    <div>
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto mb-4">
        <pre>{JSON.stringify({ levelConfigs, data }, null, 2)}</pre>
      </div>
      <div className="bg-gray-800 text-white p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4 text-yellow-400">Interpretación Agrupada:</h2>
        <div className="font-mono">
          {/* Mostrar header principal de nivel 1 solo una vez */}
          {groupedData.length > 0 && (
            <div className="text-purple-400" style={{ whiteSpace: 'pre-wrap' }}>
              Headers: {`{name:${groupedData[0].config.field},columnSpaces:2}`}, TYPE : HEADER, visible = true , Data rows: {groupedData.length}, actionsColumnSpaces:1, TotalcolumnSpaces: {maxColumnSpaces}
            </div>
          )}
          {/* Renderizar grupos con indentación */}
          {groupedData.map((group) => (
            <GroupRenderer 
              key={group.key} 
              group={group} 
              depth={1} 
              isSublevel={false} 
              levelConfigs={levelConfigs}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableMultiLevel;
