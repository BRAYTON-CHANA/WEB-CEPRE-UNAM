import { useState, useCallback } from 'react';
import { backend } from '@/shared/api/backend';

// Simple CSV parser (sin deps externas) - quita comillas, soporta ; y ,
function parseCSV(text) {
  const unquote = (s) => {
    if (!s) return '';
    return s.replace(/^"+/, '').replace(/"+$/, '').trim();
  };
  
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { data: [], meta: { fields: [] }, rawFirstLine: '' };
  
  const rawFirstLine = lines[0];
  console.log('[CSV DEBUG] Primera línea cruda:', rawFirstLine);
  
  // Detectar separador: punto y coma o coma
  const separator = rawFirstLine.includes(';') ? ';' : ',';
  console.log('[CSV DEBUG] Separador detectado:', separator === ';' ? 'punto y coma' : 'coma');
  
  const headers = lines[0].split(separator).map(h => unquote(h).toUpperCase());
  console.log('[CSV DEBUG] Headers parseados:', headers);
  console.log('[CSV DEBUG] Headers requeridos:', ['CODIGO_PERIODO', 'APELLIDOS', 'NOMBRES']);
  
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

const REQUIRED_HEADERS = [
  'CODIGO_PERIODO',
  'APELLIDOS',
  'NOMBRES'
];

// Campos opcionales: SEDE_GRUPO, SEDE_CARRERA, NOMBRE_CARRERA, CODIGO_GRUPO

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

  const findCarrera = async (nombreCarrera, sedeCarrera) => {
    if (!nombreCarrera) return null;
    
    const carreras = await backend.select('CARRERAS', {}, ['ID_CARRERA', 'NOMBRE_CARRERA', 'ID_SEDE']);
    
    let carrera = carreras.find(c => 
      c.NOMBRE_CARRERA?.toUpperCase() === nombreCarrera.trim().toUpperCase()
    );
    
    // Si hay sede especificada, filtrar por ella
    if (sedeCarrera && carrera) {
      const sedes = await backend.select('SEDES', {}, ['ID_SEDE', 'NOMBRE_SEDE']);
      const sede = sedes.find(s => s.NOMBRE_SEDE?.toUpperCase() === sedeCarrera.trim().toUpperCase());
      if (!sede) throw new Error(`Sede no encontrada: ${sedeCarrera}`);
      
      carrera = carreras.find(c => 
        c.NOMBRE_CARRERA?.toUpperCase() === nombreCarrera.trim().toUpperCase() &&
        c.ID_SEDE === sede.ID_SEDE
      );
      if (!carrera) throw new Error(`Carrera ${nombreCarrera} no encontrada en sede ${sedeCarrera}`);
    }
    
    if (!carrera) throw new Error(`Carrera no encontrada: ${nombreCarrera}`);
    return carrera.ID_CARRERA;
  };

  const findGrupo = async (codigoGrupo, sedeGrupo, idPeriodo) => {
    if (!codigoGrupo) return null;
    
    const grupos = await backend.select('GRUPOS', {
      ID_PERIODO: idPeriodo
    }, ['ID_GRUPO', 'CODIGO_GRUPO', 'NOMBRE_GRUPO', 'ID_SEDE']);
    
    const grupo = grupos.find(g => 
      g.CODIGO_GRUPO?.toUpperCase() === codigoGrupo.trim().toUpperCase()
    );
    
    if (!grupo) throw new Error(`Grupo no encontrado: ${codigoGrupo} en período ${idPeriodo}`);
    
    // Validar sede si se proporciona
    if (sedeGrupo) {
      const sedes = await backend.select('SEDES', {}, ['ID_SEDE', 'NOMBRE_SEDE']);
      const sede = sedes.find(s => 
        s.NOMBRE_SEDE?.toUpperCase() === sedeGrupo.trim().toUpperCase()
      );
      if (!sede) throw new Error(`Sede no encontrada: ${sedeGrupo}`);
      if (grupo.ID_SEDE !== sede.ID_SEDE) {
        throw new Error(`Grupo ${codigoGrupo} no pertenece a la sede ${sedeGrupo}`);
      }
    }
    
    return grupo.ID_GRUPO;
  };

  const findSedeFromGrupo = async (idGrupo) => {
    if (!idGrupo) return null;
    const grupos = await backend.select('GRUPOS', { ID_GRUPO: idGrupo }, ['ID_SEDE', 'CODIGO_GRUPO', 'NOMBRE_GRUPO']);
    return { 
      idSede: grupos[0]?.ID_SEDE || null,
      nombreGrupo: grupos[0]?.NOMBRE_GRUPO || grupos[0]?.CODIGO_GRUPO || null
    };
  };

  const findSedeFromCarrera = async (idCarrera) => {
    if (!idCarrera) return null;
    const carreras = await backend.select('CARRERAS', { ID_CARRERA: idCarrera }, ['ID_SEDE', 'NOMBRE_CARRERA']);
    return {
      idSede: carreras[0]?.ID_SEDE || null,
      nombreCarrera: carreras[0]?.NOMBRE_CARRERA || null
    };
  };

  // ALUMNO_LIBRE siempre es FALSE por defecto
  const getAlumnoLibre = () => false;

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
      
      // Precargar datos referenciales (1 sola vez, paralelo)
      console.log('[CSV IMPORT] Precargando datos referenciales...');
      const [periodos, estudiantesDB, sedes, carreras, grupos] = await Promise.all([
        backend.select('PERIODOS', {}, ['ID_PERIODO', 'CODIGO_PERIODO', 'NOMBRE_PERIODO']),
        backend.select('ESTUDIANTES', {}, ['ID_ESTUDIANTE', 'APELLIDOS', 'NOMBRES']),
        backend.select('SEDES', {}, ['ID_SEDE', 'NOMBRE_SEDE']),
        backend.select('CARRERAS', {}, ['ID_CARRERA', 'ID_SEDE', 'NOMBRE_CARRERA']),
        backend.select('GRUPOS', {}, ['ID_GRUPO', 'ID_PERIODO', 'ID_SEDE', 'NOMBRE_GRUPO', 'CODIGO_GRUPO'])
      ]);
      console.log(`[CSV IMPORT] Precargado: ${periodos.length} periodos, ${estudiantesDB.length} estudiantes, ${sedes.length} sedes, ${carreras.length} carreras, ${grupos.length} grupos`);
      
      // Indexar datos para búsquedas O(1)
      const periodosMap = new Map(periodos.map(p => [p.CODIGO_PERIODO, p.ID_PERIODO]));
      const estudiantesMap = new Map(estudiantesDB.map(e => [`${e.APELLIDOS?.toUpperCase()}|${e.NOMBRES?.toUpperCase()}`, e.ID_ESTUDIANTE]));
      const sedesMap = new Map(sedes.map(s => [s.NOMBRE_SEDE?.toUpperCase(), s.ID_SEDE]));
      const carrerasMap = new Map(carreras.map(c => [c.NOMBRE_CARRERA?.toUpperCase(), c]));
      const gruposMap = new Map(grupos.map(g => [`${g.ID_PERIODO}|${g.ID_SEDE}|${g.CODIGO_GRUPO?.toUpperCase()}`, g]));
      
      console.log('[CSV IMPORT] Datos indexados en Maps para búsqueda O(1)');
      
      // Funciones de búsqueda local optimizadas (O(1) con Maps)
      const findPeriodoLocal = (codigo) => {
        const id = periodosMap.get(codigo);
        if (!id) throw new Error(`Periodo no encontrado: ${codigo}`);
        return id;
      };
      
      const findEstudianteLocal = (apellidos, nombres) => {
        const ape = apellidos.trim().toUpperCase();
        const nom = nombres.trim().toUpperCase();
        const key = `${ape}|${nom}`;
        const id = estudiantesMap.get(key);
        return id ? { id, exists: true } : { id: null, exists: false, ape, nom };
      };
      
      const findCarreraLocal = (nombreCarrera, sedeCarrera) => {
        if (!nombreCarrera) return null;
        const key = nombreCarrera.trim().toUpperCase();
        let carrera = carrerasMap.get(key);
        if (sedeCarrera && carrera) {
          const sedeId = sedesMap.get(sedeCarrera.trim().toUpperCase());
          if (!sedeId) throw new Error(`Sede no encontrada: ${sedeCarrera}`);
          // Buscar carrera específica en esa sede
          carrera = carreras.find(c => 
            c.NOMBRE_CARRERA?.toUpperCase() === key && c.ID_SEDE === sedeId
          );
          if (!carrera) throw new Error(`Carrera ${nombreCarrera} no encontrada en sede ${sedeCarrera}`);
        }
        if (!carrera) throw new Error(`Carrera no encontrada: ${nombreCarrera}`);
        return carrera;
      };
      
      const findGrupoLocal = (codigoGrupo, sedeGrupo, idPeriodo) => {
        if (!codigoGrupo) {
          console.log('[CSV DEBUG] CODIGO_GRUPO vacío, retornando null');
          return null;
        }
        const codigoBusqueda = codigoGrupo.trim().toUpperCase();
        
        // Buscar ID de sede si se proporciona
        let sedeId = null;
        if (sedeGrupo) {
          sedeId = sedesMap.get(sedeGrupo.trim().toUpperCase());
          if (!sedeId) throw new Error(`Sede no encontrada: ${sedeGrupo}`);
        }
        
        // Key incluye período + sede + código para diferenciar grupos en diferentes sedes
        const key = sedeId ? `${idPeriodo}|${sedeId}|${codigoBusqueda}` : `${idPeriodo}|${codigoBusqueda}`;
        console.log(`[CSV DEBUG] Buscando grupo con key: "${key}" (sedeId=${sedeId})`);
        console.log(`[CSV DEBUG] Grupos disponibles:`, Array.from(gruposMap.keys()));
        
        const grupo = gruposMap.get(key);
        
        if (!grupo) {
          console.error(`[CSV DEBUG] Grupo NO ENCONTRADO: "${codigoBusqueda}" en período ${idPeriodo}, sede ${sedeGrupo || 'cualquiera'} (key: ${key})`);
          console.error(`[CSV DEBUG] Keys disponibles con período ${idPeriodo}:`, Array.from(gruposMap.keys()).filter(k => k.startsWith(`${idPeriodo}|`)));
          throw new Error(`Grupo no encontrado: "${codigoGrupo}" en período ${idPeriodo}${sedeGrupo ? `, sede ${sedeGrupo}` : ''}`);
        }
        console.log(`[CSV DEBUG] Grupo ENCONTRADO:`, grupo);
        return grupo;
      };
      
      const postulantes = [];
      const errors = [];
      const nuevosEstudiantes = []; // Estudiantes a crear
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setProgress({ current: i + 1, total: rows.length });
        
        try {
          console.log(`[CSV DEBUG] Procesando fila ${i + 2}:`, row);
          const idPeriodo = findPeriodoLocal(row.CODIGO_PERIODO);
          console.log(`[CSV DEBUG] Período encontrado: ${idPeriodo}`);
          const estudianteData = findEstudianteLocal(row.APELLIDOS, row.NOMBRES);
          console.log(`[CSV DEBUG] Estudiante:`, estudianteData);
          const carreraData = findCarreraLocal(row.NOMBRE_CARRERA, row.SEDE_CARRERA);
          console.log(`[CSV DEBUG] Carrera:`, carreraData);
          const grupoData = findGrupoLocal(row.CODIGO_GRUPO, row.SEDE_GRUPO, idPeriodo);
          console.log(`[CSV DEBUG] Grupo final:`, grupoData);
          
          let idSede = null;
          if (grupoData) {
            idSede = grupoData.ID_SEDE;
          } else if (carreraData) {
            idSede = carreraData.ID_SEDE;
          }
          if (!idSede) throw new Error('No se pudo determinar la sede del postulante');
          
          let idEstudiante = estudianteData.id;
          // Si el estudiante no existe, agregar a lista de nuevos
          if (!estudianteData.exists) {
            nuevosEstudiantes.push({
              rowIndex: i,
              APELLIDOS: estudianteData.ape,
              NOMBRES: estudianteData.nom,
              tempId: `temp_${i}` // ID temporal para relacionar
            });
          }
          
          postulantes.push({
            tempEstudianteId: estudianteData.exists ? null : `temp_${i}`,
            ID_ESTUDIANTE: idEstudiante, // puede ser null si es nuevo
            ID_PERIODO: idPeriodo,
            ID_SEDE: idSede,
            ID_GRUPO: grupoData?.ID_GRUPO || null,
            ID_CARRERA: carreraData?.ID_CARRERA || null,
            ALUMNO_LIBRE: getAlumnoLibre(),
            ACTIVO: true,
            // Para insertBatch en VW_POSTULANTE necesitamos NOMBRES/APELLIDOS
            NOMBRES: row.NOMBRES.trim().toUpperCase(),
            APELLIDOS: row.APELLIDOS.trim().toUpperCase()
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
      
      // Agrupar postulantes y estudiantes nuevos por ID_GRUPO
      const lotesPorGrupo = new Map();
      for (const p of postulantes) {
        const key = p.ID_GRUPO || 'sin_grupo';
        if (!lotesPorGrupo.has(key)) {
          lotesPorGrupo.set(key, { 
            postulantes: [], 
            nuevosEstudiantes: [],
            idGrupo: p.ID_GRUPO,
            idSede: p.ID_SEDE
          });
        }
        const grupo = lotesPorGrupo.get(key);
        grupo.postulantes.push(p);
        
        // Si tiene estudiante nuevo, agregarlo al grupo
        if (p.tempEstudianteId) {
          const estNuevo = nuevosEstudiantes.find(e => e.tempId === p.tempEstudianteId);
          if (estNuevo && !grupo.nuevosEstudiantes.find(e => e.tempId === estNuevo.tempId)) {
            grupo.nuevosEstudiantes.push(estNuevo);
          }
        }
      }
      
      // Ejecutar importación usando batch transaction
      let imported = 0;
      
      try {
        // 1. Construir SQL statements para estudiantes nuevos
        const estudiantesStatements = nuevosEstudiantes.map(est => {
          const ape = est.APELLIDOS.replace(/'/g, "''");
          const nom = est.NOMBRES.replace(/'/g, "''");
          return `INSERT INTO "ESTUDIANTES" ("APELLIDOS", "NOMBRES", "ACTIVO") VALUES ('${ape}', '${nom}', TRUE) RETURNING "ID_ESTUDIANTE", "APELLIDOS", "NOMBRES"`;
        });
        
        // 2. Ejecutar batch de estudiantes (dentro de transacción)
        if (estudiantesStatements.length > 0) {
          setProgress({ current: 0, total: lotesPorGrupo.size + 1, label: 'Creando estudiantes nuevos...' });
          console.log(`[CSV IMPORT] Batch: Creando ${estudiantesStatements.length} estudiantes`);
          
          const estResult = await backend.executeBatchTransaction(estudiantesStatements);
          console.log('[CSV IMPORT] Resultado estudiantes:', estResult);
          
          // 3. Mapear IDs retornados a postulantes
          if (estResult && estResult.results) {
            estResult.results.forEach((resultArray, index) => {
              if (resultArray && resultArray[0]) {
                const idEstudiante = resultArray[0].id_estudiante;
                const ape = nuevosEstudiantes[index].APELLIDOS;
                const nom = nuevosEstudiantes[index].NOMBRES;
                const tempId = nuevosEstudiantes[index].tempId;
                
                // Actualizar en todos los postulantes que tengan este tempId
                for (const [key, grupoData] of lotesPorGrupo) {
                  const postulante = grupoData.postulantes.find(p => p.tempEstudianteId === tempId);
                  if (postulante) {
                    postulante.ID_ESTUDIANTE = idEstudiante;
                    delete postulante.tempEstudianteId;
                  }
                }
              }
            });
          }
        }
        
        // 4. Insertar postulantes por grupo
        let grupoIndex = 0;
        const totalGrupos = lotesPorGrupo.size;
        
        for (const [key, grupoData] of lotesPorGrupo) {
          grupoIndex++;
          const grupoLabel = key === 'sin_grupo' ? 'Sin grupo' : `Grupo ID:${key}`;
          setProgress({ 
            current: grupoIndex, 
            total: totalGrupos + 1, 
            label: `${grupoLabel} - Insertando ${grupoData.postulantes.length} postulantes...` 
          });
          
          console.log(`[CSV IMPORT] TX: Procesando ${grupoLabel}: ${grupoData.postulantes.length} postulantes (${grupoIndex}/${totalGrupos})`);
          
          // 5. Construir SQL statements para postulantes de este grupo
          const postulantesStatements = grupoData.postulantes.map(p => {
            const idEst = p.ID_ESTUDIANTE;
            const idPer = p.ID_PERIODO;
            const idSed = p.ID_SEDE || 'NULL';
            const idGru = p.ID_GRUPO || 'NULL';
            const idCar = p.ID_CARRERA || 'NULL';
            const alumLib = p.ALUMNO_LIBRE !== undefined ? p.ALUMNO_LIBRE : false;
            const activo = p.ACTIVO !== undefined ? p.ACTIVO : true;
            
            return `INSERT INTO "VW_POSTULANTE" ("ID_ESTUDIANTE", "ID_PERIODO", "ID_SEDE", "ID_GRUPO", "ID_CARRERA", "ALUMNO_LIBRE", "ACTIVO") VALUES (${idEst}, ${idPer}, ${idSed}, ${idGru}, ${idCar}, ${alumLib}, ${activo}) RETURNING "ID_POSTULANTE"`;
          });
          
          // 6. Ejecutar batch de postulantes (dentro de transacción)
          await backend.executeBatchTransaction(postulantesStatements);
          imported += grupoData.postulantes.length;
          console.log(`[CSV IMPORT] TX: ✓ ${grupoLabel} completado: ${grupoData.postulantes.length} postulantes`);
        }
        
        console.log(`[CSV IMPORT] Transacción completada: ${imported} postulantes importados`);
        
        setResult({
          success: true,
          total: rows.length,
          imported
        });
        setShowResult(true);
        onSuccess?.();
      } catch (txError) {
        console.error('[CSV IMPORT] Transacción fallida - ROLLBACK ejecutado:', txError);
        throw new Error(`Importación cancelada: ${txError.message}. Todos los cambios han sido revertidos.`);
      }
      
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

  const findCarrera = async (nombreCarrera, sedeCarrera) => {
    if (!nombreCarrera) return null;
    
    const carreras = await backend.select('CARRERAS', {}, ['ID_CARRERA', 'NOMBRE_CARRERA', 'ID_SEDE']);
    
    let carrera = carreras.find(c => 
      c.NOMBRE_CARRERA?.toUpperCase() === nombreCarrera.trim().toUpperCase()
    );
    
    // Si hay sede especificada, filtrar por ella
    if (sedeCarrera && carrera) {
      const sedes = await backend.select('SEDES', {}, ['ID_SEDE', 'NOMBRE_SEDE']);
      const sede = sedes.find(s => s.NOMBRE_SEDE?.toUpperCase() === sedeCarrera.trim().toUpperCase());
      if (!sede) throw new Error(`Sede no encontrada: ${sedeCarrera}`);
      
      carrera = carreras.find(c => 
        c.NOMBRE_CARRERA?.toUpperCase() === nombreCarrera.trim().toUpperCase() &&
        c.ID_SEDE === sede.ID_SEDE
      );
      if (!carrera) throw new Error(`Carrera ${nombreCarrera} no encontrada en sede ${sedeCarrera}`);
    }
    
    if (!carrera) throw new Error(`Carrera no encontrada: ${nombreCarrera}`);
    return { id: carrera.ID_CARRERA, nombre: carrera.NOMBRE_CARRERA };
  };

  const findGrupo = async (codigoGrupo, sedeGrupo, idPeriodo) => {
    if (!codigoGrupo) return null;
    
    const grupos = await backend.select('GRUPOS', {
      ID_PERIODO: idPeriodo
    }, ['ID_GRUPO', 'CODIGO_GRUPO', 'NOMBRE_GRUPO', 'ID_SEDE']);
    
    const grupo = grupos.find(g => 
      g.CODIGO_GRUPO?.toUpperCase() === codigoGrupo.trim().toUpperCase()
    );
    
    if (!grupo) throw new Error(`Grupo no encontrado: ${codigoGrupo} en período ${idPeriodo}`);
    
    // Validar sede si se proporciona
    if (sedeGrupo) {
      const sedes = await backend.select('SEDES', {}, ['ID_SEDE', 'NOMBRE_SEDE']);
      const sede = sedes.find(s => s.NOMBRE_SEDE?.toUpperCase() === sedeGrupo.trim().toUpperCase());
      if (!sede) throw new Error(`Sede no encontrada: ${sedeGrupo}`);
      if (grupo.ID_SEDE !== sede.ID_SEDE) {
        throw new Error(`Grupo ${codigoGrupo} no pertenece a la sede ${sedeGrupo}`);
      }
    }
    
    return { id: grupo.ID_GRUPO, nombre: grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO };
  };

  // ALUMNO_LIBRE siempre es FALSE por defecto
  const getAlumnoLibre = () => false;

  const preview = useCallback(async (csvText) => {
    const parseResult = parseCSV(csvText);
    validateHeaders(parseResult.meta.fields, parseResult.rawFirstLine);
    
    const rows = parseResult.data;
    setProgress({ current: 0, total: rows.length });
    
    // Precargar datos referenciales (1 sola vez, paralelo)
    console.log('[CSV PREVIEW] Cargando datos referenciales...');
    const [periodos, estudiantes, sedes, carreras, grupos] = await Promise.all([
      backend.select('PERIODOS', {}, ['ID_PERIODO', 'CODIGO_PERIODO', 'NOMBRE_PERIODO']),
      backend.select('ESTUDIANTES', {}, ['ID_ESTUDIANTE', 'APELLIDOS', 'NOMBRES']),
      backend.select('SEDES', {}, ['ID_SEDE', 'NOMBRE_SEDE']),
      backend.select('CARRERAS', {}, ['ID_CARRERA', 'ID_SEDE', 'NOMBRE_CARRERA']),
      backend.select('GRUPOS', {}, ['ID_GRUPO', 'ID_PERIODO', 'ID_SEDE', 'NOMBRE_GRUPO', 'CODIGO_GRUPO'])
    ]);
    console.log(`[CSV PREVIEW] Precargado: ${periodos.length} periodos, ${estudiantes.length} estudiantes, ${sedes.length} sedes, ${carreras.length} carreras, ${grupos.length} grupos`);
    
    // Indexar datos para búsquedas O(1)
    const periodosMap = new Map(periodos.map(p => [p.CODIGO_PERIODO, { id: p.ID_PERIODO, nombre: p.NOMBRE_PERIODO }]));
    const estudiantesMap = new Map(estudiantes.map(e => [`${e.APELLIDOS?.toUpperCase()}|${e.NOMBRES?.toUpperCase()}`, e.ID_ESTUDIANTE]));
    const sedesMap = new Map(sedes.map(s => [s.NOMBRE_SEDE?.toUpperCase(), { id: s.ID_SEDE, nombre: s.NOMBRE_SEDE }]));
    const carrerasMap = new Map(carreras.map(c => [c.NOMBRE_CARRERA?.toUpperCase(), c]));
    const gruposMap = new Map(grupos.map(g => [`${g.ID_PERIODO}|${g.ID_SEDE}|${g.CODIGO_GRUPO?.toUpperCase()}`, g]));
    console.log('[CSV PREVIEW] Maps creados:', { periodos: periodosMap.size, estudiantes: estudiantesMap.size, sedes: sedesMap.size, carreras: carrerasMap.size, grupos: gruposMap.size });
    console.log('[CSV PREVIEW] Grupos keys:', Array.from(gruposMap.keys()));
    
    // Funciones de búsqueda local optimizadas (O(1) con Maps)
    const findPeriodoLocal = (codigo) => {
      const p = periodosMap.get(codigo);
      if (!p) throw new Error(`Periodo no encontrado: ${codigo}`);
      return p;
    };
    
    const findEstudianteLocal = (apellidos, nombres) => {
      const ape = apellidos.trim().toUpperCase();
      const nom = nombres.trim().toUpperCase();
      const id = estudiantesMap.get(`${ape}|${nom}`);
      return id ? { id, isNew: false } : { id: null, isNew: true };
    };
    
    const findCarreraLocal = (nombreCarrera, sedeCarrera) => {
      if (!nombreCarrera) return null;
      const key = nombreCarrera.trim().toUpperCase();
      let carrera = carrerasMap.get(key);
      if (sedeCarrera && carrera) {
        const sedeId = sedesMap.get(sedeCarrera.trim().toUpperCase())?.id;
        if (!sedeId) throw new Error(`Sede no encontrada: ${sedeCarrera}`);
        carrera = carreras.find(c => c.NOMBRE_CARRERA?.toUpperCase() === key && c.ID_SEDE === sedeId);
        if (!carrera) throw new Error(`Carrera ${nombreCarrera} no encontrada en sede ${sedeCarrera}`);
      }
      if (!carrera) throw new Error(`Carrera no encontrada: ${nombreCarrera}`);
      return { id: carrera.ID_CARRERA, nombre: carrera.NOMBRE_CARRERA };
    };
    
    const findGrupoLocal = (codigoGrupo, sedeGrupo, idPeriodo) => {
      if (!codigoGrupo) {
        console.log('[CSV PREVIEW] CODIGO_GRUPO vacío, retornando null');
        return null;
      }
      const codigoKey = codigoGrupo.trim().toUpperCase();
      
      // Buscar ID de sede si se proporciona
      let sedeId = null;
      if (sedeGrupo) {
        sedeId = sedesMap.get(sedeGrupo.trim().toUpperCase())?.id;
        if (!sedeId) throw new Error(`Sede no encontrada: ${sedeGrupo}`);
      }
      
      // Key incluye período + sede + código para diferenciar grupos en diferentes sedes
      const mapKey = sedeId ? `${idPeriodo}|${sedeId}|${codigoKey}` : `${idPeriodo}|${codigoKey}`;
      console.log(`[CSV PREVIEW] findGrupoLocal: buscando key="${mapKey}", período=${idPeriodo}, sede=${sedeGrupo || 'cualquiera'}, codigo="${codigoKey}"`);
      
      const grupo = gruposMap.get(mapKey);
      if (!grupo) {
        console.error(`[CSV PREVIEW] Grupo NO ENCONTRADO. Key: "${mapKey}"`);
        console.error(`[CSV PREVIEW] Keys disponibles con período ${idPeriodo}:`, Array.from(gruposMap.keys()).filter(k => k.startsWith(`${idPeriodo}|`)));
        throw new Error(`Grupo no encontrado: ${codigoGrupo}`);
      }
      console.log(`[CSV PREVIEW] Grupo ENCONTRADO:`, { id: grupo.ID_GRUPO, codigo: grupo.CODIGO_GRUPO, nombre: grupo.NOMBRE_GRUPO, sede: grupo.ID_SEDE });
      
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
          const carrera = findCarreraLocal(row.NOMBRE_CARRERA, row.SEDE_CARRERA);
          previewRow.idCarrera = carrera.id;
        }
        
        if (row.CODIGO_GRUPO) {
          console.log(`[CSV PREVIEW] Fila ${i+2}: CODIGO_GRUPO="${row.CODIGO_GRUPO}" (raw), período=${previewRow.idPeriodo}`);
          const grupo = findGrupoLocal(row.CODIGO_GRUPO, row.SEDE_GRUPO, previewRow.idPeriodo);
          previewRow.idGrupo = grupo?.id;
          previewRow.nombreGrupo = grupo?.nombre;
          console.log(`[CSV PREVIEW] Fila ${i+2}: Resultado grupo=`, grupo);
        } else {
          console.log(`[CSV PREVIEW] Fila ${i+2}: CODIGO_GRUPO está vacío - saltando búsqueda de grupo`);
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
        
        previewRow.ALUMNO_LIBRE = 'No'; // Siempre FALSE por defecto
        
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
        ALUMNO_LIBRE: false,
        ACTIVO: true
      }));
    
    // Identificar estudiantes nuevos
    const nuevosEstudiantes = rows
      .filter(r => r.isNewEstudiante && !r.error)
      .map(r => ({
        APELLIDOS: r.APELLIDOS.trim().toUpperCase(),
        NOMBRES: r.NOMBRES.trim().toUpperCase(),
        ACTIVO: true,
        tempKey: `${r.APELLIDOS.trim().toUpperCase()}|${r.NOMBRES.trim().toUpperCase()}`
      }));
    
    // Agrupar por ID_GRUPO
    const lotesPorGrupo = new Map();
    for (const p of postulantes) {
      const key = p.ID_GRUPO ?? 'null';
      if (!lotesPorGrupo.has(key)) lotesPorGrupo.set(key, []);
      lotesPorGrupo.get(key).push(p);
    }
    
    // Ejecutar importación usando batch transaction
    let imported = 0;
    
    try {
      // 1. Construir SQL statements para estudiantes nuevos
      const estudiantesStatements = nuevosEstudiantes.map(est => {
        const ape = est.APELLIDOS.replace(/'/g, "''");
        const nom = est.NOMBRES.replace(/'/g, "''");
        return `INSERT INTO "ESTUDIANTES" ("APELLIDOS", "NOMBRES", "ACTIVO") VALUES ('${ape}', '${nom}', TRUE) RETURNING "ID_ESTUDIANTE", "APELLIDOS", "NOMBRES"`;
      });
      
      // 2. Ejecutar batch de estudiantes
      if (estudiantesStatements.length > 0) {
        setProgress({ current: 0, total: lotesPorGrupo.size + 1, label: 'Creando estudiantes nuevos...' });
        const estResult = await backend.executeBatchTransaction(estudiantesStatements);
        
        // 3. Mapear IDs retornados
        if (estResult && estResult.results) {
          estResult.results.forEach((resultArray, index) => {
            if (resultArray && resultArray[0]) {
              const idEstudiante = resultArray[0].id_estudiante;
              const ape = nuevosEstudiantes[index].APELLIDOS;
              const nom = nuevosEstudiantes[index].NOMBRES;
              const postulante = postulantes.find(p => 
                p.APELLIDOS === ape && p.NOMBRES === nom
              );
              if (postulante) postulante.ID_ESTUDIANTE = idEstudiante;
            }
          });
        }
      }
      
      // 4. Construir SQL statements para todos los postulantes
      const postulantesStatements = [];
      for (const [idGrupo, batch] of lotesPorGrupo) {
        for (const p of batch) {
          const idEst = p.ID_ESTUDIANTE;
          const idPer = p.ID_PERIODO;
          const idSed = p.ID_SEDE || 'NULL';
          const idGru = p.ID_GRUPO || 'NULL';
          const idCar = p.ID_CARRERA || 'NULL';
          const alumLib = p.ALUMNO_LIBRE !== undefined ? p.ALUMNO_LIBRE : false;
          const activo = p.ACTIVO !== undefined ? p.ACTIVO : true;
          
          postulantesStatements.push(
            `INSERT INTO "VW_POSTULANTE" ("ID_ESTUDIANTE", "ID_PERIODO", "ID_SEDE", "ID_GRUPO", "ID_CARRERA", "ALUMNO_LIBRE", "ACTIVO") VALUES (${idEst}, ${idPer}, ${idSed}, ${idGru}, ${idCar}, ${alumLib}, ${activo}) RETURNING "ID_POSTULANTE"`
          );
        }
      }
      
      // 5. Ejecutar batch de postulantes
      if (postulantesStatements.length > 0) {
        await backend.executeBatchTransaction(postulantesStatements);
        imported = postulantesStatements.length;
      }
      
      console.log(`[CSV IMPORT] Transacción completada: ${imported} postulantes importados`);
      setResult({ success: true, imported });
      return true;
    } catch (err) {
      console.error('[CSV IMPORT] Transacción fallida - ROLLBACK ejecutado:', err);
      setResult({ success: false, error: `Importación cancelada: ${err.message}. Todos los cambios han sido revertidos.` });
      return false;
    } finally {
      setImporting(false);
    }
  }, []);

  return { preview, importRows, importing, progress, result };
}
