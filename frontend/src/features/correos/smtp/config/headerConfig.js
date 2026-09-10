/**
 * Configuración del header de página para Cuentas SMTP
 */
export const headerProps = {
  headerTitle: 'Cuentas SMTP',
  headerDescription: 'Administra las cuentas de correo saliente',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (smtpCrud) => [
  {
    text: 'Crear Cuenta SMTP',
    onClick: smtpCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
