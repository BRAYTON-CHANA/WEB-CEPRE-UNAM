import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/shared/api';

const STORAGE_KEY = 'cepre_periodo';
const PeriodoContext = createContext(null);

const resolverInicial = (list) => {
  const activos = list.filter(p => p.ACTIVO);
  const saved = Number(localStorage.getItem(STORAGE_KEY));
  const savedRow = saved ? activos.find(p => p.ID_PERIODO === saved) : null;

  const inicial = savedRow
    ?? activos.find(p => p.ES_DEFAULT)
    ?? [...activos].sort((a, b) => new Date(b.FECHA_INICIO || 0) - new Date(a.FECHA_INICIO || 0))[0]
    ?? null;

  return inicial ? inicial.ID_PERIODO : null;
};

/**
 * PeriodoProvider — periodo de trabajo global.
 * Persiste en localStorage; el valor inicial se resuelve:
 * guardado válido -> ES_DEFAULT -> ACTIVO más reciente.
 * refreshPeriodos() invalida el caché (llamar tras CRUD en PERIODOS).
 */
export const PeriodoProvider = ({ children }) => {
  const [periodos, setPeriodos] = useState([]);
  const [periodo, setPeriodoState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshPeriodos = useCallback(async () => {
    setError(null);
    try {
      const res = await db.select('VW_PERIODOS');
      const list = Array.isArray(res?.data || res) ? (res?.data || res) : [];
      setPeriodos(list);
      // Revalidar el periodo actual: si ya no existe o está inactivo, resolver de nuevo
      setPeriodoState(prev => {
        const sigue = list.find(p => p.ID_PERIODO === prev && p.ACTIVO);
        return sigue ? prev : resolverInicial(list);
      });
    } catch (err) {
      setPeriodos([]);
      setError(err?.message || 'Error al cargar periodos');
      console.error('[PeriodoContext] Error al cargar periodos:', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const res = await db.select('VW_PERIODOS');
        const list = Array.isArray(res?.data || res) ? (res?.data || res) : [];
        if (cancelled) return;
        setPeriodos(list);
        setPeriodoState(resolverInicial(list));
      } catch (err) {
        if (!cancelled) {
          setPeriodos([]);
          setError(err?.message || 'Error al cargar periodos');
          console.error('[PeriodoContext] Error al cargar periodos:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Sync entre pestañas: otra pestaña cambió el periodo
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setPeriodoState(Number(e.newValue));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPeriodo = useCallback((id) => {
    const val = id || null;
    setPeriodoState(val);
    if (val) localStorage.setItem(STORAGE_KEY, String(val));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const periodoObj = useMemo(
    () => periodos.find(p => p.ID_PERIODO === periodo) ?? null,
    [periodos, periodo]
  );

  const value = useMemo(() => ({
    periodo,
    periodoObj,
    periodos,
    setPeriodo,
    refreshPeriodos,
    loading,
    error
  }), [periodo, periodoObj, periodos, setPeriodo, refreshPeriodos, loading, error]);

  return <PeriodoContext.Provider value={value}>{children}</PeriodoContext.Provider>;
};

export const usePeriodo = () => useContext(PeriodoContext);
