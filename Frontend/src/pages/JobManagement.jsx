import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Briefcase,
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Filter,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  GraduationCap,
  X,
  AlertTriangle,
  Users
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import toast from 'react-hot-toast';

const JobManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [skillsCatalog, setSkillsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('Hybrid');
  const [jobType, setJobType] = useState('Full Time');
  const [experience, setExperience] = useState('0-2 years');
  const [salary, setSalary] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('Active');
  const [description, setDescription] = useState('');

  // Education Fields
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [minGradYear, setMinGradYear] = useState('');
  const [minCgpa, setMinCgpa] = useState('');

  // Structured Skill Requirements state
  const [requirements, setRequirements] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [selectedImportance, setSelectedImportance] = useState('required');
  const [selectedProficiency, setSelectedProficiency] = useState(3);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [jobsRes, skillsRes] = await Promise.all([
        api.get('/jobs'),
        api.get('/skills')
      ]);

      const jobsData = jobsRes?.data?.jobs || jobsRes?.jobs || (Array.isArray(jobsRes) ? jobsRes : []);
      const skillsData = skillsRes?.data?.skills || skillsRes?.skills || (Array.isArray(skillsRes) ? skillsRes : []);

      setJobs(jobsData);
      setSkillsCatalog(skillsData);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load job management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingJobId(null);
    setTitle('');
    setCompanyName('');
    setLocation('');
    setWorkMode('Hybrid');
    setJobType('Full Time');
    setExperience('0-2 years');
    setSalary('');
    setApplicationUrl('');
    setDeadline('');
    setStatus('Active');
    setDescription('');
    setDegree('');
    setBranch('');
    setMinGradYear('');
    setMinCgpa('');
    setRequirements([]);
    setSelectedSkillId(skillsCatalog[0]?._id || '');
    setSelectedImportance('required');
    setSelectedProficiency(3);
    setIsModalOpen(true);
  };

  const openEditModal = (job) => {
    setEditingJobId(job._id);
    setTitle(job.title || '');
    setCompanyName(job.companyName || job.companyId?.name || '');
    setLocation(job.location || '');
    setWorkMode(job.workMode || 'Hybrid');
    setJobType(job.jobType || job.employmentType || 'Full Time');
    setExperience(job.experience || job.experienceLevel || '');
    setSalary(job.salary || job.salaryRange || '');
    setApplicationUrl(job.applicationUrl || job.sourceUrl || '');
    setDeadline(job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '');
    setStatus(job.status || 'Active');
    setDescription(job.description || '');

    const edu = job.educationRequirements || {};
    setDegree(edu.degree || '');
    setBranch(edu.branch || '');
    setMinGradYear(edu.minGraduationYear ? String(edu.minGraduationYear) : '');
    setMinCgpa(edu.minCgpa ? String(edu.minCgpa) : '');

    const existingReqs = (job.requirements || []).map(r => ({
      skillId: r.skillId?._id || r.skillId,
      skillName: r.skillId?.name || skillsCatalog.find(s => s._id === (r.skillId?._id || r.skillId))?.name || 'Skill',
      importance: r.importance || 'required',
      expectedProficiency: r.expectedProficiency || r.requiredProficiency || 3
    }));
    setRequirements(existingReqs);
    setSelectedSkillId(skillsCatalog[0]?._id || '');
    setIsModalOpen(true);
  };

  const handleAddRequirement = () => {
    if (!selectedSkillId) {
      toast.error('Please select a skill');
      return;
    }

    if (requirements.some(r => r.skillId === selectedSkillId)) {
      toast.error('Skill is already added to requirements');
      return;
    }

    const skillObj = skillsCatalog.find(s => s._id === selectedSkillId);
    setRequirements([
      ...requirements,
      {
        skillId: selectedSkillId,
        skillName: skillObj ? skillObj.name : 'Skill',
        importance: selectedImportance,
        expectedProficiency: Number(selectedProficiency)
      }
    ]);
  };

  const handleRemoveRequirement = (skillIdToRemove) => {
    setRequirements(requirements.filter(r => r.skillId !== skillIdToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !companyName.trim()) {
      toast.error('Title and Company Name are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        companyName: companyName.trim(),
        location: location.trim(),
        workMode,
        jobType,
        experience,
        salary: salary.trim(),
        applicationUrl: applicationUrl.trim() || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        status,
        description: description.trim(),
        educationRequirements: {
          degree: degree.trim() || undefined,
          branch: branch.trim() || undefined,
          minGraduationYear: minGradYear ? Number(minGradYear) : undefined,
          minCgpa: minCgpa ? Number(minCgpa) : undefined
        },
        requirements: requirements.map(r => ({
          skillId: r.skillId,
          importance: r.importance,
          expectedProficiency: r.expectedProficiency,
          requiredProficiency: r.expectedProficiency,
          required: r.importance === 'required'
        }))
      };

      if (editingJobId) {
        await api.put(`/jobs/${editingJobId}`, payload);
        toast.success('Job opportunity updated successfully!');
      } else {
        await api.post('/jobs', payload);
        toast.success('Job opportunity created successfully!');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Failed to save job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (job) => {
    const nextStatus = job.status === 'Active' ? 'Closed' : 'Active';
    try {
      await api.patch(`/jobs/${job._id}/status`, { status: nextStatus });
      toast.success(`Job marked as ${nextStatus}`);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/jobs/${jobId}`);
      toast.success('Job deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to delete job');
    }
  };

  if (loading) return <LoadingSpinner message="Loading job management workspace..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const filteredJobs = jobs.filter(j => {
    const matchesSearch =
      (j.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.companyName || j.companyId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (j.status || 'Active').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Requirement visual bucket groups
  const requiredReqs = requirements.filter(r => r.importance === 'required');
  const importantReqs = requirements.filter(r => r.importance === 'important');
  const niceToHaveReqs = requirements.filter(r => r.importance === 'nice_to_have' || r.importance === 'nice to have');

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="border-b border-zinc-200/80 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
            Manager & Admin Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight mt-1">
            Job Architecture & Requirements
          </h1>
          <p className="text-xs text-zinc-500 font-semibold">
            Define open engineering roles, education criteria, and structured graph skill requirements.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Job</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by title, company, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {['all', 'active', 'draft', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Catalog Table */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                <th className="py-4 px-6">Role & Company</th>
                <th className="py-4 px-6">Work Mode</th>
                <th className="py-4 px-6">Experience / Salary</th>
                <th className="py-4 px-6">Skill Requirements</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 font-semibold italic">
                    No job listings found matching query.
                  </td>
                </tr>
              ) : (
                filteredJobs.map(job => (
                  <tr key={job._id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-zinc-900">{job.title}</div>
                      <div className="text-[11px] text-zinc-500 font-semibold flex items-center gap-1.5 mt-0.5">
                        <span className="text-indigo-600 font-bold">{job.companyName || job.companyId?.name || 'Company'}</span>
                        <span>&bull;</span>
                        <span>{job.location || 'Location'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-100 font-bold text-[10px] text-zinc-700 uppercase">
                        {job.workMode || 'Hybrid'}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-zinc-800">{job.experience || job.experienceLevel || '0-2 yrs'}</div>
                      <div className="text-[10px] text-zinc-400">{job.salary || job.salaryRange || 'Competitive'}</div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-bold text-zinc-700 bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[11px]">
                        {(job.requirements || []).length} skills defined
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(job)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                          job.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {job.status || 'Active'}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/applicants?jobId=${job._id}`}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Applicants for this Role"
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/jobs/${job._id}`}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Detail & Prerequisite Analysis"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(job)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Job"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(job._id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create & Edit Job with Dynamic Requirements */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 my-8 space-y-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                  {editingJobId ? 'Edit Job Opportunity' : 'Post New Engineering Role'}
                </h3>
                <p className="text-xs text-zinc-500">Configure core attributes, education constraints, and structured skill requirements.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Section 1: Basic Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700">1. Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Job Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software Engineer"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Microsoft"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Work Mode</label>
                    <select
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Job Type</label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Experience</label>
                    <input
                      type="text"
                      placeholder="e.g. 0–2 years"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Salary Range</label>
                    <input
                      type="text"
                      placeholder="e.g. 8–12 LPA"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1 text-xs">Job Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide overview of duties, mission, and scope..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 2: Education Requirements (Optional) */}
              <div className="space-y-3 pt-2 border-t border-zinc-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" /> 2. Education Requirements (Optional)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Degree</label>
                    <input
                      type="text"
                      placeholder="B.Tech, B.E., M.S."
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Branch</label>
                    <input
                      type="text"
                      placeholder="CS, IT, Circuit"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Min Grad Year</label>
                    <input
                      type="number"
                      placeholder="2024"
                      value={minGradYear}
                      onChange={(e) => setMinGradYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Min CGPA</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="7.0"
                      value={minCgpa}
                      onChange={(e) => setMinCgpa(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Structured Skill Requirements (Prompt Section 12 & 13) */}
              <div className="space-y-4 pt-2 border-t border-zinc-100">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> 3. Structured Skill Requirements
                  </h4>
                  <span className="text-[11px] text-zinc-400 font-semibold">Select from Skill Catalog</span>
                </div>

                {/* Add Requirement Control Row */}
                <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-zinc-200/90 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="font-bold text-zinc-700 block mb-1 text-[11px]">Skill</label>
                    <select
                      value={selectedSkillId}
                      onChange={(e) => setSelectedSkillId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Select Skill --</option>
                      {skillsCatalog.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.category || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="font-bold text-zinc-700 block mb-1 text-[11px]">Importance</label>
                    <select
                      value={selectedImportance}
                      onChange={(e) => setSelectedImportance(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="required">Required</option>
                      <option value="important">Important</option>
                      <option value="nice_to_have">Nice to Have</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-zinc-700 block mb-1 text-[11px]">Proficiency</label>
                    <select
                      value={selectedProficiency}
                      onChange={(e) => setSelectedProficiency(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value={1}>1 / 5</option>
                      <option value={2}>2 / 5</option>
                      <option value={3}>3 / 5</option>
                      <option value={4}>4 / 5</option>
                      <option value={5}>5 / 5</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Visual Requirement Buckets (Prompt Section 13) */}
                <div className="space-y-4 pt-1">
                  
                  {/* Bucket 1: REQUIRED */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                      Required ({requiredReqs.length})
                    </span>
                    {requiredReqs.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 italic bg-zinc-50 p-2 rounded-xl border border-zinc-100">None added yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {requiredReqs.map(r => (
                          <div key={r.skillId} className="flex items-center justify-between p-2.5 bg-rose-50/40 rounded-xl border border-rose-100 text-xs">
                            <span className="font-bold text-zinc-900">{r.skillName}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-rose-700">{r.expectedProficiency}/5</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveRequirement(r.skillId)}
                                className="text-zinc-400 hover:text-rose-600 p-1"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bucket 2: IMPORTANT */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                      Important ({importantReqs.length})
                    </span>
                    {importantReqs.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 italic bg-zinc-50 p-2 rounded-xl border border-zinc-100">None added yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {importantReqs.map(r => (
                          <div key={r.skillId} className="flex items-center justify-between p-2.5 bg-amber-50/40 rounded-xl border border-amber-100 text-xs">
                            <span className="font-bold text-zinc-900">{r.skillName}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-amber-700">{r.expectedProficiency}/5</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveRequirement(r.skillId)}
                                className="text-zinc-400 hover:text-amber-600 p-1"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bucket 3: NICE TO HAVE */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                      Nice to Have ({niceToHaveReqs.length})
                    </span>
                    {niceToHaveReqs.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 italic bg-zinc-50 p-2 rounded-xl border border-zinc-100">None added yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {niceToHaveReqs.map(r => (
                          <div key={r.skillId} className="flex items-center justify-between p-2.5 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs">
                            <span className="font-bold text-zinc-900">{r.skillName}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-indigo-700">{r.expectedProficiency}/5</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveRequirement(r.skillId)}
                                className="text-zinc-400 hover:text-indigo-600 p-1"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>{submitting ? 'Saving...' : editingJobId ? 'Update Job' : 'Publish Job'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default JobManagement;
