import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  User, 
  Mail, 
  Shield, 
  Briefcase, 
  CheckCircle, 
  CheckCircle2,
  Loader, 
  Target, 
  GraduationCap, 
  Calendar,
  Award,
  BookOpen,
  MapPin,
  ExternalLink,
  Github,
  FolderGit2,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowRight,
  Gift
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const STATUS_BADGES = {
  submitted: { label: 'Submitted', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  reviewing: { label: 'In Review', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  shortlisted: { label: 'Shortlisted', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  interview: { label: 'Interview Scheduled', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  offered: { label: 'Offer Received 🎉', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold' },
  rejected: { label: 'Archived', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' }
};

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  
  const [roles, setRoles] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [targetRoleSkills, setTargetRoleSkills] = useState([]);
  const [userProjects, setUserProjects] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [personalGapData, setPersonalGapData] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    branch: 'Computer Science',
    college: '',
    yearOfStudy: '3rd Year'
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
        yearOfStudy: user.yearOfStudy || '3rd Year'
      });
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user?._id) return;
    try {
      setLoadingStats(true);

      // If user is admin or recruiter, don't query student career/skill data
      if (user?.accountRole === 'admin' || user?.accountRole === 'recruiter') {
        setLoadingStats(false);
        return;
      }
      
      // 1. Roles catalog
      const rolesRes = await api.get('/roles');
      const allRoles = rolesRes.data?.data?.roles || rolesRes.data?.roles || [];
      setRoles(allRoles);

      // 2. User Skills
      const skillsRes = await api.get(`/users/${user._id}/skills`);
      const fetchedSkills = skillsRes.data?.data?.skills || skillsRes.data?.skills || [];
      setUserSkills(fetchedSkills);

      // 3. User Projects
      try {
        const projRes = await api.get('/projects');
        const projs = projRes.data?.data?.projects || projRes.data?.projects || (Array.isArray(projRes.data) ? projRes.data : []);
        setUserProjects(projs);
      } catch (e) {
        setUserProjects([]);
      }

      // 4. User Applications
      try {
        const appRes = await api.get('/applications/my');
        const apps = appRes.data?.data?.applications || appRes.data?.applications || (Array.isArray(appRes.data) ? appRes.data : []);
        setUserApplications(apps);
      } catch (e) {
        setUserApplications([]);
      }

      // 5. Target Role Requirements & Skill Gaps
      const targetId = user.targetRoleId?._id || user.targetRoleId;
      if (targetId) {
        try {
          const [rSkillsRes, gapRes] = await Promise.all([
            api.get(`/roles/${targetId}/skills`),
            api.get(`/skill-gap/users/${user._id}/roles/${targetId}`)
          ]);
          setTargetRoleSkills(rSkillsRes.data?.data?.skills || rSkillsRes.data?.skills || []);
          setPersonalGapData(gapRes.data?.data || gapRes.data || null);
        } catch (gapErr) {
          setPersonalGapData(null);
        }
      }
    } catch (err) {
      console.error('Failed to retrieve profile analytics', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
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
    if (!formData.name.trim()) {
      return setError('Name is required.');
    }
    const isStudent = !user?.accountRole || user?.accountRole === 'student';
    if (isStudent && !formData.college.trim()) {
      return setError('College / University is required for student profiles.');
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim()
      };
      if (isStudent) {
        payload.branch = formData.branch;
        payload.college = formData.college.trim();
        payload.yearOfStudy = formData.yearOfStudy;
      }

      const res = await api.put(`/users/${user._id}`, payload);
      const updatedUser = res.data?.user || res.data?.data?.user || res.data;
      
      updateUserProfile(updatedUser);
      setSuccess('Profile details saved successfully.');
      toast.success('Profile updated!');
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

  // Derived categorized skills
  const verifiedSkills = userSkills.filter(s => s.verified);
  const learningSkills = userSkills.filter(s => !s.verified);
  
  // Missing skills from target career role
  const userSkillIdSet = new Set(userSkills.map(us => (us.skillId?._id || us.skillId || '').toString()));
  const notDemonstratedSkills = targetRoleSkills.filter(rs => {
    const sId = (rs.skillId?._id || rs.skillId || '').toString();
    return sId && !userSkillIdSet.has(sId);
  });

  // Offers
  const offersList = userApplications.filter(a => ['offered', 'accepted'].includes((a.status || '').toLowerCase()));

  const targetRoleDoc = roles.find(r => r._id === (user?.targetRoleId?._id || user?.targetRoleId));

  if (loadingStats && !formData.name) {
    return <LoadingSpinner message="Querying profile records..." />;
  }

  // --- ADMINISTRATOR VIEW ---
  if (user?.accountRole === 'admin') {
    return (
      <div className="max-w-5xl mx-auto font-sans space-y-8 animate-in fade-in duration-200">
        <div className="border-b border-zinc-200 pb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" /> Platform Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Platform Administrator Profile</h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            System administration credentials, institutional college governance, and recruitment oversight.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Admin Details Form */}
          <div className="lg:col-span-6 bg-white rounded-3xl shadow-xs border border-zinc-200/90 p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-4 border-b border-zinc-100 pb-5">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-zinc-900 tracking-tight">{user?.name}</h2>
                <p className="text-xs text-purple-600 font-extrabold uppercase tracking-wide">
                  Platform Administrator
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{user?.email}</p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-zinc-700">
              <div>
                <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-500 mb-1.5">
                  Administrator Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Admin Name"
                    className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all text-zinc-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-500 mb-1.5">
                  Platform Email Address (Fixed)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-100 text-zinc-500 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">System Authority & Role</span>
                <p className="text-xs text-zinc-700 font-medium">
                  Full Platform Administrator with system-wide oversight, college directory administration, student tracking, and recruiter management authority.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center cursor-pointer"
                >
                  {loading && <Loader className="w-4 h-4 mr-2 animate-spin text-white" />}
                  Save Admin Profile
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Platform Administration Navigation */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Platform Administration Modules</h3>

            <div className="grid grid-cols-1 gap-3.5">
              <Link
                to="/admin/colleges"
                className="p-5 bg-white rounded-3xl border border-zinc-200/90 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-zinc-900 text-sm group-hover:text-purple-600 transition-colors">Manage Partner Colleges &rarr;</h4>
                  <p className="text-xs text-zinc-500 font-medium">
                    Register universities, verify campus accreditation, and monitor active student counts.
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/dashboard"
                className="p-5 bg-white rounded-3xl border border-zinc-200/90 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-zinc-900 text-sm group-hover:text-indigo-600 transition-colors">System Telemetry Dashboard &rarr;</h4>
                  <p className="text-xs text-zinc-500 font-medium">
                    Monitor system metrics, aggregate talent distributions, active jobs, and verification velocity.
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/students"
                className="p-5 bg-white rounded-3xl border border-zinc-200/90 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-zinc-900 text-sm group-hover:text-emerald-600 transition-colors">Student Account Governance &rarr;</h4>
                  <p className="text-xs text-zinc-500 font-medium">
                    Inspect student verified credentials, learning roadmaps, and account status states.
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/applicants"
                className="p-5 bg-white rounded-3xl border border-zinc-200/90 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-zinc-900 text-sm group-hover:text-amber-600 transition-colors">Recruiter ATS & Candidates &rarr;</h4>
                  <p className="text-xs text-zinc-500 font-medium">
                    Review candidate pipeline statuses, hiring stages, and recruiter evaluations.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RECRUITER VIEW ---
  if (user?.accountRole === 'recruiter') {
    return (
      <div className="max-w-5xl mx-auto font-sans space-y-8 animate-in fade-in duration-200">
        <div className="border-b border-zinc-200 pb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Briefcase className="w-3.5 h-3.5" /> Employer Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Recruiter Profile</h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Recruiter credentials, corporate workspace overview, and talent sourcing pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 bg-white rounded-3xl shadow-xs border border-zinc-200/90 p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-4 border-b border-zinc-100 pb-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-zinc-900 tracking-tight">{user?.name}</h2>
                <p className="text-xs text-indigo-600 font-extrabold uppercase tracking-wide">
                  Corporate Recruiter
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{user?.email}</p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-zinc-700">
              <div>
                <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-500 mb-1.5">
                  Recruiter Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Recruiter Name"
                    className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all text-zinc-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-500 mb-1.5">
                  Corporate Email (Fixed)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-100 text-zinc-500 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center cursor-pointer"
                >
                  {loading && <Loader className="w-4 h-4 mr-2 animate-spin text-white" />}
                  Save Recruiter Profile
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recruiter Workspace</h3>

            <div className="grid grid-cols-1 gap-3.5">
              <Link
                to="/admin/applicants"
                className="p-5 bg-white rounded-3xl border border-zinc-200/90 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-zinc-900 text-sm group-hover:text-indigo-600 transition-colors">Applicant Tracking System (ATS) &rarr;</h4>
                  <p className="text-xs text-zinc-500 font-medium">
                    Review candidate resumes, inspect compatibility scores, and move applicants through recruitment stages.
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/jobs"
                className="p-5 bg-white rounded-3xl border border-zinc-200/90 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-zinc-900 text-sm group-hover:text-purple-600 transition-colors">Manage Job Openings &rarr;</h4>
                  <p className="text-xs text-zinc-500 font-medium">
                    Publish new job requisitions, adjust skill requirements, and track candidate response volumes.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-sans space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Student Profile & Portfolio</h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">Manage your academic registry, demonstrated competencies, project portfolio, and application status.</p>
        </div>
        {targetRoleDoc && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-full text-xs shrink-0">
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-zinc-600 font-medium">Target Role:</span>
            <span className="font-extrabold text-indigo-700">{targetRoleDoc.name}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form & Profile Details */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Academic Info Card */}
          <div className="bg-white rounded-3xl shadow-xs border border-zinc-200/90 p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-4 border-b border-zinc-100 pb-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div>
                <h2 className="text-lg font-black text-zinc-900 tracking-tight">{user?.name}</h2>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wide">
                  Student Account &bull; {formData.branch}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{user?.email}</p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-zinc-700">
              <div>
                <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-500 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all text-zinc-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-500 mb-1.5">
                  College / University <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    placeholder="University of Engineering"
                    className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all text-zinc-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-500 mb-1.5">
                    Engineering Branch
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all appearance-none text-zinc-800 font-bold cursor-pointer"
                    >
                      {branches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-500 mb-1.5">
                    Academic Year
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      name="yearOfStudy"
                      value={formData.yearOfStudy}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all appearance-none text-zinc-800 font-bold cursor-pointer"
                    >
                      {academicYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Career Path Single Source Note */}
              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 text-xs text-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-indigo-950 block">Target Career Role:</span>
                  <span className="text-[11px] text-indigo-800">
                    {targetRoleDoc ? `${targetRoleDoc.name} (${targetRoleDoc.level})` : 'No career target chosen yet'}
                  </span>
                </div>
                <Link
                  to="/careers"
                  className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Select in Career Paths</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center cursor-pointer"
                >
                  {loading && <Loader className="w-4 h-4 mr-2 animate-spin text-white" />}
                  Save Profile Details
                </button>
              </div>
            </form>
          </div>

          {/* Real Portfolio Projects */}
          <div className="bg-white rounded-3xl shadow-xs border border-zinc-200/90 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-black text-base text-zinc-900 flex items-center gap-2">
                  <FolderGit2 className="w-5 h-5 text-indigo-600" />
                  Portfolio & Technical Projects ({userProjects.length})
                </h3>
                <p className="text-xs text-zinc-400 font-semibold mt-0.5">Hands-on applications demonstrating practical competence</p>
              </div>
              <Link
                to="/projects"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors"
              >
                + Add Project
              </Link>
            </div>

            {userProjects.length === 0 ? (
              <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 space-y-2">
                <FolderGit2 className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-xs font-bold text-zinc-700">No project evidence added yet</p>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Showcase GitHub repositories and live deployments to demonstrate your skills to recruiters.
                </p>
                <Link
                  to="/projects"
                  className="inline-block mt-2 text-xs font-bold text-indigo-600 hover:underline"
                >
                  Create Your First Project &rarr;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {userProjects.map(proj => (
                  <div
                    key={proj._id}
                    className="p-4 rounded-2xl border border-zinc-200/80 bg-white hover:border-zinc-300 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-zinc-900">{proj.title}</h4>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                        {proj.difficulty || 'Intermediate'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {proj.description}
                    </p>

                    {/* Technologies Pills */}
                    {proj.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proj.technologies.map((t, idx) => (
                          <span key={idx} className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Links */}
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-zinc-700 hover:text-black transition-colors"
                          >
                            <Github className="w-3.5 h-3.5" />
                            <span>GitHub Code</span>
                            <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                          </a>
                        )}
                        {proj.liveUrl && (
                          <a
                            href={proj.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Live Demo</span>
                          </a>
                        )}
                      </div>
                      <Link to="/projects" className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600">
                        Edit &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real Application Pipeline Status & Offers */}
          <div className="bg-white rounded-3xl shadow-xs border border-zinc-200/90 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-black text-base text-zinc-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Application Pipeline & Offers ({userApplications.length})
                </h3>
                <p className="text-xs text-zinc-400 font-semibold mt-0.5">Real-time status tracking for job requisitions</p>
              </div>
              <Link
                to="/applications"
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                View ATS &rarr;
              </Link>
            </div>

            {/* Official Offers Banner */}
            {offersList.length > 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  <span>Job Offers Received ({offersList.length})</span>
                </div>
                {offersList.map(offer => (
                  <div key={offer._id} className="p-3 bg-white rounded-xl border border-emerald-200 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-zinc-900">{offer.jobId?.title || 'Engineer'}</p>
                      <p className="text-[11px] text-zinc-500">{offer.jobId?.company?.name || offer.jobId?.company || 'Employer'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                      Offer Extended
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 bg-[#FAF9F6] border border-zinc-200 rounded-2xl text-xs text-zinc-600 flex items-center justify-between">
                <span className="font-semibold">Current Offers Status:</span>
                <span className="text-zinc-500 font-bold bg-white px-2 py-0.5 rounded-md border border-zinc-200">
                  No offers yet
                </span>
              </div>
            )}

            {/* Recent Application Pipeline */}
            {userApplications.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-2">No applications submitted yet. Browse jobs in the Job Market.</p>
            ) : (
              <div className="space-y-2.5">
                {userApplications.slice(0, 4).map(app => {
                  const job = app.jobId || {};
                  const badge = STATUS_BADGES[app.status] || { label: app.status, bg: 'bg-zinc-100 text-zinc-700 border-zinc-200' };

                  return (
                    <div
                      key={app._id}
                      className="p-3.5 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-zinc-900">{job.title || 'Engineering Role'}</p>
                        <p className="text-[11px] text-zinc-500 font-medium">{job.company?.name || job.company || 'Employer'}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <Link
                          to={`/interview-prep?jobId=${job._id || job.id}`}
                          className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-[10px] font-bold text-zinc-700 transition-colors"
                        >
                          Prep &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Real User Competencies & Goal Readiness */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Goal Readiness Score */}
          {targetRoleDoc && personalGapData && (
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-zinc-900 text-sm">Career Goal Readiness</h3>
                  <p className="text-[11px] text-zinc-400 font-semibold">{targetRoleDoc.name}</p>
                </div>
                <span className="text-2xl font-black text-indigo-600">{personalGapData.readinessScore || 0}%</span>
              </div>

              <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${personalGapData.readinessScore || 0}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block">Satisfied</span>
                  <span className="text-lg font-black text-emerald-800">{personalGapData.matchedSkills || 0} Skills</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-[10px] font-bold uppercase text-amber-700 block">Missing</span>
                  <span className="text-lg font-black text-amber-800">{personalGapData.missingSkills || 0} Skills</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Link
                  to="/interview-prep"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold text-center transition-colors"
                >
                  Prepare for Interview
                </Link>
                <Link
                  to="/assessments"
                  className="py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold text-center transition-colors border border-zinc-200"
                >
                  Verify
                </Link>
              </div>
            </div>
          )}

          {/* REAL SKILLS SECTION: Verified vs Learning vs Not Yet Demonstrated */}
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-6">
            
            {/* 1. Verified Skills */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <h4 className="font-black text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Skills ({verifiedSkills.length})
                </h4>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Passed &ge;70%
                </span>
              </div>

              {verifiedSkills.length === 0 ? (
                <div className="p-3 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 text-center space-y-1">
                  <p className="text-xs text-zinc-500 font-semibold">No verified skills yet</p>
                  <Link to="/assessments" className="text-[11px] font-bold text-indigo-600 hover:underline">
                    Take an assessment to verify &rarr;
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {verifiedSkills.map(us => {
                    const skillName = us.skillId?.name || 'Skill';
                    return (
                      <div
                        key={us._id}
                        className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs hover:border-emerald-300 transition-colors"
                      >
                        <div>
                          <p className="font-extrabold text-zinc-900">{skillName}</p>
                          <span className="text-[10px] text-emerald-700 font-bold">✓ Verified by Assessment</span>
                        </div>
                        <Link
                          to={`/interview-prep?tech=${encodeURIComponent(skillName)}`}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          Practice
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. In Progress / Learning */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <h4 className="font-black text-xs uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Learning / In Progress ({learningSkills.length})
                </h4>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Self-declared
                </span>
              </div>

              {learningSkills.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No skills currently in progress.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {learningSkills.map(us => {
                    const skillName = us.skillId?.name || 'Skill';
                    return (
                      <div
                        key={us._id}
                        className="p-3 bg-amber-50/40 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs hover:border-amber-300 transition-colors"
                      >
                        <div>
                          <p className="font-extrabold text-zinc-900">{skillName}</p>
                          <span className="text-[10px] text-amber-700 font-bold">&rarr; Learning</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/interview-prep?tech=${encodeURIComponent(skillName)}`}
                            className="px-2 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-lg text-[10px] font-bold"
                          >
                            Prep
                          </Link>
                          <Link
                            to="/assessments"
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold"
                          >
                            Verify
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Not Yet Demonstrated (Missing for Target Role) */}
            {notDemonstratedSkills.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h4 className="font-black text-xs uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-zinc-500" />
                    Not Yet Demonstrated ({notDemonstratedSkills.length})
                  </h4>
                  <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                    Required for Role
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {notDemonstratedSkills.slice(0, 5).map(rs => {
                    const skillName = rs.skillId?.name || rs.name || 'Skill';
                    return (
                      <div
                        key={rs._id || rs.skillId}
                        className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between text-xs hover:border-zinc-300 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-zinc-800">{skillName}</p>
                          <span className="text-[10px] text-zinc-400 font-semibold">○ Not Started</span>
                        </div>
                        <Link
                          to={`/interview-prep?tech=${encodeURIComponent(skillName)}`}
                          className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-[10px] font-bold text-indigo-600"
                        >
                          Learn &rarr;
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default Profile;
