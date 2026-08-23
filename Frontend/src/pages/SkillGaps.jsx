import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Compass,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  BookOpen,
  MapPin,
  Award
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

const SkillGaps = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const roleIdParam = searchParams.get('roleId');

  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gapLoading, setGapLoading] = useState(false);
  const [error, setError] = useState('');
  const [gapError, setGapError] = useState('');

  const fetchRolesData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const matchRes = await api.get(`/matching/users/${user._id}/roles`);
      const matchedRoles = matchRes.data.matches || [];
      setRoles(matchedRoles);

      if (roleIdParam) {
        setSelectedRoleId(roleIdParam);
      } else if (matchedRoles.length > 0) {
        setSelectedRoleId(matchedRoles[0].roleId);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve career roles list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGapAnalysis = async (roleId) => {
    if (!roleId) return;
    try {
      setGapLoading(true);
      setGapError('');
      const res = await api.get(`/skill-gap/users/${user._id}/roles/${roleId}`);
      setGapAnalysis(res.data);
    } catch (err) {
      setGapError(err.message || 'Failed to calculate gap analysis.');
      setGapAnalysis(null);
    } finally {
      setGapLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchRolesData();
    }
  }, [user, roleIdParam]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchGapAnalysis(selectedRoleId);
    }
  }, [selectedRoleId]);

  if (loading) return <LoadingSpinner message="Evaluating matching career tracks..." />;
  if (error) return <ErrorState message={error} onRetry={fetchRolesData} />;

  // Group skills by status
  const masteredSkills = gapAnalysis ? gapAnalysis.skills.filter(s => s.status === 'mastered') : [];
  const gapSkills = gapAnalysis ? gapAnalysis.skills.filter(s => s.status !== 'mastered') : [];

  return (
    <div className="space-y-8 font-sans">
      
      {/* 1. Page Header */}
      <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm bg-grid-pattern">
        <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Career Gap Roadmaps</h2>
        <p className="text-xs text-slate-450 font-semibold">Track what you know, discover what you're missing, and chart your milestones.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Career Track selection list */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-250/30 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Target Careers</h3>
          </div>
          {roles.length === 0 ? (
            <p className="p-4 text-xs text-slate-400 italic">No roles configured in the catalog.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {roles.map((r) => {
                const isSelected = selectedRoleId.toString() === r.roleId.toString();
                return (
                  <button
                    key={r.roleId}
                    onClick={() => setSelectedRoleId(r.roleId)}
                    className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                      isSelected ? 'bg-indigo-50/50 border-l-4 border-indigo-650' : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {r.name}
                      </p>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                        {r.department} &bull; {r.level || 'Mid'}
                      </span>
                    </div>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      r.matchScore >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {r.matchScore}%
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Visual Learning Gap Roadmap */}
        <div className="lg:col-span-8">
          {gapLoading ? (
            <LoadingSpinner message="Performing gap comparison analytics..." />
          ) : gapError ? (
            <ErrorState message={gapError} onRetry={() => fetchGapAnalysis(selectedRoleId)} />
          ) : gapAnalysis ? (
            <div className="space-y-8">
              {/* Score header summary card */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden bg-grid-pattern">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Target Compatibility</span>
                  <h3 className="text-xl font-extrabold text-slate-800">{gapAnalysis.role?.name}</h3>
                </div>
                <div className={`w-20 h-20 rounded-full border-[6px] flex flex-col items-center justify-center font-black text-sm shrink-0 bg-white ${
                  gapAnalysis.readinessScore >= 80 ? 'border-emerald-100 border-t-emerald-600 text-emerald-700' :
                  gapAnalysis.readinessScore >= 50 ? 'border-amber-100 border-t-amber-500 text-amber-750' :
                  'border-rose-100 border-t-rose-500 text-rose-700'
                }`}>
                  <span>{gapAnalysis.readinessScore}%</span>
                  <span className="text-[7px] uppercase font-bold text-slate-400 mt-0.5">Ready</span>
                </div>
              </div>

              {/* ROADMAP TIMELINE JOURNEY */}
              <div className="bg-white border border-slate-200/50 rounded-3xl p-8 shadow-sm relative">
                
                {/* Vertical road line */}
                <div className="absolute top-10 bottom-10 left-12 w-0.5 bg-slate-100 border-dashed border-l z-0" />

                <div className="space-y-10 relative z-10">
                  {/* Step 1: Where you are (Mastered Skills) */}
                  <div className="flex items-start space-x-6">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-250 flex items-center justify-center text-emerald-600 shrink-0">
                      <CheckCircle className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-3.5 flex-1">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Where You Are</h4>
                        <p className="font-extrabold text-slate-800 text-sm">Mastered required skills</p>
                      </div>
                      
                      {masteredSkills.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No skills fully mastered for this role yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {masteredSkills.map(s => (
                            <span key={s.skill.id} className="inline-flex px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100/50 shadow-sm">
                              {s.skill.name} (Level {s.currentProficiency})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: The Gaps (Needs Improvement / Missing) */}
                  <div className="flex items-start space-x-6">
                    <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-250 flex items-center justify-center text-rose-600 shrink-0">
                      <AlertTriangle className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-3.5 flex-1">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450">Active Skill Gaps</h4>
                        <p className="font-extrabold text-slate-800 text-sm">Deficiencies requiring development</p>
                      </div>

                      {gapSkills.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">All required skills are fully satisfied!</p>
                      ) : (
                        <div className="space-y-2">
                          {gapSkills.map(s => (
                            <div key={s.skill.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold">
                              <div>
                                <span className="font-extrabold text-slate-800">{s.skill.name}</span>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider">{s.skill.category}</span>
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                  s.status === 'missing' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {s.status.replace('_', ' ')}
                                </span>
                                <p className="text-[9px] text-slate-400 mt-0.5">Required: {s.requiredProficiency} &bull; Gap: +{s.gap}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Recommended Learning */}
                  {gapSkills.length > 0 && (
                    <div className="flex items-start space-x-6">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-250 flex items-center justify-center text-indigo-650 shrink-0">
                        <BookOpen className="w-4.5 h-4.5" />
                      </div>
                      <div className="space-y-2.5 flex-1">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Roadmap next actions</h4>
                          <p className="font-extrabold text-slate-800 text-sm">Personalized learning modules</p>
                        </div>
                        <Link
                          to={`/recommendations?roleId=${selectedRoleId}`}
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-colors"
                        >
                          Start Learning Path
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Where you want to go (Destination Target Role) */}
                  <div className="flex items-start space-x-6">
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-750 flex items-center justify-center text-white shrink-0 shadow">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-bold">Destination Goal</h4>
                      <p className="font-extrabold text-indigo-650 text-sm">{gapAnalysis.role?.name}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-8 text-center bg-white rounded-2xl border border-slate-200/50">Select a career track to view gap roadmaps.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillGaps;
