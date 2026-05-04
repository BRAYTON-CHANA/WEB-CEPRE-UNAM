import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/shared/components/layout/Layout';

/**
 * Dashboard de Configuración de Datos
 * Página principal con dos secciones: Tablas Generales y Configuración por Período
 */
function DatosDashboard() {
  // Tablas Generales - Configuración base del sistema
  const tablasGenerales = [
   
  ];

  // Configuración de Horarios - Turnos, Horarios y Bloques
  const configuracionHorarios = [
   
    

  ];

  // Configuración por Período - Tablas con dependencia temporal
  const configuracionPeriodo = [
    {
      name: 'GRUPOS',
      description: 'Gestión de grupos de estudio por período, área, turno y aula',
      path: '/datos/grupos',
      icon: '👥',
      color: 'bg-rose-500'
    },
    {
      name: 'ASIGNACION DE HORARIO POR GRUPO',
      description: 'Asignación de horarios a los cursos de cada grupo',
      path: '/datos/asignacion_horario_grupo',
      icon: '📅',
      color: 'bg-amber-500'
    },
    {
      name: 'ASIGNACION DE HORARIO POR DOCENTE',
      description: 'Visualización del horario de un docente (periodo → sede → turno → docente)',
      path: '/datos/asignacion_horario_docente',
      icon: '👨‍🏫',
      color: 'bg-indigo-500'
    },
  ];

  const renderCard = (table) => (
    <Link
      key={table.name}
      to={table.comingSoon ? '#' : table.path}
      className={`block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden ${
        table.comingSoon ? 'opacity-60 cursor-not-allowed' : ''
      }`}
      onClick={(e) => table.comingSoon && e.preventDefault()}
    >
      <div className={`${table.color} h-2`} />
      <div className="p-6">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3">{table.icon}</span>
          <h2 className="text-xl font-semibold text-gray-800">
            {table.name}
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          {table.description}
        </p>
        <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
          {table.comingSoon ? (
            <span className="text-gray-500">Próximamente</span>
          ) : table.isView ? (
            <>
              <span>Ver datos</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </>
          ) : (
            <>
              <span>Configurar</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Configuración de Datos
          </h1>
          <p className="text-gray-600">
            Gestiona las tablas base del sistema y views disponibles
          </p>
        </div>

        {/* Sección: Tablas Generales */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-8 bg-blue-600 rounded mr-3"></span>
            Tablas Generales
            <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {tablasGenerales.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tablasGenerales.map(renderCard)}
          </div>
        </div>

        {/* Sección: Configuración de Horarios */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-8 bg-amber-600 rounded mr-3"></span>
            Configuración de Horarios
            <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {configuracionHorarios.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {configuracionHorarios.map(renderCard)}
          </div>
        </div>

        {/* Sección: Configuración por Período */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-8 bg-purple-600 rounded mr-3"></span>
            Configuración por Período
            <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {configuracionPeriodo.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {configuracionPeriodo.map(renderCard)}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DatosDashboard;
