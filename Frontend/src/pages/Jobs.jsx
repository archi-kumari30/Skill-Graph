import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Briefcase, MapPin, DollarSign, Award, CheckCircle, AlertTriangle, ArrowRight, BookOpen } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const Jobs = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/jobs/matches');
      setMatches(res.data?.matches || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to retrieve job matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  if (loading) return <LoadingSpinner message="Evaluating engineering job matches..." />;
  if (error) return <ErrorState message={error} onRetry={fetchMatches} />;
  if (matches.length === 0) {
    return (
      <EmptyState
        title="No Job Matches Found"
        description="Add skills to your profile or adjust your career targets to compile compatibility evaluations."
      />
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto">
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Job Opportunities</h1>
        <p className="text-xs text-slate-400 font-semibold">Matched against your profile skills and proficiency levels.</p>
      </div>

      <div className="space-y-6">
        {matches.map((match) => (
          <div
            key={match.jobId}
            className="bg-white border border-slate-200/50 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Split top badge indicator */}
            <div className="absolute top-0 right-0 bg-indigo-50 text-indigo-750 text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              {match.source} Opportunity
            </div>

            {/* Left metadata info (title, company, description) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{match.company.industry} &bull; {match.location}</span>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-850 tracking-tight leading-tight">
                  {match.title}
                </h2>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-bold">
                  <span className="text-indigo-600 font-extrabold">{match.company.name}</span>
                  <span className="text-slate-300">|</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase">{match.employmentType}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase">{match.experienceLevel}</span>
                </div>
              </div>

              <p className="text-xs text-slate-455 leading-relaxed">
                {match.description}
              </p>

              {/* Explanations section */}
              <div className="bg-slate-50 rounded-2xl p-4 text-xs font-semibold text-slate-600 leading-relaxed border border-slate-100">
                <span className="font-extrabold text-slate-800 block mb-1">Compatibility Explanation:</span>
                {match.explanation}
              </div>

              {/* Detailed requirements items */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skills breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mastered/Satisfied */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase font-bold text-emerald-600 block">Satisfied ({match.matchedSkills})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {match.skills.filter(s => s.status === 'mastered').map(s => (
                        <span key={s.skill.id} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100/50 text-[10px] font-bold">
                          {s.skill.name} ({s.currentProficiency}/{s.requiredProficiency})
                        </span>
                      ))}
                      {match.skills.filter(s => s.status === 'mastered').length === 0 && (
                        <span className="text-slate-400 italic text-[10px]">None</span>
                      )}
                    </div>
                  </div>

                  {/* Unsatisfied/Gaps */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase font-bold text-rose-600 block">Gaps / To Improve ({match.missingSkills + match.skillsToImprove})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {match.skills.filter(s => s.status !== 'mastered').map(s => (
                        <span key={s.skill.id} className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${
                          s.status === 'missing' 
                            ? 'bg-rose-50 text-rose-750 border-rose-100/50' 
                            : 'bg-amber-50 text-amber-750 border-amber-100/50'
                        }`}>
                          {s.skill.name} ({s.currentProficiency}/{s.requiredProficiency})
                        </span>
                      ))}
                      {match.skills.filter(s => s.status !== 'mastered').length === 0 && (
                        <span className="text-slate-400 italic text-[10px]">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Score indicator ring */}
            <div className="lg:col-span-4 flex flex-col justify-center items-center lg:border-l border-slate-100 lg:pl-6 space-y-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="46" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="#6366f1"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={288}
                    strokeDashoffset={288 - (288 * match.matchScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="text-center">
                  <span className="text-2xl font-black text-slate-800">{match.matchScore}%</span>
                  <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">Match</span>
                </div>
              </div>

              <a
                href={match.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10.5px] uppercase tracking-wider font-extrabold text-center shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-1 hover:scale-[1.01] transition-all"
              >
                <span>Apply Opportunity</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Jobs;
