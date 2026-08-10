import React, { useMemo } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import { formatList, formatDate } from '@/shared/utils';

const getAdjuntos = (value) => {
  if (!value) return [];
  try {
    return Array.isArray(value) ? value : JSON.parse(value);
  } catch {
    return [];
  }
};

/**
 * Modal para previsualizar un correo como si fuera un cliente real.
 */
const ViewCorreoModal = ({ email, onClose }) => {
  if (!email) return null;

  const adjuntos = useMemo(() => getAdjuntos(email.ADJUNTOS), [email.ADJUNTOS]);

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
          <span className="text-gray-500 font-medium">CC:</span>
          <span className="text-gray-800">{formatList(email.CC)}</span>
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-x-4 items-start">
          <span className="text-gray-500 font-medium">Asunto:</span>
          <span className="text-gray-800">{email.ASUNTO || '-'}</span>
        </div>
        {adjuntos.length > 0 && (
          <div className="grid grid-cols-[80px_1fr] gap-x-4 items-start">
            <span className="text-gray-500 font-medium">Adjuntos:</span>
            <span className="text-gray-800">{adjuntos.map(a => a.filename || a.cid || 'archivo').join(', ')}</span>
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
