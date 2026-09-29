// Ventana de tolerancia para tomar asistencia: la tarjeta de sesión solo se
// puede abrir dentro de [HORA_INICIO - ANTES, HORA_INICIO + DESPUÉS].
// La restricción es solo de apertura — el modal ya abierto queda editable.
export const MINUTOS_APERTURA_ANTES = 15;
export const MINUTOS_CIERRE_DESPUES = 10;

export function ventanaSesion(sesion) {
  if (!sesion?.FECHA || !sesion?.HORA_INICIO) return null;
  const inicio = new Date(`${sesion.FECHA}T${sesion.HORA_INICIO}`);
  if (isNaN(inicio)) return null;
  return {
    desde: new Date(inicio.getTime() - MINUTOS_APERTURA_ANTES * 60 * 1000),
    hasta: new Date(inicio.getTime() + MINUTOS_CIERRE_DESPUES * 60 * 1000),
  };
}

// Sin ventana calculable (falta fecha/hora) → no restringir
export function sesionHabilitada(sesion, ahora = new Date()) {
  const v = ventanaSesion(sesion);
  if (!v) return true;
  return ahora >= v.desde && ahora <= v.hasta;
}
