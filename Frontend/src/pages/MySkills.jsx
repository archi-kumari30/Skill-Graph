import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Award,
  Search,
  Plus,
  Trash2,
  Edit2,
  Clock,
  X,
  PlusCircle,
  HelpCircle,
  FolderPlus,
  BookOpen,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import ProgressBar from '../components/ProgressBar';
import toast from 'react-hot-toast';

const PROFICIENCY_NAMES = {
  1: 'Novice',
  2: 'Familiar',
  3: 'Competent',
  4: 'Advanced',
  5: 'Expert'
};

const MySkills = () => {
  const { user } = useAuth();
  const [userSkills, setUserSkills] = useState([]);
  const [globalSkills, setGlobalSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals & form fields
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [selectedSkill, setSelectedSkill] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [proficiency, setProficiency] = useState(2);
  const [yearsOfExperience, setYearsOfExperience] = useState(1);

  // Custom new skill creation
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Frontend');
  const [newSkillDesc, setNewSkillDesc] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [userRes, globalRes, projRes] = await Promise.all([
        api.get(`/users/${user._id}/skills`),
        api.get('/skills'),
        api.get('/projects').catch(() => ({ data: [] }))
      ]);

      setUserSkills(userRes.data?.skills || userRes.data || []);
      setGlobalSkills(globalRes.data?.skills || globalRes.data || []);
      setProjects(projRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve skill profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchInventory();
    }
  }, [user]);

  const handleAddRelation = async (e) => {
    e.preventDefault();
    if (!selectedSkill) return;
    try {
      await api.post(`/users/${user._id}/skills`, {
        skillId: selectedSkill._id,
        proficiency,
        yearsOfExperience
      });
      setIsAddOpen(false);
      setSelectedSkill(null);
      setSearchQuery('');
      toast.success('Skill added to profile!');
      fetchInventory();
    } catch (err) {
      toast.error(err.message || 'Skill already linked to profile.');
    }
  };

  const handleEditRelation = async (e) => {
    e.preventDefault();
    if (!selectedSkill) return;
    try {
      const skillId = selectedSkill.skillId?._id || selectedSkill.skillId;
      await api.put(`/users/${user._id}/skills/${skillId}`, {
        proficiency,
        yearsOfExperience
      });
      setIsEditOpen(false);
      setSelectedSkill(null);
      toast.success('Skill proficiency updated!');
      fetchInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to edit proficiency level.');
    }
  };

  const handleDeleteRelation = async (skillId) => {
    if (!window.confirm('Remove this skill from your profile?')) return;
    try {
      await api.delete(`/users/${user._id}/skills/${skillId}`);
      toast.success('Skill removed from profile.');
      fetchInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to delete relation.');
    }
  };

  const handleCreateGlobalSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName) return;
    try {
      const res = await api.post('/skills', {
        name: newSkillName,
        category: newSkillCategory,
        description: newSkillDesc,
        isPersonal: true
      });
      setSelectedSkill(res.data?.skill || res.data);
      setIsCreateOpen(false);
      setNewSkillName('');
      setNewSkillDesc('');
      toast.success('Skill created in catalog!');
      fetchInventory();
      setIsAddOpen(true);
    } catch (err) {
      toast.error(err.message || 'Failed to create skill catalog entry.');
    }
  };

  if (loading) return <LoadingSpinner message="Opening your skill inventory database..." />;
  if (error) return <ErrorState message={error} onRetry={fetchInventory} />;

  // Filter out skills user already has
  const availableGlobalSkills = globalSkills.filter(
    (gs) => !userSkills.some((us) => {
      const sId = us.skillId?._id || us.skillId;
      return sId && sId.toString() === gs._id.toString();
    })
  );

  const filteredGlobalSkills = availableGlobalSkills.filter((gs) =>
    gs.name && gs.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Categories
  const categories = ['All', ...new Set(userSkills.map(us => us.skillId?.category).filter(Boolean))];

  const displayedUserSkills = selectedCategory === 'All'
    ? userSkills
    : userSkills.filter(us => us.skillId?.category === selectedCategory);

  // Map project count per skill
  const skillProjectCountMap = {};
  projects.forEach(p => {
    (p.skillsUsed || []).forEach(s => {
      const sId = (s._id || s).toString();
      skillProjectCountMap[sId] = (skillProjectCountMap[sId] || 0) + 1;
    });
  });

  const verifiedSkillsCount = userSkills.filter(us => us.verified || us.verificationStatus === 'verified').length;

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-200">
      
      {/* 1. Header with Stats & Add Trigger */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" /> Verified Inventory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            My Skills & Competencies
          </h1>
          <p className="text-sm text-zinc-600">
            Maintain your skill inventory, verify self-reported proficiencies through targeted assessments, and connect code evidence to elevate your Career Readiness Score.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/assessments"
            className="px-4 py-2.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" /> Verify All
          </Link>
          <button
            onClick={() => {
              setSelectedSkill(null);
              setSearchQuery('');
              setProficiency(2);
              setYearsOfExperience(1);
              setIsAddOpen(true);
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-indigo-200 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Skill
          </button>
        </div>
      </div>

      {/* 2. Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Logged</p>
          <p className="text-2xl font-black text-zinc-900">{userSkills.length}</p>
          <span className="text-[11px] text-zinc-500 font-semibold">Active proficiencies</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Verified Badges</p>
          <p className="text-2xl font-black text-emerald-600">{verifiedSkillsCount}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">
            {userSkills.length > 0 ? Math.round((verifiedSkillsCount / userSkills.length) * 100) : 0}% verified
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mastered (4-5)</p>
          <p className="text-2xl font-black text-indigo-600">
            {userSkills.filter(s => s.proficiency >= 4).length}
          </p>
          <span className="text-[11px] text-zinc-500 font-semibold">Advanced & Expert</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Growing (1-3)</p>
          <p className="text-2xl font-black text-amber-600">
            {userSkills.filter(s => s.proficiency < 4).length}
          </p>
          <span className="text-[11px] text-zinc-500 font-semibold">In active development</span>
        </div>
      </div>

      {/* Category Tabs */}
      {categories.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* 3. Skills Cards Grid */}
      {displayedUserSkills.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200/90 shadow-xs space-y-4 max-w-md mx-auto">
          <Award className="w-12 h-12 text-zinc-300 mx-auto" />
          <h3 className="font-extrabold text-base text-zinc-900">No skills matching this view</h3>
          <p className="text-xs text-zinc-500">
            Add skills from our comprehensive catalog to start building your career profile.
          </p>
          <button
            onClick={() => {
              setSelectedSkill(null);
              setSearchQuery('');
              setIsAddOpen(true);
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            Add Your First Skill
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedUserSkills.map((us) => {
            if (!us.skillId) return null;
            const skillId = us.skillId?._id || us.skillId;
            const isVerified = us.verified || us.verificationStatus === 'verified';
            const projectCount = skillProjectCountMap[skillId.toString()] || 0;

            return (
              <div
                key={us._id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between p-6 space-y-5 ${
                  isVerified
                    ? 'border-emerald-200/80 shadow-xs'
                    : 'border-zinc-200/90 hover:border-zinc-300 hover:shadow-xs'
                }`}
              >
                {/* Header: Category & Actions */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 uppercase tracking-wider">
                      {us.skillId?.category || 'Skill'}
                    </span>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setSelectedSkill(us);
                          setProficiency(us.proficiency);
                          setYearsOfExperience(us.yearsOfExperience);
                          setIsEditOpen(true);
                        }}
                        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                        title="Edit Level"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRelation(skillId)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove Skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Skill Name & Description */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-zinc-900 leading-snug">
                        {us.skillId?.name}
                      </h3>
                      {isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" title="Officially Verified Skill" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                      {us.skillId?.description || 'Core technology competency.'}
                    </p>
                  </div>
                </div>

                {/* Rating Bar & Badges */}
                <div className="space-y-3 pt-3 border-t border-zinc-100">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-zinc-700">{PROFICIENCY_NAMES[us.proficiency]} (Level {us.proficiency}/5)</span>
                      <span className="text-indigo-600 font-extrabold">{Math.round((us.proficiency / 5) * 100)}%</span>
                    </div>
                    <ProgressBar value={us.proficiency} max={5} />
                  </div>

                  {/* Verification Pill & Evidence Row */}
                  <div className="flex flex-col gap-2 pt-1 text-[11px] font-semibold">
                    <div className="flex items-center justify-between">
                      {isVerified ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified via Assessment
                        </span>
                      ) : (
                        <span className="text-zinc-500 bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-full font-bold">
                          Unverified
                        </span>
                      )}

                      {projectCount > 0 ? (
                        <span className="text-zinc-500">
                          📁 {projectCount} project{projectCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <Link to="/projects" className="text-zinc-400 hover:text-indigo-600">
                          + Link Project
                        </Link>
                      )}
                    </div>

                    {!isVerified && (
                      <Link
                        to="/assessments"
                        className="w-full text-center py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Take Assessment to Verify
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD SKILL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-extrabold text-zinc-900 text-base">Add Skill to Profile</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-zinc-400 hover:text-zinc-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRelation} className="space-y-4 text-xs font-semibold text-zinc-700">
              <div className="space-y-2">
                <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-400">Search Catalog</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search database skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>

              {/* Filtered Results */}
              <div className="border border-zinc-200 rounded-xl max-h-40 overflow-y-auto p-1.5 bg-zinc-50 space-y-1">
                {filteredGlobalSkills.map((gs) => (
                  <button
                    key={gs._id}
                    type="button"
                    onClick={() => {
                      setSelectedSkill(gs);
                      setSearchQuery(gs.name);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex justify-between items-center ${
                      selectedSkill?._id === gs._id
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'hover:bg-zinc-200/70 text-zinc-800'
                    }`}
                  >
                    <span>{gs.name}</span>
                    <span className="text-[10px] uppercase font-bold opacity-75">{gs.category}</span>
                  </button>
                ))}
                {filteredGlobalSkills.length === 0 && (
                  <p className="text-[11px] text-zinc-400 italic p-3 text-center">No catalog match found.</p>
                )}
              </div>

              {/* Create personal skill shortcut */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setNewSkillName(searchQuery);
                    setIsCreateOpen(true);
                  }}
                  className="inline-flex items-center text-[11px] text-indigo-600 hover:underline font-bold"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  + Create custom skill entry
                </button>
              </div>

              {/* Proficiency selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-400">Proficiency (1-5)</label>
                  <select
                    value={proficiency}
                    onChange={(e) => setProficiency(Number(e.target.value))}
                    className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 bg-white"
                  >
                    {[1, 2, 3, 4, 5].map(v => (
                      <option key={v} value={v}>Level {v} - {PROFICIENCY_NAMES[v]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-400">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                    className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-xl text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedSkill}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold"
                >
                  Add Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PROFICIENCY */}
      {isEditOpen && selectedSkill && (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-extrabold text-zinc-900 text-base">Adjust Proficiency</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-zinc-400 hover:text-zinc-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditRelation} className="space-y-4 text-xs font-semibold text-zinc-700">
              <p className="font-bold text-zinc-800">
                Updating: <span className="text-indigo-600">{selectedSkill.skillId?.name}</span>
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-400">Proficiency (1-5)</label>
                  <select
                    value={proficiency}
                    onChange={(e) => setProficiency(Number(e.target.value))}
                    className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 bg-white"
                  >
                    {[1, 2, 3, 4, 5].map(v => (
                      <option key={v} value={v}>Level {v} - {PROFICIENCY_NAMES[v]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-400">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                    className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-xl text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE CUSTOM SKILL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-extrabold text-zinc-900 text-base">Create Custom Skill</h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsAddOpen(true);
                }}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGlobalSkill} className="space-y-4 text-xs font-semibold text-zinc-700">
              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-400">Skill Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Astro, Redis, GraphQL"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-400">Category *</label>
                <select
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                  className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 bg-white"
                >
                  <option value="Programming">Programming</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Database">Database</option>
                  <option value="Tools">Tools</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Computer Science Fundamentals">Computer Science Fundamentals</option>
                  <option value="AI / ML">AI / ML</option>
                  <option value="Cloud">Cloud</option>
                  <option value="Security">Security</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-bold text-zinc-400">Description</label>
                <textarea
                  rows={3}
                  placeholder="Explain what this technology entails..."
                  value={newSkillDesc}
                  onChange={(e) => setNewSkillDesc(e.target.value)}
                  className="w-full p-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 bg-white"
                />
              </div>

              <div className="pt-2 border-t border-zinc-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsAddOpen(true);
                  }}
                  className="px-4 py-2 border border-zinc-300 rounded-xl text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Create Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MySkills;
