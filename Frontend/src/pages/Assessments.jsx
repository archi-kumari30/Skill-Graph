import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Award,
  ChevronRight,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileCheck,
  RotateCcw
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Assessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [assessRes, attemptsRes] = await Promise.all([
          api.get('/assessments'),
          api.get('/assessments/my/attempts').catch(() => ({ data: [] }))
        ]);

        setAssessments(assessRes?.data || []);
        setAttempts(attemptsRes?.data || []);
      } catch (err) {
        toast.error('Failed to load assessments');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading verified skill tests..." />;
  }

  const categories = ['All', ...new Set(assessments.map(a => a.skillId?.category).filter(Boolean))];

  const filteredAssessments = selectedCategory === 'All'
    ? assessments
    : assessments.filter(a => a.skillId?.category === selectedCategory);

  const verifiedCount = assessments.filter(a => a.bestAttempt?.passed).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Skill Verification Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Verified Skill Assessments
          </h1>
          <p className="text-sm text-zinc-600">
            Validate your hands-on competencies with timed multiple-choice evaluations. Scoring 70% or higher automatically grants your profile an official verified badge and boosts your Career Readiness Score.
          </p>
        </div>

        {/* Verification Summary Card */}
        <div className="bg-[#FAF9F6] border border-zinc-200 rounded-2xl p-5 flex items-center space-x-4 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
            {verifiedCount}
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Verified Badges</p>
            <p className="text-sm font-extrabold text-zinc-900">{verifiedCount} of {assessments.length} Completed</p>
            <span className="text-[11px] text-indigo-600 font-semibold">
              {Math.round((verifiedCount / (assessments.length || 1)) * 100)}% verified portfolio
            </span>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Assessment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssessments.map(assessment => {
          const isPassed = assessment.bestAttempt?.passed;
          const bestScore = assessment.bestAttempt?.score;

          return (
            <div
              key={assessment._id}
              className={`bg-white rounded-2xl border transition-all flex flex-col justify-between p-6 ${
                isPassed
                  ? 'border-emerald-200 shadow-xs'
                  : 'border-zinc-200 hover:border-zinc-300 hover:shadow-xs'
              }`}
            >
              <div className="space-y-4">
                {/* Category & Status Badge */}
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 uppercase tracking-wide">
                    {assessment.skillId?.category || 'Skill'}
                  </span>
                  {isPassed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified ({bestScore}%)
                    </span>
                  ) : bestScore !== undefined && bestScore !== null ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      Best: {bestScore}%
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                      Unverified
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 mb-1">
                    {assessment.title}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-2">
                    {assessment.description || `Assessment for ${assessment.skillId?.name}`}
                  </p>
                </div>

                {/* Metadata */}
                <div className="flex items-center space-x-4 text-xs font-semibold text-zinc-500 pt-2 border-t border-zinc-100">
                  <div className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{assessment.totalQuestions || 10} Questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{assessment.timeLimitMinutes || 15} Mins</span>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-650">
                    <Award className="w-3.5 h-3.5" />
                    <span>Pass: {assessment.passingScore}%</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <Link
                  to={`/assessments/${assessment._id}`}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isPassed
                      ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  {isPassed ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" /> Retake to Improve Score
                    </>
                  ) : (
                    <>
                      Start Assessment <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Past Attempts History */}
      {attempts.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="font-extrabold text-lg text-zinc-900">Your Test History</h2>
            </div>
            <span className="text-xs text-zinc-400 font-semibold">{attempts.length} Total Attempts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Assessment</th>
                  <th className="py-3 px-3">Skill</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3">Outcome</th>
                  <th className="py-3 px-3">Weak Topics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {attempts.map(att => (
                  <tr key={att._id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-zinc-900">{att.assessmentId?.title || 'Assessment'}</td>
                    <td className="py-3 px-3 text-zinc-600">{att.skillId?.name || 'Skill'}</td>
                    <td className="py-3 px-3 text-zinc-500">
                      {new Date(att.completedAt || att.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-zinc-900">{att.score}%</td>
                    <td className="py-3 px-3">
                      {att.passed ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          Passed & Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                          Needs Practice
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-zinc-500">
                      {att.weakTopics && att.weakTopics.length > 0
                        ? att.weakTopics.join(', ')
                        : <span className="text-emerald-600 font-semibold">None detected</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Assessments;
