/**
 * Configuración del header de página para Códigos de Reset
 */
export const headerProps = {
  headerTitle: 'Códigos de Reset',
  headerDescription: 'Administra los códigos de recuperación de contraseña',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = ({ onClean, loading }) => [
  {
    text: loading ? 'Limpiando...' : 'Eliminar Códigos Usados/Expirados',
    onClick: loading ? undefined : onClean,
    font: 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
  }
];
