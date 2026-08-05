import { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginForm = ({ onSubmit, loading, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-1.5">
          Usuario
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-full bg-slate-100 px-5 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 transition"
          placeholder="Ingrese su DNI"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
          Clave
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full bg-slate-100 px-5 py-3 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 transition"
            placeholder="********"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M21 21l-2-2M3 3l2.586 2.586A9.97 9.97 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-blue-800 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-900 hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>

      <div className="text-center">
        <Link to="/recuperar-contrasena" className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline">
          Olvidé mi contraseña
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;
