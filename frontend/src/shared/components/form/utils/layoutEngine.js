/**
 * Layout Engine - Organiza campos de formulario en estructura de páginas/secciones
 * Maneja validación de configuración y asignación por defecto
 */

/**
 * Organiza campos en estructura de páginas y secciones
 * @param {Array} fields - Array de definiciones de campos
 * @param {Object} layout - Configuración de layout (opcional)
 * @param {boolean} showWarnings - Si debe mostrar warnings en consola (default: true)
 * @returns {Object} - Estructura organizada con páginas, secciones y metadatos
 */
export const organizeFields = (fields, layout = null, showWarnings = true) => {
  // Si no hay layout explícito, crear estructura single-page por defecto
  if (!layout || layout.type === 'single') {
    return createSinglePageStructure(fields, showWarnings);
  }

  // Layout multi-step
  if (layout.type === 'multistep') {
    return createMultiStepStructure(fields, layout.pages, showWarnings);
  }

  if (showWarnings) {
    console.error(`[layoutEngine] Tipo de layout no soportado: ${layout.type}`);
  }
  return createSinglePageStructure(fields, showWarnings);
};

/**
 * Crea estructura de página única (default)
 */
const createSinglePageStructure = (fields, showWarnings = true) => {
  const warnings = [];
  const assignedFields = [];

  fields.forEach((field) => {
    if (field.page || field.section) {
      warnings.push(`[layoutEngine] Field "${field.name}" tiene page/section pero no hay layout multistep definido. Ignorando page/section.`);
    }
    assignedFields.push({
      ...field,
      _assignedPage: 1,
      _assignedSection: 1
    });
  });

  // Mostrar warnings solo si showWarnings es true
  if (showWarnings) {
    warnings.forEach(w => console.warn(w));
  }

  return {
    type: 'single',
    totalPages: 1,
    totalFields: fields.length,
    pages: [
      {
        id: 'page-1',
        number: 1,
        title: '',
        description: '',
        sections: [
          {
            id: 'section-1',
            number: 1,
            title: '',
            fields: assignedFields
          }
        ]
      }
    ]
  };
};

/**
 * Crea estructura multi-step según configuración
 */
const createMultiStepStructure = (fields, pagesConfig, showWarnings = true) => {
  const errors = [];
  const warnings = [];
  
  // Mapa de páginas y secciones válidas
  const validPages = new Map();
  const validSections = new Map(); // key: "pageNum-sectionNum"
  
  pagesConfig.forEach((page, index) => {
    const pageNum = index + 1;
    validPages.set(pageNum, page);
    
    if (page.sections) {
      page.sections.forEach((section, sIndex) => {
        const sectionNum = sIndex + 1;
        validSections.set(`${pageNum}-${sectionNum}`, section);
      });
    }
  });

  // Mapa de campos por página/sección
  const fieldsByLocation = new Map(); // key: "pageNum-sectionNum"

  fields.forEach((field) => {
    const pageNum = field.page || 1;
    const sectionNum = field.section || 1;
    const locationKey = `${pageNum}-${sectionNum}`;

    // Validar si la ubicación existe
    if (!validPages.has(pageNum)) {
      if (showWarnings) {
        errors.push(`[layoutEngine] Field "${field.name}" asignado a página ${pageNum} que no existe. Asignando a página 1.`);
      }
      const fallbackKey = `1-${sectionNum}`;
      if (!fieldsByLocation.has(fallbackKey)) {
        fieldsByLocation.set(fallbackKey, []);
      }
      fieldsByLocation.get(fallbackKey).push({
        ...field,
        _originalPage: pageNum,
        _assignedPage: 1,
        _assignedSection: sectionNum
      });
      return;
    }

    if (!validSections.has(locationKey)) {
      if (showWarnings) {
        errors.push(`[layoutEngine] Field "${field.name}" asignado a sección ${sectionNum} de página ${pageNum} que no existe. Asignando a sección 1.`);
      }
      const fallbackKey = `${pageNum}-1`;
      if (!fieldsByLocation.has(fallbackKey)) {
        fieldsByLocation.set(fallbackKey, []);
      }
      fieldsByLocation.get(fallbackKey).push({
        ...field,
        _originalSection: sectionNum,
        _assignedPage: pageNum,
        _assignedSection: 1
      });
      return;
    }

    // Asignación válida
    if (!fieldsByLocation.has(locationKey)) {
      fieldsByLocation.set(locationKey, []);
    }
    fieldsByLocation.get(locationKey).push({
      ...field,
      _assignedPage: pageNum,
      _assignedSection: sectionNum
    });
  });

  // Mostrar errores solo si showWarnings es true
  if (showWarnings) {
    errors.forEach(e => console.error(e));
  }

  // Construir estructura final
  const organizedPages = pagesConfig.map((pageConfig, index) => {
    const pageNum = index + 1;
    const pageSections = [];

    if (pageConfig.sections && pageConfig.sections.length > 0) {
      pageConfig.sections.forEach((sectionConfig, sIndex) => {
        const sectionNum = sIndex + 1;
        const locationKey = `${pageNum}-${sectionNum}`;
        const sectionFields = fieldsByLocation.get(locationKey) || [];

        pageSections.push({
          id: sectionConfig.id || `section-${pageNum}-${sectionNum}`,
          number: sectionNum,
          title: sectionConfig.title || '',
          description: sectionConfig.description || '',
          fields: sectionFields
        });
      });
    } else {
      // Página sin secciones definidas - todos los campos de la página van a sección 1
      const pageFields = [];
      fieldsByLocation.forEach((sectionFields, key) => {
        if (key.startsWith(`${pageNum}-`)) {
          pageFields.push(...sectionFields);
        }
      });

      pageSections.push({
        id: `section-${pageNum}-1`,
        number: 1,
        title: '',
        description: '',
        fields: pageFields
      });
    }

    return {
      id: pageConfig.id || `page-${pageNum}`,
      number: pageNum,
      title: pageConfig.title || `Página ${pageNum}`,
      description: pageConfig.description || '',
      sections: pageSections
    };
  });

  // Verificar campos huérfanos (asignados a ubicaciones que no tienen sección definida)
  const assignedFieldNames = new Set();
  organizedPages.forEach(page => {
    page.sections.forEach(section => {
      section.fields.forEach(field => assignedFieldNames.add(field.name));
    });
  });

  fields.forEach(field => {
    if (!assignedFieldNames.has(field.name)) {
      if (showWarnings) {
        warnings.push(`[layoutEngine] Field "${field.name}" no pudo ser asignado a ninguna sección. Agregando a página 1, sección 1.`);
      }
      organizedPages[0].sections[0].fields.push({
        ...field,
        _assignedPage: 1,
        _assignedSection: 1
      });
    }
  });

  // Mostrar warnings solo si showWarnings es true
  if (showWarnings) {
    warnings.forEach(w => console.warn(w));
  }

  return {
    type: 'multistep',
    totalPages: organizedPages.length,
    totalFields: fields.length,
    pages: organizedPages
  };
};

/**
 * Obtiene los campos de una página específica
 * @param {Object} organizedLayout - Estructura organizada
 * @param {number} pageNumber - Número de página (1-based)
 * @returns {Array} - Campos de la página
 */
export const getFieldsByPage = (organizedLayout, pageNumber) => {
  const page = organizedLayout.pages.find(p => p.number === pageNumber);
  if (!page) return [];

  const fields = [];
  page.sections.forEach(section => {
    fields.push(...section.fields);
  });
  return fields;
};

/**
 * Obtiene los nombres de campos de una página (útil para validación)
 * @param {Object} organizedLayout - Estructura organizada
 * @param {number} pageNumber - Número de página
 * @returns {Array} - Nombres de campos
 */
export const getFieldNamesByPage = (organizedLayout, pageNumber) => {
  const fields = getFieldsByPage(organizedLayout, pageNumber);
  return fields.map(f => f.name);
};

/**
 * Verifica si una página tiene campos requeridos
 * @param {Object} organizedLayout - Estructura organizada
 * @param {number} pageNumber - Número de página
 * @returns {boolean}
 */
export const hasRequiredFields = (organizedLayout, pageNumber) => {
  const fields = getFieldsByPage(organizedLayout, pageNumber);
  return fields.some(f => f.required);
};

export default {
  organizeFields,
  getFieldsByPage,
  getFieldNamesByPage,
  hasRequiredFields
};
