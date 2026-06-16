import React from 'react';

/**
 * Componente para renderizar grupos multinivel de forma recursiva
 * @param {Object} group - Grupo a renderizar
 * @param {number} depth - Profundidad actual del nivel
 * @param {boolean} isSublevel - Indica si es un subnivel
 * @param {Array} levelConfigs - Configuración de niveles
 */
export const GroupRenderer = ({ group, depth = 0, isSublevel = false, levelConfigs }) => {
  const indent = '    '.repeat(depth);
  const headers = group.config.headers || [];
  const field = group.config.field;
  const visible = group.config.visible !== undefined ? group.config.visible : true;

  // Calcular columnSpaces: headers.length + 1 (por actions)
  const columnSpaces = headers.length + 1;

  // Determinar el tipo para la línea azul
  // Todos los grupos que son hijos directos del root (depth === 1) serán "DATA ROW"
  const type = depth === 1 ? 'DATA ROW' : 'HEADER';

  // Construir el string de datos (para la línea de grupo hoja)
  let dataString = '';
  if (field && depth > 0) {
    // Grupo de primer o segundo nivel: mostrar sus valores agrupados
    if (headers.length > 0) {
      // Es un grupo con headers de subnivel (último nivel)
      dataString = `{${headers.map(h => `${h.title}: ${group.value}`).join(', ')}}`;
    } else {
      // Grupo de área (solo field)
      dataString = `{${field}: ${group.value}}`;
    }
  }

  // Si el grupo tiene hijos (es un grupo padre)
  if (group.children) {
    const childConfig = group.children[0]?.config || levelConfigs[depth + 1];
    const childHeaders = childConfig?.headers?.filter(h => h?.title) || [];
    const childField = childConfig?.field || childHeaders[0]?.title || '';
    const childHeadersFormat = childHeaders.length
      ? `{${childHeaders.map(h => `{name:${h.title},columnSpace:1}`).join(', ')}}`
      : `{name:${childField},columnSpace:1}`;

    // Calcular columnSpaces de los hijos y tomar el máximo
    const childColumnSpaces = childHeaders.length + 1;
    const maxColumnSpaces = Math.max(columnSpaces, childColumnSpaces);

    // Conteo de filas válidas dentro de este subnivel
    const validRowsCount = group.hasNullChildren ? 0 : group.children.length;
    // Si no hay filas válidas, visible debe ser false
    const childVisible = validRowsCount > 0;

    return (
      <div key={group.key}>
        {/* Línea del grupo padre */}
        {dataString && (
          <div className="text-blue-400" style={{ whiteSpace: 'pre-wrap' }}>
            {indent}{dataString} , LEVEL {group.level}, TYPE = {type}, EXPANDABLE = TRUE, groupedRows: {validRowsCount}
          </div>
        )}

        {/* Sub‑encabezado del siguiente nivel */}
        <div className="text-purple-400" style={{ whiteSpace: 'pre-wrap' }}>
          {indent}    Headers: {childHeadersFormat}, TYPE : HEADER, visible = {childVisible ? 'true' : 'false'}{`, Data rows: ${validRowsCount}`}, actionsColumnSpaces:1, TotalcolumnSpaces: {maxColumnSpaces}
        </div>

        {/* Hijos sin encabezados */}
        {group.children.map(child => (
          <GroupRenderer 
            key={child.key} 
            group={child} 
            depth={depth + 2} 
            isSublevel={true} 
            levelConfigs={levelConfigs}
          />
        ))}
      </div>
    );
  }

  // Grupo hoja (sin hijos) – mostrar filas individuales
  return (
    <div key={group.key}>
      {headers.length > 0 && group.rows.length > 0 ? (
        // Mostrar cada fila individual para grupos con headers
        group.rows.map((row, rowIndex) => {
          const rowData = headers.map(h => `${h.title}: ${row[h.title] !== null && row[h.title] !== undefined ? row[h.title] : 'null'}`).join(', ');
          return (
            <div key={`${group.key}-${rowIndex}`} className="text-blue-400" style={{ whiteSpace: 'pre-wrap' }}>
              {indent}{`{${rowData}}`} , LEVEL {group.level}, TYPE = DATA ROW, EXPANDABLE = FALSE, groupedRows: 0
            </div>
          );
        })
      ) : dataString ? (
        // Para grupos sin headers (como nivel 1)
        <div className="text-blue-400" style={{ whiteSpace: 'pre-wrap' }}>
          {indent}{dataString} , LEVEL {group.level}, TYPE = HEADER, EXPANDABLE = FALSE, groupedRows: 0
        </div>
      ) : null}
      {/* Si es un grupo nulo, mostrarlo sin datos */}
      {group.value === 'null' && (
        <div className="text-blue-400" style={{ whiteSpace: 'pre-wrap' }}>
          {indent}LEVEL {group.level}, TYPE = HEADER, EXPANDABLE = FALSE, groupedRows: 0
        </div>
      )}
    </div>
  );
};
