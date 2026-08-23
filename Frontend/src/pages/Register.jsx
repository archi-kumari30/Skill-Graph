import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Network, AlertCircle, Loader, ArrowLeft } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    branch: 'Computer Science',
    college: '',
    yearOfStudy: '3rd Year'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, branch, college, yearOfStudy } = formData;
    if (!name || !email || !password || !college) {
      return setError('Please fill in all required fields.');
    }
    setError('');
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        accountRole: 'employee',
        department: 'Engineering',
        branch,
        college,
        yearOfStudy
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Registration failed. Email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const branches = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Other Engineering'
  ];

  const academicYears = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50/60 via-cream-100 to-pink-50/40 flex flex-col justify-center py-16 sm:px-6 lg:px-8 font-sans relative">
      {/* Website Navigation Header */}
      <div className="absolute top-0 left-0 w-full h-16 flex items-center justify-between px-6 md:px-12 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <Link to="/" className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-slate-800 tracking-tight">SkillGraph</span>
        </Link>
        <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-855 transition-colors flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center mt-8">
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Account
        </h2>
        <p className="mt-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Start your engineering skill path
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-200/50">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-lg flex items-start text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-semibold text-slate-700"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-semibold text-slate-700"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="•••••••• (Min 6 characters)"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-semibold text-slate-700"
              />
            </div>

            <div>
              <label htmlFor="college" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                College / University <span className="text-rose-500">*</span>
              </label>
              <input
                id="college"
                name="college"
                type="text"
                required
                value={formData.college}
                onChange={handleChange}
                placeholder="State University of Engineering"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-semibold text-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="branch" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Engineering Branch
                </label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-semibold text-slate-750"
                >
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="yearOfStudy" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Academic Year
                </label>
                <select
                  id="yearOfStudy"
                  name="yearOfStudy"
                  value={formData.yearOfStudy}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-semibold text-slate-750"
                >
                  {academicYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin text-white" />
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
