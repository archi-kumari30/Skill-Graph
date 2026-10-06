import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Send,
  Sparkles,
  ChevronRight,
  Check,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import toast from 'react-hot-toast';

const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Apply Modal state with full details
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [fullName, setFullName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [education, setEducation] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  const fetchJobMatch = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/jobs/${id}/match`);
      // Note: api interceptor returns response.data directly or data envelope
      const data = res?.data || res;
      setMatchData(data);

      // Pre-fill user details for apply form
      if (user) {
        setFullName(user.name || '');
        setApplicantEmail(user.email || '');
        setPhone(user.phone || '');
        const edu = [user.college, user.branch].filter(Boolean).join(' — ');
        setEducation(edu);
        if (data.matchedSkills) {
          const names = data.matchedSkills.map(s => s.name).join(', ');
          setSkillsText(names);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load job details and match analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchJobMatch();
    }
  }, [id, user]);

  const handleApply = async (e) => {
    e.preventDefault();

    // Validation
    if (!fullName.trim() || !applicantEmail.trim()) {
      return toast.error('Full Name and Email Address are required.');
    }

    if (!/^\S+@\S+\.\S+$/.test(applicantEmail.trim())) {
      return toast.error('Please enter a valid email address.');
    }

    if (!resumeUrl.trim()) {
      return toast.error('Resume URL is required to apply.');
    }

    if (!/^https?:\/\/.+/i.test(resumeUrl.trim())) {
      return toast.error('Resume URL must start with http:// or https://');
    }

    if (portfolioUrl.trim() && !/^https?:\/\/.+/i.test(portfolioUrl.trim())) {
      return toast.error('Portfolio URL must start with http:// or https://');
    }

    try {
      setApplying(true);
      const parsedSkills = skillsText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await api.post(`/jobs/${id}/apply`, {
        fullName: fullName.trim(),
        email: applicantEmail.trim(),
        phone: phone.trim(),
        education: education.trim(),
        resumeUrl: resumeUrl.trim(),
        portfolioUrl: portfolioUrl.trim() || undefined,
        skills: parsedSkills,
        coverLetter: coverLetter.trim() || undefined
      });

      toast.success('Application submitted successfully!');
      setShowApplyModal(false);
      // Refresh match to update hasApplied status
      fetchJobMatch();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <LoadingSpinner message="Analyzing job requirements & graph prerequisites..." />;
  if (error) return <ErrorState message={error} onRetry={fetchJobMatch} />;
  if (!matchData?.job) return <ErrorState message="Job opportunity not found." />;

  const { job, matchScore, matchedSkills = [], partialSkills = [], missingSkills = [], blockedSkills = [], explanation, hasApplied, application } = matchData;
  const isClosed = job.status === 'Closed';

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto animate-in fade-in duration-200">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-500">
        <Link to="/jobs" className="hover:text-indigo-600 transition-colors">Job Market</Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-zinc-800 font-bold truncate">{job.title}</span>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                job.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
              }`}>
                {job.status || 'Active'}
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                {job.workMode || 'Hybrid'}
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700">
                {job.jobType || job.employmentType || 'Full Time'}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-tight">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-zinc-600 mt-2">
                <span className="text-indigo-600 font-extrabold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  {job.company?.name || 'Company'}
                </span>
                <span className="text-zinc-300">•</span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  {job.location || 'Bangalore'}
                </span>
                {job.salary && (
                  <>
                    <span className="text-zinc-300">•</span>
                    <span className="flex items-center gap-1 text-zinc-700">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      {job.salary}
                    </span>
                  </>
                )}
                {job.experience && (
                  <>
                    <span className="text-zinc-300">•</span>
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      {job.experience}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Optional Education Requirements Pill */}
            {job.educationRequirements && (job.educationRequirements.degree || job.educationRequirements.branch || job.educationRequirements.minCgpa) && (
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80 text-xs text-zinc-700 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Education Criteria
                </span>
                <div className="flex flex-wrap gap-2 text-zinc-800 font-semibold">
                  {job.educationRequirements.degree && <span>Degree: {job.educationRequirements.degree}</span>}
                  {job.educationRequirements.branch && <span>• Branch: {job.educationRequirements.branch}</span>}
                  {job.educationRequirements.minGraduationYear && <span>• Grad Year &ge; {job.educationRequirements.minGraduationYear}</span>}
                  {job.educationRequirements.minCgpa && <span>• Min CGPA: {job.educationRequirements.minCgpa}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs & Match Score Preview */}
          <div className="flex flex-col items-center lg:items-end gap-3 w-full lg:w-auto shrink-0">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Compatibility</span>
                <span className="text-3xl font-black text-indigo-600">{matchScore}%</span>
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-indigo-100 flex items-center justify-center relative">
                <div
                  className="absolute inset-0 rounded-full border-4 border-indigo-600"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% ${matchScore}%, 0 ${matchScore}%)`
                  }}
                />
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full sm:w-auto">
              {hasApplied ? (
                <div className="px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Already Applied ({application?.status || 'Submitted'})</span>
                </div>
              ) : isClosed ? (
                <button
                  disabled
                  className="px-5 py-2.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-400 text-xs font-bold cursor-not-allowed text-center"
                >
                  Applications Closed
                </button>
              ) : (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Apply Now</span>
                </button>
              )}

              <Link
                to={`/jobs/${id}/learning-path`}
                className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Build My Learning Path &rarr;</span>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Match Explanation & Formula Breakdown */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="font-extrabold text-base sm:text-lg text-zinc-900">
              Why is your match score {matchScore}%?
            </h2>
          </div>
          <span className="text-xs font-bold text-zinc-400">
            Weighted Graph Match
          </span>
        </div>

        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed bg-[#FAF9F6] p-4 rounded-2xl border border-zinc-200/80">
          {explanation}
        </p>

        {/* 4 Categorized Skill Status Buckets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* 1. Matched Skills */}
          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Matched ({matchedSkills.length})
              </span>
            </div>
            {matchedSkills.length === 0 ? (
              <p className="text-[11px] text-zinc-400 italic">No fully matched skills yet.</p>
            ) : (
              <div className="space-y-2">
                {matchedSkills.map(s => (
                  <div key={s.id} className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-900">
                      <span>{s.name}</span>
                      <span className="text-emerald-600 font-extrabold">✓ Mastered</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 flex justify-between font-semibold">
                      <span>Your level: {s.currentProficiency}/5</span>
                      <span>Required: {s.expectedProficiency}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Partial Skills */}
          <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Partial ({partialSkills.length})
              </span>
            </div>
            {partialSkills.length === 0 ? (
              <p className="text-[11px] text-zinc-400 italic">No partial skills.</p>
            ) : (
              <div className="space-y-2">
                {partialSkills.map(s => (
                  <div key={s.id} className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-900">
                      <span>{s.name}</span>
                      <span className="text-amber-700 font-bold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded">Gap: +{s.gap}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 flex justify-between font-semibold">
                      <span>Your level: {s.currentProficiency}/5</span>
                      <span>Target: {s.expectedProficiency}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Missing Skills */}
          <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" /> Missing ({missingSkills.length})
              </span>
            </div>
            {missingSkills.length === 0 ? (
              <p className="text-[11px] text-zinc-400 italic">No direct missing skills.</p>
            ) : (
              <div className="space-y-2">
                {missingSkills.map(s => (
                  <div key={s.id} className="bg-white p-2.5 rounded-xl border border-rose-100 shadow-2xs space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-900">
                      <span>{s.name}</span>
                      <span className="text-[10px] text-zinc-400 font-semibold">{s.expectedProficiency}/5 req</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 block bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
                      Prerequisites: Satisfied
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Blocked Skills */}
          <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-purple-600" /> Blocked ({blockedSkills.length})
              </span>
            </div>
            {blockedSkills.length === 0 ? (
              <p className="text-[11px] text-zinc-400 italic">No blocked prerequisite skills!</p>
            ) : (
              <div className="space-y-2">
                {blockedSkills.map(s => (
                  <div key={s.id} className="bg-white p-2.5 rounded-xl border border-purple-200 shadow-2xs space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-900">
                      <span>{s.name}</span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                        Blocked
                      </span>
                    </div>
                    {/* Visual Prerequisite Chain */}
                    <div className="p-2 rounded-lg bg-purple-50/70 border border-purple-100 text-[10px] space-y-1">
                      <p className="font-bold text-purple-900">Missing prerequisite:</p>
                      <p className="text-purple-700 font-semibold">
                        {s.prerequisiteChain?.length > 0 ? s.prerequisiteChain.join(' → ') : s.missingPrerequisites?.join(', ') || 'Foundation skills'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Description & Structured Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Job Description (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="font-extrabold text-lg text-zinc-900">Role Overview & Description</h2>
          <div className="text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
            {job.description || 'No detailed job description provided.'}
          </div>
        </div>

        {/* Requirements Card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wider">
            Job Skills Spec
          </h3>
          <div className="space-y-3">
            {[...(job.requirements || [])].map((req, idx) => {
              const skillName = req.skillId?.name || 'Skill';
              const importance = req.importance || 'required';
              const prof = req.expectedProficiency || req.requiredProficiency || 3;
              
              return (
                <div key={idx} className="p-3 rounded-xl bg-[#FAF9F6] border border-zinc-200/80 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-zinc-900">{skillName}</p>
                    <span className={`text-[10px] font-bold uppercase ${
                      importance === 'required'
                        ? 'text-rose-600'
                        : importance === 'important'
                        ? 'text-amber-600'
                        : 'text-zinc-500'
                    }`}>
                      {importance}
                    </span>
                  </div>
                  <span className="font-extrabold text-zinc-700 bg-white px-2 py-1 rounded-lg border border-zinc-200">
                    {prof}/5
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <Link
              to={`/jobs/${id}/learning-path`}
              className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-indigo-200"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Generate Guided Path</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-5 animate-in zoom-in-95 duration-150 my-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Job Application
              </span>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                Apply for {job.title}
              </h3>
              <p className="text-xs text-zinc-500">
                at {job.company?.name || job.companyName || 'Company'} &bull; Compatibility Match: <span className="font-bold text-indigo-600">{matchScore}%</span>
              </p>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 555-0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">
                    Education Details
                  </label>
                  <input
                    type="text"
                    placeholder="B.Tech Computer Science"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">
                  Resume / CV Link (URL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/... or linkedin profile link"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-zinc-400">Must be a valid web link starting with http:// or https://</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">
                  Portfolio / GitHub Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/... or portfolio site"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">
                  Key Skills (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="JavaScript, React, Node.js, HTML, CSS"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">
                  Cover Note / Pitch (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell the recruiter why your skills and projects make you an ideal match..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-[11px] text-zinc-500 space-y-1">
                <span className="font-bold text-zinc-700 block">Candidate Guarantee</span>
                <span>Your verified SkillGraph readiness score ({matchScore}%) and mastery graph will be attached directly to this application for recruiter review.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{applying ? 'Submitting Application...' : 'Submit Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default JobDetail;
