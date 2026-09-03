import React from 'react';

export function ConflictErrorDisplay({ error }) {
  if (!error) return null;

  // ============================================
  // NUEVO: Detectar si es objeto estructurado (formato pipe-separated parseado)
  // ============================================
  const isStructuredError = typeof error === 'object' && error !== null && error.tipo;
  
  if (isStructuredError) {
    // Renderizar tabla estructurada para nuevo formato
    const isDocente = error.tipo === 'SOLAPAMIENTO_DOCENTE';
    const isPlaza = error.tipo === 'SOLAPAMIENTO_PLAZA';
    
    return (
      <div className="max-h-[70vh] overflow-y-auto">
        {/* Header con badge de tipo */}
        <div className="p-5 border-b border-red-200 bg-red-100/30">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1.5 text-sm font-bold text-white rounded-lg shadow-sm ${
              isDocente ? 'bg-red-600' : 'bg-orange-500'
            }`}>
              {isDocente ? '👤 SOLAPAMIENTO DE DOCENTE' : '🏫 SOLAPAMIENTO DE PLAZA'}
            </span>
            <span className="text-sm font-medium text-gray-600">
              No se puede asignar
            </span>
          </div>
          
          <p className="text-base text-gray-700 leading-relaxed">
            {isDocente 
              ? `El docente "${error.docente?.nombre}" ya está asignado al grupo "${error.grupo?.nombre}" en este horario.`
              : `La plaza para "${error.cursoIntentado}" ya está asignada al grupo "${error.grupo?.nombre}".`
            }
          </p>
        </div>

        {/* Tabla comparativa de datos */}
        <div className="p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
            📋 Detalles del Conflicto
          </h4>
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-700 w-1/4">Campo</th>
                <th className="px-4 py-3 text-left font-bold text-green-700 w-1/3">Intento Actual</th>
                <th className="px-4 py-3 text-left font-bold text-red-700 w-1/3">Existente (Conflicto)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Curso */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold text-gray-600">📚 Curso</td>
                <td className="px-4 py-3 text-gray-900 bg-green-50/30">{error.cursoIntentado || '-'}</td>
                <td className="px-4 py-3 text-gray-900 bg-red-50/30 font-medium">{error.cursoExistente || '-'}</td>
              </tr>
              
              {/* Docente (solo para solapamiento de docente) */}
              {isDocente && (
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-semibold text-gray-600">👤 Docente</td>
                  <td className="px-4 py-3 text-gray-900 bg-green-50/30">{error.docente?.nombre || '-'}</td>
                  <td className="px-4 py-3 text-gray-900 bg-red-50/30 font-medium">{error.docente?.nombre || '-'}</td>
                </tr>
              )}
              
              {/* Grupo */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold text-gray-600">👥 Grupo</td>
                <td className="px-4 py-3 text-gray-900 bg-green-50/30">Nuevo</td>
                <td className="px-4 py-3 text-gray-900 bg-red-50/30 font-medium">
                  {error.grupo?.nombre} ({error.grupo?.codigo})
                </td>
              </tr>
              
              {/* Día */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold text-gray-600">📅 Día</td>
                <td className="px-4 py-3 text-gray-900 bg-green-50/30">{error.diaIdx}</td>
                <td className="px-4 py-3 text-gray-900 bg-red-50/30 font-medium">{error.diaIdx}</td>
              </tr>
              
              {/* Bloque */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold text-gray-600">🕐 Bloque</td>
                <td className="px-4 py-3 text-gray-900 bg-green-50/30">{error.bloqueOrden}</td>
                <td className="px-4 py-3 text-gray-900 bg-red-50/30 font-medium">{error.bloqueOrden}</td>
              </tr>
              
              {/* Fechas */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold text-gray-600">📆 Fechas</td>
                <td colSpan="2" className="px-4 py-3 text-gray-900">
                  <div className="flex flex-wrap gap-1">
                    {error.fechas?.map((fecha, idx) => (
                      <span key={idx} className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded font-medium">
                        {fecha}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>

              {/* Horas reales */}
              {(error.horaActual || error.horaConflicto) && (
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-semibold text-gray-600">⏰ Hora real</td>
                  <td className="px-4 py-3 text-gray-900 bg-green-50/30 font-mono text-xs">{error.horaActual || '-'}</td>
                  <td className="px-4 py-3 text-gray-900 bg-red-50/30 font-mono text-xs font-medium">{error.horaConflicto || '-'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer con solución */}
        <div className="p-4 border-t border-red-200 bg-red-50/50">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm font-bold text-red-800 mb-1">Solución sugerida:</p>
              <p className="text-sm text-gray-700">
                {isDocente 
                  ? 'Libere al docente del grupo conflictivo primero, o asigne otro docente a esta plaza.'
                  : 'Libere la plaza del grupo conflictivo primero antes de reasignarla.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // LEGACY: Parsear el mensaje de error (formato string antiguo)
  // ============================================
  const isSolapamiento = error.includes('SOLAPAMIENTO DE PLAZA');
  const isDocente = error.includes('SOLAPAMIENTO DE DOCENTE');
  const isSesionDuplicada = error.includes('SESIÓN DUPLICADA') || error.includes('SESION_DUPLICADA');
  
  // Extraer información del header
  const lines = error.split('\n');
  const headerLines = [];
  const conflictos = [];
  
  let inConflicto = false;
  let currentConflicto = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Header info (primeras líneas)
    if (line.startsWith('Plaza:') || line.startsWith('Docente:') || line.startsWith('Total conflictos')) {
      headerLines.push(line);
    }
    // Inicio de conflicto
    else if (line.match(/^\d+\./)) {
      if (currentConflicto) conflictos.push(currentConflicto);
      currentConflicto = { 
        numero: line.match(/^(\d+)\./)?.[1],
        fecha: '',
        dia: '',
        tuInfo: {},
        conflictoInfo: {}
      };
      // Parsear fecha y día
      const fechaMatch = line.match(/Fecha:\s*([^)]+)\s*\(([^)]+)\)/);
      if (fechaMatch) {
        currentConflicto.fecha = fechaMatch[1];
        currentConflicto.dia = fechaMatch[2];
      }
    }
    // Info de "Tu intento"
    else if (line.startsWith('Tu intento:')) {
      const parts = line.replace('Tu intento:', '').trim().split(' - ');
      currentConflicto.tuInfo.grupo = parts[0]?.trim();
    }
    else if (line.startsWith('Horario:') && currentConflicto && !currentConflicto.tuInfo.horario) {
      currentConflicto.tuInfo.horario = line.replace('Horario:', '').trim();
    }
    else if (line.startsWith('Bloques:') && currentConflicto && !currentConflicto.tuInfo.bloques) {
      currentConflicto.tuInfo.bloques = line.replace('Bloques:', '').trim();
    }
    // Info del conflicto
    else if (line.startsWith('Conflicto con')) {
      const parts = line.replace(/Conflicto con[^:]*:/, '').trim().split(' - ');
      currentConflicto.conflictoInfo.grupo = parts[0]?.trim();
    }
    else if (line.startsWith('Conflicto con plaza:')) {
      currentConflicto.conflictoInfo.plaza = line.replace('Conflicto con plaza:', '').trim();
    }
    else if (line.startsWith('En grupo:')) {
      currentConflicto.conflictoInfo.grupo = line.replace('En grupo:', '').trim();
    }
    else if (line.startsWith('Horario:') && currentConflicto && currentConflicto.tuInfo.horario) {
      currentConflicto.conflictoInfo.horario = line.replace('Horario:', '').trim();
    }
    else if (line.startsWith('Bloques:') && currentConflicto && currentConflicto.tuInfo.bloques) {
      currentConflicto.conflictoInfo.bloques = line.replace('Bloques:', '').trim();
    }
  }
  
  if (currentConflicto) conflictos.push(currentConflicto);

  // Si es sesión duplicada, mostrar formato específico
  if (isSesionDuplicada) {
    // Extraer datos del mensaje de texto
    const fechaMatch = error.match(/📅 Fecha:\s*(.+)/);
    const gpcMatch = error.match(/🆔 GPC:\s*(.+)/);
    const ocurrenciaMatch = error.match(/🔢 Ocurrencia #:\s*(.+)/);
    const horarioMatch = error.match(/🕐 Horario:\s*(.+)/);
    const bloquesMatch = error.match(/🧱 Bloques:\s*(.+)/);
    const errorMsgMatch = error.match(/💥\s*(.+?)\n/);
    const solucionMatch = error.match(/🔧 Solución:\s*(.+)/);
    
    return (
      <div className="max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-red-200 bg-red-100/30">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 text-sm font-bold bg-red-600 text-white rounded">
              SESIÓN DUPLICADA
            </span>
          </div>
          <p className="text-sm text-gray-700">
            No se pudo insertar la sesión porque ya existe una con los mismos datos.
          </p>
        </div>

        {/* Detalles en tabla */}
        <div className="p-4">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-red-100">
              {fechaMatch && (
                <tr className="hover:bg-red-50/30">
                  <td className="px-4 py-3 font-semibold text-red-700 w-1/3">📅 Fecha</td>
                  <td className="px-4 py-3 text-gray-900">{fechaMatch[1]}</td>
                </tr>
              )}
              {gpcMatch && (
                <tr className="hover:bg-red-50/30">
                  <td className="px-4 py-3 font-semibold text-red-700">🆔 GPC</td>
                  <td className="px-4 py-3 text-gray-900">{gpcMatch[1]}</td>
                </tr>
              )}
              {ocurrenciaMatch && (
                <tr className="hover:bg-red-50/30">
                  <td className="px-4 py-3 font-semibold text-red-700">🔢 Ocurrencia</td>
                  <td className="px-4 py-3 text-gray-900">#{ocurrenciaMatch[1]}</td>
                </tr>
              )}
              {horarioMatch && (
                <tr className="hover:bg-red-50/30">
                  <td className="px-4 py-3 font-semibold text-red-700">🕐 Horario</td>
                  <td className="px-4 py-3 text-gray-900 font-mono">{horarioMatch[1]}</td>
                </tr>
              )}
              {bloquesMatch && (
                <tr className="hover:bg-red-50/30">
                  <td className="px-4 py-3 font-semibold text-red-700">🧱 Bloques</td>
                  <td className="px-4 py-3 text-gray-900">{bloquesMatch[1]}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Error específico */}
        {errorMsgMatch && (
          <div className="px-4 py-3 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-800">
              <span className="font-bold">💥 Error:</span> {errorMsgMatch[1]}
            </p>
          </div>
        )}

        {/* Footer con solución */}
        {solucionMatch && (
          <div className="p-4 border-t border-red-200 bg-red-50/50">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-red-700">🔧 Solución:</span>{' '}
              {solucionMatch[1]}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Si no hay conflictos parseados, mostrar el mensaje raw de forma más limpia
  if (conflictos.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
        {error}
      </div>
    );
  }

  // Extraer info del header
  const plazaLine = headerLines.find(l => l.startsWith('Plaza:'));
  const docenteLine = headerLines.find(l => l.startsWith('Docente:'));
  const totalLine = headerLines.find(l => l.startsWith('Total conflictos'));
  
  const plazaInfo = plazaLine?.replace('Plaza:', '').trim();
  const docenteInfo = docenteLine?.replace('Docente:', '').trim();
  const totalConflictos = totalLine?.match(/(\d+)/)?.[0];

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="p-5 border-b border-red-200 bg-red-100/30">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 text-sm font-bold bg-red-600 text-white rounded">
            {isSolapamiento ? 'NIVEL 1' : isDocente ? 'NIVEL 2' : 'CONFLICTO'}
          </span>
          <span className="text-sm font-medium text-red-700">
            {totalConflictos} conflictos detectados
          </span>
        </div>
        
        {plazaInfo && (
          <div className="mb-2">
            <span className="text-xs text-gray-500 uppercase font-semibold">Plaza:</span>
            <p className="text-base font-bold text-gray-900">{plazaInfo}</p>
          </div>
        )}
        
        {docenteInfo && (
          <div className="mb-2">
            <span className="text-xs text-gray-500 uppercase font-semibold">Docente:</span>
            <p className="text-base font-bold text-gray-900">{docenteInfo}</p>
          </div>
        )}
      </div>

      {/* Tabla de conflictos */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-red-100 text-xs text-red-700 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-bold">#</th>
              <th className="px-4 py-3 text-left font-bold">Fecha</th>
              <th className="px-4 py-3 text-left font-bold">Tu Grupo</th>
              <th className="px-4 py-3 text-left font-bold text-red-800">Conflicto Con</th>
              <th className="px-4 py-3 text-left font-bold">Horario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-100">
            {conflictos.map((c, idx) => (
              <tr key={idx} className="hover:bg-red-50/50">
                <td className="px-4 py-3 text-red-600 font-bold">{c.numero}</td>
                <td className="px-4 py-3">
                  <div className="font-bold text-gray-900">{c.fecha}</div>
                  <div className="text-xs text-gray-500">{c.dia}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-900">{c.tuInfo.grupo}</div>
                  <div className="text-xs text-red-600 font-semibold">{c.tuInfo.bloques}</div>
                </td>
                <td className="px-4 py-3 bg-red-50/30">
                  <div className="text-red-800 font-bold">{c.conflictoInfo.grupo || c.conflictoInfo.plaza}</div>
                  <div className="text-xs text-red-600 font-semibold">{c.conflictoInfo.bloques}</div>
                </td>
                <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                  {c.tuInfo.horario}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer con solución */}
      {error.includes('Solución:') && (
        <div className="p-4 border-t border-red-200 bg-red-50">
          <p className="text-sm text-gray-700">
            <span className="font-bold text-red-700">💡 Solución:</span>{' '}
            {error.split('Solución:')[1]?.trim()}
          </p>
        </div>
      )}
    </div>
  );
}
