import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/shared/api';

/**
 * PlazasGridInput - Grid de control de plazas por (sede x curso).
 *
 * Por defecto añade TODAS las combinaciones (sede activa x curso activo)
 * con NUMERO_PLAZAS=0. El usuario ajusta con +/- y elimina los que no apliquen.
 *
 * value = array de { ID_SEDE, ID_CURSO, NUMERO_PLAZAS, NOMBRE_SEDE?, NOMBRE_CURSO? }
 * onChange(name, value) emite el array actualizado.
 */
const PlazasGridInput = ({
  name,
  value,
  onChange,
  label,
  disabled = false,
  required = false,
  minPlazas = 0,
  maxPlazas = 99
}) => {
  const [sedes, setSedes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Estado local por sede para el select de "re-añadir curso"
  // { [idSede]: idCursoSeleccionadoEnSelect }
  const [selectCursoBySede, setSelectCursoBySede] = useState({});

  // Normalizar value a array
  const plazas = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [value]);

  // Cargar sedes y cursos activos (una sola vez)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [sedesData, cursosData] = await Promise.all([
          db.select('SEDES', { ACTIVO: true }),
          db.select('CURSOS', { ACTIVO: true })
        ]);
        if (!mounted) return;
        setSedes(Array.isArray(sedesData) ? sedesData : []);
        setCursos(Array.isArray(cursosData) ? cursosData : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Error cargando sedes/cursos');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Notificar cambios al formulario
  const notify = useCallback((next) => {
    onChange?.(name, next);
  }, [name, onChange]);

  // Auto-poblar todas las combinaciones cuando cargan sedes+cursos
  // y value está vacío (primera vez)
  useEffect(() => {
    if (loading || sedes.length === 0 || cursos.length === 0) return;
    if (plazas.length > 0) return; // ya tiene datos
    const allCombos = [];
    sedes.forEach((s) => {
      cursos.forEach((c) => {
        allCombos.push({
          ID_SEDE: Number(s.ID_SEDE),
          ID_CURSO: Number(c.ID_CURSO),
          NUMERO_PLAZAS: 0,
          NOMBRE_SEDE: s.NOMBRE_SEDE,
          CODIGO_SEDE: s.CODIGO_SEDE,
          NOMBRE_CURSO: c.NOMBRE_CURSO,
          CODIGO_CURSO: c.CODIGO_CURSO,
          COLOR: c.COLOR
        });
      });
    });
    notify(allCombos);
  }, [loading, sedes, cursos, plazas.length, notify]);

  // Plazas añadidas a una sede concreta
  const plazasBySede = useCallback((idSede) => {
    return plazas.filter(p => Number(p.ID_SEDE) === Number(idSede));
  }, [plazas]);

  // Cursos disponibles para re-añadir a una sede (no añadidos actualmente)
  const cursosDisponiblesBySede = useCallback((idSede) => {
    const addedIds = new Set(plazasBySede(idSede).map(p => Number(p.ID_CURSO)));
    return cursos.filter(c => !addedIds.has(Number(c.ID_CURSO)));
  }, [cursos, plazasBySede]);

  // Re-añadir curso a una sede (desde el select)
  const handleAddCurso = (idSede) => {
    const idCurso = selectCursoBySede[idSede];
    if (!idCurso) return;
    const curso = cursos.find(c => Number(c.ID_CURSO) === Number(idCurso));
    if (!curso) return;
    const sede = sedes.find(s => Number(s.ID_SEDE) === Number(idSede));
    const next = [
      ...plazas,
      {
        ID_SEDE: Number(idSede),
        ID_CURSO: Number(idCurso),
        NUMERO_PLAZAS: 0,
        NOMBRE_SEDE: sede?.NOMBRE_SEDE,
        CODIGO_SEDE: sede?.CODIGO_SEDE,
        NOMBRE_CURSO: curso.NOMBRE_CURSO,
        CODIGO_CURSO: curso.CODIGO_CURSO,
        COLOR: curso.COLOR
      }
    ];
    notify(next);
    setSelectCursoBySede(prev => ({ ...prev, [idSede]: '' }));
  };

  // Quitar curso de una sede
  const handleRemoveCurso = (idSede, idCurso) => {
    const next = plazas.filter(p =>
      !(Number(p.ID_SEDE) === Number(idSede) && Number(p.ID_CURSO) === Number(idCurso))
    );
    notify(next);
  };

  // Cambiar número de plazas
  const handlePlazasChange = (idSede, idCurso, newValue) => {
    let n = parseInt(newValue, 10);
    if (isNaN(n)) n = minPlazas;
    if (n < minPlazas) n = minPlazas;
    if (n > maxPlazas) n = maxPlazas;
    const next = plazas.map(p =>
      (Number(p.ID_SEDE) === Number(idSede) && Number(p.ID_CURSO) === Number(idCurso))
        ? { ...p, NUMERO_PLAZAS: n }
        : p
    );
    notify(next);
  };

  const incPlazas = (idSede, idCurso) => {
    const cur = plazas.find(p => Number(p.ID_SEDE) === Number(idSede) && Number(p.ID_CURSO) === Number(idCurso));
    handlePlazasChange(idSede, idCurso, (cur?.NUMERO_PLAZAS ?? 0) + 1);
  };
  const decPlazas = (idSede, idCurso) => {
    const cur = plazas.find(p => Number(p.ID_SEDE) === Number(idSede) && Number(p.ID_CURSO) === Number(idCurso));
    handlePlazasChange(idSede, idCurso, (cur?.NUMERO_PLAZAS ?? 0) - 1);
  };

  // Totales
  const totalPlazas = useMemo(() =>
    plazas.reduce((sum, p) => sum + (Number(p.NUMERO_PLAZAS) || 0), 0),
    [plazas]
  );
  const totalCursosConPlazas = useMemo(() =>
    plazas.filter(p => Number(p.NUMERO_PLAZAS) > 0).length,
    [plazas]
  );

  // Filtrar sedes por búsqueda
  const sedesFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return sedes;
    const t = searchTerm.toLowerCase();
    return sedes.filter(s =>
      (s.NOMBRE_SEDE || '').toLowerCase().includes(t) ||
      (s.CODIGO_SEDE || '').toLowerCase().includes(t)
    );
  }, [sedes, searchTerm]);

  /* ===== iconos ===== */
  const IconPlus = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>;
  const IconMinus = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4"/></svg>;
  const IconX = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>;
  const IconSearch = () => <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500">Cargando sedes y cursos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        <span>Error: {error}</span>
      </div>
    );
  }

  if (sedes.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        No hay sedes activas disponibles.
      </div>
    );
  }

  return (
    <div>
      {/* Header con label + stats + búsqueda */}
      {label && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-800">
              {label}{required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-100">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {totalPlazas} plazas
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-medium border border-purple-100">
                {totalCursosConPlazas} cursos con plazas
              </span>
            </div>
          </div>
          {/* Búsqueda de sede */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <IconSearch />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar sede..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50"
            />
          </div>
        </div>
      )}

      {/* Grid de sedes */}
      <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1 -mr-1">
        {sedesFiltradas.map((sede) => {
          const idSede = sede.ID_SEDE;
          const added = plazasBySede(idSede);
          const sedePlazasTotal = added.reduce((s, p) => s + (Number(p.NUMERO_PLAZAS) || 0), 0);
          const sedeCursosConPlazas = added.filter(p => Number(p.NUMERO_PLAZAS) > 0).length;

          return (
            <div key={idSede} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Header sede */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {sede.CODIGO_SEDE || sede.NOMBRE_SEDE?.[0] || '?'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {sede.NOMBRE_SEDE}
                    </div>
                    <div className="text-xs text-gray-500">
                      {added.length} curso{added.length !== 1 ? 's' : ''} · {sedeCursosConPlazas} con plazas
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sedePlazasTotal > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      {sedePlazasTotal} plazas
                    </span>
                  )}
                </div>
              </div>

              {/* Body: grid de cursos */}
              <div className="p-4">
                {added.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-3 text-center">Sin cursos en esta sede.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {added.map((p) => {
                      const color = p.COLOR || '#6B7280';
                      const hasPlazas = Number(p.NUMERO_PLAZAS) > 0;
                      return (
                        <div
                          key={`${p.ID_SEDE}-${p.ID_CURSO}`}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                            hasPlazas
                              ? 'border-blue-200 bg-blue-50/40'
                              : 'border-gray-200 bg-gray-50/40'
                          }`}
                        >
                          {/* Color dot */}
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300"
                            style={{ backgroundColor: color }}
                            title={p.CODIGO_CURSO}
                          />

                          {/* Curso name */}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-800 truncate" title={p.NOMBRE_CURSO}>
                              {p.NOMBRE_CURSO || `Curso #${p.ID_CURSO}`}
                            </div>
                            {p.CODIGO_CURSO && (
                              <div className="text-[10px] text-gray-400 font-mono">{p.CODIGO_CURSO}</div>
                            )}
                          </div>

                          {/* Controles plazas */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => decPlazas(p.ID_SEDE, p.ID_CURSO)}
                              disabled={disabled}
                              className="w-7 h-7 flex items-center justify-center text-red-600 rounded-md hover:bg-red-100 disabled:opacity-40 transition-colors"
                              title="Disminuir"
                            >
                              <IconMinus />
                            </button>
                            <input
                              type="number"
                              value={p.NUMERO_PLAZAS ?? 0}
                              min={minPlazas}
                              max={maxPlazas}
                              disabled={disabled}
                              onChange={(e) => handlePlazasChange(p.ID_SEDE, p.ID_CURSO, e.target.value)}
                              className={`w-12 text-center px-1 py-1 text-sm font-semibold border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                hasPlazas
                                  ? 'border-blue-300 bg-white text-blue-700'
                                  : 'border-gray-200 bg-white text-gray-600'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => incPlazas(p.ID_SEDE, p.ID_CURSO)}
                              disabled={disabled}
                              className="w-7 h-7 flex items-center justify-center text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-40 transition-colors"
                              title="Aumentar"
                            >
                              <IconPlus />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCurso(p.ID_SEDE, p.ID_CURSO)}
                              disabled={disabled}
                              className="w-7 h-7 flex items-center justify-center text-gray-400 rounded-md hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-colors ml-0.5"
                              title="Quitar curso"
                            >
                              <IconX />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Re-añadir curso eliminado */}
                {(() => {
                  const available = cursosDisponiblesBySede(idSede);
                  if (available.length === 0 || disabled) return null;
                  const selectValue = selectCursoBySede[idSede] || '';
                  return (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <select
                        value={selectValue}
                        onChange={(e) => setSelectCursoBySede(prev => ({ ...prev, [idSede]: e.target.value }))}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      >
                        <option value="">+ Re-añadir curso...</option>
                        {available.map((c) => (
                          <option key={c.ID_CURSO} value={c.ID_CURSO}>
                            {c.CODIGO_CURSO ? `${c.CODIGO_CURSO} — ` : ''}{c.NOMBRE_CURSO}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAddCurso(idSede)}
                        disabled={!selectValue}
                        className="px-3 py-2 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Añadir
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
        {sedesFiltradas.length === 0 && searchTerm && (
          <div className="py-8 text-center text-sm text-gray-400">
            No se encontraron sedes para "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

export default PlazasGridInput;
