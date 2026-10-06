import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Building,
  Search,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const RecruiterManagement = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRecruiters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/recruiters');
      setRecruiters(res?.data || []);
    } catch (err) {
      toast.error('Failed to load recruiters directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const handleToggleStatus = async (recruiterId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      await api.patch(`/admin/users/${recruiterId}/status`, { isActive: newStatus });
      toast.success(`Recruiter account ${newStatus ? 'activated' : 'deactivated'} successfully`);
      setRecruiters(prev => prev.map(r => r._id === recruiterId ? { ...r, isActive: newStatus } : r));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update recruiter status');
    }
  };

  const filteredRecruiters = recruiters.filter(r => {
    return (
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return <LoadingSpinner message="Loading recruiter partners..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Building className="w-3.5 h-3.5" /> Hiring Partners
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Recruiter & Employer Management
          </h1>
          <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
            Oversee company talent acquisition partners, active job posting volumes, candidate traffic, and account activation privileges.
          </p>
        </div>

        <div className="bg-[#FAF9F6] border border-zinc-200 rounded-2xl p-4 flex items-center space-x-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-lg">
            {recruiters.length}
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Recruiter Partners</p>
            <p className="text-sm font-extrabold text-zinc-900">
              {recruiters.filter(r => r.isActive !== false).length} Active Accounts
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, email, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
        </div>
      </div>

      {/* Recruiters Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Recruiter / Contact</th>
                <th className="py-3.5 px-4">Company / Org</th>
                <th className="py-3.5 px-4">Active Jobs</th>
                <th className="py-3.5 px-4">Total Applicants</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredRecruiters.length > 0 ? (
                filteredRecruiters.map((r) => (
                  <tr key={r._id} className="hover:bg-zinc-50/60 transition-colors">
                    
                    {/* Recruiter Details */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-zinc-900 text-sm">{r.name}</p>
                        <p className="text-zinc-500 text-[11px]">{r.email}</p>
                        {r.phone && <p className="text-[10px] text-zinc-400 mt-0.5">{r.phone}</p>}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-zinc-800 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md text-[11px]">
                        {r.company}
                      </span>
                    </td>

                    {/* Active Jobs */}
                    <td className="py-3.5 px-4 font-bold text-zinc-900">
                      <span>{r.activeJobsCount} active</span>
                      <span className="text-zinc-400 font-normal"> / {r.totalJobsCount} total</span>
                    </td>

                    {/* Total Applicants */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-zinc-800 bg-zinc-100 px-2 py-1 rounded-md">
                        {r.totalApplicantsReceived} candidates
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        r.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {r.isActive !== false ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {r.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to="/admin/jobs"
                          className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-zinc-500" /> Jobs
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(r._id, r.isActive !== false)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            r.isActive !== false
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {r.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No recruiters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default RecruiterManagement;
