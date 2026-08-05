import { useState, useEffect, useRef } from 'react';
import { passwordResetService } from '@/shared/services/passwordResetService';

const RecoverPasswordForm = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [countdown, setCountdown] = useState(300);
  const timerRef = useRef(null);

  useEffect(() => {
    if (step === 2 && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [step]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await passwordResetService.request(dni, email);
      setInfo('Se envió un código a tu correo. Revisa tu bandeja de entrada.');
      setStep(2);
      setCountdown(300);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await passwordResetService.request(dni, email);
      setInfo('Se reenvió el código a tu correo.');
      setCountdown(300);
      setCodigo('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const result = await passwordResetService.verify(dni, codigo);
      if (result.valid) {
        setStep(3);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }
    try {
      await passwordResetService.update(dni, codigo, newPassword);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={step === 1 ? handleRequest : step === 2 ? handleVerify : handleUpdate} className="space-y-5">
      {/* Paso 1: DNI + Email */}
      {step === 1 && (
        <>
          <div>
            <label htmlFor="recover-dni" className="block text-sm font-semibold text-slate-700 mb-1.5">
              DNI
            </label>
            <input
              id="recover-dni"
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="w-full rounded-full bg-slate-100 px-5 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 transition"
              placeholder="Ingrese su DNI"
              maxLength={8}
              disabled={loading}
              required
            />
          </div>
          <div>
            <label htmlFor="recover-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              id="recover-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full bg-slate-100 px-5 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 transition"
              placeholder="correo@ejemplo.com"
              disabled={loading}
              required
            />
          </div>
        </>
      )}

      {/* Paso 2: Código */}
      {step === 2 && (
        <>
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-1">Ingresa el código de 6 dígitos enviado a:</p>
            <p className="text-sm font-semibold text-slate-800">{email}</p>
          </div>
          <div>
            <label htmlFor="recover-code" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Código de verificación
            </label>
            <input
              id="recover-code"
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-full bg-slate-100 px-5 py-3 text-center text-2xl font-bold tracking-[0.5em] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 transition"
              placeholder="000000"
              maxLength={6}
              disabled={loading}
              required
            />
          </div>
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-slate-500">
                El código expira en <span className="font-semibold text-slate-700">{formatTime(countdown)}</span>
              </p>
            ) : (
              <p className="text-sm text-red-600 font-medium">El código ha expirado</p>
            )}
          </div>
          {countdown > 0 && (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="w-full text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline disabled:opacity-50"
            >
              Reenviar código
            </button>
          )}
        </>
      )}

      {/* Paso 3: Nueva contraseña */}
      {step === 3 && (
        <>
          <div>
            <label htmlFor="recover-newpass" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="recover-newpass"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-full bg-slate-100 px-5 py-3 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 transition"
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
                required
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
          <div>
            <label htmlFor="recover-confirmpass" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Confirmar contraseña
            </label>
            <input
              id="recover-confirmpass"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-full bg-slate-100 px-5 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 transition"
              placeholder="Repite la nueva contraseña"
              disabled={loading}
              required
            />
          </div>
        </>
      )}

      {/* Mensajes de error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Mensajes informativos */}
      {info && !error && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3">
          <p className="text-sm text-green-700 font-medium">{info}</p>
        </div>
      )}

      {/* Botón submit */}
      <button
        type="submit"
        disabled={loading || (step === 2 && countdown === 0)}
        className="w-full rounded-full bg-blue-800 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-900 hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Procesando...' : step === 1 ? 'Enviar código' : step === 2 ? 'Verificar código' : 'Cambiar contraseña'}
      </button>
    </form>
  );
};

export default RecoverPasswordForm;
