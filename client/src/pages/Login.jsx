import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import logo from '../assets/logo.png'; // Replaced
const logo = 'https://www.sysdevcode.com/images/SYSDEVCODELOGObackgroundremove.png'; // Using provided URL
// import loginBg from '../assets/loginBg.jpg'; // Replaced
const loginBg = '/login-bg.jpg'; // Using uploaded public asset

const Login = () => {
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithPhone } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      setError('');
      const id = (credentials.identifier || '').trim();
      const isEmail = id.includes('@');

      const user = isEmail
        ? await login({ email: id, password: credentials.password })
        : await loginWithPhone({ phone: id, password: credentials.password });

      if (user.role === 'super_admin') {
        navigate('/super-admin');
      } else if (['admin', 'accountant'].includes(user.role)) {
        navigate('/admin');
      } else {
        navigate('/salesperson');
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Invalid email or password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <img
        src={loginBg}
        alt="Login background"
        className="absolute inset-0 h-full w-full object-cover opacity-100"
      />
      <div className="absolute inset-0 bg-white/10" aria-hidden="true" />

      <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Company Logo" className="h-24 md:h-32 w-auto mb-2" />
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label className="label">Email or Phone</label>
            <input
              type="text"
              required
              className="input-field"
              aria-invalid={Boolean(error)}
              value={credentials.identifier}
              onChange={(e) => setCredentials({ ...credentials, identifier: e.target.value })}
              placeholder="you@example.com or 9876543210"
              inputMode="email"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              className="input-field"
              aria-invalid={Boolean(error)}
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
