export const headerProps = {
  headerTitle: 'Requisitos Docentes',
  headerDescription: 'Plantillas por condición laboral para postulaciones docentes'
};

export const getHeaderActions = ({ handleCreate }) => [
  {
    text: 'Crear Requisito',
    onClick: handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
