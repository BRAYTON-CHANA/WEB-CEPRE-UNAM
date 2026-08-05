/**
 * Configuración del header de página para Códigos de Reset
 */
export const headerProps = {
  headerTitle: 'Códigos de Reset',
  headerDescription: 'Administra los códigos de recuperación de contraseña',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (passwordResetCrud) => [
  {
    text: 'Crear Código de Reset',
    onClick: passwordResetCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
