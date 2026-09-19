// Ventana de tolerancia para tomar asistencia: la tarjeta de sesión solo se
// puede abrir dentro de [HORA_INICIO - tolerancia, HORA_INICIO + tolerancia].
// La restricción es solo de apertura — el modal ya abierto queda editable.
export const TOLERANCIA_MINUTOS = 240;

export function ventanaSesion(sesion) {
  if (!sesion?.FECHA || !sesion?.HORA_INICIO) return null;
  const inicio = new Date(`${sesion.FECHA}T${sesion.HORA_INICIO}`);
  if (isNaN(inicio)) return null;
  const ms = TOLERANCIA_MINUTOS * 60 * 1000;
  return {
    desde: new Date(inicio.getTime() - ms),
    hasta: new Date(inicio.getTime() + ms),
  };
}

// Sin ventana calculable (falta fecha/hora) → no restringir
export function sesionHabilitada(sesion, ahora = new Date()) {
  const v = ventanaSesion(sesion);
  if (!v) return true;
  return ahora >= v.desde && ahora <= v.hasta;
}
