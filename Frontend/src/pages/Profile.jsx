import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  User, 
  Mail, 
  Shield, 
  Briefcase, 
  CheckCircle, 
  Loader, 
  Target, 
  GraduationCap, 
  Calendar,
  Award,
  BookOpen,
  MapPin
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  
  const [roles, setRoles] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [learningProgress, setLearningProgress] = useState([]);
  const [personalGapData, setPersonalGapData] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    branch: 'Computer Science',
    college: '',
    yearOfStudy: '3rd Year',
    targetRoleId: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // Sync form state when user context changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        branch: user.branch || 'Computer Science',
        college: user.college || '',
        yearOfStudy: user.yearOfStudy || '3rd Year',
        targetRoleId: user.targetRoleId?._id || user.targetRoleId || ''
      });
    }
  }, [user]);

  const fetchStatsAndDetails = async () => {
    if (!user?._id) return;
    try {
      setLoadingStats(true);
      
      // 1. Roles catalog
      const rolesRes = await api.get('/roles');
      setRoles(rolesRes.data.roles || []);

      // 2. User Skills
      const skillsRes = await api.get(`/users/${user._id}/skills`);
      setUserSkills(skillsRes.data.skills || []);

      // 3. Learning Progress
      const progressRes = await api.get('/learning/my-progress');
      setLearningProgress(progressRes.data.progress || []);

      // 4. Personal Gaps & Readiness
      const targetId = user.targetRoleId?._id || user.targetRoleId;
      if (targetId) {
        try {
          const gapRes = await api.get(`/skill-gap/users/${user._id}/roles/${targetId}`);
          setPersonalGapData(gapRes.data || null);
        } catch (gapErr) {
          setPersonalGapData(null);
        }
      } else {
        setPersonalGapData(null);
      }
    } catch (err) {
      console.error('Failed to retrieve profile analytics', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStatsAndDetails();
  }, [user]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.college) {
      return setError('Name and College/University are required.');
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.put(`/users/${user._id}`, {
        name: formData.name,
        branch: formData.branch,
        college: formData.college,
        yearOfStudy: formData.yearOfStudy,
        targetRoleId: formData.targetRoleId || null
      });
      
      // Update context profile
      updateUserProfile(res.data.user);
      setSuccess('Profile details persisted successfully to database.');
      
      // Re-fetch stats
      setTimeout(() => {
        fetchStatsAndDetails();
      }, 300);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to update profile details.');
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

  if (loadingStats && !userProfileActive()) {
    return <LoadingSpinner message="Querying student profile records..." />;
  }

  function userProfileActive() {
    return formData.name !== '';
  }

  return (
    <div className="max-w-7xl mx-auto font-sans space-y-8">
      
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Student Profile</h1>
        <p className="text-xs text-slate-400 font-semibold">Manage your academic registry and career development configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-200/50 p-6 md:p-8 space-y-6">
          <div className="flex items-center space-x-4 border-b border-slate-100 pb-5">
            <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-700 flex items-center justify-center font-black text-2xl shadow-inner">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">{user?.name}</h2>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wide">Student Account &bull; {formData.branch}</p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl text-xs font-semibold flex items-center">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-600 mr-2 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold text-slate-655">
            <div>
              <label className="block uppercase tracking-wider text-[9px] font-bold text-slate-450 mb-2">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block uppercase tracking-wider text-[9px] font-bold text-slate-455 mb-2">
                College / University <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="State University of Engineering"
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block uppercase tracking-wider text-[9px] font-bold text-slate-455 mb-2">
                  Engineering Branch
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all appearance-none text-slate-750 font-bold"
                  >
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[9px] font-bold text-slate-455 mb-2">
                  Academic Year
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    name="yearOfStudy"
                    value={formData.yearOfStudy}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all appearance-none text-slate-750 font-bold"
                  >
                    {academicYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block uppercase tracking-wider text-[9px] font-bold text-slate-455 mb-2">
                Target Career Role
              </label>
              <div className="relative">
                <Target className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  name="targetRoleId"
                  value={formData.targetRoleId}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all appearance-none text-slate-750 font-bold"
                >
                  <option value="">-- No career target selected --</option>
                  {roles.map(r => (
                    <option key={r._id} value={r._id}>{r.name} ({r.level})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Account Metadata card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 border border-slate-200/40 rounded-xl p-3 flex items-center space-x-3 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Email Account</p>
                  <p className="font-bold truncate">{user?.email}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/40 rounded-xl p-3 flex items-center space-x-3 text-slate-600">
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Platform Role</p>
                  <span className="font-bold uppercase tracking-wider text-slate-700 text-[10px]">Student</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-all flex items-center cursor-pointer"
              >
                {loading && <Loader className="w-4 h-4 mr-2 animate-spin text-white" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Statistics */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Goal Readiness Score */}
          {user?.targetRoleId && (
            <div className="bg-white border border-slate-200/50 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <span>Goal Readiness Score</span>
                <span className="text-[9.5px] text-slate-455 font-bold uppercase">{personalGapData?.role?.name}</span>
              </h3>

              <div className="flex items-center space-x-5">
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="32" stroke="#f1f5f9" strokeWidth="6" fill="none" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#6366f1"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={201}
                      strokeDashoffset={201 - (201 * (personalGapData?.readinessScore || 0)) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-base font-black text-slate-850">{personalGapData?.readinessScore || 0}%</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 space-y-1">
                  <p className="text-slate-800 font-extrabold text-[12px] leading-tight">Prerequisites Gaps Analyzed</p>
                  <p>Satisfied skills: {personalGapData?.matchedSkills || 0}</p>
                  <p>Missing requirements: {personalGapData?.missingSkills || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Skills list */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-5 shadow-sm space-y-3.5">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2.5">
              Current Competencies ({userSkills.length})
            </h3>
            {userSkills.length === 0 ? (
              <p className="text-xs text-slate-450 italic">No skills linked to profile yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userSkills.map((us) => (
                  <span
                    key={us._id}
                    className="inline-flex items-center px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold"
                  >
                    <Award className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                    {us.skillId?.name} ({us.proficiency}/5)
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Learning Progress list */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-5 shadow-sm space-y-3.5">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2.5">
              Active Courses ({learningProgress.filter(lp => lp.status === 'in_progress').length})
            </h3>
            {learningProgress.filter(lp => lp.status === 'in_progress').length === 0 ? (
              <p className="text-xs text-slate-450 italic">No active learning courses.</p>
            ) : (
              <div className="space-y-3 text-xs font-semibold text-slate-700">
                {learningProgress.filter(lp => lp.status === 'in_progress').map((lp) => (
                  <div key={lp._id} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold truncate max-w-[70%]">{lp.resourceId?.title}</span>
                      <span className="text-indigo-650 font-bold shrink-0">{lp.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600" style={{ width: `${lp.progressPercentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default Profile;
