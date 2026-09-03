import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import TablaEditableDocente from './TablaEditableDocente';
import { TABLAS_RELACIONADAS } from '@/features/docentes/config/tablasRelacionadasConfig';
import { getTablasDocente } from '@/features/docentes/services/docenteService';

/**
 * DocenteTablasRelacionadas — contenedor de las 4 tablas hijas del docente.
 * Se renderiza en la página 3 del DocenteForm.
 *
 * Optimización: en modo edit carga las 4 tablas en 1 sola consulta (fn_get_tablas_docente).
 * En modo create las tablas viven en memoria (sin BD).
 *
 * Props:
 *  - idDocente: ID_DOCENTE ya guardado (null si aún no se guarda el docente)
 *  - mode: 'edit' (default) | 'create'
 *
 * Ref methods (via forwardRef):
 *  - validateAndGetAllData(): { valid, error, data }
 */
const DocenteTablasRelacionadas = forwardRef(function DocenteTablasRelacionadas({
  idDocente,
  mode = 'edit'
}, ref) {
  const isCreateMode = mode === 'create';

  const refs = {
    formacion_academica: useRef(null),
    capacitaciones: useRef(null),
    idioma_ofimatica: useRef(null),
    experiencia_laboral: useRef(null)
  };

  // Mapear key de config → key del objeto de retorno de fn_get_tablas_docente
  const dataKeyMap = {
    formacion_academica: 'formacion',
    capacitaciones: 'capacitaciones',
    idioma_ofimatica: 'idiomas',
    experiencia_laboral: 'experiencia'
  };

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(!isCreateMode && !!idDocente);
  const [loadError, setLoadError] = useState(null);

  // Cargar las 4 tablas en 1 sola consulta (modo edit)
  useEffect(() => {
    if (isCreateMode || !idDocente) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getTablasDocente(idDocente)
      .then(data => {
        if (!cancelled) {
          setInitialData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('[DocenteTablasRelacionadas] Error cargando tablas:', err);
          setLoadError(err.message || 'Error al cargar tablas relacionadas');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [idDocente, isCreateMode]);

  useImperativeHandle(ref, () => ({
    validateAndGetAllData: () => {
      const result = { valid: true, error: null, data: {} };
      for (const config of TABLAS_RELACIONADAS) {
        const tableRef = refs[config.key]?.current;
        if (!tableRef) continue;
        const res = tableRef.validateAndGetData();
        if (!res.valid) {
          return { valid: false, error: `${config.title}: ${res.error}`, data: null };
        }
        result.data[dataKeyMap[config.key]] = res.data;
      }
      return result;
    }
  }), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900">Tablas relacionadas al docente</p>
        </div>
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando tablas relacionadas...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900">Tablas relacionadas al docente</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">Tablas relacionadas al docente</p>
            <p className="text-xs text-blue-700 mt-1">
              {isCreateMode
                ? 'Gestione la formación académica, capacitaciones, idiomas/ofimática y experiencia laboral. Todos los cambios se guardarán al finalizar.'
                : 'Gestione la formación académica, capacitaciones, idiomas/ofimática y experiencia laboral del docente.'}
              Todos los campos son obligatorios. Los registros se ordenan por fecha de creación (los últimos agregados aparecen al final).
            </p>
          </div>
        </div>
      </div>

      {TABLAS_RELACIONADAS.map(config => (
        <TablaEditableDocente
          key={config.key}
          ref={refs[config.key]}
          tableName={config.tableName}
          primaryKey={config.primaryKey}
          columns={config.columns}
          idDocente={idDocente}
          title={config.title}
          description={config.description}
          mode={mode}
          initialRows={initialData?.[dataKeyMap[config.key]]}
          skipSelfLoad={!isCreateMode}
        />
      ))}
    </div>
  );
});

export default DocenteTablasRelacionadas;
