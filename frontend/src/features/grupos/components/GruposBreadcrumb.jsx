import React from 'react';

/**
 * GruposBreadcrumb — navegación entre los 2 tabs.
 * Grupos › Cursos por Grupo
 */
function GruposBreadcrumb({ view, onNavigate }) {
  const steps = [
    { key: 'grupos', label: 'Grupos', enabled: true },
    { key: 'cursos', label: 'Cursos por Grupo', enabled: true },
    { key: 'programacion', label: 'Programación', enabled: true }
  ];

  const activeIndex = steps.findIndex(s => s.key === view);

  return (
    <nav className="flex items-center gap-1 text-sm">
      {steps.map((step, idx) => {
        const isActive = idx === activeIndex;
        const isClickable = step.enabled && !isActive;

        return (
          <React.Fragment key={step.key}>
            {idx > 0 && (
              <span className={`mx-1 text-lg leading-none ${step.enabled ? 'text-gray-300' : 'text-gray-200'}`}>
                ›
              </span>
            )}
            <button
              onClick={isClickable ? () => onNavigate(step.key) : undefined}
              disabled={!isClickable}
              className={[
                'px-3 py-1.5 rounded-md font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#25346A] text-white shadow-sm'
                  : isClickable
                    ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    : 'text-gray-300 cursor-not-allowed'
              ].join(' ')}
            >
              {step.label}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default GruposBreadcrumb;
