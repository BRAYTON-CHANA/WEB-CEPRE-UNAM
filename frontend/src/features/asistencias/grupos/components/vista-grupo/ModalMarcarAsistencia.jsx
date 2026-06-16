import React from 'react';
import { AsistenciaForm } from '../../../shared/components';

export function ModalMarcarAsistencia({ sesion, onClose, onSuccess, idUsuario = 1 }) {
  if (!sesion) return null;

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <AsistenciaForm
          idSesion={sesion.ID_SESION}
          sesionData={{
            // Datos básicos de la sesión
            NOMBRE_CURSO: sesion.NOMBRE_CURSO,
            FECHA: sesion.FECHA,
            HORA_INICIO: sesion.HORA_INICIO,
            HORA_FIN: sesion.HORA_FIN,
            DOCENTE_PROGRAMADO_NOMBRE: sesion.DOCENTE_PROGRAMADO_NOMBRE,
            // Datos de asistencia ya guardados (si existen)
            ASISTIO: sesion.ASISTIO,
            ID_DOCENTE_ASISTIO: sesion.ID_DOCENTE_ASISTIO,
            NOMBRE_SUPLENTE_EXTERNO: sesion.NOMBRE_SUPLENTE_EXTERNO,
            ES_SUPLENTE: sesion.ES_SUPLENTE,
            HORA_ENTRADA_REAL: sesion.HORA_ENTRADA_REAL,
            HORA_SALIDA_REAL: sesion.HORA_SALIDA_REAL,
            MOTIVO_FALTA: sesion.MOTIVO_FALTA,
            OBSERVACIONES: sesion.OBSERVACIONES
          }}
          idCurso={sesion.ID_CURSO}
          idDocenteProgramado={sesion.ID_DOCENTE_PROGRAMADO}
          idUsuario={idUsuario}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
