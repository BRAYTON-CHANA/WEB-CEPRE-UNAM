function ProgramacionGrupoConfig() {
  const [selectorValues, setSelectorValues] = useState(initialSelectorValues);

  const [customBlocks, setCustomBlocks] = useState(null);
  const [matrix, setMatrix]             = useState(null);
  const [grupoNombre, setGrupoNombre]   = useState(null);
  const [cellEvents, setCellEvents]     = useState({});
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);

  // --- Modo asignación ---
  const [selectionMode, setSelectionMode]   = useState(false);
  const [selectedCells, setSelectedCells]   = useState(new Set());
  const [selectedCurso, setSelectedCurso]   = useState('');

  // Mapa bloqueOrden → { idBloque } para upserts
  const [bloqueMap, setBloqueMap] = useState({});

  const resetPlantilla = useCallback(() => {
    setCustomBlocks(null);
    setMatrix(null);
    setGrupoNombre(null);
    setCellEvents({});
    setBloqueMap({});
    setSelectionMode(false);
    setSelectedCells(new Set());
    setSelectedCurso('');
  }, []);

  const loadPlantilla = useCallback(async (idGrupo) => {
    if (!idGrupo) return;
    setLoading(true);
    try {
      const records = await db.select('VW_PROGRAMACION_GRUPO_COMPLETA', { ID_GRUPO: idGrupo });

      if (!records || records.length === 0) {
        resetPlantilla();
        return;
      }

      const { blocks, matrix: mat, grupoNombre: nombre, cellEvents: ce } = transformRecords(records);
      setCustomBlocks(blocks);
      setMatrix(mat);
      setGrupoNombre(nombre);
      setCellEvents(ce);

      // Construir mapa bloqueOrden → idBloque
      const bMap = {};
      records.forEach(r => { bMap[r.BLOQUE_ORDEN] = r.ID_BLOQUE; });
      setBloqueMap(bMap);
    } catch (error) {
      console.error('Error al cargar programación del grupo:', error);
      resetPlantilla();
    } finally {
      setLoading(false);
    }
  }, [resetPlantilla]);

  const handleSelectorChange = useCallback((name, value) => {
    setSelectorValues(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'ID_PERIODO') {
        next.ID_SEDE = ''; next.ID_TURNO = ''; next.ID_GRUPO = '';
        resetPlantilla();
      } else if (name === 'ID_SEDE') {
        next.ID_TURNO = ''; next.ID_GRUPO = '';
        resetPlantilla();
      } else if (name === 'ID_TURNO') {
        next.ID_GRUPO = '';
        resetPlantilla();
      } else if (name === 'ID_GRUPO') {
        value ? loadPlantilla(value) : resetPlantilla();
      }
      return next;
    });
  }, [resetPlantilla, loadPlantilla]);

  // --- Toolbar handlers ---
  const handleStartAdd = () => {
    setSelectionMode(true);
    setSelectedCells(new Set());
    setSelectedCurso('');
  };

  const handleCancelAdd = () => {
    setSelectionMode(false);
    setSelectedCells(new Set());
    setSelectedCurso('');
  };

  const handleCellToggle = useCallback((colIdx, bloqueOrden) => {
    const key = `${colIdx}-${bloqueOrden}`;
    setSelectedCells(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleConfirmAdd = useCallback(async () => {
    if (!selectedCurso || selectedCells.size === 0) return;
    const idGrupo = selectorValues.ID_GRUPO;
    setSaving(true);
    try {
      const upserts = [];
      selectedCells.forEach(key => {
        const [colIdxStr, bloqueOrdenStr] = key.split('-');
        const diaIdx    = parseInt(colIdxStr) + 1; // 0-based → 1-based
        const bloqueOrden = parseInt(bloqueOrdenStr);
        const idBloque  = bloqueMap[bloqueOrden];
        if (!idBloque) return;
        upserts.push(
          db.upsert(
            'PROGRAMACION_GRUPO',
            ['ID_GRUPO', 'DIA_IDX', 'ID_BLOQUE'],
            { ID_GRUPO: idGrupo, DIA_IDX: diaIdx, ID_BLOQUE: idBloque, ID_PLAN_ACADEMICO_CURSO: selectedCurso, ACTIVO: true },
            '(ID_GRUPO, DIA_IDX, ID_BLOQUE)'
          )
        );
      });
      await Promise.all(upserts);
      setSelectionMode(false);
      setSelectedCells(new Set());
      setSelectedCurso('');
      await loadPlantilla(idGrupo);
    } catch (err) {
      console.error('Error al asignar curso:', err);
    } finally {
      setSaving(false);
    }
  }, [selectedCurso, selectedCells, selectorValues.ID_GRUPO, bloqueMap, loadPlantilla]);

  const handleCellDelete = useCallback(async (event) => {
    if (!event?.idProgramacion) return;
    setSaving(true);
    try {
      await db.update('PROGRAMACION_GRUPO', event.idProgramacion, { ID_PLAN_ACADEMICO_CURSO: null }, 'ID_PROGRAMACION');
      await loadPlantilla(selectorValues.ID_GRUPO);
    } catch (err) {
      console.error('Error al eliminar asignación:', err);
    } finally {
      setSaving(false);
    }
  }, [selectorValues.ID_GRUPO, loadPlantilla]);

  // --- Selectores params ---
  const stableFormData = useMemo(() => ({
    ID_PERIODO: selectorValues.ID_PERIODO,
    ID_SEDE: selectorValues.ID_SEDE,
    ID_TURNO: selectorValues.ID_TURNO,
    ID_GRUPO: selectorValues.ID_GRUPO
  }), [selectorValues.ID_PERIODO, selectorValues.ID_SEDE, selectorValues.ID_TURNO, selectorValues.ID_GRUPO]);

  const sedeParams  = useMemo(() => ({ ID_PERIODO: selectorValues.ID_PERIODO || null }), [selectorValues.ID_PERIODO]);
  const turnoParams = useMemo(() => ({ ID_PERIODO: selectorValues.ID_PERIODO || null, ID_SEDE: selectorValues.ID_SEDE || null }), [selectorValues.ID_PERIODO, selectorValues.ID_SEDE]);
  const grupoParams = useMemo(() => ({ ID_PERIODO: selectorValues.ID_PERIODO || null, ID_SEDE: selectorValues.ID_SEDE || null, ID_TURNO: selectorValues.ID_TURNO || null }), [selectorValues.ID_PERIODO, selectorValues.ID_SEDE, selectorValues.ID_TURNO]);

  const { sedeDisabled, turnoDisabled, grupoDisabled } = getSelectorDisabledStates(selectorValues);
  const showTemplate = !!customBlocks && !!matrix;

  return (
    <LayoutWithSidebar>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programación de Grupo</h1>
          <p className="text-sm text-gray-600 mt-1">Visualiza y asigna cursos a la plantilla horaria del grupo</p>
        </div>

        {/* Selectores en cascada */}
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ReferenceSelectInput
              name="ID_PERIODO"
              label="Periodo"
              referenceTable="PERIODOS"
              referenceField="ID_PERIODO"
              referenceQuery="{CODIGO_PERIODO}"
              placeholder="Seleccione un periodo"
              searchable={true}
              value={selectorValues.ID_PERIODO || ''}
              onChange={handleSelectorChange}
              formData={stableFormData}
            />
            <FunctionSelectInput
              name="ID_SEDE"
              label="Sede"
              functionName="fn_sedes_con_docentes_asignados"
              functionParams={sedeParams}
              valueField="ID_SEDE"
              labelField="NOMBRE_SEDE"
              descriptionField="{TOTAL_GRUPOS} grupo(s)"
              placeholder={sedeDisabled ? 'Seleccione periodo primero' : 'Seleccione una sede'}
              searchable={true}
              disabled={sedeDisabled}
              value={selectorValues.ID_SEDE || ''}
              onChange={handleSelectorChange}
              formData={stableFormData}
            />
            <FunctionSelectInput
              name="ID_TURNO"
              label="Turno"
              functionName="fn_turnos_con_docentes_asignados"
              functionParams={turnoParams}
              valueField="ID_TURNO"
              labelField="NOMBRE_TURNO"
              descriptionField="{DESCRIPCION} · {TOTAL_GRUPOS} grupo(s)"
              placeholder={turnoDisabled ? 'Seleccione sede primero' : 'Seleccione un turno'}
              searchable={true}
              disabled={turnoDisabled}
              value={selectorValues.ID_TURNO || ''}
              onChange={handleSelectorChange}
              formData={stableFormData}
            />
            <FunctionSelectInput
              name="ID_GRUPO"
              label="Grupo"
              functionName="fn_grupos_por_contexto"
              functionParams={grupoParams}
              valueField="ID_GRUPO"
              labelField="{CODIGO_GRUPO} - {NOMBRE_GRUPO}"
              descriptionField="-------------------------"
              placeholder={grupoDisabled ? 'Seleccione turno primero' : 'Seleccione un grupo'}
              searchable={true}
              disabled={grupoDisabled}
              value={selectorValues.ID_GRUPO || ''}
              onChange={handleSelectorChange}
              formData={stableFormData}
            />
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando plantilla...</p>
          </div>
        ) : showTemplate ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            {/* Header + toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Plantilla: {grupoNombre}
              </h3>

              {/* Toolbar */}
              {selectionMode ? (
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Selector de curso */}
                  <div className="w-72">
                    <FunctionSelectInput
                      name="curso_asignar"
                      label=""
                      hideLabel={true}
                      functionName="fn_grupo_plan_cursos"
                      functionParams={{ ID_GRUPO: selectorValues.ID_GRUPO }}
                      valueField="ID_PLAN_ACADEMICO_CURSO"
                      labelField="{NOMBRE_AREA} - {NOMBRE_CURSO}"
                      descriptionField="Docente: {NOMBRE_COMPLETO_DOCENTE}"
                      placeholder="Seleccionar curso..."
                      searchable={true}
                      value={selectedCurso}
                      onChange={(_, val) => setSelectedCurso(val)}
                      formData={stableFormData}
                    />
                  </div>
                  <button
                    onClick={handleConfirmAdd}
                    disabled={!selectedCurso || selectedCells.size === 0 || saving}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#2D366F] to-[#57C7C2] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#3a4289] hover:to-[#6dd9d4] transition-all flex items-center gap-2 shadow-md"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Confirmar ({selectedCells.size})
                  </button>
                  <button
                    onClick={handleCancelAdd}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                    Haz clic en celdas vacías para seleccionarlas
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  )}
                  <button
                    onClick={handleStartAdd}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#2D366F] to-[#57C7C2] text-white hover:from-[#3a4289] hover:to-[#6dd9d4] transition-all flex items-center gap-2 shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Añadir
                  </button>
                </div>
              )}
            </div>

            <ScheduleTemplate
              blocks={customBlocks}
              matrix={matrix}
              cellEvents={cellEvents}
              selectionMode={selectionMode}
              selectedCells={selectedCells}
              onCellToggle={handleCellToggle}
              onCellDelete={handleCellDelete}
            />
          </div>
        ) : (
          <div className="p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-3 text-gray-500 font-medium">Seleccione un grupo</p>
            <p className="mt-1 text-sm text-gray-400">Elija periodo, sede, turno y grupo para ver su plantilla horaria.</p>
          </div>
        )}
      </div>
    </LayoutWithSidebar>
  );
}

export default ProgramacionGrupoConfig;
