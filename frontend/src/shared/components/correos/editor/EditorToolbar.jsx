import React, { useEffect, useRef, useState } from 'react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  ListBulletIcon,
  ListNumberIcon,
  MarkerIcon,
  PaperclipIcon,
  ImageIcon,
  TableIcon,
  FontColorIcon,
  PaintBucketIcon,
} from '../CorreoIcons';

const IconBase = ({ className = 'w-4 h-4', strokeWidth = 2, children }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const UndoIcon = (props) => (
  <IconBase {...props}>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 00-15-6.7L3 13" />
  </IconBase>
);

const RedoIcon = (props) => (
  <IconBase {...props}>
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0115-6.7L21 13" />
  </IconBase>
);

const StrikeIcon = (props) => (
  <IconBase {...props}>
    <path d="M16 4H9a3 3 0 00-2.83 4" />
    <path d="M14 12a4 4 0 010 8H6" />
    <line x1="4" y1="12" x2="20" y2="12" />
  </IconBase>
);

const QuoteIcon = (props) => (
  <IconBase {...props}>
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
  </IconBase>
);

const CodeBlockIcon = (props) => (
  <IconBase {...props}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </IconBase>
);

const LinkIcon = (props) => (
  <IconBase {...props}>
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </IconBase>
);

const UnlinkIcon = (props) => (
  <IconBase {...props}>
    <path d="M18.84 12.25l1.72-1.71a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M5.17 11.75l-1.72 1.71a5 5 0 007.07 7.07l1.71-1.71" />
    <line x1="8" y1="2" x2="8" y2="5" />
    <line x1="2" y1="8" x2="5" y2="8" />
    <line x1="16" y1="22" x2="16" y2="19" />
    <line x1="19" y1="16" x2="22" y2="16" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </IconBase>
);

const AlignJustifyIcon = (props) => (
  <IconBase {...props}>
    <line x1="21" y1="6" x2="3" y2="6" />
    <line x1="21" y1="10" x2="3" y2="10" />
    <line x1="21" y1="14" x2="3" y2="14" />
    <line x1="21" y1="18" x2="3" y2="18" />
  </IconBase>
);

const HrIcon = (props) => (
  <IconBase {...props}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="18" x2="16" y2="18" />
  </IconBase>
);

const ClearFormatIcon = (props) => (
  <IconBase {...props}>
    <path d="M4 7V4h16v3" />
    <path d="M9 20h6" />
    <path d="M12 4v13" />
    <line x1="3" y1="21" x2="21" y2="3" />
  </IconBase>
);

const SubscriptIcon = (props) => (
  <IconBase {...props}>
    <path d="M4 5l8 8" />
    <path d="M12 5l-8 8" />
    <path d="M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 00-1.52-.71c-.82 0-1.57.4-2 1.14" />
    <path d="M18 19h2" />
  </IconBase>
);

const SuperscriptIcon = (props) => (
  <IconBase {...props}>
    <path d="M4 19l8-8" />
    <path d="M12 19l-8-8" />
    <path d="M20 12h-4c0-1.5.44-2 1.5-2.5S20 8.33 20 7c0-.47-.17-.93-.48-1.29a2.11 2.11 0 00-1.52-.71c-.82 0-1.57.4-2 1.14" />
    <path d="M18 12h2" />
  </IconBase>
);

const ToolbarButton = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed ${
      active
        ? 'bg-blue-100 text-blue-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    {children}
  </button>
);

const Group = ({ children }) => (
  <div className="inline-flex items-center gap-0 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
    {children}
  </div>
);

const FONT_FAMILIES = [
  { value: '', label: 'Fuente' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: "'Times New Roman', serif", label: 'Times New Roman' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
];

const FONT_SIZES = [
  { value: '', label: 'Tamaño' },
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '28px', label: '28' },
  { value: '32px', label: '32' },
];

const ColorButton = ({ title, disabled, currentColor, onPick, onClear, icon }) => (
  <span className="relative inline-flex">
    <label
      title={title}
      className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-slate-100 ${
        disabled ? 'pointer-events-none opacity-40' : ''
      }`}
      style={currentColor ? { color: currentColor } : undefined}
    >
      {icon}
      <input
        type="color"
        disabled={disabled}
        onChange={(e) => onPick(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
    {currentColor && (
      <button
        type="button"
        title={`Quitar ${title.toLowerCase()}`}
        onClick={onClear}
        className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-200 text-[9px] text-slate-600 hover:bg-red-100 hover:text-red-600"
      >
        ×
      </button>
    )}
  </span>
);

const TABLE_GRID_MAX = 8;

const TableGridPicker = ({ editor, disabled }) => {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState({ rows: 0, cols: 0 });
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const insert = (rows, cols) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setOpen(false);
    setHover({ rows: 0, cols: 0 });
  };

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <ToolbarButton
        title="Insertar tabla"
        active={open || editor.isActive('table')}
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
      >
        <TableIcon />
      </ToolbarButton>
      {open && (
        <div className="absolute left-0 top-8 z-40 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${TABLE_GRID_MAX}, 1rem)` }}
            onMouseLeave={() => setHover({ rows: 0, cols: 0 })}
          >
            {Array.from({ length: TABLE_GRID_MAX * TABLE_GRID_MAX }).map((_, i) => {
              const r = Math.floor(i / TABLE_GRID_MAX) + 1;
              const c = (i % TABLE_GRID_MAX) + 1;
              const active = r <= hover.rows && c <= hover.cols;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHover({ rows: r, cols: c })}
                  onClick={() => insert(r, c)}
                  className={`h-4 w-4 rounded-[2px] border transition-colors ${
                    active ? 'border-blue-500 bg-blue-100' : 'border-slate-200 bg-slate-50'
                  }`}
                />
              );
            })}
          </div>
          <p className="mt-1.5 text-center text-[10px] text-slate-500">
            {hover.rows > 0 ? `${hover.rows} × ${hover.cols}` : 'Elige el tamaño'}
          </p>
          <p className="text-center text-[10px] text-slate-400">Tip: click derecho dentro de una tabla para más opciones</p>
        </div>
      )}
    </span>
  );
};

const EditorToolbar = ({ editor, disabled, onAttach, onInsertImage }) => {
  if (!editor) return null;

  // Alineación: si hay imagen seleccionada se aplica data-align al nodo imagen,
  // si no, text-align al párrafo/encabezado actual.
  const isImageActive = editor.isActive('image');
  const imageAlign = isImageActive ? editor.getAttributes('image').dataAlign : undefined;

  const setAlign = (value) => {
    if (isImageActive) {
      editor.chain().focus().updateAttributes('image', { dataAlign: value === 'left' ? null : value }).run();
    } else {
      editor.chain().focus().setTextAlign(value).run();
    }
  };
  const isAlignActive = (value) =>
    isImageActive ? (imageAlign ?? 'left') === value : editor.isActive({ textAlign: value });

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '' || url === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const selectClass =
    'h-6 rounded-md border-0 bg-transparent px-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40';

  return (
    <div className="border-b border-slate-200 bg-slate-50/80 px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Group>
          <ToolbarButton title="Deshacer" disabled={disabled || !editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
            <UndoIcon />
          </ToolbarButton>
          <ToolbarButton title="Rehacer" disabled={disabled || !editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
            <RedoIcon />
          </ToolbarButton>
        </Group>

        <Group>
          <select
            value={editor.getAttributes('textStyle').fontFamily || ''}
            onChange={(e) => {
              const chain = editor.chain().focus();
              if (e.target.value) chain.setFontFamily(e.target.value).run();
              else chain.unsetFontFamily().run();
            }}
            disabled={disabled}
            className={`${selectClass} max-w-[110px]`}
          >
            {FONT_FAMILIES.map(f => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value || undefined }}>{f.label}</option>
            ))}
          </select>
          <select
            value={editor.getAttributes('textStyle').fontSize || ''}
            onChange={(e) => {
              const chain = editor.chain().focus();
              if (e.target.value) chain.setFontSize(e.target.value).run();
              else chain.unsetFontSize().run();
            }}
            disabled={disabled}
            className={selectClass}
          >
            {FONT_SIZES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Group>

        <Group>
          <ToolbarButton title="Negrita" active={editor.isActive('bold')} disabled={disabled || !editor.can().toggleBold()} onClick={() => editor.chain().focus().toggleBold().run()}>
            <BoldIcon />
          </ToolbarButton>
          <ToolbarButton title="Cursiva" active={editor.isActive('italic')} disabled={disabled || !editor.can().toggleItalic()} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <ItalicIcon />
          </ToolbarButton>
          <ToolbarButton title="Subrayado" active={editor.isActive('underline')} disabled={disabled || !editor.can().toggleUnderline()} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon />
          </ToolbarButton>
          <ToolbarButton title="Tachado" active={editor.isActive('strike')} disabled={disabled || !editor.can().toggleStrike()} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <StrikeIcon />
          </ToolbarButton>
        </Group>

        <Group>
          <ToolbarButton title="Subíndice" active={editor.isActive('subscript')} disabled={disabled} onClick={() => editor.chain().focus().unsetSuperscript().toggleSubscript().run()}>
            <SubscriptIcon />
          </ToolbarButton>
          <ToolbarButton title="Superíndice" active={editor.isActive('superscript')} disabled={disabled} onClick={() => editor.chain().focus().unsetSubscript().toggleSuperscript().run()}>
            <SuperscriptIcon />
          </ToolbarButton>
        </Group>

        <Group>
          <ColorButton
            title="Color de texto"
            disabled={disabled}
            currentColor={editor.getAttributes('textStyle').color}
            onPick={(color) => editor.chain().focus().setColor(color).run()}
            onClear={() => editor.chain().focus().unsetColor().run()}
            icon={<FontColorIcon />}
          />
          <ColorButton
            title="Color de fondo"
            disabled={disabled}
            currentColor={editor.getAttributes('textStyle').backgroundColor}
            onPick={(color) => editor.chain().focus().setBackgroundColor(color).run()}
            onClear={() => editor.chain().focus().unsetBackgroundColor().run()}
            icon={<PaintBucketIcon />}
          />
          <ToolbarButton title="Resaltar" active={editor.isActive('highlight')} disabled={disabled || !editor.can().toggleHighlight()} onClick={() => editor.chain().focus().toggleHighlight().run()}>
            <MarkerIcon />
          </ToolbarButton>
        </Group>

        <Group>
          <ToolbarButton title="Lista con viñetas" active={editor.isActive('bulletList')} disabled={disabled} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <ListBulletIcon />
          </ToolbarButton>
          <ToolbarButton title="Lista numerada" active={editor.isActive('orderedList')} disabled={disabled} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListNumberIcon />
          </ToolbarButton>
          <ToolbarButton title="Cita" active={editor.isActive('blockquote')} disabled={disabled} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <QuoteIcon />
          </ToolbarButton>
          <ToolbarButton title="Bloque de código" active={editor.isActive('codeBlock')} disabled={disabled} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <CodeBlockIcon />
          </ToolbarButton>
        </Group>

        <Group>
          <ToolbarButton title="Alinear a la izquierda" active={isAlignActive('left')} disabled={disabled} onClick={() => setAlign('left')}>
            <AlignLeftIcon />
          </ToolbarButton>
          <ToolbarButton title="Centrar" active={isAlignActive('center')} disabled={disabled} onClick={() => setAlign('center')}>
            <AlignCenterIcon />
          </ToolbarButton>
          <ToolbarButton title="Alinear a la derecha" active={isAlignActive('right')} disabled={disabled} onClick={() => setAlign('right')}>
            <AlignRightIcon />
          </ToolbarButton>
          <ToolbarButton title="Justificar" active={isAlignActive('justify')} disabled={disabled || isImageActive} onClick={() => setAlign('justify')}>
            <AlignJustifyIcon />
          </ToolbarButton>
        </Group>

        <Group>
          <ToolbarButton title="Insertar enlace" active={editor.isActive('link')} disabled={disabled} onClick={setLink}>
            <LinkIcon />
          </ToolbarButton>
          <ToolbarButton title="Quitar enlace" disabled={disabled || !editor.isActive('link')} onClick={() => editor.chain().focus().unsetLink().run()}>
            <UnlinkIcon />
          </ToolbarButton>
        </Group>

        <Group>
          <ToolbarButton title="Insertar imagen desde archivo" disabled={disabled || !onInsertImage} onClick={onInsertImage}>
            <ImageIcon />
          </ToolbarButton>
          <TableGridPicker editor={editor} disabled={disabled} />
          <ToolbarButton title="Línea horizontal" disabled={disabled} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <HrIcon />
          </ToolbarButton>
          <ToolbarButton title="Limpiar formato" disabled={disabled} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
            <ClearFormatIcon />
          </ToolbarButton>
        </Group>

        {onAttach && (
          <Group>
            <ToolbarButton title="Adjuntar archivos" disabled={disabled} onClick={onAttach}>
              <PaperclipIcon />
            </ToolbarButton>
          </Group>
        )}
      </div>
    </div>
  );
};

export default EditorToolbar;
