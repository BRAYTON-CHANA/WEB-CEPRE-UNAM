import React from 'react';
import { CepreLayout } from '@/features/layout';
import PerfilView from '@/features/usuarios/components/PerfilView';
import { useAuthContext } from '@/shared/context/AuthContext';

const PerfilPage = () => {
  const { user, activeRole } = useAuthContext();

  return (
    <CepreLayout>
      <main className="min-h-[calc(100vh-12rem)] w-full bg-slate-50 py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <PerfilView user={user} activeRole={activeRole} />
        </div>
      </main>
    </CepreLayout>
  );
};

export default PerfilPage;
