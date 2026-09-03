import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/shared/api';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';

/**
 * GruposGridInput - Grid de creación batch de grupos por (sede x área).
 *
 * Cada combinación sede×área tiene:
 *   - Toggle de selección
 *   - Campos comunes: FECHA_INICIO, FECHA_TERMINO, ID_PLAN
 *   - N grupos individuales: ID_HORARIO, CODIGO_GRUPO, NOMBRE_GRUPO, CAPACIDAD_MAXIMA, ID_AULA
 *
 * value = array de combinaciones:
 * [{
 *   ID_SEDE, ID_AREA, MODALIDAD,
 *   NOMBRE_SEDE, CODIGO_SEDE, NOMBRE_AREA, CODIGO_AREA,
 *   selected: boolean,
 *   FECHA_INICIO, FECHA_TERMINO, ID_PLAN,
 *   grupos: [{ ID_HORARIO, CODIGO_GRUPO, NOMBRE_GRUPO, CAPACIDAD_MAXIMA, ID_AULA }]
 * }]
 */
const GruposGridInput = ({
  name,
  value,
  onChange,
  disabled = false
}) => {
  const [sedes, setSedes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedSedes, setCollapsedSedes] = useState({});

  // Normalizar value a array
  const combos = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [];
  }, [value]);

  // Cargar sedes y áreas activas
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [sedesData, areasData] = await Promise.all([
          db.select('SEDES', { ACTIVO: true }),
          db.select('AREAS', { ACTIVO: true })
        ]);
        if (!mounted) return;
        setSedes(Array.isArray(sedesData) ? sedesData : []);
        setAreas(Array.isArray(areasData) ? areasData : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Error cargando sedes/áreas');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Sedes con pseudo-sede "Virtual" al final
  const sedesConVirtual = useMemo(() => [
    ...sedes.map(s => ({ ...s, MODALIDAD: 'PRESENCIAL' })),
    {
      ID_SEDE: null,
      NOMBRE_SEDE: 'Virtual',
      CODIGO_SEDE: 'VRT',
      MODALIDAD: 'VIRTUAL',
      _isVirtual: true
    }
  ], [sedes]);

  const notify = useCallback((next) => {
    onChange?.(name, next);
  }, [name, onChange]);

  // Auto-poblar combinaciones cuando cargan sedes+áreas
  useEffect(() => {
    if (loading || sedes.length === 0 || areas.length === 0) return;
    if (combos.length > 0) return;
    const allCombos = [];
    sedesConVirtual.forEach((s) => {
      areas.forEach((a) => {
        const isVirtual = !!s._isVirtual;
        const codigoSede = isVirtual ? 'VRT' : (s.CODIGO_SEDE || 'SDA');
        const codigoArea = a.CODIGO_AREA || `A${a.ID_AREA}`;
        allCombos.push({
          ID_SEDE: s.ID_SEDE == null ? null : Number(s.ID_SEDE),
          ID_AREA: Number(a.ID_AREA),
          MODALIDAD: s.MODALIDAD,
          NOMBRE_SEDE: s.NOMBRE_SEDE,
          CODIGO_SEDE: codigoSede,
          NOMBRE_AREA: a.NOMBRE_AREA,
          CODIGO_AREA: codigoArea,
          selected: false,
          FECHA_INICIO: '',
          FECHA_TERMINO: '',
          ID_PLAN: '',
          grupos: [{
            ID_HORARIO: '',
            NOMBRE_GRUPO: `G1 - ${a.NOMBRE_AREA}`,
            CAPACIDAD_MAXIMA: 30,
            ID_AULA: ''
          }]
        });
      });
    });
    notify(allCombos);
  }, [loading, sedes, areas, sedesConVirtual, combos.length, notify]);

  // ===== Helpers de actualización =====
  const comboKey = (c) => `${c.ID_SEDE == null ? 'null' : c.ID_SEDE}|${c.ID_AREA}|${c.MODALIDAD}`;

  const updateCombo = (idSede, idArea, modalidad, updater) => {
    const next = combos.map(c =>
      ((c.ID_SEDE == null ? null : Number(c.ID_SEDE)) === (idSede == null ? null : Number(idSede))
        && Number(c.ID_AREA) === Number(idArea)
        && (c.MODALIDAD || 'PRESENCIAL') === (modalidad || 'PRESENCIAL'))
        ? updater(c)
        : c
    );
    notify(next);
  };

  const handleToggleCombo = (idSede, idArea, modalidad) => {
    updateCombo(idSede, idArea, modalidad, c => ({ ...c, selected: !c.selected }));
  };

  const handleComboFieldChange = (idSede, idArea, modalidad, field, newValue) => {
    updateCombo(idSede, idArea, modalidad, c => ({ ...c, [field]: newValue }));
  };

  const handleGrupoFieldChange = (idSede, idArea, modalidad, grupoIdx, field, newValue) => {
    updateCombo(idSede, idArea, modalidad, c => ({
      ...c,
      grupos: c.grupos.map((g, i) => i === grupoIdx ? { ...g, [field]: newValue } : g)
    }));
  };

  const handleAddGrupo = (idSede, idArea, modalidad) => {
    updateCombo(idSede, idArea, modalidad, c => {
      const newIdx = c.grupos.length + 1;
      return {
        ...c,
        grupos: [...c.grupos, {
          ID_HORARIO: '',
          NOMBRE_GRUPO: `G${newIdx} - ${c.NOMBRE_AREA}`,
          CAPACIDAD_MAXIMA: 30,
          ID_AULA: ''
        }]
      };
    });
  };

  const handleRemoveGrupo = (idSede, idArea, modalidad, grupoIdx) => {
    updateCombo(idSede, idArea, modalidad, c => ({
      ...c,
      grupos: c.grupos.filter((_, i) => i !== grupoIdx)
    }));
  };

  const handleToggleSede = (idSede, modalidad, selectAll) => {
    const next = combos.map(c =>
      ((c.ID_SEDE == null ? null : Number(c.ID_SEDE)) === (idSede == null ? null : Number(idSede))
        && (c.MODALIDAD || 'PRESENCIAL') === (modalidad || 'PRESENCIAL'))
        ? { ...c, selected: selectAll }
        : c
    );
    notify(next);
  };

  // Stats
  const totalCombosSelected = useMemo(() => combos.filter(c => c.selected).length, [combos]);
  const totalGrupos = useMemo(() =>
    combos.filter(c => c.selected).reduce((sum, c) => sum + c.grupos.length, 0),
    [combos]
  );

  // Filtrar sedes por búsqueda
  const sedesFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return sedesConVirtual;
    const t = searchTerm.toLowerCase();
    return sedesConVirtual.filter(s =>
      (s.NOMBRE_SEDE || '').toLowerCase().includes(t) ||
      (s.CODIGO_SEDE || '').toLowerCase().includes(t)
    );
  }, [sedesConVirtual, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500">Cargando sedes y áreas...</p>
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

  if (areas.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        No hay áreas activas disponibles.
      </div>
    );
  }

  return (
    <div>
      {/* Header con stats + búsqueda */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-800">
            Grupos por Sede × Área
          </label>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full font-medium border border-blue-100">
              {totalCombosSelected} combos
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium border border-indigo-100">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
              {totalGrupos} grupos
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
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

      {/* Grid de sedes */}
      <div className="space-y-3">
        {sedesFiltradas.map((sede) => {
          const idSede = sede.ID_SEDE;
          const modalidad = sede.MODALIDAD || 'PRESENCIAL';
          const isVirtual = !!sede._isVirtual;
          const sedeCombos = combos.filter(c =>
            (c.ID_SEDE == null ? null : Number(c.ID_SEDE)) === (idSede == null ? null : Number(idSede))
            && (c.MODALIDAD || 'PRESENCIAL') === modalidad
          );
          const sedeSelected = sedeCombos.filter(c => c.selected).length;
          const allSelected = sedeCombos.length > 0 && sedeSelected === sedeCombos.length;
          const sedeKey = `${idSede}-${modalidad}`;
          const isCollapsed = collapsedSedes[sedeKey];

          const toggleCollapse = () => {
            setCollapsedSedes(prev => ({ ...prev, [sedeKey]: !prev[sedeKey] }));
          };

          return (
            <div key={sedeKey} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
              {/* ===== Header sede (clickeable para colapsar) ===== */}
              <div
                className={`px-5 py-3.5 flex items-center justify-between cursor-pointer select-none transition-colors ${
                  isVirtual
                    ? 'bg-gradient-to-r from-violet-50/60 to-indigo-50/60'
                    : 'bg-gradient-to-r from-slate-50/80 to-gray-50/80'
                }`}
                onClick={toggleCollapse}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Chevron */}
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  {/* Badge sede */}
                  <div className={`w-9 h-9 rounded-lg text-white flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isVirtual ? 'bg-indigo-500' : 'bg-slate-600'
                  }`}>
                    {isVirtual ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 18l-1 1h10l-1-1-.75-1M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    ) : (
                      sede.CODIGO_SEDE || sede.NOMBRE_SEDE?.[0] || '?'
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <span className="truncate">{sede.NOMBRE_SEDE}</span>
                      {isVirtual && (
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded border border-indigo-200 flex-shrink-0">
                          VIRTUAL
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {sedeSelected} de {sedeCombos.length} áreas seleccionadas
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleToggleSede(idSede, modalidad, !allSelected)}
                    disabled={disabled}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      allSelected
                        ? 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    } disabled:opacity-40`}
                  >
                    {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
                  </button>
                </div>
              </div>

              {/* ===== Body: áreas (colapsable) ===== */}
              {!isCollapsed && (
                <div className="p-4 space-y-3">
                  {sedeCombos.map((c) => {
                    const isSelected = c.selected;
                    return (
                      <div
                        key={comboKey(c)}
                        className={`rounded-lg border transition-all duration-200 ${
                          isSelected
                            ? isVirtual
                              ? 'border-indigo-200 bg-indigo-50/20'
                              : 'border-blue-200 bg-blue-50/20'
                            : 'border-gray-100 bg-gray-50/30'
                        }`}
                      >
                        {/* --- Header celda: toggle + nombre área --- */}
                        <div className="flex items-center gap-2.5 px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCombo(c.ID_SEDE, c.ID_AREA, c.MODALIDAD)}
                            disabled={disabled}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                              isSelected
                                ? isVirtual
                                  ? 'bg-indigo-500 border-indigo-500 text-white'
                                  : 'bg-blue-500 border-blue-500 text-white'
                                : 'border-gray-300 hover:border-gray-400 bg-white'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                            )}
                          </button>
                          <span className="text-sm font-semibold text-gray-800 truncate flex-1" title={c.NOMBRE_AREA}>
                            {c.NOMBRE_AREA}
                          </span>
                          {c.CODIGO_AREA && (
                            <span className="text-[10px] text-gray-400 font-mono px-1.5 py-0.5 bg-gray-100 rounded">
                              {c.CODIGO_AREA}
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-[10px] text-gray-400 font-medium">
                              {c.grupos.length} grupo{c.grupos.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* --- Contenido editable (solo si está seleccionado) --- */}
                        {isSelected && (
                          <div className="px-4 pb-4 space-y-3">
                            {/* ===== Config común (sede×área): plan + fechas ===== */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white rounded-lg border border-gray-100">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Plan Académico *</label>
                                <ReferenceSelectInput
                                  name={`plan-${comboKey(c)}`}
                                  referenceTable="PLAN_ACADEMICO"
                                  referenceField="ID_PLAN"
                                  referenceLabelField="DESCRIPCION"
                                  referenceFilters={[
                                    { field: 'ID_AREA', op: '=', value: String(c.ID_AREA) },
                                    { field: 'ACTIVO', op: '=', value: true }
                                  ]}
                                  placeholder="Sin plan"
                                  searchable={true}
                                  showRefreshButton={true}
                                  comboboxClassName="text-sm"
                                  value={c.ID_PLAN}
                                  onChange={(_, v) => handleComboFieldChange(c.ID_SEDE, c.ID_AREA, c.MODALIDAD, 'ID_PLAN', v)}
                                  formData={{}}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Fecha Inicio *</label>
                                <input
                                  type="date"
                                  value={c.FECHA_INICIO}
                                  max={c.FECHA_TERMINO || undefined}
                                  disabled={disabled}
                                  onChange={(e) => handleComboFieldChange(c.ID_SEDE, c.ID_AREA, c.MODALIDAD, 'FECHA_INICIO', e.target.value)}
                                  className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white ${
                                    c.FECHA_INICIO && c.FECHA_TERMINO && c.FECHA_INICIO >= c.FECHA_TERMINO
                                      ? 'border-red-400 bg-red-50'
                                      : 'border-gray-300'
                                  }`}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Fecha Término *</label>
                                <input
                                  type="date"
                                  value={c.FECHA_TERMINO}
                                  min={c.FECHA_INICIO || undefined}
                                  disabled={disabled}
                                  onChange={(e) => handleComboFieldChange(c.ID_SEDE, c.ID_AREA, c.MODALIDAD, 'FECHA_TERMINO', e.target.value)}
                                  className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white ${
                                    c.FECHA_INICIO && c.FECHA_TERMINO && c.FECHA_TERMINO <= c.FECHA_INICIO
                                      ? 'border-red-400 bg-red-50'
                                      : 'border-gray-300'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* ===== Tabla de grupos ===== */}
                            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                              {/* Header de la tabla */}
                              <div className="grid grid-cols-[2fr_2fr_1.5fr_0.6fr_32px] gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                <span>Nombre *</span>
                                <span>Horario *</span>
                                <span>Aula</span>
                                <span className="text-center">Cap.</span>
                                <span></span>
                              </div>

                              {/* Filas de grupos */}
                              {c.grupos.map((g, gIdx) => (
                                <div
                                  key={gIdx}
                                  className="grid grid-cols-[2fr_2fr_1.5fr_0.6fr_32px] gap-2 px-3 py-2 border-b border-gray-50 last:border-b-0 items-center hover:bg-gray-50/50 transition-colors"
                                >
                                  {/* Nombre */}
                                  <input
                                    type="text"
                                    value={g.NOMBRE_GRUPO || ''}
                                    disabled={disabled}
                                    onChange={(e) => handleGrupoFieldChange(c.ID_SEDE, c.ID_AREA, c.MODALIDAD, gIdx, 'NOMBRE_GRUPO', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                                  />
                                  {/* Horario */}
                                  <ReferenceSelectInput
                                    name={`horario-${comboKey(c)}-${gIdx}`}
                                    referenceTable="HORARIOS"
                                    referenceField="ID_HORARIO"
                                    referenceLabelField="NOMBRE_HORARIO"
                                    placeholder="Seleccionar..."
                                    searchable={true}
                                    showRefreshButton={true}
                                    comboboxClassName="text-sm"
                                    value={g.ID_HORARIO}
                                    onChange={(_, v) => handleGrupoFieldChange(c.ID_SEDE, c.ID_AREA, c.MODALIDAD, gIdx, 'ID_HORARIO', v)}
                                    formData={{}}
                                  />
                                  {/* Aula */}
                                  {isVirtual ? (
                                    <div className="px-2 py-1.5 text-xs text-gray-400 italic bg-gray-50 border border-gray-200 rounded text-center">—</div>
                                  ) : (
                                    <ReferenceSelectInput
                                      name={`aula-${comboKey(c)}-${gIdx}`}
                                      referenceTable="AULAS"
                                      referenceField="ID_AULA"
                                      referenceLabelField="NOMBRE_AULA"
                                      referenceFilters={[
                                        { field: 'ID_SEDE', op: '=', value: String(c.ID_SEDE) },
                                        { field: 'ACTIVO', op: '=', value: true }
                                      ]}
                                      placeholder="Sin aula"
                                      searchable={true}
                                      showRefreshButton={true}
                                      comboboxClassName="text-sm"
                                      value={g.ID_AULA}
                                      onChange={(_, v) => handleGrupoFieldChange(c.ID_SEDE, c.ID_AREA, c.MODALIDAD, gIdx, 'ID_AULA', v)}
                                      formData={{}}
                                    />
                                  )}
                                  {/* Capacidad (vacío por defecto, con botón para setear) */}
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={g.CAPACIDAD_MAXIMA ?? ''}
                                      min={0}
                                      disabled={disabled}
                                      onChange={(e) => handleGrupoFieldChange(c.ID_SEDE, c.ID_AREA, c.MODALIDAD, gIdx, 'CAPACIDAD_MAXIMA', e.target.value === '' ? '' : Number(e.target.value))}
                                      placeholder="—"
                                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                                    />
                                  </div>
                                  {/* Eliminar */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGrupo(c.ID_SEDE, c.ID_AREA, c.MODALIDAD, gIdx)}
                                    disabled={disabled || c.grupos.length <= 1}
                                    className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30"
                                    title="Eliminar grupo"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                                  </button>
                                </div>
                              ))}

                              {/* Botón añadir grupo */}
                              <button
                                type="button"
                                onClick={() => handleAddGrupo(c.ID_SEDE, c.ID_AREA, c.MODALIDAD)}
                                disabled={disabled}
                                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 disabled:opacity-40 transition-colors border-t border-gray-100"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                                Añadir grupo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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

export default GruposGridInput;
