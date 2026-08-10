import React from 'react';
import { formatBytes } from '@/shared/utils';
import {
  PaperclipIcon,
  FileImageIcon,
  FilePdfIcon,
  FileWordIcon,
  FileExcelIcon,
  FileTextIcon,
  FileGenericIcon,
} from '@/features/correos/components/CorreoIcons';

const getExtension = (filename) => {
  const idx = (filename || '').lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : '';
};

const getIconForFile = (adjunto) => {
  const ct = adjunto.contentType || '';
  const ext = getExtension(adjunto.filename);

  if (ct.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return <FileImageIcon className="w-4 h-4 text-blue-500" />;
  }
  if (ct === 'application/pdf' || ext === 'pdf') {
    return <FilePdfIcon className="w-4 h-4 text-red-500" />;
  }
  if (
    ct.includes('word') ||
    ct.includes('officedocument.wordprocessing') ||
    ['doc', 'docx'].includes(ext)
  ) {
    return <FileWordIcon className="w-4 h-4 text-blue-700" />;
  }
  if (
    ct.includes('excel') ||
    ct.includes('officedocument.spreadsheet') ||
    ['xls', 'xlsx', 'csv'].includes(ext)
  ) {
    return <FileExcelIcon className="w-4 h-4 text-green-600" />;
  }
  if (ct.startsWith('text/') || ['txt', 'md', 'rtf', 'log'].includes(ext)) {
    return <FileTextIcon className="w-4 h-4 text-gray-500" />;
  }
  return <FileGenericIcon className="w-4 h-4 text-gray-500" />;
};

const AttachmentBar = ({ adjuntos, onRemove, onFilesSelected, fileInputRef }) => {
  return (
    <div className="bg-gray-50/70 border-y border-gray-200 px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-xs font-medium text-gray-600">Adjuntos</h4>
          {adjuntos.length > 0 && (
            <p className="text-[10px] text-gray-400">{adjuntos.length} archivo{adjuntos.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors">
          <PaperclipIcon className="w-3.5 h-3.5" />
          Adjuntar
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={onFilesSelected}
            className="hidden"
          />
        </label>
      </div>

      {adjuntos.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No hay archivos adjuntos</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {adjuntos.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs shadow-sm min-w-[160px] max-w-[220px]"
            >
              <div className="flex items-center gap-2">
                {getIconForFile(a)}
                <span className="truncate flex-1">{a.filename}</span>
                <button
                  type="button"
                  onClick={() => onRemove(a.id)}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                  aria-label="Quitar adjunto"
                >
                  ×
                </button>
              </div>
              {a.loading ? (
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${a.progress || 0}%` }}
                  />
                </div>
              ) : (
                a.content && (
                  <span className="text-[10px] text-gray-400">
                    {formatBytes(Math.ceil(a.content.length * 0.75))}
                  </span>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AttachmentBar;
