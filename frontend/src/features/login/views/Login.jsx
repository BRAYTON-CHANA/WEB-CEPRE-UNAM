import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/shared/context/AuthContext';
import LoginForm from '../components/LoginForm';
import logo from '@/shared/assets/images/unam-logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthContext();

  const handleLogin = async (dni, password) => {
    try {
      const data = await login(dni, password);
      const user = data?.user ?? data;
      const requiresChange = user?.REQUIERE_CAMBIO_PASSWORD || user?.requiereCambioPassword;
      if (requiresChange) {
        navigate('/cambiar-contrasena');
        return;
      }
      const redirect = sessionStorage.getItem('redirect_after_login') || '/';
      sessionStorage.removeItem('redirect_after_login');
      navigate(redirect);
    } catch (err) {
      // error ya está en el estado del hook
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
            Módulo CEPRE
          </h1>
        </div>

        <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default Login;
