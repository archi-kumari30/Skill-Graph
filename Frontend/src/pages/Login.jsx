import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Network, AlertCircle, Loader, ArrowLeft, GraduationCap, Briefcase, ShieldCheck, CheckCircle, X, KeyRound } from 'lucide-react';

const Login = () => {
  const { login, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Exactly 3 Login Options
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'recruiter' | 'admin'
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

  const DEMO_CREDENTIALS = {
    student: {
      email: 'student@skillgraph.com',
      password: 'studentpassword',
      label: 'Demo Student'
    },
    recruiter: {
      email: 'recruiter@skillgraph.com',
      password: 'recruiterpassword',
      label: 'Demo Recruiter'
    },
    admin: {
      email: 'admin@skillgraph.com',
      password: 'adminpassword',
      label: 'Demo Admin'
    }
  };

  const handleQuickFill = (roleKey) => {
    setSelectedRole(roleKey);
    const creds = DEMO_CREDENTIALS[roleKey];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.password);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please enter both email and password.');
    }
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      const userRole = loggedUser?.accountRole;

      // Smart redirection based on role
      if (userRole === 'admin') {
        navigate('/admin/skills');
      } else if (userRole === 'recruiter' || userRole === 'manager') {
        navigate('/admin/jobs');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Incorrect email or password.');
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
      setForgotError(err?.response?.data?.error?.message || err?.message || 'Unable to process reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50/60 via-slate-50 to-pink-50/40 flex flex-col justify-center py-16 sm:px-6 lg:px-8 font-sans relative">
      {/* Website Navigation Header */}
      <div className="absolute top-0 left-0 w-full h-16 flex items-center justify-between px-6 md:px-12 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <Link to="/" className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-slate-800 tracking-tight">SkillGraph</span>
        </Link>
        <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center mt-8">
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to SkillGraph
        </h2>
        <p className="mt-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Sign in to your account
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-200/50 space-y-6">

          {/* EXACTLY 3 LOGIN ROLE SELECTOR TABS */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setSelectedRole('student'); setError(''); }}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'student'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedRole('recruiter'); setError(''); }}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'recruiter'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Recruiter</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedRole('admin'); setError(''); }}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>

          {/* Role Description Notice */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 font-medium">
            {selectedRole === 'student' && (
              <span>🎓 <strong>Student Portal:</strong> Access career roadmaps, test skill gaps, and apply to matched opportunities.</span>
            )}
            {selectedRole === 'recruiter' && (
              <span>💼 <strong>Recruiter Console:</strong> Post job requisitions, evaluate candidate match scores, and track applications.</span>
            )}
            {selectedRole === 'admin' && (
              <span>🛡️ <strong>Admin System:</strong> Manage global skills taxonomy, review platform analytics, and manage accounts.</span>
            )}
          </div>

          {/* Quick-Fill Demo Buttons */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                Quick-Fill Demo Credentials
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('student')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  selectedRole === 'student'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('recruiter')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  selectedRole === 'recruiter'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Recruiter
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Notifications */}
          {isExpired && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 font-medium">
              Your session has expired. Please log in again.
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-lg flex items-start text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === 'admin' ? 'admin@skillgraph.com' : (selectedRole === 'recruiter' ? 'recruiter@skillgraph.com' : 'student@skillgraph.com')}
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
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
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
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin text-white" />
                ) : (
                  `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
                )}
              </button>
            </div>
          </form>

          {/* Registration link (Only for student and recruiter, no admin registration) */}
          <div className="text-center border-t border-slate-100 pt-5">
            <span className="text-xs text-slate-500 font-semibold">New to SkillGraph? </span>
            <Link to="/register" className="text-xs font-bold text-indigo-600 hover:underline">
              Create an account
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
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
                      Direct Recovery Link:
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
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
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
