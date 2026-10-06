import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Network, AlertCircle, Loader, ArrowLeft, GraduationCap, Briefcase } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Exactly 2 Registration Options: student | recruiter (Never Admin)
  const [role, setRole] = useState('student');

  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    branch: 'Computer Science',
    yearOfStudy: '3rd Year'
  });

  const [recruiterData, setRecruiterData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    phone: '',
    department: 'Talent Acquisition'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const departments = [
    'Talent Acquisition',
    'Human Resources',
    'Engineering Hiring',
    'Campus Recruitment',
    'Technical Sourcing'
  ];

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecruiterChange = (e) => {
    const { name, value } = e.target;
    setRecruiterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (role === 'student') {
      const { name, email, password, college, branch, yearOfStudy } = studentData;
      if (!name || !email || !password || !college) {
        return setError('Please fill in all required fields.');
      }
      if (password.length < 6) {
        return setError('Password must be at least 6 characters.');
      }
      setLoading(true);
      try {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          accountRole: 'student',
          college: college.trim(),
          branch,
          yearOfStudy
        });
        navigate('/dashboard');
      } catch (err) {
        setError(err?.response?.data?.error?.message || err?.message || 'Registration failed. Email might already be in use.');
      } finally {
        setLoading(false);
      }
    } else {
      const { name, email, password, company, phone, department } = recruiterData;
      if (!name || !email || !password || !company) {
        return setError('Please fill in all required fields.');
      }
      if (password.length < 6) {
        return setError('Password must be at least 6 characters.');
      }
      setLoading(true);
      try {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          accountRole: 'recruiter',
          company: company.trim(),
          phone: phone.trim(),
          department
        });
        navigate('/admin/jobs');
      } catch (err) {
        setError(err?.response?.data?.error?.message || err?.message || 'Registration failed. Email might already be in use.');
      } finally {
        setLoading(false);
      }
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
          Create Your Account
        </h2>
        <p className="mt-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Join SkillGraph to elevate career readiness & recruitment
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-200/50 space-y-6">

          {/* TWO REGISTRATION ROLE TABS: STUDENT vs RECRUITER (NO ADMIN) */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setRole('student'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'student'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student / Learner</span>
            </button>

            <button
              type="button"
              onClick={() => { setRole('recruiter'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'recruiter'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Recruiter / Hiring</span>
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-lg flex items-start text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* STUDENT FORM */}
          {role === 'student' ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="bg-indigo-50/70 border border-indigo-100/80 rounded-xl p-3 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">Student Registration</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Build skill graph, take guided paths & get hired</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  value={studentData.name}
                  onChange={handleStudentChange}
                  placeholder="Alex Mercer"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={studentData.email}
                  onChange={handleStudentChange}
                  placeholder="alex@example.com"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  value={studentData.password}
                  onChange={handleStudentChange}
                  placeholder="•••••••• (Min 6 characters)"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  College / University <span className="text-rose-500">*</span>
                </label>
                <input
                  name="college"
                  type="text"
                  required
                  value={studentData.college}
                  onChange={handleStudentChange}
                  placeholder="National Institute of Technology"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Branch
                  </label>
                  <select
                    name="branch"
                    value={studentData.branch}
                    onChange={handleStudentChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Year of Study
                  </label>
                  <select
                    name="yearOfStudy"
                    value={studentData.yearOfStudy}
                    onChange={handleStudentChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    'Create Student Account'
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* RECRUITER FORM */
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="bg-indigo-50/70 border border-indigo-100/80 rounded-xl p-3 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">Recruiter Registration</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Post requisitions, evaluate candidate graph scores & hire</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  value={recruiterData.name}
                  onChange={handleRecruiterChange}
                  placeholder="Sarah Jenkins"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Work Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={recruiterData.email}
                  onChange={handleRecruiterChange}
                  placeholder="sarah@company.com"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  value={recruiterData.password}
                  onChange={handleRecruiterChange}
                  placeholder="•••••••• (Min 6 characters)"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  name="company"
                  type="text"
                  required
                  value={recruiterData.company}
                  onChange={handleRecruiterChange}
                  placeholder="TechCorp Innovations"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <select
                    name="department"
                    value={recruiterData.department}
                    onChange={handleRecruiterChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Work Phone
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={recruiterData.phone}
                    onChange={handleRecruiterChange}
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
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
                    'Create Recruiter Account'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="text-center border-t border-slate-100 pt-5">
            <span className="text-xs text-slate-500 font-semibold">Already have an account? </span>
            <Link to="/login" className="text-xs font-bold text-indigo-600 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
