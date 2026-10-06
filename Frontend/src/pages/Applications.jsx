import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  FileText,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const STATUS_BADGES = {
  applied: { label: 'Applied', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  under_review: { label: 'Under Review', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  reviewing: { label: 'In Review', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  shortlisted: { label: '★ Shortlisted', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  interview: { label: '📅 Interview Scheduled', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  interviewing: { label: '📅 Interview Scheduled', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  selected: { label: '🎉 Selected', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold' },
  offered: { label: '🎉 Offer Received', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold' },
  rejected: { label: '✕ Not Selected', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  withdrawn: { label: 'Withdrawn', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' }
};

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/applications/my');
      const data = res?.data || res;
      setApplications(data?.applications || (Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to retrieve your applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  if (loading) return <LoadingSpinner message="Retrieving your job applications..." />;
  if (error) return <ErrorState message={error} onRetry={fetchApplications} />;

  const filteredApps = applications.filter(app => {
    const st = (app.status || '').toLowerCase();
    if (filter === 'all') return true;
    if (filter === 'active') return ['applied', 'under_review', 'reviewing', 'shortlisted', 'interview', 'interviewing'].includes(st);
    if (filter === 'offered') return ['offered', 'selected'].includes(st);
    if (filter === 'rejected') return st === 'rejected';
    return true;
  });

  const totalCount = applications.length;
  const interviewingCount = applications.filter(a => ['shortlisted', 'interview', 'interviewing'].includes((a.status || '').toLowerCase())).length;
  const offeredCount = applications.filter(a => ['offered', 'selected'].includes((a.status || '').toLowerCase())).length;
  const inReviewCount = applications.filter(a => ['applied', 'under_review', 'reviewing'].includes((a.status || '').toLowerCase())).length;

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="border-b border-zinc-200/80 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            My Job Applications
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Track your submissions, interview statuses, and graph readiness alignment.
          </p>
        </div>

        <Link
          to="/jobs"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Browse More Jobs</span>
        </Link>
      </div>

      {/* Metrics Header Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Applied</span>
          <p className="text-2xl font-black text-zinc-900">{totalCount}</p>
          <span className="text-[11px] text-zinc-500 font-medium">Submissions logged</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">In Review</span>
          <p className="text-2xl font-black text-indigo-600">{inReviewCount}</p>
          <span className="text-[11px] text-zinc-500 font-medium">Pending feedback</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Interviews</span>
          <p className="text-2xl font-black text-amber-600">{interviewingCount}</p>
          <span className="text-[11px] text-zinc-500 font-medium">Shortlist & discussions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Offers</span>
          <p className="text-2xl font-black text-emerald-600">{offeredCount}</p>
          <span className="text-[11px] text-zinc-500 font-medium">Successful outcomes</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-zinc-200 pb-2">
        {[
          { key: 'all', label: `All (${totalCount})` },
          { key: 'active', label: `In Progress (${inReviewCount + interviewingCount})` },
          { key: 'offered', label: `Selected & Offers (${offeredCount})` },
          { key: 'rejected', label: `Archived` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === tab.key
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <EmptyState
          title="No Applications Found"
          description={filter === 'all' ? "You haven't applied to any roles yet. Explore matching jobs with graph readiness!" : "No applications matching this filter category."}
        />
      ) : (
        <div className="space-y-4">
          {filteredApps.map(app => {
            const job = app.jobId || {};
            const badge = STATUS_BADGES[app.status] || { label: app.status, bg: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
            const dateStr = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

            return (
              <div
                key={app._id}
                className="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-xs hover:border-zinc-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    {app.matchScore !== undefined && app.matchScore !== null && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        {app.matchScore}% Match at Apply
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Applied on {dateStr}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-zinc-900 leading-snug">
                      <Link to={`/jobs/${job._id || job.id}`} className="hover:text-indigo-600 transition-colors">
                        {job.title || 'Engineering Role'}
                      </Link>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-zinc-600 mt-1">
                      <span className="text-indigo-600 font-bold">{job.companyName || job.companyId?.name || 'Company'}</span>
                      <span className="text-zinc-300">&bull;</span>
                      <span className="text-zinc-500">{job.location || 'Remote'}</span>
                      {job.workMode && (
                        <>
                          <span className="text-zinc-300">&bull;</span>
                          <span className="text-zinc-500">{job.workMode}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {app.coverLetter && (
                    <p className="text-xs text-zinc-500 line-clamp-1 italic bg-zinc-50 p-2 rounded-lg border border-zinc-100 max-w-xl">
                      "{app.coverLetter}"
                    </p>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <Link
                    to={`/interview-prep?jobId=${job._id || job.id}`}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span>Prepare for Interview</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>

                  <Link
                    to={`/jobs/${job._id || job.id}`}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <span>View Job</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Applications;
