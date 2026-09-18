import React, { useState, useRef, useMemo } from 'react';
import { useCsvPreview } from '../hooks/useCsvImport';

const INTERNAL_KEYS = new Set([
  'isNewUsuario', 'isDuplicado', 'idUsuario', 'idSede', 'idSedeExamen',
  'idCarrera', 'idGrupo', 'error', 'warning', 'fieldErrors', 'fieldWarnings'
]);

const HEADER_LABELS = {
  DNI: 'DNI',
  APELLIDOS: 'Apellidos',
  NOMBRES: 'Nombres',
  SEXO: 'Sexo',
  FECHA_NACIMIENTO: 'Fecha Nac.',
  TELEFONO: 'Teléfono',
  EMAIL: 'Correo',
  DIRECCION: 'Dirección',
  DEPARTAMENTO: 'Dep.',
  PROVINCIA: 'Prov.',
  DISTRITO: 'Dist.',
  CODIGO_UBIGEO_NACIMIENTO: 'Ubigeo Nac.',
  DISCAPACIDAD: 'Discap.',
  TIPO_DISCAPACIDAD: 'Tipo Discap.',
  FECHA_INSCRIPCION: 'Fecha Insc.',
  CARRERA: 'Carrera',
  GRUPO: 'Grupo',
  TURNO: 'Turno',
  GRADO: 'Grado',
  ANIO_EGRESO: 'Año Egreso',
  COLEGIO: 'Colegio',
  TIPO_COLEGIO: 'Tipo Colegio',
  VALIDADO_POR: 'Validado por',
  NOMBRE_APODERADO: 'Apoderado',
  DIRECCION_APODERADO: 'Dir. Apoderado',
  TELEFONO_APODERADO: 'Telf. Apoderado',
  TIENE_HERMANO: 'Tiene Hermano',
  DNI_HERMANO: 'DNI Hermano',
  INICIATIVA_POSTULACION: 'Iniciativa',
  RAZON_ELECCION_CEPRE: 'Razón CEPRE',
  MEDIO_ENTERO_CEPRE: 'Medio Entero',
  RED_SOCIAL_FRECUENTE: 'Red Social',
  SEDE_VACANTE: 'Sede Vacante',
  SEDE_EXAMEN: 'Sede Examen',
  ALUMNO_LIBRE: 'Alumno Libre',
  CODIGO_EDICION: 'Cod. Edición',
  'CODIGO EDICION': 'Cod. Edición'
};

function getColumnLabel(key) {
  return HEADER_LABELS[key] || key.replace(/_/g, ' ');
}

export default function CsvImportModal({ isOpen, onClose, onSuccess, idPeriodo }) {
  const [step, setStep] = useState('upload');
  const [previewData, setPreviewData] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [filter, setFilter] = useState('todos');
  const [expandedRow, setExpandedRow] = useState(null);
  const fileInputRef = useRef(null);

  const { preview, importRows, importing, progress, result, batchSize, setBatchSize } = useCsvPreview(idPeriodo);

  const columnKeys = useMemo(() => {
    if (!previewData?.rows?.length) return [];
    return Object.keys(previewData.rows[0]).filter(k => !INTERNAL_KEYS.has(k));
  }, [previewData]);

  const filteredRows = useMemo(() => {
    if (!previewData?.rows) return [];
    if (filter === 'todos') return previewData.rows;
    if (filter === 'errores') return previewData.rows.filter(r => r.error);
    if (filter === 'duplicados') return previewData.rows.filter(r => r.isDuplicado && !r.error);
    if (filter === 'nuevos') return previewData.rows.filter(r => r.isNewUsuario && !r.error);
    if (filter === 'ok') return previewData.rows.filter(r => !r.error && !r.isDuplicado);
    return previewData.rows;
  }, [previewData, filter]);

  const importableCount = useMemo(() => {
    if (!previewData?.rows) return 0;
    // Los duplicados también se importan: el upsert los actualiza (COALESCE)
    return previewData.rows.filter(r => !r.error).length;
  }, [previewData]);

  if (!isOpen) return null;

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setParseError(null);
    setPreviewLoading(true);
    setFilter('todos');
    setExpandedRow(null);
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
      await onSuccess?.();
      onClose();
    }
  };

  const getRowCategory = (row) => {
    if (row.error) return 'errores';
    if (row.isDuplicado) return 'duplicados';
    if (row.isNewUsuario) return 'nuevos';
    return 'ok';
  };

  const getRowStatus = (row) => {
    if (row.error) return { color: 'bg-red-50', icon: '✗', text: 'text-red-600', label: 'Error' };
    if (row.isDuplicado) return { color: 'bg-orange-50', icon: '↻', text: 'text-orange-600', label: 'Actualizará' };
    if (row.isNewUsuario) return { color: 'bg-yellow-50', icon: '⚠', text: 'text-yellow-600', label: 'Nuevo usuario' };
    return { color: 'bg-green-50', icon: '✓', text: 'text-green-600', label: 'Correcto' };
  };

  const getFieldError = (row, field) => {
    return row.fieldErrors?.find(f => f.field === field);
  };

  const filterButtons = [
    { key: 'todos', label: `Todos (${previewData?.stats?.total || 0})`, color: 'bg-gray-100 text-gray-700' },
    { key: 'ok', label: `Correctos (${previewData?.stats?.ready + previewData?.stats?.new || 0})`, color: 'bg-green-100 text-green-700' },
    { key: 'nuevos', label: `Nuevos (${previewData?.stats?.new || 0})`, color: 'bg-yellow-100 text-yellow-700' },
    { key: 'duplicados', label: `Duplicados (${previewData?.stats?.duplicados || 0})`, color: 'bg-orange-100 text-orange-700' },
    { key: 'errores', label: `Errores (${previewData?.stats?.errors || 0})`, color: 'bg-red-100 text-red-700' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[95%] h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">
              {step === 'upload' && 'Importar Postulantes desde CSV'}
              {step === 'preview' && 'Vista Previa - Verificar Datos'}
            </h2>
            {idPeriodo && (
              <p className="text-xs text-gray-500 mt-1">
                Período seleccionado: <span className="font-medium">{idPeriodo}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">

          {/* Parse Error */}
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

          {/* Upload Step */}
          {step === 'upload' && (
            <div className="p-8 text-center h-full flex items-center justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {previewLoading ? (
                <div className="flex flex-col items-center justify-center">
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
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-400 cursor-pointer w-full max-w-3xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <p className="mt-4 text-gray-600">Click para seleccionar archivo CSV</p>
                  <p className="mt-2 text-sm text-gray-400">Columnas requeridas: DNI, APELLIDOS, NOMBRES</p>
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && previewData && (
            <div className="flex flex-col h-full min-h-0">

              {/* Stats & Filters */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border-b shrink-0">
                {filterButtons.map(btn => (
                  <button
                    key={btn.key}
                    onClick={() => setFilter(btn.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      filter === btn.key
                        ? 'ring-2 ring-offset-1 ring-blue-500 ' + btn.color
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
                <span className="text-xs text-gray-500 ml-auto">
                  Mostrando {filteredRows.length} de {previewData.stats.total} filas
                  {previewData.stats.conAdvertencias > 0 && (
                    <span className="text-orange-500"> · {previewData.stats.conAdvertencias} con advertencias</span>
                  )}
                </span>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto min-h-0">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2 text-left w-8 border-b sticky left-0 bg-gray-100 z-20">Est</th>
                      {columnKeys.map(key => (
                        <th
                          key={key}
                          className={`px-2 py-2 text-left border-b whitespace-nowrap min-w-[80px] ${
                            key === 'DNI' ? 'sticky left-8 bg-gray-100 z-20' : ''
                          }`}
                        >
                          {getColumnLabel(key)}
                        </th>
                      ))}
                      <th className="px-2 py-2 text-left border-b w-48">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => {
                      const status = getRowStatus(row);
                      const isExpanded = expandedRow === idx;
                      return (
                        <React.Fragment key={idx}>
                          <tr
                            className={`${status.color} border-b hover:bg-gray-50 cursor-pointer`}
                            onClick={() => setExpandedRow(isExpanded ? null : idx)}
                          >
                            <td className={`px-2 py-2 sticky left-0 ${status.color} ${status.text} font-bold text-center`} title={status.label}>
                              {status.icon}
                            </td>
                            {columnKeys.map(key => {
                              const fieldErr = getFieldError(row, key);
                              const value = row[key];
                              const display = value !== undefined && value !== null && value !== '' ? String(value) : '-';
                              return (
                                <td
                                  key={key}
                                  className={`px-2 py-2 border-b whitespace-nowrap max-w-[200px] truncate ${
                                    fieldErr ? 'bg-red-100 text-red-700 border-red-300' : ''
                                  }`}
                                  title={fieldErr ? `${display}\n${fieldErr.message}` : display}
                                >
                                  {display}
                                  {fieldErr && <span className="ml-1 text-red-600 font-bold" title={fieldErr.message}>!</span>}
                                </td>
                              );
                            })}
                            <td className="px-2 py-2 border-b max-w-xs">
                              {row.error ? (
                                <span className="text-red-600" title={row.error}>
                                  {row.error.length > 60 ? row.error.slice(0, 60) + '…' : row.error}
                                </span>
                              ) : row.isDuplicado ? (
                                <span className="text-orange-600">Postulante existente — se actualizará con los datos del CSV</span>
                              ) : row.isNewUsuario ? (
                                <span className="text-yellow-600">Usuario nuevo → crear</span>
                              ) : (
                                <span className="text-green-600">Listo para importar</span>
                              )}
                              {row.warning && (
                                <span className="block text-orange-500 mt-0.5" title={row.warning}>
                                  ⚠ {row.warning.length > 60 ? row.warning.slice(0, 60) + '…' : row.warning}
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* Expanded detail of errors and all values */}
                          {isExpanded && (
                            <tr className="bg-gray-50 border-b">
                              <td className="px-2 py-2" colSpan={columnKeys.length + 2}>
                                <div className="p-3 rounded border border-gray-200 bg-white shadow-sm">
                                  <h4 className="font-semibold text-sm mb-2">
                                    Fila {idx + 1} — {status.label}
                                  </h4>

                                  {row.fieldErrors?.length > 0 && (
                                    <div className="mb-3">
                                      <p className="text-sm font-medium text-red-700 mb-1">Errores detectados:</p>
                                      <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                                        {row.fieldErrors.map((fe, i) => (
                                          <li key={i}>
                                            <strong>{getColumnLabel(fe.field)}:</strong> {fe.message} — <em>valor subido:</em>{' '}
                                            <code className="bg-red-50 px-1 rounded">
                                              {row[fe.field] !== undefined && row[fe.field] !== '' ? String(row[fe.field]) : '(vacío)'}
                                            </code>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {row.fieldWarnings?.length > 0 && (
                                    <div className="mb-3">
                                      <p className="text-sm font-medium text-orange-700 mb-1">Advertencias:</p>
                                      <ul className="list-disc list-inside text-sm text-orange-600 space-y-1">
                                        {row.fieldWarnings.map((fw, i) => (
                                          <li key={i}>
                                            <strong>{getColumnLabel(fw.field)}:</strong> {fw.message} — <em>valor subido:</em>{' '}
                                            <code className="bg-orange-50 px-1 rounded">
                                              {row[fw.field] !== undefined && row[fw.field] !== '' ? String(row[fw.field]) : '(vacío)'}
                                            </code>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs text-gray-700">
                                    {columnKeys.map(key => (
                                      <div key={key} className="border rounded p-1.5 bg-gray-50">
                                        <span className="block text-gray-500 text-[10px] uppercase">{getColumnLabel(key)}</span>
                                        <span className="block truncate" title={row[key] != null ? String(row[key]) : ''}>
                                          {row[key] !== undefined && row[key] !== '' ? String(row[key]) : '-'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {filteredRows.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    No hay filas para este filtro.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50 shrink-0">
          {step === 'upload' ? (
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancelar
            </button>
          ) : (
            <button onClick={() => { setStep('upload'); setFilter('todos'); setExpandedRow(null); }} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              ← Volver
            </button>
          )}

          {step === 'preview' && (
            <div className="flex gap-3 items-center">
              {previewData?.errors.length > 0 && (
                <span className="text-red-600 text-sm">
                  Corrige {previewData.errors.length} errores antes de importar
                </span>
              )}
              {result?.success === false && (
                <span className="text-red-600 text-sm">
                  Error: {result.error}
                </span>
              )}
              <div className="flex flex-col items-end gap-2">
                {!importing && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <label htmlFor="batchSize">Tamaño de bloque:</label>
                    <input
                      id="batchSize"
                      type="number"
                      min={10}
                      max={1000}
                      step={10}
                      value={batchSize}
                      onChange={(e) => setBatchSize(Number(e.target.value))}
                      className="w-20 px-2 py-1 border rounded text-right"
                      disabled={importing}
                    />
                    <span className="text-gray-500">filas / llamada</span>
                  </div>
                )}
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
                    <>Importar {importableCount} postulantes</>
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
