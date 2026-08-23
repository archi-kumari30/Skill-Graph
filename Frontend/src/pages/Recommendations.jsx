import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Lightbulb,
  AlertTriangle,
  Award,
  BookOpen,
  ArrowRight,
  Clock,
  ExternalLink,
  Zap,
  Info,
  CheckCircle,
  Play
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

const Recommendations = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const roleIdParam = searchParams.get('roleId');

  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [error, setError] = useState('');
  const [recError, setRecError] = useState('');

  const fetchRolesList = async () => {
    try {
      setLoading(true);
      setError('');
      
      const matchRes = await api.get(`/matching/users/${user._id}/roles`);
      const matchedRoles = matchRes.data.matches || [];
      setRoles(matchedRoles);

      const targetId = user?.targetRoleId?._id || user?.targetRoleId;

      if (roleIdParam) {
        setSelectedRoleId(roleIdParam);
      } else if (targetId) {
        setSelectedRoleId(targetId.toString());
      } else if (matchedRoles.length > 0) {
        setSelectedRoleId(matchedRoles[0].roleId);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve roles.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (roleId) => {
    if (!roleId) return;
    try {
      setRecLoading(true);
      setRecError('');
      const res = await api.get(`/recommendations/users/${user._id}/roles/${roleId}`);
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      setRecError(err.message || 'Failed to fetch recommendations.');
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  };

  const handleStartCourse = async (courseId, url) => {
    try {
      await api.post(`/learning/${courseId}/start`);
    } catch (err) {
      console.error('Failed to start course tracking', err);
    }
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (user?._id) {
      fetchRolesList();
    }
  }, [user, roleIdParam]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRecommendations(selectedRoleId);
    }
  }, [selectedRoleId]);

  if (loading) return <LoadingSpinner message="Fetching matching career tracks..." />;
  if (error) return <ErrorState message={error} onRetry={fetchRolesList} />;

  const getPriorityColor = (priority) => {
    if (priority >= 75) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (priority >= 45) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-indigo-650 bg-indigo-50 border-indigo-100/50';
  };

  const getResourceDifficultyColor = (diff) => {
    switch (diff) {
      case 'beginner': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'intermediate': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'advanced': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* 1. Header Filter Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 bg-grid-pattern">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">What Should You Learn Next?</h2>
          <p className="text-xs text-slate-450 font-semibold">Personalized learning roadmaps calculated based on career requirements.</p>
        </div>

        <select
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
          className="w-full sm:w-64 px-3.5 py-2 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white appearance-none"
        >
          {roles.map(r => (
            <option key={r.roleId} value={r.roleId}>{r.name} ({r.matchScore}% Match)</option>
          ))}
        </select>
      </div>

      {/* 2. Educational Learning suggestions cards */}
      {recLoading ? (
        <LoadingSpinner message="Calculating dependency-resolved learning paths..." />
      ) : recError ? (
        <ErrorState message={recError} onRetry={() => fetchRecommendations(selectedRoleId)} />
      ) : recommendations.length === 0 ? (
        <div className="bg-white border border-slate-200/50 rounded-2xl p-8 text-center space-y-2 max-w-md mx-auto">
          <h3 className="font-extrabold text-slate-800">You Are Fully Ready! 🎉</h3>
          <p className="text-xs text-slate-500 font-semibold">You already possess all required skills for this role with satisfied proficiencies.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {recommendations.map((rec) => {
            const hasBlockedPrereqs = rec.unsatisfiedPrerequisites && rec.unsatisfiedPrerequisites.length > 0;
            const gapVal = rec.targetProficiency - (rec.currentProficiency || 0);
            return (
              <div
                key={rec.skill.id}
                className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col lg:flex-row gap-6 justify-between transition-all duration-200 hover:shadow-md ${
                  hasBlockedPrereqs ? 'border-slate-200' : 'border-indigo-100'
                }`}
              >
                {/* Left Side: Next Step roadmap block details */}
                <div className="flex-1 space-y-5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-bold bg-indigo-650 text-white uppercase tracking-wider">
                      Next Step
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-855 tracking-tight leading-tight">
                      <Link to={`/skills/${rec.skill.id}`} className="hover:text-indigo-600 transition-colors hover:underline">
                        {rec.skill.name}
                      </Link>
                    </h3>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${getPriorityColor(rec.priority)}`}>
                      Priority: {rec.priority}
                    </span>
                  </div>

                  {/* Why It Matters */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Why it matters for this career</p>
                    <p className="text-xs text-slate-655 leading-relaxed font-semibold">
                      {rec.reason || `Core capability required to fulfill the target competency level for this role.`}
                    </p>
                  </div>

                  {/* Builds On (Satisfied / Unsatisfied Prerequisites) */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Builds on</p>
                    {hasBlockedPrereqs ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start text-xs text-amber-850 font-semibold leading-relaxed">
                        <AlertTriangle className="w-4.5 h-4.5 text-amber-600 mr-2.5 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-amber-950 block mb-0.5">Prerequisite blockages detected</span>
                          <span>You should master: <strong className="text-amber-900">{rec.unsatisfiedPrerequisites.map(p => p.name).join(', ')}</strong> first.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-slate-600 font-semibold">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mr-1.5" />
                        <span>Basic prerequisite skills fully satisfied! Ready to learn.</span>
                      </div>
                    )}
                  </div>

                  {/* Levels info bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center space-x-6 text-xs text-slate-505 font-bold uppercase tracking-wider">
                    <span>Current: <strong className="text-slate-800">{rec.currentProficiency || '0'}</strong></span>
                    <span>Target: <strong className="text-slate-800">{rec.targetProficiency}</strong></span>
                    <span>Gap: <strong className="text-rose-600">-{gapVal}</strong></span>
                  </div>
                </div>

                {/* Right Side: Courses and study modules list */}
                <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6 space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <BookOpen className="w-4 h-4 mr-1.5 text-indigo-500" />
                    Recommended Courses
                  </h4>

                  {rec.learningResources.length === 0 ? (
                    <p className="text-xs text-slate-400 italic font-semibold">No courses recommended for this target.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {rec.learningResources.map((course, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleStartCourse(course.id, course.url)}
                          className="w-full text-left flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/50 rounded-xl group transition-all text-xs font-semibold cursor-pointer animate-in fade-in"
                        >
                          <div className="space-y-1.5">
                            <p className="font-extrabold text-slate-700 group-hover:text-indigo-655 transition-colors">
                              {course.title}
                            </p>
                            <div className="flex items-center space-x-2 text-[9px] text-slate-400 uppercase tracking-wider">
                              <span className={`px-1.5 py-0.5 rounded border ${getResourceDifficultyColor(course.difficulty)}`}>
                                {course.difficulty}
                              </span>
                              {course.estimatedHours > 0 && (
                                <span className="flex items-center font-bold">
                                  <Clock className="w-3 h-3 mr-0.5 text-slate-400" />
                                  {course.estimatedHours}h
                                </span>
                              )}
                            </div>
                          </div>
                          <Play className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
