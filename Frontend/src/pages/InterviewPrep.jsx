import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HelpCircle,
  CheckCircle2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Sparkles,
  Code2,
  Building,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  Play,
  Check,
  X
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const InterviewPrep = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTech = searchParams.get('tech') || searchParams.get('technology') || 'All';
  const initialDomain = searchParams.get('domain') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const jobIdParam = searchParams.get('jobId') || null;

  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState({ totalQuestions: 0, masteredCount: 0, masteryPercentage: 0 });
  const [availableTechs, setAvailableTechs] = useState([]);
  const [availableDomains, setAvailableDomains] = useState([]);
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDomain, setSelectedDomain] = useState(initialDomain);
  const [selectedTech, setSelectedTech] = useState(initialTech);
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Expand state
  const [expandedMap, setExpandedMap] = useState({});

  // Practice Mode state
  const [practiceModeOpen, setPracticeModeOpen] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceShowAnswer, setPracticeShowAnswer] = useState(false);

  // Fetch optional job context if navigated from a job card
  useEffect(() => {
    if (jobIdParam) {
      api.get(`/jobs/${jobIdParam}/match`)
        .then(res => {
          const data = res?.data || res;
          if (data?.job?.title) {
            setTargetJobTitle(data.job.title);
          }
        })
        .catch(() => {});
    }
  }, [jobIdParam]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDomain !== 'All') params.domain = selectedDomain;
      if (selectedTech !== 'All') params.technology = selectedTech;
      if (selectedDifficulty !== 'All') params.difficulty = selectedDifficulty;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/interview-prep', { params });
      const payload = res?.data?.data !== undefined ? res.data.data : (res?.data !== undefined ? res.data : res);

      const qList = payload?.questions || payload?.data?.questions || [];
      const st = payload?.stats || payload?.data?.stats || { totalQuestions: 0, masteredCount: 0, masteryPercentage: 0 };
      const techs = payload?.availableTechnologies || payload?.data?.availableTechnologies || [];
      const doms = payload?.availableDomains || payload?.data?.availableDomains || [];

      setQuestions(qList);
      setStats(st);
      if (techs.length > 0) setAvailableTechs(techs);
      if (doms.length > 0) setAvailableDomains(doms);
    } catch (err) {
      toast.error('Failed to load interview questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedDomain, selectedTech, selectedDifficulty]);

  // Debounced search query fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const toggleExpand = (id) => {
    setExpandedMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleMastered = async (questionId) => {
    try {
      const res = await api.post(`/interview-prep/${questionId}/toggle-mastered`);
      const payload = res?.data || res;
      const isMastered = payload?.isMastered !== undefined ? payload.isMastered : payload?.data?.isMastered;

      toast.success(isMastered ? 'Marked as Mastered! 🎉' : 'Removed from Mastered');

      // Update state locally
      setQuestions(prev => prev.map(q => q._id === questionId ? { ...q, isMastered } : q));
      setStats(prev => {
        const newCount = isMastered ? prev.masteredCount + 1 : Math.max(0, prev.masteredCount - 1);
        return {
          ...prev,
          masteredCount: newCount,
          masteryPercentage: prev.totalQuestions > 0 ? Math.round((newCount / prev.totalQuestions) * 100) : 0
        };
      });
    } catch (err) {
      toast.error('Failed to update question progress');
    }
  };

  // Instant in-memory filtering as user types or toggles pills
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (selectedDomain !== 'All' && q.domain !== selectedDomain) return false;
      if (selectedTech !== 'All' && q.technology !== selectedTech) return false;
      if (selectedDifficulty !== 'All' && q.difficulty !== selectedDifficulty) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchQ = (q.question || '').toLowerCase().includes(term);
        const matchTopic = (q.topic || '').toLowerCase().includes(term);
        const matchTech = (q.technology || '').toLowerCase().includes(term);
        const matchAns = (q.answer || '').toLowerCase().includes(term);
        if (!matchQ && !matchTopic && !matchTech && !matchAns) return false;
      }
      return true;
    });
  }, [questions, selectedDomain, selectedTech, selectedDifficulty, searchTerm]);

  const defaultTechFilters = ['All', 'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'SQL', 'REST APIs', 'Git', 'Docker', 'TypeScript', 'Testing'];
  const allTechPills = useMemo(() => {
    const set = new Set(defaultTechFilters);
    availableTechs.forEach(t => set.add(t));
    return Array.from(set);
  }, [availableTechs]);

  const domainTabs = ['All', 'Frontend', 'Backend', 'Database', 'DevOps & Tools', 'Quality Assurance'];

  if (loading && questions.length === 0) {
    return <LoadingSpinner message="Loading technical interview question bank..." />;
  }

  const currentPracticeQuestion = filteredQuestions[practiceIndex] || filteredQuestions[0] || null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Technical Interview Readiness
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            {targetJobTitle ? `Interview Prep: ${targetJobTitle}` : 'Interview Question Bank & Simulator'}
          </h1>
          <p className="text-sm text-zinc-600">
            Master core conceptual and architectural questions asked by tech employers. Practice concise explanations, review key points, and track your mastered concepts.
          </p>
        </div>

        {/* Mastery Progress Card */}
        <div className="bg-[#FAF9F6] border border-zinc-200 rounded-2xl p-5 shrink-0 flex flex-col justify-between min-w-[240px] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Mastery Status</span>
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
              {stats.masteryPercentage}% Ready
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-2xl font-black text-zinc-900">{stats.masteredCount}</span>
              <span className="text-xs text-zinc-500 font-bold">of {stats.totalQuestions} Mastered</span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.masteryPercentage}%` }}
              />
            </div>
          </div>

          {filteredQuestions.length > 0 && (
            <button
              onClick={() => {
                setPracticeIndex(0);
                setPracticeShowAnswer(false);
                setPracticeModeOpen(true);
              }}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Practice Mode ({filteredQuestions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-zinc-200/80 pb-3 overflow-x-auto no-scrollbar">
        {domainTabs.map(domain => (
          <button
            key={domain}
            onClick={() => {
              setSelectedDomain(domain);
              setSelectedTech('All');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedDomain === domain
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            {domain === 'All' ? 'All Engineering Domains' : `${domain} Engineering`}
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Technology Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
          {allTechPills.map(tech => (
            <button
              key={tech}
              onClick={() => setSelectedTech(tech)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
                selectedTech.toLowerCase() === tech.toLowerCase()
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {tech}
            </button>
          ))}
        </div>

        {/* Search & Difficulty Filter */}
        <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search (e.g. HTML, closures)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-zinc-800"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(selectedTech !== 'All' || selectedDomain !== 'All' || selectedDifficulty !== 'All' || searchTerm) && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-zinc-400 font-semibold">Active filters:</span>
          {selectedDomain !== 'All' && (
            <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded-lg font-bold">
              Domain: {selectedDomain}
              <button onClick={() => setSelectedDomain('All')} className="hover:text-rose-600"><X className="w-3 h-3" /></button>
            </span>
          )}
          {selectedTech !== 'All' && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-bold">
              Tech: {selectedTech}
              <button onClick={() => setSelectedTech('All')} className="hover:text-rose-600"><X className="w-3 h-3" /></button>
            </span>
          )}
          {selectedDifficulty !== 'All' && (
            <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded-lg font-bold">
              Level: {selectedDifficulty}
              <button onClick={() => setSelectedDifficulty('All')} className="hover:text-rose-600"><X className="w-3 h-3" /></button>
            </span>
          )}
          {searchTerm && (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg font-bold">
              Query: "{searchTerm}"
              <button onClick={() => setSearchTerm('')} className="hover:text-rose-600"><X className="w-3 h-3" /></button>
            </span>
          )}
          <button
            onClick={() => {
              setSelectedDomain('All');
              setSelectedTech('All');
              setSelectedDifficulty('All');
              setSearchTerm('');
            }}
            className="text-indigo-600 font-bold hover:underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-4">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q, idx) => {
            const isExpanded = expandedMap[q._id];
            return (
              <div
                key={q._id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  q.isMastered
                    ? 'border-emerald-200/90 shadow-xs'
                    : isExpanded
                    ? 'border-zinc-300 shadow-sm'
                    : 'border-zinc-200/80 hover:border-zinc-300'
                }`}
              >
                {/* Question Header Row */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                        {q.technology}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400">
                        {q.topic}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        q.difficulty === 'Advanced'
                          ? 'bg-rose-50 text-rose-700'
                          : q.difficulty === 'Intermediate'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {q.difficulty}
                      </span>

                      {/* Company Tags */}
                      {q.companyTags && q.companyTags.map(tag => (
                        <span key={tag} className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Building className="w-2.5 h-2.5 text-zinc-400" /> {tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 leading-snug">
                      {idx + 1}. {q.question}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleToggleMastered(q._id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                        q.isMastered
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                      }`}
                      title={q.isMastered ? 'Mastered concept' : 'Mark as mastered'}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${q.isMastered ? 'text-emerald-600 fill-emerald-100' : 'text-zinc-400'}`} />
                      <span>{q.isMastered ? 'Mastered' : 'Mark Mastered'}</span>
                    </button>

                    <button
                      onClick={() => toggleExpand(q._id)}
                      className="p-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
                      title={isExpanded ? 'Collapse' : 'Show full answer'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Answer Drawer */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-zinc-100 space-y-4 bg-[#FAF9F6]/60 animate-in fade-in duration-150">
                    
                    {/* Key Evaluation Points */}
                    {q.keyPoints && q.keyPoints.length > 0 && (
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                          Key Evaluation Takeaways:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-xs text-amber-950 font-medium">
                          {q.keyPoints.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Detailed Technical Answer */}
                    <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line space-y-2">
                      <p className="font-semibold text-zinc-800">{q.answer}</p>
                    </div>

                    {/* Code Snippet */}
                    {q.codeSnippet && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <Code2 className="w-3.5 h-3.5" /> Implementation Reference:
                        </div>
                        <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-zinc-800">
                          <code>{q.codeSnippet}</code>
                        </pre>
                      </div>
                    )}

                    {/* Quick Assessment CTA */}
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Want to verify this topic?</span>
                      <Link
                        to="/assessments"
                        className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Award className="w-3.5 h-3.5" /> Take Skill Assessment &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200/80 space-y-3 text-zinc-500">
            <HelpCircle className="w-10 h-10 mx-auto text-zinc-300" />
            <p className="text-sm font-semibold">No interview questions match your filter criteria.</p>
            <button
              onClick={() => {
                setSelectedDomain('All');
                setSelectedTech('All');
                setSelectedDifficulty('All');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Interactive Practice Mode Modal */}
      {practiceModeOpen && currentPracticeQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Question {practiceIndex + 1} of {filteredQuestions.length}
                </span>
                <span className="text-xs font-bold text-zinc-500">{currentPracticeQuestion.technology}</span>
              </div>
              <button
                onClick={() => setPracticeModeOpen(false)}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200 cursor-pointer"
              >
                Close Simulator
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  {currentPracticeQuestion.topic} • {currentPracticeQuestion.difficulty}
                </p>
                <h2 className="text-lg font-extrabold text-zinc-900 leading-snug">
                  {currentPracticeQuestion.question}
                </h2>
              </div>

              {!practiceShowAnswer ? (
                <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl p-8 text-center space-y-3">
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    Formulate your answer out loud or in writing as you would in a real technical interview screen.
                  </p>
                  <button
                    onClick={() => setPracticeShowAnswer(true)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Reveal Solution & Code
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {currentPracticeQuestion.keyPoints && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
                      <p className="text-[11px] font-bold text-amber-900 uppercase">Key Interview Evaluation Criteria:</p>
                      <ul className="list-disc list-inside text-xs text-amber-950 font-medium">
                        {currentPracticeQuestion.keyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
                    {currentPracticeQuestion.answer}
                  </div>

                  {currentPracticeQuestion.codeSnippet && (
                    <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                      <code>{currentPracticeQuestion.codeSnippet}</code>
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <button
                disabled={practiceIndex === 0}
                onClick={() => {
                  setPracticeIndex(prev => prev - 1);
                  setPracticeShowAnswer(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Previous
              </button>

              <button
                onClick={() => handleToggleMastered(currentPracticeQuestion._id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentPracticeQuestion.isMastered
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{currentPracticeQuestion.isMastered ? 'Mastered' : 'Mark as Mastered'}</span>
              </button>

              <button
                disabled={practiceIndex >= filteredQuestions.length - 1}
                onClick={() => {
                  setPracticeIndex(prev => prev + 1);
                  setPracticeShowAnswer(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next Question
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default InterviewPrep;
