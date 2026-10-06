import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Award,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const Jobs = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('All');

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/jobs/matches');
      const data = res?.data || res;
      setMatches(data?.matches || []);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to retrieve job matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  if (loading) return <LoadingSpinner message="Evaluating engineering job matches against your skill graph..." />;
  if (error) return <ErrorState message={error} onRetry={fetchMatches} />;

  const filteredMatches = matches.filter(match => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (match.title || '').toLowerCase().includes(term) ||
      (match.company?.name || '').toLowerCase().includes(term) ||
      (match.location || '').toLowerCase().includes(term);

    const matchesWorkMode =
      workModeFilter === 'All' ||
      (match.workMode || 'Hybrid').toLowerCase() === workModeFilter.toLowerCase();

    return matchesSearch && matchesWorkMode;
  });

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="border-b border-zinc-200/80 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Job Opportunities & Compatibility
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Deterministic career evaluations computed from your verified skills and graph prerequisite DAG.
          </p>
        </div>

        <Link
          to="/applications"
          className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>My Applications</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search roles, companies, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-[11px] font-bold text-zinc-400 uppercase hidden sm:inline">Work Mode:</span>
          {['All', 'Remote', 'Hybrid', 'On-site'].map(mode => (
            <button
              key={mode}
              onClick={() => setWorkModeFilter(mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                workModeFilter === mode
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <EmptyState
          title="No Job Matches Found"
          description={searchTerm || workModeFilter !== 'All' ? "No jobs match your current search filters." : "Add skills to your profile or adjust your career targets to compile compatibility evaluations."}
        />
      ) : (
        <div className="space-y-6">
          {filteredMatches.map((match) => (
            <div
              key={match.jobId}
              className="bg-white border border-zinc-200/80 rounded-3xl p-6 md:p-8 shadow-xs hover:border-zinc-300 transition-all relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Split top badge indicator */}
              <div className="absolute top-0 right-0 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider border-b border-l border-indigo-100">
                {match.source || 'SkillGraph'} Opportunity
              </div>

              {/* Left metadata info (title, company, description) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                      {match.company?.industry || 'Engineering'} &bull; {match.location}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                      {match.workMode || 'Hybrid'}
                    </span>
                    {match.hasApplied && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Application: {match.applicationStatus ? match.applicationStatus.toUpperCase() : 'APPLIED'}
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight leading-tight">
                    <Link to={`/jobs/${match.jobId}`} className="hover:text-indigo-600 transition-colors">
                      {match.title}
                    </Link>
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-zinc-600">
                    <span className="text-indigo-600 font-extrabold">{match.company?.name}</span>
                    <span className="text-zinc-300">|</span>
                    <span className="bg-zinc-100 px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
                      {match.jobType || match.employmentType || 'Full Time'}
                    </span>
                    <span className="bg-zinc-100 px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
                      {match.experience || match.experienceLevel || '0-2 yrs'}
                    </span>
                    {match.salary && (
                      <>
                        <span className="text-zinc-300">|</span>
                        <span className="text-emerald-700 font-bold">{match.salary}</span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">
                  {match.description}
                </p>

                {/* Explanations section */}
                <div className="bg-[#FAF9F6] rounded-2xl p-4 text-xs font-semibold text-zinc-600 leading-relaxed border border-zinc-200/80">
                  <span className="font-extrabold text-zinc-900 block mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Compatibility Breakdown:
                  </span>
                  {match.explanation}
                </div>

                {/* Detailed requirements items */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Skills snapshot</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Mastered/Satisfied */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-extrabold text-emerald-700 block">
                        ✓ Satisfied ({match.matchedSkills})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(match.skills || []).filter(s => s.status === 'mastered').slice(0, 4).map(s => (
                          <span key={s.skill.id} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            {s.skill.name} ({s.currentProficiency}/{s.requiredProficiency})
                          </span>
                        ))}
                        {(match.skills || []).filter(s => s.status === 'mastered').length === 0 && (
                          <span className="text-zinc-400 italic text-[10px]">None yet</span>
                        )}
                      </div>
                    </div>

                    {/* Unsatisfied/Gaps */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-extrabold text-amber-700 block">
                        ⚠ Gaps to Bridge ({match.missingSkills + match.skillsToImprove})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(match.skills || []).filter(s => s.status !== 'mastered').slice(0, 4).map(s => (
                          <span key={s.skill.id} className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${
                            s.status === 'missing'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {s.skill.name} ({s.currentProficiency}/{s.requiredProficiency})
                          </span>
                        ))}
                        {(match.skills || []).filter(s => s.status !== 'mastered').length === 0 && (
                          <span className="text-zinc-400 italic text-[10px]">No gaps identified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Score indicator ring & Actions */}
              <div className="lg:col-span-4 flex flex-col justify-center items-center lg:border-l border-zinc-200/80 lg:pl-6 space-y-4">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="46" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="#4f46e5"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={288}
                      strokeDashoffset={288 - (288 * match.matchScore) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="text-center">
                    <span className="text-2xl font-black text-zinc-900">{match.matchScore}%</span>
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase tracking-wider">Match</span>
                  </div>
                </div>

                <div className="w-full space-y-2">
                  {match.hasApplied ? (
                    <Link
                      to={`/jobs/${match.jobId}`}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold text-center shadow-xs flex items-center justify-center gap-1.5 transition-all ${
                        ['selected', 'offered'].includes(match.applicationStatus?.toLowerCase())
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : match.applicationStatus?.toLowerCase() === 'interview'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : match.applicationStatus?.toLowerCase() === 'shortlisted'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : match.applicationStatus?.toLowerCase() === 'rejected'
                          ? 'bg-zinc-700 hover:bg-zinc-800 text-white'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>
                        {match.applicationStatus?.toLowerCase() === 'shortlisted' ? '★ Shortlisted' :
                         match.applicationStatus?.toLowerCase() === 'interview' ? '📅 Interview Scheduled' :
                         ['selected', 'offered'].includes(match.applicationStatus?.toLowerCase()) ? '🎉 Selected' :
                         match.applicationStatus?.toLowerCase() === 'rejected' ? '✕ Not Selected' :
                         '✓ Applied'}
                      </span>
                    </Link>
                  ) : (
                    <Link
                      to={`/jobs/${match.jobId}`}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold text-center shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>View Match & Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  <Link
                    to={`/interview-prep?jobId=${match.jobId}`}
                    className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Prepare for Interview</span>
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Jobs;
