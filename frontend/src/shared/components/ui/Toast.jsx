import React, { useEffect, useState } from 'react';

/**
 * Toast - notificación lateral fija con cierre automático y manual.
 *
 * @param {string} title       - Título del mensaje
 * @param {string} description - Subtítulo / descripción
 * @param {string} type        - 'success' | 'error'
 * @param {function} onClose   - Callback al cerrar
 * @param {number} duration    - Tiempo en ms para cierre automático (default 3000)
 * @param {string} position    - 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
 * @param {string} size        - 'sm' | 'md' | 'lg'
 * @param {string} className   - Clases adicionales
 * @param {boolean} showProgress - Mostrar barra de progreso
 * @param {string}   fontFamily   - Familia tipográfica
 * @param {string}   backgroundColor - Color o degradado de fondo
 */
const positionClasses = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4'
};

const sizeClasses = {
  sm: 'w-56',
  md: 'w-80',
  lg: 'w-96'
};

const titleClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

const descClasses = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm'
};

const Toast = ({
  title,
  description,
  type = 'success',
  onClose,
  duration = 3000,
  position = 'top-right',
  size = 'md',
  className = '',
  showProgress = true,
  fontFamily,
  backgroundColor
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const closeTimer = setTimeout(onClose, duration);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const next = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(next);
      if (next === 0) clearInterval(interval);
    }, 50);
    return () => {
      clearTimeout(closeTimer);
      clearInterval(interval);
    };
  }, [onClose, duration]);

  const isSuccess = type === 'success';

  return (
    <div
      className={`fixed z-50 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 ${positionClasses[position]} ${sizeClasses[size]} ${className}`}
      role="alert"
    >
      <div className={`relative flex items-start gap-3 p-5 text-white ${
        isSuccess
          ? (backgroundColor ? 'border-l-4 border-emerald-400' : 'bg-gradient-to-br from-emerald-900 to-slate-900 border-l-4 border-emerald-400')
          : (backgroundColor ? 'border-l-4 border-rose-400' : 'bg-gradient-to-br from-rose-900 to-slate-900 border-l-4 border-rose-400')
      }`} style={{ fontFamily, ...(backgroundColor ? { background: backgroundColor } : {}) }}>
        <span className="flex-shrink-0 mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
          {isSuccess ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </span>
        <div className="flex-1 min-w-0">
          {title && <p className={`font-semibold leading-tight ${titleClasses[size]}`}>{title}</p>}
          {description && <p className={`mt-1 text-white/80 leading-tight ${descClasses[size]}`}>{description}</p>}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
          aria-label="Cerrar notificación"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {showProgress && (
        <div className="h-1 w-full bg-white/20">
          <div
            className="h-full bg-white/70"
            style={{ width: `${progress}%`, transition: 'width 0.05s linear' }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
