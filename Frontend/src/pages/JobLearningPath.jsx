import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  GraduationCap,
  PlayCircle,
  Building2,
  Check,
  Target
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import toast from 'react-hot-toast';

const JobLearningPath = () => {
  const { id } = useParams();

  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedChapters, setExpandedChapters] = useState({});
  const [completingTopic, setCompletingTopic] = useState({});

  const fetchLearningPath = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/jobs/${id}/learning-path`);
      const data = res?.data || res;
      setPathData(data);

      // Default expand the first active chapter
      if (data?.chapters?.length > 0) {
        const initialExpanded = {};
        const firstIncompleteIdx = data.chapters.findIndex(c => c.status !== 'completed');
        const targetIdx = firstIncompleteIdx !== -1 ? firstIncompleteIdx : 0;
        initialExpanded[targetIdx] = true;
        setExpandedChapters(initialExpanded);
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to generate guided learning path.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLearningPath();
    }
  }, [id]);

  const toggleChapter = (idx) => {
    setExpandedChapters(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleToggleTopic = async (skillId, topicTitle, currentStatus, e) => {
    e.stopPropagation();
    const topicKey = `${skillId}_${topicTitle}`;
    try {
      setCompletingTopic(prev => ({ ...prev, [topicKey]: true }));
      const newStatus = !currentStatus;

      await api.post('/learning/topics/complete', {
        skillId,
        topicTitle,
        completed: newStatus
      });

      toast.success(newStatus ? 'Topic completed! Skill proficiency updated.' : 'Topic marked incomplete.');

      // Refresh path to reflect updated state & readiness calculations
      await fetchLearningPath();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update topic progress.');
    } finally {
      setCompletingTopic(prev => ({ ...prev, [topicKey]: false }));
    }
  };

  if (loading) return <LoadingSpinner message="Synthesizing topological prerequisite learning path..." />;
  if (error) return <ErrorState message={error} onRetry={fetchLearningPath} />;
  if (!pathData) return <ErrorState message="No learning path generated." />;

  const { pathTitle, targetJob, totalTopics, completedTopics, progressPercentage, estimatedHours, chapters = [] } = pathData;

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto animate-in fade-in duration-200">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-500">
        <Link to="/jobs" className="hover:text-indigo-600 transition-colors">Job Market</Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        <Link to={`/jobs/${id}`} className="hover:text-indigo-600 transition-colors truncate max-w-xs">{targetJob?.title}</Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-zinc-800 font-bold">Guided Learning Path</span>
      </div>

      {/* Hero Guided Path Banner */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Guided Career Path
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              {pathTitle}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-400" />
              <span>Target Role: <strong className="text-zinc-850 font-bold">{targetJob?.company}</strong> &bull; {targetJob?.location}</span>
            </p>
          </div>

          <Link
            to={`/jobs/${id}`}
            className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-xs transition-colors shrink-0"
          >
            &larr; Back to Job Analysis
          </Link>
        </div>

        {/* Global Progress Bar & Metrics */}
        <div className="bg-[#FAF9F6] rounded-2xl p-5 border border-zinc-200/80 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          
          <div className="sm:col-span-2 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-800">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-600" /> Overall Path Progression
              </span>
              <span className="text-indigo-600 font-black text-sm">{progressPercentage}%</span>
            </div>
            <div className="h-3 w-full bg-zinc-200/80 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-400 font-semibold">
              <span>{completedTopics} of {totalTopics} topics mastered</span>
              <span>{totalTopics - completedTopics} topics remaining</span>
            </div>
          </div>

          <div className="flex items-center justify-around sm:border-l border-zinc-200 sm:pl-4 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Duration</span>
              <span className="text-base font-black text-zinc-800 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-indigo-500" /> ~{estimatedHours}h
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Chapters</span>
              <span className="text-base font-black text-zinc-800">
                {chapters.length}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Chapters Ordered Topologically (DAG Kahn's Algorithm) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-lg font-black text-zinc-900 tracking-tight">
              Chapters & Progression Roadmap
            </h2>
            <p className="text-xs text-zinc-500">
              Prerequisites are topologically ordered so you build solid foundations before advanced topics.
            </p>
          </div>
          <button
            onClick={() => {
              const allExpanded = Object.keys(expandedChapters).length === chapters.length;
              if (allExpanded) {
                setExpandedChapters({});
              } else {
                const next = {};
                chapters.forEach((_, i) => { next[i] = true; });
                setExpandedChapters(next);
              }
            }}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Toggle All
          </button>
        </div>

        {chapters.map((chapter, idx) => {
          const isExpanded = !!expandedChapters[idx];
          const isBlocked = chapter.status === 'blocked';
          const isDone = chapter.status === 'completed';

          return (
            <div
              key={idx}
              className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden ${
                isBlocked
                  ? 'border-purple-200/80 bg-purple-50/10'
                  : isDone
                  ? 'border-emerald-200/90'
                  : 'border-zinc-200/90 shadow-xs'
              }`}
            >
              {/* Chapter Accordion Header */}
              <div
                onClick={() => toggleChapter(idx)}
                className="p-5 sm:p-6 cursor-pointer hover:bg-zinc-50/70 transition-colors flex items-center justify-between gap-4 select-none"
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* Number Badge */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isBlocked
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-indigo-600 text-white'
                  }`}>
                    {isDone ? <Check className="w-5 h-5" /> : chapter.chapterNumber}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-zinc-400">
                        {chapter.skill?.category}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        chapter.importance === 'required'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {chapter.importance}
                      </span>

                      {/* Status Badge */}
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-700'
                          : isBlocked
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {isDone ? 'Completed' : isBlocked ? 'Blocked by Prerequisite' : 'Ready to Learn'}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-zinc-900 leading-snug">
                      {chapter.title}
                    </h3>

                    {/* Prerequisite warning banner */}
                    {isBlocked && (
                      <p className="text-xs text-purple-800 font-semibold flex items-center gap-1.5 pt-0.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                        Prerequisite needed: Complete earlier chapter ({chapter.prerequisites?.join(', ')}) first
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Progress & Chevron */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-xs font-black text-zinc-800">
                      {chapter.completedCount}/{chapter.topicsCount} Topics
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold">
                      {chapter.progressPercentage}% Done
                    </span>
                  </div>

                  <div className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 bg-zinc-100">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Topics & Practice Checklist */}
              {isExpanded && (
                <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-zinc-100 space-y-4 bg-[#FAF9F6]/50">
                  <p className="text-xs text-zinc-500 font-medium">
                    Topic curriculum for mastering <strong className="text-zinc-800 font-bold">{chapter.skill?.name}</strong> to level {chapter.targetProficiency}/5:
                  </p>

                  <div className="space-y-3">
                    {chapter.topics.map((topic, tIdx) => {
                      const topicKey = `${chapter.skill.id}_${topic.title}`;
                      const isBusy = !!completingTopic[topicKey];

                      return (
                        <div
                          key={topic.id || tIdx}
                          className={`p-4 rounded-2xl border transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            topic.completed
                              ? 'border-emerald-200 bg-emerald-50/20'
                              : 'border-zinc-200/80 hover:border-zinc-300'
                          }`}
                        >
                          <div className="space-y-1.5 max-w-xl">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                topic.difficulty === 'beginner'
                                  ? 'bg-blue-50 text-blue-700'
                                  : topic.difficulty === 'intermediate'
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'bg-purple-50 text-purple-700'
                              }`}>
                                {topic.difficulty}
                              </span>
                              <span className="text-xs font-black text-zinc-900">
                                {topic.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-relaxed">
                              {topic.summary}
                            </p>

                            {/* Learning Resources Links */}
                            {topic.resources?.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {topic.resources.map(r => (
                                  <a
                                    key={r.id}
                                    href={r.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-bold transition-colors"
                                  >
                                    <BookOpen className="w-3 h-3 text-indigo-600" />
                                    <span>{r.title} ({r.provider})</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Completion Toggle Button */}
                          <div className="shrink-0 flex items-center justify-end">
                            <button
                              onClick={(e) => handleToggleTopic(chapter.skill.id, topic.title, topic.completed, e)}
                              disabled={isBusy}
                              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                                topic.completed
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-zinc-100 hover:bg-indigo-600 hover:text-white text-zinc-700'
                              }`}
                            >
                              <CheckCircle2 className={`w-3.5 h-3.5 ${topic.completed ? 'text-white' : 'text-zinc-400'}`} />
                              <span>{isBusy ? 'Saving...' : topic.completed ? 'Completed' : 'Mark Done'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default JobLearningPath;
