import React from 'react';
import Layout from '@/shared/components/layout/Layout';

function Home() {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-gradient mb-6 animate-fadeIn">
            Bienvenido a MiApp
          </h1>
          <p className="text-xl text-gray-600 mb-8 animate-fadeIn">
            PLANTILLA PARA APLICACIONES DE ESCRITORIO
          </p>
         
        </div>
      </div>
    </Layout>
  );
}

export default Home;
