import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { FileHandler } from '@tiptap/extension-file-handler';
import { Placeholder } from '@tiptap/extensions';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { TableKit, TableCell } from '@tiptap/extension-table';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Image from '@tiptap/extension-image';
import EditorToolbar from './EditorToolbar';
import EditorContextMenu from './EditorContextMenu';
import AttachmentBar from '../AttachmentBar';
import MergeField from './MergeField';
import MergeFieldModal from './MergeFieldModal';
import { MergeFieldIcon } from '../CorreoIcons';

// Imagen con atributo de alineación (data-align) para izquierda/centro/derecha.
const AlignedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      dataAlign: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-align'),
        renderHTML: (attributes) =>
          attributes.dataAlign ? { 'data-align': attributes.dataAlign } : {},
      },
    };
  },
});

// Celda de tabla con soporte de color de fondo (atributo data-background-color).
const ColoredTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-background-color') || element.style?.backgroundColor || null,
        renderHTML: (attributes) =>
          attributes.backgroundColor
            ? {
                'data-background-color': attributes.backgroundColor,
                style: `background-color: ${attributes.backgroundColor}`,
              }
            : {},
      },
    };
  },
});

const CorreoEditor = ({
  value,
  onChange,
  onFiles,
  adjuntos = [],
  onRemoveAdjunto,
  fileInputRef,
  disabled = false,
  placeholder = 'Escribe el contenido del correo…',
  mergeFields = [],
  mergeMenuLabel = null,
}) => {
  const onFilesRef = useRef(onFiles);
  onFilesRef.current = onFiles;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const imageInputRef = useRef(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);

  // Archivos soltados/pegados en el editor: imágenes → inline base64, resto → adjuntos.
  const handleEditorFiles = (editor, files) => {
    const images = files.filter(f => f.type?.startsWith('image/'));
    const others = files.filter(f => !f.type?.startsWith('image/'));
    images.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
      };
      reader.readAsDataURL(file);
    });
    if (others.length) onFilesRef.current?.(others);
  };
  const handleEditorFilesRef = useRef(handleEditorFiles);
  handleEditorFilesRef.current = handleEditorFiles;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      TextStyleKit,
      TableKit.configure({
        table: { resizable: true },
        tableCell: false,
      }),
      ColoredTableCell,
      Subscript,
      Superscript,
      AlignedImage.configure({
        allowBase64: true,
        resize: {
          enabled: true,
          alwaysPreserveAspectRatio: true,
          directions: ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
        },
      }),
      Placeholder.configure({ placeholder }),
      FileHandler.configure({
        onDrop: (editor, files) => handleEditorFilesRef.current?.(editor, files),
        onPaste: (editor, files) => handleEditorFilesRef.current?.(editor, files),
      }),
      MergeField,
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => onChangeRef.current?.(editor.getHTML()),
  });

  // Sincroniza cambios externos (modo edición, resets) hacia el editor.
  useEffect(() => {
    if (!editor) return;
    const incoming = value || '';
    if (!incoming && editor.isEmpty) return;
    if (incoming !== editor.getHTML()) {
      editor.chain().setContent(incoming, false).run();
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const MergeFieldBar = ({ fields, label }) => {
    if (!editor || !fields?.length) return null;
    const visibleFields = fields.slice(0, 8);
    const hiddenCount = fields.length - visibleFields.length;

    return (
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/40 px-3 py-2">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <MergeFieldIcon className="w-3.5 h-3.5 text-blue-600" />
            {label && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                {label}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMergeModalOpen(true)}
            disabled={disabled}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 transition-colors disabled:opacity-50"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            Buscar más campos
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {visibleFields.map((f) => (
            <button
              key={f.field}
              type="button"
              onClick={() => editor.chain().focus().insertMergeField({ field: f.field, label: f.label }).run()}
              disabled={disabled}
              title={`Insertar ${f.label}`}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-blue-100 bg-white text-xs font-medium text-slate-700 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 hover:shadow-sm transition-all disabled:opacity-40"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              {f.label}
            </button>
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setMergeModalOpen(true)}
              disabled={disabled}
              className="inline-flex items-center px-2 py-1 rounded-full border border-slate-200 bg-slate-100 text-xs font-medium text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-40"
            >
              +{hiddenCount} más
            </button>
          )}
        </div>
      </div>
    );
  };

  // Inserta una imagen elegida desde archivo como base64 inline en el cuerpo.
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`bg-white ${disabled ? 'opacity-60' : ''}`}>
      <EditorToolbar
        editor={editor}
        disabled={disabled}
        onAttach={fileInputRef ? () => fileInputRef.current?.click() : undefined}
        onInsertImage={disabled ? undefined : () => imageInputRef.current?.click()}
      />
      {fileInputRef && (
        <div className="border-b border-slate-200">
        <AttachmentBar
          adjuntos={adjuntos}
          onFilesSelected={onFiles}
          onRemove={onRemoveAdjunto}
          fileInputRef={fileInputRef}
        />
        </div>
      )}
      <MergeFieldBar fields={mergeFields} label={mergeMenuLabel} />
      <MergeFieldModal
        isOpen={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        mergeFields={mergeFields}
        onInsert={(item) => {
          editor?.chain().focus().insertMergeField({ field: item.field, label: item.label }).run();
          setMergeModalOpen(false);
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFile}
        className="hidden"
      />
      <EditorContent
        editor={editor}
        className="rich-text max-h-[480px] overflow-y-auto"
      />
      <EditorContextMenu editor={editor} />

    </div>
  );
};

export default CorreoEditor;
