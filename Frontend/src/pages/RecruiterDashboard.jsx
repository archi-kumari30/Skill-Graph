import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Filter,
  Eye,
  Building,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/recruiter');
        setData(res?.data || null);
      } catch (err) {
        toast.error('Failed to load recruiter metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading recruitment pipeline..." />;
  }

  const pipeline = data?.pipeline || {};
  const activeJobsCount = data?.activeJobsCount ?? 0;
  const totalApplicants = data?.totalApplicants ?? 0;
  const shortlistedCount = pipeline.shortlisted ?? 0;
  const interviewingCount = (pipeline.interview ?? 0) + (pipeline.offered ?? 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Recruiter Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider">
            <Building className="w-3.5 h-3.5" /> {user?.company || 'Employer Portal'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Recruitment Command Center
          </h1>
          <p className="text-sm text-zinc-600 max-w-2xl">
            Welcome back, {user?.name}. Monitor active job requisitions, evaluate candidate skill match compatibility, and advance applicants through your hiring pipeline.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/admin/applicants"
            className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-zinc-500" />
            <span>Applicant ATS</span>
          </Link>
          <Link
            to="/admin/jobs"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs shadow-purple-200 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Job</span>
          </Link>
        </div>
      </div>

      {/* Primary Recruitment Metrics Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Active Openings */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Active Job Postings</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-zinc-900">{activeJobsCount}</h3>
            <p className="text-xs text-zinc-500 mt-1">of {data?.totalJobs ?? 0} total listings</p>
          </div>
          <Link
            to="/admin/jobs"
            className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-purple-600 hover:text-purple-700 group"
          >
            <span>Manage Postings</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Total Candidates */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Applicants</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-zinc-900">{totalApplicants}</h3>
            <p className="text-xs text-zinc-500 mt-1">Candidates across your jobs</p>
          </div>
          <Link
            to="/admin/applicants"
            className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-700 group"
          >
            <span>Review Candidates</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Shortlisted */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Shortlisted</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-zinc-900">{shortlistedCount}</h3>
            <p className="text-xs text-zinc-500 mt-1">High compatibility matches</p>
          </div>
          <Link
            to="/admin/applicants?status=shortlisted"
            className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-amber-600 hover:text-amber-700 group"
          >
            <span>View Shortlist</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Interviewing / Offers */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Interviews & Offers</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-zinc-900">{interviewingCount}</h3>
            <p className="text-xs text-zinc-500 mt-1">In active evaluation stages</p>
          </div>
          <Link
            to="/admin/applicants?status=interview"
            className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-emerald-600 hover:text-emerald-700 group"
          >
            <span>Manage Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Recruitment Pipeline Funnel Bar */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs">
        <h2 className="text-base font-bold text-zinc-900 mb-4">Applicant Tracking Funnel</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Applied', count: pipeline.applied || 0, color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Reviewing', count: pipeline.reviewing || 0, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
            { label: 'Shortlisted', count: pipeline.shortlisted || 0, color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: 'Interview', count: pipeline.interview || 0, color: 'bg-purple-50 text-purple-700 border-purple-200' },
            { label: 'Offered', count: pipeline.offered || 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { label: 'Rejected', count: pipeline.rejected || 0, color: 'bg-rose-50 text-rose-700 border-rose-200' }
          ].map((stage) => (
            <Link
              key={stage.label}
              to={`/admin/applicants?status=${stage.label.toLowerCase()}`}
              className={`border rounded-xl p-3.5 text-center transition-transform hover:-translate-y-0.5 ${stage.color}`}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{stage.label}</p>
              <p className="text-xl font-extrabold mt-1">{stage.count}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Recent Candidates & Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Applications (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900">Recent Candidate Applications</h2>
            <Link to="/admin/applicants" className="text-xs font-bold text-purple-600 hover:text-purple-700">
              View All in ATS
            </Link>
          </div>

          <div className="divide-y divide-zinc-100">
            {data?.recentApplications && data.recentApplications.length > 0 ? (
              data.recentApplications.map((app) => (
                <div key={app._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs font-bold text-zinc-900">{app.fullName}</p>
                      {app.matchScore && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                          {app.matchScore}% Match
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Applied for: <strong className="text-zinc-700">{app.jobTitle}</strong></p>
                    <p className="text-[10px] text-zinc-400">{app.email}</p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {app.status}
                    </span>
                    <Link
                      to={`/admin/applicants?jobId=${app.jobId}`}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <span>Review</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-6 text-center">
                No candidate applications received yet. New submissions will appear here.
              </p>
            )}
          </div>
        </div>

        {/* My Active Jobs (Span 1) */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900">My Job Requisitions</h2>
            <Link to="/admin/jobs" className="text-xs font-bold text-purple-600 hover:text-purple-700">
              Manage
            </Link>
          </div>

          <div className="divide-y divide-zinc-100">
            {data?.myJobs && data.myJobs.length > 0 ? (
              data.myJobs.slice(0, 5).map((j) => (
                <div key={j._id} className="py-3 flex items-center justify-between">
                  <div className="pr-2">
                    <p className="text-xs font-bold text-zinc-900 leading-snug">{j.title}</p>
                    <p className="text-[11px] text-zinc-500">{j.location || 'Remote'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Link
                      to={`/admin/applicants?jobId=${j._id}`}
                      className="text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-md transition-colors"
                    >
                      {j.applicantsCount} applicants
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-zinc-500">No jobs posted yet.</p>
                <Link
                  to="/admin/jobs"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold"
                >
                  <Plus className="w-3 h-3" /> Post First Job
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default RecruiterDashboard;
