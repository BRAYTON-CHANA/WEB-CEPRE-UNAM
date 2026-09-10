import React, { useEffect, useRef, useState } from 'react';
import {
  RowAboveIcon,
  RowBelowIcon,
  ColLeftIcon,
  ColRightIcon,
  DeleteRowIcon,
  DeleteColIcon,
  MergeCellsIcon,
  SplitCellIcon,
  DeleteTableIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  PaintBucketIcon,
} from '../CorreoIcons';

const Item = ({ icon, label, disabled, danger, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100'
    }`}
  >
    <span className="inline-flex w-4 items-center justify-center text-slate-500">{icon}</span>
    {label}
  </button>
);

const ColorItem = ({ label, onPick }) => (
  <label className="relative flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100">
    <span className="inline-flex w-4 items-center justify-center text-slate-500">
      <PaintBucketIcon />
    </span>
    {label}
    <input
      type="color"
      onChange={(e) => onPick(e.target.value)}
      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
    />
  </label>
);

const Sep = () => <div className="my-1 border-t border-slate-100" />;

const EditorContextMenu = ({ editor }) => {
  const [menu, setMenu] = useState(null); // { x, y, type: 'table' | 'image' }
  const menuRef = useRef(null);

  // Click derecho dentro del área del editor.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onContextMenu = (e) => {
      if (editor.isActive('table')) {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY, type: 'table' });
        return;
      }
      const img = e.target.closest?.('img');
      if (img) {
        e.preventDefault();
        // Seleccionar el nodo imagen para que quede activa
        try {
          const pos = editor.view.posAtDOM(img.closest('[data-node]') || img, -1);
          editor.chain().setNodeSelection(pos).run();
        } catch { /* si no resuelve, igual mostramos el menú */ }
        setMenu({ x: e.clientX, y: e.clientY, type: 'image' });
      }
      // texto normal → menú nativo del navegador
    };
    dom.addEventListener('contextmenu', onContextMenu);
    return () => dom.removeEventListener('contextmenu', onContextMenu);
  }, [editor]);

  // Cierre: click fuera, Escape, scroll.
  useEffect(() => {
    if (!menu) return;
    const close = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenu(null);
    };
    const onKey = (e) => e.key === 'Escape' && setMenu(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  if (!editor || !menu) return null;

  const act = (fn) => () => {
    fn();
    setMenu(null);
  };

  const style = {
    left: Math.min(menu.x, window.innerWidth - 220),
    top: Math.min(menu.y, window.innerHeight - 320),
  };

  return (
    <div
      ref={menuRef}
      style={style}
      className="fixed z-50 w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-xl"
    >
      {menu.type === 'table' ? (
        <>
          <Item icon={<RowAboveIcon />} label="Insertar fila arriba" disabled={!editor.can().addRowBefore()} onClick={act(() => editor.chain().focus().addRowBefore().run())} />
          <Item icon={<RowBelowIcon />} label="Insertar fila abajo" disabled={!editor.can().addRowAfter()} onClick={act(() => editor.chain().focus().addRowAfter().run())} />
          <Item icon={<DeleteRowIcon />} label="Eliminar fila" disabled={!editor.can().deleteRow()} onClick={act(() => editor.chain().focus().deleteRow().run())} />
          <Sep />
          <Item icon={<ColLeftIcon />} label="Columna a la izquierda" disabled={!editor.can().addColumnBefore()} onClick={act(() => editor.chain().focus().addColumnBefore().run())} />
          <Item icon={<ColRightIcon />} label="Columna a la derecha" disabled={!editor.can().addColumnAfter()} onClick={act(() => editor.chain().focus().addColumnAfter().run())} />
          <Item icon={<DeleteColIcon />} label="Eliminar columna" disabled={!editor.can().deleteColumn()} onClick={act(() => editor.chain().focus().deleteColumn().run())} />
          <Sep />
          <Item icon={<MergeCellsIcon />} label="Combinar celdas" disabled={!editor.can().mergeCells()} onClick={act(() => editor.chain().focus().mergeCells().run())} />
          <Item icon={<SplitCellIcon />} label="Dividir celda" disabled={!editor.can().splitCell()} onClick={act(() => editor.chain().focus().splitCell().run())} />
          <ColorItem label="Color de fondo de celda" onPick={(c) => act(() => editor.chain().focus().setCellAttribute('backgroundColor', c).run())()} />
          <Sep />
          <Item icon={<DeleteTableIcon />} label="Eliminar tabla" danger disabled={!editor.can().deleteTable()} onClick={act(() => editor.chain().focus().deleteTable().run())} />
        </>
      ) : (
        <>
          <Item icon={<AlignLeftIcon />} label="Alinear a la izquierda" onClick={act(() => editor.chain().focus().updateAttributes('image', { dataAlign: null }).run())} />
          <Item icon={<AlignCenterIcon />} label="Centrar" onClick={act(() => editor.chain().focus().updateAttributes('image', { dataAlign: 'center' }).run())} />
          <Item icon={<AlignRightIcon />} label="Alinear a la derecha" onClick={act(() => editor.chain().focus().updateAttributes('image', { dataAlign: 'right' }).run())} />
          <Sep />
          <Item icon={<span className="text-xs font-bold">×</span>} label="Eliminar imagen" danger onClick={act(() => editor.chain().focus().deleteSelection().run())} />
        </>
      )}
    </div>
  );
};

export default EditorContextMenu;
