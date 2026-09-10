import { useEffect, useMemo, useState } from 'react';
import { db } from '@/shared/api';

export function useComposerData(isOpen, editMode = false) {
  const [cuentas, setCuentas] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  const [cuenta, setCuenta] = useState('');
  const [personalizado, setPersonalizado] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoadingData(true);
    setError(null);

    (async () => {
      try {
        const cuentasRes = await db.select('CUENTAS_SMTP', { ACTIVO: true });

        if (mounted) {
          setCuentas(cuentasRes || []);
          // Auto-seleccionar la cuenta default si existe
          if (!editMode) {
            const defaultCuenta = (cuentasRes || []).find(c => c.ES_CUENTA_DEFAULT);
            if (defaultCuenta) {
              setCuenta(String(defaultCuenta.ID_CUENTA));
            }
          }
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Error cargando datos iniciales');
      } finally {
        if (mounted) setLoadingData(false);
      }
    })();

    return () => { mounted = false; };
  }, [isOpen, editMode]);

  const remitente = useMemo(() => {
    const c = cuentas.find(cu => String(cu.ID_CUENTA) === cuenta);
    return c ? c.SMTP_USER : '';
  }, [cuenta, cuentas]);

  return {
    cuenta, setCuenta,
    cuentas,
    loadingData, error,
    personalizado, setPersonalizado,
    remitente,
  };
}
