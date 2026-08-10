import React, { useMemo } from 'react';

const BooleanBadge = ({ value }) => {
  if (value === null || value === undefined) return '—';
  return value ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">Sí</span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">No</span>
  );
};

const Field = ({ label, value, isBoolean }) => (
  <div className="group">
    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
      {label}
    </dt>
    <dd className="text-base font-medium text-slate-800 break-words">
      {isBoolean ? <BooleanBadge value={value} /> : (value || '—')}
    </dd>
  </div>
);

const PerfilView = ({ user, activeRole }) => {
  if (!user) return null;

  const firstName = (user.NOMBRES || user.nombres || '').toString().trim();
  const lastName = (user.APELLIDOS || user.apellidos || '').toString().trim();
  const fullName = `${firstName} ${lastName}`.trim() || 'Usuario';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const roles = user.ROLES_NOMBRES || user.roles || [];
  const displayActiveRole = activeRole || (roles?.[0]);

  const formatDate = (value) => {
    if (!value) return null;
    try {
      return new Date(value).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return value;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="bg-[#2D366F] p-6 sm:p-8 text-white flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center text-3xl font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight truncate">{fullName}</h1>
          {displayActiveRole && (
            <span className="inline-flex mt-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider border border-white/10">
              {displayActiveRole}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-8 space-y-8">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Identidad</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <Field label="DNI" value={user.DNI || user.dni} />
            <Field label="Nombres" value={firstName} />
            <Field label="Apellidos" value={lastName} />
          </dl>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Nacimiento y género</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Field label="Fecha de nacimiento" value={formatDate(user.FECHA_NACIMIENTO)} />
            <Field label="Edad" value={user.EDAD !== null && user.EDAD !== undefined ? `${user.EDAD} años` : null} />
            <Field label="Mayoría de edad" value={user.MAYOR_DE_EDAD} isBoolean />
            <Field label="Sexo" value={user.SEXO} />
          </dl>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Contacto</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <Field label="Teléfono" value={user.TELEFONO} />
            <Field label="Email" value={user.EMAIL || user.email} />
            <Field label="Dirección" value={user.DIRECCION} />
          </dl>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Cuenta</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <Field label="Activo" value={user.ACTIVO} isBoolean />
            <Field label="Requiere cambio de contraseña" value={user.REQUIERE_CAMBIO_PASSWORD} isBoolean />
          </dl>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Roles asignados</h2>
          {roles.length === 0 ? (
            <p className="text-sm text-slate-500">No hay roles asignados.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => {
                const name = r.nombre || r;
                const isActive = name === displayActiveRole;
                return (
                  <span
                    key={name}
                    className={`
                      inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
                      ${isActive ? 'bg-[#2D366F] text-white border-[#2D366F]' : 'bg-slate-100 text-slate-600 border-slate-200'}
                    `}
                  >
                    {isActive && (
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {name}
                  </span>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PerfilView;
