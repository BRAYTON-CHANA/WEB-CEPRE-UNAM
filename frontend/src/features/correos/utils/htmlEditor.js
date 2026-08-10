import { DEFAULT_FONT, DEFAULT_FONT_SIZE, DEFAULT_FONT_COLOR, FONT_SIZE_MAP } from '@/features/correos/constants/editor';

export const isEmpty = (html) => !html || html === '<br>' || html === '<div><br></div>';

export const getCurrentRange = (editorRef) => {
  const sel = window.getSelection();
  if (sel?.rangeCount > 0 && editorRef.current?.contains(sel.getRangeAt(0).commonAncestorContainer)) {
    return sel.getRangeAt(0).cloneRange();
  }
  return null;
};

export const restoreRange = (range) => {
  if (!range) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};

const findFirstTextNode = (node) => {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) return node;
  if (node.nodeType === Node.ELEMENT_NODE) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
    return walker.nextNode();
  }
  return null;
};

const findLastTextNode = (node) => {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) return node;
  if (node.nodeType === Node.ELEMENT_NODE) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
    let last = null;
    let n;
    while ((n = walker.nextNode())) {
      last = n;
    }
    return last;
  }
  return null;
};

const getBlockFromCollapsedRange = (range, editorRef) => {
  const { startContainer, startOffset } = range;

  if (startContainer === editorRef.current) {
    return startContainer.children[startOffset] || null;
  }

  let current = startContainer;
  while (current && current !== editorRef.current && current.parentElement !== editorRef.current) {
    current = current.parentElement;
  }
  return current === editorRef.current ? null : current;
};

const getEffectiveTextNode = (range, editorRef) => {
  const { startContainer, startOffset } = range;

  if (startContainer.nodeType === Node.TEXT_NODE) {
    return startContainer;
  }

  if (startContainer.nodeType === Node.ELEMENT_NODE) {
    // Buscar hacia adelante desde el offset
    const forward = startContainer.childNodes[startOffset];
    if (forward) {
      const text = findFirstTextNode(forward);
      if (text) return text;
    }

    // Buscar hacia atrás desde el offset
    const backward = startContainer.childNodes[startOffset - 1];
    if (backward) {
      const text = findLastTextNode(backward);
      if (text) return text;
    }

    // Si el contenedor es un bloque vacío, buscar en hermanos del editor
    const block = getBlockFromCollapsedRange(range, editorRef);
    if (block && block.parentElement === editorRef.current) {
      let sibling = block.nextElementSibling;
      while (sibling) {
        const text = findFirstTextNode(sibling);
        if (text) return text;
        sibling = sibling.nextElementSibling;
      }

      sibling = block.previousElementSibling;
      while (sibling) {
        const text = findLastTextNode(sibling);
        if (text) return text;
        sibling = sibling.previousElementSibling;
      }
    }
  }

  return null;
};

export const getFontFamily = (node, editorRef) => {
  let current = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (current && current !== editorRef.current) {
    const family = current.style?.fontFamily || current.getAttribute?.('face');
    if (family) {
      const clean = family.split(',')[0].replace(/["']/g, '').trim();
      return clean;
    }
    current = current.parentElement;
  }
  return DEFAULT_FONT;
};

export const getFontSize = (node, editorRef) => {
  let current = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (current && current !== editorRef.current) {
    const size = current.style?.fontSize;
    if (size) {
      const px = parseInt(size, 10);
      if (!Number.isNaN(px)) return px;
    }
    const fontSizeAttr = current.getAttribute?.('size');
    if (fontSizeAttr && FONT_SIZE_MAP[fontSizeAttr]) {
      return FONT_SIZE_MAP[fontSizeAttr];
    }
    current = current.parentElement;
  }
  return DEFAULT_FONT_SIZE;
};

export const getFontColor = (node, editorRef, defaultColor = DEFAULT_FONT_COLOR) => {
  let current = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (current && current !== editorRef.current) {
    const color = current.style?.color;
    if (color) return color;
    const colorAttr = current.getAttribute?.('color');
    if (colorAttr) return colorAttr;
    current = current.parentElement;
  }
  return defaultColor;
};

const getSelectedTextNodes = (range, root) => {
  const result = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while ((node = walker.nextNode())) {
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(node);
    // El rango temporal debe acabar después del inicio del rango seleccionado
    // y empezar antes del fin del rango seleccionado => hay intersección no vacía.
    if (
      range.compareBoundaryPoints(Range.START_TO_END, nodeRange) <= 0 &&
      range.compareBoundaryPoints(Range.END_TO_START, nodeRange) >= 0
    ) {
      result.push(node);
    }
  }
  return result;
};

export const getCurrentFormat = (editorRef, savedRange) => {
  const sel = window.getSelection();
  let range = sel?.rangeCount ? sel.getRangeAt(0) : null;

  const editorHasFocus = editorRef.current && (document.activeElement === editorRef.current || editorRef.current.contains(document.activeElement));
  if (!editorHasFocus && savedRange.current) {
    range = savedRange.current;
  }

  if (!range || !editorRef.current || !editorRef.current.contains(range.commonAncestorContainer)) {
    return { fontFamily: DEFAULT_FONT, fontSize: String(DEFAULT_FONT_SIZE) };
  }

  let textNodes = [];

  if (range.collapsed) {
    const effectiveNode = getEffectiveTextNode(range, editorRef);
    if (effectiveNode) {
      textNodes = [effectiveNode];
    }
  } else {
    // Se recorren los nodos de texto vivos del DOM real en lugar de clonar el
    // rango. cloneContents() excluye el commonAncestorContainer y sus ancestros,
    // lo que pierde las fuentes/tamaños inline seteados en el <div> del bloque y
    // hace que getFontFamily/getFontSize caigan al default en textos que en
    // realidad heredan otra fuente.
    textNodes = getSelectedTextNodes(range, editorRef.current);
  }

  // Editor vacío (sin nodos de texto): devolvemos null para que el llamador
  // decida. useHtmlEditor conserva el último formato mostrado en este caso,
  // de modo que al borrar todo no se resetee a Arial 11.
  if (textNodes.length === 0) {
    return null;
  }

  const families = new Set();
  const sizes = new Set();
  const colors = new Set();

  textNodes.forEach(node => {
    families.add(getFontFamily(node, editorRef));
    sizes.add(getFontSize(node, editorRef));
    colors.add(getFontColor(node, editorRef));
  });

  return {
    fontFamily: families.size === 1 ? [...families][0] : '',
    fontSize: sizes.size === 1 ? String([...sizes][0]) : '',
    fontColor: colors.size === 1 ? [...colors][0] : '',
  };
};

// ============================================================
//  Utilidades de tablas
// ============================================================

export const getCurrentCell = (editorRef) => {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return null;
  const range = sel.getRangeAt(0);

  // Intentar con commonAncestorContainer primero.
  let node = range.commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  while (node && node !== editorRef.current) {
    if (node.tagName === 'TD' || node.tagName === 'TH') return node;
    node = node.parentElement;
  }

  // Fallback: si el commonAncestor es el <tr> o <table> (selección entre
  // celdas), usar startContainer para encontrar la celda real.
  node = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  while (node && node !== editorRef.current) {
    if (node.tagName === 'TD' || node.tagName === 'TH') return node;
    node = node.parentElement;
  }

  return null;
};

export const getCurrentTable = (editorRef) => {
  const cell = getCurrentCell(editorRef);
  if (!cell) return null;
  let node = cell.parentElement;
  while (node && node !== editorRef.current) {
    if (node.tagName === 'TABLE') return node;
    node = node.parentElement;
  }
  return null;
};

export const getCellFromNode = (node, editorRef) => {
  let current = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (current && current !== editorRef.current) {
    if (current.tagName === 'TD' || current.tagName === 'TH') return current;
    current = current.parentElement;
  }
  return null;
};

export const getEdgeCell = (editorRef, edge, fromCell = null) => {
  const table = getCurrentTable(editorRef);
  const cell = fromCell || getCurrentCell(editorRef);
  if (!table || !cell) return null;

  const pos = getCellGridPosition(table, cell);
  if (!pos) return null;

  const { grid } = getTableGrid(table);
  const maxCol = grid[0]?.length - 1;
  const lastRow = table.rows.length - 1;

  switch (edge) {
    case 'firstRow':
      return grid[0]?.[pos.col];
    case 'lastRow':
      return grid[lastRow]?.[pos.col];
    case 'firstCol':
      return grid[pos.row]?.[0];
    case 'lastCol':
      return grid[pos.row]?.[maxCol];
    default:
      return cell;
  }
};

export const canSplitCell = (editorRef) => {
  const cell = getCurrentCell(editorRef);
  if (!cell) return false;
  return (cell.rowSpan || 1) > 1 || (cell.colSpan || 1) > 1;
};

// Aplica un color de fondo a las celdas dadas. Si color es 'transparent',
// quita el backgroundColor.
export const setCellBackground = (cells, color) => {
  if (!cells || cells.length === 0) return false;
  cells.forEach(cell => {
    cell.style.backgroundColor = color === 'transparent' ? '' : color;
  });
  return true;
};

// Detecta las celdas en la selección por arrastre del navegador.
// Solo requiere que el INICIO del arrastre esté en una celda. Si el final
// está fuera de la tabla, se determina la dirección con compareBoundaryPoints
// y se selecciona hasta la última o primera celda.
// Devuelve un array de elementos <td>/<th> únicos en el rectángulo entre
// la celda inicial y la celda final. Devuelve [] si no hay multi-selección.
export const getCellsInRange = (editorRef) => {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return [];
  const range = sel.getRangeAt(0);
  if (range.collapsed) return [];

  const startCell = getCellFromNode(range.startContainer, editorRef);
  if (!startCell) return []; // debe iniciar en una celda

  // Encontrar la tabla de startCell.
  let table = null;
  let node = startCell.parentElement;
  while (node && node !== editorRef.current) {
    if (node.tagName === 'TABLE') { table = node; break; }
    node = node.parentElement;
  }
  if (!table) return [];

  const startPos = getCellGridPosition(table, startCell);
  if (!startPos) return [];

  const endCell = getCellFromNode(range.endContainer, editorRef);
  let endRow, endCol;

  if (endCell && table.contains(endCell)) {
    // end está en una celda de la misma tabla.
    const endPos = getCellGridPosition(table, endCell);
    if (!endPos) return [];
    endRow = endPos.row + (endCell.rowSpan || 1) - 1;
    endCol = endPos.col + (endCell.colSpan || 1) - 1;
  } else {
    // end está fuera de la tabla. Determinar dirección con compareBoundaryPoints.
    const tableRange = document.createRange();
    tableRange.selectNodeContents(table);
    // Si el end del rango está después del inicio de la tabla → última celda.
    // compareBoundaryPoints(END_TO_START): end del range vs start del tableRange.
    // Si >= 0, el end del range es posterior al inicio de la tabla.
    const cmp = range.compareBoundaryPoints(Range.END_TO_START, tableRange);
    if (cmp >= 0) {
      // El end está después → usar la última celda del grid.
      const { grid } = getTableGrid(table);
      for (let r = grid.length - 1; r >= 0; r--) {
        for (let c = (grid[r]?.length || 0) - 1; c >= 0; c--) {
          if (grid[r][c]) { endRow = r; endCol = c; break; }
        }
        if (endRow !== undefined) break;
      }
    } else {
      // El end está antes → usar la primera celda.
      endRow = 0;
      endCol = 0;
    }
  }

  if (endRow === undefined) return [];

  const minRow = Math.min(startPos.row, endRow);
  const maxRow = Math.max(startPos.row + (startCell.rowSpan || 1) - 1, endRow);
  const minCol = Math.min(startPos.col, endCol);
  const maxCol = Math.max(startPos.col + (startCell.colSpan || 1) - 1, endCol);

  const { grid } = getTableGrid(table);
  const cells = [];
  const seen = new Set();
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const cell = grid[r]?.[c];
      if (cell && !seen.has(cell)) {
        seen.add(cell);
        cells.push(cell);
      }
    }
  }
  return cells;
};

// Calcula información de las celdas seleccionadas: count, filas, columnas y label.
export const getSelectedCellDimensions = (editorRef, cells) => {
  if (!cells || cells.length === 0) {
    return { count: 0, rows: 0, cols: 0, label: '' };
  }

  if (cells.length === 1) {
    return { count: 1, rows: 1, cols: 1, label: '1 celda seleccionada' };
  }

  // Encontrar la tabla común.
  let table = null;
  for (const cell of cells) {
    let node = cell.parentElement;
    while (node && node !== editorRef.current) {
      if (node.tagName === 'TABLE') { table = node; break; }
      node = node.parentElement;
    }
    if (table) break;
  }
  if (!table) {
    return { count: cells.length, rows: 0, cols: 0, label: `${cells.length} celdas seleccionadas` };
  }

  let minRow = Infinity, minCol = Infinity, maxRow = -1, maxCol = -1;
  for (const cell of cells) {
    const p = getCellGridPosition(table, cell);
    if (!p) continue;
    if (p.row < minRow) minRow = p.row;
    if (p.col < minCol) minCol = p.col;
    const rEnd = p.row + (cell.rowSpan || 1) - 1;
    const cEnd = p.col + (cell.colSpan || 1) - 1;
    if (rEnd > maxRow) maxRow = rEnd;
    if (cEnd > maxCol) maxCol = cEnd;
  }

  if (minRow === Infinity) {
    return { count: cells.length, rows: 0, cols: 0, label: `${cells.length} celdas seleccionadas` };
  }

  const rows = maxRow - minRow + 1;
  const cols = maxCol - minCol + 1;
  return {
    count: cells.length,
    rows,
    cols,
    label: `${cells.length} celdas · ${rows}×${cols}`,
  };
};

const getCellGridPosition = (table, cell) => {
  const rows = table.rows;
  // Construye un mapa lógico de la tabla considerando spans.
  // grid[r][c] = celda que ocupa esa posición (puede repetirse).
  const grid = [];
  for (let r = 0; r < rows.length; r++) {
    if (!grid[r]) grid[r] = [];
    let c = 0;
    for (let i = 0; i < rows[r].cells.length; i++) {
      while (grid[r][c]) c++;
      const cur = rows[r].cells[i];
      const rs = cur.rowSpan || 1;
      const cs = cur.colSpan || 1;
      for (let rr = 0; rr < rs; rr++) {
        for (let cc = 0; cc < cs; cc++) {
          if (!grid[r + rr]) grid[r + rr] = [];
          grid[r + rr][c + cc] = cur;
        }
      }
      if (cur === cell) return { row: r, col: c };
      c += cs;
    }
  }
  return null;
};

const getTableGrid = (table) => {
  const rows = table.rows;
  const grid = [];
  let maxCols = 0;
  for (let r = 0; r < rows.length; r++) {
    if (!grid[r]) grid[r] = [];
    let c = 0;
    for (let i = 0; i < rows[r].cells.length; i++) {
      while (grid[r][c]) c++;
      const cur = rows[r].cells[i];
      const rs = cur.rowSpan || 1;
      const cs = cur.colSpan || 1;
      for (let rr = 0; rr < rs; rr++) {
        for (let cc = 0; cc < cs; cc++) {
          if (!grid[r + rr]) grid[r + rr] = [];
          grid[r + rr][c + cc] = cur;
        }
      }
      c += cs;
      if (c > maxCols) maxCols = c;
    }
  }
  return { grid, maxCols };
};

export const insertTable = (editorRef, rows, cols) => {
  if (!editorRef.current) return false;
  editorRef.current.focus();
  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';
  table.style.width = '100%';
  const tbody = document.createElement('tbody');
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < cols; c++) {
      const td = document.createElement('td');
      td.style.border = '1px solid #999';
      td.style.padding = '4px 8px';
      td.innerHTML = '&nbsp;';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  const sel = window.getSelection();
  if (sel?.rangeCount) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(table);
    // Insertar un salto de línea después de la tabla para poder seguir escribiendo.
    const after = document.createElement('div');
    after.innerHTML = '<br>';
    if (table.parentElement) {
      if (table.nextSibling) {
        table.parentElement.insertBefore(after, table.nextSibling);
      } else {
        table.parentElement.appendChild(after);
      }
    }
    // Colocar el cursor en la primera celda.
    const firstCell = table.querySelector('td');
    if (firstCell) {
      const newRange = document.createRange();
      newRange.setStart(firstCell, 0);
      newRange.setEnd(firstCell, 0);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  } else {
    editorRef.current.appendChild(table);
  }
  return true;
};

export const addRow = (editorRef, position, referenceCell = null) => {
  const table = getCurrentTable(editorRef);
  const cell = referenceCell || getCurrentCell(editorRef);
  if (!table || !cell) return false;

  const { grid, maxCols } = getTableGrid(table);
  const pos = getCellGridPosition(table, cell);
  if (!pos) return false;

  const targetRow = position === 'above' ? pos.row : pos.row + 1;
  const newRow = table.insertRow(targetRow);

  // Insertar celdas respetando rowSpan de filas superiores que cruzan esta fila.
  for (let c = 0; c < maxCols; c++) {
    const occupying = grid[targetRow]?.[c];
    if (occupying && occupying !== cell) {
      // Una celda de una fila superior ocupa esta posición por rowSpan.
      // Verificar si realmente está extendida hacia esta fila.
      const cellPos = getCellGridPosition(table, occupying);
      if (cellPos && cellPos.row < targetRow) {
        occupying.rowSpan = (occupying.rowSpan || 1) + 1;
        // Saltar las columnas que ocupa esta celda.
        c += (occupying.colSpan || 1) - 1;
        continue;
      }
    }
    const td = document.createElement('td');
    td.style.border = '1px solid #999';
    td.style.padding = '4px 8px';
    td.innerHTML = '&nbsp;';
    newRow.appendChild(td);
  }
  return true;
};

export const addColumn = (editorRef, position, referenceCell = null) => {
  const table = getCurrentTable(editorRef);
  const cell = referenceCell || getCurrentCell(editorRef);
  if (!table || !cell) return false;

  const pos = getCellGridPosition(table, cell);
  if (!pos) return false;

  const { grid, maxCols } = getTableGrid(table);
  const targetCol = position === 'left' ? pos.col : pos.col + (cell.colSpan || 1);

  const rows = table.rows;
  for (let r = 0; r < rows.length; r++) {
    // Buscar si una celda en esta fila ocupa targetCol por colSpan.
    const occupying = grid[r]?.[targetCol];
    if (occupying) {
      const cellPos = getCellGridPosition(table, occupying);
      if (cellPos && cellPos.col < targetCol && (occupying.colSpan || 1) > 1) {
        occupying.colSpan = (occupying.colSpan || 1) + 1;
        continue;
      }
    }
    // Insertar una nueva celda en la posición correcta del DOM.
    const rowCells = rows[r].cells;
    let insertIndex = 0;
    let visualCol = 0;
    for (let i = 0; i < rowCells.length; i++) {
      if (visualCol >= targetCol) break;
      visualCol += rowCells[i].colSpan || 1;
      insertIndex = i + 1;
    }
    const td = document.createElement('td');
    td.style.border = '1px solid #999';
    td.style.padding = '4px 8px';
    td.innerHTML = '&nbsp;';
    rows[r].insertBefore(td, rowCells[insertIndex] || null);
  }
  return true;
};

export const deleteRow = (editorRef) => {
  const table = getCurrentTable(editorRef);
  const cell = getCurrentCell(editorRef);
  if (!table || !cell) return false;

  const { grid } = getTableGrid(table);
  const pos = getCellGridPosition(table, cell);
  if (!pos) return false;

  const rowIndex = cell.parentElement.rowIndex;

  // Antes de borrar la fila, decrementar rowSpan de celdas que vienen de arriba.
  for (let c = 0; c < grid[pos.row].length; c++) {
    const occupying = grid[pos.row]?.[c];
    if (!occupying) continue;
    const cellPos = getCellGridPosition(table, occupying);
    if (cellPos && cellPos.row < pos.row) {
      // Esta celda viene de una fila superior y cruza la fila a borrar.
      occupying.rowSpan = (occupying.rowSpan || 1) - 1;
      // Mover la celda a la siguiente fila si era la última de su fila original.
      // No es necesario moverla; solo decrementar span.
    }
  }

  table.deleteRow(rowIndex);

  // Si la tabla quedó vacía, eliminarla.
  if (table.rows.length === 0) {
    table.remove();
  }
  return true;
};

export const deleteColumn = (editorRef) => {
  const table = getCurrentTable(editorRef);
  const cell = getCurrentCell(editorRef);
  if (!table || !cell) return false;

  const pos = getCellGridPosition(table, cell);
  if (!pos) return false;

  const colStart = pos.col;
  const colSpan = cell.colSpan || 1;
  const colEnd = colStart + colSpan;

  const rows = table.rows;
  for (let r = rows.length - 1; r >= 0; r--) {
    const { grid } = getTableGrid(table);
    for (let c = colStart; c < colEnd; c++) {
      const occupying = grid[r]?.[c];
      if (!occupying) continue;
      const cellPos = getCellGridPosition(table, occupying);
      if (cellPos && cellPos.col < c && (occupying.colSpan || 1) > 1) {
        // Celda de la izquierda que cruza esta columna: decrementar colSpan.
        occupying.colSpan = (occupying.colSpan || 1) - 1;
      } else if (occupying) {
        // Celda propia de esta columna: eliminarla.
        occupying.remove();
      }
    }
  }

  if (table.rows.length === 0 || (table.rows[0] && table.rows[0].cells.length === 0)) {
    table.remove();
  }
  return true;
};

export const mergeCells = (editorRef) => {
  const table = getCurrentTable(editorRef);
  if (!table) return false;

  const sel = window.getSelection();
  if (!sel?.rangeCount) return false;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return false;

  // Encontrar celda inicial y final a partir de los extremos del rango.
  const startCell = getCellFromNode(range.startContainer, editorRef);
  const endCell = getCellFromNode(range.endContainer, editorRef);
  if (!startCell || !endCell) return false;
  if (startCell === endCell) return false;

  return mergeSelectedCells(editorRef, [startCell, endCell]);
};

// Fusiona un array explícito de celdas. Usado por Ctrl+Click (selección
// manual de celdas) para no depender de window.getSelection().
export const mergeSelectedCells = (editorRef, cells) => {
  if (!editorRef.current || !cells || cells.length < 2) return false;

  // Encontrar la tabla común.
  let table = null;
  for (const cell of cells) {
    let node = cell.parentElement;
    while (node && node !== editorRef.current) {
      if (node.tagName === 'TABLE') { table = node; break; }
      node = node.parentElement;
    }
    if (table) break;
  }
  if (!table) return false;

  // Calcular el rectángulo del grid entre todas las celdas.
  let minRow = Infinity, minCol = Infinity, maxRow = -1, maxCol = -1;
  const cellSet = new Set();
  for (const cell of cells) {
    const p = getCellGridPosition(table, cell);
    if (!p) continue;
    cellSet.add(cell);
    if (p.row < minRow) minRow = p.row;
    if (p.col < minCol) minCol = p.col;
    const rEnd = p.row + (cell.rowSpan || 1) - 1;
    const cEnd = p.col + (cell.colSpan || 1) - 1;
    if (rEnd > maxRow) maxRow = rEnd;
    if (cEnd > maxCol) maxCol = cEnd;
  }

  if (minRow === Infinity) return false;

  // Recoger todas las celdas únicas en el rectángulo.
  const { grid } = getTableGrid(table);
  const selectedCells = new Set();
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const cell = grid[r]?.[c];
      if (cell) selectedCells.add(cell);
    }
  }

  if (selectedCells.size < 2) return false;

  const targetCell = grid[minRow][minCol];
  if (!targetCell) return false;

  const totalRows = maxRow - minRow + 1;
  const totalCols = maxCol - minCol + 1;

  let combinedContent = '';
  selectedCells.forEach(cell => {
    if (cell !== targetCell) {
      combinedContent += cell.innerHTML;
      cell.remove();
    }
  });
  targetCell.rowSpan = totalRows;
  targetCell.colSpan = totalCols;
  if (combinedContent) {
    targetCell.innerHTML += combinedContent;
  }

  // Colocar el cursor en la celda combinada.
  const sel = window.getSelection();
  if (sel) {
    const newRange = document.createRange();
    newRange.selectNodeContents(targetCell);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  return true;
};

export const splitCell = (editorRef) => {
  const cell = getCurrentCell(editorRef);
  const table = getCurrentTable(editorRef);
  if (!cell || !table) return false;

  const rs = cell.rowSpan || 1;
  const cs = cell.colSpan || 1;
  if (rs === 1 && cs === 1) return false;

  const pos = getCellGridPosition(table, cell);
  if (!pos) return false;

  // Restaurar la celda a 1x1 y rellenar el espacio con nuevas celdas.
  cell.rowSpan = 1;
  cell.colSpan = 1;

  const rows = table.rows;
  // Insertar celdas a la derecha en la misma fila.
  for (let cc = 1; cc < cs; cc++) {
    const td = document.createElement('td');
    td.style.border = '1px solid #999';
    td.style.padding = '4px 8px';
    td.innerHTML = '&nbsp;';
    if (cell.nextSibling) {
      cell.parentElement.insertBefore(td, cell.nextSibling);
    } else {
      cell.parentElement.appendChild(td);
    }
  }

  // Insertar celdas completas en las filas inferiores que la celda ocupaba.
  for (let rr = 1; rr < rs; rr++) {
    const targetRow = rows[pos.row + rr];
    if (!targetRow) continue;
    // Encontrar dónde insertar (en pos.col).
    const rowCells = targetRow.cells;
    let insertIndex = 0;
    let visualCol = 0;
    for (let i = 0; i < rowCells.length; i++) {
      if (visualCol >= pos.col) break;
      visualCol += rowCells[i].colSpan || 1;
      insertIndex = i + 1;
    }
    for (let cc = 0; cc < cs; cc++) {
      const td = document.createElement('td');
      td.style.border = '1px solid #999';
      td.style.padding = '4px 8px';
      td.innerHTML = '&nbsp;';
      targetRow.insertBefore(td, rowCells[insertIndex] || null);
      insertIndex++;
    }
  }

  return true;
};

export const deleteTable = (editorRef) => {
  const table = getCurrentTable(editorRef);
  if (!table) return false;
  table.remove();
  return true;
};
