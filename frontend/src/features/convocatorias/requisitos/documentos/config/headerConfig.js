export const headerProps = {
  headerTitle: 'Documentos Docentes',
  headerDescription: 'Plantillas de archivos por condición laboral para postulaciones docentes'
};

export const getHeaderActions = ({ handleCreate }) => [
  {
    text: 'Crear Documento',
    onClick: handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
