import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Users,
  Award,
  AlertTriangle,
  CheckCircle,
  Briefcase,
  TrendingUp,
  ShieldAlert,
  Loader
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import ProgressBar from '../components/ProgressBar';

const TeamAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  
  // Org stats
  const [analysisData, setAnalysisData] = useState(null);
  const [readinessData, setReadinessData] = useState(null);
  
  // Loaders
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [error, setError] = useState('');
  const [readinessError, setReadinessError] = useState('');

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch organizational skill analysis
      const analysisRes = await api.get('/team/skill-analysis');
      setAnalysisData(analysisRes.data);

      // 2. Fetch roles to allow collective readiness dropdown select
      const rolesRes = await api.get('/roles');
      const rolesList = rolesRes.data.roles || [];
      setRoles(rolesList);

      if (rolesList.length > 0) {
        setSelectedRoleId(rolesList[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve team analytics. Access restricted.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleReadiness = async (roleId) => {
    if (!roleId) return;
    try {
      setReadinessLoading(true);
      setReadinessError('');
      const res = await api.get(`/team/role-readiness/${roleId}`);
      setReadinessData(res.data);
    } catch (err) {
      setReadinessError(err.message || 'Failed to fetch team readiness score.');
      setReadinessData(null);
    } finally {
      setReadinessLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRoleReadiness(selectedRoleId);
    }
  }, [selectedRoleId]);

  if (loading) return <LoadingSpinner message="Retrieving team capability registers..." />;
  if (error) return <ErrorState message={error} onRetry={fetchTeamData} />;

  const {
    totalUsers = 0,
    mostCommonSkills = [],
    missingSkills = [],
    averageProficiency = [],
    teamSkillGaps = []
  } = analysisData || {};

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm bg-grid-pattern">
        <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Organization Capability Map</h2>
        <p className="text-xs text-slate-450 font-semibold">Monitor aggregate talent coverage and evaluate collective role readiness scores.</p>
      </div>
      {/* Overview Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/50 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Managed Users</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{totalUsers}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/50 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-bold">Absolute Gaps Tracked</p>
            <h3 className="text-2xl font-black text-rose-600 tracking-tight">{teamSkillGaps.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/50 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unassigned Role Skills</p>
            <h3 className="text-2xl font-black text-amber-600 tracking-tight">{missingSkills.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Org Stats, Right Role simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: General Team Capability stats */}
        <div className="lg:col-span-6 space-y-8">
          {/* Most Common Skills */}
          <div className="bg-white border border-slate-200/50 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <Award className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Top Competencies Coverage</h3>
            </div>
            <div className="space-y-3">
              {mostCommonSkills.slice(0, 5).map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.skill?.name} ({item.skill?.category})</span>
                    <span>{item.count} Members ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
              {mostCommonSkills.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2 text-center">No coverage data logged.</p>
              )}
            </div>
          </div>

          {/* Missing Required Skills */}
          <div className="bg-white border border-slate-200/50 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Unassigned Gaps (No Coverage)</h3>
            </div>
            <div className="space-y-2">
              {missingSkills.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-slate-50 border border-slate-200/40 p-3 rounded-lg text-xs font-semibold">
                  <div>
                    <p className="text-slate-800 font-bold">{item.skill?.name}</p>
                    <span className="text-[10px] text-slate-400">Category: {item.skill?.category}</span>
                  </div>
                  <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-100">
                    Required by {item.rolesDemanding} Roles
                  </span>
                </div>
              ))}
              {missingSkills.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2 text-center">No unassigned required gaps detected.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Role Collective Simulation */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200/50 rounded-xl shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <Briefcase className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Team Capability Simulator</h3>
              </div>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all appearance-none pr-8 relative"
              >
                {roles.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>

            {readinessLoading ? (
              <div className="py-12 flex justify-center items-center">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : readinessError ? (
              <ErrorState message={readinessError} />
            ) : readinessData ? (
              <div className="space-y-6">
                {/* Readiness summary */}
                <div className="flex items-center gap-6 bg-slate-50 border border-slate-200/40 p-4 rounded-xl shadow-inner">
                  <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-sm shrink-0 bg-white ${
                    readinessData.teamReadinessScore >= 80 ? 'border-emerald-100 border-t-emerald-600 text-emerald-700' :
                    readinessData.teamReadinessScore >= 50 ? 'border-amber-100 border-t-amber-500 text-amber-700' :
                    'border-rose-100 border-t-rose-500 text-rose-700'
                  }`}>
                    {readinessData.teamReadinessScore}%
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800 text-sm">Collective Team Readiness</h4>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                      Measures if the team *collectively* can cover the requirements by taking the highest level possessed by any member.
                    </p>
                  </div>
                </div>

                {/* Skills requirement check list */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Capability Details</h4>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {readinessData.skills.map((s, idx) => (
                      <div key={idx} className="p-3 border border-slate-200/50 rounded-lg flex items-center justify-between text-xs font-semibold hover:bg-slate-50/50 transition-all">
                        <div className="space-y-1 min-w-0 pr-2">
                          <p className="font-bold text-slate-700 truncate">{s.skill?.name}</p>
                          {s.lead ? (
                            <span className="text-[9px] text-slate-500">
                              Lead: <strong className="text-slate-700">{s.lead.name} (Level {s.lead.proficiency})</strong>
                            </span>
                          ) : (
                            <span className="text-[9px] text-rose-500 italic">No team member possesses this skill</span>
                          )}
                        </div>

                        <div className="text-right shrink-0 space-y-1">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            s.status === 'mastered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            s.status === 'needs_improvement' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {s.status.replace('_', ' ')}
                          </span>
                          <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                            Required: {s.requiredProficiency} &bull; Max Team: {s.teamMaxProficiency}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-4 text-center">No simulation details available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamAnalysis;
