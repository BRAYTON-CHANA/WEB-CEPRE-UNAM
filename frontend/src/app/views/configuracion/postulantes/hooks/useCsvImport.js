import { useState, useCallback } from 'react';
import { backend } from '@/shared/api/backend';

// Simple CSV parser (sin deps externas) - quita comillas
function parseCSV(text) {
  const unquote = (s) => {
    if (!s) return '';
    return s.replace(/^"+/, '').replace(/"+$/, '').trim();
  };
  
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { data: [], meta: { fields: [] }, rawFirstLine: '' };
  
  const rawFirstLine = lines[0];
  console.log('[CSV DEBUG] Primera línea cruda:', rawFirstLine);
  
  const headers = lines[0].split(',').map(h => unquote(h).toUpperCase());
  console.log('[CSV DEBUG] Headers parseados:', headers);
  console.log('[CSV DEBUG] Headers requeridos:', ['CODIGO_PERIODO', 'APELLIDOS', 'NOMBRES']);
  
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = unquote(values[idx]) || '';
    });
    data.push(row);
  }
  
  return { data, meta: { fields: headers }, rawFirstLine };
}

const REQUIRED_HEADERS = [
  'CODIGO_PERIODO',
  'APELLIDOS',
  'NOMBRES'
];

export function useCsvImport(onSuccess) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const validateHeaders = (headers) => {
    const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      throw new Error(`Columnas requeridas faltantes: ${missing.join(', ')}`);
    }
    return true;
  };

  const findPeriodo = async (codigo) => {
    const data = await backend.select('PERIODOS', { CODIGO_PERIODO: codigo });
    if (!data || data.length === 0) throw new Error(`Periodo no encontrado: ${codigo}`);
    return data[0].ID_PERIODO;
  };

  const findOrCreateEstudiante = async (apellidos, nombres) => {
    const ape = apellidos.trim().toUpperCase();
    const nom = nombres.trim().toUpperCase();
    
    const existentes = await backend.select('ESTUDIANTES', {}, ['ID_ESTUDIANTE', 'APELLIDOS', 'NOMBRES']);
    const existente = existentes.find(e => 
      e.APELLIDOS?.toUpperCase() === ape && e.NOMBRES?.toUpperCase() === nom
    );
    
    if (existente) return existente.ID_ESTUDIANTE;
    
    const nuevo = await backend.insert('ESTUDIANTES', {
      APELLIDOS: ape,
      NOMBRES: nom,
      ACTIVO: true
    });
    return nuevo.ID_ESTUDIANTE;
  };

  const findCarrera = async (areaCarrera, sedeCarrera, nombreCarrera) => {
    if (!nombreCarrera || !areaCarrera || !sedeCarrera) return null;
    
    const areas = await backend.select('AREAS', {}, ['ID_AREA', 'CODIGO_AREA', 'NOMBRE_AREA']);
    const area = areas.find(a => 
      a.CODIGO_AREA?.toUpperCase() === areaCarrera.trim().toUpperCase() ||
      a.NOMBRE_AREA?.toUpperCase() === areaCarrera.trim().toUpperCase()
    );
    if (!area) throw new Error(`Área no encontrada: ${areaCarrera}`);
    
    const sedes = await backend.select('SEDES', {}, ['ID_SEDE', 'NOMBRE_SEDE']);
    const sede = sedes.find(s => 
      s.NOMBRE_SEDE?.toUpperCase() === sedeCarrera.trim().toUpperCase()
    );
    if (!sede) throw new Error(`Sede no encontrada: ${sedeCarrera}`);
    
    const carreras = await backend.select('CARRERAS', {
      ID_AREA: area.ID_AREA,
      ID_SEDE: sede.ID_SEDE
    }, ['ID_CARRERA', 'NOMBRE_CARRERA']);
    
    const carrera = carreras.find(c => 
      c.NOMBRE_CARRERA?.toUpperCase() === nombreCarrera.trim().toUpperCase()
    );
    if (!carrera) throw new Error(
      `Carrera no encontrada: ${nombreCarrera} en área ${areaCarrera} sede ${sedeCarrera}`
    );
    
    return carrera.ID_CARRERA;
  };

  const findGrupo = async (idGrupo, nombreGrupo, sedeGrupo, idPeriodo) => {
    if (idGrupo) return parseInt(idGrupo);
    if (!nombreGrupo || !sedeGrupo) return null;
    
    const sedes = await backend.select('SEDES', {}, ['ID_SEDE', 'NOMBRE_SEDE']);
    const sede = sedes.find(s => 
      s.NOMBRE_SEDE?.toUpperCase() === sedeGrupo.trim().toUpperCase()
    );
    if (!sede) throw new Error(`Sede grupo no encontrada: ${sedeGrupo}`);
    
    const grupos = await backend.select('GRUPOS', {
      ID_PERIODO: idPeriodo,
      ID_SEDE: sede.ID_SEDE
    }, ['ID_GRUPO', 'NOMBRE_GRUPO']);
    
    const grupo = grupos.find(g => 
      g.NOMBRE_GRUPO?.toUpperCase() === nombreGrupo.trim().toUpperCase()
    );
    if (!grupo) throw new Error(
      `Grupo no encontrado: ${nombreGrupo} en sede ${sedeGrupo} período ${idPeriodo}`
    );
    
    return grupo.ID_GRUPO;
  };

  const findSedeFromGrupo = async (idGrupo) => {
    if (!idGrupo) return null;
    const grupos = await backend.select('GRUPOS', { ID_GRUPO: idGrupo }, ['ID_SEDE']);
    return grupos[0]?.ID_SEDE || null;
  };

  const findSedeFromCarrera = async (idCarrera) => {
    if (!idCarrera) return null;
    const carreras = await backend.select('CARRERAS', { ID_CARRERA: idCarrera }, ['ID_SEDE']);
    return carreras[0]?.ID_SEDE || null;
  };

  const parseAlumnoLibre = (valor) => {
    if (!valor) return false;
    const v = valor.toString().toLowerCase().trim();
    return ['si', 'sí', 'true', '1', 'yes'].includes(v);
  };

  const processFile = useCallback(async (file) => {
    setImporting(true);
    setResult(null);
    setShowResult(false);
    
    try {
      const text = await file.text();
      
      const parseResult = parseCSV(text);
      
      validateHeaders(parseResult.meta.fields);
      
      const rows = parseResult.data;
      setProgress({ current: 0, total: rows.length });
      
      const postulantes = [];
      const errors = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setProgress({ current: i + 1, total: rows.length });
        
        try {
          const idPeriodo = await findPeriodo(row.CODIGO_PERIODO);
          const idEstudiante = await findOrCreateEstudiante(row.APELLIDOS, row.NOMBRES);
          const idCarrera = await findCarrera(
            row.AREA_CARRERA,
            row.SEDE_CARRERA,
            row.NOMBRE_CARRERA
          );
          const idGrupo = await findGrupo(
            row.ID_GRUPO,
            row.NOMBRE_GRUPO,
            row.SEDE_GRUPO,
            idPeriodo
          );
          
          let idSede = await findSedeFromGrupo(idGrupo);
          if (!idSede) idSede = await findSedeFromCarrera(idCarrera);
          if (!idSede) throw new Error('No se pudo determinar la sede del postulante');
          
          postulantes.push({
            ID_ESTUDIANTE: idEstudiante,
            ID_PERIODO: idPeriodo,
            ID_SEDE: idSede,
            ID_GRUPO: idGrupo,
            ID_CARRERA: idCarrera,
            ALUMNO_LIBRE: parseAlumnoLibre(row.ALUMNO_LIBRE),
            ACTIVO: true
          });
        } catch (err) {
          errors.push({ row: i + 2, error: err.message });
        }
      }
      
      if (errors.length > 0) {
        setResult({
          success: false,
          total: rows.length,
          processed: postulantes.length,
          errors
        });
        setShowResult(true);
        setImporting(false);
        return;
      }
      
      // Insert batch con transacción automática
      await backend.insertBatch('VW_POSTULANTE', postulantes);
      
      setResult({
        success: true,
        total: rows.length,
        imported: postulantes.length
      });
      setShowResult(true);
      onSuccess?.();
      
    } catch (err) {
      setResult({
        success: false,
        error: err.message
      });
      setShowResult(true);
    } finally {
      setImporting(false);
      setProgress({ current: 0, total: 0 });
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

// Hook para preview CSV (sin insertar)
export function useCsvPreview() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState(null);

  const validateHeaders = (headers, rawLine = '') => {
    const required = ['CODIGO_PERIODO', 'APELLIDOS', 'NOMBRES'];
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      const err = new Error(
        `Columnas requeridas faltantes: ${missing.join(', ')}\n` +
        `Headers encontrados (${headers.length}): ${headers.join(', ')}\n` +
        `Headers esperados: ${required.join(', ')}\n` +
        `Primera línea CSV: ${rawLine.substring(0, 200)}`
      );
      err.headersFound = headers;
      err.headersRequired = required;
      err.rawFirstLine = rawLine;
      throw err;
    }
    return true;
  };

  const findPeriodo = async (codigo) => {
    const data = await backend.select('PERIODOS', { CODIGO_PERIODO: codigo });
    if (!data || data.length === 0) throw new Error(`Periodo no encontrado: ${codigo}`);
    return { id: data[0].ID_PERIODO, nombre: data[0].NOMBRE_PERIODO };
  };

  const findEstudiante = async (apellidos, nombres) => {
    const ape = apellidos.trim().toUpperCase();
    const nom = nombres.trim().toUpperCase();
    const existentes = await backend.select('ESTUDIANTES', {}, ['ID_ESTUDIANTE', 'APELLIDOS', 'NOMBRES']);
    const existente = existentes.find(e => 
      e.APELLIDOS?.toUpperCase() === ape && e.NOMBRES?.toUpperCase() === nom
    );
    return existente ? { id: existente.ID_ESTUDIANTE, isNew: false } : { id: null, isNew: true };
  };

  const findCarrera = async (areaCarrera, sedeCarrera, nombreCarrera) => {
    if (!nombreCarrera || !areaCarrera || !sedeCarrera) return null;
    const areas = await backend.select('AREAS', {}, ['ID_AREA', 'CODIGO_AREA', 'NOMBRE_AREA']);
    const area = areas.find(a => 
      a.CODIGO_AREA?.toUpperCase() === areaCarrera.trim().toUpperCase() ||
      a.NOMBRE_AREA?.toUpperCase() === areaCarrera.trim().toUpperCase()
    );
    if (!area) throw new Error(`Área no encontrada: ${areaCarrera}`);
    
    const sedes = await backend.select('SEDES', {}, ['ID_SEDE', 'NOMBRE_SEDE']);
    const sede = sedes.find(s => s.NOMBRE_SEDE?.toUpperCase() === sedeCarrera.trim().toUpperCase());
    if (!sede) throw new Error(`Sede no encontrada: ${sedeCarrera}`);
    
    const carreras = await backend.select('CARRERAS', {
      ID_AREA: area.ID_AREA,
      ID_SEDE: sede.ID_SEDE
    }, ['ID_CARRERA', 'NOMBRE_CARRERA']);
    
    const carrera = carreras.find(c => 
      c.NOMBRE_CARRERA?.toUpperCase() === nombreCarrera.trim().toUpperCase()
    );
    if (!carrera) throw new Error(`Carrera no encontrada: ${nombreCarrera}`);
    return { id: carrera.ID_CARRERA, nombre: carrera.NOMBRE_CARRERA };
  };

  const findGrupo = async (idGrupo, nombreGrupo, sedeGrupo, idPeriodo) => {
    if (idGrupo) return { id: parseInt(idGrupo), nombre: null };
    if (!nombreGrupo || !sedeGrupo) return null;
    
    const sedes = await backend.select('SEDES', {}, ['ID_SEDE', 'NOMBRE_SEDE']);
    const sede = sedes.find(s => s.NOMBRE_SEDE?.toUpperCase() === sedeGrupo.trim().toUpperCase());
    if (!sede) throw new Error(`Sede grupo no encontrada: ${sedeGrupo}`);
    
    const grupos = await backend.select('GRUPOS', {
      ID_PERIODO: idPeriodo,
      ID_SEDE: sede.ID_SEDE
    }, ['ID_GRUPO', 'NOMBRE_GRUPO', 'CODIGO_GRUPO']);
    
    const grupo = grupos.find(g => 
      g.NOMBRE_GRUPO?.toUpperCase() === nombreGrupo.trim().toUpperCase()
    );
    if (!grupo) throw new Error(`Grupo no encontrado: ${nombreGrupo}`);
    return { id: grupo.ID_GRUPO, nombre: grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO };
  };

  const parseAlumnoLibre = (valor) => {
    if (!valor) return false;
    const v = valor.toString().toLowerCase().trim();
    return ['si', 'sí', 'true', '1', 'yes'].includes(v);
  };

  const preview = useCallback(async (csvText) => {
    const parseResult = parseCSV(csvText);
    validateHeaders(parseResult.meta.fields, parseResult.rawFirstLine);
    
    const rows = parseResult.data;
    setProgress({ current: 0, total: rows.length });
    
    // Precargar datos referenciales (1 sola vez, paralelo)
    console.log('[CSV PREVIEW] Cargando datos referenciales...');
    const [periodos, estudiantes, areas, sedes, carreras, grupos] = await Promise.all([
      backend.select('PERIODOS', {}, ['ID_PERIODO', 'CODIGO_PERIODO', 'NOMBRE_PERIODO']),
      backend.select('ESTUDIANTES', {}, ['ID_ESTUDIANTE', 'APELLIDOS', 'NOMBRES']),
      backend.select('AREAS', {}, ['ID_AREA', 'CODIGO_AREA', 'NOMBRE_AREA']),
      backend.select('SEDES', {}, ['ID_SEDE', 'NOMBRE_SEDE']),
      backend.select('CARRERAS', {}, ['ID_CARRERA', 'ID_AREA', 'ID_SEDE', 'NOMBRE_CARRERA']),
      backend.select('GRUPOS', {}, ['ID_GRUPO', 'ID_PERIODO', 'ID_SEDE', 'NOMBRE_GRUPO', 'CODIGO_GRUPO'])
    ]);
    console.log(`[CSV PREVIEW] Precargado: ${periodos.length} periodos, ${estudiantes.length} estudiantes, ${areas.length} areas, ${sedes.length} sedes, ${carreras.length} carreras, ${grupos.length} grupos`);
    
    // Funciones de búsqueda local (sincrónico, sin backend.select)
    const findPeriodoLocal = (codigo) => {
      const p = periodos.find(p => p.CODIGO_PERIODO === codigo);
      if (!p) throw new Error(`Periodo no encontrado: ${codigo}`);
      return { id: p.ID_PERIODO, nombre: p.NOMBRE_PERIODO };
    };
    
    const findEstudianteLocal = (apellidos, nombres) => {
      const ape = apellidos.trim().toUpperCase();
      const nom = nombres.trim().toUpperCase();
      const e = estudiantes.find(ex => 
        ex.APELLIDOS?.toUpperCase() === ape && ex.NOMBRES?.toUpperCase() === nom
      );
      return e ? { id: e.ID_ESTUDIANTE, isNew: false } : { id: null, isNew: true };
    };
    
    const findCarreraLocal = (areaCarrera, sedeCarrera, nombreCarrera) => {
      if (!nombreCarrera || !areaCarrera || !sedeCarrera) return null;
      const area = areas.find(a => 
        a.CODIGO_AREA?.toUpperCase() === areaCarrera.trim().toUpperCase() ||
        a.NOMBRE_AREA?.toUpperCase() === areaCarrera.trim().toUpperCase()
      );
      if (!area) throw new Error(`Área no encontrada: ${areaCarrera}`);
      const sede = sedes.find(s => s.NOMBRE_SEDE?.toUpperCase() === sedeCarrera.trim().toUpperCase());
      if (!sede) throw new Error(`Sede no encontrada: ${sedeCarrera}`);
      const carrera = carreras.find(c => 
        c.ID_AREA === area.ID_AREA && c.ID_SEDE === sede.ID_SEDE &&
        c.NOMBRE_CARRERA?.toUpperCase() === nombreCarrera.trim().toUpperCase()
      );
      if (!carrera) throw new Error(`Carrera no encontrada: ${nombreCarrera}`);
      return { id: carrera.ID_CARRERA, nombre: carrera.NOMBRE_CARRERA };
    };
    
    const findGrupoLocal = (idGrupo, nombreGrupo, sedeGrupo, idPeriodo) => {
      if (idGrupo) return { id: parseInt(idGrupo), nombre: null };
      if (!nombreGrupo || !sedeGrupo) return null;
      const sede = sedes.find(s => s.NOMBRE_SEDE?.toUpperCase() === sedeGrupo.trim().toUpperCase());
      if (!sede) throw new Error(`Sede grupo no encontrada: ${sedeGrupo}`);
      const grupo = grupos.find(g => 
        g.ID_PERIODO === idPeriodo && g.ID_SEDE === sede.ID_SEDE &&
        g.NOMBRE_GRUPO?.toUpperCase() === nombreGrupo.trim().toUpperCase()
      );
      if (!grupo) throw new Error(`Grupo no encontrado: ${nombreGrupo}`);
      return { id: grupo.ID_GRUPO, nombre: grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO };
    };
    
    const previewRows = [];
    const errors = [];
    let ready = 0, nuevos = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      setProgress({ current: i + 1, total: rows.length });
      
      const previewRow = {
        ...row,
        isNewEstudiante: false,
        idPeriodo: null,
        idEstudiante: null,
        idCarrera: null,
        idGrupo: null,
        idSede: null,
        error: null
      };
      
      try {
        const periodo = findPeriodoLocal(row.CODIGO_PERIODO);
        previewRow.idPeriodo = periodo.id;
        
        const estudiante = findEstudianteLocal(row.APELLIDOS, row.NOMBRES);
        previewRow.isNewEstudiante = estudiante.isNew;
        previewRow.idEstudiante = estudiante.id;
        if (estudiante.isNew) nuevos++;
        else ready++;
        
        if (row.NOMBRE_CARRERA) {
          const carrera = findCarreraLocal(row.AREA_CARRERA, row.SEDE_CARRERA, row.NOMBRE_CARRERA);
          previewRow.idCarrera = carrera.id;
        }
        
        if (row.ID_GRUPO || row.NOMBRE_GRUPO) {
          const grupo = findGrupoLocal(row.ID_GRUPO, row.NOMBRE_GRUPO, row.SEDE_GRUPO, previewRow.idPeriodo);
          previewRow.idGrupo = grupo?.id;
          previewRow.nombreGrupo = grupo?.nombre;
        }
        
        if (previewRow.idGrupo) {
          const g = grupos.find(gr => gr.ID_GRUPO === previewRow.idGrupo);
          previewRow.idSede = g?.ID_SEDE;
        } else if (previewRow.idCarrera) {
          const c = carreras.find(cr => cr.ID_CARRERA === previewRow.idCarrera);
          previewRow.idSede = c?.ID_SEDE;
        }
        
        if (!previewRow.idSede) {
          throw new Error('No se pudo determinar la sede');
        }
        
        previewRow.ALUMNO_LIBRE = parseAlumnoLibre(row.ALUMNO_LIBRE) ? 'Sí' : 'No';
        
      } catch (err) {
        previewRow.error = err.message;
        errors.push({ row: i + 2, error: err.message });
      }
      
      previewRows.push(previewRow);
    }
    
    // Ordenar preview por grupo (nulls al final) para que la tabla se muestre agrupada
    previewRows.sort((a, b) => {
      if (a.idGrupo === b.idGrupo) return 0;
      if (a.idGrupo === null || a.idGrupo === undefined) return 1;
      if (b.idGrupo === null || b.idGrupo === undefined) return -1;
      return a.idGrupo - b.idGrupo;
    });
    
    console.log('[CSV PREVIEW] Preview completado:', previewRows.length, 'filas,', errors.length, 'errores');
    
    return {
      rows: previewRows,
      errors,
      stats: {
        total: rows.length,
        ready,
        new: nuevos,
        errors: errors.length
      }
    };
  }, []);

  const importRows = useCallback(async (rows) => {
    setImporting(true);
    try {
      const postulantes = rows
        .filter(r => !r.error)
        .map(r => ({
          ID_ESTUDIANTE: r.idEstudiante,
          ID_PERIODO: r.idPeriodo,
          ID_SEDE: r.idSede,
          ID_GRUPO: r.idGrupo,
          ID_CARRERA: r.idCarrera,
          NOMBRES: r.NOMBRES.trim().toUpperCase(),
          APELLIDOS: r.APELLIDOS.trim().toUpperCase(),
          ALUMNO_LIBRE: parseAlumnoLibre(r.ALUMNO_LIBRE),
          ACTIVO: true
        }));
      
      // Crear estudiantes nuevos primero
      for (const row of rows.filter(r => r.isNewEstudiante && !r.error)) {
        const nuevo = await backend.insert('ESTUDIANTES', {
          APELLIDOS: row.APELLIDOS.trim().toUpperCase(),
          NOMBRES: row.NOMBRES.trim().toUpperCase(),
          ACTIVO: true
        });
        const postulante = postulantes.find(p => 
          p.APELLIDOS === row.APELLIDOS.trim().toUpperCase() &&
          p.NOMBRES === row.NOMBRES.trim().toUpperCase()
        );
        if (postulante) postulante.ID_ESTUDIANTE = nuevo.ID_ESTUDIANTE;
      }
      
      // Ordenar por ID_GRUPO (nulls al final) e insertar por grupos
      postulantes.sort((a, b) => {
        if (a.ID_GRUPO === b.ID_GRUPO) return 0;
        if (a.ID_GRUPO === null || a.ID_GRUPO === undefined) return 1;
        if (b.ID_GRUPO === null || b.ID_GRUPO === undefined) return -1;
        return a.ID_GRUPO - b.ID_GRUPO;
      });
      
      // Agrupar por ID_GRUPO
      const grupos = new Map();
      for (const p of postulantes) {
        const key = p.ID_GRUPO ?? 'null';
        if (!grupos.has(key)) grupos.set(key, []);
        grupos.get(key).push(p);
      }
      
      let imported = 0;
      let grupoIndex = 0;
      const totalGrupos = grupos.size;
      
      for (const [idGrupo, batch] of grupos) {
        grupoIndex++;
        setProgress({ current: grupoIndex, total: totalGrupos, label: `Insertando grupo ${idGrupo === 'null' ? '(sin grupo)' : idGrupo} (${batch.length} filas)` });
        console.log(`[CSV IMPORT] Insertando grupo ${idGrupo}: ${batch.length} filas`);
        
        try {
          await backend.insertBatch('VW_POSTULANTE', batch);
          imported += batch.length;
        } catch (err) {
          console.error(`[CSV IMPORT] Error en grupo ${idGrupo}:`, err);
          throw new Error(`Grupo ${idGrupo === 'null' ? '(sin grupo)' : idGrupo} falló (${batch.length} filas): ${err.message}. Ya se importaron ${imported} filas.`);
        }
      }
      
      setResult({ success: true, imported });
      return true;
    } catch (err) {
      setResult({ success: false, error: err.message });
      return false;
    } finally {
      setImporting(false);
    }
  }, []);

  return { preview, importRows, importing, progress, result };
}
