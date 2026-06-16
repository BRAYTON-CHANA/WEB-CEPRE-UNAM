import React from 'react';

const DEFAULT_OPTIONS = {
  showCodigo: true,
  showDocente: true,
  showHorario: true,
  showNombreDocente: true,
};

export { DEFAULT_OPTIONS };

export default function ExportOptionsModal({ isOpen, onConfirm, onCancel, title = 'Opciones de exportación', mode = 'general' }) {
  const [options, setOptions] = React.useState(DEFAULT_OPTIONS);

  if (!isOpen) return null;

  const toggle = (key) => setOptions(prev => ({ ...prev, [key]: !prev[key] }));

  const checks = [
    { key: 'showCodigo',  label: 'Código de área',      desc: 'Ej: MAT, FIS, QUI' },
    { key: 'showDocente', label: 'Plaza docente',         desc: 'Plaza descriptiva del docente' },
    { key: 'showHorario', label: 'Rango horario',        desc: 'Ej: 07:00 - 07:50' },
    ...(mode === 'plazas' || mode === 'docentes' ? [{ key: 'showNombreDocente', label: 'Nombre docente', desc: 'Mostrar nombre completo del docente en celdas' }] : []),
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">
          El <span className="font-medium text-gray-700">nombre del curso</span> siempre se mostrará.
          Seleccione los campos adicionales:
        </p>

        <div className="space-y-3 mb-6">
          {checks.map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => toggle(key)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{label}</span>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(options)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}
