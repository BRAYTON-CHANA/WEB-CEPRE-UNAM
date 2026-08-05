import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/shared/context/AuthContext';
import { db } from '@/shared/api';
import { authService } from '../services/authService';
import ChangePasswordForm from '../components/ChangePasswordForm';
import logo from '@/shared/assets/images/logo.jpg';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChangePassword = async (newPassword) => {
    setLoading(true);
    setError(null);
    try {
      await authService.changePassword(user.dni, newPassword, token);
      if (user?.ID_USUARIO) {
        await db.update('USUARIOS', user.ID_USUARIO, { REQUIERE_CAMBIO_PASSWORD: false }, 'ID_USUARIO');
      }
      logout();
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            Cambiar Contraseña
          </h1>
          <p className="text-sm text-gray-500 text-center mt-2">
            Por seguridad, debes establecer una nueva contraseña antes de continuar.
          </p>
        </div>

        <ChangePasswordForm onSubmit={handleChangePassword} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default ChangePassword;
