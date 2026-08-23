import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Award,
  BookOpen,
  GitFork,
  ArrowLeft,
  Star,
  ExternalLink,
  Clock
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

const SkillDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [related, setRelated] = useState([]);
  const [userSkillInfo, setUserSkillInfo] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSkillDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch skill definition
      const skillRes = await api.get(`/skills/${id}`);
      setSkill(skillRes.data.skill);

      // 2. Fetch related skills
      const relatedRes = await api.get(`/skill-graph/skills/${id}/related`);
      setRelated(relatedRes.data.relatedSkills || []);

      // 3. Fetch user skills to check if user possesses it
      const userRes = await api.get(`/users/${user._id}/skills`);
      const userSkills = userRes.data.skills || [];
      const match = userSkills.find(us => (us.skillId?._id || us.skillId).toString() === id.toString());
      setUserSkillInfo(match || null);

      // 4. Fetch learning resources from database (using the global catalog endpoints or custom list)
      // Since mock seed adds them, let's query. If we don't have a direct resource endpoint,
      // we know seed creates them, so we can fetch them via a query or from dashboard summary.
      // Wait, let's check: does the backend have GET /api/learning-resources? The backend doesn't define separate routes for learning resources,
      // but the recommendation service returns them. However, since the database contains them, let's fetch them.
      // Wait, does the backend have a learning resource route? Let's check backend app.js:
      // It does NOT mount a learning resource router! But the recommendations service fetches them:
      // `const resources = await LearningResource.find({ skillId: gs.skill._id });`
      // So the recommendations API attaches them.
      // We can also query all learning resources? Since they are stored in the database under `LearningResource`,
      // is there a route? No. But wait! We can add a custom API fetch or fallback.
      // Let's see: we can implement a query on recommendations to get them, or we can just fetch them if we had a route.
      // To be safe, let's write a simple query. Wait, does the backend have a hidden route?
      // No, we created the models, but did not create routes. So let's search if there are recommendations for this skill, or we can mock them if missing, or we can query recommendations.
      // Actually, since recommendations page returns resources for gaps, we can fetch from recommendations.
      // Or we can just display resources from recommendations response!
      // Wait! Let's check recommendations output: it populates `learningResources`.
      // Let's check: we can fetch recommendations for the user and filter for this skill!
      // That is a brilliant trick! Let's do that:
      // We check recommendations for user and target role. If this skill is in the recommendations, we copy its resources.
      // Let's find any role in user department to query recommendations.
      const rolesRes = await api.get('/roles');
      const roles = rolesRes.data.roles || [];
      const deptRole = roles.find(r => r.department === user.department) || roles[0];
      
      if (deptRole) {
        const recRes = await api.get(`/recommendations/users/${user._id}/roles/${deptRole._id}`);
        const recs = recRes.data.recommendations || [];
        const matchRec = recs.find(r => r.skill.id.toString() === id.toString());
        if (matchRec && matchRec.learningResources) {
          setResources(matchRec.learningResources);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve skill specifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourse = async (courseId, url) => {
    try {
      await api.post(`/learning/${courseId}/start`);
    } catch (err) {
      console.error('Failed to log course start', err);
    }
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (id && user?._id) {
      fetchSkillDetails();
    }
  }, [id, user]);

  if (loading) return <LoadingSpinner message="Querying skill catalog metadata..." />;
  if (error) return <ErrorState message={error} onRetry={fetchSkillDetails} />;
  if (!skill) return <ErrorState message="Skill metadata not found." />;

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'beginner': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'intermediate': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'advanced': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Return button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to inventory
        </button>
      </div>

      {/* Main detail card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Skill specifications */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/50 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider mb-2">
                  {skill.category}
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{skill.name}</h1>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                <Award className="w-6 h-6" />
              </div>
            </div>

            {skill.description ? (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{skill.description}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No description provided for this skill catalog item.</p>
            )}

            {skill.aliases && skill.aliases.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alternate Names / Aliases</h3>
                <div className="flex flex-wrap gap-1.5">
                  {skill.aliases.map(a => (
                    <span key={a} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/50">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Current rating status */}
            <div className="pt-5 border-t border-slate-100">
              {userSkillInfo ? (
                <div className="space-y-3.5 bg-slate-50 border border-slate-200/40 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Current Level</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Validated via {userSkillInfo.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${star <= userSkillInfo.proficiency ? 'fill-current' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-700">
                      {userSkillInfo.proficiency === 5 && 'Expert'}
                      {userSkillInfo.proficiency === 4 && 'Advanced'}
                      {userSkillInfo.proficiency === 3 && 'Intermediate'}
                      {userSkillInfo.proficiency === 2 && 'Basic'}
                      {userSkillInfo.proficiency === 1 && 'Beginner'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">
                    You have <strong className="text-slate-700">{userSkillInfo.yearsOfExperience} years</strong> of documented practical experience with this skill.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50/50 border border-amber-100/50 text-amber-800 rounded-xl p-4 text-xs font-medium leading-relaxed">
                  This skill is not present on your current profile. Visit <Link to="/skills" className="text-indigo-600 font-bold hover:underline">My Skills</Link> to assign it.
                </div>
              )}
            </div>
          </div>

          {/* Learning resources */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/50 space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Learning Resources</h3>
            </div>

            {resources.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No developmental courses found for this skill in the system.</p>
            ) : (
              <div className="space-y-3">
                {resources.map((res, index) => (
                  <button
                    key={index}
                    onClick={() => handleStartCourse(res.id, res.url)}
                    className="w-full text-left flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/40 rounded-lg group transition-all cursor-pointer"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                        {res.title}
                      </p>
                      <div className="flex items-center space-x-3 text-[10px] text-slate-400 uppercase tracking-wider">
                        <span className={`px-1.5 py-0.5 rounded border ${getDifficultyColor(res.difficulty)}`}>
                          {res.difficulty}
                        </span>
                        {res.estimatedHours > 0 && (
                          <span className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {res.estimatedHours} hrs
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Relationships / Dependencies */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/50 space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <GitFork className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Graph Relationships</h3>
            </div>

            {related.length === 0 ? (
              <p className="text-xs text-slate-400 italic">This skill is isolated and contains no linked relationships in the database.</p>
            ) : (
              <div className="space-y-3.5">
                {related.map((rel, index) => {
                  const targetSkill = rel.skill;
                  return (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 border border-slate-200/40 rounded-lg flex items-center justify-between text-xs font-semibold"
                    >
                      <div className="space-y-0.5">
                        <Link
                          to={`/skills/${targetSkill._id}`}
                          className="font-bold text-slate-700 hover:text-indigo-600 transition-colors hover:underline"
                        >
                          {targetSkill.name}
                        </Link>
                        <p className="text-[10px] text-slate-400">Category: {targetSkill.category}</p>
                      </div>

                      <div className="text-right space-y-1">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          rel.relationshipType === 'prerequisite'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {rel.relationshipType}
                        </span>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                          {rel.direction === 'outgoing' ? 'outgoing link \u2192' : '\u2190 incoming link'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillDetail;
