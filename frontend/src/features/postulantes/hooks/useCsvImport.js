import { useState, useCallback } from 'react';
import { backend } from '@/shared/api/backend';

// ============================================
// Parser CSV robusto: admite ; , \t y campos con comillas/multilinea
// ============================================
function parseCSV(text) {
  const unquote = (s) => {
    if (!s) return '';
    s = s.replace(/^\s+/, '').replace(/\s+$/, '');
    if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
      s = s.slice(1, -1).replace(/""/g, '"');
    }
    return s;
  };

  const rawFirstLine = text.split(/\r?\n/).find(l => l.trim()) || '';
  if (!rawFirstLine) return { data: [], meta: { fields: [] }, rawFirstLine: '' };

  // Detectar separador: el más frecuente fuera de comillas en la primera línea
  const counts = { ';': 0, ',': 0, '\t': 0 };
  let inQuote = false;
  for (const ch of rawFirstLine) {
    if (ch === '"') inQuote = !inQuote;
    if (!inQuote && counts[ch] !== undefined) counts[ch]++;
  }
  const separator = Object.entries(counts).sort((a, b) => b[1] - a[1]).find(([_, c]) => c > 0)?.[0] || ';';

  // Parseo caracter por caracter respetando comillas y saltos de línea
  const values = [];
  let current = '';
  inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuote && next === '"') {
        current += '"';
        i++; // saltar la siguiente comilla
      } else {
        inQuote = !inQuote;
      }
      continue;
    }

    if (ch === separator && !inQuote) {
      values.push(unquote(current));
      current = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (ch === '\r' && next === '\n') i++; // saltar \n de \r\n
      values.push(unquote(current));
      current = '';
      continue;
    }

    current += ch;
  }
  const endsWithNewline = text.length > 0 && /[\r\n]$/.test(text);
  if (current !== '' || !endsWithNewline) {
    values.push(unquote(current));
  }

  // Calcular ancho por la primera línea (headers)
  const firstLineValues = [];
  let firstLineEnd = 0;
  let firstInQuote = false;
  let firstBuffer = '';
  for (let i = 0; i < rawFirstLine.length; i++) {
    const ch = rawFirstLine[i];
    if (ch === '"') {
      const next = rawFirstLine[i + 1];
      if (firstInQuote && next === '"') {
        firstBuffer += '"';
        i++;
      } else {
        firstInQuote = !firstInQuote;
      }
      continue;
    }
    if (ch === separator && !firstInQuote) {
      firstLineValues.push(unquote(firstBuffer));
      firstBuffer = '';
      continue;
    }
    firstBuffer += ch;
  }
  firstLineValues.push(unquote(firstBuffer));

  const headers = firstLineValues.map(h => h.toUpperCase().trim());
  const headerCount = headers.length;

  const data = [];
  for (let i = headerCount; i < values.length; i += headerCount) {
    const rowValues = values.slice(i, i + headerCount);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = rowValues[idx] !== undefined ? rowValues[idx] : '';
    });
    data.push(row);
  }

  return { data, meta: { fields: headers }, rawFirstLine };
}

// ============================================
// Construir payload para upsert_postulante_batch
// ============================================
function buildBatchPayload(chunk, idPeriodo) {
  const payload = {
    p_dni: [],
    p_nombres: [],
    p_apellido_paterno: [],
    p_apellido_materno: [],
    p_sexo: [],
    p_fecha_nacimiento: [],
    p_telefono: [],
    p_telefono_opcional: [],
    p_email: [],
    p_direccion: [],
    p_departamento: [],
    p_provincia: [],
    p_distrito: [],
    p_codigo_ubigeo_nacimiento: [],
    p_ref_dom: [],
    p_discapacidad: [],
    p_tipo_discapacidad: [],
    p_nro_conadis: [],
    p_activo_usuario: [],
    p_id_periodo: [],
    p_id_sede: [],
    p_id_sede_carrera: [],
    p_id_grupo: [],
    p_id_carrera: [],
    p_codigo_estudiante: [],
    p_codigo_edicion: [],
    p_fecha_inscripcion: [],
    p_alumno_libre: [],
    p_apto: [],
    p_activo_postulante: [],
    p_turno: [],
    p_grado: [],
    p_anio_egreso: [],
    p_colegio: [],
    p_tipo_colegio: [],
    p_validado_por: [],
    p_nombre_apoderado: [],
    p_direccion_apoderado: [],
    p_telefono_apoderado: [],
    p_tiene_hermano: [],
    p_dni_hermano: [],
    p_iniciativa_postulacion: [],
    p_razon_eleccion_cepre: [],
    p_medio_entero_cepre: [],
    p_red_social_frecuente: []
  };

  for (const row of chunk) {
    const { paterno, materno } = splitApellidos(row.APELLIDOS);
    payload.p_dni.push(row.DNI);
    payload.p_nombres.push(row.NOMBRES ? row.NOMBRES.trim().toUpperCase() : null);
    payload.p_apellido_paterno.push(paterno || null);
    payload.p_apellido_materno.push(materno || null);
    payload.p_sexo.push(row.SEXO ? row.SEXO.trim().toUpperCase() : null);
    payload.p_fecha_nacimiento.push(parseDate(row.FECHA_NACIMIENTO));
    payload.p_telefono.push(row.TELEFONO ? row.TELEFONO.trim() : null);
    payload.p_telefono_opcional.push(null);
    payload.p_email.push(row.EMAIL ? row.EMAIL.trim() : null);
    payload.p_direccion.push(row.DIRECCION ? row.DIRECCION.trim() : null);
    payload.p_departamento.push(row.DEPARTAMENTO ? row.DEPARTAMENTO.trim() : null);
    payload.p_provincia.push(row.PROVINCIA ? row.PROVINCIA.trim() : null);
    payload.p_distrito.push(row.DISTRITO ? row.DISTRITO.trim() : null);
    payload.p_codigo_ubigeo_nacimiento.push(row.CODIGO_UBIGEO_NACIMIENTO ? row.CODIGO_UBIGEO_NACIMIENTO.trim() : null);
    payload.p_ref_dom.push(null);
    payload.p_discapacidad.push(parseSiNo(row.DISCAPACIDAD));
    payload.p_tipo_discapacidad.push(row.TIPO_DISCAPACIDAD ? row.TIPO_DISCAPACIDAD.trim() : null);
    payload.p_nro_conadis.push(null);
    payload.p_activo_usuario.push(true);
    payload.p_id_periodo.push(idPeriodo);
    payload.p_id_sede.push(row.idSedeExamen || row.idSede || null);
    payload.p_id_sede_carrera.push(row.idSede || null);
    payload.p_id_grupo.push(null);
    payload.p_id_carrera.push(row.idCarrera || null);
    payload.p_codigo_estudiante.push(null);
    payload.p_codigo_edicion.push(row.CODIGO_EDICION ? row.CODIGO_EDICION.trim() : null);
    payload.p_fecha_inscripcion.push(parseDate(row.FECHA_INSCRIPCION));
    payload.p_alumno_libre.push(parseSiNo(row.ALUMNO_LIBRE));
    payload.p_apto.push(true);
    payload.p_activo_postulante.push(true);
    payload.p_turno.push(row.TURNO ? row.TURNO.trim() : null);
    payload.p_grado.push(parseIntOrNull(row.GRADO));
    payload.p_anio_egreso.push(parseIntOrNull(row.ANIO_EGRESO));
    payload.p_colegio.push(row.COLEGIO ? row.COLEGIO.trim() : null);
    payload.p_tipo_colegio.push(row.TIPO_COLEGIO ? row.TIPO_COLEGIO.trim() : null);
    payload.p_validado_por.push(row.VALIDADO_POR ? row.VALIDADO_POR.trim() : null);
    payload.p_nombre_apoderado.push(row.NOMBRE_APODERADO ? row.NOMBRE_APODERADO.trim() : null);
    payload.p_direccion_apoderado.push(row.DIRECCION_APODERADO ? row.DIRECCION_APODERADO.trim() : null);
    payload.p_telefono_apoderado.push(row.TELEFONO_APODERADO ? row.TELEFONO_APODERADO.trim() : null);
    payload.p_tiene_hermano.push(parseSiNo(row.TIENE_HERMANO));
    payload.p_dni_hermano.push(row.DNI_HERMANO ? row.DNI_HERMANO.trim() : null);
    payload.p_iniciativa_postulacion.push(row.INICIATIVA_POSTULACION ? row.INICIATIVA_POSTULACION.trim() : null);
    payload.p_razon_eleccion_cepre.push(row.RAZON_ELECCION_CEPRE ? row.RAZON_ELECCION_CEPRE.trim() : null);
    payload.p_medio_entero_cepre.push(row.MEDIO_ENTERO_CEPRE ? row.MEDIO_ENTERO_CEPRE.trim() : null);
    payload.p_red_social_frecuente.push(row.RED_SOCIAL_FRECUENTE ? row.RED_SOCIAL_FRECUENTE.trim() : null);
  }

  return payload;
}

// ============================================
// Helpers de conversión
// ============================================

// SI/NO → BOOLEAN
function parseSiNo(value) {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  if (v === 'SI' || v === 'S' || v === 'TRUE' || v === '1') return true;
  if (v === 'NO' || v === 'N' || v === 'FALSE' || v === '0') return false;
  return null;
}

// Parsear fecha (DD/MM/YYYY o YYYY-MM-DD) → YYYY-MM-DD (formato SQL DATE)
function parseDate(value) {
  if (!value) return null;
  const v = value.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
    const [d, m, y] = v.split('/');
    return `${y}-${m}-${d}`;
  }
  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(v)) {
    const [d, m, y] = v.split('-');
    return `${y}-${m}-${d}`;
  }
  return null;
}

// Dividir "Apellidos" en paterno (primera palabra) + materno (resto)
function splitApellidos(apellidos) {
  const trimmed = (apellidos || '').trim();
  if (!trimmed) return { paterno: null, materno: null };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { paterno: parts[0].toUpperCase(), materno: null };
  return {
    paterno: parts[0].toUpperCase(),
    materno: parts.slice(1).join(' ').toUpperCase()
  };
}

// Parsear entero
function parseIntOrNull(value) {
  if (!value) return null;
  const n = parseInt(value.trim(), 10);
  return isNaN(n) ? null : n;
}

// ============================================
// Validación contra schema de la base de datos
// ============================================

// Mapeo de campo canónico del CSV → (tabla, columna)
const FIELD_TO_TABLE_COLUMN = {
  // USUARIOS
  'DNI': { table: 'USUARIOS', column: 'DNI' },
  'APELLIDOS': { table: 'USUARIOS', column: 'APELLIDO_PATERNO' }, // se divide, validamos paterno
  'NOMBRES': { table: 'USUARIOS', column: 'NOMBRES' },
  'SEXO': { table: 'USUARIOS', column: 'SEXO' },
  'FECHA_NACIMIENTO': { table: 'USUARIOS', column: 'FECHA_NACIMIENTO' },
  'TELEFONO': { table: 'USUARIOS', column: 'TELEFONO' },
  'EMAIL': { table: 'USUARIOS', column: 'EMAIL' },
  'DIRECCION': { table: 'USUARIOS', column: 'DIRECCION' },
  'DEPARTAMENTO': { table: 'USUARIOS', column: 'DEPARTAMENTO' },
  'PROVINCIA': { table: 'USUARIOS', column: 'PROVINCIA' },
  'DISTRITO': { table: 'USUARIOS', column: 'DISTRITO' },
  'CODIGO_UBIGEO_NACIMIENTO': { table: 'USUARIOS', column: 'CODIGO_UBIGEO_NACIMIENTO' },
  'DISCAPACIDAD': { table: 'USUARIOS', column: 'DISCAPACIDAD' },
  'TIPO_DISCAPACIDAD': { table: 'USUARIOS', column: 'TIPO_DISCAPACIDAD' },
  // POSTULANTES
  'FECHA_INSCRIPCION': { table: 'POSTULANTES', column: 'FECHA_INSCRIPCION' },
  'TURNO': { table: 'POSTULANTES', column: 'TURNO' },
  'GRADO': { table: 'POSTULANTES', column: 'GRADO' },
  'ANIO_EGRESO': { table: 'POSTULANTES', column: 'ANIO_EGRESO' },
  'COLEGIO': { table: 'POSTULANTES', column: 'COLEGIO' },
  'TIPO_COLEGIO': { table: 'POSTULANTES', column: 'TIPO_COLEGIO' },
  'VALIDADO_POR': { table: 'POSTULANTES', column: 'VALIDADO_POR' },
  'NOMBRE_APODERADO': { table: 'POSTULANTES', column: 'NOMBRE_APODERADO' },
  'DIRECCION_APODERADO': { table: 'POSTULANTES', column: 'DIRECCION_APODERADO' },
  'TELEFONO_APODERADO': { table: 'POSTULANTES', column: 'TELEFONO_APODERADO' },
  'TIENE_HERMANO': { table: 'POSTULANTES', column: 'TIENE_HERMANO' },
  'DNI_HERMANO': { table: 'POSTULANTES', column: 'DNI_HERMANO' },
  'INICIATIVA_POSTULACION': { table: 'POSTULANTES', column: 'INICIATIVA_POSTULACION' },
  'RAZON_ELECCION_CEPRE': { table: 'POSTULANTES', column: 'RAZON_ELECCION_CEPRE' },
  'MEDIO_ENTERO_CEPRE': { table: 'POSTULANTES', column: 'MEDIO_ENTERO_CEPRE' },
  'RED_SOCIAL_FRECUENTE': { table: 'POSTULANTES', column: 'RED_SOCIAL_FRECUENTE' },
  'ALUMNO_LIBRE': { table: 'POSTULANTES', column: 'ALUMNO_LIBRE' },
  'CODIGO_EDICION': { table: 'POSTULANTES', column: 'CODIGO_EDICION' },
};

// CHECK constraints adicionales (no vienen en information_schema)
const CHECK_CONSTRAINTS = {
  'USUARIOS.DNI': (value) => {
    if (!value) return null;
    if (!/^\d{8}$/.test(value)) return 'DNI debe tener 8 dígitos numéricos';
    return null;
  },
  'USUARIOS.SEXO': (value) => {
    if (!value) return null;
    const s = value.trim().toUpperCase();
    if (s !== 'M' && s !== 'F') return 'SEXO debe ser M o F';
    return null;
  },
  'USUARIOS.CODIGO_UBIGEO_NACIMIENTO': (value) => {
    if (!value) return null;
    if (!/^\d{6}$/.test(value)) return 'Ubigeo debe tener 6 dígitos numéricos';
    return null;
  },
  'POSTULANTES.DNI_HERMANO': (value) => {
    if (!value) return null;
    if (!/^\d{8}$/.test(value)) return 'DNI del hermano debe tener 8 dígitos numéricos';
    return null;
  },
};

// Validar un valor contra una columna del schema
// Retorna null si OK, o string con mensaje de error
function validateValueAgainstSchema(value, schemaCol, fieldName) {
  if (!schemaCol) return null; // sin info de schema, omitir

  const isEmpty = value === null || value === undefined || String(value).trim() === '';

  // NOT NULL sin default: error si está vacío
  if (isEmpty) {
    if (!schemaCol.nullable && !schemaCol.dfltValue) {
      return `${fieldName} es obligatorio (NOT NULL)`;
    }
    return null; // vacío y nullable o tiene default
  }

  const v = String(value).trim();
  const type = (schemaCol.type || '').toLowerCase();

  // Integer
  if (type.includes('integer') || type.includes('smallint') || type.includes('bigint')) {
    if (!/^-?\d+$/.test(v)) {
      return `${fieldName} debe ser entero pero se recibió '${v}'`;
    }
  }
  // Boolean
  else if (type.includes('boolean')) {
    const upper = v.toUpperCase();
    if (!['TRUE', 'FALSE', 'SI', 'NO', 'S', 'N', '1', '0', 'T', 'F'].includes(upper)) {
      return `${fieldName} debe ser booleano (SI/NO) pero se recibió '${v}'`;
    }
  }
  // Date
  else if (type === 'date') {
    const parsed = parseDate(v);
    if (!parsed) {
      return `${fieldName} debe ser fecha (DD/MM/YYYY o YYYY-MM-DD) pero se recibió '${v}'`;
    }
    // Validar fecha real (no 31/02)
    const dateObj = new Date(parsed);
    if (isNaN(dateObj.getTime()) || dateObj.toISOString().slice(0, 10) !== parsed) {
      return `${fieldName} fecha inválida: '${v}'`;
    }
  }
  // Timestamp
  else if (type.includes('timestamp')) {
    const dateObj = new Date(v);
    if (isNaN(dateObj.getTime())) {
      return `${fieldName} debe ser timestamp válido pero se recibió '${v}'`;
    }
  }
  // Character varying / text: validar longitud si se puede extraer
  else if (type.includes('character varying') || type.includes('text') || type.includes('char')) {
    // El schema de PG a veces trae "character varying" sin longitud.
    // Si la longitud está en el tipo (ej: "character varying(20)"), extraerla.
    const match = type.match(/\((\d+)\)/);
    if (match) {
      const maxLen = parseInt(match[1], 10);
      if (v.length > maxLen) {
        return `${fieldName} excede longitud máxima (${maxLen} caracteres): tiene ${v.length}`;
      }
    }
  }

  return null;
}

// Validar un campo del CSV contra schema + CHECK constraints
// Retorna { field, message } o null
function validateFieldAgainstSchema(fieldName, value, schemas) {
  const mapping = FIELD_TO_TABLE_COLUMN[fieldName];
  if (!mapping) return null; // campo no mapeado (ej: SEDE_VACANTE se resuelve por nombre)

  const { table, column } = mapping;
  const schema = schemas[table];
  if (!schema || !schema[column]) return null; // schema no disponible

  // Validar tipo
  const typeError = validateValueAgainstSchema(value, schema[column], fieldName);
  if (typeError) return { field: fieldName, message: typeError };

  // Validar CHECK constraint
  const checkKey = `${table}.${column}`;
  const checkFn = CHECK_CONSTRAINTS[checkKey];
  if (checkFn) {
    const checkError = checkFn(value);
    if (checkError) return { field: fieldName, message: checkError };
  }

  return null;
}

// ============================================
// Mapeo de headers CSV → campos de USUARIOS
// ============================================
// Normaliza un header del CSV al nombre canónico
function normalizeHeader(h) {
  const map = {
    'DNI': 'DNI',
    'APELLIDOS': 'APELLIDOS',
    'NOMBRES': 'NOMBRES',
    'SEXO': 'SEXO',
    'FECHA NACIMIENTO': 'FECHA_NACIMIENTO',
    'FECHA_NAC': 'FECHA_NACIMIENTO',
    'TELEFONO': 'TELEFONO',
    'CORREO': 'EMAIL',
    'EMAIL': 'EMAIL',
    'DIRECCION': 'DIRECCION',
    'DEPARTAMENTO': 'DEPARTAMENTO',
    'PROVINCIA': 'PROVINCIA',
    'DISTRITO': 'DISTRITO',
    'UBIGEO NAC.': 'CODIGO_UBIGEO_NACIMIENTO',
    'UBIGEO_NAC': 'CODIGO_UBIGEO_NACIMIENTO',
    'UBIGEO NAC': 'CODIGO_UBIGEO_NACIMIENTO',
    'DISCAPACIDAD': 'DISCAPACIDAD',
    'TIPO DISCAPACIDAD': 'TIPO_DISCAPACIDAD',
    // POSTULANTES
    'FECHA INSCRIPCION': 'FECHA_INSCRIPCION',
    'CARRERA': 'CARRERA',
    'TURNO': 'TURNO',
    'GRADO': 'GRADO',
    'AÑO EGRESO': 'ANIO_EGRESO',
    'ANIO EGRESO': 'ANIO_EGRESO',
    'AÑO_EGRESO': 'ANIO_EGRESO',
    'COLEGIO': 'COLEGIO',
    'TIPO COLEGIO': 'TIPO_COLEGIO',
    'VALIDADO POR': 'VALIDADO_POR',
    'VALIDADO_POR': 'VALIDADO_POR',
    'NOMBRES Y APELLIDOS DEL PADRE O APODERADO': 'NOMBRE_APODERADO',
    'DIRECCION DEL PADRE O APODERADO': 'DIRECCION_APODERADO',
    'TELEFONO DEL PADRE O APODERADO': 'TELEFONO_APODERADO',
    'TELEFONO': 'TELEFONO_APODERADO', // si solo dice TELEFONO en contexto apoderado
    'TIENE ALGUN HERMANO': 'TIENE_HERMANO',
    'TIENE ALGÚN HERMANO': 'TIENE_HERMANO',
    'TIENE_HERMANO': 'TIENE_HERMANO',
    'DNI DEL HERMANO': 'DNI_HERMANO',
    'DNI_HERMANO': 'DNI_HERMANO',
    '¿QUIÉN TOMÓ LA INICIATIVA PRINCIPAL PARA POSTULAR AL CEPRE?': 'INICIATIVA_POSTULACION',
    'INICIATIVA POSTULACION': 'INICIATIVA_POSTULACION',
    '¿CUÁL FUE LA RAZÓN PRINCIPAL PARA ELEGIR EL CEPRE?': 'RAZON_ELECCION_CEPRE',
    'RAZON ELECCION CEPRE': 'RAZON_ELECCION_CEPRE',
    '¿CÓMO SE ENTERARON DEL CEPRE?': 'MEDIO_ENTERO_CEPRE',
    'MEDIO ENTERO CEPRE': 'MEDIO_ENTERO_CEPRE',
    '¿QUÉ RED SOCIAL UTILIZA CON MAYOR FRECUENCIA EL ESTUDIANTE?': 'RED_SOCIAL_FRECUENTE',
    'RED SOCIAL FRECUENTE': 'RED_SOCIAL_FRECUENTE',
    'SEDE DE VACANTE': 'SEDE_VACANTE',
    'SEDE DE EXAMEN': 'SEDE_EXAMEN',
    'ALUMNO LIBRE': 'ALUMNO_LIBRE',
    'COD_EDICION': 'CODIGO_EDICION',
    'CODIGO EDICION': 'CODIGO_EDICION'
  };
  return map[h] || h;
}

// Normaliza todas las filas del CSV
function normalizeRows(rows) {
  return rows.map(row => {
    const normalized = {};
    Object.keys(row).forEach(h => {
      const canonical = normalizeHeader(h);
      // Si la columna ya existe (ej: TELEFONO), no sobreescribir si ya tiene valor
      if (normalized[canonical] === undefined || !normalized[canonical]) {
        normalized[canonical] = row[h];
      }
    });
    return normalized;
  });
}

// ============================================
// Hook principal: useCsvPreview(idPeriodo)
// ============================================
export function useCsvPreview(idPeriodo) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [batchSize, setBatchSize] = useState(100);

  const REQUIRED_HEADERS = ['DNI', 'APELLIDOS', 'NOMBRES'];

  const validateHeaders = (headers, rawLine = '') => {
    const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      const err = new Error(
        `Columnas requeridas faltantes: ${missing.join(', ')}\n` +
        `Headers encontrados (${headers.length}): ${headers.join(', ')}\n` +
        `Headers esperados: ${REQUIRED_HEADERS.join(', ')}\n` +
        `Primera línea CSV: ${rawLine.substring(0, 200)}`
      );
      err.headersFound = headers;
      err.headersRequired = REQUIRED_HEADERS;
      err.rawFirstLine = rawLine;
      throw err;
    }
    return true;
  };

  // ===== Preview: parsear + validar sin insertar =====
  const preview = useCallback(async (csvText) => {
    if (!idPeriodo) throw new Error('Debe seleccionar un período antes de importar');

    const parseResult = parseCSV(csvText);
    validateHeaders(parseResult.meta.fields, parseResult.rawFirstLine);

    const rawRows = parseResult.data;
    const rows = normalizeRows(rawRows);
    setProgress({ current: 0, total: rows.length });

    // Precargar datos referenciales + schemas
    console.log('[CSV PREVIEW] Cargando datos referenciales y schemas...');
    const [sedes, carreras, usuariosByDni, postulantesExistentes, schemaUsuarios, schemaPostulantes] = await Promise.all([
      backend.select('SEDES', {}, ['ID_SEDE', 'NOMBRE_SEDE', 'CODIGO_SEDE']),
      backend.select('CARRERAS', {}, ['ID_CARRERA', 'NOMBRE_CARRERA']),
      backend.select('USUARIOS', {}, ['ID_USUARIO', 'DNI']),
      backend.select('POSTULANTES', { ID_PERIODO: idPeriodo }, ['ID_POSTULANTE', 'ID_USUARIO']),
      backend.getTableSchema('USUARIOS').catch(() => null),
      backend.getTableSchema('POSTULANTES').catch(() => null)
    ]);

    const schemas = {
      USUARIOS: schemaUsuarios,
      POSTULANTES: schemaPostulantes
    };

    // Indexar
    const sedesMap = new Map(sedes.map(s => [s.NOMBRE_SEDE?.toUpperCase(), s.ID_SEDE]));
    const carrerasMap = new Map(carreras.map(c => [c.NOMBRE_CARRERA?.toUpperCase(), c.ID_CARRERA]));
    const usuariosByDniMap = new Map(usuariosByDni.filter(u => u.DNI).map(u => [u.DNI, u.ID_USUARIO]));
    const postulantesExistentesSet = new Set(postulantesExistentes.map(p => p.ID_USUARIO));

    console.log(`[CSV PREVIEW] Precargado: ${sedes.length} sedes, ${carreras.length} carreras, ${usuariosByDni.length} usuarios, ${postulantesExistentes.length} postulantes existentes, schema USUARIOS: ${!!schemaUsuarios}, schema POSTULANTES: ${!!schemaPostulantes}`);

    const previewRows = [];
    const errors = [];
    let ready = 0, nuevos = 0, duplicados = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      setProgress({ current: i + 1, total: rows.length });

      const previewRow = {
        ...row,
        isNewUsuario: false,
        isDuplicado: false,
        idUsuario: null,
        idSede: null,
        idSedeExamen: null,
        idCarrera: null,
        error: null,
        fieldErrors: []
      };

      try {
        // ===== Validar contra schema todos los campos presentes =====
        const fieldErrors = [];
        for (const [csvField, value] of Object.entries(row)) {
          // Skip campos que se resuelven por nombre (no van directo a la tabla)
          if (['SEDE_VACANTE', 'SEDE_EXAMEN', 'CARRERA'].includes(csvField)) continue;
          const err = validateFieldAgainstSchema(csvField, value, schemas);
          if (err) fieldErrors.push(err);
        }

        // Validar DNI obligatorio (puede no estar en schema como NOT NULL)
        const dni = (row.DNI || '').trim();
        if (!dni) {
          fieldErrors.push({ field: 'DNI', message: 'DNI es obligatorio' });
        }
        previewRow.DNI = dni;

        // Validar apellidos y nombres obligatorios
        if (!row.APELLIDOS?.trim()) fieldErrors.push({ field: 'APELLIDOS', message: 'APELLIDOS es obligatorio' });
        if (!row.NOMBRES?.trim()) fieldErrors.push({ field: 'NOMBRES', message: 'NOMBRES es obligatorio' });

        // Si hay errores de validación, guardar y continuar
        if (fieldErrors.length > 0) {
          previewRow.error = fieldErrors.map(e => e.message).join('; ');
          previewRow.fieldErrors = fieldErrors;
          errors.push({ row: i + 2, error: previewRow.error });
          previewRows.push(previewRow);
          continue;
        }

        // Buscar usuario por DNI
        const idUsuarioExistente = usuariosByDniMap.get(dni);
        if (idUsuarioExistente) {
          previewRow.idUsuario = idUsuarioExistente;
          previewRow.isNewUsuario = false;
          ready++;

          // Verificar si ya es postulante en este período
          if (postulantesExistentesSet.has(idUsuarioExistente)) {
            previewRow.isDuplicado = true;
            duplicados++;
          }
        } else {
          previewRow.isNewUsuario = true;
          nuevos++;
        }

        // Buscar sede de vacante por nombre
        if (row.SEDE_VACANTE) {
          const idSede = sedesMap.get(row.SEDE_VACANTE.trim().toUpperCase());
          if (!idSede) fieldErrors.push({ field: 'SEDE_VACANTE', message: `Sede de vacante no encontrada: ${row.SEDE_VACANTE}` });
          else previewRow.idSede = idSede;
        }

        // Buscar sede de examen por nombre
        if (row.SEDE_EXAMEN) {
          const idSedeExamen = sedesMap.get(row.SEDE_EXAMEN.trim().toUpperCase());
          if (!idSedeExamen) fieldErrors.push({ field: 'SEDE_EXAMEN', message: `Sede de examen no encontrada: ${row.SEDE_EXAMEN}` });
          else previewRow.idSedeExamen = idSedeExamen;
        }

        // Buscar carrera por nombre
        if (row.CARRERA) {
          const idCarrera = carrerasMap.get(row.CARRERA.trim().toUpperCase());
          if (!idCarrera) fieldErrors.push({ field: 'CARRERA', message: `Carrera no encontrada: ${row.CARRERA}` });
          else previewRow.idCarrera = idCarrera;
        }

        if (fieldErrors.length > 0) {
          previewRow.error = fieldErrors.map(e => e.message).join('; ');
          previewRow.fieldErrors = fieldErrors;
          errors.push({ row: i + 2, error: previewRow.error });
          previewRows.push(previewRow);
          continue;
        }

      } catch (err) {
        previewRow.error = err.message;
        previewRow.fieldErrors = [{ field: 'general', message: err.message }];
        errors.push({ row: i + 2, error: err.message });
      }

      previewRows.push(previewRow);
    }

    console.log('[CSV PREVIEW] Preview completado:', previewRows.length, 'filas,', errors.length, 'errores,', duplicados, 'duplicados');

    return {
      rows: previewRows,
      errors,
      stats: {
        total: rows.length,
        ready,
        new: nuevos,
        duplicados,
        errors: errors.length
      }
    };
  }, [idPeriodo]);

  // ===== Import: upsert USUARIOS + insert POSTULANTES =====
  const importRows = useCallback(async (rows) => {
    if (!idPeriodo) {
      setResult({ success: false, error: 'Período no seleccionado' });
      return false;
    }

    setImporting(true);
    setProgress({ current: 0, total: rows.length });

    // Filtrar filas válidas (sin error y no duplicadas)
    const filasValidas = rows.filter(r => !r.error && !r.isDuplicado);
    const filasDuplicadas = rows.filter(r => r.isDuplicado);

    let imported = 0;
    const errores = [];

    try {
      const effectiveBatchSize = Math.max(1, Math.min(1000, Number(batchSize) || 100));
      for (let i = 0; i < filasValidas.length; i += effectiveBatchSize) {
        const chunk = filasValidas.slice(i, i + effectiveBatchSize);
        const startRow = i + 1;
        const endRow = Math.min(i + effectiveBatchSize, filasValidas.length);
        setProgress({
          current: i,
          total: filasValidas.length,
          label: `Importando filas ${startRow} - ${endRow}...`
        });

        try {
          const payload = buildBatchPayload(chunk, idPeriodo);
          await backend.executeFunction('upsert_postulante_batch', payload);
          imported += chunk.length;
        } catch (err) {
          console.error(`[CSV IMPORT] Error en batch ${startRow}-${endRow}:`, err);
          errores.push({ filas: `${startRow}-${endRow}`, error: err.message });
        }
      }

      console.log(`[CSV IMPORT] Completado: ${imported} importados, ${errores.length} errores, ${filasDuplicadas.length} duplicados`);

      setResult({
        success: true,
        imported,
        duplicados: filasDuplicadas.length,
        errores: errores.length,
        erroresDetalle: errores
      });
      return true;
    } catch (err) {
      console.error('[CSV IMPORT] Error general:', err);
      setResult({ success: false, error: err.message });
      return false;
    } finally {
      setImporting(false);
      setProgress({ current: 0, total: 0 });
    }
  }, [idPeriodo, batchSize]);

  return { preview, importRows, importing, progress, result, batchSize, setBatchSize };
}

// ============================================
// Hook legacy: useCsvImport (mantenido por compatibilidad)
// ============================================
export function useCsvImport(onSuccess) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const processFile = useCallback(async (file) => {
    setImporting(true);
    setResult(null);
    setShowResult(false);
    try {
      const text = await file.text();
      const parseResult = parseCSV(text);
      console.log('[CSV IMPORT] Parseado:', parseResult.data.length, 'filas');
      setResult({ success: true, imported: parseResult.data.length });
      setShowResult(true);
      onSuccess?.();
    } catch (err) {
      setResult({ success: false, error: err.message });
      setShowResult(true);
    } finally {
      setImporting(false);
    }
  }, [onSuccess]);

  const closeResult = () => setShowResult(false);

  return {
    importing,
    progress,
    result,
    showResult,
    processFile,
    closeResult
  };
}
