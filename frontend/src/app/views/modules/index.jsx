import React from 'react';
import Layout from '@/shared/components/layout/Layout';
import { Link } from 'react-router-dom';

function Modules() {
  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gradient mb-4">
              Catálogo de Módulos
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explora los diferentes tipos de páginas y componentes disponibles para construir tu aplicación.
              Cada módulo está diseñado para ser reutilizable y adaptable a tus necesidades.
            </p>
          </div>

          <div className="space-y-16">

            {/* Test Modules */}
            <section>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Módulos de Prueba</h2>
                <p className="text-gray-600">
                  Páginas de prueba para testing y desarrollo de funcionalidades.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to="/modules/tests" className="block">
                  <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Test CRUD</h3>
                      <p className="text-gray-600 mb-4">
                        Página de prueba para testing de funcionalidades CRUD.
                      </p>
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Disponible</span>
                    </div>
                  </div>
                </Link>

                <Link to="/modules/test-table" className="block">
                  <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Test Table</h3>
                      <p className="text-gray-600 mb-4">
                        Prueba del componente Table con diferentes tipos de datos y funcionalidades.
                      </p>
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">Disponible</span>
                    </div>
                  </div>
                </Link>

                <Link to="/modules/form-test" className="block">
                  <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Test Form</h3>
                      <p className="text-gray-600 mb-4">
                        Prueba del componente Form con validaciones y diferentes tipos de campos.
                      </p>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Disponible</span>
                    </div>
                  </div>
                </Link>
              </div>
            </section>

            {/* CRUD Modules */}
            <section>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Módulos CRUD</h2>
                <p className="text-gray-600">
                  Páginas completas para crear, leer, actualizar y eliminar datos con interfaz intuitiva.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to="/modules/crud" className="block">
                  <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">CRUD Completo</h3>
                      <p className="text-gray-600 mb-4">
                        Módulo completo para operaciones Create, Read, Update, Delete.
                      </p>
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Disponible</span>
                    </div>
                  </div>
                </Link>
              </div>
            </section>

            

            {/* Próximos módulos (placeholder) */}
            <section>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Próximamente</h2>
                <p className="text-gray-600">
                  Más módulos estarán disponibles próximamente para ampliar las capacidades de tu aplicación.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card p-6 opacity-60">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Gestión de Usuarios</h3>
                    <p className="text-gray-600 mb-4">
                      Sistema completo de gestión de usuarios con roles y permisos.
                    </p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Próximamente</span>
                  </div>
                </div>

                <div className="card p-6 opacity-60">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Dashboard Analytics</h3>
                    <p className="text-gray-600 mb-4">
                      Panel de análisis con gráficos y métricas en tiempo real.
                    </p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Próximamente</span>
                  </div>
                </div>

                <div className="card p-6 opacity-60">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Configuración</h3>
                    <p className="text-gray-600 mb-4">
                      Sistema de configuración de la aplicación con múltiples opciones.
                    </p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Próximamente</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Modules;
