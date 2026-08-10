import { useEffect, useRef, useState } from 'react';
import { DEFAULT_FONT, DEFAULT_FONT_SIZE, DEFAULT_FONT_COLOR, MIN_FONT_SIZE, MAX_FONT_SIZE } from '@/features/correos/constants/editor';
import { getCurrentRange, restoreRange, getCurrentFormat, isEmpty, getCurrentCell, insertTable, addRow, addColumn, deleteRow, deleteColumn, mergeCells, mergeSelectedCells, splitCell, deleteTable, setCellBackground } from '@/features/correos/utils/htmlEditor';

const useHtmlEditor = ({ value = '', onChange, disabled = false }) => {
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#FFFF00');
  const [currentFont, setCurrentFont] = useState(DEFAULT_FONT);
  const [currentSize, setCurrentSize] = useState(String(DEFAULT_FONT_SIZE));
  const [currentColor, setCurrentColor] = useState(DEFAULT_FONT_COLOR);
  const isInternalUpdate = useRef(false);
  const savedRange = useRef(null);
  const savedFormatBeforeEnter = useRef(null);
  // Cambio manual de fuente/tamaño/color pendiente de materializarse en el DOM.
  // execCommand('fontName'/'fontSize'/'foreColor') con cursor colapsado no siempre aplica
  // el formato al texto existente (deja un "typing style" que aparece al
  // escribir), y applyFontSize hace cirugía de DOM que dispara varios
  // selectionchange asíncronos. Para que el select respete la elección del
  // usuario, guardamos el valor pendiente y lo usamos en updateFormat sin
  // limpiarlo aquí; los pendientes se limpian solo por interacción explícita
  // del usuario en el editor (click, teclas, escribir).
  const pendingFont = useRef(null);
  const pendingSize = useRef(null);
  const pendingColor = useRef(null);

  const clearPending = () => {
    pendingFont.current = null;
    pendingSize.current = null;
    pendingColor.current = null;
  };

  const updateFormat = () => {
    if (!editorRef.current) return;
    const format = getCurrentFormat(editorRef, savedRange);
    // Editor vacío: getCurrentFormat devuelve null. Conservamos el último
    // formato mostrado para que al borrar todo no se resetee a Arial 11.
    // Los cambios manuales (handleFontChange/handleSizeChange/handleColorChange) siguen
    // seteando el estado directamente, así que funcionan con editor vacío.
    if (!format) return;

    // Si hay un cambio manual pendiente, lo respetamos por encima de lo que
    // lee el DOM (que puede ser stale por la cirugía asíncrona de
    // applyFontSize o por el "typing style" no materializado). Los pendientes
    // se limpian desde clearPending() en los handlers de interacción del
    // usuario, no aquí.
    setCurrentFont(pendingFont.current || format.fontFamily);
    setCurrentSize(pendingSize.current || format.fontSize);
    setCurrentColor(pendingColor.current || format.fontColor || DEFAULT_FONT_COLOR);
  };

  // updateFormat tras una interacción explícita del usuario (click/tecla en el
  // editor): primero limpia los pendientes y luego lee el formato real.
  const userUpdateFormat = () => {
    clearPending();
    updateFormat();
  };

  useEffect(() => {
    const handleSelectionChange = () => updateFormat();
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const current = editorRef.current.innerHTML;
    if (current !== value) {
      editorRef.current.innerHTML = value;
    }
    updateFormat();
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      document.execCommand('defaultParagraphSeparator', false, 'div');
    }
    updateFormat();
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type !== 'childList') return;
        mutation.addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE || node.tagName !== 'DIV') return;
          if (node.parentElement !== editorRef.current) return;

          const isEmptyBlock = !node.textContent || node.textContent === '\u200B';
          if (!isEmptyBlock) return;

          const format = savedFormatBeforeEnter.current;
          if (!format) return;

          const isDefault = format.fontFamily === DEFAULT_FONT && format.fontSize === String(DEFAULT_FONT_SIZE);
          if (isDefault) return;

          if (format.fontFamily) {
            node.style.fontFamily = format.fontFamily;
          }
          if (format.fontSize) {
            node.style.fontSize = `${format.fontSize}px`;
          }

          savedFormatBeforeEnter.current = null;
        });
      });
    });

    observer.observe(editorRef.current, { childList: true, subtree: false });
    return () => observer.disconnect();
  }, []);

  const exec = (command, arg = null) => {
    if (disabled || !editorRef.current) return;
    editorRef.current.focus();
    const current = getCurrentRange(editorRef);
    if (!current && savedRange.current) {
      restoreRange(savedRange.current);
    }
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(command, false, arg);
    isInternalUpdate.current = true;
    onChange?.(editorRef.current.innerHTML);
    updateFormat();
  };

  const applyHighlight = (color) => {
    if (disabled || !editorRef.current || !color) return;
    editorRef.current.focus();
    restoreRange(savedRange.current);
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('hiliteColor', false, color === 'transparent' ? 'rgba(0,0,0,0)' : color);
    isInternalUpdate.current = true;
    onChange?.(editorRef.current.innerHTML);
  };

  const applyFontSize = (size) => {
    if (disabled || !editorRef.current) return;
    const num = parseInt(size, 10);
    if (Number.isNaN(num) || num < MIN_FONT_SIZE || num > MAX_FONT_SIZE) return;

    editorRef.current.focus();
    restoreRange(savedRange.current);

    document.execCommand('styleWithCSS', false, false);
    document.execCommand('fontSize', false, '7');
    document.execCommand('styleWithCSS', false, true);

    const fonts = editorRef.current.querySelectorAll('font[size="7"]');

    if (fonts.length === 0) {
      const sel = window.getSelection();
      if (sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = `${num}px`;
        const placeholder = document.createTextNode('\u200B');
        span.appendChild(placeholder);
        range.insertNode(span);
        // Cursor DENTRO del span, tras el placeholder, para que el texto que
        // se escriba a continuación herede el fontSize del span.
        range.setStartAfter(placeholder);
        range.setEndAfter(placeholder);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else {
      const newSpans = [];
      fonts.forEach(font => {
        const parent = font.parentElement;

        if (parent?.tagName === 'SPAN' && parent.style.fontSize) {
          parent.style.fontSize = `${num}px`;
          parent.innerHTML = font.innerHTML || '\u200B';
          newSpans.push(parent);
        } else {
          const span = document.createElement('span');
          span.style.fontSize = `${num}px`;
          span.innerHTML = font.innerHTML || '\u200B';
          font.replaceWith(span);
          newSpans.push(span);
        }
      });

      newSpans.forEach(span => {
        const childSpans = span.querySelectorAll('span');
        childSpans.forEach(child => {
          if (child.style.fontSize) {
            child.style.fontSize = '';
            if (child.style.length === 0) {
              child.replaceWith(document.createTextNode(child.textContent));
            }
          }
        });
      });
    }

    isInternalUpdate.current = true;
    onChange?.(editorRef.current.innerHTML);
    // Re-afirmamos el pendiente y el estado: la cirugía de DOM anterior dispara
    // selectionchange asíncronos que pueden haber colapsado la selección fuera
    // del span, haciendo que updateFormat lea un tamaño stale. pendingSize
    // asegura que el select muestre el tamaño recién aplicado hasta que el
    // usuario interactúe de nuevo con el editor.
    pendingSize.current = String(num);
    setCurrentSize(String(num));
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    isInternalUpdate.current = true;
    onChange?.(editorRef.current.innerHTML);
    // Al escribir, el "typing style" pendiente se materializa en el DOM:
    // liberamos los pendientes para que updateFormat lea la fuente real.
    userUpdateFormat();
  };

  const handleBlur = () => {
    setFocused(false);
    const active = document.activeElement;
    if (!active || !toolbarRef.current?.contains(active)) {
      savedRange.current = getCurrentRange(editorRef);
    }
  };

  const handleFocus = () => {
    setFocused(true);
    updateFormat();
  };

  const saveRange = () => {
    savedRange.current = getCurrentRange(editorRef);
  };

  const handleFontChange = (font) => {
    pendingFont.current = font;
    setCurrentFont(font);
    exec('fontName', font);
  };

  const handleSizeChange = (size) => {
    const s = String(size);
    pendingSize.current = s;
    setCurrentSize(s);
    applyFontSize(size);
  };

  const handleColorChange = (color) => {
    pendingColor.current = color;
    setCurrentColor(color);
    exec('foreColor', color);
  };

  const handleKeyDown = (e) => {
    // Cualquier tecla (flechas, Enter, etc.) = el usuario se mueve o escribe:
    // nuevo contexto, los pendientes del toolbar ya no aplican.
    clearPending();
    if (e.key === 'Enter' && !e.shiftKey) {
      savedFormatBeforeEnter.current = getCurrentFormat(editorRef, savedRange);
    }
  };

  const handleImageInsert = (dataUrl) => {
    if (disabled || !editorRef.current) return;
    editorRef.current.focus();
    const current = getCurrentRange(editorRef);
    if (!current && savedRange.current) {
      restoreRange(savedRange.current);
    }

    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Imagen';
    img.draggable = false;
    img.style.display = 'inline-block';
    img.style.verticalAlign = 'baseline';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';

    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0);
      range.insertNode(img);
      // Movemos el cursor detrás de la imagen para seguir escribiendo.
      range.setStartAfter(img);
      range.setEndAfter(img);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editorRef.current.appendChild(img);
    }

    isInternalUpdate.current = true;
    onChange?.(editorRef.current.innerHTML);
  };

  const handleImageResize = () => {
    if (!editorRef.current) return;
    isInternalUpdate.current = true;
    onChange?.(editorRef.current.innerHTML);
  };

  const handleInsertMergeField = (field) => {
    if (disabled || !editorRef.current) return;
    editorRef.current.focus();
    if (savedRange.current) restoreRange(savedRange.current);

    const span = document.createElement('span');
    span.className = 'merge-field';
    span.contentEditable = 'false';
    span.dataset.field = field;
    span.textContent = `{{${field}}}`;
    span.style.cssText = 'background:#e0e7ff;color:#3730a3;padding:1px 6px;border-radius:4px;font-size:0.85em;font-weight:600;cursor:default;display:inline-block;';

    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0);
      range.insertNode(span);
      range.setStartAfter(span);
      range.setEndAfter(span);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editorRef.current.appendChild(span);
    }

    isInternalUpdate.current = true;
    onChange?.(editorRef.current.innerHTML);
  };

  const handleTableAction = (action, payload = {}) => {
    if (disabled || !editorRef.current) return;
    editorRef.current.focus();
    if (savedRange.current) restoreRange(savedRange.current);

    let ok = false;
    switch (action) {
      case 'insert':
        ok = insertTable(editorRef, payload.rows || 2, payload.cols || 2);
        break;
      case 'addRowAbove':
        ok = addRow(editorRef, 'above', payload.referenceCell);
        break;
      case 'addRowBelow':
        ok = addRow(editorRef, 'below', payload.referenceCell);
        break;
      case 'addColLeft':
        ok = addColumn(editorRef, 'left', payload.referenceCell);
        break;
      case 'addColRight':
        ok = addColumn(editorRef, 'right', payload.referenceCell);
        break;
      case 'deleteRow':
        ok = deleteRow(editorRef);
        break;
      case 'deleteCol':
        ok = deleteColumn(editorRef);
        break;
      case 'merge':
        ok = mergeCells(editorRef);
        break;
      case 'mergeSelected':
        ok = mergeSelectedCells(editorRef, payload.cells);
        break;
      case 'split':
        ok = splitCell(editorRef);
        break;
      case 'deleteTable':
        ok = deleteTable(editorRef);
        break;
      case 'cellBackground':
        ok = setCellBackground(payload.cells || [getCurrentCell(editorRef)].filter(Boolean), payload.color);
        break;
      default:
        break;
    }

    if (ok) {
      isInternalUpdate.current = true;
      onChange?.(editorRef.current.innerHTML);
      updateFormat();
    }
  };

  return {
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
  };
};

export default useHtmlEditor;
