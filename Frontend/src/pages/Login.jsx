import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Network, AlertCircle, Loader, ArrowRight, ArrowLeft } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please enter both email and password.');
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleShortcut = (shEmail, shPass) => {
    setEmail(shEmail);
    setPassword(shPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50/60 via-cream-100 to-pink-50/40 flex flex-col justify-center py-16 sm:px-6 lg:px-8 font-sans relative">
      {/* Website Navigation Header */}
      <div className="absolute top-0 left-0 w-full h-16 flex items-center justify-between px-6 md:px-12 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <Link to="/" className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-slate-800 tracking-tight">SkillGraph</span>
        </Link>
        <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-850 transition-colors flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center mt-8">
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Continue your skill journey
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-200/50">
          {/* Notifications */}
          {isExpired && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 font-medium">
              Your session has expired. Please log in again.
            </div>
          )}

          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-lg flex items-start text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin text-white" />
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-5">
            <span className="text-xs text-slate-500 font-semibold">Don't have an account? </span>
            <Link to="/register" className="text-xs font-bold text-indigo-650 hover:underline">
              Create a student account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
