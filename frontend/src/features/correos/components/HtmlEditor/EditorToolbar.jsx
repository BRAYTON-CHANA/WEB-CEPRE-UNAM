import React from 'react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  ListBulletIcon,
  ListNumberIcon,
  PaperclipIcon,
} from '@/features/correos/components/CorreoIcons';
import { FONT_SIZE_OPTIONS } from '@/features/correos/constants/editor';
import FontSelect from './FontSelect';
import FontSizeSelect from './FontSizeSelect';
import FontColorControl from './FontColorControl';
import ToolbarButton from './ToolbarButton';
import HighlightControl from './HighlightControl';
import ImageButton from './ImageButton';
import MergeFieldControl from './MergeFieldControl';
import TableControl from './TableControl';

const EditorToolbar = ({
  toolbarRef,
  currentFont,
  currentSize,
  currentColor,
  highlightColor,
  onFontChange,
  onSizeChange,
  onColorChange,
  onHighlightChange,
  onHighlightApply,
  onSaveRange,
  onImageInsert,
  onAttach,
  mergeFields,
  onInsertMergeField,
  onTableAction,
  inTable,
  selectedCellCount,
  selectedCellInfo,
  canSplit,
  onMergeSelected,
  onCellColor,
  exec,
  disabled,
}) => (
  <div
    ref={toolbarRef}
    className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50"
    onMouseDown={(e) => e.preventDefault()}
  >
    {/* Tipografía */}
    <FontSelect
      value={currentFont}
      onChange={onFontChange}
      onSaveRange={onSaveRange}
      disabled={disabled}
    />
    <FontSizeSelect
      options={FONT_SIZE_OPTIONS}
      value={currentSize}
      onSelect={onSizeChange}
      disabled={disabled}
      onOpen={onSaveRange}
    />
    <FontColorControl
      color={currentColor}
      onColorChange={onColorChange}
      onApply={onColorChange}
      disabled={disabled}
      onSaveRange={onSaveRange}
    />

    <div className="w-px h-6 bg-gray-400 mx-2" />

    {/* Formato */}
    <ToolbarButton onClick={() => exec('bold')} disabled={disabled} label="Negrita" icon={<BoldIcon />} />
    <ToolbarButton onClick={() => exec('italic')} disabled={disabled} label="Cursiva" icon={<ItalicIcon />} />
    <ToolbarButton onClick={() => exec('underline')} disabled={disabled} label="Subrayado" icon={<UnderlineIcon />} />

    <div className="w-px h-6 bg-gray-400 mx-2" />

    {/* Listas */}
    <ToolbarButton onClick={() => exec('insertUnorderedList')} disabled={disabled} label="Lista con viñetas" icon={<ListBulletIcon />} />
    <ToolbarButton onClick={() => exec('insertOrderedList')} disabled={disabled} label="Lista numerada" icon={<ListNumberIcon />} />

    <div className="w-px h-6 bg-gray-400 mx-2" />

    {/* Color de resaltado */}
    <HighlightControl
      color={highlightColor}
      onColorChange={onHighlightChange}
      onApply={onHighlightApply}
      disabled={disabled}
      onSaveRange={onSaveRange}
    />

    <div className="w-px h-6 bg-gray-400 mx-2" />

    {/* Imagen */}
    <ImageButton onInsert={onImageInsert} disabled={disabled} />

    <div className="w-px h-6 bg-gray-400 mx-2" />

    {/* Adjuntos */}
    <ToolbarButton
      onClick={onAttach}
      disabled={disabled}
      label="Adjuntar archivo"
      icon={<PaperclipIcon className="w-4 h-4" />}
    />

    {mergeFields && mergeFields.length > 0 && (
      <>
        <div className="w-px h-6 bg-gray-400 mx-2" />
        <MergeFieldControl
          mergeFields={mergeFields}
          onInsert={onInsertMergeField}
          disabled={disabled}
        />
      </>
    )}

    <div className="w-px h-6 bg-gray-400 mx-2" />

    {/* Tabla y celdas */}
    <TableControl
      inTable={inTable}
      selectedCellCount={selectedCellCount}
      selectedCellInfo={selectedCellInfo}
      canSplit={canSplit}
      onAction={onTableAction}
      onMergeSelected={onMergeSelected}
      onCellColor={onCellColor}
      disabled={disabled}
      onSaveRange={onSaveRange}
    />
    {selectedCellInfo && selectedCellInfo.count > 0 && (
      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-100 rounded">
        {selectedCellInfo.label}
      </span>
    )}

    <div className="w-px h-6 bg-gray-400 mx-2" />

    {/* Alineación */}
    <ToolbarButton onClick={() => exec('justifyLeft')} disabled={disabled} label="Alinear izquierda" icon={<AlignLeftIcon />} />
    <ToolbarButton onClick={() => exec('justifyCenter')} disabled={disabled} label="Centrar" icon={<AlignCenterIcon />} />
    <ToolbarButton onClick={() => exec('justifyRight')} disabled={disabled} label="Alinear derecha" icon={<AlignRightIcon />} />
  </div>
);

export default EditorToolbar;
