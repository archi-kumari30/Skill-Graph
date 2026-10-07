import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Award,
  Compass,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Flame,
  Target,
  FolderGit2,
  CalendarCheck,
  RotateCcw,
  AlertCircle,
  TrendingUp,
  Check,
  ChevronRight,
  Zap,
  Bookmark,
  Briefcase,
  HelpCircle
} from 'lucide-react';

import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [commandData, setCommandData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCommandCenter = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard/command-center');
      setCommandData(res?.data?.data || res?.data || res);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load Command Center data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandCenter();
  }, []);

  const handleMarkTopicDone = async (topicId) => {
    try {
      await api.post(`/learning/topics/${topicId}/complete`);
      toast.success('Topic marked as mastered! Career readiness updated.');
      fetchCommandCenter();
    } catch (err) {
      toast.error('Failed to complete topic');
    }
  };

  if (loading) return <LoadingSpinner message="Opening your Career Command Center..." />;
  if (error) return <ErrorState message={error} onRetry={fetchCommandCenter} />;

  const userData = commandData?.user || user;
  const stats = commandData?.quickStats || {};
  const readiness = commandData?.readiness || null;
  const topGaps = commandData?.topGaps || [];
  const continueTopics = commandData?.continueTopics || [];
  const recentActivities = commandData?.recentActivity || [];
  const recentProjects = commandData?.recentProjects || [];
  const topMatches = commandData?.topMatches || commandData?.jobMatches || [];
  const appStats = commandData?.applicationStats || null;

  const targetRole = userData?.targetRole;
  const readinessScore = readiness?.score ?? stats?.readinessScore ?? 0;

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-200">
      
      {/* 1. ONBOARDING PROMPT BANNER (If not finished) */}
      {!userData?.onboardingCompleted && (
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Career Launchpad Recommended
            </div>
            <h3 className="text-lg font-black tracking-tight">Complete your Career Launchpad</h3>
            <p className="text-xs text-indigo-100 max-w-xl">
              Set your target role, baseline skills, and weekly study goal to activate precise career readiness tracking.
            </p>
          </div>
          <Link
            to="/onboarding"
            className="px-6 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-black text-xs shrink-0 shadow-sm transition-all"
          >
            Launch Setup Wizard &rarr;
          </Link>
        </div>
      )}

      {/* 2. CAREER GOAL HERO BANNER */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-8 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Target Career Objective
            </span>
            {targetRole && (
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider bg-zinc-100 px-3 py-1 rounded-full">
                {targetRole.level || 'Mid'} Level
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-tight">
              {targetRole?.name || 'No Target Role Selected Yet'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xl leading-relaxed">
              {targetRole?.description || 'Pick a target engineering path to compare your skill proficiencies, identify required competencies, and follow a focused roadmap.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/careers"
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              {targetRole ? 'Change Target Goal' : 'Explore Career Paths'}
            </Link>
            <Link
              to="/skill-gaps"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> View Full Skill Gap Analysis
            </Link>
          </div>
        </div>

        {/* Readiness Radial Indicator */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-[#FAF9F6] rounded-2xl border border-zinc-200">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Career Readiness
          </p>
          <div className="relative flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-8 border-zinc-200 flex items-center justify-center relative">
              <div
                className="absolute inset-0 rounded-full border-8 border-indigo-600 transition-all duration-700"
                style={{
                  clipPath: `polygon(0 0, 100% 0, 100% ${readinessScore}%, 0 ${readinessScore}%)`
                }}
              />
              <div className="text-center z-10">
                <span className="text-3xl font-black text-zinc-900">{readinessScore}%</span>
                <span className="block text-[9px] font-bold text-zinc-400 uppercase">Ready</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-500 mt-4">
            <span className="text-emerald-600 font-extrabold">{readiness?.matchedSkills || 0} Matched</span>
            <span>•</span>
            <span className="text-indigo-600 font-extrabold">{readiness?.skillsToImprove || 0} Growing</span>
            <span>•</span>
            <span className="text-amber-600 font-extrabold">{readiness?.missingSkills || 0} Missing</span>
          </div>
        </div>

      </div>

      {/* 3. KEY METRICS TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Verified Skills */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Verified Skills</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-zinc-900">
            {stats.verifiedSkills || 0} <span className="text-xs font-semibold text-zinc-400">/ {stats.totalSkills || 0}</span>
          </p>
          <Link to="/assessments" className="text-[11px] text-indigo-600 hover:underline font-bold block pt-1">
            Take tests &rarr;
          </Link>
        </div>

        {/* Study Streak */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Practice Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl font-black text-zinc-900">
            {stats.streakDays || 0} <span className="text-xs font-semibold text-zinc-400">Days</span>
          </p>
          <Link to="/activity" className="text-[11px] text-amber-700 hover:underline font-bold block pt-1">
            View streak &rarr;
          </Link>
        </div>

        {/* Weekly Output */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">This Week</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-zinc-900">
            {stats.hoursThisWeek || 0} <span className="text-xs font-semibold text-zinc-400">/ {stats.weeklyGoalHours || 10}h</span>
          </p>
          <span className="text-[11px] text-zinc-500 font-semibold block pt-1">
            Weekly study pacing
          </span>
        </div>

        {/* Tangible Projects */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Portfolio Proof</span>
            <FolderGit2 className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-zinc-900">
            {stats.totalProjects || 0} <span className="text-xs font-semibold text-zinc-400">Projects</span>
          </p>
          <Link to="/projects" className="text-[11px] text-purple-700 hover:underline font-bold block pt-1">
            Manage evidence &rarr;
          </Link>
        </div>

      </div>

      {/* 4. MAIN TWO-COLUMN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (8 cols): Continue Learning & Top Skill Gaps */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Continue Learning Topics */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/90 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-zinc-900">
                  Next Learning Topics
                </h2>
                <p className="text-xs text-zinc-500">Curated from requirements for your target role</p>
              </div>
              <Link to="/progress" className="text-xs font-bold text-indigo-600 hover:underline">
                Full Roadmap &rarr;
              </Link>
            </div>

            {continueTopics.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF9F6] rounded-2xl border border-zinc-200 space-y-3">
                <BookOpen className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-xs text-zinc-600 font-semibold">
                  All foundational topics completed or no target role selected yet.
                </p>
                <Link
                  to="/progress"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-block"
                >
                  Browse Topic Catalog
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {continueTopics.map((topic) => (
                  <div
                    key={topic._id}
                    className="p-4 rounded-2xl border border-zinc-200/90 bg-[#FAF9F6] hover:border-zinc-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-indigo-700 uppercase">
                        {topic.skillId?.name || 'Topic'}
                      </span>
                      <h4 className="font-bold text-xs text-zinc-900 leading-snug">
                        {topic.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 line-clamp-2">
                        {topic.summary || 'Fundamental practical competency.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-semibold text-zinc-400">Step #{topic.order || 1}</span>
                      <button
                        onClick={() => handleMarkTopicDone(topic._id)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3 h-3" /> Mark Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* High Priority Skill Gaps */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/90 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-zinc-900">
                  Priority Skill Gaps
                </h2>
                <p className="text-xs text-zinc-500">Skills required by {targetRole?.name || 'target role'} needing attention</p>
              </div>
              <Link to="/skill-gaps" className="text-xs font-bold text-indigo-600 hover:underline">
                View All Gaps &rarr;
              </Link>
            </div>

            {topGaps.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold">No critical skill gaps identified!</p>
                <p className="text-xs opacity-80">You meet or exceed all proficiency expectations for your target role.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topGaps.map((gap, idx) => {
                  const currentProf = gap.currentProficiency || 0;
                  const reqProf = gap.requiredProficiency || 3;
                  const pct = Math.min(100, Math.round((currentProf / reqProf) * 100));

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-zinc-200/80 bg-[#FAF9F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 sm:max-w-xs w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-zinc-900">{gap.skill?.name}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded ${
                            gap.importance === 'required' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {gap.importance}
                          </span>
                        </div>

                        {/* Proficiency Bar */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-semibold text-zinc-500">
                            <span>Level {currentProf}/5</span>
                            <span>Target: {reqProf}/5</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to="/assessments"
                          className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <Award className="w-3.5 h-3.5" /> Verify Skill
                        </Link>
                        <Link
                          to="/progress"
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          Study <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Job Matches (New Section) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/90 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-zinc-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <span>Compatible Job Opportunities</span>
                </h2>
                <p className="text-xs text-zinc-500">Evaluated deterministically against your verified skill proficiency</p>
              </div>
              <Link to="/jobs" className="text-xs font-bold text-indigo-600 hover:underline">
                View All Jobs &rarr;
              </Link>
            </div>

            {topMatches.length === 0 ? (
              <div className="p-6 text-center bg-[#FAF9F6] rounded-2xl border border-zinc-200 space-y-2">
                <Briefcase className="w-6 h-6 text-zinc-400 mx-auto" />
                <p className="text-xs text-zinc-600 font-semibold">
                  No direct job matches found yet.
                </p>
                <Link to="/jobs" className="text-xs font-bold text-indigo-600 hover:underline">
                  Browse Active Job Catalog &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {topMatches.slice(0, 3).map((jobMatch) => (
                  <div
                    key={jobMatch.jobId || jobMatch._id}
                    className="p-4 rounded-2xl border border-zinc-200/80 bg-[#FAF9F6] hover:border-zinc-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/jobs/${jobMatch.jobId || jobMatch._id}`} className="font-bold text-xs text-zinc-900 hover:text-indigo-600 transition-colors">
                          {jobMatch.title}
                        </Link>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                          {jobMatch.workMode || 'Hybrid'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-medium">
                        {(typeof jobMatch.company === 'string' ? jobMatch.company : jobMatch.company?.name) || jobMatch.companyName || 'Company'} &bull; {jobMatch.location || 'Remote'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-black text-indigo-600">{jobMatch.matchScore}%</span>
                        <span className="text-[9px] font-bold text-zinc-400 block uppercase">Match</span>
                      </div>
                      <Link
                        to={`/jobs/${jobMatch.jobId || jobMatch._id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (4 cols): Activity Timeline & Evidence Portfolio */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Quick Actions Card */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200/90 shadow-xs space-y-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Link
                to="/jobs"
                className="p-3 rounded-xl bg-[#FAF9F6] border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-zinc-900 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold">Explore Job Market</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>

              <Link
                to="/applications"
                className="p-3 rounded-xl bg-[#FAF9F6] border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-zinc-900 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold">My Applications</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>

              <Link
                to="/assessments"
                className="p-3 rounded-xl bg-[#FAF9F6] border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-zinc-900 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold">Take Skill Assessment</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>

              <Link
                to="/interview-prep"
                className="p-3 rounded-xl bg-[#FAF9F6] border border-zinc-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-zinc-900 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">Practice Interview Prep</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>


              <Link
                to="/projects"
                className="p-3 rounded-xl bg-[#FAF9F6] border border-zinc-200 hover:border-purple-300 hover:bg-purple-50/30 text-zinc-900 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <FolderGit2 className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold">Portfolio & Projects</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>

              <Link
                to="/activity"
                className="p-3 rounded-xl bg-[#FAF9F6] border border-zinc-200 hover:border-amber-300 hover:bg-amber-50/30 text-zinc-900 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold">Log Study Session</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200/90 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">
                Recent Activity
              </h3>
              <Link to="/activity" className="text-[11px] font-bold text-indigo-600 hover:underline">
                View all &rarr;
              </Link>
            </div>

            {recentActivities.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-2">No activity logged yet.</p>
            ) : (
              <div className="space-y-3">
                {recentActivities.slice(0, 5).map(act => (
                  <div key={act._id} className="text-xs border-b border-zinc-100 last:border-0 pb-2.5 last:pb-0">
                    <p className="font-bold text-zinc-800 line-clamp-1">{act.title}</p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                      <span>{act.date}</span>
                      <span className="font-semibold text-indigo-600">+{act.minutesSpent} mins</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Project Evidence */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200/90 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">
                Portfolio & Projects
              </h3>
              <Link to="/projects" className="text-[11px] font-bold text-indigo-600 hover:underline">
                View all &rarr;
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-zinc-400 italic">No project proof linked yet.</p>
                <Link to="/projects" className="text-xs font-bold text-indigo-600 hover:underline">
                  + Add Project
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map(proj => (
                  <div key={proj._id} className="p-3 rounded-xl bg-[#FAF9F6] border border-zinc-200 text-xs space-y-1">
                    <p className="font-bold text-zinc-900">{proj.title}</p>
                    <p className="text-[11px] text-zinc-500 line-clamp-1">{proj.description}</p>
                    {proj.skillsUsed?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.skillsUsed.map(s => (
                          <span key={s._id || s} className="text-[9px] font-bold bg-white border border-zinc-200 px-1.5 py-0.2 rounded text-zinc-600">
                            {s.name || 'Skill'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
