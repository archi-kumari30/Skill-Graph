import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  FolderGit2,
  Plus,
  Github,
  ExternalLink,
  Trash2,
  Edit2,
  Award,
  Sparkles,
  Layers,
  CheckCircle2,
  X,
  Code
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technologies: '',
    skillsUsed: [],
    githubUrl: '',
    liveUrl: '',
    difficulty: 'intermediate',
    highlights: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, skillsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/skills')
      ]);

      setProjects(projRes?.data || []);
      setAllSkills(skillsRes?.data?.skills || skillsRes?.data || []);
    } catch (err) {
      toast.error('Failed to load project evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (project = null) => {
    if (project) {
      setEditingId(project._id);
      setFormData({
        title: project.title,
        description: project.description,
        technologies: (project.technologies || []).join(', '),
        skillsUsed: (project.skillsUsed || []).map(s => s._id || s),
        githubUrl: project.githubUrl || '',
        liveUrl: project.liveUrl || '',
        difficulty: project.difficulty || 'intermediate',
        highlights: (project.highlights || []).join('\n')
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        technologies: '',
        skillsUsed: [],
        githubUrl: '',
        liveUrl: '',
        difficulty: 'intermediate',
        highlights: ''
      });
    }
    setModalOpen(true);
  };

  const handleToggleSkillTag = (skillId) => {
    setFormData(prev => {
      const exists = prev.skillsUsed.includes(skillId);
      return {
        ...prev,
        skillsUsed: exists
          ? prev.skillsUsed.filter(id => id !== skillId)
          : [...prev.skillsUsed, skillId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formData.title,
        description: formData.description,
        technologies: formData.technologies.split(',').map(s => s.trim()).filter(Boolean),
        skillsUsed: formData.skillsUsed,
        githubUrl: formData.githubUrl,
        liveUrl: formData.liveUrl,
        difficulty: formData.difficulty,
        highlights: formData.highlights.split('\n').map(s => s.trim()).filter(Boolean)
      };

      if (editingId) {
        await api.put(`/projects/${editingId}`, payload);
        toast.success('Project updated successfully');
      } else {
        await api.post('/projects', payload);
        toast.success('Project added to evidence portfolio');
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project removed');
      setProjects(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading tangible project portfolio..." />;
  }

  // Count distinct skills backed by projects
  const backedSkillSet = new Set();
  projects.forEach(p => {
    (p.skillsUsed || []).forEach(s => {
      backedSkillSet.add(s._id || s);
    });
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Tangible Skill Evidence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Project Portfolio
          </h1>
          <p className="text-sm text-zinc-600">
            Link code repositories and live applications directly to your skills. Demonstrating hands-on project evidence provides undeniable proof of competence for employers.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Project Evidence
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Projects</p>
          <p className="text-2xl font-black text-zinc-900">{projects.length}</p>
          <span className="text-xs text-zinc-500 font-semibold">In your personal portfolio</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Skills Proven by Code</p>
          <p className="text-2xl font-black text-indigo-600">{backedSkillSet.size} Technologies</p>
          <span className="text-xs text-zinc-500 font-semibold">Backed by repository commits</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Live Deployments</p>
          <p className="text-2xl font-black text-emerald-600">
            {projects.filter(p => p.liveUrl).length} Live Apps
          </p>
          <span className="text-xs text-zinc-500 font-semibold">Accessible to hiring managers</span>
        </div>
      </div>

      {/* Project Cards Grid */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200/90 shadow-xs space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
            <FolderGit2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-zinc-900">No project evidence logged yet</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Add your first GitHub repository or deployed project to tag technologies and prove your competence.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(project => (
            <div
              key={project._id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/90 shadow-xs flex flex-col justify-between space-y-6 hover:border-zinc-300 transition-all"
            >
              <div className="space-y-4">
                {/* Top Row: Title, Difficulty, Actions */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-extrabold text-lg text-zinc-900 leading-snug">
                      {project.title}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 uppercase tracking-wide">
                      {project.difficulty} project
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenModal(project)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {project.description}
                </p>

                {/* Highlights */}
                {project.highlights?.length > 0 && (
                  <ul className="text-xs text-zinc-700 space-y-1 list-disc list-inside font-medium bg-zinc-50 p-3 rounded-xl border border-zinc-150">
                    {project.highlights.map((h, idx) => (
                      <li key={idx}>{h}</li>
                    ))}
                  </ul>
                )}

                {/* Linked Skills Badges */}
                {project.skillsUsed?.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Skills Proven
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.skillsUsed.map(skill => (
                        <span
                          key={skill._id || skill}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                          {skill.name || 'Skill'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technologies List */}
                {project.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 text-[11px] text-zinc-500 font-semibold">
                    {project.technologies.map((tech, idx) => (
                      <span key={idx} className="bg-zinc-100 px-2 py-0.5 rounded-md">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Links Row */}
              <div className="flex items-center space-x-3 pt-4 border-t border-zinc-100">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" /> Repository
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-zinc-200">
            
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <h2 className="text-lg font-extrabold text-zinc-900">
                {editingId ? 'Edit Project Evidence' : 'Add Project Evidence'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Distributed Task Scheduler"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 text-xs sm:text-sm bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain what the system does, architectural trade-offs, and key features..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 text-xs sm:text-sm bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Technologies (Comma Separated)
                </label>
                <input
                  type="text"
                  value={formData.technologies}
                  onChange={e => setFormData({ ...formData, technologies: e.target.value })}
                  placeholder="React, Express, Redis, Docker, Tailwind"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 text-xs sm:text-sm bg-white"
                />
              </div>

              {/* Tag Skills Used */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Tag Skills Proven by this Project
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-zinc-50 rounded-xl border border-zinc-200">
                  {allSkills.map(skill => {
                    const isSelected = formData.skillsUsed.includes(skill._id);
                    return (
                      <button
                        key={skill._id}
                        type="button"
                        onClick={() => handleToggleSkillTag(skill._id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={e => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 text-xs sm:text-sm bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Live Demo URL
                  </label>
                  <input
                    type="url"
                    value={formData.liveUrl}
                    onChange={e => setFormData({ ...formData, liveUrl: e.target.value })}
                    placeholder="https://myapp.vercel.app"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 text-xs sm:text-sm bg-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Key Accomplishments / Highlights (1 per line)
                </label>
                <textarea
                  rows={2}
                  value={formData.highlights}
                  onChange={e => setFormData({ ...formData, highlights: e.target.value })}
                  placeholder="Optimized Mongo index latency by 45%&#10;Handled 500 req/sec via connection pool"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 text-xs sm:text-sm bg-white"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Project' : 'Save Project'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Projects;
