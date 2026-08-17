import { useState, useEffect, useMemo } from 'react';
import { db } from '@/shared/api';

/**
 * usePostulantesFilters — lógica de filtros para página 3 (Postulantes).
 * Convocatoria (obligatorio) → Sede (opcional) → Curso (opcional).
 * @param {Object} initialFilters - { idConvocatoria, idSede, idConvocatoriaCurso } pre-seleccionados
 */
export function usePostulantesFilters(initialFilters) {
  const [convocatorias, setConvocatorias] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  const [selectedIdConvocatoria, setSelectedIdConvocatoria] = useState(initialFilters?.idConvocatoria || '');
  const [selectedIdSede, setSelectedIdSede] = useState(initialFilters?.idSede || '');
  const [selectedIdConvocatoriaCurso, setSelectedIdConvocatoriaCurso] = useState(initialFilters?.idConvocatoriaCurso || '');

  // Cargar lista de convocatorias
  const loadConvocatorias = async () => {
    try {
      const data = await db.select('VW_CONVOCATORIAS', {});
      setConvocatorias(data || []);
    } catch (err) {
      console.error('Error cargando convocatorias:', err);
    }
  };

  // Cargar lista de convocatorias al montar
  useEffect(() => {
    loadConvocatorias();
  }, []);

  // Cargar sedes para una convocatoria
  const loadSedes = async (idConvocatoria) => {
    if (!idConvocatoria) {
      setSedes([]);
      return;
    }
    setLoadingFilters(true);
    try {
      const data = await db.select('VW_CONVOCATORIAS_CURSO', { ID_CONVOCATORIA: idConvocatoria });
      const sedesMap = new Map();
      (data || []).forEach(row => {
        if (!sedesMap.has(row.ID_SEDE)) {
          sedesMap.set(row.ID_SEDE, { ID_SEDE: row.ID_SEDE, NOMBRE_SEDE: row.NOMBRE_SEDE, CODIGO_SEDE: row.CODIGO_SEDE });
        }
      });
      setSedes(Array.from(sedesMap.values()).sort((a, b) =>
        String(a.NOMBRE_SEDE || '').localeCompare(String(b.NOMBRE_SEDE || ''), 'es', { sensitivity: 'base' })
      ));
    } catch (err) {
      console.error('Error cargando sedes:', err);
      setSedes([]);
    } finally {
      setLoadingFilters(false);
    }
  };

  // Cargar sedes cuando cambia la convocatoria
  useEffect(() => {
    loadSedes(selectedIdConvocatoria);
  }, [selectedIdConvocatoria]);

  // Cargar cursos para una convocatoria + sede
  const loadCursos = async (idConvocatoria, idSede) => {
    if (!idConvocatoria || !idSede) {
      setCursos([]);
      return;
    }
    setLoadingFilters(true);
    try {
      const data = await db.select('VW_CONVOCATORIAS_CURSO', {
        ID_CONVOCATORIA: idConvocatoria,
        ID_SEDE: idSede
      });
      const sorted = [...(data || [])].sort((a, b) =>
        String(a.NOMBRE_CURSO || '').localeCompare(String(b.NOMBRE_CURSO || ''), 'es', { sensitivity: 'base' })
      );
      setCursos(sorted);
    } catch (err) {
      console.error('Error cargando cursos:', err);
      setCursos([]);
    } finally {
      setLoadingFilters(false);
    }
  };

  // Cargar cursos cuando cambia la sede (opcional)
  useEffect(() => {
    loadCursos(selectedIdConvocatoria, selectedIdSede);
  }, [selectedIdConvocatoria, selectedIdSede]);

  const selectedCursoRow = useMemo(() => {
    if (!selectedIdConvocatoriaCurso) return null;
    return cursos.find(c => String(c.ID_CONVOCATORIA_CURSO) === String(selectedIdConvocatoriaCurso)) || null;
  }, [cursos, selectedIdConvocatoriaCurso]);

  const activeFiltersCount = [
    selectedIdConvocatoria,
    selectedIdSede,
    selectedIdConvocatoriaCurso
  ].filter(Boolean).length;

  const handleConvocatoriaChange = (e) => {
    setSelectedIdConvocatoria(e.target.value);
    setSelectedIdSede('');
    setSelectedIdConvocatoriaCurso('');
  };

  const handleSedeChange = (e) => {
    setSelectedIdSede(e.target.value);
    setSelectedIdConvocatoriaCurso('');
  };

  const handleCursoChange = (e) => {
    setSelectedIdConvocatoriaCurso(e.target.value);
  };

  // Clear (X) — cascada: limpiar hijos también
  const clearConvocatoria = () => {
    setSelectedIdConvocatoria('');
    setSelectedIdSede('');
    setSelectedIdConvocatoriaCurso('');
  };

  const clearSede = () => {
    setSelectedIdSede('');
    setSelectedIdConvocatoriaCurso('');
  };

  const clearCurso = () => {
    setSelectedIdConvocatoriaCurso('');
  };

  // Refresh — recargar la lista correspondiente sin perder selección
  const refreshConvocatorias = () => loadConvocatorias();
  const refreshSedes = () => loadSedes(selectedIdConvocatoria);
  const refreshCursos = () => loadCursos(selectedIdConvocatoria, selectedIdSede);

  return {
    convocatorias,
    sedes,
    cursos,
    selectedIdConvocatoria,
    selectedIdSede,
    selectedIdConvocatoriaCurso,
    selectedCursoRow,
    loadingFilters,
    activeFiltersCount,
    handleConvocatoriaChange,
    handleSedeChange,
    handleCursoChange,
    clearConvocatoria,
    clearSede,
    clearCurso,
    refreshConvocatorias,
    refreshSedes,
    refreshCursos,
  };
}
