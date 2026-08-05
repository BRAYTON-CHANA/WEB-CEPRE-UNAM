import React from 'react';
import { CepreLayout } from '@/features/layout';
import { useAuthContext } from '@/shared/context/AuthContext';
import unamLogo from '@/shared/assets/images/unam-logo.png';

function Home() {
  const { user } = useAuthContext();

  return (
    <CepreLayout showSidebar>
      <div className="min-h-full w-full flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-14 text-center">
          <div className="mb-8 animate-fadeIn">
            <img
              src={unamLogo}
              alt="UNAM"
              className="w-24 h-24 sm:w-28 sm:h-28 mx-auto object-contain"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 animate-fadeIn">
            Sistema de Gestión Académico
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 animate-fadeIn">
            Aplicación para la gestión académica del CEPRE - UNAM
          </p>
          {user && (
            <p className="mt-8 text-sm text-slate-500 font-medium">
              Bienvenido,{' '}
              <span className="text-[#2D366F] font-semibold">
                {user.nombres} {user.apellidos}
              </span>
            </p>
          )}
        </div>
      </div>
    </CepreLayout>
  );
}

export default Home;
