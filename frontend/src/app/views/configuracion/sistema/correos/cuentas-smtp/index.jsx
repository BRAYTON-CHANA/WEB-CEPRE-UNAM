import React from 'react';
import SmtpPanel from '@/features/correos/smtp/views/SmtpPanel';

/**
 * Configuración de CUENTAS SMTP
 * Punto de entrada que delega al panel en features/correos/smtp/views.
 */
function CuentasSmtpConfig() {
  return <SmtpPanel />;
}

export default CuentasSmtpConfig;
