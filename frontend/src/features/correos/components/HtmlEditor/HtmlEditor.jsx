import React, { useState } from 'react';
import useHtmlEditor from '@/features/correos/hooks/useHtmlEditor';
import { getCurrentCell, getCellFromNode, canSplitCell, getSelectedCellDimensions, getCellsInRange } from '@/features/correos/utils/htmlEditor';
import EditorToolbar from './EditorToolbar';
import ImageResizer from './ImageResizer';
import TableEdgeHandles from './TableEdgeHandles';
import AttachmentBar from '../AttachmentBar';

const HtmlEditor = ({ value = '', onChange, label = 'Cuerpo del correo', placeholder = 'Escriba el contenido...', error, required, disabled = false, adjuntos = [], onFilesSelected, removeAdjunto, fileInputRef, mergeFields }) => {
  const {
    editorRef,
    toolbarRef,
    focused,
    highlightColor,
    setHighlightColor,
    currentFont,
    currentSize,
    currentColor,
    isEmpty,
    updateFormat,
    userUpdateFormat,
    clearPending,
    exec,
    applyHighlight,
    handleInput,
    handleBlur,
    handleFocus,
    saveRange,
    handleFontChange,
    handleSizeChange,
    handleColorChange,
    handleKeyDown,
    handleImageInsert,
    handleImageResize,
    handleInsertMergeField,
    handleTableAction,
  } = useHtmlEditor({ value, onChange, disabled });

  const [selectedImage, setSelectedImage] = useState(null);
  const [cursorInTable, setCursorInTable] = useState(false);
  const [canSplit, setCanSplit] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [cellPopupPos, setCellPopupPos] = useState(null);
  const [hoveredTable, setHoveredTable] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Información de las celdas seleccionadas (count, rows, cols, label).
  const selectedCellInfo = getSelectedCellDimensions(editorRef, selectedCells);

  // Aplica/quita el resaltado visual de las celdas seleccionadas.
  const applyCellHighlight = (cells) => {
    if (!editorRef.current) return;
    editorRef.current.querySelectorAll('.selected-cell').forEach(el => el.classList.remove('selected-cell'));
    cells.forEach(cell => cell.classList.add('selected-cell'));
    // Calcular posición del popup sobre la primera celda.
    if (cells.length > 0 && editorRef.current) {
      const firstRect = cells[0].getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      setCellPopupPos({
        left: firstRect.left - editorRect.left,
        top: firstRect.top - editorRect.top - 28,
      });
    } else {
      setCellPopupPos(null);
    }
  };

  const clearSelectedCells = () => {
    if (editorRef.current) {
      editorRef.current.querySelectorAll('.selected-cell').forEach(el => el.classList.remove('selected-cell'));
    }
    setSelectedCells([]);
    setCellPopupPos(null);
  };

  const handleMergeSelected = () => {
    handleTableActionWrapped('mergeSelected', { cells: selectedCells });
    clearSelectedCells();
  };

  const handleCellColor = (color) => {
    const cells = selectedCells.length > 0
      ? selectedCells
      : (getCurrentCell(editorRef) ? [getCurrentCell(editorRef)] : []);
    if (cells.length === 0) return;
    handleTableActionWrapped('cellBackground', { cells, color });
    clearSelectedCells();
  };

  // Wrapper que actualiza cursorInTable y canSplit después de cualquier
  // operación de tabla (especialmente insert, que mueve el cursor a la
  // primera celda sin disparar onMouseUp/onKeyUp).
  const handleTableActionWrapped = (action, payload) => {
    handleTableAction(action, payload);
    // Usar requestAnimationFrame para que el DOM se actualice antes de leer.
    requestAnimationFrame(() => {
      setCursorInTable(!!getCurrentCell(editorRef));
      setCanSplit(canSplitCell(editorRef));
    });
  };

  const handleAddEdge = (action, activeCell) => {
    if (!action || !activeCell) return;
    handleTableActionWrapped(action, { referenceCell: activeCell });
  };

  const handleTableMouseMove = (e) => {
    setMousePos({ clientX: e.clientX, clientY: e.clientY });
    const cell = getCellFromNode(e.target, editorRef);
    if (!cell) {
      setHoveredCell(null);
      return;
    }
    const table = cell.closest?.('table');
    setHoveredCell(cell);
    if (table !== hoveredTable) setHoveredTable(table);
  };

  const handleTableMouseLeave = () => {
    setHoveredTable(null);
    setHoveredCell(null);
  };

  const handleDragOver = (e) => {
    if (disabled || !onFilesSelected) return;
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e) => {
    if (disabled || !onFilesSelected) return;
    if (e.dataTransfer.files?.length) {
      e.preventDefault();
      onFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-2">
      <style>{`
        .html-editor-table td::selection,
        .html-editor-table th::selection,
        .html-editor-table td *::selection,
        .html-editor-table th *::selection {
          background: transparent;
          color: inherit;
        }
      `}</style>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div
        className={`
          border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <EditorToolbar
          toolbarRef={toolbarRef}
          currentFont={currentFont}
          currentSize={currentSize}
          currentColor={currentColor}
          highlightColor={highlightColor}
          onFontChange={handleFontChange}
          onSizeChange={handleSizeChange}
          onColorChange={handleColorChange}
          onHighlightChange={setHighlightColor}
          onHighlightApply={applyHighlight}
          onSaveRange={saveRange}
          onImageInsert={handleImageInsert}
          onAttach={fileInputRef ? () => fileInputRef.current?.click() : undefined}
          mergeFields={mergeFields}
          onInsertMergeField={handleInsertMergeField}
          onTableAction={handleTableActionWrapped}
          inTable={cursorInTable}
          selectedCellCount={selectedCells.length}
          selectedCellInfo={selectedCellInfo}
          canSplit={canSplit}
          onMergeSelected={handleMergeSelected}
          onCellColor={handleCellColor}
          exec={exec}
          disabled={disabled}
        />
        {fileInputRef && (
          <AttachmentBar
            adjuntos={adjuntos}
            onRemove={removeAdjunto}
            onFilesSelected={onFilesSelected}
            fileInputRef={fileInputRef}
          />
        )}
        <div
          className="relative min-h-[240px]"
          onMouseMove={handleTableMouseMove}
          onMouseLeave={handleTableMouseLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseDown={(e) => {
              clearPending();
              if (e.target.tagName === 'IMG') {
                e.preventDefault();
                setSelectedImage(e.target);
                return;
              }
              setSelectedImage(null);
              // Limpiar selección previa al iniciar un nuevo mouse down.
              // Si el usuario arrastra entre celdas, onMouseUp detectará la
              // multi-selección.
              if (selectedCells.length > 0) clearSelectedCells();
            }}
            onMouseUp={() => {
              userUpdateFormat();
              setCursorInTable(!!getCurrentCell(editorRef));
              setCanSplit(canSplitCell(editorRef));
              // Detectar si el usuario arrastró entre celdas.
              const cells = getCellsInRange(editorRef);
              if (cells.length >= 2) {
                setSelectedCells(cells);
                applyCellHighlight(cells);
                // Limpiar selección de texto nativa del navegador para que no
                // se vea el azul nativo en celdas adyacentes (especialmente al
                // arrastrar vertical). Solo nuestro outline azul debe quedar.
                const sel = window.getSelection();
                if (sel) sel.removeAllRanges();
              }
            }}
            onKeyUp={() => {
              userUpdateFormat();
              setCursorInTable(!!getCurrentCell(editorRef));
              setCanSplit(canSplitCell(editorRef));
            }}
            onKeyDown={(e) => {
              setSelectedImage(null);
              // No limpiar selección si es solo una tecla modificadora.
              if (selectedCells.length > 0 && !['Control', 'Meta', 'Shift', 'Alt'].includes(e.key)) {
                clearSelectedCells();
              }
              handleKeyDown(e);
            }}
            style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px' }}
            className="html-editor-table w-full h-full min-h-[240px] px-4 py-3 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-inset focus:ring-gray-200 overflow-auto [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_div]:mb-1 [&_table]:border-collapse [&_td]:border [&_td]:border-gray-400 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-gray-400 [&_th]:px-2 [&_th]:py-1 [&_.selected-cell]:bg-gray-300 [&_.selected-cell]:border-gray-500"
          />
          {(!value || isEmpty(value)) && !focused && (
            <span className="absolute left-4 top-3 text-sm text-gray-400 pointer-events-none">
              {placeholder}
            </span>
          )}
          {selectedImage && (
            <ImageResizer
              target={selectedImage}
              editorRef={editorRef}
              onResizeEnd={handleImageResize}
            />
          )}
          {selectedCells.length > 0 && cellPopupPos && (
            <div
              className="absolute z-30 px-2 py-1 bg-blue-600 text-white text-xs rounded shadow-lg pointer-events-none whitespace-nowrap"
              style={{ left: cellPopupPos.left, top: cellPopupPos.top }}
            >
              {selectedCellInfo.label}
            </div>
          )}
          {hoveredTable && (
            <TableEdgeHandles
              table={hoveredTable}
              editorRef={editorRef}
              hoveredCell={hoveredCell}
              mousePos={mousePos}
              onAdd={handleAddEdge}
            />
          )}
        </div>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
};

export default HtmlEditor;
