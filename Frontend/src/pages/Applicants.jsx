import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Briefcase,
  ExternalLink,
  ChevronDown,
  Building,
  GraduationCap,
  Calendar,
  Sparkles,
  Award,
  AlertCircle,
  Phone,
  Mail,
  FolderGit2,
  X
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  applied: { label: 'Applied', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  screening: { label: 'Screening', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  reviewing: { label: 'In Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  shortlisted: { label: 'Shortlisted', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  interview: { label: 'Interview', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  interviewing: { label: 'Interviewing', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  selected: { label: 'Selected', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  offered: { label: 'Offered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  withdrawn: { label: 'Withdrawn', color: 'bg-zinc-100 text-zinc-600 border-zinc-200' }
};

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied' },
  { value: 'reviewing', label: 'In Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'selected', label: 'Selected' },
  { value: 'offered', label: 'Offered' },
  { value: 'rejected', label: 'Rejected' }
];

const Applicants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterJobId = searchParams.get('jobId') || '';

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const params = filterJobId ? { jobId: filterJobId } : {};
      let res;
      try {
        res = await api.get('/applications', { params });
      } catch (err) {
        res = await api.get('/jobs/applications', { params });
      }
      const data = res?.data?.applications || res?.data?.data?.applications || res?.data || [];
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to retrieve applicants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filterJobId]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      setUpdatingId(appId);
      await api.put(`/applications/${appId}/status`, { status: newStatus });
      
      setApplications(prev =>
        prev.map(app => (app._id === appId ? { ...app, status: newStatus } : app))
      );

      if (selectedApp && selectedApp._id === appId) {
        setSelectedApp(prev => ({ ...prev, status: newStatus }));
      }

      toast.success(`Application updated to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update application status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredApps = applications.filter(app => {
    const candidateName = app.fullName || app.userId?.name || 'Candidate';
    const candidateEmail = app.email || app.userId?.email || '';
    const jobTitle = app.jobId?.title || '';
    const companyName = app.jobId?.companyId?.name || app.jobId?.companyName || '';

    const matchesSearch =
      candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      companyName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || app.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: applications.length,
    shortlisted: applications.filter(a => a.status?.toLowerCase() === 'shortlisted').length,
    interview: applications.filter(a => ['interview', 'interviewing'].includes(a.status?.toLowerCase())).length,
    offered: applications.filter(a => ['offered', 'selected'].includes(a.status?.toLowerCase())).length
  };

  if (loading) return <LoadingSpinner message="Loading candidate applications..." />;
  if (error) return <ErrorState message={error} onRetry={fetchApplications} />;

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" /> Recruiter Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Applicant Tracking & Management</h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Review submitted candidate credentials, match readiness metrics, and advance applicants through recruitment stages.
          </p>
        </div>

        {filterJobId && (
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-2xl border border-indigo-200">
            <span className="text-xs font-bold text-indigo-700">Filtering by specific job</span>
            <button
              onClick={() => setSearchParams({})}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-zinc-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-zinc-400">Total Applicants</span>
          <div className="text-2xl font-black text-zinc-900 mt-1">{stats.total}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-zinc-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-indigo-600">Shortlisted</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{stats.shortlisted}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-zinc-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-purple-600">Interviewing</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{stats.interview}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-zinc-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-600">Selected / Offered</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.offered}</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search candidate name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50/70 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-1">Stage:</span>
          {['ALL', 'applied', 'reviewing', 'shortlisted', 'interview', 'selected', 'offered', 'rejected'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter.toLowerCase() === st.toLowerCase()
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
              }`}
            >
              {st === 'ALL' ? 'All' : (STATUS_CONFIG[st]?.label || st)}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200/80 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <Users className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="font-extrabold text-zinc-800 text-base">No Applicants Found</h3>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No candidate applications match your current search and filter settings.'
              : 'No candidate applications have been submitted for your jobs yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs divide-y divide-zinc-100">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3.5 bg-zinc-50/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <div className="col-span-5">Candidate Profile & Details</div>
            <div className="col-span-3">Position & Applied Date</div>
            <div className="col-span-2 text-center">Match Readiness</div>
            <div className="col-span-2 text-right">Recruitment Status</div>
          </div>

          {filteredApps.map((app) => {
            const candidateName = app.fullName || app.userId?.name || 'Applicant';
            const candidateEmail = app.email || app.userId?.email || 'No email';
            const candidatePhone = app.phone || app.userId?.phone || '';
            const candidateEducation = app.education || [app.userId?.college, app.userId?.branch].filter(Boolean).join(' • ');
            const job = app.jobId || {};
            const companyName = job.companyId?.name || job.companyName || 'Company';
            const normalizedStatus = app.status?.toLowerCase() || 'applied';
            const currentStatusCfg = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.applied;

            return (
              <div
                key={app._id}
                className="p-5 sm:p-6 hover:bg-zinc-50/40 transition-colors flex flex-col lg:grid lg:grid-cols-12 gap-4 items-start lg:items-center"
              >
                {/* Candidate Info */}
                <div className="lg:col-span-5 space-y-1.5 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-zinc-900 text-sm">{candidateName}</span>
                    <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3 text-zinc-400" /> {candidateEmail}
                    </span>
                    {candidatePhone && (
                      <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-400" /> {candidatePhone}
                      </span>
                    )}
                  </div>

                  {candidateEducation && (
                    <div className="text-xs text-zinc-600 font-medium flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{candidateEducation}</span>
                    </div>
                  )}

                  {/* Skills badges */}
                  {app.skills && app.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {app.skills.map((sk, sIdx) => (
                        <span key={sIdx} className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-bold">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Links: Resume & Portfolio */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {app.resumeUrl && (
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
                      >
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        <span>Resume Document</span>
                      </a>
                    )}
                    {app.portfolioUrl && (
                      <a
                        href={app.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-zinc-600 hover:text-zinc-800 flex items-center gap-1"
                      >
                        <FolderGit2 className="w-3 h-3" />
                        <span>Portfolio / GitHub</span>
                      </a>
                    )}
                    {app.coverLetter && (
                      <button
                        onClick={() => setSelectedApp(selectedApp?._id === app._id ? null : app)}
                        className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800 underline cursor-pointer"
                      >
                        {selectedApp?._id === app._id ? 'Hide Statement' : 'View Cover Note'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Job Position */}
                <div className="lg:col-span-3 space-y-1 w-full">
                  <p className="font-extrabold text-zinc-800 text-xs">{job.title || 'Job Opening'}</p>
                  <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                    <Building className="w-3 h-3 text-zinc-400" />
                    <span>{companyName}</span>
                    {job.location && <span>&bull; {job.location}</span>}
                  </p>
                  <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Applied: {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>

                {/* Match Score */}
                <div className="lg:col-span-2 text-left lg:text-center w-full">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-black">
                    <Sparkles className="w-3 h-3 text-indigo-500" /> {app.matchScore || 0}% Match
                  </div>
                </div>

                {/* Status Update Dropdown */}
                <div className="lg:col-span-2 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 w-full">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentStatusCfg.color}`}>
                    {currentStatusCfg.label}
                  </span>

                  <div className="relative w-full sm:w-auto">
                    <select
                      value={normalizedStatus}
                      disabled={updatingId === app._id}
                      onChange={(e) => handleStatusChange(app._id, e.target.value)}
                      className="w-full sm:w-auto px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 hover:border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          &rarr; {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap gap-1 mt-1 justify-start lg:justify-end">
                    <button
                      type="button"
                      disabled={updatingId === app._id || normalizedStatus === 'shortlisted'}
                      onClick={() => handleStatusChange(app._id, 'shortlisted')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 disabled:opacity-40 cursor-pointer"
                    >
                      Shortlist
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === app._id || normalizedStatus === 'interview'}
                      onClick={() => handleStatusChange(app._id, 'interview')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 disabled:opacity-40 cursor-pointer"
                    >
                      Interview
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === app._id || normalizedStatus === 'selected'}
                      onClick={() => handleStatusChange(app._id, 'selected')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-40 cursor-pointer"
                    >
                      Select
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === app._id || normalizedStatus === 'rejected'}
                      onClick={() => handleStatusChange(app._id, 'rejected')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-40 cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                {/* Cover Letter Expander */}
                {selectedApp?._id === app._id && app.coverLetter && (
                  <div className="col-span-12 w-full mt-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-700 space-y-1">
                    <p className="font-bold text-zinc-900 text-[11px] uppercase tracking-wider">Cover Letter / Pitch Note:</p>
                    <p className="italic leading-relaxed text-zinc-800">{app.coverLetter}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Applicants;
