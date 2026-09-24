/**
 * Visibilidad por rol activo. Roles vienen de user.roles como
 * strings o { nombre, nivel }; activeRole ya es el nombre.
 */
export const getRoleName = (user, activeRole) => {
  if (activeRole) return activeRole;
  const first = user?.roles?.[0];
  return (typeof first === 'string' ? first : first?.nombre) || null;
};

/**
 * Flags de navegación según el rol activo:
 * - auxiliar* → solo asistencias viejo, sin configuración
 * - docente   → solo asistencias nuevo, sin configuración
 * - postulante → ninguno, sin configuración
 * - resto      → ambos + configuración
 */
export const getRoleFlags = (user, activeRole) => {
  const role = getRoleName(user, activeRole);
  const esAuxiliar = typeof role === 'string' && role.startsWith('auxiliar');
  const esDocente = role === 'docente';
  const esPostulante = role === 'postulante';
  const esAdmin = role === 'admin';

  return {
    role,
    esAuxiliar,
    esDocente,
    esPostulante,
    esAdmin,
    puedeVerConfiguracion: !(esAuxiliar || esDocente || esPostulante),
    puedeVerAsistenciasViejo: !esDocente && !esPostulante,
    puedeVerAsistenciasNuevo: !esAuxiliar && !esPostulante,
  };
};
