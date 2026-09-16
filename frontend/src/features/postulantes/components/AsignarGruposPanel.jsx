import React, { useState, useMemo, useEffect, useRef } from 'react';
import { db } from '@/shared/api';
import SelectInput from '@/shared/components/ui/inputs/SelectInput';

/**
 * Panel de asignación masiva de grupos.
 * - Barra de acción arriba (selector de grupo, contador, botones).
 * - Tabs debajo: Todos, Sin grupo, un tab por cada grupo del periodo.
 * - Tabla al final.
 */
function AsignarGruposPanel({ records, periodo, onCancel, onAssign, loadingAssign }) {
  const [grupos, setGrupos] = useState([]);
  const [gruposLoading, setGruposLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [targetGrupo, setTargetGrupo] = useState('');
  const headerCheckboxRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    if (!periodo) return;
    setGruposLoading(true);
    db.select('GRUPOS', { ID_PERIODO: periodo }, [
      'ID_GRUPO', 'CODIGO_GRUPO', 'NOMBRE_GRUPO', 'MODALIDAD', 'ACTIVO', 'ID_SEDE'
    ])
      .then((data) => {
        if (!mounted) return;
        const rows = Array.isArray(data) ? data : [];
        setGrupos(rows.sort((a, b) => (a.CODIGO_GRUPO || '').localeCompare(b.CODIGO_GRUPO || '')));
      })
      .catch(() => setGrupos([]))
      .finally(() => setGruposLoading(false));
    return () => { mounted = false; };
  }, [periodo]);

  const tabRecords = useMemo(() => {
    if (activeTab === 'todos') return records;
    if (activeTab === 'sin') return records.filter((r) => !r.ID_GRUPO);
    return records.filter((r) => String(r.ID_GRUPO) === String(activeTab));
  }, [records, activeTab]);

  const allCurrentSelected = useMemo(() => {
    if (tabRecords.length === 0) return false;
    return tabRecords.every((r) => selectedIds.has(r.ID_POSTULANTE));
  }, [tabRecords, selectedIds]);

  const someSelected = useMemo(() => {
    return tabRecords.some((r) => selectedIds.has(r.ID_POSTULANTE));
  }, [tabRecords, selectedIds]);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected && !allCurrentSelected;
    }
  }, [someSelected, allCurrentSelected]);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSelectedIds(new Set());
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allCurrentSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        tabRecords.forEach((r) => next.delete(r.ID_POSTULANTE));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        tabRecords.forEach((r) => next.add(r.ID_POSTULANTE));
        return next;
      });
    }
  };

  const selectedRows = useMemo(() => {
    return records.filter((r) => selectedIds.has(r.ID_POSTULANTE));
  }, [records, selectedIds]);

  const targetOptions = useMemo(() =>
    grupos.map((g) => {
      const sede = g.ID_SEDE ? `Sede ${g.ID_SEDE}` : 'Virtual';
      const activo = g.ACTIVO === false ? ' · Inactivo' : '';
      return {
        value: String(g.ID_GRUPO),
        label: `${g.CODIGO_GRUPO || ''} — ${g.NOMBRE_GRUPO || ''} · ${sede} (${g.MODALIDAD || '-'})${activo}`
      };
    }),
    [grupos]
  );

  const handleAsignar = () => {
    if (!targetGrupo || selectedRows.length === 0) return;
    onAssign(targetGrupo, selectedRows);
  };

  const tabCount = (tab) => {
    if (tab === 'todos') return records.length;
    if (tab === 'sin') return records.filter((r) => !r.ID_GRUPO).length;
    return records.filter((r) => String(r.ID_GRUPO) === String(tab)).length;
  };

  const TabButton = ({ tab, label }) => (
    <button
      onClick={() => handleTabChange(tab)}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
        ${activeTab === tab
          ? 'bg-[#25346A] text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      {label}
      <span className={`
        ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 rounded-full text-[10px] font-semibold
        ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}
      `}>
        {tabCount(tab)}
      </span>
    </button>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
      {/* Barra de acción arriba */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            {selectedRows.length > 0 ? (
              <span className="font-semibold text-blue-600">
                {selectedRows.length} estudiante{selectedRows.length === 1 ? '' : 's'} seleccionado{selectedRows.length === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="text-gray-400">Seleccione estudiantes para asignar</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="w-full sm:w-72">
              <SelectInput
                name="id_grupo_destino"
                label="Asignar al grupo"
                options={targetOptions}
                value={targetGrupo}
                onChange={(_, value) => setTargetGrupo(value || '')}
                placeholder="Seleccione grupo destino..."
                searchable={true}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                disabled={loadingAssign}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAsignar}
                disabled={!targetGrupo || selectedRows.length === 0 || loadingAssign}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                {loadingAssign ? 'Asignando...' : `Asignar ${selectedRows.length}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-1 overflow-x-auto">
          <TabButton tab="todos" label="Todos" />
          <TabButton tab="sin" label="Sin grupo" />
          {gruposLoading ? (
            <span className="text-sm text-gray-500 px-2">Cargando grupos...</span>
          ) : (
            grupos.map((g) => (
              <TabButton
                key={g.ID_GRUPO}
                tab={String(g.ID_GRUPO)}
                label={`${g.CODIGO_GRUPO || g.NOMBRE_GRUPO}`}
              />
            ))
          )}
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {tabRecords.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No hay postulantes en esta pestaña.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="border-b border-gray-200">
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allCurrentSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">DNI</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Postulante</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Carrera</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Turno</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grupo actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tabRecords.map((row, idx) => (
                <tr
                  key={row.ID_POSTULANTE}
                  className={`transition-colors ${selectedIds.has(row.ID_POSTULANTE) ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.ID_POSTULANTE)}
                      onChange={() => toggleOne(row.ID_POSTULANTE)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.DNI}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.NOMBRE_COMPLETO}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.NOMBRE_CARRERA || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.TURNO || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.GRADO ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.NOMBRE_GRUPO || 'Sin grupo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AsignarGruposPanel;
