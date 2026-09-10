import React from 'react';
import PasswordResetPanel from '@/features/correos/password-reset/views/PasswordResetPanel';

/**
 * Configuración de PASSWORD_RESET_CODES
 * Punto de entrada que delega al panel en features/correos/password-reset/views.
 */
function PasswordResetConfig() {
  return <PasswordResetPanel />;
}

export default PasswordResetConfig;
