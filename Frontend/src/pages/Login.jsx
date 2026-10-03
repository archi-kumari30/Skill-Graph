import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Network, AlertCircle, Loader, ArrowRight, ArrowLeft, X, CheckCircle } from 'lucide-react';

const Login = () => {
  const { login, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState('');
  const [forgotError, setForgotError] = useState('');

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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      return setForgotError('Please enter your account email.');
    }
    setForgotError('');
    setForgotMessage('');
    setForgotResetToken('');
    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotEmail);
      setForgotMessage(res.message || 'If an account exists, a reset link has been dispatched.');
      if (res.resetToken) {
        setForgotResetToken(res.resetToken);
      }
    } catch (err) {
      setForgotError(err.message || 'Unable to process reset request. Please try again.');
    } finally {
      setForgotLoading(false);
    }
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
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(true);
                    setForgotEmail(email);
                    setForgotMessage('');
                    setForgotResetToken('');
                    setForgotError('');
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
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

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your registered account email and we will generate a secure password reset link.
            </p>

            {forgotError && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-xs font-semibold flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-500" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotMessage ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-emerald-800 text-xs">
                <div className="flex items-center mb-2 font-bold text-emerald-900">
                  <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Request Processed
                </div>
                <p className="mb-3">{forgotMessage}</p>
                {forgotResetToken && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/60">
                    <span className="text-[11px] font-semibold text-emerald-700 block mb-1">
                      Direct Recovery Link (Development / Test Environment):
                    </span>
                    <Link
                      to={`/reset-password/${forgotResetToken}`}
                      onClick={() => setForgotModalOpen(false)}
                      className="inline-flex items-center font-bold text-indigo-600 hover:underline text-xs"
                    >
                      Click here to reset your password now &rarr;
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <Loader className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
