/**
 * Configuración de las 4 tablas hijas de DOCENTES para la página 3 del formulario.
 * Cada tabla se renderiza con TablaEditableDocente.
 * Los campos ID (primaryKey) y ID_DOCENTE NO se muestran en la tabla.
 * Orden por FECHA_CREACION ASC (últimos agregados al final).
 */

export const TABLAS_RELACIONADAS = [
  {
    key: 'formacion_academica',
    title: 'Formación Académica',
    description: 'Títulos, grados y especialidades del docente',
    tableName: 'DOCENTE_FORMACION_ACADEMICA',
    primaryKey: 'ID_FORMACION',
    columns: [
      { field: 'FORMACION_ACADEMICA', label: 'Formación', type: 'text', required: true, placeholder: 'Ej: Bachiller' },
      { field: 'ESPECIALIDAD_MENCION', label: 'Especialidad/Mención', type: 'text', required: true, placeholder: 'Ej: Educación' },
      { field: 'FECHA_EXPEDICION_DIPLOMA', label: 'Fecha de Diploma', type: 'native-date', required: true },
      { field: 'UNIVERSIDAD_CENTRO_ESTUDIOS', label: 'Universidad/Centro', type: 'text', required: true, placeholder: 'Ej: UNMSM' },
      { field: 'PAIS', label: 'País', type: 'text', required: true, placeholder: 'Ej: Perú' }
    ]
  },
  {
    key: 'capacitaciones',
    title: 'Capacitaciones',
    description: 'Cursos, talleres y especializaciones',
    tableName: 'DOCENTE_CAPACITACIONES',
    primaryKey: 'ID_CAPACITACION',
    columns: [
      { field: 'TEMA', label: 'Tema', type: 'text', required: true, placeholder: 'Ej: Didáctica universitaria' },
      { field: 'CURSO_ESPECIALIDAD', label: 'Curso/Especialidad', type: 'text', required: true, placeholder: 'Ej: Docencia' },
      { field: 'FECHA_INICIO', label: 'Fecha Inicio', type: 'native-date', required: true },
      { field: 'FECHA_FIN', label: 'Fecha Fin', type: 'native-date', required: true },
      { field: 'INSTITUCION', label: 'Institución', type: 'text', required: true, placeholder: 'Ej: CEPRE UNMSM' },
      { field: 'TOTAL_HORAS', label: 'Total Horas', type: 'integer', required: true, placeholder: 'Ej: 120', min: 1 }
    ]
  },
  {
    key: 'idioma_ofimatica',
    title: 'Idioma / Ofimática',
    description: 'Idiomas y herramientas ofimáticas dominadas',
    tableName: 'DOCENTE_IDIOMA_OFIMATICA',
    primaryKey: 'ID_IDIOMA_OFIMATICA',
    columns: [
      { field: 'IDIOMA_OFIMATICA', label: 'Idioma/Ofimática', type: 'text', required: true, placeholder: 'Ej: Inglés / Excel' },
      { field: 'CENTRO_ESTUDIOS_MEDIO_OBTENIDO', label: 'Centro de Estudios', type: 'text', required: true, placeholder: 'Ej: ICPNA' },
      { field: 'FECHA_EXPEDICION', label: 'Fecha Expedición', type: 'native-date', required: true },
      { field: 'NIVEL', label: 'Nivel', type: 'text', required: true, placeholder: 'Ej: Avanzado' }
    ]
  },
  {
    key: 'experiencia_laboral',
    title: 'Experiencia Laboral',
    description: 'Historial laboral del docente',
    tableName: 'DOCENTE_EXPERIENCIA_LABORAL',
    primaryKey: 'ID_EXPERIENCIA',
    columns: [
      { field: 'NOMBRE_ENTIDAD_EMPRESA', label: 'Entidad/Empresa', type: 'text', required: true, placeholder: 'Ej: CEPRE UNMSM' },
      { field: 'PUESTO', label: 'Puesto', type: 'text', required: true, placeholder: 'Ej: Docente' },
      { field: 'SECTOR', label: 'Sector', type: 'text', required: true, placeholder: 'Ej: Educación' },
      { field: 'FECHA_INICIO', label: 'Fecha Inicio', type: 'native-date', required: true },
      { field: 'FECHA_FIN', label: 'Fecha Fin', type: 'native-date', required: true },
      { field: 'MOTIVOS_CESE', label: 'Motivos de Cese', type: 'text', required: true, placeholder: 'Ej: Fin de contrato' }
    ]
  }
];

export default TABLAS_RELACIONADAS;
