export const headerProps = {
  headerTitle: 'Preguntas Docentes',
  headerDescription: 'Plantillas de preguntas por condición laboral para postulaciones docentes'
};

export const getHeaderActions = ({ handleCreate }) => [
  {
    text: 'Crear Pregunta',
    onClick: handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
