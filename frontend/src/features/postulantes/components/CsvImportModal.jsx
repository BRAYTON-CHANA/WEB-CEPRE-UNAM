import React, { useState, useRef } from 'react';
import { useCsvPreview } from '../hooks/useCsvImport';

export default function CsvImportModal({ isOpen, onClose, onSuccess, idPeriodo }) {
  const [step, setStep] = useState('upload');
  const [previewData, setPreviewData] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef(null);

  const { preview, importRows, importing, progress, result } = useCsvPreview(idPeriodo);

  if (!isOpen) return null;

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setParseError(null);
    setPreviewLoading(true);
    const text = await file.text();

    try {
      const data = await preview(text);
      setPreviewData(data);
      setStep('preview');
    } catch (err) {
      console.error('[CSV ERROR]', err);
      setParseError({
        message: err.message,
        headersFound: err.headersFound,
        headersRequired: err.headersRequired,
        rawFirstLine: err.rawFirstLine
      });
    } finally {
      setPreviewLoading(false);
    }
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!previewData || previewData.errors.length > 0) return;

    const success = await importRows(previewData.rows);
    if (success) {
      onSuccess?.();
      onClose();
    }
  };

  const getRowStatus = (row) => {
    if (row.error) return { color: 'bg-red-50', icon: '✗', text: 'text-red-600' };
    if (row.isNewUsuario) return { color: 'bg-yellow-50', icon: '⚠', text: 'text-yellow-600' };
    if (row.isDuplicado) return { color: 'bg-orange-50', icon: '⏭', text: 'text-orange-600' };
    return { color: 'bg-green-50', icon: '✓', text: 'text-green-600' };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              {step === 'upload' && 'Importar Postulantes desde CSV'}
              {step === 'preview' && 'Vista Previa - Verificar Datos'}
            </h2>
            {idPeriodo && (
              <p className="text-xs text-gray-500 mt-1">
                Período seleccionado: <span className="font-medium">{idPeriodo}</span> (los postulantes se importarán en este período)
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">

          {/* Error Display */}
          {parseError && (
            <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-700 mb-2">Error al parsear CSV</h3>
              <p className="text-red-600 text-sm mb-2">{parseError.message}</p>
              {parseError.headersFound && (
                <div className="mt-2 text-xs">
                  <p><strong>Headers encontrados:</strong> {parseError.headersFound.join(', ')}</p>
                  <p><strong>Headers esperados:</strong> {parseError.headersRequired?.join(', ')}</p>
                  <p className="mt-1 text-gray-500">Primera línea: {parseError.rawFirstLine}</p>
                </div>
              )}
            </div>
          )}

          {/* Step Upload */}
          {step === 'upload' && (
            <div className="p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {previewLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <svg className="animate-spin h-10 w-10 text-green-600 mb-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <p className="text-gray-600 font-medium">Procesando CSV...</p>
                  {progress.total > 0 && (
                    <p className="text-gray-400 text-sm mt-1">{progress.current} / {progress.total} filas</p>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-400 cursor-pointer"
                     onClick={() => fileInputRef.current?.click()}>
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <p className="mt-4 text-gray-600">Click para seleccionar archivo CSV</p>
                  <p className="mt-2 text-sm text-gray-400">Columnas requeridas: DNI, APELLIDOS, NOMBRES</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Columnas opcionales: SEXO, FECHA NACIMIENTO, TELEFONO, CORREO, DIRECCION, CARRERA,
                    DEPARTAMENTO, PROVINCIA, DISTRITO, TURNO, GRADO, AÑO EGRESO, COLEGIO, TIPO COLEGIO,
                    UBIGEO NAC., VALIDADO POR, NOMBRES Y APELLIDOS DEL PADRE O APODERADO, DIRECCION DEL PADRE O APODERADO,
                    TELEFONO, TIENE ALGUN HERMANO, DNI DEL HERMANO, INICIATIVA POSTULACION, RAZON ELECCION CEPRE,
                    MEDIO ENTERO CEPRE, RED SOCIAL FRECUENTE, DISCAPACIDAD, TIPO DISCAPACIDAD,
                    SEDE DE VACANTE, SEDE DE EXAMEN, ALUMNO LIBRE, COD_EDICION, FECHA INSCRIPCION
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step Preview */}
          {step === 'preview' && previewData && (
            <div className="flex flex-col h-full">

              {/* Stats */}
              <div className="flex gap-4 p-4 bg-gray-50 border-b flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-sm">Usuarios existentes: {previewData.stats.ready}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="text-sm">Usuarios nuevos: {previewData.stats.new}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  <span className="text-sm">Duplicados (ya postulantes): {previewData.stats.duplicados}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-sm">Errores: {previewData.stats.errors}</span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-y-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left w-8">Est</th>
                      <th className="px-2 py-2 text-left">DNI</th>
                      <th className="px-2 py-2 text-left">Apellidos</th>
                      <th className="px-2 py-2 text-left">Nombres</th>
                      <th className="px-2 py-2 text-left">Carrera</th>
                      <th className="px-2 py-2 text-left">Sede Vacante</th>
                      <th className="px-2 py-2 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row, idx) => {
                      const status = getRowStatus(row);
                      return (
                        <tr key={idx} className={`${status.color} border-b`}>
                          <td className={`px-2 py-2 ${status.text} font-bold`}>{status.icon}</td>
                          <td className="px-2 py-2">{row.DNI}</td>
                          <td className="px-2 py-2">{row.APELLIDOS}</td>
                          <td className="px-2 py-2">{row.NOMBRES}</td>
                          <td className="px-2 py-2">{row.CARRERA || '-'}</td>
                          <td className="px-2 py-2">{row['SEDE DE VACANTE'] || '-'}</td>
                          <td className="px-2 py-2 text-xs max-w-xs">
                            {row.error ? (
                              <span className="text-red-600" title={row.error}>{row.error}</span>
                            ) : row.isDuplicado ? (
                              <span className="text-orange-600">Ya postulante en este período</span>
                            ) : row.isNewUsuario ? (
                              <span className="text-yellow-600">Usuario nuevo → crear</span>
                            ) : (
                              <span className="text-green-600">Usuario existente → upsert</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          {step === 'upload' ? (
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancelar
            </button>
          ) : (
            <button onClick={() => setStep('upload')} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              ← Volver
            </button>
          )}

          {step === 'preview' && (
            <div className="flex gap-3">
              {previewData?.errors.length > 0 && (
                <span className="text-red-600 text-sm self-center">
                  Corrige {previewData.errors.length} errores antes de importar
                </span>
              )}
              {result?.success === false && (
                <span className="text-red-600 text-sm self-center">
                  Error: {result.error}
                </span>
              )}
              <div className="flex flex-col items-end gap-2">
                {importing && (
                  <div className="w-64">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{progress.label || `Fila ${progress.current} de ${progress.total}`}</span>
                      <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleImport}
                  disabled={importing || previewData?.errors.length > 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Importando...
                    </>
                  ) : (
                    <>Importar {previewData?.stats.ready + previewData?.stats.new} postulantes</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
