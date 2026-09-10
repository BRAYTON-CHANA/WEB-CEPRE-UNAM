import React, { useEffect, useMemo, useState } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import Icon from '@/shared/components/ui/icons/Icon';
import PerfilView from '@/features/usuarios/components/PerfilView';
import { db } from '@/shared/api';

const parseDestinatarios = (value) => {
  if (!value) return [];
  let parsed;
  if (Array.isArray(value)) {
    parsed = value;
  } else {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set();
  return parsed.filter((dest) => {
    const key = dest?.ID_USUARIO || dest?.EMAIL || JSON.stringify(dest);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getInitials = (name, email) => {
  const source = (name || email || '').toString().trim();
  const parts = source.split(/\s+/);
  const first = parts[0]?.charAt(0) || '';
  const second = parts[1]?.charAt(0) || '';
  return `${first}${second}`.toUpperCase() || '?';
};

/**
 * Modal para ver los destinatarios vinculados a un correo.
 * Distingue entre usuarios del sistema y emails externos/libres,
 * y permite abrir el perfil actual si el usuario aún existe.
 */
const RecipientsModal = ({ email, onClose }) => {
  const destinatarios = useMemo(() => parseDestinatarios(email?.DESTINATARIOS_USUARIOS), [email?.DESTINATARIOS_USUARIOS]);
  const [currentUsers, setCurrentUsers] = useState([]);
  const [loadingCurrent, setLoadingCurrent] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const userIds = useMemo(() => destinatarios.map((d) => d.ID_USUARIO).filter(Boolean), [destinatarios]);
  const userIdsKey = userIds.join(',');

  useEffect(() => {
    if (userIds.length === 0) {
      setCurrentUsers([]);
      return;
    }
    let cancelled = false;
    setLoadingCurrent(true);
    db.select('VW_USUARIOS', [{ field: 'ID_USUARIO', op: 'in', value: userIds }])
      .then((data) => {
        if (!cancelled) setCurrentUsers(data || []);
      })
      .catch((err) => {
        console.error('[RecipientsModal] Error cargando usuarios actuales:', err);
        if (!cancelled) setCurrentUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCurrent(false);
      });
    return () => { cancelled = true; };
  }, [userIdsKey]);

  const stats = useMemo(() => {
    const total = destinatarios.length;
    const users = destinatarios.filter((d) => d.ID_USUARIO || d.NOMBRE_COMPLETO || d.DNI).length;
    const external = total - users;
    const active = currentUsers.length;
    const unlinked = users - active;
    return { total, users, external, active, unlinked };
  }, [destinatarios, currentUsers]);

  const handleViewProfile = async (dest) => {
    if (!dest.ID_USUARIO) return;
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileError(null);
    setProfileUser(null);
    try {
      const user = await db.getById('VW_USUARIOS', dest.ID_USUARIO, 'ID_USUARIO');
      if (user) {
        setProfileUser(user);
      } else {
        setProfileError('Este usuario ya no existe en el sistema. Se muestra el snapshot capturado al enviar.');
        setProfileUser(dest);
      }
    } catch (err) {
      setProfileError('No se pudo cargar el perfil actual. Se muestra el snapshot capturado al enviar.');
      setProfileUser(dest);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCloseProfile = () => {
    setProfileOpen(false);
    setProfileUser(null);
    setProfileError(null);
  };

  if (!email) return null;

  return (
    <>
      <Modal
        isOpen={!!email}
        onClose={onClose}
        title={`Destinatarios: ${email.ASUNTO || 'Correo'}`}
        size="large"
        closeOnOutsideClick
      >
        <div className="space-y-4">
          {/* Resumen simple */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Total: {stats.total} · Usuarios: {stats.users} · Externos: {stats.external}
              {stats.active > 0 && ` · ${stats.active} activo${stats.active !== 1 ? 's' : ''}`}
              {stats.unlinked > 0 && ` · ${stats.unlinked} sin vincular${stats.unlinked !== 1 ? 's' : ''}`}
            </span>
            {loadingCurrent && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                Verificando...
              </span>
            )}
          </div>

          {destinatarios.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No hay destinatarios registrados para este correo.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Destinatario</th>
                    <th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wider">DNI</th>
                    <th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-2.5 text-right font-medium text-xs uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {destinatarios.map((dest, idx) => {
                    const isVinculado = !!dest.ID_USUARIO;
                    const isSnapshotUser = !isVinculado && (!!dest.NOMBRE_COMPLETO || !!dest.DNI);
                    const isExternal = !isVinculado && !isSnapshotUser;
                    const current = isVinculado ? currentUsers.find((u) => u.ID_USUARIO === dest.ID_USUARIO) : null;
                    const exists = isVinculado && !!current;
                    const initials = getInitials(dest.NOMBRE_COMPLETO, dest.EMAIL);

                    return (
                      <tr key={dest.ID_USUARIO || dest.EMAIL || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {dest.NOMBRE_COMPLETO || dest.EMAIL || 'Sin nombre'}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{dest.EMAIL || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-slate-700 font-mono text-xs">{dest.DNI || '-'}</td>
                        <td className="px-4 py-3 align-middle text-slate-600 text-xs">
                          {isExternal ? 'Email externo / libre' : 'Usuario del sistema'}
                        </td>
                        <td className="px-4 py-3 align-middle text-xs">
                          {isExternal ? (
                            <span className="text-slate-400">—</span>
                          ) : exists ? (
                            <span className="text-emerald-600">Activo</span>
                          ) : (
                            <span className="text-slate-500">Sin usuario vinculado</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle text-right">
                          {exists && (
                            <button
                              type="button"
                              onClick={() => handleViewProfile(dest)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              <Icon name="user" className="w-3.5 h-3.5" />
                              Ver perfil
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[11px] text-slate-400 text-center">
            Los datos son el snapshot capturado al momento del envío. El email puede haber cambiado después.
          </p>
        </div>
      </Modal>

      {/* Modal de perfil anidado */}
      <Modal
        isOpen={profileOpen}
        onClose={handleCloseProfile}
        title="Perfil de usuario"
        size="xl"
        closeOnOutsideClick
        bodyClassName="p-0"
      >
        {profileLoading ? (
          <div className="p-10 text-center">
            <span className="inline-block w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-2" />
            <p className="text-sm text-slate-500">Cargando perfil...</p>
          </div>
        ) : (
          <div>
            {profileError && (
              <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-xs">
                {profileError}
              </div>
            )}
            {profileUser && (
              <div className="max-w-4xl mx-auto p-4">
                <PerfilView user={profileUser} activeRole={profileUser.ROLES?.[0]?.nombre} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default RecipientsModal;
