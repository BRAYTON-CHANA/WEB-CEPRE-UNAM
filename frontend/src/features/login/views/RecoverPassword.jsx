import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RecoverPasswordForm from '../components/RecoverPasswordForm';
import logo from '@/shared/assets/images/logo.jpg';

const RecoverPassword = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => navigate('/login'), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-10">
        <div className="flex flex-col items-center mb-8">
          <img
            src={logo}
            alt="Universidad Nacional de Moquegua"
            className="h-20 w-auto object-contain mb-5"
          />
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider text-center">
            Universidad Nacional de Moquegua
          </p>
          <h1 className="text-2xl font-bold text-slate-900 text-center mt-1">
            Recuperar Contraseña
          </h1>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-700 font-semibold">Contraseña actualizada correctamente</p>
              <p className="text-xs text-green-600 mt-1">Serás redirigido al login...</p>
            </div>
            <Link to="/login" className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline">
              Ir al login ahora
            </Link>
          </div>
        ) : (
          <>
            <RecoverPasswordForm onSuccess={handleSuccess} />
            <div className="text-center mt-5">
              <Link to="/login" className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline">
                Volver al login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecoverPassword;
