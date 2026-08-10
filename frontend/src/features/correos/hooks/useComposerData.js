import { useEffect, useMemo, useState } from 'react';
import { db } from '@/shared/api';
import { ALLOWED_MAIL_TYPES } from '@/features/correos/constants/composer';

export function useComposerData(isOpen) {
  const [tipos, setTipos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  const [tipo, setTipo] = useState('');
  const [cuenta, setCuenta] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoadingData(true);
    setError(null);

    (async () => {
      try {
        const [tiposRes, cuentasRes] = await Promise.all([
          db.select('VW_TIPOS_CORREO', { ENVIO_AUTOMATICO: false }),
          db.select('CUENTAS_SMTP', { ACTIVO: true }),
        ]);

        const tiposFiltrados = (tiposRes || []).filter(t =>
          ALLOWED_MAIL_TYPES.includes(t.NOMBRE_TIPO)
        );

        if (mounted) {
          setTipos(tiposFiltrados);
          setCuentas(cuentasRes || []);
          if (tiposFiltrados.length === 1) {
            const t = tiposFiltrados[0];
            setTipo(t.NOMBRE_TIPO);
            if (t.ID_CUENTA) setCuenta(String(t.ID_CUENTA));
          }
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Error cargando datos iniciales');
      } finally {
        if (mounted) setLoadingData(false);
      }
    })();

    return () => { mounted = false; };
  }, [isOpen]);

  const tipoSeleccionado = useMemo(
    () => tipos.find(t => t.NOMBRE_TIPO === tipo) || null,
    [tipo, tipos]
  );

  const esMultiUsuario = useMemo(
    () => !!tipoSeleccionado?.MULTI_USUARIO || ALLOWED_MAIL_TYPES.includes(tipo),
    [tipoSeleccionado, tipo]
  );

  useEffect(() => {
    if (tipoSeleccionado?.ID_CUENTA) {
      const id = String(tipoSeleccionado.ID_CUENTA);
      const existe = cuentas.some(c => String(c.ID_CUENTA) === id);
      setCuenta(existe ? id : '');
    } else {
      setCuenta('');
    }
  }, [tipoSeleccionado, cuentas]);

  const remitente = useMemo(() => {
    const c = cuentas.find(cu => String(cu.ID_CUENTA) === cuenta);
    return c ? c.SMTP_USER : '';
  }, [cuenta, cuentas]);

  return {
    tipo, setTipo,
    cuenta, setCuenta,
    tipos, cuentas,
    loadingData, error,
    tipoSeleccionado,
    esMultiUsuario,
    remitente,
  };
}
