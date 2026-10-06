import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  Users,
  Briefcase,
  FileText,
  Activity,
  CheckCircle2,
  TrendingUp,
  UserCheck,
  Building,
  ArrowRight,
  ExternalLink,
  Search,
  Sparkles,
  Network,
  Clock,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/stats');
        setStats(res?.data || null);
      } catch (err) {
        toast.error('Failed to load system platform statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading system administration metrics..." />;
  }

  const pipeline = stats?.applicationStatusMap || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> System Governance & Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Administrator Command Center
          </h1>
          <p className="text-sm text-zinc-600 max-w-2xl">
            Monitor real-time student readiness metrics, recruiter pipelines, system skill graphs, and platform user activations.
          </p>
        </div>

        {/* System Health Badge */}
        <div className="bg-[#FAF9F6] border border-zinc-200 rounded-2xl p-4 sm:p-5 flex items-center space-x-4 shrink-0">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Platform Status</p>
            <p className="text-sm font-extrabold text-zinc-900">All Services Operational</p>
            <span className="text-xs text-emerald-700 font-semibold">MongoDB Atlas Connected</span>
          </div>
        </div>
      </div>

      {/* High-Level Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Students Card */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Students</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-zinc-900">{stats?.totalStudents || 0}</h3>
            <p className="text-xs text-zinc-500 mt-1">Enrolled career learners</p>
          </div>
          <Link
            to="/admin/students"
            className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-700 group"
          >
            <span>Manage Students</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Recruiters Card */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recruiters</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-zinc-900">{stats?.totalRecruiters || 0}</h3>
            <p className="text-xs text-zinc-500 mt-1">Talent partners registered</p>
          </div>
          <Link
            to="/admin/recruiters"
            className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-purple-600 hover:text-purple-700 group"
          >
            <span>Manage Recruiters</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Jobs Card */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Live Openings</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-zinc-900">{stats?.activeJobs || 0}</h3>
            <p className="text-xs text-zinc-500 mt-1">of {stats?.totalJobs || 0} total listings</p>
          </div>
          <Link
            to="/admin/jobs"
            className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-emerald-600 hover:text-emerald-700 group"
          >
            <span>Manage Jobs</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Applications Card */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Applications</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-zinc-900">{stats?.totalApplications || 0}</h3>
            <p className="text-xs text-zinc-500 mt-1">Candidate submissions</p>
          </div>
          <Link
            to="/admin/applicants"
            className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-amber-600 hover:text-amber-700 group"
          >
            <span>Review ATS Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ATS Pipeline Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs">
        <h2 className="text-base font-bold text-zinc-900 mb-4">Platform Recruitment Funnel</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Applied', count: pipeline.applied || 0, color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Reviewing', count: pipeline.reviewing || 0, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
            { label: 'Shortlisted', count: pipeline.shortlisted || 0, color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: 'Interview', count: pipeline.interview || 0, color: 'bg-purple-50 text-purple-700 border-purple-200' },
            { label: 'Offered', count: pipeline.offered || 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { label: 'Rejected', count: pipeline.rejected || 0, color: 'bg-rose-50 text-rose-700 border-rose-200' }
          ].map((stage) => (
            <div key={stage.label} className={`border rounded-xl p-3.5 text-center ${stage.color}`}>
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{stage.label}</p>
              <p className="text-xl font-extrabold mt-1">{stage.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Recent Users & Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Registrations */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900">Recent User Registrations</h2>
            <Link to="/admin/students" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
              View All
            </Link>
          </div>

          <div className="divide-y divide-zinc-100">
            {stats?.recentUsers?.map((u) => (
              <div key={u._id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-900">{u.name}</p>
                  <p className="text-[11px] text-zinc-500">{u.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    u.accountRole === 'admin'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : u.accountRole === 'recruiter' || u.accountRole === 'manager'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {u.accountRole}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    u.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {u.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900">Recent Job Submissions</h2>
            <Link to="/admin/applicants" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
              View All
            </Link>
          </div>

          <div className="divide-y divide-zinc-100">
            {stats?.recentApplications && stats.recentApplications.length > 0 ? (
              stats.recentApplications.map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-zinc-900">{app.candidateName}</p>
                    <p className="text-[11px] text-zinc-500">{app.jobTitle}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {app.matchScore && (
                      <span className="text-[11px] font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md">
                        {app.matchScore}% Match
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-4 text-center">No recent applications submitted.</p>
            )}
          </div>
        </div>

      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/admin/students"
          className="bg-white p-5 rounded-2xl border border-zinc-200 hover:border-indigo-400 hover:shadow-sm transition-all group flex items-start space-x-4"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
              Student Directory & Readiness
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Inspect student career readiness scores, verified skills, and toggle account activation.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/recruiters"
          className="bg-white p-5 rounded-2xl border border-zinc-200 hover:border-purple-400 hover:shadow-sm transition-all group flex items-start space-x-4"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 group-hover:text-purple-600 transition-colors">
              Recruiter Organizations
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Manage hiring managers, audit job posting limits, and oversee applicant pipelines.
            </p>
          </div>
        </Link>

        <Link
          to="/skill-graph"
          className="bg-white p-5 rounded-2xl border border-zinc-200 hover:border-emerald-400 hover:shadow-sm transition-all group flex items-start space-x-4"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">
              Core Skill Graph Topology
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Inspect systemic prerequisite dependencies and ontological links across technical skills.
            </p>
          </div>
        </Link>
      </div>

    </div>
  );
};

export default AdminDashboard;
