import React, { useMemo, useState } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import { formatList, formatDate, formatBytes } from '@/shared/utils';
import { getAttachmentUrl } from '@/features/correos/services/correosService';
import {
  FileImageIcon,
  FilePdfIcon,
  FileWordIcon,
  FileExcelIcon,
  FileTextIcon,
  FileGenericIcon,
  DownloadIcon,
} from '@/features/correos/components/CorreoIcons';

const getAdjuntos = (value) => {
  if (!value) return [];
  try {
    return Array.isArray(value) ? value : JSON.parse(value);
  } catch {
    return [];
  }
};

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

/**
 * Modal para previsualizar un correo como si fuera un cliente real.
 */
const ViewCorreoModal = ({ email, onClose }) => {
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  const adjuntos = useMemo(() => getAdjuntos(email?.ADJUNTOS), [email?.ADJUNTOS]);

  if (!email) return null;

  const handleDownload = async (adj, idx) => {
    setDownloadError(null);
    if (!adj.path) {
      setDownloadError('Este adjunto no tiene un archivo descargable.');
      return;
    }
    setDownloadingId(idx);
    try {
      const url = await getAttachmentUrl(adj.path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setDownloadError(err.message || 'No se pudo generar el enlace de descarga.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Modal
      isOpen={!!email}
      onClose={onClose}
      title={email.ASUNTO || 'Vista previa del correo'}
      size="large"
      closeOnOutsideClick
      bodyClassName="p-0 bg-white"
    >
      <div className="p-6 bg-gray-50 border-b border-gray-200 text-sm space-y-2">
        <div className="grid grid-cols-[80px_1fr] gap-x-4 items-start">
          <span className="text-gray-500 font-medium">De:</span>
          <span className="font-semibold text-gray-800">{email.REMITENTE || 'CEPRE UNAM'}</span>
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-x-4 items-start">
          <span className="text-gray-500 font-medium">Para:</span>
          <span className="text-gray-800">{formatList(email.DESTINATARIOS)}</span>
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-x-4 items-start">
          <span className="text-gray-500 font-medium">Usuarios:</span>
          <span className="text-gray-800">{formatList(email.USUARIOS_NOMBRES)}</span>
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-x-4 items-start">
          <span className="text-gray-500 font-medium">CC:</span>
          <span className="text-gray-800">{formatList(email.CC)}</span>
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-x-4 items-start">
          <span className="text-gray-500 font-medium">Asunto:</span>
          <span className="text-gray-800">{email.ASUNTO || '-'}</span>
        </div>
        {adjuntos.length > 0 && (
          <div className="grid grid-cols-[80px_1fr] gap-x-4 items-start pt-1">
            <span className="text-gray-500 font-medium">Adjuntos:</span>
            <div className="space-y-1.5">
              <ul className="flex flex-wrap gap-2">
                {adjuntos.map((a, idx) => (
                  <li
                    key={a.path || idx}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs shadow-sm min-w-[180px] max-w-[240px]"
                  >
                    {getIconForFile(a)}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate" title={a.filename}>{a.filename || 'archivo'}</span>
                      {a.size ? (
                        <span className="text-[10px] text-gray-400">{formatBytes(a.size)}</span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload(a, idx)}
                      disabled={downloadingId === idx}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-wait transition-colors flex-shrink-0"
                      title="Descargar adjunto"
                      aria-label={`Descargar ${a.filename || 'archivo'}`}
                    >
                      {downloadingId === idx ? (
                        <span className="inline-block w-3.5 h-3.5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <DownloadIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              {downloadError && (
                <p className="text-[11px] text-red-600">{downloadError}</p>
              )}
            </div>
          </div>
        )}
        <div className="grid grid-cols-[80px_1fr] gap-x-4 items-start">
          <span className="text-gray-500 font-medium">Estado:</span>
          <span className="text-gray-800 capitalize">{email.ESTADO || '-'}</span>
        </div>
        {email.ESTADO === 'enviado' && (
          <div className="grid grid-cols-[80px_1fr] gap-x-4 items-start">
            <span className="text-gray-500 font-medium">Enviado:</span>
            <span className="text-gray-800">{formatDate(email.ENVIADO_EN)}</span>
          </div>
        )}
      </div>
      <div
        className="p-6 text-sm"
        dangerouslySetInnerHTML={{ __html: email.CUERPO_HTML || '' }}
      />
    </Modal>
  );
};

export default ViewCorreoModal;
