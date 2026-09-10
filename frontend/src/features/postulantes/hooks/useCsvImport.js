import { useState, useCallback } from 'react';
import { backend } from '@/shared/api/backend';

// ============================================
// Parser CSV (sin deps externas) - soporta ; y ,
// ============================================
function parseCSV(text) {
  const unquote = (s) => {
    if (!s) return '';
    return s.replace(/^"+/, '').replace(/"+$/, '').trim();
  };

  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { data: [], meta: { fields: [] }, rawFirstLine: '' };

  const rawFirstLine = lines[0];
  const separator = rawFirstLine.includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map(h => unquote(h).toUpperCase());

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = unquote(values[idx]) || '';
    });
    data.push(row);
  }

  return { data, meta: { fields: headers }, rawFirstLine };
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
function validateFieldAgainstSchema(fieldName, value, schemas) {
  const mapping = FIELD_TO_TABLE_COLUMN[fieldName];
  if (!mapping) return null; // campo no mapeado (ej: SEDE_VACANTE se resuelve por nombre)

  const { table, column } = mapping;
  const schema = schemas[table];
  if (!schema || !schema[column]) return null; // schema no disponible

  // Validar tipo
  const typeError = validateValueAgainstSchema(value, schema[column], fieldName);
  if (typeError) return typeError;

  // Validar CHECK constraint
  const checkKey = `${table}.${column}`;
  const checkFn = CHECK_CONSTRAINTS[checkKey];
  if (checkFn) {
    const checkError = checkFn(value);
    if (checkError) return checkError;
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
          fieldErrors.push('DNI es obligatorio');
        }
        previewRow.DNI = dni;

        // Validar apellidos y nombres obligatorios
        if (!row.APELLIDOS?.trim()) fieldErrors.push('APELLIDOS es obligatorio');
        if (!row.NOMBRES?.trim()) fieldErrors.push('NOMBRES es obligatorio');

        // Si hay errores de validación de tipos, lanzar con todos concatenados
        if (fieldErrors.length > 0) {
          throw new Error(fieldErrors.join('; '));
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
          if (!idSede) throw new Error(`Sede de vacante no encontrada: ${row.SEDE_VACANTE}`);
          previewRow.idSede = idSede;
        }

        // Buscar sede de examen por nombre
        if (row.SEDE_EXAMEN) {
          const idSedeExamen = sedesMap.get(row.SEDE_EXAMEN.trim().toUpperCase());
          if (!idSedeExamen) throw new Error(`Sede de examen no encontrada: ${row.SEDE_EXAMEN}`);
          previewRow.idSedeExamen = idSedeExamen;
        }

        // Buscar carrera por nombre
        if (row.CARRERA) {
          const idCarrera = carrerasMap.get(row.CARRERA.trim().toUpperCase());
          if (!idCarrera) throw new Error(`Carrera no encontrada: ${row.CARRERA}`);
          previewRow.idCarrera = idCarrera;
        }

      } catch (err) {
        previewRow.error = err.message;
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
      for (let i = 0; i < filasValidas.length; i++) {
        const row = filasValidas[i];
        setProgress({ current: i + 1, total: filasValidas.length, label: `Importando ${row.DNI}...` });

        try {
          // ===== 1. Construir datos de USUARIOS (solo campos presentes) =====
          const usuarioData = {};
          const { paterno, materno } = splitApellidos(row.APELLIDOS);
          if (paterno) usuarioData.APELLIDO_PATERNO = paterno;
          if (materno) usuarioData.APELLIDO_MATERNO = materno;
          if (row.NOMBRES) usuarioData.NOMBRES = row.NOMBRES.trim().toUpperCase();
          if (row.SEXO) usuarioData.SEXO = row.SEXO.trim().toUpperCase();
          if (row.FECHA_NACIMIENTO) {
            const d = parseDate(row.FECHA_NACIMIENTO);
            if (d) usuarioData.FECHA_NACIMIENTO = d;
          }
          if (row.TELEFONO) usuarioData.TELEFONO = row.TELEFONO.trim();
          if (row.EMAIL) usuarioData.EMAIL = row.EMAIL.trim();
          if (row.DIRECCION) usuarioData.DIRECCION = row.DIRECCION.trim();
          if (row.DEPARTAMENTO) usuarioData.DEPARTAMENTO = row.DEPARTAMENTO.trim();
          if (row.PROVINCIA) usuarioData.PROVINCIA = row.PROVINCIA.trim();
          if (row.DISTRITO) usuarioData.DISTRITO = row.DISTRITO.trim();
          if (row.CODIGO_UBIGEO_NACIMIENTO) usuarioData.CODIGO_UBIGEO_NACIMIENTO = row.CODIGO_UBIGEO_NACIMIENTO.trim();
          if (row.DISCAPACIDAD !== undefined && row.DISCAPACIDAD !== '') {
            const disc = parseSiNo(row.DISCAPACIDAD);
            if (disc !== null) usuarioData.DISCAPACIDAD = disc;
          }
          if (row.TIPO_DISCAPACIDAD) usuarioData.TIPO_DISCAPACIDAD = row.TIPO_DISCAPACIDAD.trim();

          // ===== 2. Upsert USUARIOS por DNI =====
          usuarioData.DNI = row.DNI;

          let idUsuario = row.idUsuario;

          if (row.isNewUsuario) {
            // Crear nuevo usuario
            // Asegurar campos NOT NULL con defaults
            if (!usuarioData.APELLIDO_PATERNO) usuarioData.APELLIDO_PATERNO = 'SIN_APELLIDO';
            if (!usuarioData.NOMBRES) usuarioData.NOMBRES = 'SIN_NOMBRE';

            const insertResult = await backend.insert('USUARIOS', usuarioData);
            idUsuario = insertResult?.ID_USUARIO || insertResult?.[0]?.ID_USUARIO;
            if (!idUsuario) throw new Error('No se pudo obtener ID_USUARIO después de insert');
          } else {
            // Upsert: actualizar solo los campos presentes
            const upsertResult = await backend.upsert('USUARIOS', usuarioData, ['DNI']);
            idUsuario = upsertResult?.ID_USUARIO || upsertResult?.[0]?.ID_USUARIO || idUsuario;
            if (!idUsuario) throw new Error('No se pudo obtener ID_USUARIO después de upsert');
          }

          // ===== 3. Construir datos de POSTULANTES =====
          const postulanteData = {
            ID_USUARIO: idUsuario,
            ID_PERIODO: idPeriodo,
            ACTIVO: true
          };

          if (row.idSede) postulanteData.ID_SEDE_VACANTE = row.idSede;
          if (row.idSedeExamen) postulanteData.ID_SEDE_EXAMEN = row.idSedeExamen;
          if (row.idCarrera) postulanteData.ID_CARRERA = row.idCarrera;
          if (row.FECHA_INSCRIPCION) {
            const d = parseDate(row.FECHA_INSCRIPCION);
            if (d) postulanteData.FECHA_INSCRIPCION = d;
          }
          if (row.TURNO) postulanteData.TURNO = row.TURNO.trim();
          if (row.GRADO !== undefined && row.GRADO !== '') {
            const g = parseIntOrNull(row.GRADO);
            if (g !== null) postulanteData.GRADO = g;
          }
          if (row.ANIO_EGRESO !== undefined && row.ANIO_EGRESO !== '') {
            const a = parseIntOrNull(row.ANIO_EGRESO);
            if (a !== null) postulanteData.ANIO_EGRESO = a;
          }
          if (row.COLEGIO) postulanteData.COLEGIO = row.COLEGIO.trim();
          if (row.TIPO_COLEGIO) postulanteData.TIPO_COLEGIO = row.TIPO_COLEGIO.trim();
          if (row.VALIDADO_POR) postulanteData.VALIDADO_POR = row.VALIDADO_POR.trim();
          if (row.NOMBRE_APODERADO) postulanteData.NOMBRE_APODERADO = row.NOMBRE_APODERADO.trim();
          if (row.DIRECCION_APODERADO) postulanteData.DIRECCION_APODERADO = row.DIRECCION_APODERADO.trim();
          if (row.TELEFONO_APODERADO) postulanteData.TELEFONO_APODERADO = row.TELEFONO_APODERADO.trim();
          if (row.TIENE_HERMANO !== undefined && row.TIENE_HERMANO !== '') {
            const th = parseSiNo(row.TIENE_HERMANO);
            if (th !== null) postulanteData.TIENE_HERMANO = th;
          }
          if (row.DNI_HERMANO) postulanteData.DNI_HERMANO = row.DNI_HERMANO.trim();
          if (row.INICIATIVA_POSTULACION) postulanteData.INICIATIVA_POSTULACION = row.INICIATIVA_POSTULACION.trim();
          if (row.RAZON_ELECCION_CEPRE) postulanteData.RAZON_ELECCION_CEPRE = row.RAZON_ELECCION_CEPRE.trim();
          if (row.MEDIO_ENTERO_CEPRE) postulanteData.MEDIO_ENTERO_CEPRE = row.MEDIO_ENTERO_CEPRE.trim();
          if (row.RED_SOCIAL_FRECUENTE) postulanteData.RED_SOCIAL_FRECUENTE = row.RED_SOCIAL_FRECUENTE.trim();
          if (row.ALUMNO_LIBRE !== undefined && row.ALUMNO_LIBRE !== '') {
            const al = parseSiNo(row.ALUMNO_LIBRE);
            if (al !== null) postulanteData.ALUMNO_LIBRE = al;
          }
          if (row.CODIGO_EDICION) postulanteData.CODIGO_EDICION = row.CODIGO_EDICION.trim();

          // ===== 4. Insert POSTULANTES =====
          await backend.insert('POSTULANTES', postulanteData);
          imported++;

        } catch (err) {
          console.error(`[CSV IMPORT] Error en fila DNI ${row.DNI}:`, err);
          errores.push({ dni: row.DNI, error: err.message });
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
  }, [idPeriodo]);

  return { preview, importRows, importing, progress, result };
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
