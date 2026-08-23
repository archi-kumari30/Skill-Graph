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
  BookOpen
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import ProgressBar from '../components/ProgressBar';

const MySkills = () => {
  const { user } = useAuth();
  const [userSkills, setUserSkills] = useState([]);
  const [globalSkills, setGlobalSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & form fields
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [selectedSkill, setSelectedSkill] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [proficiency, setProficiency] = useState(1);
  const [yearsOfExperience, setYearsOfExperience] = useState(1);

  // Custom new skill creation
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Frontend');
  const [newSkillDesc, setNewSkillDesc] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get user inventory
      const userRes = await api.get(`/users/${user._id}/skills`);
      setUserSkills(userRes.data.skills || []);

      // Get global skill catalog
      const globalRes = await api.get('/skills');
      setGlobalSkills(globalRes.data.skills || []);
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
      fetchInventory();
    } catch (err) {
      alert(err.message || 'Skill already linked to profile.');
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
      fetchInventory();
    } catch (err) {
      alert(err.message || 'Failed to edit proficiency level.');
    }
  };

  const handleDeleteRelation = async (skillId) => {
    if (!window.confirm('Remove this skill from your profile?')) return;
    try {
      await api.delete(`/users/${user._id}/skills/${skillId}`);
      fetchInventory();
    } catch (err) {
      alert(err.message || 'Failed to delete relation.');
    }
  };

  const handleCreateGlobalSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName) return;
    try {
      const res = await api.post('/skills', {
        name: newSkillName,
        category: newSkillCategory,
        description: newSkillDesc
      });
      // Set newly created skill as active selection
      setSelectedSkill(res.data.skill);
      setIsCreateOpen(false);
      setNewSkillName('');
      setNewSkillDesc('');
      fetchInventory();
      setIsAddOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to create skill catalog entry.');
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

  // Category Color Map helper
  const getCategoryTheme = (cat) => {
    const lower = cat.toLowerCase();
    if (lower.includes('front')) return 'bg-indigo-50 border-indigo-100 text-indigo-700';
    if (lower.includes('back')) return 'bg-purple-50 border-purple-100 text-purple-700';
    if (lower.includes('database') || lower.includes('data')) return 'bg-sky-50 border-sky-100 text-sky-750';
    if (lower.includes('devops') || lower.includes('cloud')) return 'bg-teal-50 border-teal-100 text-teal-700';
    return 'bg-slate-50 border-slate-200 text-slate-655';
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* 1. Header with Add Trigger button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm bg-grid-pattern">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Your Skill Universe</h2>
          <p className="text-xs text-slate-450 font-semibold">Visual list of your current professional competencies and rating values.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Link
            to="/skill-graph"
            className="px-4 py-2.5 border border-indigo-150 bg-white hover:bg-slate-50 text-indigo-650 rounded-xl text-xs font-bold transition-all flex items-center cursor-pointer"
          >
            Explore Skills
          </Link>
          <button
            onClick={() => {
              setSelectedSkill(null);
              setSearchQuery('');
              setProficiency(1);
              setYearsOfExperience(1);
              setIsAddOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 flex items-center transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Skill
          </button>
        </div>
      </div>

      {/* 2. Visual Skill Card Nodes Grid */}
      {userSkills.length === 0 ? (
        <div className="bg-white border border-slate-200/50 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
          <Award className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-800">Your Universe is Empty</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            You haven't logged any skills yet. Link competencies from our catalog to get started.
          </p>
          <button
            onClick={() => {
              setSelectedSkill(null);
              setSearchQuery('');
              setIsAddOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Link First Skill
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {userSkills.map((us) => {
            if (!us.skillId) return null;
            const skillId = us.skillId?._id || us.skillId;
            const categoryTheme = getCategoryTheme(us.skillId?.category || 'General');
            return (
              <div
                key={us._id}
                className="bg-white border border-slate-250/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] flex flex-col justify-between space-y-4"
              >
                {/* Badge Category & Actions */}
                <div className="flex justify-between items-start">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${categoryTheme}`}>
                    {us.skillId?.category || 'General'}
                  </span>
                  
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        setSelectedSkill(us);
                        setProficiency(us.proficiency);
                        setYearsOfExperience(us.yearsOfExperience);
                        setIsEditOpen(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors"
                      title="Adjust Level"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRelation(skillId)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove Relation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 tracking-tight text-sm">
                    {us.skillId?.name}
                  </h4>
                  {us.skillId?.description && (
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {us.skillId?.description}
                    </p>
                  )}
                </div>

                {/* Rating indicators & Experience */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1 text-slate-450 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{us.yearsOfExperience} yrs</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ProgressBar value={us.proficiency} max={5} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD RELATIONSHIP */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 border border-slate-200/50 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">Link Skill to Profile</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-450 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRelation} className="space-y-4 text-xs font-semibold text-slate-655">
              {/* Select Skill Catalog Item */}
              <div className="space-y-2">
                <label className="block uppercase tracking-wider text-[9px] font-bold text-slate-450">Search catalog</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search database skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-350 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* List filtered results to select */}
              <div className="border border-slate-100 rounded-xl max-h-36 overflow-y-auto p-2 bg-slate-50 space-y-1">
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
                        : 'hover:bg-slate-200/60 text-slate-700'
                    }`}
                  >
                    <span>{gs.name}</span>
                    <span className="text-[9px] opacity-80 uppercase font-bold">{gs.category}</span>
                  </button>
                ))}
                {filteredGlobalSkills.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic p-3 text-center">No unlinked skills match query.</p>
                )}
              </div>

              {/* Option to create new if missing */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setIsCreateOpen(true);
                  }}
                  className="inline-flex items-center text-[10px] text-indigo-650 hover:underline"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  Create missing catalog skill
                </button>
              </div>

              {/* Select Proficiency and Experience */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block uppercase tracking-wider text-[9px] font-bold text-slate-455">Proficiency (1-5)</label>
                  <select
                    value={proficiency}
                    onChange={(e) => setProficiency(Number(e.target.value))}
                    className="w-full p-2 border border-slate-350 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  >
                    {[1, 2, 3, 4, 5].map(v => (
                      <option key={v} value={v}>Level {v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block uppercase tracking-wider text-[9px] font-bold text-slate-455">Experience (years)</label>
                  <input
                    type="number"
                    min="1"
                    max="45"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                    className="w-full p-2 border border-slate-355 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedSkill}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg"
                >
                  Add Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST PROFICIENCY */}
      {isEditOpen && selectedSkill && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 border border-slate-200/50 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">Adjust Proficiency Level</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-450 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditRelation} className="space-y-4 text-xs font-semibold text-slate-655">
              <p className="font-bold text-slate-700">Adjusting settings for: <strong className="text-indigo-650">{selectedSkill.skillId?.name}</strong></p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block uppercase tracking-wider text-[9px] font-bold text-slate-455">Proficiency (1-5)</label>
                  <select
                    value={proficiency}
                    onChange={(e) => setProficiency(Number(e.target.value))}
                    className="w-full p-2 border border-slate-350 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  >
                    {[1, 2, 3, 4, 5].map(v => (
                      <option key={v} value={v}>Level {v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block uppercase tracking-wider text-[9px] font-bold text-slate-455">Experience (years)</label>
                  <input
                    type="number"
                    min="1"
                    max="45"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                    className="w-full p-2 border border-slate-355 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE GLOBAL CATALOG ENTRY */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 border border-slate-200/50 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">Create New Catalog Item</h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsAddOpen(true);
                }}
                className="text-slate-450 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGlobalSkill} className="space-y-4 text-xs font-semibold text-slate-655">
              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-[9px] font-bold text-slate-455">Skill Name</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js, Docker, Ruby"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full p-2.5 border border-slate-350 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-[9px] font-bold text-slate-455">Category</label>
                <select
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-350 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                >
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Database">Database</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Tools">Tools</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-[9px] font-bold text-slate-455">Description</label>
                <textarea
                  placeholder="Briefly describe what this skill entails..."
                  value={newSkillDesc}
                  onChange={(e) => setNewSkillDesc(e.target.value)}
                  rows="3"
                  className="w-full p-2.5 border border-slate-350 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsAddOpen(true);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Create Catalog Item
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
