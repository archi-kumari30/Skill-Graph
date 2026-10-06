import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Users,
  Calendar,
  Trash2,
  Power,
  ExternalLink,
  X
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import toast from 'react-hot-toast';

const CollegeManagement = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    website: ''
  });

  const fetchColleges = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/colleges', { params });
      const data = res?.data?.data?.colleges || res?.data?.colleges || res?.data || [];
      setColleges(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to retrieve colleges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchColleges();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleToggleStatus = async (college) => {
    const newStatus = college.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/colleges/${college._id}/status`, { status: newStatus });
      toast.success(`College "${college.name}" marked as ${newStatus}`);
      setColleges(prev =>
        prev.map(c => (c._id === college._id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update college status');
    }
  };

  const handleDelete = async (collegeId, collegeName) => {
    if (!window.confirm(`Are you sure you want to remove "${collegeName}" from the platform directory?`)) {
      return;
    }
    try {
      await api.delete(`/colleges/${collegeId}`);
      toast.success('College removed successfully');
      setColleges(prev => prev.filter(c => c._id !== collegeId));
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to delete college');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.error('College name is required');
    }

    try {
      setSubmitting(true);
      const res = await api.post('/colleges', {
        name: formData.name.trim(),
        location: formData.location.trim() || 'India',
        website: formData.website.trim()
      });

      const newCollege = res?.data?.data?.college || res?.data?.college || res?.data;
      toast.success('College registered successfully!');
      setShowAddModal(false);
      setFormData({ name: '', location: '', website: '' });
      fetchColleges();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to register college');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredColleges = colleges.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchName = (c.name || '').toLowerCase().includes(term);
    const matchLoc = (c.location || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return (matchName || matchLoc) && matchStatus;
  });

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <GraduationCap className="w-3.5 h-3.5" /> Platform Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Manage Colleges & Partner Institutions
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Maintain authorized academic institutions, inspect enrolled student counts, and manage campus affiliations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add College</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search institutions by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status:</span>
          {['all', 'active', 'inactive'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Colleges Table */}
      {loading ? (
        <LoadingSpinner message="Retrieving registered colleges and student enrollment aggregates..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchColleges} />
      ) : filteredColleges.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200/80 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <Building2 className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="font-extrabold text-zinc-800 text-base">No Colleges Found</h3>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            {searchTerm || statusFilter !== 'all'
              ? 'No registered institutions match your current search and filter settings.'
              : 'No partner institutions registered yet. Click "Add College" to create the first one.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs divide-y divide-zinc-100">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3.5 bg-zinc-50/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <div className="col-span-4">College Name & Website</div>
            <div className="col-span-3">Location</div>
            <div className="col-span-2 text-center">Enrolled Students</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {filteredColleges.map((col) => {
            const dateStr = col.createdAt
              ? new Date(col.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A';

            return (
              <div
                key={col._id}
                className="p-5 sm:p-6 hover:bg-zinc-50/40 transition-colors flex flex-col lg:grid lg:grid-cols-12 gap-4 items-start lg:items-center"
              >
                {/* College Name */}
                <div className="lg:col-span-4 space-y-1 w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-zinc-900 text-sm">{col.name}</span>
                  </div>
                  {col.website ? (
                    <a
                      href={col.website.startsWith('http') ? col.website : `https://${col.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{col.website}</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Added {dateStr}
                    </span>
                  )}
                </div>

                {/* Location */}
                <div className="lg:col-span-3 space-y-1 w-full">
                  <span className="text-xs font-semibold text-zinc-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{col.location || 'India'}</span>
                  </span>
                </div>

                {/* Enrolled Students */}
                <div className="lg:col-span-2 text-left lg:text-center w-full">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold">
                    <Users className="w-3 h-3 text-indigo-500" />
                    <span>{col.studentCount || 0} students</span>
                  </span>
                </div>

                {/* Status Badge */}
                <div className="lg:col-span-1 text-left lg:text-center w-full">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      col.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    {col.status}
                  </span>
                </div>

                {/* Action Controls */}
                <div className="lg:col-span-2 flex items-center justify-start lg:justify-end gap-2 w-full">
                  <button
                    onClick={() => handleToggleStatus(col)}
                    title={col.status === 'active' ? 'Deactivate College' : 'Activate College'}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      col.status === 'active'
                        ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{col.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(col._id, col.name)}
                    title="Delete College"
                    className="p-1.5 rounded-xl hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add College Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-100 space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-zinc-900 text-sm">Register Partner Institution</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">
                  College / University Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parul University, VIT, IIT Bombay"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Location (City, State)</label>
                <input
                  type="text"
                  placeholder="e.g. Vadodara, Gujarat"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Official Website URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://www.example.edu"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-bold hover:bg-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Add College'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CollegeManagement;
